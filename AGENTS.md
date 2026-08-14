# AGENTS.md

## Cursor Cloud specific instructions

This repository is the **Agentic Beat Lab OS** — a music *production* command center (not a music player). It is a **Next.js 16 (App Router) + React 19 + TypeScript** app that models the producer/A&R/engineer loop from `docs/agentic-beat-lab-os.md`.

### Commands (see `package.json` scripts)
- `npm run dev` — Next.js dev server (Turbopack) at `http://localhost:3000`.
- `npm run build` — production build (`next build`).
- `npm run start` — serve the production build.
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, `eslint-config-next`).

### Architecture
- `app/page.tsx` — the single-page command center UI with 10 tabs (Song Brief, Song DNA, Prompt Pack, Generations, Stem Library, Beat Breakdown, Scorecards, Mix Notes, Revision Loop, Final Export).
- `app/api/**` — route handlers: projects CRUD + state, agent run/multitask, extract/analyze/export, jobs, cache stats. Inputs validated with `zod`.
- `lib/store.ts` — domain logic + an **in-memory store** on `globalThis` (`__beatLabStore`).
- `lib/agent-loop.ts` — parses a natural-language command into a plan (stem mode 2/4/6/10, model profile, export profile) and runs the jobs.
- `lib/prompt-cache.ts` — tiered prompt assembly + token-saver telemetry.

### Real stem separation service (`services/separator/`)
- A **separate Python service** (FastAPI + Demucs + optional Meta SAM-Audio + FFmpeg) powers `/stem-studio`.
- Core production separation uses Demucs `htdemucs_6s` for six synchronized, non-overlapping stems: `vocals / drums / bass / guitar / piano / other`, plus a derived instrumental.
- Deep separation exposes a 60-target catalog. Meta SAM-Audio isolates any selected target from text prompts (lead/background vocals, drum parts, 808/sub-bass, guitar types, keys, strings, brass, woodwinds, FX, and more). Deep targets may overlap and are not summed in the Core 6 mixer.
- Local CPU Core 6 setup and production GPU Docker deployment are documented in `services/separator/README.md`.
- SAM-Audio requires Python 3.11+, a CUDA worker for practical performance, checkpoint access on Hugging Face, and `HF_TOKEN` on first model download.
- The frontend targets the worker via `NEXT_PUBLIC_SEPARATOR_URL` (default `http://localhost:8000`). A Netlify-hosted HTTPS frontend needs an HTTPS worker URL.
- The service's `.venv/` and `data/` (jobs, weights, stems) are gitignored. Persist `/models` on production GPU hosts to avoid re-downloading weights.
- ESLint ignores `services/**` and `producer-dna/**` (Python projects) — see `eslint.config.mjs`.

### Non-obvious notes
- **The core command center is a deterministic simulation MVP**: the agent loop, scoring, `/stem-lab` extraction, and exports are stubbed to model the data contracts (no live LLM calls). Real stem separation lives in `services/separator/` + `/stem-studio`.
- **State is in-memory and not persisted** — it resets on dev-server restart and is shared process-wide via `globalThis`. Creating projects via the API (e.g. curl) makes them appear in the UI after a reload. Real persistence (Postgres/Supabase) is a planned build-out.
- The startup update script installs from `package-lock.json` via `npm ci`; no extra setup is required for the Next.js frontend.
- CI runs `npm run lint`, `npm run build`, and `python -m py_compile services/separator/app.py`.
