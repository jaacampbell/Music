"""Music OS aligned Core-6 restoration; deep isolates are deliberately excluded.
Reference EQ is computed on the SUM and applied identically to each stem.
"""
from __future__ import annotations
import json
import math
import shutil
import zipfile
from pathlib import Path
from typing import Any
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import gaussian_filter1d
from .engine import CleanupSettings, process_stem
from .quality import inspect_pair, QualityLimits

CORE_NAMES = ("vocals", "drums", "bass", "guitar", "piano", "other")
MAX_EQ_DB = 4.0
FFT_SIZE = 4096

def _audio(path: Path) -> tuple[np.ndarray, int]:
    samples, sample_rate = sf.read(str(path), always_2d=True, dtype="float64")
    if not len(samples) or samples.ndim != 2 or samples.shape[1] not in (1, 2):
        raise ValueError("Expected mono or stereo audio")
    if not np.isfinite(samples).all():
        raise ValueError("Non-finite audio samples")
    return samples, sample_rate

def _core_stem_paths(job_dir: Path) -> dict[str, Path]:
    manifest_path = job_dir / "manifest.json"
    if not manifest_path.is_file():
        raise ValueError("Completed separation manifest not found")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    result: dict[str, Path] = {}
    for stem in manifest.get("stems", []):
        if stem.get("name") not in CORE_NAMES or stem.get("group") != "Core 6" or stem.get("mixable") is not True:
            continue
        name = stem["name"]
        if name in result:
            raise ValueError(f"Duplicate Core 6 stem: {name}")
        relative = stem.get("file", "")
        if not isinstance(relative, str):
            raise ValueError("Invalid stem path")
        path = (job_dir / relative).resolve()
        if job_dir.resolve() not in path.parents or path.suffix.lower() != ".wav" or not path.is_file():
            raise ValueError("Core 6 stem file missing or outside job")
        result[name] = path
    missing = set(CORE_NAMES) - set(result)
    if missing:
        raise ValueError(f"Missing Core 6 stems: {', '.join(sorted(missing))}")
    return result

