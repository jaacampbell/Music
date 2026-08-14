"""Production stem-separation service.

Core separation uses Demucs htdemucs_6s for six non-overlapping mixable stems.
Deep 50+ separation uses Meta SAM-Audio text prompts to isolate any selected
instrument/vocal/sound target independently. Deep target stems are intentionally
marked non-mixable because text-query outputs can overlap each other.
"""

from __future__ import annotations

import importlib.util
import json
import math
import os
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
MODEL_DIR = Path(os.environ.get("SEPARATOR_MODEL_DIR", str(DATA_DIR / "models")))
MODEL_DIR.mkdir(parents=True, exist_ok=True)

CORE_STEMS = ["vocals", "drums", "bass", "guitar", "piano", "other"]
CORE_MODEL = os.environ.get("DEMUCS_MODEL", "htdemucs_6s")
SAM_MODEL_NAME = os.environ.get("SAM_AUDIO_MODEL", "facebook/sam-audio-small")
MAX_DEEP_TARGETS = int(os.environ.get("MAX_DEEP_TARGETS", "60"))
SAM_PREDICT_SPANS = os.environ.get("SAM_PREDICT_SPANS", "false").lower() == "true"
SAM_RERANK_CANDIDATES = int(os.environ.get("SAM_RERANK_CANDIDATES", "1"))

