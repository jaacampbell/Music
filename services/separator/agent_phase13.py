from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import time
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import Request

import agent_api as base
import agent_core as core
import agent_phase5 as phase5
import agent_phase11 as phase11
import agent_phase12 as phase12

app = phase12.app
SYSTEM_VERSION = "3.13.0"
TUS_CHUNK_BYTES = 6 * 1024 * 1024
UPLOAD_RETRIES = 4

phase11.SYSTEM_VERSION = SYSTEM_VERSION
phase12.SYSTEM_VERSION = SYSTEM_VERSION
_original_package = base._package
_original_cloud_row = phase5._cloud_row


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _b64(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


def _upload_metadata(storage_path: str, content_type: str) -> str:
    values = {
        "bucketName": "music-assets",
        "objectName": storage_path,
        "contentType": content_type,
        "cacheControl": "3600",
        "metadata": json.dumps({"source": "music-os-stem-worker", "workerVersion": SYSTEM_VERSION}, separators=(",", ":")),
    }
    return ",".join(f"{key} {_b64(value)}" for key, value in values.items())


def _request(req: urllib_request.Request, timeout: int = 30):
    return urllib_request.urlopen(req, timeout=timeout)


def _tus_offset(location: str, token: str) -> int:
    req = urllib_request.Request(
        location,
        headers={"Tus-Resumable": "1.0.0", "x-signature": token},
        method="HEAD",
    )
    with _request(req, 20) as response:
        return int(response.headers.get("Upload-Offset", "0"))


def _tus_upload(path: Path, *, endpoint: str, token: str, storage_path: str, content_type: str) -> None:
    size = path.stat().st_size
    create = urllib_request.Request(
        endpoint,
        data=b"",
        headers={
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(size),
            "Upload-Metadata": _upload_metadata(storage_path, content_type),
            "x-signature": token,
            "x-upsert": "false",
            "Content-Length": "0",
        },
        method="POST",
    )
    try:
        with _request(create, 30) as response:
            location = response.headers.get("Location")
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[-800:]
        raise RuntimeError(f"TUS upload creation failed ({exc.code}): {detail}") from exc
    if not location:
        raise RuntimeError("TUS upload creation did not return a Location header.")
    if location.startswith("/"):
        from urllib.parse import urljoin
        location = urljoin(endpoint, location)

    offset = 0
    with path.open("rb") as handle:
        while offset < size:
            handle.seek(offset)
            chunk = handle.read(TUS_CHUNK_BYTES)
            if not chunk:
                break
            last_error: Exception | None = None
            for attempt in range(UPLOAD_RETRIES):
                req = urllib_request.Request(
                    location,
                    data=chunk,
                    headers={
                        "Tus-Resumable": "1.0.0",
                        "Upload-Offset": str(offset),
                        "Content-Type": "application/offset+octet-stream",
                        "Content-Length": str(len(chunk)),
                        "x-signature": token,
                    },
                    method="PATCH",
                )
                try:
                    with _request(req, 60) as response:
                        offset = int(response.headers.get("Upload-Offset", str(offset + len(chunk))))
                    last_error = None
                    break
                except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, OSError) as exc:
                    last_error = exc
                    try:
                        offset = _tus_offset(location, token)
                    except Exception:
                        pass
                    if offset >= size:
                        last_error = None
                        break
                    time.sleep(min(2 ** attempt, 8))
                    handle.seek(offset)
                    chunk = handle.read(TUS_CHUNK_BYTES)
            if last_error:
                raise RuntimeError(f"TUS upload failed at byte {offset}: {last_error}") from last_error
    if offset != size:
        raise RuntimeError(f"TUS upload incomplete: {offset}/{size} bytes")


def _artifact_descriptor(path: Path, job_dir: Path, manifest_by_file: dict[str, dict[str, Any]]) -> dict[str, Any]:
    relative = path.relative_to(job_dir).as_posix()
    if relative == "manifest.json":
        kind, label, content_type = "manifest", "Stem manifest", "application/json"
        stem = {}
    elif relative == "agent-report.json":
        kind, label, content_type = "report", "Agent decision report", "application/json"
        stem = {}
    elif relative == "Agentic_Stem_Pack.zip":
        kind, label, content_type = "zip", "Organized stem pack", "application/zip"
        stem = {}
    else:
        kind = "stem"
        stem = manifest_by_file.get(relative, {})
        label = str(stem.get("label") or stem.get("name") or path.stem)
        content_type = "audio/wav"
    return {
        "relative_path": relative,
        "kind": kind,
        "label": label,
        "mime_type": content_type or mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        "byte_size": path.stat().st_size,
        "sha256": _sha256(path),
        "duration_sec": stem.get("durationSec"),
        "family": stem.get("family"),
        "engine": stem.get("engine"),
        "metadata": {
            "technicalQa": stem.get("technicalQa"),
            "attemptCount": stem.get("attemptCount"),
            "sourceLane": stem.get("sourceLane"),
        } if stem else {},
        "_path": path,
    }


