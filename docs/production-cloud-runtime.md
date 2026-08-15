# Music OS production cloud runtime

This file records the production service dependencies that must be present for the deployed Music OS client and server features to behave correctly.

## Production web app

The production frontend is deployed from `main` on Netlify. Public browser configuration is injected at build time, so changes to `NEXT_PUBLIC_*` values require a fresh production build before browsers can see them.

Required public production variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The application must never fall back to a localhost service URL in a production browser.

## Supabase

The persistent Music OS project graph uses Supabase Auth, Postgres, Row Level Security, and private Storage. Production schema migrations are applied in order:

1. `db/music-os-phase2.sql`
2. `db/music-os-phase3.sql`
3. `db/music-os-phase4.sql`
4. `db/music-os-phase5.sql`
5. `db/music-os-phase6.sql`
6. `db/music-os-phase7.sql`

The `stem-worker-mirror` Edge Function is part of the current Stem Director control plane. It uses custom HMAC authentication and must not be treated as the public audio-processing worker itself.

## Stem compute

Cloud persistence and stem compute are separate services. Login, dashboard persistence, source uploads, and project metadata can operate without a GPU worker. Core 6 / Deep separation requires an independently deployed separator worker and a valid production worker configuration.

Do not report stem compute as online merely because the Netlify app, Supabase project, or Edge gateway is healthy.
