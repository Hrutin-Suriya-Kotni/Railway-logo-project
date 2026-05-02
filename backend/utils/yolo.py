from __future__ import annotations

import logging
import os
import random
import shutil
import threading
from pathlib import Path
from typing import Dict, List, Optional

from utils.filesystem import ensure_dir

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional dependency
    YOLO = None

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parents[1] / "model"
MODEL_PATH = MODEL_DIR / "best.pt"
DEFAULT_SOURCE = Path(
    os.environ.get("YOLO_MODEL_SOURCE", "/home/cohesity/workspace/main/Preferences/best.pt")
)
USE_MOCK_YOLO = os.environ.get("USE_MOCK_YOLO", "false").lower() in {
    "1",
    "true",
    "yes",
}

_MODEL: Optional[object] = None
_MODEL_LOCK = threading.Lock()


def ensure_model_file() -> Path:
    """Copy the tuned model into the backend model directory."""
    ensure_dir(MODEL_DIR)
    if MODEL_PATH.exists():
        return MODEL_PATH
    if not DEFAULT_SOURCE.exists():
        raise FileNotFoundError(
            "YOLO model not found at "
            f"{DEFAULT_SOURCE}. Set YOLO_MODEL_SOURCE to override."
        )
    shutil.copy2(DEFAULT_SOURCE, MODEL_PATH)
    return MODEL_PATH


def get_model() -> Optional[object]:
    if USE_MOCK_YOLO:
        return None
    if YOLO is None:
        logger.warning("Ultralytics not installed; using mock YOLO results.")
        return None
    global _MODEL
    with _MODEL_LOCK:
        if _MODEL is None:
            model_path = ensure_model_file()
            _MODEL = YOLO(str(model_path))
    return _MODEL


def mock_yolo_inference(image: object, page_index: int) -> List[Dict[str, object]]:
    """Return deterministic fake detections for a page."""
    rng = random.Random(page_index)
    detections: List[Dict[str, object]] = []
    for idx in range(rng.randint(1, 3)):
        detections.append(
            {
                "label": f"object_{idx + 1}",
                "confidence": round(rng.uniform(0.55, 0.95), 2),
                "bbox": {
                    "x": round(rng.uniform(0.05, 0.7), 2),
                    "y": round(rng.uniform(0.05, 0.7), 2),
                    "width": round(rng.uniform(0.1, 0.4), 2),
                    "height": round(rng.uniform(0.1, 0.4), 2),
                },
            }
        )
    return detections


def _label_for(names: object, cls_id: int) -> str:
    if isinstance(names, dict):
        return str(names.get(cls_id, cls_id))
    if isinstance(names, list) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


def run_inference(image: object, page_index: int) -> List[Dict[str, object]]:
    """Run YOLO inference or fallback to the mock detector."""
    model = get_model()
    if model is None:
        return mock_yolo_inference(image, page_index)

    detections: List[Dict[str, object]] = []
    results = model.predict(image, verbose=False)
    for result in results:
        if not hasattr(result, "boxes") or result.boxes is None:
            continue
        if getattr(result, "orig_shape", None):
            height, width = result.orig_shape
        else:
            height, width = 0, 0
        for box in result.boxes:
            cls_id = int(box.cls[0]) if hasattr(box, "cls") else 0
            confidence = float(box.conf[0]) if hasattr(box, "conf") else 0.0
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            if width and height:
                bbox = {
                    "x": round(x1 / width, 4),
                    "y": round(y1 / height, 4),
                    "width": round((x2 - x1) / width, 4),
                    "height": round((y2 - y1) / height, 4),
                }
            else:
                bbox = {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}
            detections.append(
                {
                    "label": _label_for(result.names, cls_id),
                    "confidence": round(confidence, 3),
                    "bbox": bbox,
                }
            )
    return detections
