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

### Non-obvious notes
- **It's a deterministic simulation MVP**: there is no real audio DSP/stem separation and no live LLM calls. The loop, scoring, stems, and exports are stubbed to model the data contracts. Treat outputs as mock data when building real integrations.
- **State is in-memory and not persisted** — it resets on dev-server restart and is shared process-wide via `globalThis`. Creating projects via the API (e.g. curl) makes them appear in the UI after a reload. Real persistence (Postgres/Supabase) is a planned build-out.
- The startup update script installs from `package-lock.json` via `npm ci`; no extra setup is required.
