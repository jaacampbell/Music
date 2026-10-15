"""Authenticated audio cleanup add-on for existing Music OS worker.

It reuses JobStore ownership and signed file-download handling. No secondary
unauthenticated public worker is required.
"""
from __future__ import annotations
import json
import math
import re
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Any

from fastapi import File, Form, HTTPException, Request, UploadFile

import agent_api as base
from agent_core import DATA_DIR, download_token, owned_job, now
from cleanup_engine.pipeline import restore_core6

app = base.app
MAX_REFERENCE_BYTES = 100 * 1024 * 1024
MAX_MIDI_BYTES = 5 * 1024 * 1024
ALLOWED_REFERENCE = {".wav", ".flac", ".mp3", ".m4a", ".aiff", ".aif"}
_active_lock = threading.Lock()
_active_jobs: set[str] = set()

def _status_path(job_dir: Path) -> Path:
    return job_dir / "cleanup-status.json"

def _write_status(job_dir: Path, body: dict[str, Any]) -> None:
    path = _status_path(job_dir)
    temporary = path.with_suffix(".writing")
    temporary.write_text(json.dumps(body, indent=2), encoding="utf-8")
    temporary.replace(path)

def _load_status(job_dir: Path) -> dict[str, Any]:
    path = _status_path(job_dir)
    if not path.is_file():
        return {"status": "not-started"}
    return json.loads(path.read_text(encoding="utf-8"))

async def _save_limited(file: UploadFile, dest: Path, max_bytes: int) -> None:
    total = 0
    try:
        with dest.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(413, "Attached file exceeds size limit")
                output.write(chunk)
        if total == 0:
            raise HTTPException(400, "Attached file is empty")
    except BaseException:
        dest.unlink(missing_ok=True)
        raise

def _render_reference(raw: Path, wav: Path) -> None:
    try:
        proc = subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-i", str(raw), "-t", "900", "-vn", "-ac", "2", "-ar", "44100",
            "-c:a", "pcm_f32le", str(wav),
        ], capture_output=True, timeout=180)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ValueError("Reference decoding timed out or is unavailable") from exc
    if proc.returncode != 0 or not wav.is_file():
        raise ValueError("Unable to decode reference audio")

def _run_cleanup(job_dir: Path, run_id: str, reference: Path | None, midi: Path | None,
                 denoise: float, match: float) -> None:
    run_root = job_dir / "cleanup" / run_id
    try:
        _write_status(job_dir, {"status": "processing", "runId": run_id, "updatedAt": now()})
        wav = run_root.parent / f"{run_id}-reference.wav"
        if reference is not None:
            _render_reference(reference, wav)
        result = restore_core6(job_dir, run_root, reference=wav if reference is not None else None,
                               midi=midi, denoise_strength=denoise, match_strength=match)
        _write_status(job_dir, {"status": "completed", "runId": run_id, "updatedAt": now(), "result": result})
    except Exception as exc:
        _write_status(job_dir, {"status": "failed", "runId": run_id, "updatedAt": now(),
                                "error": str(exc)[-700:]})
    finally:
        if reference is not None:
            reference.unlink(missing_ok=True)
            (run_root.parent / f"{run_id}-reference.wav").unlink(missing_ok=True)
        if midi is not None:
            midi.unlink(missing_ok=True)
        with _active_lock:
            _active_jobs.discard(job_dir.name)

@app.post("/agent/jobs/{job_id}/cleanup", status_code=202)
async def begin_cleanup(request: Request, job_id: str,
                        reference: UploadFile | None = File(None),
                        midi: UploadFile | None = File(None),
                        denoise: float = Form(0.2), match: float = Form(0.25)) -> dict[str, Any]:
    job, _ = owned_job(request, job_id)
    if job.get("status") != "completed":
        raise HTTPException(409, "Finish stem separation before running Cleanup")
    if not all(math.isfinite(v) and 0 <= v <= 1 for v in (denoise, match)):
        raise HTTPException(400, "Invalid cleanup strength")
    if reference is None:
        match = 0.0
    elif Path(reference.filename or "").suffix.lower() not in ALLOWED_REFERENCE:
        raise HTTPException(415, "Unsupported reference audio format")
    if midi is not None and Path(midi.filename or "").suffix.lower() not in {".mid", ".midi"}:
        raise HTTPException(415, "Attach a MIDI file (.mid or .midi)")
    with _active_lock:
        if job_id in _active_jobs:
            raise HTTPException(409, "Cleanup is already running")
        _active_jobs.add(job_id)
    folder = DATA_DIR / job_id
    run_id = uuid.uuid4().hex[:12]
    raw_reference: Path | None = None
    raw_midi: Path | None = None
    try:
        (folder / "cleanup").mkdir(exist_ok=True)
        if reference is not None:
            raw_reference = folder / "cleanup" / f"{run_id}-ref{Path(reference.filename or '').suffix.lower()}"
            await _save_limited(reference, raw_reference, MAX_REFERENCE_BYTES)
        if midi is not None:
            raw_midi = folder / "cleanup" / f"{run_id}-supplied.mid"
            await _save_limited(midi, raw_midi, MAX_MIDI_BYTES)
            with raw_midi.open("rb") as stream:
                if stream.read(4) != b"MThd":
                    raise HTTPException(400, "Invalid MIDI header")
        _write_status(folder, {"status": "queued", "runId": run_id, "updatedAt": now()})
        base._executor.submit(_run_cleanup, folder, run_id, raw_reference, raw_midi, denoise, match)
    except BaseException:
        if raw_reference is not None:
            raw_reference.unlink(missing_ok=True)
        if raw_midi is not None:
            raw_midi.unlink(missing_ok=True)
        with _active_lock:
            _active_jobs.discard(job_id)
        raise
    return {"status": "queued", "runId": run_id, "pollUrl": f"/agent/jobs/{job_id}/cleanup/status"}

@app.get("/agent/jobs/{job_id}/cleanup/status")
def cleanup_status(request: Request, job_id: str) -> dict[str, Any]:
    owned_job(request, job_id)
    data = _load_status(DATA_DIR / job_id)
    if data.get("status") != "completed":
        return data
    run_id = data.get("runId", "")
    if not re.fullmatch(r"[a-f0-9]{12}", run_id):
        raise HTTPException(500, "Invalid cleanup run identifier")
    result = data.get("result") or {}
    token = download_token(job_id)
    suffix = f"?access={token}" if token else ""
    prefix = f"/agent/jobs/{job_id}/files/cleanup/{run_id}/"
    return {**data, "masterUrl": prefix + "master.wav" + suffix,
            "zipUrl": prefix + "Ableton_Clean_Stems.zip" + suffix,
            "stemUrls": {name: prefix + name + suffix for name in result.get("stems", [])}}