TARGETS = [
    {"id": "lead_vocals", "label": "Lead Vocals", "group": "Vocals", "prompt": "lead vocals"},
    {"id": "background_vocals", "label": "Background Vocals", "group": "Vocals", "prompt": "background vocals"},
    {"id": "adlibs", "label": "Ad-libs", "group": "Vocals", "prompt": "vocal ad libs"},
    {"id": "harmonies", "label": "Vocal Harmonies", "group": "Vocals", "prompt": "vocal harmonies"},
    {"id": "vocal_doubles", "label": "Vocal Doubles", "group": "Vocals", "prompt": "doubled vocals"},
    {"id": "choir", "label": "Choir", "group": "Vocals", "prompt": "choir vocals"},
    {"id": "rap_vocals", "label": "Rap Vocals", "group": "Vocals", "prompt": "rapping vocals"},
    {"id": "spoken_word", "label": "Spoken Word", "group": "Vocals", "prompt": "spoken word"},
    {"id": "dialogue", "label": "Dialogue", "group": "Vocals", "prompt": "dialogue"},
    {"id": "kick", "label": "Kick", "group": "Drums", "prompt": "kick drum"},
    {"id": "snare", "label": "Snare", "group": "Drums", "prompt": "snare drum"},
    {"id": "clap", "label": "Clap", "group": "Drums", "prompt": "hand claps"},
    {"id": "closed_hihat", "label": "Closed Hi-Hat", "group": "Drums", "prompt": "closed hi hat"},
    {"id": "open_hihat", "label": "Open Hi-Hat", "group": "Drums", "prompt": "open hi hat"},
    {"id": "hihat", "label": "Hi-Hats", "group": "Drums", "prompt": "hi hats"},
    {"id": "toms", "label": "Toms", "group": "Drums", "prompt": "tom drums"},
    {"id": "ride", "label": "Ride Cymbal", "group": "Drums", "prompt": "ride cymbal"},
    {"id": "crash", "label": "Crash Cymbal", "group": "Drums", "prompt": "crash cymbal"},
    {"id": "cymbals", "label": "Cymbals", "group": "Drums", "prompt": "cymbals"},
    {"id": "shaker", "label": "Shaker", "group": "Drums", "prompt": "shaker percussion"},
    {"id": "tambourine", "label": "Tambourine", "group": "Drums", "prompt": "tambourine"},
    {"id": "percussion", "label": "Percussion", "group": "Drums", "prompt": "percussion"},
    {"id": "drum_loop", "label": "Drum Loop", "group": "Drums", "prompt": "drum loop"},
    {"id": "bass_guitar", "label": "Bass Guitar", "group": "Bass", "prompt": "bass guitar"},
    {"id": "upright_bass", "label": "Upright Bass", "group": "Bass", "prompt": "upright bass"},
    {"id": "sub_bass", "label": "Sub Bass", "group": "Bass", "prompt": "sub bass"},
    {"id": "bass_808", "label": "808 Bass", "group": "Bass", "prompt": "808 bass"},
    {"id": "synth_bass", "label": "Synth Bass", "group": "Bass", "prompt": "synth bass"},
    {"id": "piano", "label": "Piano", "group": "Keys", "prompt": "piano"},
    {"id": "electric_piano", "label": "Electric Piano", "group": "Keys", "prompt": "electric piano"},
    {"id": "organ", "label": "Organ", "group": "Keys", "prompt": "organ"},
    {"id": "synthesizer", "label": "Synthesizer", "group": "Keys", "prompt": "synthesizer"},
    {"id": "synth_pad", "label": "Synth Pad", "group": "Keys", "prompt": "synth pad"},
    {"id": "lead_synth", "label": "Lead Synth", "group": "Keys", "prompt": "lead synthesizer"},
    {"id": "pluck", "label": "Pluck", "group": "Keys", "prompt": "plucked synthesizer"},
    {"id": "arpeggio", "label": "Arpeggio", "group": "Keys", "prompt": "synth arpeggio"},
    {"id": "acoustic_guitar", "label": "Acoustic Guitar", "group": "Guitars", "prompt": "acoustic guitar"},
    {"id": "electric_guitar", "label": "Electric Guitar", "group": "Guitars", "prompt": "electric guitar"},
    {"id": "lead_guitar", "label": "Lead Guitar", "group": "Guitars", "prompt": "lead guitar"},
    {"id": "rhythm_guitar", "label": "Rhythm Guitar", "group": "Guitars", "prompt": "rhythm guitar"},
    {"id": "clean_guitar", "label": "Clean Guitar", "group": "Guitars", "prompt": "clean electric guitar"},
    {"id": "distorted_guitar", "label": "Distorted Guitar", "group": "Guitars", "prompt": "distorted electric guitar"},
    {"id": "strings", "label": "Strings", "group": "Orchestral", "prompt": "string section"},
    {"id": "violin", "label": "Violin", "group": "Orchestral", "prompt": "violin"},
    {"id": "viola", "label": "Viola", "group": "Orchestral", "prompt": "viola"},
    {"id": "cello", "label": "Cello", "group": "Orchestral", "prompt": "cello"},
    {"id": "brass", "label": "Brass", "group": "Orchestral", "prompt": "brass section"},
    {"id": "trumpet", "label": "Trumpet", "group": "Orchestral", "prompt": "trumpet"},
    {"id": "trombone", "label": "Trombone", "group": "Orchestral", "prompt": "trombone"},
    {"id": "saxophone", "label": "Saxophone", "group": "Orchestral", "prompt": "saxophone"},
    {"id": "flute", "label": "Flute", "group": "Orchestral", "prompt": "flute"},
    {"id": "woodwinds", "label": "Woodwinds", "group": "Orchestral", "prompt": "woodwind instruments"},
    {"id": "melody", "label": "Main Melody", "group": "Music & FX", "prompt": "main melody"},
    {"id": "chords", "label": "Chords", "group": "Music & FX", "prompt": "chordal accompaniment"},
    {"id": "effects", "label": "Effects", "group": "Music & FX", "prompt": "sound effects"},
    {"id": "ambience", "label": "Ambience", "group": "Music & FX", "prompt": "ambient sound"},
    {"id": "soundtrack", "label": "Soundtrack", "group": "Music & FX", "prompt": "background soundtrack"},
    {"id": "risers", "label": "Risers / Sweeps", "group": "Music & FX", "prompt": "risers and sweeps"},
    {"id": "impacts", "label": "Impacts", "group": "Music & FX", "prompt": "impact sound effects"},
    {"id": "texture", "label": "Texture", "group": "Music & FX", "prompt": "musical texture"},
]
TARGET_BY_ID = {target["id"]: target for target in TARGETS}
CORE_TARGET_ALIASES = {"piano": "piano"}

