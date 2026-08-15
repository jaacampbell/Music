# RunPod deployment — Agentic Stem System

The production recommendation is a **RunPod GPU Pod**, not a synchronous Serverless call. Music files are often larger than Serverless request payloads, and separation can run longer than an HTTP proxy request. The worker therefore accepts the upload quickly, returns a job ID, and exposes polling endpoints.

## Container

Build/publish `services/separator/Dockerfile.gpu`. The repository workflow publishes the container to GHCR.

Suggested image:

```text
ghcr.io/jaacampbell/music-separator:latest
```

If the GHCR package is private, add GitHub Container Registry credentials to RunPod or change the package visibility before deployment.

## Pod settings

Use an NVIDIA GPU with enough VRAM for the selected SAM-Audio checkpoint. Start with a 24 GB class GPU when available.

```text
Container disk: 30+ GB
Persistent volume: 50–100 GB
Volume mount: /workspace
Expose HTTP port: 8000
```

RunPod's Pod proxy URL format is:

```text
https://POD_ID-8000.proxy.runpod.net
```

## Required worker environment

```text
CORS_ORIGINS=https://musicdevnc.netlify.app
SEPARATOR_GATEWAY_SECRET=<same random 32+ byte secret used by Netlify>
HF_TOKEN=<Hugging Face token with SAM-Audio checkpoint access>
SAM_AUDIO_MODEL=facebook/sam-audio-small
SAM_AUDIO_DEVICE=cuda
DEMUCS_DEVICE=cuda
MAX_DEEP_TARGETS=60
SEPARATOR_JOB_WORKERS=1
SEPARATOR_MAX_UPLOAD_MB=500
SEPARATOR_JOB_TTL_HOURS=24
SEPARATOR_DOWNLOAD_TTL_SECONDS=21600
STEM_AGENT_DEEP_RETRIES=1
```

Optional strategy-agent configuration:

```text
OPENAI_API_KEY=<server-side key>
STEM_AGENT_USE_LLM=true
STEM_AGENT_MODEL=gpt-5-mini
```

Without an OpenAI key, the system uses its deterministic production-goal planner and all separation/QA functions remain available.

## Netlify environment

Set these on `musicdevnc`:

```text
NEXT_PUBLIC_SEPARATOR_URL=https://POD_ID-8000.proxy.runpod.net
SEPARATOR_GATEWAY_SECRET=<same secret as worker>
```

Never expose `SEPARATOR_GATEWAY_SECRET` with a `NEXT_PUBLIC_` prefix. The browser requests a short-lived signed worker token from `/api/stem-agent/token` after Supabase verifies the user session.

## Verify

```bash
curl https://POD_ID-8000.proxy.runpod.net/agent/health
curl https://POD_ID-8000.proxy.runpod.net/agent/ready
curl https://POD_ID-8000.proxy.runpod.net/catalog
```

Expected characteristics:

```text
status=ok
system=agentic-stem-system
samAudio.installed=true
samAudio.cudaAvailable=true
```

Then open:

```text
https://musicdevnc.netlify.app/stem-agent
```

## Persistence

Mount `/workspace` persistently. The worker stores model caches under `/workspace/models` and jobs under `/workspace/stem-agent/jobs`. Completed jobs expire according to `SEPARATOR_JOB_TTL_HOURS`. The browser copies generated stems into the user's private Supabase `music-assets` bucket, so the worker is a compute cache rather than the permanent project library.

## Scaling

Start with `SEPARATOR_JOB_WORKERS=1` per GPU. A single separation can use substantial GPU memory. Scale horizontally with additional Pods before raising in-process concurrency. The job API is asynchronous, so the frontend architecture does not need to change when compute scales out.
