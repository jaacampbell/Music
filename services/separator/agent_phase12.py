from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

import agent_api as base
import agent_core as core
import agent_phase5 as phase5
import agent_phase11 as phase11

app = phase11.app
SYSTEM_VERSION = "3.12.0"
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or phase11.SUPABASE_URL).rstrip("/")
ARTIFACT_ENDPOINT = f"{SUPABASE_URL}/functions/v1/stem-worker-artifacts" if SUPABASE_URL else ""

_original_cloud_row = phase5._cloud_row


class CloudJobRequest(BaseModel):
    orchestrationId: str = Field(min_length=36, max_length=36)


def _is_uuid(value: Any) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except Exception:
        return False


def _derived_hmac_key() -> bytes:
    return hashlib.sha256(core.WORKER_AUTH_SECRET.encode("utf-8")).digest()


def _signed_artifact_request(payload: dict[str, Any]) -> dict[str, Any]:
    if not (ARTIFACT_ENDPOINT and core.WORKER_AUTH_SECRET):
        raise HTTPException(503, "Cloud recovery broker is not configured on this worker.")
    wire = {**payload, "sentAt": int(time.time())}
    payload_text = json.dumps(wire, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(_derived_hmac_key(), payload_text.encode("utf-8"), hashlib.sha256).hexdigest()
    body = json.dumps({"payload_text": payload_text, "signature_hex": signature}).encode("utf-8")
    req = urllib_request.Request(
        ARTIFACT_ENDPOINT,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": f"MusicOS-StemWorker/{SYSTEM_VERSION}"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        try:
            detail = json.loads(exc.read().decode("utf-8"))
        except Exception:
            detail = {"error": f"artifact broker returned HTTP {exc.code}"}
        message = str(detail.get("error") or f"artifact broker returned HTTP {exc.code}")
        if detail.get("code") == "LEASE_ACTIVE":
            expiry = detail.get("leaseExpiresAt")
            message = f"Another worker still owns this job lease until {expiry}." if expiry else message
        raise HTTPException(exc.code, message) from exc
    except (urllib_error.URLError, TimeoutError, OSError) as exc:
        raise HTTPException(503, "Cloud recovery broker is unreachable.") from exc


def _download_signed_source(url: str, destination: Path) -> tuple[int, str]:
    total = 0
    digest = hashlib.sha256()
    try:
        with urllib_request.urlopen(url, timeout=30) as response, destination.open("wb") as output:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > core.MAX_UPLOAD_BYTES:
                    destination.unlink(missing_ok=True)
                    raise HTTPException(413, f"Cloud source exceeds {core.MAX_UPLOAD_BYTES // 1024 // 1024} MB.")
                digest.update(chunk)
                output.write(chunk)
    except HTTPException:
        raise
    except (urllib_error.URLError, TimeoutError, OSError) as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(502, "The worker could not download the durable cloud source.") from exc
    if not total:
        destination.unlink(missing_ok=True)
        raise HTTPException(422, "Durable cloud source was empty.")
    return total, digest.hexdigest()


def _phase12_cloud_row(job: dict[str, Any]) -> dict[str, Any] | None:
    row = _original_cloud_row(job)
    if not row:
        return None
    orchestration_id = job.get("orchestrationId")
    if _is_uuid(orchestration_id):
        row.update({
            "orchestration_id": orchestration_id,
            "worker_node_id": phase11.NODE_ID,
            "worker_origin": phase11.PUBLIC_ORIGIN,
            "source_storage_path": job.get("sourceStoragePath"),
            "source_sha256": job.get("sourceSha256"),
            "recovery_generation": int(job.get("recoveryGeneration", 0) or 0),
            "worker_version": SYSTEM_VERSION,
        })
    return row


phase5._cloud_row = _phase12_cloud_row


@app.post("/agent/jobs/cloud", status_code=202)
def create_cloud_agent_job(request: Request, body: CloudJobRequest) -> dict[str, Any]:
    claims = core.worker_claims(request)
    orchestration_id = body.orchestrationId
    if not _is_uuid(orchestration_id):
        raise HTTPException(400, "orchestrationId must be a UUID.")
    if claims.get("orchestrationId") != orchestration_id:
        raise HTTPException(403, "Worker session is not scoped to this cloud orchestration.")

    project_id = str(claims.get("projectId") or "")
    user_id = str(claims.get("sub") or "")
    if not (_is_uuid(project_id) and _is_uuid(user_id)):
        raise HTTPException(400, "Cloud recovery requires a project-scoped signed-in session.")

    worker_job_id = uuid.uuid4().hex[:12]
    claim = _signed_artifact_request({
        "action": "claim-source",
        "orchestration_id": orchestration_id,
        "node_id": phase11.NODE_ID,
        "worker_job_id": worker_job_id,
        "project_id": project_id,
        "user_id": user_id,
    })

    source_name = str(claim.get("sourceName") or "source-audio")
    suffix = Path(source_name).suffix.lower()
    if suffix not in core.ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Unsupported durable source extension: {suffix or 'unknown'}")

    job_dir = core.DATA_DIR / worker_job_id
    job_dir.mkdir(parents=True, exist_ok=False)
    upload_name = f"source-upload{suffix}"
    try:
        size, digest = _download_signed_source(str(claim["signedUrl"]), job_dir / upload_name)
        state = core.JOBS.create(worker_job_id, {
            "owner": user_id,
            "projectId": project_id,
            "orchestrationId": orchestration_id,
            "mode": "deep" if claims.get("mode") == "deep" else "core",
            "strategy": str(claims.get("strategy") or "auto")[:80],
            "instruction": str(claims.get("instruction") or "")[:2000],
            "requestedTargets": list(claims.get("targets") or []),
            "sourceName": source_name,
            "sourceSize": size,
            "sourceSha256": digest,
            "sourceStoragePath": claim.get("sourcePath"),
            "uploadFile": upload_name,
            "recoveryGeneration": int(claim.get("recoveryGeneration", 0) or 0),
            "recoveredFromNode": claim.get("recoveredFromNode"),
            "cloudIngress": True,
        })
        agent = "cross-node-recovery" if state.get("recoveryGeneration", 0) else "cloud-ingress"
        message = (
            f"Cloud orchestration recovered on {phase11.NODE_ID} from durable private source."
            if state.get("recoveryGeneration", 0)
            else f"Durable private source claimed by {phase11.NODE_ID}."
        )
        core.JOBS.event(worker_job_id, agent, message, 2, "recovering" if state.get("recoveryGeneration", 0) else "queued")
        base._executor.submit(base._process, worker_job_id)
        return {
            "jobId": worker_job_id,
            "orchestrationId": orchestration_id,
            "status": state["status"],
            "stage": state["stage"],
            "progress": state["progress"],
            "recoveryGeneration": state.get("recoveryGeneration", 0),
            "recoveredFromNode": state.get("recoveredFromNode"),
            "pollUrl": f"/agent/jobs/{worker_job_id}",
        }
    except Exception:
        if not (job_dir / "job.json").is_file():
            import shutil
            shutil.rmtree(job_dir, ignore_errors=True)
        raise


@app.get("/agent/recovery/cloud")
def phase12_recovery_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "enabled": bool(ARTIFACT_ENDPOINT and core.WORKER_AUTH_SECRET),
        "artifactBroker": "/functions/v1/stem-worker-artifacts",
        "sourceOfTruth": "supabase-private-storage",
        "executionLease": "edge-cas-60s",
        "recoveryMode": "cross-node-replay-from-source",
        "nodeId": phase11.NODE_ID,
    }