app = FastAPI(title="Stem Studio Separator", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

_sam_lock = threading.Lock()
_sam_model = None
_sam_processor = None
_sam_device = None


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd)}\n{result.stderr[-1200:]}")


def _decode_to_wav(src: Path, dst: Path) -> None:
    _run(["ffmpeg", "-y", "-i", str(src), "-ac", "2", "-ar", "44100", str(dst)])


def _rms_db(x: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(np.square(x)))) if x.size else 0.0
    return round(20 * math.log10(rms), 1) if rms > 1e-9 else -120.0


def _stem_meta(job_dir: Path, path: Path, name: str, label: str, group: str, engine: str, mixable: bool, prompt: str | None = None) -> dict:
    audio, _ = sf.read(str(path), dtype="float32", always_2d=True)
    meta = {
        "name": name,
        "label": label,
        "group": group,
        "engine": engine,
        "mixable": mixable,
        "file": str(path.relative_to(job_dir)),
        "url": f"/jobs/{job_dir.name}/{path.relative_to(job_dir).as_posix()}",
        "integratedDb": _rms_db(audio),
    }
    if prompt:
        meta["prompt"] = prompt
    return meta


def _separate_core(job_dir: Path, source_wav: Path) -> dict:
    out_root = job_dir / "demucs_out"
    device = os.environ.get("DEMUCS_DEVICE", "cuda" if _cuda_available() else "cpu")
    _run(
        [
            sys.executable,
            "-m",
            "demucs",
            "-n",
            CORE_MODEL,
            "-d",
            device,
            "-o",
            str(out_root),
            str(source_wav),
        ]
    )
    produced = out_root / CORE_MODEL / source_wav.stem
    stems_dir = job_dir / "stems"
    stems_dir.mkdir(parents=True, exist_ok=True)

    src_audio, sr = sf.read(str(source_wav), dtype="float32", always_2d=True)
    sample_sum = np.zeros_like(src_audio)
    core_meta = []

    for idx, name in enumerate(CORE_STEMS):
        produced_stem = produced / f"{name}.wav"
        if not produced_stem.is_file():
            raise RuntimeError(f"Demucs did not produce core stem: {name}")
        out_path = stems_dir / f"{idx + 1:02d}_{name}.wav"
        shutil.copyfile(produced_stem, out_path)
        data, _ = sf.read(str(out_path), dtype="float32", always_2d=True)
        n = min(len(sample_sum), len(data))
        sample_sum[:n] += data[:n]
        core_meta.append(
            _stem_meta(
                job_dir,
                out_path,
                name=name,
                label=name.replace("_", " ").title(),
                group="Core 6",
                engine=f"Demucs {CORE_MODEL}",
                mixable=True,
            )
        )

    instrumental = np.zeros_like(src_audio)
    for name in ["drums", "bass", "guitar", "piano", "other"]:
        data, _ = sf.read(str(produced / f"{name}.wav"), dtype="float32", always_2d=True)
        n = min(len(instrumental), len(data))
        instrumental[:n] += data[:n]
    instrumental_path = stems_dir / "07_instrumental.wav"
    sf.write(str(instrumental_path), instrumental, sr, subtype="PCM_24")
    instrumental_meta = _stem_meta(
        job_dir,
        instrumental_path,
        name="instrumental",
        label="Instrumental",
        group="Core 6",
        engine=f"Demucs {CORE_MODEL}",
        mixable=False,
    )

    n = min(len(src_audio), len(sample_sum))
    err = src_audio[:n] - sample_sum[:n]
    return {
        "model": CORE_MODEL,
        "device": device,
        "sampleRate": int(sr),
        "channels": int(src_audio.shape[1]),
        "durationSec": round(len(src_audio) / sr, 2),
        "stems": core_meta + [instrumental_meta],
        "alignment": {
            "reconErrorDb": _rms_db(err),
            "note": "Core 6 Demucs stems are non-overlapping and reconstruct the source. Deep targets are independent isolates and may overlap.",
        },
    }


