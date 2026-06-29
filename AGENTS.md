# AGENTS.md

## Project overview

This repository is an **npm-workspaces monorepo** with two independent apps under `apps/`:

- **`apps/beat-lab`** — `Agentic Beat Lab OS`: Next.js (App Router) + TypeScript command
  center for an AI music-production loop. 10-tab UI (`app/page.tsx`) backed by API routes
  under `app/api/**` and an in-memory store (`lib/*`). See `apps/beat-lab/docs`.
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
- The two apps run on different ports: **beat-lab → http://localhost:3000** (Next.js),
  **player → http://localhost:5173** (Vite). They can run simultaneously.
- Lint/build are per-workspace (run with the workspace as cwd), so the apps' different
  linters/tsconfigs (ESLint+`eslint-config-next` for beat-lab, `oxlint` for player) do not
  interfere with each other.
- beat-lab state is an **in-memory store** (`lib/store.ts`, on `globalThis`): no database,
  no env vars/secrets. It resets on server restart/full rebuild; its extract/analyze/export
  "jobs" are simulated synchronously and do not touch real audio or external services.
- player audio: browsers require a user gesture before an `AudioContext` makes sound, so
  playback only starts after a click. In a headless browser there may be no audible output,
  but playback is still observable via the advancing timer and animated visualizer.
