import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List

from PIL import ImageDraw, ImageFont, Image
from pdf2image import convert_from_path

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
        
        # Draw label background
        # Include coordinates in the label as requested
        label_text = f"{det['label']} {det['confidence']:.2f} ({int(x1)},{int(y1)})"
        
        # Determine label position (put inside box if too close to top)
        text_y = y1 - 50 if y1 > 60 else y1 + 10
        
        if hasattr(draw, "textbbox"):
            l, t, r, b = draw.textbbox((x1, text_y), label_text, font=font)
            # Add some padding to background
            draw.rectangle([l-10, t-5, r+10, b+5], fill="#ef4444")
        
        draw.text((x1, text_y), label_text, fill="white", font=font)
        
    return draw_img


async def process_job(
    job_id: str,
    pdf_path: Path,
    results_dir: Path,
    job_store: JobStore,
) -> None:
    """Process a single PDF job asynchronously using the Single-Source High-Res strategy."""
    try:
        # 1. Convert at High DPI once (for sharp downloads and UI)
        images = await asyncio.to_thread(convert_from_path, str(pdf_path), dpi=300)
        total_pages_original = len(images)
        
        # Only process the first page as per VC-568
        images_to_process = images[:1]
        total_to_process = len(images_to_process)
        results: List[Dict[str, object]] = []

        job_image_dir = results_dir.parent / "images" / job_id
        ensure_dir(job_image_dir)

        for index, img_high in enumerate(images_to_process, start=1):
            image_filename = f"page_{index}.jpg"
            detected_filename = f"page_{index}_detected.jpg"
            image_path = job_image_dir / image_filename
            detected_path = job_image_dir / detected_filename
            
            # 0. Auto-rotate to landscape (horizontal) if the page is in portrait
            w, h = img_high.size
            if h > w:
                logger.info(f"Auto-rotating page {index} to horizontal orientation...")
                img_high = await asyncio.to_thread(img_high.rotate, 90, expand=True)

            # Save the high-res image
            await asyncio.to_thread(img_high.save, str(image_path), "JPEG", quality=95)

            # 2. Create a low-res version for YOLO to avoid hallucinations
            # Resizing to 1/3 size (effectively 100 DPI) while keeping aspect ratio perfect
            w, h = img_high.size
            img_low = await asyncio.to_thread(img_high.resize, (w // 3, h // 3), Image.LANCZOS)

            # 3. Run inference on the low-res thumbnail
            detections = await asyncio.to_thread(run_inference, img_low, index)
            
            # 4. Draw detections on the high-res image
            # Normalized coordinates (0.0 - 1.0) work perfectly across both sizes
            detected_image = await asyncio.to_thread(draw_detections, img_high, detections)
            await asyncio.to_thread(detected_image.save, str(detected_path), "JPEG", quality=95)

            results.append({
                "page": index,
                "image_url": f"/storage/images/{job_id}/{image_filename}",
                "detected_image_url": f"/storage/images/{job_id}/{detected_filename}",
                "detections": detections
            })
            progress = int(index / total_to_process * 100)
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
