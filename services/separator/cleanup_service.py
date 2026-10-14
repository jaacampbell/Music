"""Separate cleanup API for existing Music OS separator outputs.

Deploy as: uvicorn cleanup_service:app --host 0.0.0.0 --port 8001
Shares the separator DATA_DIR volume. Protect with private network routing.
"""
from __future__ import annotations
import json
import os
import re
import zipfile
from pathlib import Path
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from cleanup_engine.engine import process_stem, CleanupSettings

ROOT = Path(__file__).parent
DATA = ROOT / "data"
app = FastAPI(title="Music OS Cleanup Worker", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","), allow_methods=["GET", "POST"], allow_headers=["*"])
ID = re.compile(r"^[a-f0-9]{12}$")

def safe_job(job_id: str) -> Path:
    if not ID.fullmatch(job_id):
        raise HTTPException(400, "Invalid job ID")
    folder = (DATA / job_id).resolve()
    if not folder.is_dir():
        raise HTTPException(404, "Job not found")
    return folder

def run_cleanup(folder: Path, ref: Path | None, denoise: float, match: float) -> dict:
    stem_root = folder / "stems"
    if not stem_root.is_dir():
        raise ValueError("No separated stems available")
    source = folder / "source.wav"
    if not source.is_file():
        raise ValueError("Missing original source")
    out_dir = folder / "cleaned"
    out_dir.mkdir(exist_ok=True)
    reports = []
    core = []
    for name in ("vocals", "drums", "bass", "guitar", "piano", "other"):
        matches = sorted(stem_root.rglob(f"*_{name.title()}.wav"))
        if not matches:
            continue
        original = matches[0]
        target = out_dir / f"{name}.wav"
        # Keep drums transients; tonal reference matching only for melodic material.
        settings = CleanupSettings(highpass_hz=0 if name == "bass" else 25,
            denoise_strength=min(denoise, 0.15) if name == "drums" else denoise,
            match_strength=match if name not in ("drums", "vocals") else 0.0)
        report = process_stem(str(original), str(target), str(ref) if ref else None, settings)
        reports.append({"name": name, **report, "url": f"/cleanup/jobs/{folder.name}/files/{name}.wav"})
        core.append(target)
    if len(core) != 6:
        raise ValueError("Six core stems required to create a reliable master")
    arrays = [sf.read(p, always_2d=True) for p in core]
    sr = arrays[0][1]
    shape = arrays[0][0].shape
    if any(a.shape != shape or rate != sr for a, rate in arrays):
        raise ValueError("Core stems are not synchronized")
    master = np.sum([a for a, _ in arrays], axis=0)
    peak = np.max(np.abs(master))
    if peak > 10 ** (-1 / 20):
        master *= 10 ** (-1 / 20) / peak
    sf.write(out_dir / "master.wav", master, sr, subtype="PCM_24")
    archive = out_dir / "Ableton_Clean_Stems.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for path in core + [out_dir / "master.wav"]:
            z.write(path, arcname=path.name)
        z.write(source, arcname="original_reference_source.wav")
        z.writestr("manifest.json", json.dumps({"sample_rate": sr, "samples": shape[0], "stems": [p.name for p in core], "reference_eq": bool(ref), "midi_extracted": False, "pitch_corrected": False}, indent=2))
    return {"jobId": folder.name, "stems": reports, "masterUrl": f"/cleanup/jobs/{folder.name}/files/master.wav", "zipUrl": f"/cleanup/jobs/{folder.name}/files/Ableton_Clean_Stems.zip", "midiExtracted": False, "pitchCorrected": False}

@app.get("/cleanup/health")
def health():
    return {"status": "ok", "version": "0.2.0"}

@app.post("/cleanup/jobs/{job_id}")
async def cleanup(job_id: str, reference: UploadFile | None = File(None), denoise: float = Form(0.3), match: float = Form(0.3)):
    folder = safe_job(job_id)
    if not (0 <= denoise <= 1 and 0 <= match <= 1):
        raise HTTPException(400, "Invalid cleanup settings")
    ref = None
    if reference is not None:
        ref = folder / "cleanup_reference.wav"
        import subprocess
        raw = folder / "cleanup_reference_upload"
        with raw.open("wb") as f:
            while chunk := await reference.read(1024 * 1024):
                f.write(chunk)
                if f.tell() > 100 * 1024 * 1024:
                    raw.unlink(missing_ok=True)
                    raise HTTPException(413, "Reference exceeds 100 MB")
        proc = await run_in_threadpool(subprocess.run, ["ffmpeg", "-y", "-i", str(raw), "-ac", "2", "-ar", "44100", str(ref)], capture_output=True)
        raw.unlink(missing_ok=True)
        if proc.returncode:
            raise HTTPException(400, "Reference audio could not be decoded")
    try:
        return await run_in_threadpool(run_cleanup, folder, ref, denoise, match)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

@app.get("/cleanup/jobs/{job_id}/files/{filename}")
def output(job_id: str, filename: str):
    folder = safe_job(job_id)
    if filename not in {"vocals.wav", "drums.wav", "bass.wav", "guitar.wav", "piano.wav", "other.wav", "master.wav", "Ableton_Clean_Stems.zip"}:
        raise HTTPException(404, "Not found")
    path = folder / "cleaned" / filename
    if not path.is_file():
        raise HTTPException(404, "Not found")
    return FileResponse(path, filename=filename)