def _cuda_available() -> bool:
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def _sam_package_available() -> bool:
    return importlib.util.find_spec("sam_audio") is not None


def _load_sam():
    global _sam_model, _sam_processor, _sam_device
    if _sam_model is not None and _sam_processor is not None:
        return _sam_model, _sam_processor, _sam_device
    if not _sam_package_available():
        raise RuntimeError(
            "SAM-Audio is not installed. Deploy the GPU worker with requirements-gpu.txt / Dockerfile.gpu."
        )

    with _sam_lock:
        if _sam_model is not None and _sam_processor is not None:
            return _sam_model, _sam_processor, _sam_device
        import torch
        from sam_audio import SAMAudio, SAMAudioProcessor

        device = os.environ.get("SAM_AUDIO_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
        if device == "cuda" and not torch.cuda.is_available():
            raise RuntimeError("SAM_AUDIO_DEVICE=cuda but CUDA is not available on this worker.")

        processor = SAMAudioProcessor.from_pretrained(SAM_MODEL_NAME)
        model = SAMAudio.from_pretrained(SAM_MODEL_NAME).eval().to(device)
        _sam_model = model
        _sam_processor = processor
        _sam_device = device
        return model, processor, device


def _separate_sam_target(job_dir: Path, source_wav: Path, target: dict, index: int) -> dict:
    import torch
    import torchaudio

    model, processor, device = _load_sam()
    batch = processor(
        audios=[str(source_wav)],
        descriptions=[target["prompt"]],
    ).to(device)

    with torch.inference_mode():
        result = model.separate(
            batch,
            predict_spans=SAM_PREDICT_SPANS,
            reranking_candidates=SAM_RERANK_CANDIDATES,
        )

    audio = result.target.detach().cpu()
    if audio.dim() == 3:
        audio = audio[0]
    if audio.dim() == 1:
        audio = audio.unsqueeze(0)

    deep_dir = job_dir / "deep"
    deep_dir.mkdir(parents=True, exist_ok=True)
    out_path = deep_dir / f"{index:02d}_{target['id']}.wav"
    torchaudio.save(str(out_path), audio, int(processor.audio_sampling_rate))
    return _stem_meta(
        job_dir,
        out_path,
        name=target["id"],
        label=target["label"],
        group=target["group"],
        engine=f"SAM-Audio {SAM_MODEL_NAME}",
        mixable=False,
        prompt=target["prompt"],
    )


def _parse_targets(raw: str | None) -> list[dict]:
    if not raw:
        return []
    try:
        ids = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "targets must be a JSON array of target ids") from exc
    if not isinstance(ids, list) or not all(isinstance(item, str) for item in ids):
        raise HTTPException(400, "targets must be a JSON array of target ids")
    unique_ids = list(dict.fromkeys(ids))
    if len(unique_ids) > MAX_DEEP_TARGETS:
        raise HTTPException(400, f"Too many deep targets. Worker limit is {MAX_DEEP_TARGETS}.")
    unknown = [item for item in unique_ids if item not in TARGET_BY_ID]
    if unknown:
        raise HTTPException(400, f"Unknown target ids: {', '.join(unknown[:8])}")
    return [TARGET_BY_ID[item] for item in unique_ids]


