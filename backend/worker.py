import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List

from PIL import ImageDraw, ImageFont, Image
import fitz  # PyMuPDF

# Allow processing of large images (for 300 DPI support)
Image.MAX_IMAGE_PIXELS = None

from utils.filesystem import ensure_dir
from utils.job_store import JobStore
from utils.yolo import run_inference

logger = logging.getLogger(__name__)

def draw_detections(image, detections):
    """Draw bounding boxes and labels on the image with high visibility."""
    draw_img = image.copy()
    draw = ImageDraw.Draw(draw_img)
    width, height = draw_img.size
    
    # Try to load a bold font, fallback to default
    try:
        # On macOS, Arial is usually in this path
        font = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", 42)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 42)
        except:
            font = ImageFont.load_default()
    
    for det in detections:
        bbox = det["bbox"]
        # Convert normalized to pixel coordinates
        x1 = bbox["x"] * width
        y1 = bbox["y"] * height
        w = bbox["width"] * width
        h = bbox["height"] * height
        x2, y2 = x1 + w, y1 + h
        
        # Draw thick box for high-res images (8px thickness)
        draw.rectangle([x1, y1, x2, y2], outline="#ef4444", width=8)
        
        # Labels and confidence scores are hidden as per user request
        # label_text = f"{det['label']} {det['confidence']:.2f} ({int(x1)},{int(y1)})"
        # text_y = y1 - 50 if y1 > 60 else y1 + 10
        # if hasattr(draw, "textbbox"):
        #     l, t, r, b = draw.textbbox((x1, text_y), label_text, font=font)
        #     draw.rectangle([l-10, t-5, r+10, b+5], fill="#ef4444")
        # draw.text((x1, text_y), label_text, fill="white", font=font)
        
    return draw_img


async def process_job(
    job_id: str,
    pdf_path: Path,
    results_dir: Path,
    job_store: JobStore,
) -> None:
    """Process a single PDF job asynchronously using the Single-Source High-Res strategy."""
    try:
        # 1. Open document with PyMuPDF for artifact-free rendering
        doc = await asyncio.to_thread(fitz.open, str(pdf_path))
        total_pages_original = len(doc)
        results: List[Dict[str, object]] = []
        
        # We only process the first page as per current requirement
        # To match the Matrix(2.0, 2.0) logic from local script
        matrix = fitz.Matrix(2.0, 2.0)
        
        page = doc.load_page(0)
        pix = await asyncio.to_thread(page.get_pixmap, matrix=matrix, alpha=False)
        img_high = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        doc.close()

        job_image_dir = results_dir.parent / "images" / job_id
        ensure_dir(job_image_dir)

        index = 1
        image_filename = f"page_{index}.jpg"
        detected_filename = f"page_{index}_detected.jpg"
        image_path = job_image_dir / image_filename
        detected_path = job_image_dir / detected_filename
        
        # 0. Auto-rotate to landscape (horizontal) if the page is in portrait
        w, h = img_high.size
        if h > w:
            logger.info(f"Auto-rotating page {index} to horizontal orientation...")
            img_high = await asyncio.to_thread(img_high.rotate, 90, expand=True)

        # Save the 2.0x scaled high-fidelity image
        await asyncio.to_thread(img_high.save, str(image_path), "JPEG", quality=90)

        # 3. Run inference directly on the 2.0x scaled image (no resizing)
        detections = await asyncio.to_thread(run_inference, img_high, index)
            
        # 4. Draw detections
        detected_image = await asyncio.to_thread(draw_detections, img_high, detections)
        await asyncio.to_thread(detected_image.save, str(detected_path), "JPEG", quality=95)

        results.append({
            "page": index,
            "image_url": f"/storage/images/{job_id}/{image_filename}",
            "detected_image_url": f"/storage/images/{job_id}/{detected_filename}",
            "detections": detections
        })
        progress = 100
        await job_store.update_job(
            job_id,
            status="processing",
            progress=progress,
        )

        payload: Dict[str, object] = {
            "job_id": job_id,
            "status": "done",
            "pages": results,
            "total_pages_original": total_pages_original,
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
