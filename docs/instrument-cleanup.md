# Instrument Cleanup v0.2 — integration notes

This branch adds a standalone cleanup worker and a new Next.js /instrument-cleanup page. It uses the existing Demucs Core 6 separator.

## Worker setup
Run both workers with the **same persistent** services/separator/data directory:
```bash
cd services/separator
pip install numpy scipy soundfile fastapi uvicorn python-multipart
uvicorn app:app --port 8000
# in another terminal
uvicorn cleanup_service:app --port 8001
```
The original separator's own dependencies, FFmpeg and Demucs must also be installed.

Configure the Next.js frontend:
```
NEXT_PUBLIC_SEPARATOR_URL=http://localhost:8000
NEXT_PUBLIC_CLEANUP_URL=http://localhost:8001
```

The cleanup service is a prototype; do not expose it publicly. Before hosted deployment, route requests through authenticated project-owned server endpoints, add rate limiting, isolate jobs by user and set retention/size limits. The separator currently accepts unauthenticated direct uploads.

## Current scope
- Six Demucs stems separated by the existing worker
- Conservative noise cleanup with drum transient protection
- Tonal reference EQ on bass, guitar, piano and other
- Original length, channels and sample rate preserved
- 24-bit aligned WAV stems, master and Ableton ZIP
- No source-to-MIDI transcription or pitch correction yet
- No automatic DAW session generation or production deployment
- Tests and real audio listening validation pending
