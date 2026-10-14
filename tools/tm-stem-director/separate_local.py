#!/usr/bin/env python3
"""TM Stem Director local six-stem export. Requires demucs, torch, ffmpeg."""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import threading
import time
import zipfile
from pathlib import Path

from catalog import resolve_targets

STEMS = ("vocals", "drums", "bass", "guitar", "piano", "other")
AUDIO_SUFFIXES = {".wav", ".mp3", ".flac", ".aiff", ".aif", ".ogg", ".m4a"}


def wav_info(path: Path) -> dict[str, object]:
    with path.open("rb") as handle:
        if handle.read(4) != b"RIFF" or handle.read(4) == b"" or handle.read(4) != b"WAVE":
            raise RuntimeError(f"{path.name} is not a playable WAV.")
        audio_format = channels = rate = bits = data_size = None
        while True:
            header = handle.read(8)
            if len(header) < 8:
                break
            ident, size = struct.unpack("<4sI", header)
            if ident == b"fmt ":
                fmt = handle.read(size)
                if len(fmt) < 16:
                    break
                audio_format, channels, rate, _, _, bits = struct.unpack("<HHIIHH", fmt[:16])
                if size % 2:
                    handle.read(1)
            elif ident == b"data":
                data_size = size
                break
            else:
                handle.seek(size + (size % 2), os.SEEK_CUR)
    if audio_format not in {1, 3} or not channels or not rate or not bits or not data_size:
        raise RuntimeError(f"{path.name} is not a playable WAV.")
    frame_bytes = channels * max(bits, 8) // 8
    frames = data_size // frame_bytes
    if frames <= 0:
        raise RuntimeError(f"{path.name} is not a playable WAV.")
    return {
        "name": path.name,
        "frames": frames,
        "sample_rate": rate,
        "channels": channels,
        "sample_width": max(bits, 8) // 8,
        "duration_seconds": frames / rate,
    }


def alignment_report(files: list[Path]) -> dict[str, object]:
    infos = [wav_info(path) for path in files]
    rates = {info["sample_rate"] for info in infos}
    frames = {info["frames"] for info in infos}
    if len(files) != len(STEMS) or len(rates) != 1 or len(frames) != 1:
        detail = ", ".join(f"{info['name']}={info['frames']}@{info['sample_rate']}" for info in infos)
        raise RuntimeError(f"Stem durations or sample rates do not match: {detail}")
    return {
        "aligned": True,
        "sample_rate": infos[0]["sample_rate"],
        "frames": infos[0]["frames"],
        "duration_seconds": infos[0]["duration_seconds"],
        "wavs": infos,
    }


def publish(paths: list[Path], state: str, **extra: object) -> None:
    payload = {"status": state, "updated_at": time.time(), **extra}
    text = json.dumps(payload, indent=2)
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(text, encoding="utf-8")
        temporary.replace(path)


