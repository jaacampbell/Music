# Music OS Phase 3 — One Song, One Project Graph

Phase 3 removes the product boundary between the Guided/Studio command center, the persistent Song Dashboard, and Stem Studio.

## Setup

Run these Supabase migrations in order:

1. `db/music-os-phase2.sql`
2. `db/music-os-phase3.sql`

Configure the deployment environment:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR_SEPARATOR_WORKER
```

Optional full Ask Music AI:

```text
OPENAI_API_KEY=YOUR_SERVER_ONLY_KEY
OPENAI_MUSIC_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` is server-only. Never expose it through a `NEXT_PUBLIC_` variable.

## Canonical project identity

Every song uses `music_projects.id` as its canonical UUID.

Use the same project ID in links between product surfaces:

```text
/dashboard?projectId=<uuid>
/?projectId=<uuid>
/stem-studio?projectId=<uuid>
```

`CloudProjectBridge` keeps the existing deterministic command-center `Project` model synchronized into `music_projects.planning_state`. This preserves the working production planning APIs while giving the user one durable song identity.

## Source audio and versions

When source audio is attached in Guided/Studio mode:

1. It remains available in browser IndexedDB for immediate production work.
2. When the user is signed in, it is copied to the private `music-assets` bucket.
3. A `music_versions` row is created.
4. The project gets `source_audio_path` and measured `live_analysis` when available.
5. Selecting a replacement source creates a new version rather than silently reusing the old cloud pointer.

## Stem Studio handoff

When Stem Studio is opened with a project ID and the user is signed in:

1. The separator runs against the selected source.
2. The existing production planning state is updated.
3. Measured audio analysis is stored with the project.
4. Completed generated WAVs are copied from the separator worker into private Supabase Storage.
5. Each copied output receives a `music_assets` row with `kind = 'stem'`.

A failure to copy one generated stem does not invalidate other completed outputs.

## Dashboard

The persistent Song Dashboard includes:

- artwork, BPM/key, status, readiness and autosave;
- private version history and project files;
- tasks and project checkpoints;
- decoded waveform playback and timestamped comments;
- synchronized A/B playback with position-preserving switching;
- creative-part A/B decisions for drums, atmosphere, vocal space and low end;
- songwriter split editor with a 100% total check;
- producer agreement tracking;
- ownership, provenance, identifiers, distributor and release checklist;
- project-aware Ask Music history.

## Ask Music

`/api/music-assistant` is a server route. The route verifies a Music OS session and requires the submitted project to belong to that signed-in user before it may call a configured model.

The model receives project context rather than unrestricted account data. It is instructed not to invent audio measurements, rights facts, credits, ownership, licenses or clearances.

When no `OPENAI_API_KEY` exists, Ask Music remains usable through deterministic project-aware fallback guidance.

## Security

Supabase RLS remains the authorization boundary for private rows and private Storage objects.

`proxy.ts` is an optimistic route guard only. It improves navigation behavior but does not replace row/file authorization.

The `music-assets` bucket remains private and owner-folder scoped. Phase 3 removes the narrow MIME allow-list so the project library can store legitimate agreements, lyrics, archives and DAW handoff files in addition to common audio/image formats. The 500 MB per-object limit remains.

## Truthfulness rules

Music OS must keep these distinctions visible:

- deterministic production planning is not the same as measured audio analysis;
- browser audio analysis and separator output are real processing paths;
- a waveform must come from decoded audio and must not be fabricated when decode fails;
- Ask Music must identify listening suggestions as hypotheses unless a measured result exists.
