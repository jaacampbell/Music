# Stem Extraction + DAW Export

A modular, production-ready audio pipeline that accepts any audio file, separates it into clean phase-aligned stems, analyzes its musical properties (BPM, key, beat grid, loudness), and exports the result into formats usable by every major DAW.

**Think Moises / LALAL.AI — but self-hosted, open-source, and built for an agentic music production OS.**

---

## Features (Phase 1 — MVP)

| Feature | Status |
|---|---|
| Upload WAV / MP3 / FLAC / AIFF / M4A / OGG | ✅ |
| FFmpeg decode → 44100 Hz 24-bit normalized WAV | ✅ |
| BPM detection (librosa beat tracker) | ✅ |
| Musical key detection (chroma + KS profiles) | ✅ |
| LUFS / true peak loudness measurement | ✅ |
| Demucs 4-stem separation (vocals/drums/bass/other) | ✅ |
| Demucs 6-stem separation (+ guitar + piano) | ✅ |
| 2-stem vocals/instrumental split | ✅ |
| Per-stem confidence & LUFS scoring | ✅ |
| Celery job queue (non-blocking background processing) | ✅ |
| manifest.json (full project state / data model) | ✅ |
| Aligned WAV ZIP export | ✅ |
| REAPER `.rpp` auto-session export | ✅ |
| README_IMPORT.txt (per-DAW import guide) | ✅ |
| React + TypeScript frontend (upload → stems → export) | ✅ |
| Docker Compose (API + Worker + Redis) | ✅ |
| REST API with OpenAPI docs | ✅ |

---

## Quick Start

### With Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up
```

- API: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### Local development (without Docker)

**Requirements:** Python 3.11+, Node 20+, Redis, FFmpeg

```bash
# Start Redis
redis-server &

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload &
celery -A app.workers.celery_app worker --loglevel=info &

# Frontend
cd frontend
npm install
npm run dev
```

### Run tests

```bash
cd backend
python3 -m pytest tests/ -v
```

---

## API Overview

All endpoints are under `/api/v1`. Interactive docs at [`/docs`](http://localhost:8000/docs).

### Upload and extract stems

```bash
# 1. Upload audio file — creates a project
curl -F "file=@my_song.mp3" http://localhost:8000/api/v1/projects
# → { "project_id": "proj_abc123", "title": "My Song", ... }

# 2. Preprocess (BPM, key, decode)
curl -X POST http://localhost:8000/api/v1/projects/proj_abc123/jobs/preprocess
# → { "job_id": "...", "status": "queued" }

# 3. Separate stems (htdemucs 4-stem)
curl -X POST http://localhost:8000/api/v1/projects/proj_abc123/jobs/separate \
  -H "Content-Type: application/json" \
  -d '{"model": "htdemucs", "mode": "4stem"}'

# 4. Poll job status
curl http://localhost:8000/api/v1/projects/proj_abc123/jobs/{job_id}

# 5. Export as WAV ZIP
curl -X POST http://localhost:8000/api/v1/projects/proj_abc123/exports \
  -H "Content-Type: application/json" \
  -d '{"type": "wav_zip", "include_manifest": true, "include_readme": true}'

# 6. Download ZIP
curl -O http://localhost:8000/api/v1/projects/proj_abc123/exports/{export_id}/download
```

### REAPER project export

```bash
curl -X POST http://localhost:8000/api/v1/projects/proj_abc123/exports \
  -d '{"type": "reaper_rpp"}'
```

---

## Architecture

```
Browser (React + Vite)
    │  HTTP REST
FastAPI (uvicorn)
    │  Celery tasks
Redis (broker + result backend)
    │
Celery Worker
    ├── FFmpegService      (audio_io.py)
    ├── SeparatorService   (separator.py — Demucs HTDemucs)
    ├── AnalysisService    (analyzer.py — librosa BPM/key/LUFS)
    └── ExportService      (exporter.py — ZIP / REAPER .rpp)
    │
Local Storage (/data/projects/<project_id>/)
    ├── source/            original upload
    ├── preprocessed/      normalized 44.1 kHz WAV
    ├── stems/             separated WAV files
    └── exports/           ZIP, .rpp
```

See [PLAN.md](PLAN.md) for the full architectural plan, model comparison, DAW interoperability strategy, API design, data model, phase roadmap, and risk analysis.

---

## manifest.json — Data Model

Every project produces a `manifest.json` that is included in all exports:

```json
{
  "project_id": "proj_abc123",
  "title": "My Song",
  "analysis": {
    "bpm": 98.0,
    "key": "A minor",
    "lufs_integrated": -14.2,
    "beat_times": [0.0, 0.612, ...]
  },
  "stems": [
    {
      "name": "vocals",
      "file": "stems/vocals.wav",
      "lufs_integrated": -18.3,
      "confidence": 0.89
    },
    ...
  ],
  "exports": [...]
}
```

---

## DAW Import

All stems in every export:
- Start at exactly **0.0 seconds**
- Same sample rate: **44100 Hz**
- Same bit depth: **24-bit PCM**
- Same duration

This means they are **drag-and-drop compatible** with Ableton, FL Studio, Logic, REAPER, Pro Tools, Cubase, Studio One, and any other DAW.

The REAPER `.rpp` export creates a ready-to-open session with all stems pre-placed at bar 1 with the correct BPM.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Stem separation | [Demucs / HTDemucs](https://github.com/facebookresearch/demucs) |
| BPM / key / beat | [librosa](https://librosa.org) |
| Loudness | [pyloudnorm](https://github.com/csteinmetz1/pyloudnorm) |
| Audio decode/convert | [FFmpeg](https://ffmpeg.org) + [soundfile](https://python-soundfile.readthedocs.io) |
| API | [FastAPI](https://fastapi.tiangolo.com) |
| Job queue | [Celery](https://docs.celeryq.dev) + [Redis](https://redis.io) |
| Frontend | [React](https://react.dev) + TypeScript + [Vite](https://vite.dev) |

---

## Roadmap

See [PLAN.md §8 — Implementation Phases](PLAN.md#8-implementation-phases) for the full roadmap.

- **Phase 1 (this PR):** MVP — upload → 4-stem extraction → WAV ZIP + JSON manifest + REAPER .rpp
- **Phase 2:** MIDI sidecars via Basic Pitch, Ableton/Logic folder layouts, 6-stem mode
- **Phase 3:** Chord detection, downbeat detection, drum MIDI, section markers
- **Phase 4:** Agentic NL editing — "transpose to D minor", "remove vocals", "export for Ableton"
- **Phase 5:** GPU queue, batch processing, S3 storage, user library
