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
from PIL import Image, ImageOps

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional dependency
    YOLO = None

logger = logging.getLogger(__name__)

# Configuration matching refined logic
SLICE_WIDTH = 1000
SLICE_HEIGHT = 1000
OVERLAP = 200
CONF_THRESHOLD = 0.25
NMS_THRESHOLD = 0.3

def preprocess_image(image: Image.Image) -> Image.Image:
    """Converts image to Black and White (Grayscale) for consistency matching refined logic."""
    bw_image = ImageOps.grayscale(image)
    return bw_image.convert("RGB")


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
    # boxes should be [N, 4] tensor, scores [N] tensor
    keep = ops.nms(boxes, scores, iou_threshold)
    return boxes[keep], scores[keep]


def get_device() -> str:
    """Detect available hardware acceleration (CUDA, MPS, or CPU)."""
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

def run_sliced_inference(image: Image.Image, model: object) -> List[Dict[str, object]]:
    """Run YOLO on slices and merge results exactly like yolo_refined_slicing_logic.py."""
    # 1. Apply B&W preprocessing before slicing
    image_bw = preprocess_image(image)
    
    w, h = image.size
    slices = get_slices(w, h, SLICE_WIDTH, SLICE_HEIGHT, OVERLAP)
    
    all_boxes = []
    all_scores = []

    for x1, y1, x2, y2 in slices:
        patch = image_bw.crop((x1, y1, x2, y2))
        # Run YOLO prediction with identical parameters to local script
        results = model.predict(patch, conf=CONF_THRESHOLD, verbose=False)
        
        for res in results:
            if not hasattr(res, "boxes") or res.boxes is None:
                continue
            boxes = res.boxes.xyxy.cpu()
            scores = res.boxes.conf.cpu()
            
            for box, score in zip(boxes, scores):
                # Offset boxes back to global coordinates
                global_box = box.clone()
                global_box[0] += x1
                global_box[1] += y1
                global_box[2] += x1
                global_box[3] += y1
                all_boxes.append(global_box)
                all_scores.append(score)
    
    if not all_boxes:
        return []

    boxes_tensor = torch.stack(all_boxes)
    scores_tensor = torch.tensor(all_scores)
    
    # Run NMS exactly like the local script
    merged_boxes, merged_scores = apply_nms(boxes_tensor, scores_tensor)
    
    detections: List[Dict[str, object]] = []
    # Local script labels everything as "RCC_logo"
    
    for box, score in zip(merged_boxes, merged_scores):
        x1, y1, x2, y2 = box.tolist()
        detections.append({
            "label": "RCC_logo",
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
            device = get_device()
            logger.info(f"Loading YOLO model on {device}...")
            _MODEL = YOLO(str(MODEL_PATH)).to(device)
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
