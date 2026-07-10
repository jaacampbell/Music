"""Real stem-separation service.

FastAPI + Demucs (htdemucs) + FFmpeg. Accepts an audio upload (or generates a
demo mixture), decodes to a canonical WAV, runs a *real* 4-stem separation, and
serves the resulting vocals/drums/bass/other WAV files. Analysis (duration,
per-stem loudness, and an alignment check that the summed stems reconstruct the
source) is computed from the actual audio.
"""

from __future__ import annotations

import math
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
STEMS = ["vocals", "drums", "bass", "other"]
MODEL_NAME = "htdemucs"

app = FastAPI(title="Stem Separator", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(500, f"command failed: {' '.join(cmd)}\n{result.stderr[-800:]}")


def _decode_to_wav(src: Path, dst: Path) -> None:
    # Canonical decode: 44.1 kHz stereo PCM WAV.
    _run(["ffmpeg", "-y", "-i", str(src), "-ac", "2", "-ar", "44100", str(dst)])


def _rms_db(x: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(np.square(x)))) if x.size else 0.0
    return round(20 * math.log10(rms), 1) if rms > 1e-9 else -120.0


def _separate(job_dir: Path, source_wav: Path) -> dict:
    # Real Demucs inference via the CLI (version-stable). First run downloads the
    # htdemucs weights; output lands at <out>/htdemucs/<track>/<stem>.wav.
    out_root = job_dir / "demucs_out"
    _run([sys.executable, "-m", "demucs", "-n", MODEL_NAME, "-d", "cpu",
          "-o", str(out_root), str(source_wav)])
    produced = out_root / MODEL_NAME / source_wav.stem

    src_audio, sr = sf.read(str(source_wav), dtype="float32", always_2d=True)
    sample_sum = np.zeros_like(src_audio)

    stems_dir = job_dir / "stems"
    stems_dir.mkdir(parents=True, exist_ok=True)
    stems_meta = []
    for idx, name in enumerate(STEMS):
        produced_stem = produced / f"{name}.wav"
        if not produced_stem.is_file():
            raise HTTPException(500, f"demucs did not produce stem: {name}")
        out_path = stems_dir / f"{idx + 1:02d}_{name}.wav"
        shutil.copyfile(produced_stem, out_path)
        data, _ = sf.read(str(out_path), dtype="float32", always_2d=True)
        n = min(len(sample_sum), len(data))
        sample_sum[:n] += data[:n]
        stems_meta.append(
            {
                "name": name,
                "index": idx + 1,
                "file": f"stems/{idx + 1:02d}_{name}.wav",
                "url": f"/jobs/{job_dir.name}/stems/{idx + 1:02d}_{name}.wav",
                "integratedDb": _rms_db(data),
            }
        )

    # Alignment: how closely do the summed stems reconstruct the source?
    n = min(len(src_audio), len(sample_sum))
    err = src_audio[:n] - sample_sum[:n]
    recon_error_db = _rms_db(err)

    return {
        "model": MODEL_NAME,
        "sampleRate": int(sr),
        "channels": src_audio.shape[1],
        "durationSec": round(len(src_audio) / sr, 2),
        "stems": stems_meta,
        "alignment": {
            "reconErrorDb": recon_error_db,
            "note": "Summed stems reconstruct the source (lower dB = tighter).",
        },
        "warnings": [
            "AI separation produces approximations, not original studio multitracks.",
            f"Model: {MODEL_NAME} (real Demucs inference on CPU).",
        ],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/separate")
async def separate(file: UploadFile = File(...)) -> dict:
    job_id = uuid.uuid4().hex[:12]
    job_dir = DATA_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    upload = job_dir / ("source" + Path(file.filename or "audio").suffix)
    with upload.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    source_wav = job_dir / "source.wav"
    _decode_to_wav(upload, source_wav)
    result = _separate(job_dir, source_wav)
    return {"jobId": job_id, "source": {"filename": file.filename}, **result}


@app.post("/separate/demo")
def separate_demo() -> dict:
    """Generate a synthetic multi-instrument mixture and separate it (no upload)."""
    job_id = uuid.uuid4().hex[:12]
    job_dir = DATA_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    source_wav = job_dir / "source.wav"
    _run(
        [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "sine=frequency=110:duration=12",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=12",
            "-f", "lavfi", "-i", "anoisesrc=d=12:color=pink",
            "-filter_complex",
            "[2]highpass=f=5000,volume=0.6[perc];"
            "[0]volume=0.8[bass];[1]volume=0.5[mel];"
            "[bass][mel][perc]amix=inputs=3:duration=longest:normalize=0[mix]",
            "-map", "[mix]", "-ac", "2", "-ar", "44100", str(source_wav),
        ]
    )
    result = _separate(job_dir, source_wav)
    return {"jobId": job_id, "source": {"filename": "demo-mixture.wav"}, **result}


@app.get("/jobs/{job_id}/stems/{name}")
def get_stem(job_id: str, name: str) -> FileResponse:
    path = DATA_DIR / job_id / "stems" / name
    if not path.is_file() or ".." in job_id or ".." in name:
        raise HTTPException(404, "stem not found")
    return FileResponse(str(path), media_type="audio/wav")


@app.get("/jobs/{job_id}/source.wav")
def get_source(job_id: str) -> FileResponse:
    path = DATA_DIR / job_id / "source.wav"
    if not path.is_file() or ".." in job_id:
        raise HTTPException(404, "source not found")
    return FileResponse(str(path), media_type="audio/wav")
