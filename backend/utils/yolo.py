from __future__ import annotations

import logging
import os
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

_MODEL: Optional[object] = None
_MODEL_LOCK = threading.Lock()


def get_model() -> Optional[object]:
    if YOLO is None:
        logger.error("Ultralytics not installed. Please install it with 'pip install ultralytics'.")
        return None
    
    global _MODEL
    with _MODEL_LOCK:
        if _MODEL is None:
            if not MODEL_PATH.exists():
                logger.error(f"Model file not found at {MODEL_PATH}")
                return None
            _MODEL = YOLO(str(MODEL_PATH))
    return _MODEL


def _label_for(names: object, cls_id: int) -> str:
    if isinstance(names, dict):
        return str(names.get(cls_id, cls_id))
    if isinstance(names, list) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


def run_inference(image: object, page_index: int) -> List[Dict[str, object]]:
    """Run YOLO inference."""
    model = get_model()
    if model is None:
        return []

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
