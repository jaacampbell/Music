#!/usr/bin/env python3
"""TM Stem Director local six-stem export. Requires demucs, torch, ffmpeg."""
from __future__ import annotations
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path

STEMS = ("vocals", "drums", "bass", "guitar", "piano", "other")

def status(path: Path, state: str, **extra: object) -> None:
    payload = {"status": state, "updated_at": time.time(), **extra}
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)

def main() -> int:
    parser = argparse.ArgumentParser(description="Separate an audio file into six aligned WAV stems.")
    parser.add_argument("audio", type=Path)
    parser.add_argument("--output", type=Path, default=Path.home() / "Music" / "TM Music Studio" / "Stems")
    parser.add_argument("--device", choices=("cpu", "cuda", "mps"), default="cpu")
    args = parser.parse_args()
    audio = args.audio.expanduser().resolve()
    if not audio.is_file() or audio.suffix.lower() not in {".wav", ".mp3", ".flac", ".aiff", ".aif", ".ogg", ".m4a"}:
        parser.error("Supply an existing supported audio file.")
    if shutil.which("ffmpeg") is None:
        parser.error("ffmpeg is required; install it first.")
    out = args.output.expanduser().resolve() / audio.stem
    out.mkdir(parents=True, exist_ok=True)
    state = out / "status.json"
    status(state, "processing", source=str(audio), engine="htdemucs_6s")
    try:
        with tempfile.TemporaryDirectory(prefix="tm-stems-") as td:
            cmd = [sys.executable, "-m", "demucs", "-n", "htdemucs_6s", "-d", args.device, "--out", td, str(audio)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=7200)
            if result.returncode:
                raise RuntimeError((result.stderr or result.stdout)[-3000:])
            source = Path(td) / "htdemucs_6s" / audio.stem
            if not all((source / (name + ".wav")).is_file() for name in STEMS):
                raise RuntimeError("Demucs returned an incomplete six-stem result.")
            files = []
            for i, name in enumerate(STEMS, 1):
                destination = out / f"{i:02d}_{name}.wav"
                shutil.copy2(source / (name + ".wav"), destination)
                files.append(destination)
            archive = out / "stems.zip"
            with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as z:
                for item in files:
                    z.write(item, item.name)
            status(state, "completed", source=str(audio), engine="htdemucs_6s", stems=[str(f) for f in files], archive=str(archive))
            print(json.dumps({"status": "completed", "output": str(out), "archive": str(archive)}, indent=2))
    except Exception as exc:
        status(state, "failed", source=str(audio), error=str(exc))
        print(f"Separation failed: {exc}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
