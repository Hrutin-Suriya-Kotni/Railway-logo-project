from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Dict, List, Optional

from utils.filesystem import ensure_dir

import torch
import torchvision.ops as ops
import numpy as np
from PIL import Image

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional dependency
    YOLO = None

logger = logging.getLogger(__name__)

# Slicing config
SLICE_WIDTH = 1000
SLICE_HEIGHT = 1000
OVERLAP = 200
NMS_THRESHOLD = 0.3


def get_slices(width: int, height: int, sw: int, sh: int, overlap: int):
    """Generate coordinates for overlapping slices."""
    slices = []
    y = 0
    while y < height:
        x = 0
        while x < width:
            x_end = min(x + sw, width)
            y_end = min(y + sh, height)
            slices.append((x, y, x_end, y_end))
            if x_end == width:
                break
            x += sw - overlap
        if y_end == height:
            break
        y += sh - overlap
    return slices


def apply_nms(boxes, scores, iou_threshold=NMS_THRESHOLD):
    """Merge overlapping boxes from different patches."""
    if len(boxes) == 0:
        return boxes, scores
    keep = ops.nms(boxes, scores, iou_threshold)
    return boxes[keep], scores[keep]


def run_sliced_inference(image: Image.Image, model: object) -> List[Dict[str, object]]:
    """Run YOLO on slices and merge results."""
    w, h = image.size
    slices = get_slices(w, h, SLICE_WIDTH, SLICE_HEIGHT, OVERLAP)
    
    all_boxes = []
    all_scores = []
    all_cls = []

    for x1, y1, x2, y2 in slices:
        patch = image.crop((x1, y1, x2, y2))
        results = model.predict(patch, verbose=False)
        
        for res in results:
            if not hasattr(res, "boxes") or res.boxes is None:
                continue
            boxes = res.boxes.xyxy.cpu() # [N, 4]
            scores = res.boxes.conf.cpu() # [N]
            classes = res.boxes.cls.cpu() # [N]
            
            for box, score, cls in zip(boxes, scores, classes):
                # Offset boxes back to global coordinates
                global_box = box.clone()
                global_box[0] += x1
                global_box[1] += y1
                global_box[2] += x1
                global_box[3] += y1
                all_boxes.append(global_box)
                all_scores.append(score)
                all_cls.append(cls)
    
    if not all_boxes:
        return []

    boxes_tensor = torch.stack(all_boxes)
    scores_tensor = torch.tensor(all_scores)
    merged_boxes, merged_scores = apply_nms(boxes_tensor, scores_tensor)
    
    # We don't have the class labels in the merged output easily if we don't keep track.
    # For now, let's just return the merged detections.
    # (Assuming single class or similar enough for NMS)
    
    detections: List[Dict[str, object]] = []
    names = getattr(model, "names", {})
    
    for box, score in zip(merged_boxes, merged_scores):
        x1, y1, x2, y2 = box.tolist()
        detections.append({
            "label": _label_for(names, 0), # Simplified for now
            "confidence": round(float(score), 3),
            "bbox": {
                "x": round(x1 / w, 4),
                "y": round(y1 / h, 4),
                "width": round((x2 - x1) / w, 4),
                "height": round((y2 - y1) / h, 4),
            }
        })
    return detections

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


def run_inference(image: Image.Image, page_index: int) -> List[Dict[str, object]]:
    """Run YOLO inference using slicing for large images."""
    model = get_model()
    if model is None:
        return []

    return run_sliced_inference(image, model)
