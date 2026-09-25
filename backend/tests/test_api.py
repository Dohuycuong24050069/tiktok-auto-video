"""Unit tests for video processing and API."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.video_service import validate_source_url, build_ffmpeg_command
from pathlib import Path


# ── URL validation tests ──────────────────────────────────
class TestUrlValidation:
    def test_valid_youtube_url(self):
        assert validate_source_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    def test_valid_http_url(self):
        assert validate_source_url("http://example.com/video.mp4")

    def test_rejects_non_http(self):
        assert not validate_source_url("ftp://evil.com/file")

    def test_rejects_too_long(self):
        assert not validate_source_url("https://" + "a" * 2500)

    def test_rejects_empty(self):
        assert not validate_source_url("")

    def test_rejects_space(self):
        assert not validate_source_url("  ")


# ── FFmpeg command builder tests ──────────────────────────
class TestBuildFFmpegCommand:
    def test_no_images(self, tmp_path):
        fake_video = tmp_path / "video.mp4"
        fake_video.write_bytes(b"")
        out = tmp_path / "out.mp4"
        cmd = build_ffmpeg_command(
            input_video=fake_video,
            image1_path=None,
            image2_path=None,
            start_time=0,
            duration=30,
            image1_start=0, image1_end=3, image1_position="top-center",
            image1_size=0.3, image1_opacity=1.0,
            image2_start=27, image2_end=30, image2_position="bottom-center",
            image2_size=0.3, image2_opacity=1.0,
            output_path=out,
        )
        assert "ffmpeg" in cmd[0]
        assert str(out) in cmd
        assert "-filter_complex" in cmd

    def test_with_images(self, tmp_path):
        fake_video = tmp_path / "video.mp4"
        fake_video.write_bytes(b"")
        fake_img1 = tmp_path / "img1.png"
        fake_img1.write_bytes(b"")
        out = tmp_path / "out.mp4"
        cmd = build_ffmpeg_command(
            input_video=fake_video,
            image1_path=fake_img1,
            image2_path=None,
            start_time=5,
            duration=30,
            image1_start=0, image1_end=3, image1_position="top-center",
            image1_size=0.3, image1_opacity=1.0,
            image2_start=27, image2_end=30, image2_position="bottom-center",
            image2_size=0.3, image2_opacity=1.0,
            output_path=out,
        )
        assert str(fake_img1) in cmd
        assert "scale" in " ".join(cmd)


# ── API integration tests ──────────────────────────────────
@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_list_projects_empty(client):
    resp = await client.get("/api/projects")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_project_invalid_url(client):
    resp = await client.post(
        "/api/projects",
        data={"source_url": "not-a-url", "duration": "30"},
    )
    assert resp.status_code == 400
