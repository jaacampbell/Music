"""Audio I/O: FFmpeg-based decode, convert, and probe."""

from __future__ import annotations

import subprocess
import json
from pathlib import Path

import soundfile as sf
import numpy as np

from app.models.project import SourceInfo


SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".flac", ".aiff", ".aif", ".m4a", ".mp4", ".ogg", ".opus"}


def probe_audio(path: Path) -> dict:
    """Return ffprobe metadata dict for the given file."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr.strip()}")
    return json.loads(result.stdout)


def build_source_info(original_path: Path, probe_data: dict) -> SourceInfo:
    """Parse ffprobe output into SourceInfo."""
    audio_streams = [s for s in probe_data.get("streams", []) if s.get("codec_type") == "audio"]
    fmt = probe_data.get("format", {})

    stream = audio_streams[0] if audio_streams else {}
    duration = float(fmt.get("duration") or stream.get("duration") or 0.0)
    sample_rate = int(stream.get("sample_rate") or 0)
    channels = int(stream.get("channels") or 0)
    codec = stream.get("codec_name")
    size_bytes = int(fmt.get("size") or 0)
    file_ext = original_path.suffix.lower().lstrip(".")

    return SourceInfo(
        file=f"source/{original_path.name}",
        format=file_ext or codec or "unknown",
        duration_seconds=round(duration, 3),
        sample_rate=sample_rate,
        channels=channels,
        codec=codec,
        size_bytes=size_bytes,
    )


def decode_to_wav(
    input_path: Path,
    output_path: Path,
    sample_rate: int = 44100,
    channels: int = 2,
    bit_depth: int = 24,
) -> Path:
    """
    Decode any audio file to a normalized PCM WAV.
    Returns the output path.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Map bit_depth to ffmpeg sample format
    fmt_map = {16: "s16", 24: "s32", 32: "f32le"}
    sample_fmt = fmt_map.get(bit_depth, "s32")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vn",                          # drop video if present
        "-acodec", "pcm_s32le" if bit_depth == 24 else f"pcm_{sample_fmt}",
        "-ar", str(sample_rate),
        "-ac", str(channels),
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg decode failed: {result.stderr[-500:]}")
    return output_path


def read_audio(path: Path) -> tuple[np.ndarray, int]:
    """Read a WAV file; returns (audio_array [samples, channels], sample_rate)."""
    data, sr = sf.read(str(path), always_2d=True)
    return data, sr


def write_audio(path: Path, audio: np.ndarray, sample_rate: int, subtype: str = "PCM_24") -> None:
    """Write a numpy array to a WAV file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sample_rate, subtype=subtype)


def get_duration_seconds(path: Path) -> float:
    """Fast duration probe without loading the file."""
    data = probe_audio(path)
    fmt = data.get("format", {})
    return float(fmt.get("duration") or 0.0)
