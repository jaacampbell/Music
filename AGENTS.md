# AGENTS.md

## Project overview

This repository is an **npm-workspaces monorepo** with two independent apps under `apps/`:

- **`apps/beat-lab`** — `Agentic Beat Lab OS`: a music *production* command center (not a
  music player). Next.js 16 (App Router) + React 19 + TypeScript, modeling the
  producer/A&R/engineer loop from `apps/beat-lab/docs/agentic-beat-lab-os.md`.
- **`apps/player`** — `Music player`: Vite + React + TypeScript. Audio is synthesized at
  runtime via the Web Audio API (no audio assets). Key files: `src/synth.ts`,
  `src/tracks.ts`, `src/App.tsx`.

## Cursor Cloud specific instructions

- Dependencies for both apps install from the repo root with a single `npm install`
  (npm workspaces hoists to the root `node_modules`). There is one root lockfile; the apps
  do not keep their own lockfiles.
- Standard commands live in each app's `package.json`; convenient root aliases are in the
  root `package.json` (`dev:beat-lab`, `dev:player`, `build:*`, `lint:*`). You can also use
  `npm run <script> -w beat-lab` / `-w music-player`.
- The two apps run on different ports and can run simultaneously:
  **beat-lab → http://localhost:3000** (Next.js, Turbopack), **player → http://localhost:5173** (Vite).
- Lint/build are per-workspace (run with the workspace as cwd), so the apps' different
  linters/tsconfigs (ESLint + `eslint-config-next` for beat-lab, `oxlint` for player) do not
  interfere with each other.

### apps/beat-lab notes

- Architecture: `app/page.tsx` is the 10-tab command center UI (Song Brief, Song DNA,
  Prompt Pack, Generations, Stem Library, Beat Breakdown, Scorecards, Mix Notes, Revision
  Loop, Final Export). `app/api/**` are route handlers (projects CRUD + state, agent
  run/multitask, extract/analyze/export, jobs, cache stats), with inputs validated by `zod`.
  `lib/store.ts` holds domain logic + the store; `lib/agent-loop.ts` parses a
  natural-language command into a plan (stem mode 2/4/6/10, model/export profile) and runs
  the jobs; `lib/prompt-cache.ts` does tiered prompt assembly + token-saver telemetry.
- It is a **deterministic simulation MVP**: no real audio DSP/stem separation and no live
  LLM calls — the loop, scoring, stems, and exports are stubbed to model the data contracts.
  Treat outputs as mock data when building real integrations.
- **State is an in-memory store** on `globalThis` (`__beatLabStore`): no database, no
  env vars/secrets. It resets on dev-server restart/full rebuild and is shared process-wide;
  projects created via the API (e.g. curl) appear in the UI after a reload.

### apps/player notes

- Browsers require a user gesture before an `AudioContext` makes sound, so playback only
  starts after a click. In a headless browser there may be no audible output, but playback
  is still observable via the advancing timer and the animated visualizer.
