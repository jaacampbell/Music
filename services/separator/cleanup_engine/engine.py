"""Conservative, offline stem restoration and reference spectral matching.

No source separation or polyphonic pitch correction is claimed by this module.
Input and reference must be PCM-readable files supported by soundfile.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt, stft, istft, resample_poly
from scipy.ndimage import gaussian_filter1d


@dataclass(frozen=True)
class CleanupSettings:
    highpass_hz: float = 25.0
    denoise_strength: float = 0.35
    match_strength: float = 0.35
    max_eq_db: float = 5.0
    peak_ceiling_dbfs: float = -1.0


def _validate_audio(data: np.ndarray, sample_rate: int) -> np.ndarray:
    if sample_rate < 8000:
        raise ValueError("Sample rate too low")
    x = np.asarray(data, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    if x.ndim != 2 or x.shape[1] not in (1, 2) or x.shape[0] < 4096:
        raise ValueError("Expected mono/stereo audio of at least 4096 samples")
    if not np.isfinite(x).all():
        raise ValueError("Audio contains nonfinite values")
    return x


def _denoise_channel(x: np.ndarray, strength: float) -> np.ndarray:
    if strength <= 0:
        return x.copy()
    nperseg = 2048
    _, _, z = stft(x, nperseg=nperseg, noverlap=1536, boundary="zeros")
    magnitude = np.abs(z)
    # Low percentile is a conservative noise-floor proxy, not a trained noise model.
    floor = np.percentile(magnitude, 12, axis=1, keepdims=True)
    gain = np.clip(1 - strength * floor / np.maximum(magnitude, 1e-10), 0.15, 1.0)
    gain = gaussian_filter1d(gain, sigma=1.0, axis=0)
    _, y = istft(z * gain, nperseg=nperseg, noverlap=1536, boundary=True)
    return y[:len(x)]


def _reference_eq(x: np.ndarray, reference: np.ndarray, sr: int, strength: float, max_db: float) -> np.ndarray:
    if strength <= 0:
        return x.copy()
    nfft = 4096
    def spectrum(a):
        _, _, z = stft(a, fs=sr, nperseg=nfft, noverlap=3072)
        return gaussian_filter1d(np.mean(np.abs(z), axis=1), sigma=18)
    src = spectrum(np.mean(x, axis=1))
    target = spectrum(np.mean(reference, axis=1))
    ratio_db = 20 * np.log10(np.maximum(target, 1e-8) / np.maximum(src, 1e-8))
    # Remove broadband loudness offset: match tonal shape, not total loudness.
    ratio_db -= np.median(ratio_db)
    ratio_db = np.clip(ratio_db * strength, -max_db, max_db)
    gain = 10 ** (ratio_db / 20)
    out = np.zeros_like(x)
    for ch in range(x.shape[1]):
        _, _, z = stft(x[:, ch], fs=sr, nperseg=nfft, noverlap=3072)
        _, y = istft(z * gain[:, None], fs=sr, nperseg=nfft, noverlap=3072)
        out[:, ch] = y[:len(x)]
    return out


def process_stem(input_path: str, output_path: str, reference_path: str | None = None,
                 settings: CleanupSettings = CleanupSettings()) -> dict:
    if not (0 <= settings.denoise_strength <= 1 and 0 <= settings.match_strength <= 1):
        raise ValueError("Strengths must be in [0, 1]")
    if not (0 <= settings.max_eq_db <= 12 and -12 <= settings.peak_ceiling_dbfs <= 0):
        raise ValueError("Invalid EQ or ceiling setting")
    x, sr = sf.read(input_path, always_2d=True)
    x = _validate_audio(x, sr)
    if not (0 <= settings.highpass_hz < sr / 2):
        raise ValueError("Invalid highpass cutoff")
    out = x.copy()
    if settings.highpass_hz:
        sos = butter(2, settings.highpass_hz, btype="highpass", fs=sr, output="sos")
        out = sosfiltfilt(sos, out, axis=0)
    for channel in range(out.shape[1]):
        out[:, channel] = _denoise_channel(out[:, channel], settings.denoise_strength)
    if reference_path:
        ref, ref_sr = sf.read(reference_path, always_2d=True)
        ref = _validate_audio(ref, ref_sr)
        if ref_sr != sr:
            from math import gcd
            factor = gcd(sr, ref_sr)
            ref = resample_poly(ref, sr // factor, ref_sr // factor, axis=0)
        out = _reference_eq(out, ref, sr, settings.match_strength, settings.max_eq_db)
    before_peak = float(np.max(np.abs(out)))
    ceiling = 10 ** (settings.peak_ceiling_dbfs / 20)
    gain = min(1.0, ceiling / max(before_peak, 1e-12))
    out *= gain
    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sf.write(destination, out, sr, subtype="PCM_24")
    return {
        "input": str(input_path), "output": str(destination),
        "sample_rate": sr, "channels": x.shape[1], "samples": len(x),
        "reference_used": bool(reference_path), "peak_before_ceiling": before_peak,
        "applied_ceiling_gain_db": float(20 * np.log10(max(gain, 1e-12))),
        "pitch_corrected": False, "separation_performed": False,
        "note": "Spectral reference matching is approximate; listen for artifacts."
    }
