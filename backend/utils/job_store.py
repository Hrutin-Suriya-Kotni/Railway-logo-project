from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional, Set

try:
    from fastapi import WebSocket
except ImportError:  # pragma: no cover - optional type support
    WebSocket = Any

logger = logging.getLogger(__name__)
_UNSET = object()


@dataclass
class JobInfo:
    job_id: str
    status: str
    progress: int
    result_path: Optional[str] = None

    def to_dict(self) -> Dict[str, object]:
        payload = {
            "job_id": self.job_id,
            "status": self.status,
            "progress": self.progress,
            "result_path": self.result_path,
        }
        if self.status == "done":
            payload["event"] = "completed"
        else:
            payload["event"] = "progress"
        return payload


class JobStore:
    """In-memory job state and websocket registry."""

    def __init__(self) -> None:
        self._jobs: Dict[str, JobInfo] = {}
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, job_id: str) -> JobInfo:
        job = JobInfo(job_id=job_id, status="processing", progress=0)
        async with self._lock:
            self._jobs[job_id] = job
            self._connections.setdefault(job_id, set())
        return job

    async def get_job(self, job_id: str) -> Optional[JobInfo]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def update_job(
        self,
        job_id: str,
        *,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        result_path: object = _UNSET,
    ) -> Optional[JobInfo]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            if status is not None:
                job.status = status
            if progress is not None:
                job.progress = progress
            if result_path is not _UNSET:
                job.result_path = result_path  # type: ignore[assignment]
            connections = list(self._connections.get(job_id, set()))
            snapshot = job.to_dict()
        await self._broadcast(connections, snapshot)
        return job

    async def register(self, job_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.setdefault(job_id, set()).add(websocket)

    async def unregister(self, job_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(job_id)
            if connections and websocket in connections:
                connections.remove(websocket)

    async def send_snapshot(self, job_id: str, websocket: WebSocket) -> None:
        job = await self.get_job(job_id)
        if job:
            await websocket.send_json(job.to_dict())

    async def _broadcast(
        self, connections: list[WebSocket], payload: Dict[str, object]
    ) -> None:
        if not connections:
            return
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                logger.exception("Failed to send websocket update")
