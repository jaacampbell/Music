# Music OS runtime deployment

This file documents the production runtime boundary without storing credentials.

## Current web/backend

- Frontend and Next.js server runtime: Netlify project `musicdevnc`.
- Persistent application data: Supabase project `music-os`.
- Database migrations required: Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 11.
- Agentic Stem System route: `/stem-agent`.
- Production operations route: `/stem-agent/status`.
- Server readiness endpoint: `/api/stem-agent/readiness`.
- Worker lifecycle gateway: Supabase Edge Function `stem-worker-mirror`.
- Worker Mesh heartbeat gateway: Supabase Edge Function `stem-worker-heartbeat`.

## Stem worker

The production separator is a separate CPU/GPU container built from `services/separator/Dockerfile.gpu` or `Dockerfile.cpu`.

Phase 11 launches `agent_phase11:app` and includes:

- everything from the Phase 7 asynchronous agent worker,
- Demucs Core 6 separation,
- SAM-Audio Deep 60+ isolation,
- hierarchical parent-stem routing for deep isolation,
- technical QA and multi-pass recovery,
- persistent-volume restart recovery,
- Edge-gateway lifecycle mirroring into Supabase,
- HMAC-authenticated Worker Mesh heartbeats,
- dynamic worker discovery and least-loaded compatible routing,
- Deep jobs restricted to fresh CUDA + SAM-Audio capable nodes,
- per-job worker pinning for polling, refinement, downloads and cloud handoff,
- project-scoped signed worker sessions,
- signed job downloads,
- refinement jobs without source re-upload,
- `/agent/system` runtime telemetry,
- `/agent/mirror/edge` mirror diagnostics,
- `/agent/mesh/node` self-registration diagnostics.

The production CUDA image is published through GitHub Actions to GitHub Container Registry as `ghcr.io/jaacampbell/music-separator:latest` plus immutable SHA tags.

## Worker Mesh routing

Workers register themselves instead of requiring the frontend to know a fixed worker URL.

1. A worker starts and receives its runtime identity. RunPod supplies `RUNPOD_POD_ID`, data-center and CUDA metadata automatically.
2. The worker derives its public HTTPS origin and sends a signed heartbeat to `stem-worker-heartbeat`.
3. Supabase stores only routing/health metadata in `music_worker_nodes`.
4. The authenticated Stem Director token route chooses a fresh compatible node with spare capacity.
5. Core jobs may route to any healthy Core-capable node. Agentic Deep jobs require a node reporting CUDA + SAM-Audio readiness.
6. The chosen worker origin is returned with the short-lived signed worker session and is pinned to that job.
7. `NEXT_PUBLIC_SEPARATOR_URL` is retained only as an optional emergency static fallback.

This means adding, replacing or restarting a normal Worker Mesh node does not require a Netlify redeploy.

## Secret boundaries

Never commit runtime credentials.

- `SEPARATOR_GATEWAY_SECRET` is server/worker-only and must match on Netlify and every worker. On Netlify it is production-only but scoped to builds, functions, and runtime so the Next.js server bundle and deployed function both receive it without exposing it to browser code.
- The canonical gateway secret is also kept encrypted in Supabase Vault for controlled recovery/configuration.
- Phase 11 workers do not need a Supabase admin/service-role key for lifecycle mirroring or mesh heartbeats.
- `HF_TOKEN` is worker-only when gated SAM-Audio checkpoints require it.
- `OPENAI_API_KEY` is server/worker-only when optional LLM strategy planning is enabled.
- `RUNPOD_API_KEY` is deployment-control only and must remain a protected automation/provider credential.

## Deployment automation

`Stem GPU Control` manages RunPod Pods using the published GHCR image. Paid GPU actions require the exact workflow confirmation `I ACCEPT GPU CHARGES`; Pod termination requires `TERMINATE STEM POD`.

For create/update/start/restart, the workflow now verifies `/agent/mesh/node` and fails unless the worker has successfully heartbeated into Worker Mesh. No Netlify URL write is required for the normal path.

`Production Smoke` verifies the live Netlify Ops page, lifecycle Edge gateway and Worker Mesh registry after successful main CI. With zero workers it accepts `control-plane-ready`. Once one or more nodes register, it requires mesh-derived compute readiness and reports Deep capacity separately.

## Activation checklist

1. Apply `db/music-os-phase11.sql` to Supabase.
2. Deploy the `stem-worker-heartbeat` Edge Function with JWT verification disabled because it uses its own derived HMAC authentication.
3. Add/confirm the RunPod deployment credential in the protected automation environment.
4. Launch the current GHCR separator image on an HTTPS GPU host with persistent `/workspace` storage.
5. Configure the worker with the existing gateway secret, Supabase project URL and any optional HF/OpenAI tokens.
6. Confirm `/agent/ready`, `/agent/health`, `/agent/system`, `/agent/mirror/edge`, and `/agent/mesh/node` are healthy.
7. Confirm `/stem-agent/status` reports the Worker Mesh node and Agentic Deep readiness.
8. Run Core 6 first, then test routed deep targets such as Lead Vocals, Kick and 808 Bass.
9. Confirm job telemetry in `music_stem_jobs`, worker routing fields, and permanent WAV copies in the private `music-assets` bucket.
