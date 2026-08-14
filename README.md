# Music OS

This repository contains **Music OS / Agentic Beat Lab OS** — an artist-first production command center and persistent workspace for song development, versioning, A&R, real stem extraction, analysis, revision, rights/release preparation, and DAW-oriented export.

## Product surfaces

The Next.js app has one shared song/project identity across its major surfaces:

- `/` — beginner-first Guided Mode + advanced Studio Mode production command center.
- `/dashboard` — private persistent Song Dashboard backed by Supabase/Postgres + private Storage.
- `/stem-studio` — real production separator with project-native cloud stem handoff.
- `/stem-lab` — deterministic stem workflow/contract MVP.
- `/login` — Supabase-backed account creation/sign-in.
- `/guide` — plain-language walkthrough and glossary.

Use `?projectId=<uuid>` to move the same song between Dashboard, Guided/Studio, and Stem Studio.

## One song, one project graph

`music_projects.id` is the canonical song UUID. `app/components/CloudProjectBridge.tsx` keeps the existing deterministic production-planning `Project` model synchronized into the persistent row’s `planning_state` while preserving the working command-center APIs.

The bridge also:

- promotes Guided/Studio projects into the private Supabase library;
- hydrates Dashboard projects into the production engine;
- syncs title/brief, BPM/key, measured analysis, production planning state, and source-audio metadata;
- promotes browser source audio into private Storage and version history;
- creates a new persistent version when a replacement source is attached.

See [`docs/phase3-unified-music-os.md`](docs/phase3-unified-music-os.md).

## Persistent Song Dashboard

`/dashboard` includes:

- private user-owned projects protected by Supabase Row Level Security;
- debounced cloud autosave;
- artwork, BPM/key, status, readiness, tasks, and checkpoints;
- private audio version history and project files;
- decoded waveform playback and timestamped mix comments;
- synchronized A/B playback with position-preserving switching;
- saved drums/atmosphere/vocal-space/low-end comparison decisions;
- structured songwriter splits with a 100% total check;
- structured producer-agreement tracking;
- Release Center ownership, provenance, ISRC/UPC, distributor fields, and checklist;
- project-aware Ask Music conversation history.

## Ask Music

`/api/music-assistant` is a server-side project-aware assistant route. It verifies a Music OS session and project ownership before using a configured OpenAI model. The server-only configuration is:

```text
OPENAI_API_KEY=YOUR_SERVER_ONLY_KEY
OPENAI_MUSIC_MODEL=gpt-5-mini
```

If no model key is configured, the feature falls back to deterministic project-aware guidance. The route is instructed not to invent unavailable audio measurements, rights facts, clearances, credits, or ownership.

## Stem Studio · Core 6 + Deep isolation

`/stem-studio` supports:

- **Core 6** via Demucs `htdemucs_6s`: vocals, drums, bass, guitar, piano, other, plus derived instrumental output.
- **Deep isolation** via optional Meta SAM-Audio named targets such as lead/background vocals, ad-libs, drum parts, 808/sub-bass, guitars, keys, strings, brass, woodwinds, FX, and ambience.

When the user is signed in and Stem Studio is opened for a project, completed generated WAVs are copied from the separator worker into that song’s private Supabase Storage and registered as `music_assets` stems automatically.

Production separator deployment instructions live in [`services/separator/README.md`](services/separator/README.md).

## Security model

Supabase Auth + Row Level Security is the authorization boundary for private database rows and Storage objects.

`proxy.ts` provides an optimistic `/dashboard` route guard, but it does not replace RLS. The private Storage path convention is:

```text
music-assets/{user_uuid}/{project_uuid}/...
```

The bucket remains private and size-limited. Phase 3 removes the old narrow MIME allow-list so legitimate agreements, lyrics, archives, DAW handoff files, stems, audio, and artwork can live in the project library.

Never expose a Supabase service-role key or `OPENAI_API_KEY` through browser code or a `NEXT_PUBLIC_` variable.

## Database setup

Run the migrations in order:

1. [`db/music-os-phase2.sql`](db/music-os-phase2.sql)
2. [`db/music-os-phase3.sql`](db/music-os-phase3.sql)

Then configure:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR-GPU-WORKER.example.com
```

The optional Ask Music variables are shown above.

## Deterministic vs. measured processing

The command-center agent loop, planning scorecards, `/stem-lab` extraction contracts, and DAW handoff planner remain deterministic modeling tools. They must not be presented as measured audio truth.

Browser audio analysis and the external separator are real processing paths. Waveforms are rendered only from decoded audio; decode failure does not produce a fabricated waveform.

## Documents

- [`docs/phase3-unified-music-os.md`](docs/phase3-unified-music-os.md): unified project graph, source/version sync, Stem Studio handoff, Ask Music, and security.
- [`docs/phase2-persistence.md`](docs/phase2-persistence.md): initial Supabase persistence layer and RLS model.
- [`docs/agentic-beat-lab-os.md`](docs/agentic-beat-lab-os.md): operating model, agent council, production loop, and governance.
- [`docs/stem-extraction/PROPOSAL.md`](docs/stem-extraction/PROPOSAL.md): stem extraction/editor proposal.

## Producer DNA Research OS

The [`producer-dna/`](producer-dna/) directory contains the Producer DNA research system used to inform broad production traits and Song DNA while keeping artist-imitation directives out of executable generation instructions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The GPU worker needs Python 3.11+, FFmpeg, CUDA for practical deep inference, and the appropriate gated-model credentials when SAM-Audio is enabled.
