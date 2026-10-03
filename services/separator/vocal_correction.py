from __future__ import annotations

import math
import re
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf

NOTE_CLASS = {"C": 0, "C#": 1, "DB": 1, "D": 2, "D#": 3, "EB": 3, "E": 4, "F": 5, "F#": 6, "GB": 6,
              "G": 7, "G#": 8, "AB": 8, "A": 9, "A#": 10, "BB": 10, "B": 11}
MAJOR = (0, 2, 4, 5, 7, 9, 11)
MINOR = (0, 2, 3, 5, 7, 8, 10)


def correction_capabilities() -> dict[str, Any]:
    try:
        import librosa  # noqa: F401
        librosa_ready = True
    except Exception:
        librosa_ready = False
    return {
        "ready": bool(librosa_ready and shutil.which("rubberband")),
        "pitchDetector": "librosa-pyin",
        "pitchEngine": "rubberband-r3" if shutil.which("rubberband") else None,
        "formantPreserving": bool(shutil.which("rubberband")),
        "phraseAlignment": True,
        "globalTimeStretch": False,
    }


def _scale_classes(key: str) -> set[int]:
    text = (key or "").strip().upper().replace("♯", "#").replace("♭", "B")
    match = re.search(r"([A-G](?:#|B)?)", text)
    if not match:
        return set(range(12))
    root = NOTE_CLASS.get(match.group(1), 0)
    intervals = MINOR if "MINOR" in text or re.search(r"\bMIN\b", text) else MAJOR if "MAJOR" in text or re.search(r"\bMAJ\b", text) else tuple(range(12))
    return {(root + interval) % 12 for interval in intervals}


def _nearest_scale_midi(value: float, allowed: set[int]) -> float:
    base = int(round(value))
    choices = [note for note in range(base - 6, base + 7) if note % 12 in allowed]
    return float(min(choices, key=lambda note: abs(note - value))) if choices else float(base)


def _fit_length(audio: np.ndarray, frames: int, channels: int) -> np.ndarray:
    if audio.ndim == 1:
        audio = audio[:, None]
    if audio.shape[1] != channels:
        if audio.shape[1] == 1 and channels > 1:
            audio = np.repeat(audio, channels, axis=1)
        else:
            audio = audio[:, :channels]
    if len(audio) > frames:
        return audio[:frames]
    if len(audio) < frames:
        return np.pad(audio, ((0, frames - len(audio)), (0, 0)))
    return audio


def _pitch_segment(segment: np.ndarray, sample_rate: int, semitones: float, scratch: Path) -> tuple[np.ndarray, bool]:
    token = uuid.uuid4().hex[:10]
    source = scratch / f"pitch-{token}-in.wav"
    output = scratch / f"pitch-{token}-out.wav"
    sf.write(source, segment, sample_rate, subtype="FLOAT")
    commands = [
        ["rubberband", "-3", "-F", "-p", f"{semitones:.6f}", str(source), str(output)],
        ["rubberband", "-3", "-p", f"{semitones:.6f}", str(source), str(output)],
    ]
    formant = True
    error = ""
    for index, command in enumerate(commands):
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode == 0 and output.is_file():
            shifted, _ = sf.read(output, dtype="float32", always_2d=True)
            source.unlink(missing_ok=True)
            output.unlink(missing_ok=True)
            return _fit_length(shifted, len(segment), segment.shape[1]), formant
        error = result.stderr[-1000:]
        formant = False
    source.unlink(missing_ok=True)
    output.unlink(missing_ok=True)
    raise RuntimeError(f"Rubber Band pitch correction failed: {error}")


