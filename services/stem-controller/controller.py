#!/usr/bin/env python3
"""Always-on Music OS compute controller.

This trusted CPU-side service watches durable stem orchestrations in Supabase and
starts/stops one pre-approved RunPod GPU Pod. It never creates a Pod automatically.
Paid auto-start is disabled unless two independent environment switches are set.
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

RUNPOD_API = "https://rest.runpod.io/v1"
CHARGE_CONFIRMATION = "I ACCEPT GPU CHARGES"
ACTIVE_JOB_STATES = {"staging", "queued", "running", "recovering", "cancelling"}
DEMAND_JOB_STATES = {"staging", "queued", "recovering"}
FRESH_WORKER_SECONDS = 60
STATE_KEY = "stem-gpu"


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Config:
    def __init__(self) -> None:
        self.supabase_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
        self.supabase_key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
            or os.environ.get("SUPABASE_SECRET_KEY", "").strip()
        )
        self.runpod_api_key = os.environ.get("RUNPOD_API_KEY", "").strip()
        self.pod_id = os.environ.get("RUNPOD_STEM_POD_ID", "").strip()
        self.bootstrap_only = env_bool("STEM_CONTROLLER_BOOTSTRAP_ONLY", False)
        self.auto_start_requested = env_bool("STEM_CONTROLLER_AUTO_START", False)
        self.charge_confirmation = os.environ.get("STEM_CONTROLLER_ACCEPT_GPU_CHARGES", "").strip()
        self.auto_start = self.auto_start_requested and self.charge_confirmation == CHARGE_CONFIRMATION
        self.auto_stop = env_bool("STEM_CONTROLLER_AUTO_STOP", False)
        self.idle_seconds = max(60, int(os.environ.get("STEM_CONTROLLER_IDLE_SECONDS", "600")))
        self.poll_seconds = max(2, int(os.environ.get("STEM_CONTROLLER_POLL_SECONDS", "5")))
        self.port = int(os.environ.get("STEM_CONTROLLER_PORT", "8080"))
        self.upgrade_image = os.environ.get("STEM_CONTROLLER_UPGRADE_IMAGE", "").strip()
        self.upgrade_confirmation = os.environ.get("STEM_CONTROLLER_UPGRADE_CONFIRMATION", "").strip()
        self.editor_secret = os.environ.get("JC_EDITOR_SIGNING_SECRET", "").strip()

    def validate(self) -> None:
        if self.bootstrap_only:
            return
        if not self.supabase_url.startswith("https://"):
            raise RuntimeError("SUPABASE_URL must be the canonical production HTTPS project URL.")
        if not self.supabase_key:
            raise RuntimeError("A trusted Supabase service-role/secret key is required on the controller host.")
        if self.auto_start_requested and not self.auto_start:
            raise RuntimeError(
                f"STEM_CONTROLLER_AUTO_START was requested, but paid wake-up also requires exact confirmation: {CHARGE_CONFIRMATION}"
            )
        if (self.auto_start or self.auto_stop) and (not self.runpod_api_key or not self.pod_id):
            raise RuntimeError("RUNPOD_API_KEY and RUNPOD_STEM_POD_ID are required for provider lifecycle control.")
        if self.upgrade_image:
            if self.upgrade_confirmation != CHARGE_CONFIRMATION:
                raise RuntimeError(f"GPU worker upgrade requires exact confirmation: {CHARGE_CONFIRMATION}")
            if not self.runpod_api_key or not self.pod_id:
                raise RuntimeError("RUNPOD_API_KEY and RUNPOD_STEM_POD_ID are required for GPU worker upgrade.")
            if not self.editor_secret:
                raise RuntimeError("JC_EDITOR_SIGNING_SECRET is required for the composite Film Studio worker upgrade.")


class Controller:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.lock = threading.Lock()
        self.snapshot: dict[str, Any] = {
            "status": "bootstrap" if config.bootstrap_only else "starting",
            "state": "disabled" if config.bootstrap_only else "standby",
            "autoStartEnabled": config.auto_start,
            "autoStopEnabled": config.auto_stop,
            "podIdConfigured": bool(config.pod_id),
            "pendingJobs": 0,
            "activeJobs": 0,
            "readyWorkers": 0,
            "deepReadyWorkers": 0,
            "lastError": None,
            "bootstrapOnly": config.bootstrap_only,
            "nextAction": "Add SUPABASE_SERVICE_ROLE_KEY, RUNPOD_API_KEY, and RUNPOD_STEM_POD_ID, then disable bootstrap mode." if config.bootstrap_only else None,
            "checkedAt": now_iso(),
        }
        self.last_demand_monotonic = time.monotonic()
        self.stop_event = threading.Event()
        self.upgrade_submitted = False
        self.upgrade_announced = False
        self.film_ready_announced = False

    def supabase(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        headers = {
            "apikey": self.config.supabase_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation,resolution=merge-duplicates",
            "User-Agent": "MusicOS-StemComputeController/1.0",
        }
        # Modern sb_secret_* keys are API keys, not JWTs. Sending them as
        # Authorization: Bearer causes PostgREST to reject them as invalid JWTs.
        # Legacy service_role keys are JWTs and still require Authorization.
        if self.config.supabase_key.startswith("eyJ"):
            headers["Authorization"] = f"Bearer {self.config.supabase_key}"
        req = urllib_request.Request(
            f"{self.config.supabase_url}{path}",
            data=payload,
            method=method,
            headers=headers,
        )
        with urllib_request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None

    def runpod(self, method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib_request.Request(
            f"{RUNPOD_API}{path}",
            data=payload,
            method=method,
            headers={
                "Authorization": f"Bearer {self.config.runpod_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "MusicOS-StemComputeController/1.0",
            },
        )
        with urllib_request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}

    def load_jobs(self) -> list[dict[str, Any]]:
        query = urllib_parse.urlencode({
            "select": "id,orchestration_id,status,mode,source_storage_path,worker_node_id,worker_lease_expires_at,created_at,updated_at",
            "order": "created_at.desc",
            "limit": "100",
        })
        rows = self.supabase("GET", f"/rest/v1/music_stem_jobs?{query}")
        return rows if isinstance(rows, list) else []

    def load_compute_requests(self) -> list[dict[str, Any]]:
        query = urllib_parse.urlencode({
            "select": "request_id,status,kind,mode,expires_at,created_at,updated_at",
            "order": "created_at.desc",
            "limit": "100",
        })
        rows = self.supabase("GET", f"/rest/v1/music_compute_requests?{query}")
        return rows if isinstance(rows, list) else []

    def load_workers(self) -> list[dict[str, Any]]:
        query = urllib_parse.urlencode({
            "select": "node_id,status,deep_ready,current_jobs,capacity,last_seen,provider,provider_node_id,capabilities",
            "order": "last_seen.desc",
            "limit": "50",
        })
        rows = self.supabase("GET", f"/rest/v1/music_worker_nodes?{query}")
        return rows if isinstance(rows, list) else []

    @staticmethod
    def fresh_workers(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        cutoff = time.time() - FRESH_WORKER_SECONDS
        fresh: list[dict[str, Any]] = []
        for row in rows:
            try:
                seen = datetime.fromisoformat(str(row.get("last_seen", "")).replace("Z", "+00:00")).timestamp()
            except Exception:
                continue
            if seen < cutoff:
                continue
            if row.get("status") not in {"ready", "busy"}:
                continue
            fresh.append(row)
        return fresh

    def provider_state(self) -> dict[str, Any] | None:
        if not (self.config.runpod_api_key and self.config.pod_id):
            return None
        return self.runpod("GET", f"/pods/{self.config.pod_id}")

    @staticmethod
    def pod_running(pod: dict[str, Any] | None) -> bool:
        if not pod:
            return False
        state = str(pod.get("desiredStatus") or pod.get("status") or "").upper()
        return state in {"RUNNING", "STARTING"}

    @staticmethod
    def readable_provider_env(pod: dict[str, Any]) -> dict[str, str]:
        raw = pod.get("env")
        if raw is None:
            return {}
        if isinstance(raw, dict):
            env = {str(key): str(value) for key, value in raw.items()}
        elif isinstance(raw, list):
            env = {}
            for item in raw:
                if not isinstance(item, dict) or not item.get("key") or "value" not in item:
                    raise RuntimeError("RunPod did not return readable environment values; refusing to replace worker env.")
                env[str(item["key"])] = str(item.get("value") or "")
        else:
            raise RuntimeError("RunPod returned an unsupported environment representation; refusing worker upgrade.")
        if any("****" in value for value in env.values()):
            raise RuntimeError("RunPod returned masked environment values; refusing worker upgrade to protect existing secrets.")
        return env

    def film_worker_health(self) -> dict[str, Any] | None:
        if not self.config.editor_secret or not self.config.pod_id:
            return None
        url = f"https://{self.config.pod_id}-8000.proxy.runpod.net/film/health"
        req = urllib_request.Request(
            url,
            method="GET",
            headers={
                "Authorization": f"Bearer {self.config.editor_secret}",
                "User-Agent": "MusicOS-StemComputeController/1.0",
            },
        )
        try:
            with urllib_request.urlopen(req, timeout=10) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except Exception:
            return None

    def maybe_upgrade_provider(self, pod: dict[str, Any] | None) -> bool:
        target = self.config.upgrade_image
        if not target or not pod:
            return False
        current = str(pod.get("imageName") or "")
        film_url = f"https://{self.config.pod_id}-8000.proxy.runpod.net/film"
        if current == target:
            if not self.upgrade_announced:
                print(f"JC Film GPU upgrade active; image={target}; filmWorkerUrl={film_url}", flush=True)
                self.upgrade_announced = True
            health = self.film_worker_health()
            if health and health.get("editorReady") is True and not self.film_ready_announced:
                capabilities = ",".join((health.get("capabilities") or {}).get("editor") or [])
                print(
                    f"JC Film GPU editor ready; version={health.get('version')}; "
                    f"cuda={bool(health.get('cuda'))}; capabilities={capabilities}",
                    flush=True,
                )
                self.film_ready_announced = True
            return False
        if self.upgrade_submitted:
            return True
        env = self.readable_provider_env(pod)
        env["JC_EDITOR_SIGNING_SECRET"] = self.config.editor_secret
        env["WAN_API_TOKEN"] = self.config.editor_secret
        env["WAN_PUBLIC_BASE_URL"] = film_url
        self.runpod("POST", f"/pods/{self.config.pod_id}/update", {
            "imageName": target,
            "env": env,
        })
        self.upgrade_submitted = True
        print(f"JC Film GPU upgrade submitted; image={target}; filmWorkerUrl={film_url}", flush=True)
        return True

    def publish(self, state: str, *, pending: int, active: int, ready: int, deep: int, error: str | None = None, action: str | None = None, provider_status: str | None = None, provider_image: str | None = None, provider_ports: list[Any] | None = None, provider_env_keys: list[str] | None = None) -> None:
        payload = {
            "key": STATE_KEY,
            "provider": "runpod",
            "provider_node_id": self.config.pod_id or None,
            "state": state,
            "auto_start_enabled": self.config.auto_start,
            "auto_stop_enabled": self.config.auto_stop,
            "idle_timeout_seconds": self.config.idle_seconds,
            "pending_jobs": pending,
            "active_jobs": active,
            "ready_workers": ready,
            "deep_ready_workers": deep,
            "last_seen": now_iso(),
            "last_error": error,
            "metadata": {
                "controllerVersion": "1.1.0",
                "policy": "approved-existing-pod-only",
                "paidAutoStartRequested": self.config.auto_start_requested,
                "providerReachable": provider_status not in {None, "unconfigured"},
                "providerStatus": provider_status,
                "providerImage": provider_image,
                "providerPorts": provider_ports,
                "providerEnvKeys": provider_env_keys or [],
            },
        }
        if pending or active:
            payload["last_demand_at"] = now_iso()
        if action:
            payload["last_action_at"] = now_iso()
        self.supabase("POST", "/rest/v1/music_compute_state?on_conflict=key", payload)
        with self.lock:
            self.snapshot = {
                "status": "ok" if not error else "degraded",
                "state": state,
                "autoStartEnabled": self.config.auto_start,
                "autoStopEnabled": self.config.auto_stop,
                "podIdConfigured": bool(self.config.pod_id),
                "pendingJobs": pending,
                "activeJobs": active,
                "readyWorkers": ready,
                "deepReadyWorkers": deep,
                "lastError": error,
                "lastAction": action,
                "providerReachable": provider_status not in {None, "unconfigured"},
                "providerStatus": provider_status,
                "providerImage": provider_image,
                "providerPorts": provider_ports,
                "providerEnvKeys": provider_env_keys or [],
                "checkedAt": now_iso(),
            }

    def cycle(self) -> None:
        jobs = self.load_jobs()
        requests = self.load_compute_requests()
        workers = self.fresh_workers(self.load_workers())
        active_jobs = [row for row in jobs if row.get("status") in ACTIVE_JOB_STATES and row.get("source_storage_path")]
        pending_jobs = [row for row in active_jobs if row.get("status") in DEMAND_JOB_STATES]
        now_ts = time.time()
        active_requests = []
        for row in requests:
            if row.get("status") not in {"queued", "running"}:
                continue
            try:
                expires = datetime.fromisoformat(str(row.get("expires_at", "")).replace("Z", "+00:00")).timestamp()
            except Exception:
                continue
            if expires > now_ts:
                active_requests.append(row)
        pending_requests = [row for row in active_requests if row.get("status") == "queued"]
        ready = [row for row in workers if row.get("status") == "ready" and int(row.get("current_jobs") or 0) < int(row.get("capacity") or 1)]
        deep_ready = [row for row in ready if row.get("deep_ready") is True]
        demand_deep = any(row.get("mode") == "deep" for row in pending_jobs) or any(row.get("mode") == "deep" for row in pending_requests)
        needs_vocal_correction = any(row.get("kind") == "vocal-correction" for row in pending_requests)
        base_compatible = deep_ready if demand_deep else ready
        compatible = [
            row for row in base_compatible
            if not needs_vocal_correction
            or (isinstance(row.get("capabilities"), dict) and row["capabilities"].get("vocalCorrection") is True)
        ]
        pending_count = len(pending_jobs) + len(pending_requests)
        active_count = len(active_jobs) + len(active_requests)

        if active_count:
            self.last_demand_monotonic = time.monotonic()

        # Read-only provider probe is safe even when lifecycle automation is disabled.
        # This validates the configured RunPod API key + approved Pod ID without
        # starting or stopping compute.
        pod = self.provider_state()
        running = self.pod_running(pod)
        provider_status = str((pod or {}).get("desiredStatus") or (pod or {}).get("status") or "unknown").lower() if pod is not None else "unconfigured"
        provider_image = str((pod or {}).get("imageName") or "") or None
        provider_ports = (pod or {}).get("ports") if isinstance((pod or {}).get("ports"), list) else None
        if self.maybe_upgrade_provider(pod):
            self.publish("upgrading", pending=pending_count, active=active_count, ready=len(ready), deep=len(deep_ready), action="update", provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=[])
            return

        raw_env = (pod or {}).get("env")
        if isinstance(raw_env, dict):
            provider_env_keys = sorted(str(key) for key in raw_env.keys())
        elif isinstance(raw_env, list):
            provider_env_keys = sorted(str(item.get("key")) for item in raw_env if isinstance(item, dict) and item.get("key"))
        else:
            provider_env_keys = []

        if pending_count and not compatible:
            if self.config.auto_start:
                if not running:
                    self.runpod("POST", f"/pods/{self.config.pod_id}/start")
                    self.publish("waking", pending=pending_count, active=active_count, ready=len(ready), deep=len(deep_ready), action="start", provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
                    return
                self.publish("waking", pending=pending_count, active=active_count, ready=len(ready), deep=len(deep_ready), provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
                return
            self.publish("demand", pending=pending_count, active=active_count, ready=len(ready), deep=len(deep_ready), provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
            return

        if active_count:
            state = "busy" if any(int(row.get("current_jobs") or 0) > 0 for row in workers) else "ready"
            self.publish(state, pending=pending_count, active=active_count, ready=len(ready), deep=len(deep_ready), provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
            return

        idle_for = time.monotonic() - self.last_demand_monotonic
        if self.config.auto_stop and running:
            if idle_for >= self.config.idle_seconds:
                self.publish("stopping", pending=0, active=0, ready=len(ready), deep=len(deep_ready), action="stop", provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
                self.runpod("POST", f"/pods/{self.config.pod_id}/stop")
                return
            self.publish("cooldown", pending=0, active=0, ready=len(ready), deep=len(deep_ready), provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)
            return

        self.publish("standby", pending=0, active=0, ready=len(ready), deep=len(deep_ready), provider_status=provider_status, provider_image=provider_image, provider_ports=provider_ports, provider_env_keys=provider_env_keys)

    def loop(self) -> None:
        while not self.stop_event.is_set():
            try:
                self.cycle()
            except urllib_error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")[-600:]
                self._error(f"HTTP {exc.code}: {detail}")
            except Exception as exc:
                self._error(str(exc))
            self.stop_event.wait(self.config.poll_seconds)

    def _error(self, message: str) -> None:
        print(f"Stem Compute Controller runtime error: {message}", flush=True)
        with self.lock:
            self.snapshot = {**self.snapshot, "status": "degraded", "state": "error", "lastError": message, "checkedAt": now_iso()}
        try:
            self.publish("error", pending=int(self.snapshot.get("pendingJobs", 0)), active=int(self.snapshot.get("activeJobs", 0)), ready=int(self.snapshot.get("readyWorkers", 0)), deep=int(self.snapshot.get("deepReadyWorkers", 0)), error=message)
        except Exception:
            pass


class HealthHandler(BaseHTTPRequestHandler):
    controller: Controller

    def do_GET(self) -> None:
        if self.path not in {"/", "/health", "/status"}:
            self.send_response(404)
            self.end_headers()
            return
        with self.controller.lock:
            body = json.dumps(self.controller.snapshot).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    config = Config()
    config.validate()
    controller = Controller(config)
    HealthHandler.controller = controller
    if not config.bootstrap_only:
        worker = threading.Thread(target=controller.loop, name="compute-controller", daemon=True)
        worker.start()
    server = ThreadingHTTPServer(("0.0.0.0", config.port), HealthHandler)
    print(f"TM Music Studio Stem Compute Controller listening on :{config.port}; bootstrap={config.bootstrap_only}; auto-start={config.auto_start}; auto-stop={config.auto_stop}", flush=True)
    try:
        server.serve_forever()
    finally:
        controller.stop_event.set()
        server.server_close()


if __name__ == "__main__":
    main()
