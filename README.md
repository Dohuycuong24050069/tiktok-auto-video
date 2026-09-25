# TikTok Auto Video Tool

> Automated TikTok short-form video preparation tool (720x1280, 9:16, H.264+AAC).

## Architecture

```
YouTube URL -> yt-dlp -> FFmpeg pipeline -> MP4 720x1280 -> Preview + Download
```

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + async SQLAlchemy + SQLite
- **Video**: FFmpeg (H.264, AAC, 720x1280, 9:16)
- **Queue**: asyncio.Queue (upgradeable to Redis+Celery)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- FFmpeg (in PATH)

### Install FFmpeg

**Windows**: Download from https://ffmpeg.org/download.html and add to PATH.

**macOS**: `brew install ffmpeg`

**Linux**: `sudo apt install ffmpeg`

## Quick Start (Local)

### 1. Clone and setup environment

```bash
cd tiktok-auto-video
cp .env.example .env
```

### 2. Start Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000
API docs: http://localhost:8000/docs

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Docker

```bash
cp .env.example .env
docker-compose up --build
```

## Usage

1. Open http://localhost:3000/dashboard
2. Enter a YouTube URL (only use content you have rights to)
3. Set start time and duration (5-180 seconds)
4. Optionally upload 2 overlay images
5. Add title and hashtags
6. Click "Create Video"
7. Wait for render to complete (progress shown live)
8. Preview in 9:16 frame and download MP4

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/projects | Create project |
| GET | /api/projects | List projects |
| GET | /api/projects/{id} | Get project |
| POST | /api/projects/{id}/render | Start render |
| PATCH | /api/projects/{id}/caption | Update caption |
| GET | /api/projects/{id}/download | Download MP4 |
| DELETE | /api/projects/{id} | Delete project |
| GET | /api/jobs/{id} | Get job status |

## Run Tests

```bash
cd backend
pytest -v
```

## Project Structure

```
tiktok-auto-video/
├── frontend/          # Next.js 14 app
│   ├── app/           # App router pages
│   ├── components/    # Reusable components
│   └── lib/           # API client + utilities
├── backend/
│   ├── app/
│   │   ├── api/       # FastAPI routers + schemas
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── services/  # Database, storage, video processing
│   │   └── workers/   # Job queue
│   └── tests/         # pytest test suite
├── storage/           # Local video/image storage
├── docker-compose.yml
└── .env.example
```

## Security

- File type validation on all uploads
- 20 MB upload limit
- Path traversal protection
- FFmpeg called with argument arrays (no shell injection)
- FFmpeg timeout (600s default)
- No TikTok passwords stored
- No cookie-based TikTok automation

## TikTok Publishing (Future)

TikTok publishing will use the official Content Posting API with OAuth 2.0.
Currently, the MVP only supports downloading the MP4.