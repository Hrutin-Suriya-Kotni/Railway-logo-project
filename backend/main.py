from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from utils.filesystem import ensure_dir
from utils.job_store import JobStore
from worker import process_job

logging.basicConfig(level=logging.INFO)

BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
RESULTS_DIR = STORAGE_DIR / "results"
IMAGES_DIR = STORAGE_DIR / "images"

ensure_dir(UPLOAD_DIR)
ensure_dir(RESULTS_DIR)
ensure_dir(IMAGES_DIR)

app = FastAPI(title="Async PDF Processor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

job_store = JobStore()


async def save_upload(file: UploadFile, destination: Path) -> None:
    ensure_dir(destination.parent)
    with destination.open("wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)
    await file.close()


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    job_id = uuid.uuid4().hex
    await job_store.create_job(job_id)

    pdf_path = UPLOAD_DIR / f"{job_id}.pdf"
    await save_upload(file, pdf_path)

    # Run processing in the background without blocking the request.
    asyncio.create_task(process_job(job_id, pdf_path, RESULTS_DIR, job_store))

    return {"job_id": job_id}


@app.websocket("/ws/{job_id}")
async def websocket_job(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    job = await job_store.get_job(job_id)
    if not job:
        await websocket.send_json({"error": "Unknown job_id"})
        await websocket.close(code=1008)
        return

    await job_store.register(job_id, websocket)
    await job_store.send_snapshot(job_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await job_store.unregister(job_id, websocket)
