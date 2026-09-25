"""Storage abstraction — local filesystem MVP.

All path operations go through here so switching to S3/GCS later only
requires implementing a new StorageBackend class.
"""
import os
import re
import shutil
import uuid
from pathlib import Path


STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./storage"))
UPLOADS_DIR = STORAGE_ROOT / "uploads"
OUTPUTS_DIR = STORAGE_ROOT / "outputs"
TEMP_DIR = STORAGE_ROOT / "temp"

# Ensure dirs exist at import time
for _dir in [UPLOADS_DIR, OUTPUTS_DIR, TEMP_DIR]:
    _dir.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))  # 20 MB


def sanitize_filename(name: str) -> str:
    """Remove path-traversal characters and limit length."""
    name = os.path.basename(name)                          # strip directory parts
    name = re.sub(r"[^\w.\-]", "_", name)                 # keep safe chars
    return name[:120]                                      # max length


def unique_upload_path(original_name: str) -> Path:
    safe = sanitize_filename(original_name)
    return UPLOADS_DIR / f"{uuid.uuid4().hex}_{safe}"


def unique_output_path(ext: str = ".mp4") -> Path:
    return OUTPUTS_DIR / f"{uuid.uuid4().hex}{ext}"


def unique_temp_path(ext: str = ".mp4") -> Path:
    return TEMP_DIR / f"{uuid.uuid4().hex}{ext}"


def delete_file_safe(path: str | Path | None) -> None:
    """Delete a file without raising if it does not exist."""
    if path is None:
        return
    try:
        Path(path).unlink(missing_ok=True)
    except Exception:
        pass


def cleanup_temp(project_id: int) -> None:
    """Remove all temp files that start with the project temp prefix."""
    for f in TEMP_DIR.iterdir():
        if f.is_file():
            try:
                f.unlink()
            except Exception:
                pass