def separate_deep_targets(audio: Path, targets: list[dict], out: Path) -> tuple[list[dict], list[dict]]:
    """Isolate each Deep 60+ prompt with SAM-Audio. Callers check that the package is installed."""
    import torch
    import torchaudio
    from sam_audio import SAMAudio, SAMAudioProcessor

    model_name = os.environ.get("SAM_AUDIO_MODEL", "facebook/sam-audio-small")
    device = os.environ.get("SAM_AUDIO_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
    if device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("SAM_AUDIO_DEVICE=cuda but CUDA is not available.")
    processor = SAMAudioProcessor.from_pretrained(model_name)
    model = SAMAudio.from_pretrained(model_name).eval().to(device)
    produced: list[dict] = []
    failed: list[dict] = []
    predict_spans = os.environ.get("SAM_PREDICT_SPANS", "false").lower() == "true"
    candidates = int(os.environ.get("SAM_RERANK_CANDIDATES", "1"))
    for index, target in enumerate(targets, 1):
        try:
            batch = processor(audios=[str(audio)], descriptions=[str(target["prompt"])]).to(device)
            with torch.inference_mode():
                result = model.separate(batch, predict_spans=predict_spans, reranking_candidates=candidates)
            tensor = result.target.detach().cpu()
            if tensor.dim() == 3:
                tensor = tensor[0]
            if tensor.dim() == 1:
                tensor = tensor.unsqueeze(0)
            destination = out / "deep" / f"{index:02d}_{target['id']}.wav"
            destination.parent.mkdir(parents=True, exist_ok=True)
            torchaudio.save(str(destination), tensor, int(processor.audio_sampling_rate))
            produced.append({"id": target["id"], "label": target["label"], "path": str(destination), "prompt": target["prompt"]})
        except Exception as exc:
            failed.append({"id": str(target["id"]), "error": str(exc)[-500:]})
    return produced, failed


def main() -> int:
    parser = argparse.ArgumentParser(description="Separate an audio file into six aligned WAV stems.")
    parser.add_argument("audio", type=Path)
    parser.add_argument("--output", type=Path, default=Path.home() / "Music" / "TM Music Studio" / "Stems")
    parser.add_argument("--device", choices=("cpu", "cuda", "mps"), default="cpu")
    parser.add_argument("--progress-file", type=Path)
    parser.add_argument("--mode", choices=("core", "deep"), default="core")
    parser.add_argument("--targets", default="", help="Comma-separated Deep 60+ target ids")
    args = parser.parse_args()
    audio = args.audio.expanduser().resolve()
    if not audio.is_file() or audio.suffix.lower() not in AUDIO_SUFFIXES:
        parser.error("Supply an existing supported audio file.")
    out = args.output.expanduser().resolve() / audio.stem
    out.mkdir(parents=True, exist_ok=True)
    mirrors = [out / "status.json"]
    if args.progress_file:
        mirrors.append(args.progress_file.expanduser().resolve())
    selected: list[dict] = []
    if args.mode == "deep":
        try:
            selected = resolve_targets([part.strip() for part in args.targets.split(",") if part.strip()])
        except ValueError as exc:
            parser.error(str(exc))
        if importlib.util.find_spec("sam_audio") is None:
            message = "Deep 60+ needs SAM-Audio on this computer. Core 6 does not. Stem Studio and Stem Director run Deep 60+ on a CUDA worker when this machine does not have the model."
            publish(mirrors, "failed", progress=100, stage="failed", source=str(audio), engine="htdemucs_6s", mode="deep", targets=[item["id"] for item in selected], aligned=False, error=message)
            print(message, file=sys.stderr)
            return 1
    if shutil.which("ffmpeg") is None:
        parser.error("ffmpeg is required; install it first.")
    publish(mirrors, "processing", progress=1, stage="preparing", source=str(audio), engine="htdemucs_6s", mode=args.mode)
    try:
        with tempfile.TemporaryDirectory(prefix="tm-stems-") as temporary:
            command = [sys.executable, "-m", "demucs", "-n", "htdemucs_6s", "-d", args.device, "--out", temporary, str(audio)]
            environment = os.environ.copy()
            environment["PYTHONUNBUFFERED"] = "1"
            publish(mirrors, "processing", progress=5, stage="separating", source=str(audio), engine="htdemucs_6s")
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=environment)
            stdout_lines: list[str] = []

            def drain_stdout() -> None:
                if process.stdout is not None:
                    stdout_lines.extend(process.stdout)

            threading.Thread(target=drain_stdout, daemon=True).start()
            stderr_lines: list[str] = []
            timer = threading.Timer(7200, process.kill)
            timer.start()
            try:
                assert process.stderr is not None
                for line in process.stderr:
                    stderr_lines.append(line)
                    match = re.search(r"(?<!\d)(\d{1,3})%", line)
                    if match:
                        percent = min(100, int(match.group(1)))
                        publish(mirrors, "processing", progress=5 + int(percent * 0.85), stage="separating", source=str(audio), engine="htdemucs_6s")
                code = process.wait()
            finally:
                timer.cancel()
            if code:
                detail = "".join(stderr_lines) or "".join(stdout_lines) or "Demucs failed."
                raise RuntimeError(detail[-3000:])
            source = Path(temporary) / "htdemucs_6s" / audio.stem
            if not all((source / f"{name}.wav").is_file() for name in STEMS):
                raise RuntimeError("Demucs returned an incomplete six-stem result.")
            publish(mirrors, "processing", progress=92, stage="exporting", source=str(audio), engine="htdemucs_6s")
            files: list[Path] = []
            for index, name in enumerate(STEMS, 1):
                destination = out / f"{index:02d}_{name}.wav"
                shutil.copy2(source / f"{name}.wav", destination)
                files.append(destination)
            report = alignment_report(files)
            deep_stems: list[dict] = []
            failed_targets: list[dict] = []
            if selected:
                publish(mirrors, "processing", progress=94, stage="deep-60", source=str(audio), engine="htdemucs_6s", mode="deep")
                deep_stems, failed_targets = separate_deep_targets(audio, selected, out)
                if not deep_stems:
                    detail = "; ".join(item["error"] for item in failed_targets) or "no isolates"
                    raise RuntimeError(f"Deep 60+ produced no playable isolates. {detail}")
            archive = out / "stems.zip"
            with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
                for item in files:
                    bundle.write(item, item.name)
                for item in deep_stems:
                    bundle.write(item["path"], Path(item["path"]).name)
            publish(
                mirrors,
                "completed",
                progress=100,
                stage="completed",
                source=str(audio),
                engine="htdemucs_6s+sam-audio" if selected else "htdemucs_6s",
                mode=args.mode,
                targets=[item["id"] for item in selected],
                stems=[str(item) for item in files],
                deep_stems=deep_stems,
                failed_targets=failed_targets,
                archive=str(archive),
                aligned=True,
                sample_rate=report["sample_rate"],
                frames=report["frames"],
                duration_seconds=report["duration_seconds"],
            )
            print(json.dumps({"status": "completed", "output": str(out), "archive": str(archive)}, indent=2))
    except Exception as exc:
        publish(mirrors, "failed", progress=100, stage="failed", source=str(audio), engine="htdemucs_6s", aligned=False, error=str(exc))
        print(f"Separation failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
