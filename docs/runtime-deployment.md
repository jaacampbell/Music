# Music OS runtime deployment

This file documents the production runtime boundary without storing credentials.

## Current web/backend

- Frontend and Next.js server runtime: Netlify project `musicdevnc`.
- Persistent application data: Supabase project `music-os`.
- Database migrations required: Phase 2 → Phase 3 → Phase 4 → Phase 5.
- Agentic Stem System route: `/stem-agent`.

## Stem worker

The production separator is a separate CPU/GPU container built from `services/separator/Dockerfile.gpu` or `Dockerfile.cpu`.

Phase 5 launches `agent_phase5:app` and adds:

- hierarchical parent-stem routing for deep isolation,
- technical QA and recovery attempts,
- persistent-volume restart recovery,
- worker-to-Supabase job lifecycle mirroring,
- project-scoped signed worker sessions,
- signed job downloads,
- `/agent/system` runtime telemetry.

## Secret boundaries

Never commit runtime credentials.

- `SEPARATOR_GATEWAY_SECRET` is server/worker-only and must match on Netlify and the worker.
- The canonical gateway secret is also kept encrypted in Supabase Vault for controlled recovery/configuration.
- `SUPABASE_SECRET_KEY` is worker-only and must never be exposed to browser code or a `NEXT_PUBLIC_` variable.
- `HF_TOKEN` is worker-only when gated SAM-Audio checkpoints require it.
- `OPENAI_API_KEY` is server/worker-only when optional LLM strategy planning is enabled.

## Activation checklist

1. Launch the current GHCR separator image on an HTTPS GPU host with persistent `/workspace` storage.
2. Configure the worker environment from `.env.example`, including the existing gateway secret.
3. Confirm `/agent/ready` and `/agent/system` are healthy.
4. Set `NEXT_PUBLIC_SEPARATOR_URL` on Netlify to the HTTPS worker origin.
5. Redeploy Netlify.
6. Run Core 6 first, then test routed deep targets such as Lead Vocals, Kick and 808 Bass.
7. Confirm job telemetry in `music_stem_jobs` and permanent WAV copies in the private `music-assets` bucket.
