# Stem Studio separator service

Production backend for `/stem-studio`.

It has two layers:

1. **Core 6** — Demucs `htdemucs_6s` creates synchronized, non-overlapping `vocals / drums / bass / guitar / piano / other` stems plus a derived instrumental.
2. **Deep 60+** — Meta SAM-Audio isolates selected targets by natural-language prompt, including lead/background vocals, drum pieces, 808/sub-bass, guitar types, keys, strings, brass, woodwinds, FX, and more.

Deep target stems are independent text-query isolates. They may overlap each other, so they are intentionally kept out of the synchronized Core 6 mixer and exposed as preview/download outputs instead.

## Stem organization

Every generated WAV is named by stem type and stored under a human-readable vocal/instrument family. The organized ZIP preserves the same folder structure.

Example:

```text
stems/
├── Vocals/
│   ├── 01_Vocals.wav
│   ├── 01_Lead_Vocals.wav
│   ├── 02_Background_Vocals.wav
│   └── 03_Ad_libs.wav
├── Drums/
│   ├── 02_Drums.wav
│   ├── 04_Kick.wav
│   ├── 05_Snare.wav
│   └── 06_Closed_Hi_Hat.wav
├── Bass/
│   ├── 03_Bass.wav
│   ├── 07_808_Bass.wav
│   └── 08_Sub_Bass.wav
├── Guitars/
│   ├── 04_Guitar.wav
│   ├── Acoustic_Guitar.wav
│   └── Electric_Guitar.wav
├── Keys/
│   └── 05_Piano.wav
├── Orchestral/
│   ├── Strings.wav
│   └── Trumpet.wav
├── Music_FX/
│   └── 06_Other.wav
└── Mixdowns/
    └── Instrumental.wav
```

The API manifest includes `family`, `file`, and `downloadName` for each stem. `GET /jobs/{job_id}/stems.zip` downloads the complete organized stem pack.

## Local Core 6 setup

```bash
cd services/separator
python3 -m venv .venv
# CPU-only local setup. Keep torch and torchaudio on the same build.
./.venv/bin/pip install torch==2.11.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cpu
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/health` to verify the worker.

## Production Deep 60+ GPU worker

SAM-Audio requires Python 3.11+ and is designed for CUDA acceleration. Its checkpoints are gated on Hugging Face, so request access to the Meta SAM-Audio checkpoint once, then provide an `HF_TOKEN` to the worker.

Build the included image:

```bash
cd services/separator
docker build -f Dockerfile.gpu -t stem-studio-gpu .
```

Run it on an NVIDIA GPU host:

```bash
docker run --gpus all --rm -p 8000:8000 \
  -e HF_TOKEN="$HF_TOKEN" \
  -e CORS_ORIGINS="https://YOUR-NETLIFY-SITE.netlify.app" \
  -v stem-models:/models \
  stem-studio-gpu
```

Recommended production environment variables:

```text
HF_TOKEN=hf_...
SAM_AUDIO_MODEL=facebook/sam-audio-small
SAM_AUDIO_DEVICE=cuda
DEMUCS_DEVICE=cuda
MAX_DEEP_TARGETS=60
CORS_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app
```

`sam-audio-small` is the default because it is easier to host. You can switch to `facebook/sam-audio-base` or `facebook/sam-audio-large` if the GPU has enough VRAM.

## Netlify frontend connection

The Next.js frontend remains on Netlify. Point it at the GPU worker by setting this Netlify environment variable and redeploying:

```text
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR-GPU-WORKER.example.com
```

The worker must be HTTPS when the Netlify site is HTTPS; browsers will block an HTTPS page from calling an HTTP worker.

## Endpoints

- `GET /health` — worker status, Core 6 model, CUDA state, and SAM-Audio availability.
- `GET /catalog` — 60 deep target names/prompts and worker capability.
- `POST /separate` — multipart upload with `file`, `mode=core|deep`, and `targets` as a JSON array.
- `POST /separate/demo` — synthetic Core 6 test.
- `GET /jobs/{job_id}/stems.zip` — complete organized ZIP by vocal/instrument family.
- `GET /jobs/{job_id}/{file_path}` — stream/download generated WAV files.

Example Deep request:

```bash
curl -X POST http://localhost:8000/separate \
  -F 'file=@song.wav' \
  -F 'mode=deep' \
  -F 'targets=["lead_vocals","background_vocals","kick","snare","bass_808"]'
```

## Important behavior

- Core 6 outputs are mixable and their summed reconstruction error is reported.
- Deep 60+ outputs are isolated independently from the source and can overlap.
- AI separation is an estimate from a mastered mix, not recovery of the original studio multitracks.
- The first run downloads model weights. Mount `/models` to persistent storage so subsequent jobs do not redownload them.
