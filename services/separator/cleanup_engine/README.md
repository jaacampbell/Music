# Instrument Cleanup Engine — Phase 1

A non-destructive **per-stem WAV restoration** module for Music OS's existing Python separator worker. This branch adds the DSP engine and tests; it does **not** yet wire up a UI, processing queue, or deployed endpoint.

## Features
- Conservative high-pass and spectral-floor noise reduction.
- Reference spectral-envelope EQ matching, with capped EQ gain.
- Peak-ceiling protection and 24-bit PCM WAV export.
- Maintains original channel count, sample rate, and exact sample count.
- Structured processing report with truthful capability flags.

## Installation
```bash
pip install numpy scipy soundfile pytest
pytest -q services/separator/cleanup_engine/test_cleanup.py
```

## Usage
```python
from services.separator.cleanup_engine.engine import process_stem, CleanupSettings
report = process_stem("vocals.wav", "exports/vocals_clean.wav",
                      reference_path="reference.wav",
                      settings=CleanupSettings(denoise_strength=0.25, match_strength=0.3))
```

## Next engineering phases
1. Add authenticated job endpoints and project-scoped Supabase asset storage, reusing music_projects.id.
2. Integrate per-stem preview/A-B controls and reference upload in Stem Studio.
3. Add instrument-aware presets, artifact detection and objective quality measurements.
4. Add optional **monophonic** pitch correction and separate MIDI quantization/key checks, with explicit opt-in.
5. Bundle synchronized 24-bit WAVs + MIDI for Ableton Live 11 Standard.

No automatic source separation, pitch correction, or guaranteed exact reference reproduction is provided by Phase 1. Existing Demucs separation remains the source-separation layer. Keep this branch out of production until integration and end-to-end validation.
