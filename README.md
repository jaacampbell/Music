# Music

This repository contains the **Agentic Beat Lab OS** — a production command center for song development, A&R, stem extraction, analysis, revision, and DAW-oriented export.

## Built app

The Next.js app includes the 10-tab command center plus two stem tools:

- `/stem-lab` — simulated contract/MVP for stem workflows and exports.
- `/stem-studio` — the real production separator.

### Stem Studio · 60+ separator

`/stem-studio` now supports two production layers:

- **Core 6** via Demucs `htdemucs_6s`: vocals, drums, bass, guitar, piano, other, plus a derived instrumental. These six stems are synchronized/non-overlapping and feed the live mixer.
- **Deep 60+** via Meta SAM-Audio: selectable text-prompt isolates for lead/background vocals, ad-libs, harmonies, kick/snare/hats/cymbals/percussion, 808/sub/synth bass, guitar types, keys/synths, strings/brass/woodwinds, FX, ambience, and more.

The frontend is designed to stay on Netlify while the compute-heavy separator runs on a separate GPU worker. Production deployment instructions live in [`services/separator/README.md`](services/separator/README.md).

## Documents

- [`docs/agentic-beat-lab-os.md`](docs/agentic-beat-lab-os.md): Full operating model, agent council roles, master router prompt, command-center tabs, MVP stack, and governance rules.
- [`docs/stem-extraction/PROPOSAL.md`](docs/stem-extraction/PROPOSAL.md): Technical proposal for the stem extraction + music editor export module.
- [`docs/stem-extraction/agent-prompt.md`](docs/stem-extraction/agent-prompt.md): Runtime prompt for the Stem Extraction Agent.
- [`docs/stem-extraction/build-checklist.md`](docs/stem-extraction/build-checklist.md): Phase 1 build checklist.

## Producer DNA Research OS

The [`producer-dna/`](producer-dna/) directory vendors the **Producer DNA Research OS** — a Python research project (producer taxonomies, 3-layer musicological DNA, Batch 001 seed of 50 producers, ingestion adapters, scoring, and CLI) that feeds Song DNA.

## Command-center APIs

The app also includes API routes for:

- project creation/listing
- simulated stem extraction jobs (2/4/6/10 modes)
- music analysis jobs
- export jobs (WAV ZIP, REAPER, Ableton-style, Logic-style)
- natural-language agent loop execution (single or multitask batch)
- prompt cache statistics

The command-center simulation is separate from the real `/stem-studio` GPU-backed separator.

## Run the frontend locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run Core 6 separator locally

See [`services/separator/README.md`](services/separator/README.md). The frontend reads the separator URL from:

```text
NEXT_PUBLIC_SEPARATOR_URL=http://localhost:8000
```

## Production

For a Netlify frontend, set:

```text
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR-GPU-WORKER.example.com
```

The GPU worker needs Python 3.11+, FFmpeg, CUDA for practical Deep 60+ inference, and `HF_TOKEN` for gated SAM-Audio checkpoint access.
