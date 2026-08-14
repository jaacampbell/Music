# Music

This repository contains **Music OS / Agentic Beat Lab OS** — a production command center and persistent artist workspace for song development, versioning, A&R, stem extraction, analysis, revision, release preparation, and DAW-oriented export.

## Built app

The Next.js app now has four major surfaces:

- `/` — beginner-first Guided Mode + advanced Studio Mode command center.
- `/dashboard` — Phase 2 persistent private Song Dashboard backed by Supabase/Postgres + private Storage.
- `/stem-lab` — simulated contract/MVP for stem workflows and exports.
- `/stem-studio` — the real production separator.
- `/login` — Supabase-backed account creation/sign-in for the private dashboard.
- `/guide` — plain-language walkthrough and glossary.

### Persistent Song Dashboard

`/dashboard` is the first durable everyday artist workspace. It includes:

- private user-owned projects with Row Level Security
- debounced cloud autosave
- artwork, BPM/key, project status, readiness, tasks, and checkpoints
- private audio version history
- private project files for stems, masters, artwork, agreements, lyrics, references, and other assets
- browser-decoded waveform playback from the actual uploaded audio
- timestamped waveform / mix comments
- A/B version comparison with saved creative-part decisions
- Release Center ownership, provenance, identifiers, distributor fields, and checklist
- a project-aware Ask Music first pass that uses stored context without inventing unavailable audio measurements

Setup and security details are documented in [`docs/phase2-persistence.md`](docs/phase2-persistence.md). The SQL migration is [`db/music-os-phase2.sql`](db/music-os-phase2.sql).

### Stem Studio · 60+ separator

`/stem-studio` supports two production layers:

- **Core 6** via Demucs `htdemucs_6s`: vocals, drums, bass, guitar, piano, other, plus a derived instrumental. These six stems are synchronized/non-overlapping and feed the live mixer.
- **Deep 60+** via Meta SAM-Audio: selectable text-prompt isolates for lead/background vocals, ad-libs, harmonies, kick/snare/hats/cymbals/percussion, 808/sub/synth bass, guitar types, keys/synths, strings/brass/woodwinds, FX, ambience, and more.

The frontend is designed to stay on Netlify while the compute-heavy separator runs on a separate GPU worker. Production deployment instructions live in [`services/separator/README.md`](services/separator/README.md).

## Documents

- [`docs/phase2-persistence.md`](docs/phase2-persistence.md): Supabase/Postgres, private Storage, accounts, persistent dashboard, and security/setup.
- [`docs/agentic-beat-lab-os.md`](docs/agentic-beat-lab-os.md): Full operating model, agent council roles, master router prompt, command-center tabs, MVP stack, and governance rules.
- [`docs/stem-extraction/PROPOSAL.md`](docs/stem-extraction/PROPOSAL.md): Technical proposal for the stem extraction + music editor export module.
- [`docs/stem-extraction/agent-prompt.md`](docs/stem-extraction/agent-prompt.md): Runtime prompt for the Stem Extraction Agent.
- [`docs/stem-extraction/build-checklist.md`](docs/stem-extraction/build-checklist.md): Phase 1 build checklist.

## Producer DNA Research OS

The [`producer-dna/`](producer-dna/) directory vendors the **Producer DNA Research OS** — a Python research project (producer taxonomies, 3-layer musicological DNA, producer seeds, ingestion adapters, scoring, and CLI) that feeds Song DNA.

## Command-center APIs

The app also includes API routes for:

- project creation/listing for the deterministic command-center planning MVP
- simulated stem extraction jobs (2/4/6/10 modes)
- music analysis jobs
- export jobs (WAV ZIP, REAPER, Ableton-style, Logic-style)
- natural-language agent loop execution (single or multitask batch)
- prompt cache statistics

The command-center simulation is separate from both the persistent `/dashboard` records and the real `/stem-studio` GPU-backed separator. The next integration phase is to make all three surfaces share the same persistent project graph.

## Run the frontend locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For Phase 2 cloud persistence, copy `.env.example`, create a Supabase project, run `db/music-os-phase2.sql`, and configure:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

## Run Core 6 separator locally

See [`services/separator/README.md`](services/separator/README.md). The frontend reads the separator URL from:

```text
NEXT_PUBLIC_SEPARATOR_URL=http://localhost:8000
```

## Production

For a Netlify frontend, set the Supabase values above plus:

```text
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR-GPU-WORKER.example.com
```

The GPU worker needs Python 3.11+, FFmpeg, CUDA for practical Deep 60+ inference, and `HF_TOKEN` for gated SAM-Audio checkpoint access.