def _run_job(job_dir: Path, source_wav: Path, mode: str, targets: list[dict]) -> dict:
    result = _separate_core(job_dir, source_wav)
    warnings = [
        "AI-separated stems are estimates, not the original studio multitracks.",
        f"Core mixer: {CORE_MODEL}.",
    ]
    failed_targets = []

    if mode == "deep" and targets:
        if not _sam_package_available():
            warnings.append(
                "Deep 50+ targets were requested but SAM-Audio is not installed on this worker."
            )
        else:
            for idx, target in enumerate(targets, start=1):
                if target["id"] in CORE_TARGET_ALIASES:
                    warnings.append(
                        f"{target['label']} already exists as a Core 6 stem; reused the Demucs stem."
                    )
                    continue
                try:
                    result["stems"].append(_separate_sam_target(job_dir, source_wav, target, idx))
                except Exception as exc:
                    failed_targets.append({"id": target["id"], "error": str(exc)[-500:]})

    if mode == "deep":
        warnings.append(
            "Deep target stems are text-prompt isolates. They can overlap each other, so do not sum all deep targets as if they were original multitracks."
        )

    return {
        **result,
        "mode": mode,
        "requestedTargets": [target["id"] for target in targets],
        "failedTargets": failed_targets,
        "warnings": warnings,
        "engines": {
            "core": f"Demucs {CORE_MODEL}",
            "deep": f"SAM-Audio {SAM_MODEL_NAME}",
        },
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "version": "2.0.0",
        "coreModel": CORE_MODEL,
        "coreStems": CORE_STEMS,
        "deepTargetCount": len(TARGETS),
        "samAudio": {
            "installed": _sam_package_available(),
            "model": SAM_MODEL_NAME,
            "cudaAvailable": _cuda_available(),
            "hfTokenPresent": bool(os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")),
        },
    }


@app.get("/catalog")
def catalog() -> dict:
    sam_ready = _sam_package_available()
    return {
        "count": len(TARGETS),
        "targets": [{**target, "available": sam_ready} for target in TARGETS],
        "coreStems": CORE_STEMS,
        "samAudioInstalled": sam_ready,
        "samAudioModel": SAM_MODEL_NAME,
        "maxDeepTargets": MAX_DEEP_TARGETS,
    }


@app.post("/separate")
async def separate(
    file: UploadFile = File(...),
    mode: str = Form("deep"),
    targets: str | None = Form(None),
) -> dict:
    if mode not in {"core", "deep"}:
        raise HTTPException(400, "mode must be 'core' or 'deep'")
    selected_targets = _parse_targets(targets) if mode == "deep" else []

    job_id = uuid.uuid4().hex[:12]
    job_dir = DATA_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "audio").suffix or ".bin"
    upload = job_dir / f"source{suffix}"
    with upload.open("wb") as output:
        shutil.copyfileobj(file.file, output)

    source_wav = job_dir / "source.wav"
    try:
        await run_in_threadpool(_decode_to_wav, upload, source_wav)
        result = await run_in_threadpool(_run_job, job_dir, source_wav, mode, selected_targets)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc)[-1200:]) from exc

    return {
        "jobId": job_id,
        "source": {"filename": file.filename},
        **result,
    }


@app.post("/separate/demo")
async def separate_demo() -> dict:
    job_id = uuid.uuid4().hex[:12]
    job_dir = DATA_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    source_wav = job_dir / "source.wav"
    try:
        await run_in_threadpool(
            _run,
            [
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=110:duration=12",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:duration=12",
                "-f",
                "lavfi",
                "-i",
                "anoisesrc=d=12:color=pink",
                "-filter_complex",
                "[2]highpass=f=5000,volume=0.6[perc];"
                "[0]volume=0.8[bass];[1]volume=0.5[mel];"
                "[bass][mel][perc]amix=inputs=3:duration=longest:normalize=0[mix]",
                "-map",
                "[mix]",
                "-ac",
                "2",
                "-ar",
                "44100",
                str(source_wav),
            ],
        )
        result = await run_in_threadpool(_run_job, job_dir, source_wav, "core", [])
    except Exception as exc:
        raise HTTPException(500, str(exc)[-1200:]) from exc
    return {"jobId": job_id, "source": {"filename": "demo-mixture.wav"}, **result}


@app.get("/jobs/{job_id}/{file_path:path}")
def get_job_file(job_id: str, file_path: str) -> FileResponse:
    if ".." in job_id or ".." in file_path:
        raise HTTPException(404, "file not found")
    job_dir = (DATA_DIR / job_id).resolve()
    path = (job_dir / file_path).resolve()
    if job_dir not in path.parents or not path.is_file():
        raise HTTPException(404, "file not found")
    media_type = "audio/wav" if path.suffix.lower() == ".wav" else "application/octet-stream"
    return FileResponse(str(path), media_type=media_type, filename=path.name)
