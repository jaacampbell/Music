# RunPod A6000 — shared GPU lifecycle safety

The existing approved pod is shared by Music OS stem separation and JC Film Studio GPU rendering. It must **never** be automatically stopped using Music OS job counts alone.

This change adds:
- `GET /film/v1/editor/gpu-occupancy` protected with a short-lived, HMAC-signed `gpu-occupancy` capability.
- A controller guard that checks Film Studio occupancy **before** any automatic GPU stop.
- Fail-closed behavior: if Film Studio cannot be reached, token verification fails, or jobs have unknown statuses, the controller **does not stop the pod**.
- The RunPod GPU image must include `film_activity.py` and the new endpoint before auto-stop can work.

## Deploy order (important)
1. Run unit tests and compile `controller.py` and `film_editor.py`.
2. Build and publish a fresh GPU image containing the new film occupancy route.
3. Update the approved existing RunPod pod to use that image **only with explicit GPU billing authorization**.
4. Deploy the updated Railway controller and verify the signed occupancy response.
5. Only then configure `STEM_CONTROLLER_AUTO_START=true`, `STEM_CONTROLLER_ACCEPT_GPU_CHARGES=I ACCEPT GPU CHARGES`, `STEM_CONTROLLER_AUTO_STOP=true`, `STEM_CONTROLLER_IDLE_SECONDS=600`.
6. Verify provider wake-on-demand and absence of shutdown during live film work.

## Important limitations
- Server-local in-memory film jobs represent only work handled by the current worker process. Jobs being dispatched by other film systems may not be visible. For production, integrate a durable, cross-product workload lease registry before fully automatic shutdown is trusted.
- A short race remains between checking the worker and issuing the stop command; external film dispatch could arrive in this window.
- If the occupancy endpoint is not deployed, automatic stop intentionally **does nothing**, potentially incurring ongoing GPU charges until manual shutdown. Keep auto-start disabled until the stop path is validated.
- The controller does not create pods and never exposes provider credentials to browser code.
