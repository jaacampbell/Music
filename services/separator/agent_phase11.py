from __future__ import annotations

import hashlib
import hmac
import json
import os
import socket
import threading
import time
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

import agent_api as base
import agent_core as core
import agent_phase5 as phase5
import agent_phase7 as phase7

app = phase7.app
SYSTEM_VERSION = "3.11.0"
HEARTBEAT_SECONDS = max(5.0, float(os.environ.get("STEM_WORKER_HEARTBEAT_SECONDS", "15")))
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or phase7.SUPABASE_URL).rstrip("/")
_stop_heartbeat = threading.Event()
_heartbeat_thread: threading.Thread | None = None
_last_heartbeat: dict[str, Any] = {"ok": False, "error": "not started"}


def _node_identity() -> dict[str, str]:
    pod_id = os.environ.get("RUNPOD_POD_ID", "").strip()
    provider = os.environ.get("WORKER_PROVIDER", "runpod" if pod_id else "custom").strip().lower() or "custom"
    provider_node_id = os.environ.get("WORKER_PROVIDER_NODE_ID", pod_id).strip()
    node_id = os.environ.get("WORKER_NODE_ID", f"{provider}:{provider_node_id}" if provider_node_id else socket.gethostname()).strip()
    public_url = os.environ.get("WORKER_PUBLIC_URL", "").strip().rstrip("/")
    if not public_url and provider == "runpod" and pod_id:
        public_url = f"https://{pod_id}-8000.proxy.runpod.net"
    return {
        "node_id": node_id,
        "provider": provider,
        "provider_node_id": provider_node_id,
        "origin": public_url,
    }


def _gpu_name() -> str:
    try:
        import torch
        return str(torch.cuda.get_device_name(0)) if torch.cuda.is_available() else ""
    except Exception:
        return ""


def _job_counts() -> tuple[int, int]:
    active = 0
    queued = 0
    for child in phase5.DATA_DIR.iterdir():
        if not child.is_dir():
            continue
        job = phase5.JOBS.load(child.name)
        if not job:
            continue
        status = job.get("status")
        if status == "queued":
            queued += 1
        elif status in {"running", "cancelling"}:
            active += 1
    return active, queued


def _heartbeat_payload(status_override: str | None = None) -> dict[str, Any] | None:
    identity = _node_identity()
    if not identity["origin"]:
        return None
    active, queued = _job_counts()
    cuda = base.legacy._cuda_available()
    sam = base.legacy._sam_package_available()
    capacity = max(1, base.JOB_WORKERS)
    deep_ready = bool(cuda and sam)
    status = status_override or ("busy" if active >= capacity else "ready")
    cost_raw = os.environ.get("WORKER_COST_PER_HR", "").strip()
    try:
        cost = float(cost_raw) if cost_raw else None
    except ValueError:
        cost = None
    return {
        "sentAt": int(time.time()),
        **identity,
        "status": status,
        "worker_version": SYSTEM_VERSION,
        "region": os.environ.get("RUNPOD_DC_ID", os.environ.get("WORKER_REGION", "")),
        "gpu_name": _gpu_name(),
        "cuda_version": os.environ.get("CUDA_VERSION", ""),
        "sam_audio": sam,
        "deep_ready": deep_ready,
        "hierarchical_routing": phase5.HIERARCHICAL_ROUTING,
        "restart_recovery": phase5.RESUME_ON_START,
        "cloud_mirror": phase7._edge_mirror_enabled(),
        "current_jobs": active,
        "capacity": capacity,
        "cost_per_hr": cost,
        "capabilities": {
            "core6": True,
            "deep60Plus": deep_ready,
            "hierarchicalRouting": phase5.HIERARCHICAL_ROUTING,
            "restartRecovery": phase5.RESUME_ON_START,
            "cloudLifecycleMirror": phase7._edge_mirror_enabled(),
            "refinementJobs": True,
            "signedDownloads": bool(core.WORKER_AUTH_SECRET),
        },
        "metadata": {
            "queuedJobs": queued,
            "coreModel": base.legacy.CORE_MODEL,
            "samModel": base.legacy.SAM_MODEL_NAME,
            "hostname": os.environ.get("RUNPOD_POD_HOSTNAME", socket.gethostname()),
            "gpuCount": os.environ.get("RUNPOD_GPU_COUNT", ""),
            "cpuCount": os.environ.get("RUNPOD_CPU_COUNT", ""),
        },
    }


def _send_heartbeat(status_override: str | None = None) -> bool:
    global _last_heartbeat
    if not SUPABASE_URL or not core.WORKER_AUTH_SECRET:
        _last_heartbeat = {"ok": False, "error": "Supabase URL or gateway secret missing", "at": time.time()}
        return False
    payload = _heartbeat_payload(status_override)
    if not payload:
        _last_heartbeat = {"ok": False, "error": "Worker public origin is unavailable", "at": time.time()}
        return False
    payload_text = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    derived_key = hashlib.sha256(core.WORKER_AUTH_SECRET.encode("utf-8")).digest()
    signature = hmac.new(derived_key, payload_text.encode("utf-8"), hashlib.sha256).hexdigest()
    envelope = json.dumps({"payload_text": payload_text, "signature_hex": signature}).encode("utf-8")
    req = urllib_request.Request(
        f"{SUPABASE_URL}/functions/v1/stem-worker-heartbeat",
        data=envelope,
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": f"MusicOS-StemWorker/{SYSTEM_VERSION}"},
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as response:
            response.read(1)
        _last_heartbeat = {"ok": True, "at": time.time(), "nodeId": payload["node_id"], "status": payload["status"]}
        return True
    except (urllib_error.URLError, TimeoutError, OSError) as exc:
        _last_heartbeat = {"ok": False, "at": time.time(), "error": str(exc)[-300:], "nodeId": payload["node_id"]}
        return False


def _heartbeat_loop() -> None:
    while not _stop_heartbeat.is_set():
        _send_heartbeat()
        _stop_heartbeat.wait(HEARTBEAT_SECONDS)


@app.on_event("startup")
def phase11_startup() -> None:
    global _heartbeat_thread
    if _heartbeat_thread and _heartbeat_thread.is_alive():
        return
    _stop_heartbeat.clear()
    _heartbeat_thread = threading.Thread(target=_heartbeat_loop, name="stem-worker-heartbeat", daemon=True)
    _heartbeat_thread.start()


@app.on_event("shutdown")
def phase11_shutdown() -> None:
    _stop_heartbeat.set()
    try:
        _send_heartbeat("offline")
    except Exception:
        pass
    if _heartbeat_thread and _heartbeat_thread.is_alive():
        _heartbeat_thread.join(timeout=2)


@app.get("/agent/mesh/node")
def phase11_node() -> dict[str, Any]:
    identity = _node_identity()
    active, queued = _job_counts()
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "node": {
            "nodeId": identity["node_id"],
            "provider": identity["provider"],
            "providerNodeId": identity["provider_node_id"],
            "originConfigured": bool(identity["origin"]),
            "region": os.environ.get("RUNPOD_DC_ID", os.environ.get("WORKER_REGION", "")),
            "gpu": _gpu_name(),
            "cuda": base.legacy._cuda_available(),
            "samAudio": base.legacy._sam_package_available(),
            "activeJobs": active,
            "queuedJobs": queued,
            "capacity": max(1, base.JOB_WORKERS),
        },
        "heartbeat": _last_heartbeat,
        "heartbeatEverySeconds": HEARTBEAT_SECONDS,
    }
