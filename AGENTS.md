# AGENTS.md

## Project overview

`Agentic Beat Lab OS` is a **Next.js (App Router) + TypeScript** command center for an
AI music production loop (Producer + A&R + Mix Engineer). It is a single web app:
a 10-tab UI (`app/page.tsx`) backed by Next.js API routes under `app/api/**` and an
in-memory domain store (`lib/store.ts`, `lib/agent-loop.ts`, `lib/prompt-cache.ts`,
`lib/types.ts`). See `docs/agentic-beat-lab-os.md` for the full operating model.

## Cursor Cloud specific instructions

- Standard commands are in `package.json` / `README.md`: `npm run dev` (Next dev
  server, http://localhost:3000), `npm run build` (`next build`), `npm start`,
  `npm run lint` (ESLint via `eslint-config-next`). Use those rather than duplicating.
- Single service, no backend infra: all state lives in an **in-memory store**
  (`lib/store.ts`) kept on `globalThis`. There is no database, and no env vars or
  secrets are required to run or test.
- Because state is in-memory, it **resets on server restart / full rebuild**, and is
  per server process. Hot reload generally preserves it, but a restart clears all
  projects and jobs — expected, not a bug.
- The "jobs" (extract/analyze/export/agent-loop) are simulated synchronously in the
  store and complete immediately; they do not call external services or process real
  audio.
