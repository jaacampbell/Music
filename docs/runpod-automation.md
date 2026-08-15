# Stem Director RunPod automation

The `Stem GPU Control` GitHub Actions workflow manages the production GPU Pod without committing provider credentials.

## Required GitHub Actions secrets

- `RUNPOD_API_KEY` — required for every RunPod API operation.
- `SEPARATOR_GATEWAY_SECRET` — required for create/update/start/restart; must match the server-only Netlify gateway secret already used by Music OS.

Optional:

- `HF_TOKEN` — enables gated SAM-Audio model downloads for Agentic Deep mode.
- `OPENAI_API_KEY` — enables the optional LLM strategy planner. The deterministic director still works without it.
- `NETLIFY_AUTH_TOKEN` — if present, successful worker deployment automatically updates `NEXT_PUBLIC_SEPARATOR_URL` on the `musicdevnc` Netlify project and triggers a production build.

Optional repository variable:

- `RUNPOD_STEM_POD_ID` — default existing Pod ID for status/update/start/stop/restart/delete. A manually supplied workflow Pod ID overrides it.

## Financial/destructive guards

The workflow will not create, update, start or restart GPU compute unless the dispatch input contains exactly:

`I ACCEPT GPU CHARGES`

The workflow will not terminate a Pod unless the dispatch input contains exactly:

`TERMINATE STEM POD`

Stopping a Pod may still leave persistent-volume storage charges. Terminating the Pod is destructive to Pod-local resources, so preserve any required persistent model/job data appropriately.

## Default production configuration

- Image: `ghcr.io/jaacampbell/music-separator:latest`
- Port: `8000/http`
- Persistent volume: `/workspace`, 80 GB
- Container disk: 60 GB
- CUDA compatibility: 12.8
- GPU preference: RTX 4090 → RTX A6000 → RTX A5000 → L4, availability-ranked
- Cloud tier: Secure Cloud
- Deep engine: `facebook/sam-audio-small`
- Core engine: Demucs Core 6
- Lifecycle mirror: Supabase `stem-worker-mirror` Edge Function using derived HMAC authentication
- Browser origin: `https://musicdevnc.netlify.app`

## Deployment flow

1. GitHub Actions calls the current RunPod REST API.
2. RunPod creates/updates the Pod with the published GHCR image, secret runtime environment, persistent `/workspace` volume and HTTP port 8000.
3. The workflow probes `/agent/ready`, then captures `/agent/health`, `/agent/system` and `/agent/mirror/edge` diagnostics.
4. The stable worker origin is `https://<POD_ID>-8000.proxy.runpod.net`.
5. If `NETLIFY_AUTH_TOKEN` exists and `wire_netlify=true`, the workflow writes that origin to Netlify as `NEXT_PUBLIC_SEPARATOR_URL` and triggers a new production build.
6. `/stem-agent/status` then verifies the full control plane and compute plane independently.

## Operations

The same workflow supports `status`, `start`, `stop`, `restart`, `update`, and `delete`. Use `update` after a new separator image is published to roll the Pod to the new image while keeping `/workspace` persistent storage.
