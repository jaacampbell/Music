"""Musical analysis: BPM, key, beat grid, loudness."""

from __future__ import annotations

import numpy as np
import librosa
import pyloudnorm as pyln

from app.models.project import AnalysisResult


_PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
_MODES = ["major", "minor"]

# Krumhansl-Schmuckler key profiles
_MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                            2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                            2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def detect_key(y: np.ndarray, sr: int) -> tuple[str, float]:
    """
    Estimate musical key using chroma features and Krumhansl-Schmuckler profiles.
    Returns (key_string, confidence_0_to_1).
    """
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)

    best_score = -np.inf
    best_key = "C major"

    for root_idx in range(12):
        rolled = np.roll(chroma_mean, -root_idx)
        for mode_idx, profile in enumerate([_MAJOR_PROFILE, _MINOR_PROFILE]):
            score = np.corrcoef(rolled, profile)[0, 1]
            if score > best_score:
                best_score = score
                mode_name = _MODES[mode_idx]
                key_name = f"{_PITCH_CLASSES[root_idx]} {mode_name}"
                best_key = key_name

    # Normalize correlation to 0–1 confidence
    confidence = float(np.clip((best_score + 1) / 2, 0.0, 1.0))
    return best_key, round(confidence, 3)


def detect_bpm_and_beats(y: np.ndarray, sr: int) -> tuple[float, float, np.ndarray, np.ndarray]:
    """
    Detect BPM, beat times, and downbeat times.
    Returns (bpm, bpm_confidence, beat_times, downbeat_times).
    """
    # Use percussive component for beat tracking — rhythm lives in transients
    _, y_percussive = librosa.effects.hpss(y)

    # Fall back to full signal if percussive is too quiet
    if np.abs(y_percussive).max() < 1e-4:
        y_percussive = y

    tempo, beat_frames = librosa.beat.beat_track(y=y_percussive, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    # Estimate confidence from onset strength
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    # Simple measure: how well beat frames align with onset peaks
    beat_strength = onset_env[beat_frames].mean() if len(beat_frames) > 0 else 0.0
    max_strength = onset_env.max() if onset_env.max() > 0 else 1.0
    bpm_confidence = float(np.clip(beat_strength / max_strength, 0.0, 1.0))

    # Approximate downbeats as every 4th beat
    downbeat_times = beat_times[::4]

    bpm_value = float(np.squeeze(tempo))
    return round(bpm_value, 2), round(bpm_confidence, 3), beat_times, downbeat_times


def measure_loudness(audio: np.ndarray, sr: int) -> tuple[float, float, float]:
    """
    Measure integrated LUFS, loudness range, and true peak.
    Returns (lufs_integrated, lufs_range, true_peak_dbfs).
    """
    meter = pyln.Meter(sr)

    # pyloudnorm expects float64 (samples, channels)
    audio_f64 = audio.astype(np.float64)
    if audio_f64.ndim == 1:
        audio_f64 = audio_f64[:, np.newaxis]

    # Pad very short clips (< 400 ms) to avoid meter errors
    min_samples = int(sr * 0.4)
    if audio_f64.shape[0] < min_samples:
        pad = np.zeros((min_samples - audio_f64.shape[0], audio_f64.shape[1]))
        audio_f64 = np.concatenate([audio_f64, pad], axis=0)

    try:
        lufs = meter.integrated_loudness(audio_f64)
    except Exception:
        lufs = -70.0

    # True peak via sample peak (simplified; not oversampled true peak)
    true_peak = float(20 * np.log10(np.abs(audio).max() + 1e-9))

    # Loudness range approximation (short-term max – min spread)
    block_size = sr * 3
    lufs_range = 0.0
    if len(audio_f64) >= block_size * 2:
        blocks = [audio_f64[i : i + block_size] for i in range(0, len(audio_f64) - block_size, block_size // 2)]
        block_loudness = []
        for block in blocks:
            try:
                block_loudness.append(meter.integrated_loudness(block))
            except Exception:
                pass
        if len(block_loudness) >= 2:
            finite = [v for v in block_loudness if np.isfinite(v)]
            if len(finite) >= 2:
                lufs_range = float(max(finite) - min(finite))

    return (
        round(float(lufs) if np.isfinite(lufs) else -70.0, 1),
        round(lufs_range, 1),
        round(true_peak, 1),
    )


def run_full_analysis(audio: np.ndarray, sr: int) -> AnalysisResult:
    """
    Run BPM, key, and loudness analysis on a mono or stereo audio array.
    Returns a populated AnalysisResult.
    """
    # Work on mono for analysis
    y_mono = librosa.to_mono(audio.T) if audio.ndim == 2 else audio

    bpm, bpm_conf, beat_times, downbeat_times = detect_bpm_and_beats(y_mono, sr)
    key, key_conf = detect_key(y_mono, sr)
    lufs, lufs_range, true_peak = measure_loudness(audio, sr)

    duration = len(y_mono) / sr
    duration_bars = int(len(beat_times) / 4) if len(beat_times) >= 4 else None

    tempo_map = []
    for i, bt in enumerate(beat_times):
        bar = i // 4 + 1
        beat_in_bar = i % 4 + 1
        if beat_in_bar == 1:
            tempo_map.append({
                "bar": bar,
                "beat": 1,
                "time_seconds": round(float(bt), 4),
                "bpm": bpm,
            })

    return AnalysisResult(
        bpm=bpm,
        bpm_confidence=bpm_conf,
        key=key,
        key_confidence=key_conf,
        time_signature="4/4",
        duration_bars=duration_bars,
        lufs_integrated=lufs,
        lufs_range=lufs_range,
        true_peak_dbfs=true_peak,
        beat_times=[round(float(t), 4) for t in beat_times[:200]],
        downbeat_times=[round(float(t), 4) for t in downbeat_times[:50]],
        tempo_map=tempo_map[:50],
    )
