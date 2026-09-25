"""
Video processing service using FFmpeg.

All FFmpeg calls use subprocess with argument arrays (never shell=True with
user-supplied strings) to prevent command injection.

Pipeline:
  1. Download source video via yt-dlp
  2. Trim to [start_time, start_time+duration]
  3. Crop to 9:16 and scale to 720x1280
  4. Overlay image1 and image2 with timing/position/opacity
  5. Re-encode H.264 + AAC
  6. Generate thumbnail
"""
import asyncio
import logging
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Callable, Optional

import yt_dlp

from app.services.storage import TEMP_DIR, OUTPUTS_DIR, unique_temp_path, unique_output_path

logger = logging.getLogger(__name__)

FFMPEG_TIMEOUT = int(os.getenv("FFMPEG_TIMEOUT", "600"))   # seconds
FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")
FFPROBE_BIN = os.getenv("FFPROBE_BIN", "ffprobe")

# Resolution target
TARGET_W, TARGET_H = 720, 1280

POSITION_MAP = {
    "top-center":    ("(W-w)/2", "H*0.05"),
    "top-left":      ("W*0.05", "H*0.05"),
    "top-right":     ("W*0.90-w", "H*0.05"),
    "center":        ("(W-w)/2", "(H-h)/2"),
    "bottom-center": ("(W-w)/2", "H*0.85"),
    "bottom-left":   ("W*0.05", "H*0.85"),
    "bottom-right":  ("W*0.90-w", "H*0.85"),
}


def _run_subprocess(args: list[str], timeout: int = FFMPEG_TIMEOUT) -> subprocess.CompletedProcess:
    """Run a subprocess with a strict timeout; raises on non-zero exit."""
    result = subprocess.run(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode(errors="replace"))
    return result


def validate_source_url(url: str) -> bool:
    """Basic URL validation — only http/https, reasonable length."""
    url = url.strip()
    if len(url) > 2048:
        return False
    return bool(re.match(r"^https?://[^\s]+$", url))


