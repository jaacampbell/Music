# Music OS song upload troubleshooting

The dashboard uploads song versions directly from the browser to the private Supabase `music-assets` bucket.

## Production requirements

Netlify must have these build environment variables before the frontend is deployed:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Real stem separation is a separate service. Configure it only with a deployed HTTPS worker URL:

```text
NEXT_PUBLIC_SEPARATOR_URL=https://YOUR_SEPARATOR_WORKER
```

Do not use `http://localhost:8000` for a production Netlify build. A visitor's browser cannot reach the developer machine.

## Storage setup

Run `db/music-os-phase2.sql` once for the initial schema/storage setup. Existing installations can additionally run `db/music-os-upload-fix.sql` to accept the MIME variants browsers commonly send for WAV, MP3, M4A, FLAC, AIFF, OGG, and WebM.

The frontend also normalizes common browser MIME differences (for example `audio/x-m4a` to `audio/mp4`) before upload.

## Error behavior

Network failures are now reported with the operation that failed instead of the browser-only `Failed to fetch` message. Storage HTTP errors also preserve the server response so bucket, policy, size, and MIME errors are visible in the Music OS status line.

## Separation is independent

A successful private song/version upload does not prove the stem worker is online. The Supabase upload path and the GPU separation path are separate services and should be diagnosed independently.