def _pitch_correct(audio: np.ndarray, sample_rate: int, key: str, amount: float, scratch: Path) -> tuple[np.ndarray, dict[str, Any]]:
    if amount <= 0:
        return audio.copy(), {"segments": 0, "appliedSegments": 0, "meanAbsCents": 0.0, "formantPreserved": True}
    try:
        import librosa
    except Exception as exc:
        raise RuntimeError("Pitch correction requires librosa on the worker image.") from exc
    if not shutil.which("rubberband"):
        raise RuntimeError("Pitch correction requires rubberband-cli on the worker image.")

    mono = np.mean(audio, axis=1)
    hop = 256
    f0, voiced, probability = librosa.pyin(
        mono,
        fmin=55.0,
        fmax=1046.5,
        sr=sample_rate,
        frame_length=2048,
        hop_length=hop,
        fill_na=np.nan,
    )
    midi = np.full_like(f0, np.nan, dtype=np.float64)
    valid = np.isfinite(f0) & voiced & (probability >= 0.45)
    midi[valid] = 69.0 + 12.0 * np.log2(f0[valid] / 440.0)
    allowed = _scale_classes(key)

    frame_targets: list[int | None] = []
    for value in midi:
        frame_targets.append(None if not np.isfinite(value) else int(round(_nearest_scale_midi(float(value), allowed))))

    groups: list[tuple[int, int, int]] = []
    start = None
    target = None
    for index, candidate in enumerate(frame_targets + [None]):
        if candidate is not None and start is None:
            start, target = index, candidate
            continue
        if start is not None and candidate == target:
            continue
        if start is not None:
            groups.append((start, index, int(target)))
            start = None
            target = None
        if candidate is not None:
            start, target = index, candidate

    out = audio.copy()
    applied = 0
    abs_cents: list[float] = []
    all_formant = True
    strength = max(0.0, min(1.0, amount / 100.0))
    for frame_start, frame_end, target_note in groups[:180]:
        if frame_end - frame_start < 5:
            continue
        values = midi[frame_start:frame_end]
        values = values[np.isfinite(values)]
        if values.size == 0:
            continue
        source_note = float(np.median(values))
        semitones = max(-3.0, min(3.0, (target_note - source_note) * strength))
        if abs(semitones) < 0.045:
            continue
        sample_start = max(0, int(frame_start * hop - sample_rate * 0.018))
        sample_end = min(len(out), int(frame_end * hop + sample_rate * 0.018))
        if sample_end - sample_start < int(sample_rate * 0.09):
            continue
        segment = out[sample_start:sample_end].copy()
        shifted, formant = _pitch_segment(segment, sample_rate, semitones, scratch)
        all_formant = all_formant and formant
        fade = min(int(sample_rate * 0.018), max(1, len(segment) // 4))
        window = np.ones(len(segment), dtype=np.float32)
        if fade > 1:
            ramp = np.linspace(0.0, 1.0, fade, endpoint=False, dtype=np.float32)
            window[:fade] = ramp
            window[-fade:] = ramp[::-1]
        out[sample_start:sample_end] = out[sample_start:sample_end] * (1.0 - window[:, None]) + shifted * window[:, None]
        applied += 1
        abs_cents.append(abs(semitones) * 100.0)

    return out, {
        "segments": len(groups),
        "appliedSegments": applied,
        "meanAbsCents": round(float(np.mean(abs_cents)) if abs_cents else 0.0, 1),
        "formantPreserved": all_formant,
        "detector": "librosa-pyin",
    }


def _phrases(audio: np.ndarray, sample_rate: int) -> list[tuple[int, int]]:
    mono = np.mean(audio, axis=1)
    frame = max(1, int(sample_rate * 0.020))
    hop = max(1, int(sample_rate * 0.010))
    if len(mono) < frame:
        return []
    rms = []
    for start in range(0, len(mono) - frame + 1, hop):
        chunk = mono[start:start + frame]
        rms.append(float(np.sqrt(np.mean(chunk * chunk))))
    if not rms:
        return []
    peak = max(rms)
    if peak < 1e-6:
        return []
    threshold = max(10 ** (-48 / 20), peak * 0.075)
    active = [value >= threshold for value in rms]
    intervals: list[tuple[int, int]] = []
    start = None
    for index, yes in enumerate(active + [False]):
        if yes and start is None:
            start = index
        elif not yes and start is not None:
            intervals.append((start * hop, min(len(audio), index * hop + frame)))
            start = None
    merged: list[tuple[int, int]] = []
    gap = int(sample_rate * 0.14)
    pad = int(sample_rate * 0.035)
    for left, right in intervals:
        left = max(0, left - pad)
        right = min(len(audio), right + pad)
        if merged and left - merged[-1][1] <= gap:
            merged[-1] = (merged[-1][0], right)
        else:
            merged.append((left, right))
    return [(left, right) for left, right in merged if right - left >= int(sample_rate * 0.11)]


def _move_phrases(audio: np.ndarray, sample_rate: int, amount: float, bpm: float | None, reference: np.ndarray | None) -> tuple[np.ndarray, dict[str, Any]]:
    source_phrases = _phrases(audio, sample_rate)
    if amount <= 0 or not source_phrases:
        return audio.copy(), {"phrases": len(source_phrases), "movedPhrases": 0, "maxShiftMs": 0.0, "referenceAligned": False}
    ref_phrases = _phrases(reference, sample_rate) if reference is not None else []
    strength = max(0.0, min(1.0, amount / 100.0))
    max_shift = int(sample_rate * 0.12)
    moves: list[tuple[int, int, int]] = []
    for index, (left, right) in enumerate(source_phrases):
        if ref_phrases:
            if len(source_phrases) == 1:
                ref_index = 0
            else:
                ref_index = round(index * (len(ref_phrases) - 1) / max(1, len(source_phrases) - 1))
            target = ref_phrases[min(ref_index, len(ref_phrases) - 1)][0]
        elif bpm and bpm > 0:
            grid = sample_rate * (60.0 / bpm) / 4.0
            target = int(round(left / grid) * grid)
        else:
            continue
        delta = int(max(-max_shift, min(max_shift, target - left)) * strength)
        if abs(delta) >= int(sample_rate * 0.004):
            moves.append((left, right, delta))

    out = audio.copy()
    max_seen = 0
    for left, right, delta in moves:
        segment = audio[left:right].copy()
        length = len(segment)
        fade = min(int(sample_rate * 0.02), max(1, length // 5))
        window = np.ones(length, dtype=np.float32)
        if fade > 1:
            ramp = np.linspace(0.0, 1.0, fade, endpoint=False, dtype=np.float32)
            window[:fade] = ramp
            window[-fade:] = ramp[::-1]
        out[left:right] *= (1.0 - window[:, None])
        target_left = max(0, min(len(out) - 1, left + delta))
        target_right = min(len(out), target_left + length)
        usable = target_right - target_left
        if usable > 0:
            out[target_left:target_right] += segment[:usable] * window[:usable, None]
        max_seen = max(max_seen, abs(delta))

    return out, {
        "phrases": len(source_phrases),
        "movedPhrases": len(moves),
        "maxShiftMs": round(max_seen * 1000.0 / sample_rate, 1),
        "referenceAligned": bool(ref_phrases),
        "referencePhraseCount": len(ref_phrases),
        "grid": "reference-phrase-onsets" if ref_phrases else ("1/16-note" if bpm else "none"),
    }


def correct_vocal(
    source_path: Path,
    output_path: Path,
    *,
    key: str = "",
    bpm: float | None = None,
    pitch_amount: float = 60.0,
    timing_tightness: float = 35.0,
    reference_path: Path | None = None,
) -> dict[str, Any]:
    caps = correction_capabilities()
    if not caps["ready"]:
        raise RuntimeError("Vocal correction engine is not ready; librosa and rubberband-cli are required.")
    audio, sample_rate = sf.read(str(source_path), dtype="float32", always_2d=True)
    if audio.size == 0:
        raise RuntimeError("Vocal file contained no audio.")
    reference = None
    if reference_path and reference_path.is_file():
        reference, reference_rate = sf.read(str(reference_path), dtype="float32", always_2d=True)
        if reference_rate != sample_rate:
            raise RuntimeError("Reference vocal sample rate must match the source after worker decoding.")
        if reference.shape[1] != audio.shape[1]:
            reference = np.mean(reference, axis=1, keepdims=True)
            if audio.shape[1] > 1:
                reference = np.repeat(reference, audio.shape[1], axis=1)

    scratch = output_path.parent
    pitched, pitch_meta = _pitch_correct(audio, sample_rate, key, pitch_amount, scratch)
    aligned, timing_meta = _move_phrases(pitched, sample_rate, timing_tightness, bpm, reference)
    peak = float(np.max(np.abs(aligned))) if aligned.size else 0.0
    gain_reduction_db = 0.0
    if peak > 0.995:
        scale = 0.995 / peak
        aligned *= scale
        gain_reduction_db = 20.0 * math.log10(scale)
    sf.write(output_path, aligned, sample_rate, subtype="FLOAT")
    return {
        "engine": "TM Vocal Correction v1",
        "sampleRate": int(sample_rate),
        "channels": int(aligned.shape[1]),
        "durationSec": round(len(aligned) / sample_rate, 3),
        "key": key or None,
        "bpm": None if not bpm else round(float(bpm), 3),
        "pitchAmount": round(float(pitch_amount), 1),
        "timingTightness": round(float(timing_tightness), 1),
        "pitch": pitch_meta,
        "timing": timing_meta,
        "safetyGainDb": round(gain_reduction_db, 3),
        "order": ["note-region pitch correction", "phrase-onset alignment"],
        "globalTimeStretch": False,
    }