def _tonal_profile(data: np.ndarray, rate: int) -> np.ndarray:
    mono = np.mean(data, axis=1)
    nperseg = min(FFT_SIZE, len(mono))
    _, psd = signal.welch(mono, fs=rate, nperseg=nperseg, noverlap=nperseg // 2, scaling="spectrum")
    if nperseg != FFT_SIZE:
        raise ValueError("Reference must contain at least 4096 samples")
    return gaussian_filter1d(np.sqrt(np.maximum(psd, 0)), sigma=25)

def _shared_reference_gains(mix: np.ndarray, sr: int, ref: np.ndarray, ref_sr: int, strength: float) -> np.ndarray:
    if strength <= 0:
        return np.ones(FFT_SIZE // 2 + 1)
    if ref_sr != sr:
        factor = math.gcd(sr, ref_sr)
        ref = signal.resample_poly(ref, sr // factor, ref_sr // factor, axis=0)
    src_p = _tonal_profile(mix, sr)
    ref_p = _tonal_profile(ref, sr)
    eq_db = 20.0 * np.log10(np.maximum(ref_p, 1e-7) / np.maximum(src_p, 1e-7))
    eq_db -= float(np.median(eq_db))
    eq_db = np.clip(eq_db * strength, -MAX_EQ_DB, MAX_EQ_DB)
    return np.power(10.0, eq_db / 20.0)

def _apply_shared_eq(audio: np.ndarray, gains: np.ndarray, sr: int) -> np.ndarray:
    if np.all(gains == 1.0):
        return audio
    result = np.empty_like(audio)
    for channel in range(audio.shape[1]):
        _, _, stft = signal.stft(audio[:, channel], fs=sr, nperseg=FFT_SIZE,
                                noverlap=FFT_SIZE * 3 // 4, boundary="zeros")
        _, output = signal.istft(stft * gains[:, None], fs=sr, nperseg=FFT_SIZE,
                                 noverlap=FFT_SIZE * 3 // 4, boundary=True)
        result[:, channel] = output[:len(audio)]
    return result

def _align(data: np.ndarray, samples: int, channels: int, sr: int) -> np.ndarray:
    if data.shape[1] != channels:
        raise ValueError("Stem channel count disagrees with original")
    if abs(len(data) - samples) > int(sr * 0.2):
        raise ValueError("Stem duration differs from source by over 200ms")
    if len(data) >= samples:
        return data[:samples, :]
    return np.pad(data, ((0, samples - len(data)), (0, 0)))

def restore_core6(job_dir: Path, out_dir: Path, *, reference: Path | None = None,
                  midi: Path | None = None, denoise_strength: float = 0.2,
                  match_strength: float = 0.25) -> dict[str, Any]:
    """Process a completed job without altering the source/stems."""
    if not (0 <= denoise_strength <= 1 and 0 <= match_strength <= 1):
        raise ValueError("Strengths must be between zero and one")
    paths = _core_stem_paths(job_dir)
    source, sr = _audio(job_dir / "source.wav")
    original_count, channels = source.shape
    if original_count < FFT_SIZE:
        raise ValueError("Song too short for spectral processing")
    clean: dict[str, np.ndarray] = {}
    out_dir.mkdir(parents=True, exist_ok=False)
    for name in CORE_NAMES:
        source_stem = paths[name]
        processing = out_dir / f".{name}.processed.wav"
        processing_settings = CleanupSettings(
            highpass_hz=0 if name in ("bass", "drums") else 25,
            denoise_strength=min(denoise_strength, 0.08) if name == "drums" else min(denoise_strength, 0.12) if name == "bass" else denoise_strength,
            match_strength=0.0, peak_ceiling_dbfs=0.0,
        )
        process_stem(str(source_stem), str(processing), settings=processing_settings)
        data, read_sr = _audio(processing)
        processing.unlink(missing_ok=True)
        if read_sr != sr:
            raise ValueError("Stem and source sample rates differ")
        clean[name] = _align(data, original_count, channels, sr)
    mix = sum(clean.values(), np.zeros_like(source))
    ref_audio = ref_sr = None
    if reference is not None:
        ref_audio, ref_sr = _audio(reference)
    gains = _shared_reference_gains(mix, sr, ref_audio, ref_sr, match_strength) if ref_audio is not None else np.ones(FFT_SIZE // 2 + 1)
    if reference is not None and match_strength:
        for name in CORE_NAMES:
            clean[name] = _apply_shared_eq(clean[name], gains, sr)
    master = sum(clean.values(), np.zeros_like(source))
    true_peak = float(np.max(np.abs(signal.resample_poly(master, 4, 1, axis=0))))
    ceiling = 10 ** (-1 / 20)
    global_gain = min(1.0, ceiling / max(true_peak, 1e-9))
    master *= global_gain
    quality = {}
    metadata = []
    for name in CORE_NAMES:
        clean[name] *= global_gain
        target = out_dir / f"{name}.wav"
        sf.write(target, clean[name], sr, subtype="PCM_24")
        check = inspect_pair(paths[name], target, QualityLimits(max_level_drop_db=18.0, max_level_rise_db=18.0))
        if not check["passed"]:
            # Demucs stems may naturally differ by a few samples; we explicitly
            # align to the source timeline, without time-stretching the music.
            errors = [e for e in check["errors"] if e != "sample_count_or_channels_changed"]
            if errors:
                raise ValueError(f"Quality gate rejected {name}: {', '.join(errors)}")
        quality[name] = {"errors": check["errors"], "metrics": check["metrics"]}
        metadata.append(target)
    master_path = out_dir / "master.wav"
    sf.write(master_path, master, sr, subtype="PCM_24")
    stored = [sf.read(out_dir / f"{name}.wav", always_2d=True)[0] for name in CORE_NAMES]
    stored_mix = sum(stored, np.zeros_like(source))
    stored_master, _ = _audio(master_path)
    reconstruction_peak_error = float(np.max(np.abs(stored_mix - stored_master)))
    if reconstruction_peak_error > 1e-5:
        raise ValueError("Exported master differs from sum of aligned stems")
    extras = []
    if midi is not None:
        target = out_dir / "provided_midi.mid"
        shutil.copyfile(midi, target)
        extras.append(target)
    result = {
        "stems": [f"{name}.wav" for name in CORE_NAMES],
        "master": "master.wav", "sampleRate": sr, "samples": original_count,
        "channels": channels, "referenceUsed": reference is not None,
        "referenceMatchApplied": reference is not None and match_strength > 0,
        "referenceEqMaxDb": MAX_EQ_DB,
        "globalGainDb": round(20 * math.log10(global_gain), 4),
        "maxMasterSumDifference": round(reconstruction_peak_error, 9),
        "midiIncluded": midi is not None, "midiExtracted": False,
        "pitchCorrected": False, "quality": quality,
        "warning": "Deep isolates excluded; inspect by ear. EQ matching is approximate.",
    }
    (out_dir / "manifest.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    with zipfile.ZipFile(out_dir / "Ableton_Clean_Stems.zip", "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in metadata + [master_path, out_dir / "manifest.json"] + extras:
            z.write(p, p.name)
    return result