def _yt_dlp_download(url: str, output_path: Path, progress_cb: Optional[Callable] = None) -> None:
    """Download video using yt-dlp to output_path.

    Uses yt-dlp library interface (no shell injection risk).
    Only downloads formats with mp4/webm container up to 720p.
    """
    def _hook(d: dict) -> None:
        if progress_cb and d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate", 1)
            downloaded = d.get("downloaded_bytes", 0)
            pct = min(downloaded / total, 1.0) if total else 0
            progress_cb(pct)

    ydl_opts = {
        "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]",
        "outtmpl": str(output_path),
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "progress_hooks": [_hook],
        "socket_timeout": 30,
        # Respect robots/ToS — only process public content
        "extract_flat": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


def _build_overlay_filter(
    img_var: str,
    size: float,
    position: str,
    start: float,
    end: float,
    opacity: float,
) -> str:
    """Build FFmpeg filter string for one overlay image."""
    x_expr, y_expr = POSITION_MAP.get(position, POSITION_MAP["top-center"])
    # Scale image to fraction of target width
    scaled_w = int(TARGET_W * size)
    # enable=between to show image only in time window
    enable = f"between(t,{start},{end})"
    # Format scale+overlay chain
    scale_filter = f"[{img_var}]scale={scaled_w}:-1[{img_var}s]"
    overlay_filter = (
        f"[{{base}}][{img_var}s]overlay=x={x_expr}:y={y_expr}:enable='{enable}':alpha={opacity:.2f}[{{out}}]"
    )
    return scale_filter, overlay_filter


def build_ffmpeg_command(
    input_video: Path,
    image1_path: Optional[Path],
    image2_path: Optional[Path],
    start_time: float,
    duration: float,
    image1_start: float,
    image1_end: float,
    image1_position: str,
    image1_size: float,
    image1_opacity: float,
    image2_start: float,
    image2_end: float,
    image2_position: str,
    image2_size: float,
    image2_opacity: float,
    output_path: Path,
) -> list[str]:
    """Build the FFmpeg argument list for the full pipeline."""
    args = [FFMPEG_BIN, "-y"]

    # ── Inputs ──────────────────────────────────────────────
    args += ["-ss", str(start_time), "-t", str(duration), "-i", str(input_video)]

    images_used: list[tuple[str, float, float, str, float, float]] = []
    if image1_path and image1_path.exists():
        args += ["-loop", "1", "-i", str(image1_path)]
        images_used.append(("img1", image1_start, image1_end, image1_position, image1_size, image1_opacity))
    if image2_path and image2_path.exists():
        args += ["-loop", "1", "-i", str(image2_path)]
        images_used.append(("img2", image2_start, image2_end, image2_position, image2_size, image2_opacity))

    # ── Filter graph ─────────────────────────────────────────
    # Step 1: crop to 9:16 then scale to 720x1280
    vf_chain = (
        "scale=w=iw:h=iw*16/9:force_original_aspect_ratio=decrease,"
        "crop=iw:'iw*16/9',"
        f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=disable"
    )

    filter_complex_parts: list[str] = []
    # Base video tag after first pass
    base_out = "vbase"
    filter_complex_parts.append(f"[0:v]{vf_chain}[{base_out}]")

    # Build image input indices (1-based because 0 is main video)
    cur_base = base_out
    for idx, (var, i_start, i_end, i_pos, i_size, i_opacity) in enumerate(images_used, start=1):
        x_expr, y_expr = POSITION_MAP.get(i_pos, POSITION_MAP["top-center"])
        scaled_w = int(TARGET_W * i_size)
        enable = f"between(t,{i_start},{i_end})"
        next_out = f"v{idx}"

        scale_f = f"[{idx}:v]scale={scaled_w}:-1[{var}s]"
        if i_opacity < 1.0:
            # Apply alpha via colorchannelmixer or format+blend
            scale_f = f"[{idx}:v]scale={scaled_w}:-1,format=rgba,colorchannelmixer=aa={i_opacity:.2f}[{var}s]"
        overlay_f = (
            f"[{cur_base}][{var}s]overlay=x='{x_expr}':y='{y_expr}'"
            f":enable='{enable}'[{next_out}]"
        )
        filter_complex_parts.append(scale_f)
        filter_complex_parts.append(overlay_f)
        cur_base = next_out

    filter_complex = ";".join(filter_complex_parts)

    args += ["-filter_complex", filter_complex]
    args += ["-map", f"[{cur_base}]", "-map", "0:a"]

    # ── Encode ───────────────────────────────────────────────
    args += [
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-shortest",
        str(output_path),
    ]
    return args


def generate_thumbnail(video_path: Path, thumbnail_path: Path) -> None:
    """Extract a frame at t=1s as a JPEG thumbnail."""
    _run_subprocess([
        FFMPEG_BIN, "-y",
        "-ss", "1",
        "-i", str(video_path),
        "-vframes", "1",
        "-q:v", "3",
        str(thumbnail_path),
    ], timeout=60)


async def process_video(
    project_id: int,
    source_url: str,
    start_time: float,
    duration: float,
    image1_path: Optional[str],
    image2_path: Optional[str],
    image1_start: float,
    image1_end: float,
    image1_position: str,
    image1_size: float,
    image1_opacity: float,
    image2_start: float,
    image2_end: float,
    image2_position: str,
    image2_size: float,
    image2_opacity: float,
    progress_callback: Optional[Callable[[str, float], None]] = None,
) -> tuple[str, str]:
    """
    Full async video processing pipeline.

    Returns (output_video_path, thumbnail_path).
    Raises RuntimeError with a human-readable message on failure.
    """

    def _cb(stage: str, pct: float) -> None:
        if progress_callback:
            progress_callback(stage, pct)

    # 1. Validate URL
    if not validate_source_url(source_url):
        raise RuntimeError("URL không hợp lệ.")

    # 2. Download
    _cb("DOWNLOADING", 0.0)
    raw_video = unique_temp_path(".mp4")
    try:
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: _yt_dlp_download(source_url, raw_video, lambda p: _cb("DOWNLOADING", p * 0.5)),
        )
    except Exception as e:
        raise RuntimeError(f"Không thể đọc video nguồn: {e}")

    if not raw_video.exists():
        # yt-dlp may append extension
        candidates = list(TEMP_DIR.glob(f"{raw_video.stem}*"))
        if candidates:
            raw_video = candidates[0]
        else:
            raise RuntimeError("Không thể đọc video nguồn: file không tồn tại sau download.")

    _cb("DOWNLOADING", 0.5)

    # 3–9. FFmpeg pipeline
    _cb("PROCESSING", 0.0)
    output_path = unique_output_path(".mp4")
    cmd = build_ffmpeg_command(
        input_video=raw_video,
        image1_path=Path(image1_path) if image1_path else None,
        image2_path=Path(image2_path) if image2_path else None,
        start_time=start_time,
        duration=duration,
        image1_start=image1_start,
        image1_end=image1_end,
        image1_position=image1_position,
        image1_size=image1_size,
        image1_opacity=image1_opacity,
        image2_start=image2_start,
        image2_end=image2_end,
        image2_position=image2_position,
        image2_size=image2_size,
        image2_opacity=image2_opacity,
        output_path=output_path,
    )

    logger.info("FFmpeg command: %s", " ".join(cmd))
    _cb("RENDERING", 0.5)
    try:
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: _run_subprocess(cmd),
        )
    except RuntimeError as e:
        raise RuntimeError(f"Render thất bại: {e}")
    finally:
        # Always clean up temp download
        try:
            raw_video.unlink(missing_ok=True)
        except Exception:
            pass

    _cb("RENDERING", 0.9)

    # 10. Thumbnail
    thumbnail_path = unique_output_path(".jpg")
    try:
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: generate_thumbnail(output_path, thumbnail_path),
        )
    except Exception as e:
        logger.warning("Thumbnail generation failed: %s", e)
        thumbnail_path = None

    _cb("DONE", 1.0)
    return str(output_path), str(thumbnail_path) if thumbnail_path else None
