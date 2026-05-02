from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List

from PIL import ImageDraw
from pdf2image import convert_from_path

from utils.filesystem import ensure_dir
from utils.job_store import JobStore
from utils.yolo import run_inference

logger = logging.getLogger(__name__)


def draw_detections(image, detections):
    """Draw bounding boxes and labels on the image."""
    draw_img = image.copy()
    draw = ImageDraw.Draw(draw_img)
    width, height = draw_img.size
    
    for det in detections:
        bbox = det["bbox"]
        # Convert normalized to pixel coordinates
        x1 = bbox["x"] * width
        y1 = bbox["y"] * height
        w = bbox["width"] * width
        h = bbox["height"] * height
        x2, y2 = x1 + w, y1 + h
        
        # Draw box
        draw.rectangle([x1, y1, x2, y2], outline="red", width=5)
        # Draw label (simple text)
        label_text = f"{det['label']} {det['confidence']:.2f}"
        draw.text((x1 + 5, y1 + 5), label_text, fill="red")
        
    return draw_img


async def process_job(
    job_id: str,
    pdf_path: Path,
    results_dir: Path,
    job_store: JobStore,
) -> None:
    """Process a single PDF job asynchronously."""
    try:
        images = await asyncio.to_thread(convert_from_path, str(pdf_path))
        total_pages = max(len(images), 1)
        results: List[Dict[str, object]] = []

        job_image_dir = results_dir.parent / "images" / job_id
        ensure_dir(job_image_dir)

        for index, image in enumerate(images, start=1):
            image_filename = f"page_{index}.jpg"
            detected_filename = f"page_{index}_detected.jpg"
            image_path = job_image_dir / image_filename
            detected_path = job_image_dir / detected_filename
            
            await asyncio.to_thread(image.save, str(image_path), "JPEG")

            detections = await asyncio.to_thread(run_inference, image, index)
            
            # Create and save image with boxes
            detected_image = await asyncio.to_thread(draw_detections, image, detections)
            await asyncio.to_thread(detected_image.save, str(detected_path), "JPEG")

            results.append({
                "page": index,
                "image_url": f"/storage/images/{job_id}/{image_filename}",
                "detected_image_url": f"/storage/images/{job_id}/{detected_filename}",
                "detections": detections
            })
            progress = int(index / total_pages * 100)
            await job_store.update_job(
                job_id,
                status="processing",
                progress=progress,
            )

        payload: Dict[str, object] = {
            "job_id": job_id,
            "status": "done",
            "pages": results,
        }
    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        payload = {
            "job_id": job_id,
            "status": "failed",
            "error": str(exc),
            "pages": [],
        }

    ensure_dir(results_dir)
    result_path = results_dir / f"{job_id}.json"
    await asyncio.to_thread(
        result_path.write_text, json.dumps(payload, indent=2, ensure_ascii=True)
    )
    await job_store.update_job(
        job_id,
        status="done",
        progress=100,
        result_path=str(result_path),
    )