def _persist_outputs(job_id: str, job_dir: Path) -> dict[str, Any] | None:
    job = core.JOBS.load(job_id)
    if not job or not job.get("cloudIngress") or not job.get("orchestrationId"):
        return None
    previous = job.get("resultPersistence")
    if isinstance(previous, dict) and previous.get("complete") is True:
        return previous

    manifest_path = job_dir / "manifest.json"
    report_path = job_dir / "agent-report.json"
    zip_path = job_dir / "Agentic_Stem_Pack.zip"
    if not (manifest_path.is_file() and report_path.is_file() and zip_path.is_file()):
        raise RuntimeError("Permanent persistence requires manifest, report and organized ZIP.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest_by_file = {str(item.get("file")): item for item in manifest.get("stems", []) if item.get("file")}
    files = sorted((job_dir / "stems").rglob("*.wav")) + [manifest_path, report_path, zip_path]
    artifacts = [_artifact_descriptor(path, job_dir, manifest_by_file) for path in files]

    core.JOBS.update(job_id, stage="cloud-persisting", progress=98)
    core.JOBS.event(job_id, "persistence-agent", f"Persisting {len(artifacts)} verified outputs directly to private cloud storage.", 98, "cloud-persisting")

    identity = {
        "orchestration_id": job["orchestrationId"],
        "node_id": phase11.NODE_ID,
        "worker_job_id": job_id,
        "project_id": job["projectId"],
        "user_id": job["owner"],
    }
    request_artifacts = [{k: v for k, v in item.items() if k in {"relative_path", "kind", "label", "mime_type", "byte_size", "sha256", "duration_sec", "family", "engine", "metadata"}} for item in artifacts]
    slots_response = phase12._signed_artifact_request({"action": "create-output-slots", **identity, "artifacts": request_artifacts})
    slots = slots_response.get("slots") or []
    by_relative = {str(slot.get("relativePath")): slot for slot in slots}
    if len(by_relative) != len(artifacts):
        raise RuntimeError("Artifact broker returned an incomplete output slot set.")

    committed = []
    for index, item in enumerate(artifacts, start=1):
        slot = by_relative.get(str(item["relative_path"]))
        if not slot:
            raise RuntimeError(f"Missing upload slot for {item['relative_path']}")
        _tus_upload(
            item["_path"],
            endpoint=str(slot["tusEndpoint"]),
            token=str(slot["token"]),
            storage_path=str(slot["storagePath"]),
            content_type=str(item["mime_type"]),
        )
        committed.append({
            **{k: v for k, v in item.items() if k != "_path" and k != "relative_path"},
            "storage_path": slot["storagePath"],
        })
        core.JOBS.event(job_id, "persistence-agent", f"Uploaded {item['relative_path']} ({index}/{len(artifacts)}).", 98, "cloud-persisting")

    commit_response: dict[str, Any] | None = None
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            commit_response = phase12._signed_artifact_request({"action": "commit-outputs", **identity, "artifacts": committed})
            last_error = None
            break
        except Exception as exc:
            last_error = exc
            time.sleep(2 ** attempt)
    if last_error or not commit_response:
        raise RuntimeError(f"Permanent output commit failed: {last_error}") from last_error

    result = {
        "complete": True,
        "artifactCount": commit_response.get("artifactCount", len(committed)),
        "bytes": commit_response.get("bytes"),
        "persistedAt": commit_response.get("persistedAt"),
        "outputPrefix": commit_response.get("outputPrefix"),
        "protocol": "tus-resumable-signed-token",
    }
    core.JOBS.update(job_id, resultPersistence=result)
    core.JOBS.event(job_id, "persistence-agent", f"Permanent cloud commit verified: {result['artifactCount']} artifacts.", 99, "cloud-persisted", result)
    return result


def _phase13_package(job_dir: Path) -> Path:
    package = _original_package(job_dir)
    _persist_outputs(job_dir.name, job_dir)
    return package


def _phase13_cloud_row(job: dict[str, Any]) -> dict[str, Any] | None:
    row = _original_cloud_row(job)
    if row:
        row["worker_version"] = SYSTEM_VERSION
    return row


base._package = _phase13_package
phase5._cloud_row = _phase13_cloud_row


@app.get("/agent/persistence/cloud")
def phase13_persistence_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "enabled": bool(phase12.ARTIFACT_ENDPOINT and core.WORKER_AUTH_SECRET),
        "source": "supabase-private-storage",
        "outputs": "supabase-private-storage",
        "uploadProtocol": "tus-resumable-signed-token",
        "chunkBytes": TUS_CHUNK_BYTES,
        "completionBarrier": True,
        "nodeId": phase11.NODE_ID,
    }


@app.get("/agent/results/{job_id}")
def phase13_result_state(request: Request, job_id: str) -> dict[str, Any]:
    job, _ = base.owned_job(request, job_id)
    return {
        "jobId": job_id,
        "orchestrationId": job.get("orchestrationId"),
        "resultPersistence": job.get("resultPersistence"),
        "status": job.get("status"),
        "stage": job.get("stage"),
    }
