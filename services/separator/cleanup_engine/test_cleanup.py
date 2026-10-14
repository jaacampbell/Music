import numpy as np
import soundfile as sf
from .engine import process_stem, CleanupSettings


def test_cleanup_preserves_length_channels_and_sample_rate(tmp_path):
    sr = 44100
    t = np.arange(sr) / sr
    stereo = np.column_stack([0.3 * np.sin(2 * np.pi * 440 * t),
                              0.2 * np.sin(2 * np.pi * 220 * t)])
    source = tmp_path / "source.wav"
    target = tmp_path / "clean.wav"
    sf.write(source, stereo, sr)
    report = process_stem(str(source), str(target))
    y, out_sr = sf.read(target, always_2d=True)
    assert y.shape == stereo.shape
    assert out_sr == sr
    assert np.isfinite(y).all()
    assert np.max(np.abs(y)) <= 10 ** (-1 / 20) + 1e-4
    assert report["pitch_corrected"] is False


def test_reference_matching_preserves_dimensions(tmp_path):
    sr = 32000
    t = np.arange(sr) / sr
    source = tmp_path / "source.wav"
    reference = tmp_path / "reference.wav"
    target = tmp_path / "clean.wav"
    sf.write(source, 0.2 * np.sin(2 * np.pi * 440 * t), sr)
    sf.write(reference, 0.2 * np.sin(2 * np.pi * 880 * t), sr)
    report = process_stem(str(source), str(target), str(reference),
                          CleanupSettings(match_strength=0.3))
    y, out_sr = sf.read(target)
    assert len(y) == sr and out_sr == sr
    assert report["reference_used"] is True
