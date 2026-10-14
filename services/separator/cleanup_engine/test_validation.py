"""Local DSP regression tests. Run: python -m pytest -q services/separator/cleanup_engine/test_validation.py"""
import numpy as np
import soundfile as sf
import pytest
from .engine import process_stem, CleanupSettings

def make_audio(path, sr=44100, channels=2, amp=0.3):
    time = np.arange(sr) / sr
    wave = amp * np.sin(2 * np.pi * 440 * time)
    sf.write(path, np.column_stack([wave, wave * .6]) if channels == 2 else wave, sr)

def test_stereo_shape_and_rate(tmp_path):
    source, target = tmp_path / "in.wav", tmp_path / "out.wav"
    make_audio(source)
    result = process_stem(str(source), str(target))
    audio, sr = sf.read(target, always_2d=True)
    assert audio.shape == (44100, 2) and sr == 44100
    assert np.isfinite(audio).all() and result["pitch_corrected"] is False

def test_mono(tmp_path):
    source, target = tmp_path / "in.wav", tmp_path / "out.wav"
    make_audio(source, channels=1)
    process_stem(str(source), str(target))
    audio, _ = sf.read(target, always_2d=True)
    assert audio.shape == (44100, 1)

def test_reference_resampling(tmp_path):
    source, target, ref = tmp_path / "in.wav", tmp_path / "out.wav", tmp_path / "ref.wav"
    make_audio(source)
    make_audio(ref, sr=48000)
    result = process_stem(str(source), str(target), str(ref))
    audio, sr = sf.read(target, always_2d=True)
    assert result["reference_used"] and audio.shape == (44100, 2) and sr == 44100

def test_invalid_strength(tmp_path):
    source = tmp_path / "in.wav"
    make_audio(source)
    with pytest.raises(ValueError):
        process_stem(str(source), str(tmp_path / "out.wav"),
                     settings=CleanupSettings(denoise_strength=2))

def test_peak_ceiling(tmp_path):
    source, target = tmp_path / "in.wav", tmp_path / "out.wav"
    make_audio(source, amp=.99)
    process_stem(str(source), str(target),
                 settings=CleanupSettings(denoise_strength=0, highpass_hz=0))
    audio, _ = sf.read(target)
    assert np.max(np.abs(audio)) <= 10 ** (-1 / 20) + 1e-4

def test_bypass_identity(tmp_path):
    source, target = tmp_path / "in.wav", tmp_path / "out.wav"
    make_audio(source)
    process_stem(str(source), str(target),
                 settings=CleanupSettings(denoise_strength=0, highpass_hz=0, match_strength=0))
    original, _ = sf.read(source)
    output, _ = sf.read(target)
    assert np.max(np.abs(original - output)) < 1e-6
