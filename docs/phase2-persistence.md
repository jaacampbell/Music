# Music OS Phase 2 — Persistent Song Dashboard

Phase 2 adds the first real private artist workspace on top of the existing production/stem tooling.

## What is implemented

- Email/password account creation and sign-in at `/login`.
- Private, owner-scoped song projects at `/dashboard`.
- Supabase/Postgres persistence instead of process memory for dashboard records.
- Debounced project autosave.
- Private Supabase Storage bucket for audio, artwork, stems, agreements, lyrics, masters, references, and other project files.
- Song version history: each uploaded bounce is a separate version.
- Real browser-decoded waveform display for loaded private audio.
- Timestamped waveform/mix comments.
- A/B version comparison and saved creative-part choices (drums, atmosphere, vocal space, low end).
- Project tasks and “continue where you left off” guidance.
- Manual project-history checkpoints before major revisions/handoffs.
- Release Center records: artist/release metadata, master ownership, publishing ownership, AI/provenance notes, ISRC, UPC, distributor, artwork linkage, and checklist state.
- Project-aware Ask Music first pass. It uses stored project context and explicitly refuses to invent audio measurements that have not been run.

## Connect Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `db/music-os-phase2.sql` in full.
4. In the Supabase project Connect/API settings, copy the Project URL and publishable key.
5. Add these deployment environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

6. Keep the separator worker configured separately if real stem separation is deployed:

```bash
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR_SEPARATOR_WORKER
```

7. Redeploy the Next.js frontend.
8. Open `/login`, create an account, and then open `/dashboard`.

Hosted Supabase projects commonly require email confirmation for new accounts. If signup returns no live session, confirm the email and sign in afterward.

## Security model

Every Music OS table in `db/music-os-phase2.sql` has Row Level Security enabled. Policies restrict SELECT/INSERT/UPDATE/DELETE operations to rows where `user_id = auth.uid()`.

The `music-assets` Storage bucket is private. Storage policies require the first path folder to equal the authenticated user's UUID:

```text
music-assets/{user_uuid}/{project_uuid}/...
```

The browser never receives a service-role key. It only uses the publishable key plus the signed-in user's access token, so Supabase RLS remains the authorization boundary.

## Data model

- `music_projects` — song identity, brief, BPM/key, status/readiness, artwork pointer, recent activity.
- `music_versions` — immutable-ish uploaded song bounces/version history.
- `music_assets` — stems, masters, artwork, agreements, lyrics, references, and other files.
- `music_waveform_comments` — timestamped notes attached to versions/project playback.
- `music_tasks` — song work queue.
- `music_comparisons` — saved A/B decisions.
- `music_releases` — release metadata, ownership/provenance, identifiers, distributor, checklist.
- `music_project_history` — explicit project checkpoints/snapshots.

## Current boundary with the command center

The existing `/` production command center still contains its deterministic planning MVP and the existing in-memory planning store. Phase 2 deliberately creates a durable everyday song workspace first instead of pretending that the planning simulation is already persistent.

The next integration step is to make the planning/agent API read and write the persistent dashboard project IDs directly, so `/`, `/dashboard`, and `/stem-studio` become one project graph rather than adjacent tools.

## Auth implementation note

The current Phase 2 branch uses Supabase's documented HTTP endpoints directly so it does not introduce a new package/lockfile dependency in this repository. The database/storage authorization model remains Supabase Auth + RLS. A later SSR hardening pass can adopt `@supabase/ssr` and Next.js Proxy-based token refresh if server-rendered protected routes are required.
