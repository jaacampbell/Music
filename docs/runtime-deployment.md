# Music OS runtime deployment

This file documents the production runtime boundary without storing credentials.

## Current web/backend

- Frontend and Next.js server runtime: Netlify project `musicdevnc`.
- Persistent application data: Supabase project `music-os`.
- Database migrations required: Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 11 → Phase 12.
- Agentic Stem System route: `/stem-agent`.
- Production operations route: `/stem-agent/status`.
- Server readiness endpoint: `/api/stem-agent/readiness`.
- Worker lifecycle gateway: Supabase Edge Function `stem-worker-mirror`.
- Worker Mesh heartbeat gateway: Supabase Edge Function `stem-worker-heartbeat`.
- Durable source/lease broker: Supabase Edge Function `stem-worker-artifacts`.

## Stem worker

The production separator is a separate CPU/GPU container built from `services/separator/Dockerfile.gpu` or `Dockerfile.cpu`.

Phase 12 launches `agent_phase12:app` and includes:

- everything from the Phase 11 dynamic Worker Mesh,
- Demucs Core 6 separation,
- SAM-Audio Deep 60+ isolation,
- hierarchical parent-stem routing for deep isolation,
- technical QA and multi-pass recovery,
- persistent-volume same-node restart recovery,
- private cloud source staging before project-linked compute,
- a stable orchestration UUID that survives worker execution attempts,
- HMAC-authorized 60-second execution leases,
- 15-minute signed source URLs issued only after a successful lease claim,
- cross-node replay from the same durable private source after a real lease expiry,
- stale-node lifecycle rejection after takeover,
- Edge-gateway lifecycle mirroring into Supabase,
- HMAC-authenticated Worker Mesh heartbeats,
- dynamic worker discovery and least-loaded compatible routing,
- Deep jobs restricted to fresh CUDA + SAM-Audio capable nodes,
- per-attempt worker pinning for polling, downloads, mixer playback and handoff,
- project-scoped signed worker sessions,
- signed job downloads,
- refinement jobs without source re-upload,
- `/agent/system`, `/agent/mirror/edge`, `/agent/mesh/node`, and `/agent/recovery/cloud` diagnostics.

The production CUDA image is published through GitHub Actions to GitHub Container Registry as `ghcr.io/jaacampbell/music-separator:latest` plus immutable SHA tags.

## Durable orchestration and recovery

For a signed-in Music OS project, the source belongs to the cloud job—not to a GPU.

1. The browser uploads the source into the user/project prefix of private `music-assets` storage.
2. `music_stem_jobs` receives a stable `orchestration_id` before a worker is selected.
3. The server gateway selects a fresh compatible Worker Mesh node and signs a session scoped to that orchestration.
4. The worker asks `stem-worker-artifacts` to claim the source. The broker verifies project/user ownership, worker freshness, HMAC signature and the existing execution lease.
5. After a successful atomic lease claim, the broker gives that worker a short-lived signed source URL. The worker never receives a permanent Supabase storage credential.
6. `stem-worker-mirror` renews the active node's lease while the worker reports lifecycle progress.
7. A transient browser/worker network failure does not trigger duplicate work while the lease is alive; the browser follows mirrored cloud progress instead.
8. If the lease expires and the active node is actually gone, the server excludes that node, selects another compatible worker and starts a new execution attempt under the same orchestration ID.
9. The replacement worker downloads the same private source and recomputes from source. `recovery_generation` records each cross-node replay.
10. Once takeover occurs, lifecycle updates from the stale previous node are rejected.

Phase 12 is cross-node replay from durable source, not partial neural-model checkpoint resume. If a worker dies after it completed processing but before generated outputs were copied to permanent cloud storage, the source remains safe and the job can be regenerated. Direct worker-to-cloud output persistence is the next hardening layer.

## Worker Mesh routing

Workers register themselves instead of requiring the frontend to know a fixed worker URL.

1. A worker starts and receives its runtime identity. RunPod supplies `RUNPOD_POD_ID`, data-center and CUDA metadata automatically.
2. The worker derives its public HTTPS origin and sends a signed heartbeat to `stem-worker-heartbeat`.
3. Supabase stores only safe routing/health metadata in `music_worker_nodes`.
4. The authenticated Stem Director token route chooses a fresh compatible node with spare capacity.
5. Core jobs may route to any healthy Core-capable node. Agentic Deep jobs require a node reporting CUDA + SAM-Audio readiness.
6. `NEXT_PUBLIC_SEPARATOR_URL` remains only an optional emergency static fallback.

Adding, replacing or restarting a normal Worker Mesh node does not require a Netlify redeploy.

## Secret boundaries

Never commit runtime credentials.

- `SEPARATOR_GATEWAY_SECRET` is server/worker-only and must match on Netlify and every worker. On Netlify it is production-only but scoped to builds, functions, and runtime so the Next.js server bundle and deployed function receive it without exposing it to browser code.
- The canonical gateway secret is also kept encrypted in Supabase Vault for controlled recovery/configuration.
- Phase 12 workers do not need a Supabase admin/service-role key for lifecycle mirroring, mesh heartbeats or private source claims.
- Supabase Edge admin clients prefer the platform `SUPABASE_SERVICE_ROLE_KEY` JWT and retain newer named secret keys only as fallback.
- `HF_TOKEN` is worker-only when gated SAM-Audio checkpoints require it.
- `OPENAI_API_KEY` is server/worker-only when optional LLM strategy planning is enabled.
- `RUNPOD_API_KEY` is deployment-control only and must remain a protected automation/provider credential.

## Deployment automation

`Stem GPU Control` manages RunPod Pods using the published GHCR image. Paid GPU actions require the exact workflow confirmation `I ACCEPT GPU CHARGES`; Pod termination requires `TERMINATE STEM POD`.

For create/update/start/restart, the workflow verifies both Worker Mesh self-registration and `/agent/recovery/cloud`. A node is rejected if it becomes reachable but cannot participate in durable-source recovery. No Netlify URL write is required for the normal path.

`Production Smoke` verifies the live Netlify Ops page, lifecycle Edge gateway, Worker Mesh registry, durable artifact broker and cloud-recovery capability after successful main CI. With zero workers it accepts `control-plane-ready`. Once one or more nodes register, it additionally requires mesh-derived compute readiness and reports Deep capacity.

## Activation checklist

1. Apply `db/music-os-phase12.sql` after the prior Music OS migrations.
2. Deploy `stem-worker-mirror`, `stem-worker-heartbeat`, and `stem-worker-artifacts` with JWT verification disabled because each worker write path uses its own derived HMAC authentication.
3. Confirm all three public GET health endpoints report configuration ready.
4. Add/confirm the RunPod deployment credential in the protected automation environment.
5. Launch the current Phase 12 GHCR separator image on an HTTPS GPU host with persistent `/workspace` storage.
6. Configure the worker with the existing gateway secret, correct Supabase project URL and any optional HF/OpenAI tokens.
7. Confirm `/agent/ready`, `/agent/health`, `/agent/system`, `/agent/mirror/edge`, `/agent/mesh/node`, and `/agent/recovery/cloud` are healthy.
8. Confirm `/stem-agent/status` reports Worker Mesh plus durable recovery readiness.
9. Run Core 6 first, then test routed Deep targets such as Lead Vocals, Kick and 808 Bass.
10. For resilience testing, interrupt one worker only after a project-linked run has an active lease, allow the lease to expire, and verify the same orchestration increments `recovery_generation` on a different node.
11. Confirm job telemetry in `music_stem_jobs` and permanent completed WAV copies in the private `music-assets` bucket.
