"""Pydantic schemas for request/response validation."""
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator


# ── Project Schemas ─────────────────────────────────────────
class ImageOverlayCreate(BaseModel):
    start: float = 0.0
    end: float = 3.0
    position: str = "top-center"
    size: float = 0.3
    opacity: float = 1.0


class ProjectCreate(BaseModel):
    source_url: str
    start_time: float = 0.0
    duration: float = 30.0
    preset: str = "short_30s"
    image1: Optional[ImageOverlayCreate] = None
    image2: Optional[ImageOverlayCreate] = None
    audio_mode: str = "source"
    title: str = ""
    hashtags: str = ""

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: float) -> float:
        if not (5 <= v <= 180):
            raise ValueError("Duration must be between 5 and 180 seconds.")
        return v

    @field_validator("start_time")
    @classmethod
    def validate_start_time(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Start time cannot be negative.")
        return v


class CaptionUpdate(BaseModel):
    title: str
    hashtags: str


class ProjectResponse(BaseModel):
    id: int
    source_url: str
    start_time: float
    duration: float
    preset: str
    image1_path: Optional[str]
    image1_start: float
    image1_end: float
    image1_position: str
    image1_size: float
    image1_opacity: float
    image2_path: Optional[str]
    image2_start: float
    image2_end: float
    image2_position: str
    image2_size: float
    image2_opacity: float
    audio_mode: str
    title: str
    hashtags: str
    output_video_path: Optional[str]
    thumbnail_path: Optional[str]
    status: str
    error_message: Optional[str]
    progress: float
    progress_stage: str
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_project(cls, p) -> "ProjectResponse":
        return cls(
            id=p.id,
            source_url=p.source_url,
            start_time=p.start_time,
            duration=p.duration,
            preset=p.preset,
            image1_path=p.image1_path,
            image1_start=p.image1_start,
            image1_end=p.image1_end,
            image1_position=p.image1_position,
            image1_size=p.image1_size,
            image1_opacity=p.image1_opacity,
            image2_path=p.image2_path,
            image2_start=p.image2_start,
            image2_end=p.image2_end,
            image2_position=p.image2_position,
            image2_size=p.image2_size,
            image2_opacity=p.image2_opacity,
            audio_mode=p.audio_mode,
            title=p.title,
            hashtags=p.hashtags,
            output_video_path=p.output_video_path,
            thumbnail_path=p.thumbnail_path,
            status=p.status.value if hasattr(p.status, "value") else str(p.status),
            error_message=p.error_message,
            progress=p.progress,
            progress_stage=p.progress_stage,
            created_at=p.created_at.isoformat() if p.created_at else "",
        )


class JobResponse(BaseModel):
    job_id: str
    status: str
    error: Optional[str] = None
