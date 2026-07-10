# Stem Separator service

Real 4-stem separation: **FastAPI + Demucs (`htdemucs`) + FFmpeg**. Splits any
audio into `vocals / drums / bass / other` WAVs and serves them.

## Setup

```bash
cd services/separator
python3 -m venv .venv
# Install CPU builds of torch + torchaudio from the PyTorch CPU index (must match).
./.venv/bin/pip install torch==2.2.2 torchaudio==2.2.2 --index-url https://download.pytorch.org/whl/cpu
./.venv/bin/pip install -r requirements.txt
```

## Run

```bash
./.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
```

First separation downloads the Demucs weights (cached afterwards). CPU inference
is slower than GPU but works.

## Endpoints

- `GET  /health` — service + model status.
- `POST /separate` — multipart `file` upload → real 4-stem separation + manifest.
- `POST /separate/demo` — generate a synthetic mixture and separate it (no upload).
- `GET  /jobs/{id}/stems/{nn_name.wav}` — download a separated stem.
- `GET  /jobs/{id}/source.wav` — the decoded source.

The manifest includes per-stem loudness and an **alignment** check (how closely
the summed stems reconstruct the source).
