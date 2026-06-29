"""Tests for musical analysis service."""

import numpy as np
import pytest
from app.services.analyzer import detect_bpm_and_beats, detect_key, run_full_analysis


def make_click_track(bpm: float = 120.0, duration: float = 10.0, sr: int = 22050) -> np.ndarray:
    """Generate a simple click track at a known BPM."""
    samples = int(sr * duration)
    y = np.zeros(samples)
    beat_interval = sr * 60 / bpm
    t = 0
    while t < samples:
        i = int(t)
        if i < samples:
            y[i] = 1.0
        t += beat_interval
    return y


def make_sine(freq: float = 440.0, duration: float = 5.0, sr: int = 22050) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    return 0.5 * np.sin(2 * np.pi * freq * t)


def test_bpm_detection_120():
    sr = 22050
    y = make_click_track(bpm=120.0, sr=sr)
    bpm, confidence, beat_times, _ = detect_bpm_and_beats(y, sr)
    assert abs(bpm - 120.0) < 5.0, f"Expected ~120 BPM, got {bpm}"
    assert 0.0 <= confidence <= 1.0


def test_bpm_detection_90():
    sr = 22050
    y = make_click_track(bpm=90.0, sr=sr)
    bpm, confidence, beat_times, _ = detect_bpm_and_beats(y, sr)
    # Allow wider tolerance since click track harmonics can shift detection
    assert abs(bpm - 90.0) < 15.0, f"Expected ~90 BPM, got {bpm}"


def test_beat_times_reasonable():
    sr = 22050
    y = make_click_track(bpm=120.0, sr=sr)
    _, _, beat_times, downbeat_times = detect_bpm_and_beats(y, sr)
    # Should detect multiple beats in 10 seconds at 120 BPM
    assert len(beat_times) >= 10, f"Expected at least 10 beats, got {len(beat_times)}"
    # Beat times should be non-decreasing
    diffs = np.diff(beat_times)
    assert np.all(diffs >= 0), "Beat times should be non-decreasing"


def test_key_returns_string():
    sr = 22050
    y = make_sine(freq=440.0, sr=sr)
    key, confidence = detect_key(y, sr)
    assert isinstance(key, str)
    assert "major" in key or "minor" in key
    assert 0.0 <= confidence <= 1.0


def test_run_full_analysis_returns_model():
    sr = 22050
    y = make_click_track(bpm=100.0, sr=sr)
    # Make stereo
    audio = np.stack([y, y], axis=1)
    result = run_full_analysis(audio, sr)
    assert result.bpm is not None
    assert result.key is not None
    assert result.lufs_integrated is not None
    assert isinstance(result.beat_times, list)
    assert isinstance(result.tempo_map, list)
