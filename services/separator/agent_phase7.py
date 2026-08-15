from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

import agent_core as core
import agent_phase5 as phase5
import agent_phase6 as phase6

app = phase6.app
SYSTEM_VERSION = "3.7.0"
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or phase6.SUPABASE_URL).rstrip("/")

_legacy_phase6_push = phase6._signed_push_cloud


def _edge_mirror_enabled() -> bool:
    return bool(SUPABASE_URL and core.WORKER_AUTH_SECRET)


def _derived_hmac_key() -> bytes:
    return hashlib.sha256(core.WORKER_AUTH_SECRET.encode("utf-8")).digest()


def _edge_push_cloud(job: dict[str, Any]) -> None:
    if not _edge_mirror_enabled():
        _legacy_phase6_push(job)
        return

    row = phase5._cloud_row(job)
    if not row:
        return

    payload = {**row, "sentAt": int(time.time())}
    payload_text = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(_derived_hmac_key(), payload_text.encode("utf-8"), hashlib.sha256).hexdigest()
    body = json.dumps({"payload_text": payload_text, "signature_hex": signature}).encode("utf-8")

    req = urllib_request.Request(
        f"{SUPABASE_URL}/functions/v1/stem-worker-mirror",
        data=body,
        headers={
            "Content-Type": "application/json",
            "User-Agent": f"MusicOS-StemWorker/{SYSTEM_VERSION}",
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as response:
            response.read(1)
    except (urllib_error.URLError, TimeoutError, OSError):
        # Local persistent state remains authoritative and will mirror again on a
        # later lifecycle write. Separation must never fail because telemetry is down.
        return


phase5._cloud_enabled = _edge_mirror_enabled
phase5._push_cloud = _edge_push_cloud


@app.get("/agent/mirror/edge")
def phase7_mirror_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "mode": "supabase-edge-hmac" if _edge_mirror_enabled() else "disabled",
        "supabaseConfigured": bool(SUPABASE_URL),
        "gatewaySecretConfigured": bool(core.WORKER_AUTH_SECRET),
        "adminKeyRequiredOnWorker": False,
        "endpoint": "/functions/v1/stem-worker-mirror",
        "keyDerivation": "sha256(gateway-secret) -> hmac-sha256(payload)",
    }
