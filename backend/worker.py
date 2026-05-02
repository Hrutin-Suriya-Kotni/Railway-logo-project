from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List

from pdf2image import convert_from_path

from utils.filesystem import ensure_dir
from utils.job_store import JobStore
from utils.yolo import run_inference

logger = logging.getLogger(__name__)


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

        for index, image in enumerate(images, start=1):
            detections = await asyncio.to_thread(run_inference, image, index)
            results.append({"page": index, "detections": detections})
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
