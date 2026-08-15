# Music OS runtime deployment

This file documents the production runtime boundary without storing credentials.

## Current web/backend

- Frontend and Next.js server runtime: Netlify project `musicdevnc`.
- Persistent application data: Supabase project `music-os`.
- Database migrations required: Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7.
- Agentic Stem System route: `/stem-agent`.
- Production operations route: `/stem-agent/status`.
- Server readiness endpoint: `/api/stem-agent/readiness`.
- Worker lifecycle gateway: Supabase Edge Function `stem-worker-mirror`.

## Stem worker

The production separator is a separate CPU/GPU container built from `services/separator/Dockerfile.gpu` or `Dockerfile.cpu`.

Phase 7 launches `agent_phase7:app` and includes:

- asynchronous agent jobs,
- Demucs Core 6 separation,
- SAM-Audio Deep 60+ isolation,
- hierarchical parent-stem routing for deep isolation,
- technical QA and multi-pass recovery,
- persistent-volume restart recovery,
- Edge-gateway lifecycle mirroring into Supabase,
- project-scoped signed worker sessions,
- signed job downloads,
- refinement jobs without source re-upload,
- `/agent/system` runtime telemetry,
- `/agent/mirror/edge` mirror diagnostics.

The production CUDA image is published through GitHub Actions to GitHub Container Registry as `ghcr.io/jaacampbell/music-separator:latest` plus immutable SHA tags.

## Secret boundaries

Never commit runtime credentials.

- `SEPARATOR_GATEWAY_SECRET` is server/worker-only and must match on Netlify and the worker.
- The canonical gateway secret is also kept encrypted in Supabase Vault for controlled recovery/configuration.
- The Phase 7 GPU worker does not need a Supabase admin/service-role key for lifecycle mirroring.
- `HF_TOKEN` is worker-only when gated SAM-Audio checkpoints require it.
- `OPENAI_API_KEY` is server/worker-only when optional LLM strategy planning is enabled.
- `RUNPOD_API_KEY` is deployment-control only and must remain a protected automation/provider credential.

## Deployment automation

`Stem GPU Control` can manage a RunPod Pod using the published GHCR image. Paid GPU actions require the exact workflow confirmation `I ACCEPT GPU CHARGES`; Pod termination requires `TERMINATE STEM POD`.

`Production Smoke` verifies the live Netlify Ops page and readiness API after successful main CI. Before a worker is configured it requires the cloud control plane to be healthy and explicitly accepts `control-plane-ready`; after a worker URL is configured it additionally requires compute health.

## Activation checklist

1. Add/confirm the RunPod deployment credential in the protected automation environment.
2. Launch the current GHCR separator image on an HTTPS GPU host with persistent `/workspace` storage.
3. Configure the worker environment, including the existing gateway secret and Supabase project URL.
4. Confirm `/agent/ready`, `/agent/health`, `/agent/system`, and `/agent/mirror/edge` are healthy.
5. Set `NEXT_PUBLIC_SEPARATOR_URL` on Netlify to the HTTPS worker origin.
6. Redeploy Netlify.
7. Confirm `/stem-agent/status` reports compute and Agentic Deep readiness.
8. Run Core 6 first, then test routed deep targets such as Lead Vocals, Kick and 808 Bass.
9. Confirm job telemetry in `music_stem_jobs` and permanent WAV copies in the private `music-assets` bucket.
