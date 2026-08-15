# Music OS Stem Compute Controller

Always-on CPU-side controller for the Music OS Worker Mesh.

The browser and Netlify never receive a RunPod API key. Project-linked stem jobs are staged durably in private Supabase Storage by Phase 12. This controller watches that durable job state and controls one already-approved RunPod Pod.

## Safety boundary

The controller **never creates a GPU Pod**. Initial Pod creation/update remains a deliberate operator action through the protected `Stem GPU Control` GitHub workflow.

Paid auto-start has two gates and defaults off:

```text
STEM_CONTROLLER_AUTO_START=true
STEM_CONTROLLER_ACCEPT_GPU_CHARGES=I ACCEPT GPU CHARGES
```

If either is missing, pending jobs are reported as `demand` and no paid provider action is made.

Auto-stop is independently controlled and also defaults off:

```text
STEM_CONTROLLER_AUTO_STOP=true
STEM_CONTROLLER_IDLE_SECONDS=600
```

## Runtime flow

1. Music OS uploads a project source into private `music-assets` storage and creates a durable orchestration row.
2. If a compatible Worker Mesh node is already ready, Stem Director routes the job immediately.
3. If no compatible node is ready, the controller sees durable demand.
4. With paid auto-start explicitly enabled, the controller starts the approved RunPod Pod.
5. The GPU worker boots, self-registers through `stem-worker-heartbeat`, claims the durable source lease and processes the job.
6. Phase 12 lifecycle mirroring keeps the lease alive while work continues.
7. When no active jobs remain, optional auto-stop enters cooldown and stops the GPU after the configured idle period.
8. Persistent RunPod volume storage remains attached; the GPU itself no longer needs to stay billable 24/7.

## Required environment

```text
SUPABASE_URL=https://YOUR-PRODUCTION-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=server-only-key
RUNPOD_API_KEY=server-only-key
RUNPOD_STEM_POD_ID=approved-existing-pod

STEM_CONTROLLER_AUTO_START=false
STEM_CONTROLLER_ACCEPT_GPU_CHARGES=
STEM_CONTROLLER_AUTO_STOP=false
STEM_CONTROLLER_IDLE_SECONDS=600
STEM_CONTROLLER_POLL_SECONDS=5
STEM_CONTROLLER_PORT=8080
```

The Supabase service-role credential belongs only on the trusted VPS/controller. GPU workers continue to use the least-privilege HMAC Edge gateways and do not receive the service-role key.

## VPS deployment

Apply `db/music-os-phase13.sql`, then:

```bash
cd services/stem-controller
cp compose.example.yml compose.yml
# provide the environment values through the VPS secret/environment mechanism
docker compose up -d --build
curl http://127.0.0.1:8080/health
```

The health endpoint reports only safe operational state: standby/waking/ready/busy/cooldown/error, queue counts, and whether auto-start/auto-stop are enabled. It never returns provider or database credentials.

## Recommended production policy

Start with both auto-start and auto-stop disabled. Provision and verify the GPU Pod once through `Stem GPU Control`, stop it, then explicitly enable auto-start and auto-stop on the trusted VPS after accepting the billing behavior. A 10-minute idle timeout is the default recommendation so repeated stem jobs do not thrash the GPU lifecycle.
