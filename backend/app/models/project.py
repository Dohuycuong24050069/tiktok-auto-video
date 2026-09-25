"""SQLAlchemy ORM models for projects and jobs."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Enum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class ProjectStatus(str, PyEnum):
    PENDING = "PENDING"
    DOWNLOADING = "DOWNLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    source_url = Column(String, nullable=False)
    start_time = Column(Float, default=0.0)          # seconds
    duration = Column(Float, default=30.0)           # seconds
    preset = Column(String, default="short_30s")

    image1_path = Column(String, nullable=True)
    image1_start = Column(Float, default=0.0)
    image1_end = Column(Float, default=3.0)
    image1_position = Column(String, default="top-center")
    image1_size = Column(Float, default=0.3)         # fraction of width
    image1_opacity = Column(Float, default=1.0)

    image2_path = Column(String, nullable=True)
    image2_start = Column(Float, default=27.0)
    image2_end = Column(Float, default=30.0)
    image2_position = Column(String, default="bottom-center")
    image2_size = Column(Float, default=0.3)
    image2_opacity = Column(Float, default=1.0)

    audio_mode = Column(String, default="source")    # source | custom
    custom_audio_path = Column(String, nullable=True)

    title = Column(String, default="")
    hashtags = Column(Text, default="")

    output_video_path = Column(String, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PENDING)
    error_message = Column(Text, nullable=True)
    progress = Column(Float, default=0.0)
    progress_stage = Column(String, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
