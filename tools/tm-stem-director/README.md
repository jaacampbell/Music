# TM Stem Director — Local Core 6 bridge (development)

This additive implementation exports **real** Demucs `htdemucs_6s` WAV stems, not frequency-filter previews. It does **not** change the existing VST3 or production web application.

## Mac installation

Install Python 3.11 and FFmpeg (for example, with Homebrew), then from the repository root:

```bash
python3.11 -m venv .venv-tm
source .venv-tm/bin/activate
python -m pip install torch torchaudio demucs
python tools/tm-stem-director/separate_local.py "$HOME/Downloads/Baggage Claim.mp3"
```

Files go to `~/Music/TM Music Studio/Stems/Baggage Claim/`. Six numbered, aligned WAVs and `stems.zip` are written only after all six stems are produced. `status.json` uses `processing`, `completed`, or `failed`.

## Ableton Live 11 Standard

Drag all six WAVs onto six audio tracks, aligned at bar 1. Turn Warp off initially. Do not combine these with the original full instrumental, as that duplicates content. The local CLI can be run while Live is open, but **the installed VST3 is not yet wired to this command**.

## Integration contract for native Stem Director

The native plugin must **never** launch Demucs or perform file/network I/O on the real-time audio callback. A companion background process should accept an explicit user-approved source file, run this CLI, read `status.json`, and notify the plugin UI. Add explicit controls for import, separate, progress, retry, preview, and reveal exports. Audio preview and routing require a separate native implementation and DAW tests.

Preserve existing Music OS project UUID and private Supabase storage rules if adding project-linked cloud sync. No secrets belong in the plugin. Existing paid GPU controller flags remain off by default. No automatic GPU purchases.

## Acceptance checks

1. Process a short authorized test recording and verify all six WAV files exist and have identical duration.
2. Confirm status transitions and error handling for missing FFmpeg and bad inputs.
3. Import WAVs into Ableton and verify alignment and reasonable summed reconstruction.
4. Build and test native plugin UI separately before calling this a fully integrated VST3.
