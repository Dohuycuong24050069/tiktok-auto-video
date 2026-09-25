"""Projects API router."""
import logging
import uuid
from pathlib import Path
from typing import List

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    CaptionUpdate,
    JobResponse,
    ProjectCreate,
    ProjectResponse,
)
from app.models.project import Project, ProjectStatus
from app.services.database import get_db
from app.services.project_repository import ProjectRepository
from app.services.storage import (
    MAX_UPLOAD_BYTES,
    unique_upload_path,
)
from app.services.video_service import process_video, validate_source_url
from app.workers.job_queue import Job, job_queue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["projects"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# ── Helpers ─────────────────────────────────────────────────
async def _save_upload(file: UploadFile) -> str:
    """Validate and save an uploaded image. Returns absolute path."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "File type not allowed. Use JPEG/PNG/WebP.")
    dest = unique_upload_path(file.filename or "image.jpg")
    size = 0
    async with aiofiles.open(dest, "wb") as out:
        while chunk := await file.read(65536):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "File size exceeds limit (20 MB).")
            await out.write(chunk)
    return str(dest)


def _project_response(p: Project) -> ProjectResponse:
    return ProjectResponse.from_orm_project(p)


# ── Routes ──────────────────────────────────────────────────
@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    source_url: str = Form(...),
    start_time: float = Form(0.0),
    duration: float = Form(30.0),
    preset: str = Form("short_30s"),
    audio_mode: str = Form("source"),
    title: str = Form(""),
    hashtags: str = Form(""),
    image1_start: float = Form(0.0),
    image1_end: float = Form(3.0),
    image1_position: str = Form("top-center"),
    image1_size: float = Form(0.3),
    image1_opacity: float = Form(1.0),
    image2_start: float = Form(27.0),
    image2_end: float = Form(30.0),
    image2_position: str = Form("bottom-center"),
    image2_size: float = Form(0.3),
    image2_opacity: float = Form(1.0),
    image1: UploadFile = File(None),
    image2: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
):
    if not validate_source_url(source_url):
        raise HTTPException(400, "URL không hợp lệ.")
    if not (5 <= duration <= 180):
        raise HTTPException(400, "Duration phải từ 5 đến 180 giây.")

    img1_path, img2_path = None, None
    if image1 and image1.filename:
        img1_path = await _save_upload(image1)
    if image2 and image2.filename:
        img2_path = await _save_upload(image2)

    project = Project(
        source_url=source_url,
        start_time=start_time,
        duration=duration,
        preset=preset,
        image1_path=img1_path,
        image1_start=image1_start,
        image1_end=image1_end,
        image1_position=image1_position,
        image1_size=image1_size,
        image1_opacity=image1_opacity,
        image2_path=img2_path,
        image2_start=image2_start,
        image2_end=image2_end,
        image2_position=image2_position,
        image2_size=image2_size,
        image2_opacity=image2_opacity,
        audio_mode=audio_mode,
        title=title,
        hashtags=hashtags,
        status=ProjectStatus.PENDING,
    )
    repo = ProjectRepository(db)
    project = await repo.create(project)
    return _project_response(project)


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    repo = ProjectRepository(db)
    projects = await repo.list_all()
    return [_project_response(p) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(404, "Project not found.")
    return _project_response(project)


@router.post("/projects/{project_id}/render", response_model=JobResponse)
async def render_project(project_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(404, "Project not found.")
    if project.status == ProjectStatus.PROCESSING:
        raise HTTPException(409, "Project is already being processed.")

    job_id = uuid.uuid4().hex

    # Capture values for async closure
    _id = project.id
    _url = project.source_url
    _start = project.start_time
    _dur = project.duration
    _i1 = project.image1_path
    _i2 = project.image2_path
    _i1s, _i1e, _i1pos, _i1sz, _i1op = (
        project.image1_start, project.image1_end,
        project.image1_position, project.image1_size, project.image1_opacity,
    )
    _i2s, _i2e, _i2pos, _i2sz, _i2op = (
        project.image2_start, project.image2_end,
        project.image2_position, project.image2_size, project.image2_opacity,
    )

    async def _run_job() -> None:
        from app.services.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            repo_inner = ProjectRepository(session)
            await repo_inner.update_status(_id, ProjectStatus.DOWNLOADING, 0.0, "DOWNLOADING")

        async def _progress(stage: str, pct: float) -> None:
            async with AsyncSessionLocal() as session:
                r = ProjectRepository(session)
                status_map = {
                    "DOWNLOADING": ProjectStatus.DOWNLOADING,
                    "PROCESSING": ProjectStatus.PROCESSING,
                    "RENDERING": ProjectStatus.PROCESSING,
                    "DONE": ProjectStatus.READY,
                }
                st = status_map.get(stage, ProjectStatus.PROCESSING)
                await r.update_status(_id, st, pct, stage)

        try:
            out_path, thumb_path = await process_video(
                project_id=_id,
                source_url=_url,
                start_time=_start,
                duration=_dur,
                image1_path=_i1,
                image2_path=_i2,
                image1_start=_i1s, image1_end=_i1e,
                image1_position=_i1pos, image1_size=_i1sz, image1_opacity=_i1op,
                image2_start=_i2s, image2_end=_i2e,
                image2_position=_i2pos, image2_size=_i2sz, image2_opacity=_i2op,
                progress_callback=_progress,
            )
            async with AsyncSessionLocal() as session:
                r = ProjectRepository(session)
                await r.update_output(_id, out_path, thumb_path)
                await r.update_status(_id, ProjectStatus.READY, 1.0, "DONE")
        except Exception as exc:
            logger.error("Render failed for project %d: %s", _id, exc)
            async with AsyncSessionLocal() as session:
                r = ProjectRepository(session)
                await r.update_status(
                    _id, ProjectStatus.FAILED, 0.0, "FAILED",
                    error_message=str(exc)
                )

    job = Job(job_id=job_id, coroutine_factory=_run_job)
    await job_queue.enqueue(job)
    return JobResponse(job_id=job_id, status="QUEUED")


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return JobResponse(job_id=job.job_id, status=job.status, error=job.error)


@router.get("/projects/{project_id}/download")
async def download_project(project_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project or not project.output_video_path:
        raise HTTPException(404, "Video not found.")
    path = Path(project.output_video_path)
    if not path.exists():
        raise HTTPException(404, "Video file missing from storage.")
    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"tiktok_video_{project_id}.mp4",
    )


@router.patch("/projects/{project_id}/caption", response_model=ProjectResponse)
async def update_caption(
    project_id: int, payload: CaptionUpdate, db: AsyncSession = Depends(get_db)
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(404, "Project not found.")
    await repo.update_caption(project_id, payload.title, payload.hashtags)
    project = await repo.get_by_id(project_id)
    return _project_response(project)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProjectRepository(db)
    deleted = await repo.delete(project_id)
    if not deleted:
        raise HTTPException(404, "Project not found.")
