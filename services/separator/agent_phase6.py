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

app = phase5.app
SYSTEM_VERSION = "3.6.0"
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or phase5.SUPABASE_URL).rstrip("/")
SUPABASE_PUBLISHABLE_KEY = (
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or ""
).strip()

_legacy_cloud_enabled = phase5._cloud_enabled
_legacy_push_cloud = phase5._push_cloud


def _signed_rpc_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY and core.WORKER_AUTH_SECRET)


def _phase6_cloud_enabled() -> bool:
    return _signed_rpc_enabled() or _legacy_cloud_enabled()


def _signed_push_cloud(job: dict[str, Any]) -> None:
    if not _signed_rpc_enabled():
        _legacy_push_cloud(job)
        return

    row = phase5._cloud_row(job)
    if not row:
        return

    payload = {**row, "sentAt": int(time.time())}
    payload_text = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(
        core.WORKER_AUTH_SECRET.encode("utf-8"),
        payload_text.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    body = json.dumps({"payload_text": payload_text, "signature_hex": signature}).encode("utf-8")
    req = urllib_request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/music_stem_worker_mirror",
        data=body,
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
            "User-Agent": f"MusicOS-StemWorker/{SYSTEM_VERSION}",
        },
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as response:
            response.read(1)
    except (urllib_error.URLError, TimeoutError, OSError):
        # Lifecycle mirroring is intentionally best-effort. The local persistent
        # job store remains authoritative and will retry on the next state write.
        return


phase5._cloud_enabled = _phase6_cloud_enabled
phase5._push_cloud = _signed_push_cloud


@app.get("/agent/mirror")
def phase6_mirror_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "mode": "signed-rpc" if _signed_rpc_enabled() else "secret-key-fallback" if _legacy_cloud_enabled() else "disabled",
        "supabaseConfigured": bool(SUPABASE_URL),
        "publishableKeyConfigured": bool(SUPABASE_PUBLISHABLE_KEY),
        "gatewaySecretConfigured": bool(core.WORKER_AUTH_SECRET),
        "adminKeyRequired": False if _signed_rpc_enabled() else bool(phase5.SUPABASE_SECRET_KEY),
        "rpc": "music_stem_worker_mirror",
    }
