"""Stem separation using Demucs."""

from __future__ import annotations

import subprocess
import shutil
import time
from pathlib import Path

import soundfile as sf
import numpy as np

from app.models.project import StemInfo


# Maps user-facing mode names to Demucs model names and expected output stems
SEPARATION_MODES: dict[str, dict] = {
    "2stem": {
        "model": "htdemucs",
        "stems": ["vocals", "no_vocals"],
        "labels": ["Vocals", "No Vocals (Instrumental)"],
    },
    "4stem": {
        "model": "htdemucs",
        "stems": ["vocals", "drums", "bass", "other"],
        "labels": ["Vocals", "Drums", "Bass", "Other"],
    },
    "6stem": {
        "model": "htdemucs_6s",
        "stems": ["vocals", "drums", "bass", "guitar", "piano", "other"],
        "labels": ["Vocals", "Drums", "Bass", "Guitar", "Piano / Keys", "Other"],
    },
}

# Fine-tuned model is also available and uses same 4-stem layout
MODEL_ALIASES: dict[str, str] = {
    "htdemucs": "htdemucs",
    "htdemucs_ft": "htdemucs_ft",
    "htdemucs_6s": "htdemucs_6s",
}


def _demucs_output_dir(out_root: Path, model_name: str, source_stem: str) -> Path:
    """Demucs places output in <out_root>/<model_name>/<source_stem_without_ext>/"""
    return out_root / model_name / source_stem


def separate_stems(
    source_wav: Path,
    output_dir: Path,
    model: str = "htdemucs",
    mode: str = "4stem",
    sample_rate: int = 44100,
    bit_depth: int = 24,
    progress_callback=None,
) -> list[StemInfo]:
    """
    Run Demucs on source_wav and write separated stems to output_dir.
    Returns a list of StemInfo objects.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    mode_cfg = SEPARATION_MODES.get(mode, SEPARATION_MODES["4stem"])
    resolved_model = MODEL_ALIASES.get(model, model)

    # Demucs uses the model from the mode config if model is generic
    if mode == "6stem" and "htdemucs" in resolved_model and "6s" not in resolved_model:
        resolved_model = "htdemucs_6s"

    t0 = time.time()

    # Call demucs CLI
    cmd = [
        "python", "-m", "demucs",
        "--two-stems", "vocals" if mode == "2stem" else "",
        "-n", resolved_model,
        "--out", str(output_dir),
        "--mp3" if source_wav.suffix.lower() == ".mp3" else "",
        str(source_wav),
    ]
    # Remove empty strings
    cmd = [c for c in cmd if c]

    if progress_callback:
        progress_callback(10, "Running stem separation...")

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    if result.returncode != 0:
        raise RuntimeError(f"Demucs failed: {result.stderr[-600:]}")

    processing_time = round(time.time() - t0, 1)

    if progress_callback:
        progress_callback(85, "Collecting separated stems...")

    # Locate Demucs output directory
    source_name = source_wav.stem
    demucs_out = _demucs_output_dir(output_dir, resolved_model, source_name)

    if not demucs_out.exists():
        # Try to find it — Demucs might vary directory names
        candidates = list(output_dir.rglob("*.wav"))
        if not candidates:
            raise FileNotFoundError(f"Demucs output not found under {output_dir}")
        demucs_out = candidates[0].parent

    stem_infos: list[StemInfo] = []
    expected_stems = mode_cfg["stems"]
    labels = mode_cfg["labels"]

    # Handle 2stem special case: Demucs outputs vocals + no_vocals
    if mode == "2stem":
        # Demucs --two-stems vocals outputs vocals.wav + no_vocals.wav
        for stem_name, label in zip(expected_stems, labels):
            src = demucs_out / f"{stem_name}.wav"
            if not src.exists():
                # Fallback name mapping
                alt_map = {"no_vocals": "no_vocals", "vocals": "vocals"}
                src = demucs_out / f"{alt_map.get(stem_name, stem_name)}.wav"

            _validate_and_copy_stem(src, output_dir, stem_name)
            info = _build_stem_info(output_dir / f"{stem_name}.wav", stem_name, label)
            stem_infos.append(info)
    else:
        for stem_name, label in zip(expected_stems, labels):
            src = demucs_out / f"{stem_name}.wav"
            if not src.exists():
                raise FileNotFoundError(f"Expected stem not found: {src}")
            _validate_and_copy_stem(src, output_dir, stem_name)
            info = _build_stem_info(output_dir / f"{stem_name}.wav", stem_name, label)
            stem_infos.append(info)

    # Clean up Demucs intermediate directory
    if demucs_out.parent.exists() and demucs_out.parent != output_dir:
        shutil.rmtree(demucs_out.parent, ignore_errors=True)

    if progress_callback:
        progress_callback(100, "Stem separation complete")

    return stem_infos, processing_time


def _validate_and_copy_stem(src: Path, dest_dir: Path, name: str) -> Path:
    """Copy stem file to dest_dir/<name>.wav if not already there."""
    dest = dest_dir / f"{name}.wav"
    if src.resolve() != dest.resolve():
        shutil.copy2(src, dest)
    return dest


def _build_stem_info(wav_path: Path, name: str, label: str) -> StemInfo:
    """Build StemInfo by reading metadata from the WAV file."""
    info = sf.info(str(wav_path))
    return StemInfo(
        name=name,
        label=label,
        file=f"stems/{name}.wav",
        format="wav",
        sample_rate=info.samplerate,
        channels=info.channels,
        bit_depth=24,
        duration_seconds=round(info.duration, 4),
        start_time_seconds=0.0,
    )
