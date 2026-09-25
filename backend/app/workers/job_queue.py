"""
In-process async job queue (MVP).

Uses asyncio.Queue + background task workers.
Designed so the queue abstraction can be replaced with Redis+Celery/RQ later
by swapping the JobQueue implementation behind the same interface.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine, Optional

logger = logging.getLogger(__name__)


@dataclass
class Job:
    job_id: str
    coroutine_factory: Callable[[], Coroutine[Any, Any, None]]
    status: str = "QUEUED"
    error: Optional[str] = None


class JobQueue:
    """Single-worker async job queue backed by asyncio.Queue."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue[Job] = asyncio.Queue()
        self._jobs: dict[str, Job] = {}
        self._worker_task: Optional[asyncio.Task] = None

    def start(self) -> None:
        """Start the background worker (call once from app lifespan)."""
        self._worker_task = asyncio.create_task(self._worker())
        logger.info("Job queue worker started.")

    async def stop(self) -> None:
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass

    async def enqueue(self, job: Job) -> None:
        self._jobs[job.job_id] = job
        await self._queue.put(job)
        logger.info("Enqueued job %s", job.job_id)

    def get_job(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    async def _worker(self) -> None:
        while True:
            job = await self._queue.get()
            job.status = "RUNNING"
            logger.info("Running job %s", job.job_id)
            try:
                await job.coroutine_factory()
                job.status = "DONE"
            except Exception as exc:
                job.status = "FAILED"
                job.error = str(exc)
                logger.error("Job %s failed: %s", job.job_id, exc)
            finally:
                self._queue.task_done()


# Module-level singleton
job_queue = JobQueue()
