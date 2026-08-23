# AGENTS.md

## Music OS repository instructions

This repository is **Music OS / Agentic Beat Lab OS** — a Next.js 16 (App Router) + React 19 + TypeScript music-production workspace with a persistent artist library and a separate Python stem-separation service.

### Commands
- `npm run dev` — Next.js dev server at `http://localhost:3000`.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint.
- `npm run dev:player` — standalone Vite music player at `http://localhost:5173`.
- `npm run build:player` — type-check and build the standalone player.
- `npm run lint:player` — lint the standalone player.
- CI also runs `python -m py_compile services/separator/app.py`.

### Product surfaces
- `/` — beginner Guided Mode + advanced Studio Mode production command center.
- `/dashboard` — private persistent Song Dashboard and canonical cloud project library.
- `/player` — JO₵YN unified audio player with private Supabase cloud uploads and IndexedDB device fallback, imported from the standalone Vite player source.
- `/stem-studio` — real Demucs Core 6 + optional SAM-Audio Deep isolation.
- `/stem-lab` — deterministic stem workflow/contract MVP.
- `/login` — Supabase account sign-in/signup.
- `/guide` — plain-language help and glossary.

The [`apps/player`](apps/player) source powers both its standalone Vite build and the Next.js `/player` route. Keep browser-only APIs guarded for server rendering, and validate both builds whenever shared player code changes.

### Unified project architecture
The canonical song identity is the UUID in `public.music_projects`.

Phase 3 deliberately keeps the existing deterministic command-center APIs working while synchronizing their `Project` state into `music_projects.planning_state` through `app/components/CloudProjectBridge.tsx`.

The bridge:
- promotes Guided/Studio browser projects into Supabase using the same UUID;
- hydrates Dashboard projects back into the existing command-center planning engine;
- syncs planning state, title/brief, BPM/key, measured analysis, and source-audio metadata;
- promotes browser source audio into the private `music-assets` bucket and version history;
- makes `?projectId=<uuid>` the handoff between Dashboard, Studio, and Stem Studio.

Do not create another independent project identifier for a feature that belongs to a song. New song-level features should reference `music_projects.id`.

### Persistence and security
Run both migrations, in order:
1. `db/music-os-phase2.sql`
2. `db/music-os-phase3.sql`

Supabase Auth + Row Level Security is the authorization boundary for private project rows and Storage objects. `proxy.ts` is only an optimistic route guard for `/dashboard`; do not treat the route cookie as a replacement for RLS.

The private Storage path convention is:
`music-assets/{user_uuid}/{project_uuid}/...`

Never expose a Supabase service-role key or `OPENAI_API_KEY` to browser code. Server-only secrets must not use a `NEXT_PUBLIC_` prefix.

### Ask Music
`app/api/music-assistant/route.ts` is the project-aware assistant endpoint. It:
- requires a verified Music OS session;
- verifies the requested project owner;
- uses the OpenAI Responses API only from the server when `OPENAI_API_KEY` exists;
- falls back to deterministic project guidance when no model key is configured;
- must not invent measurements, credits, ownership, clearances, or analysis that the system did not actually produce.

Conversation history is stored in `music_agent_messages` under RLS.

### Real stem separation
`services/separator/` is the separate FastAPI + Demucs + optional SAM-Audio worker used by `/stem-studio`.

Core production separation uses Demucs `htdemucs_6s` for synchronized non-overlapping `vocals / drums / bass / guitar / piano / other`, plus derived instrumental output. Deep isolation exposes named targets and may overlap.

When a signed-in project is linked, Stem Studio copies completed generated WAVs from the worker into that project’s private Supabase Storage and records them as `music_assets` stem rows. Individual failed cloud copies must not invalidate other successful stems.

### Important truthfulness rules
- The deterministic command-center agent loop/scoring/export planner is still a planning model, not a live generative producer.
- Browser audio analysis and the external separator are real processing paths.
- A waveform must come from decoded audio; never render a fabricated waveform on decode failure.
- Never label defaults or planning placeholders as measured audio facts.
- Ask Music must distinguish listening hypotheses from measured findings.

### Development expectations
- Preserve beginner-friendly Guided Mode; advanced technical controls belong in Studio/technical views.
- Keep project handoffs project-ID aware.
- Validate user/API input.
- Prefer owner-scoped persistent records for new song data.
- Run lint/build and separator syntax CI before merging changes to `main`.
