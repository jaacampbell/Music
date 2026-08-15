from __future__ import annotations

import json
import os
import shutil
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

import agent_api as base

app = base.app
legacy = base.legacy
JOBS = base.JOBS
DATA_DIR = base.DATA_DIR

SYSTEM_VERSION = "3.5.0"
HIERARCHICAL_ROUTING = os.environ.get("STEM_AGENT_HIERARCHICAL", "true").lower() == "true"
RESUME_ON_START = os.environ.get("SEPARATOR_RESUME_ON_START", "true").lower() == "true"
MAX_RESTART_RESUMES = max(0, min(5, int(os.environ.get("SEPARATOR_MAX_RESTART_RESUMES", "2"))))
CLOUD_SYNC_INTERVAL = max(1.0, float(os.environ.get("SEPARATOR_CLOUD_SYNC_INTERVAL_SECONDS", "2")))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SECRET_KEY = (os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()

ROUTING = {
    "Vocals": ("Vocals", "01_Vocals.wav", "Core Vocals"),
    "Drums": ("Drums", "02_Drums.wav", "Core Drums"),
    "Bass": ("Bass", "03_Bass.wav", "Core Bass"),
    "Guitars": ("Guitars", "04_Guitar.wav", "Core Guitar"),
    "Keys": ("Keys", "05_Piano.wav", "Core Piano/Keys"),
}

_sync_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="stem-cloud-sync")
_sync_lock = threading.Lock()
_last_sync: dict[str, float] = {}
_original_write = JOBS.write
_original_deep_target = base._deep_target
_original_process = base._process


def _is_uuid(value: Any) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except Exception:
        return False


def _cloud_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY)


def _cloud_row(job: dict[str, Any]) -> dict[str, Any] | None:
    project_id = job.get("projectId")
    owner = job.get("owner")
    if not (_is_uuid(project_id) and _is_uuid(owner)):
        return None

    manifest = None
    report = None
    job_dir = DATA_DIR / str(job.get("jobId", ""))
    if job.get("status") == "completed":
        manifest_path = job_dir / "manifest.json"
        report_path = job_dir / "agent-report.json"
        try:
            if manifest_path.is_file():
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if report_path.is_file():
                report = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass

    return {
        "project_id": project_id,
        "user_id": owner,
        "worker_job_id": job.get("jobId"),
        "parent_worker_job_id": job.get("parentJobId"),
        "status": job.get("status", "queued"),
        "stage": job.get("stage", "queued"),
        "progress": int(job.get("progress", 0) or 0),
        "mode": job.get("mode", "deep"),
        "strategy": job.get("strategy", "auto"),
        "instruction": job.get("instruction", ""),
        "requested_targets": job.get("requestedTargets", []),
        "plan": job.get("plan"),
        "quality_summary": job.get("qualitySummary"),
        "agent_report": report,
        "manifest": manifest,
        "error": job.get("error"),
        "started_at": job.get("startedAt"),
        "completed_at": job.get("completedAt"),
        "events": job.get("events", []),
        "source_profile": job.get("sourceProfile"),
        "routing_summary": job.get("routingSummary", []),
        "current_target": job.get("currentTarget"),
        "source_lane": job.get("sourceLane"),
        "resume_count": int(job.get("resumeCount", 0) or 0),
        "worker_version": SYSTEM_VERSION,
    }


def _push_cloud(job: dict[str, Any]) -> None:
    if not _cloud_enabled():
        return
    row = _cloud_row(job)
    if not row:
        return
    body = json.dumps(row).encode("utf-8")
    url = f"{SUPABASE_URL}/rest/v1/music_stem_jobs?on_conflict=user_id,worker_job_id"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    if SUPABASE_SECRET_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {SUPABASE_SECRET_KEY}"
    req = urllib_request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib_request.urlopen(req, timeout=8) as response:
            response.read(1)
    except (urllib_error.URLError, TimeoutError, OSError):
        # Cloud mirroring must never fail the audio job. Local job.json remains authoritative.
        return


def _schedule_cloud_sync(job: dict[str, Any], force: bool = False) -> None:
    if not _cloud_enabled() or not job.get("jobId"):
        return
    job_id = str(job["jobId"])
    current = time.monotonic()
    with _sync_lock:
        previous = _last_sync.get(job_id, 0.0)
        terminal = job.get("status") in base.TERMINAL_STATUSES
        if not (force or terminal or current - previous >= CLOUD_SYNC_INTERVAL):
            return
        _last_sync[job_id] = current
    _sync_executor.submit(_push_cloud, json.loads(json.dumps(job)))


def _phase5_write(job_id: str, payload: dict[str, Any]) -> None:
    _original_write(job_id, payload)
    _schedule_cloud_sync(payload)


JOBS.write = _phase5_write  # type: ignore[assignment]


def _route_source(job_dir: Path, source_wav: Path, target: dict[str, Any]) -> tuple[Path, str]:
    if not HIERARCHICAL_ROUTING:
        return source_wav, "Full Mix"
    route = ROUTING.get(str(target.get("group", "")))
    if not route:
        return source_wav, "Full Mix"
    folder, filename, lane = route
    candidate = job_dir / "stems" / folder / filename
    return (candidate, lane) if candidate.is_file() else (source_wav, "Full Mix")


def _prompt_candidates(target: dict[str, Any]) -> list[str]:
    prompts = list(base._prompt_candidates(target))
    label = target["label"]
    routed = f"Extract only {label} from the routed parent stem; reject all remaining bleed and unrelated material."
    if routed not in prompts:
        prompts.append(routed)
    return prompts[: max(2, 1 + base.DEEP_RETRY_COUNT)]


def _hierarchical_deep_target(job_id: str, job_dir: Path, source_wav: Path, target: dict[str, Any], index: int) -> dict[str, Any]:
    routed_source, lane = _route_source(job_dir, source_wav, target)
    JOBS.update(job_id, currentTarget=target["id"], sourceLane=lane)
    JOBS.event(job_id, "routing-agent", f"{target['label']} routed through {lane}.", data={"target": target["id"], "sourceLane": lane})

    source_options: list[tuple[Path, str]] = [(routed_source, lane)]
    if routed_source != source_wav:
        source_options.append((source_wav, "Full Mix Fallback"))

    attempts: list[tuple[Path, dict[str, Any], str, str]] = []
    prompts = _prompt_candidates(target)
    for source_index, (source_path, source_lane) in enumerate(source_options):
        for prompt_index, prompt in enumerate(prompts, start=1):
            base._check_cancelled(job_id)
            attempt_number = len(attempts) + 1
            candidate_dir = job_dir / "candidates" / target["id"] / f"attempt-{attempt_number}"
            candidate_dir.mkdir(parents=True, exist_ok=True)
            candidate_source = candidate_dir / "source.wav"
            try:
                os.link(source_path, candidate_source)
            except OSError:
                shutil.copyfile(source_path, candidate_source)

            candidate_target = {**target, "prompt": prompt}
            meta = legacy._separate_sam_target(candidate_dir, candidate_source, candidate_target, index)
            candidate_path = candidate_dir / meta["file"]
            qa = base.technical_qa(candidate_path)
            attempts.append((candidate_path, qa, prompt, source_lane))
            JOBS.event(
                job_id,
                "deep-agent" if attempt_number == 1 else "recovery-agent",
                f"{target['label']} attempt {attempt_number} via {source_lane} scored {qa['score']}/100 technical QA.",
                data={"target": target["id"], "attempt": attempt_number, "sourceLane": source_lane, "technicalQa": qa},
            )
            if qa["score"] >= 88 and source_lane != "Full Mix Fallback":
                break
        if attempts and max(item[1]["score"] for item in attempts) >= 88:
            break
        if source_index == 0 and routed_source == source_wav:
            break

    if not attempts:
        raise RuntimeError(f"No deep-separation candidate was generated for {target['label']}.")

    chosen_path, qa, prompt, chosen_lane = max(attempts, key=lambda item: item[1]["score"])
    final_path = legacy._stem_path(job_dir, target["group"], index, target["label"])
    shutil.copyfile(chosen_path, final_path)
    meta = legacy._stem_meta(
        job_dir,
        final_path,
        name=target["id"],
        label=target["label"],
        group=target["group"],
        family=target["group"],
        engine=f"SAM-Audio {legacy.SAM_MODEL_NAME}",
        mixable=False,
        prompt=prompt,
    )
    meta["technicalQa"] = qa
    meta["attemptCount"] = len(attempts)
    meta["sourceLane"] = chosen_lane
    meta["agentDecision"] = {
        "selectionBasis": "best technical integrity across routed-parent and fallback candidates",
        "attempts": len(attempts),
        "sourceLane": chosen_lane,
        "hierarchicalRouting": HIERARCHICAL_ROUTING,
    }

    job = JOBS.load(job_id) or {}
    routing = list(job.get("routingSummary", []))
    routing.append({"target": target["id"], "sourceLane": chosen_lane, "attempts": len(attempts), "score": qa["score"]})
    JOBS.update(job_id, routingSummary=routing[-120:])
    return meta


base._deep_target = _hierarchical_deep_target


def _phase5_process(job_id: str) -> None:
    try:
        _original_process(job_id)
    finally:
        job = JOBS.load(job_id)
        if job:
            try:
                JOBS.update(job_id, currentTarget=None, sourceLane=None)
            except Exception:
                pass
            final_job = JOBS.load(job_id)
            if final_job:
                _schedule_cloud_sync(final_job, force=True)


base._process = _phase5_process


def _clean_generated(job_dir: Path) -> None:
    for name in ["stems", "candidates", "demucs_out"]:
        path = job_dir / name
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
    for name in ["manifest.json", "agent-report.json", "Agentic_Stem_Pack.zip"]:
        (job_dir / name).unlink(missing_ok=True)


@app.on_event("startup")
def phase5_startup() -> None:
    if not RESUME_ON_START:
        return
    for child in DATA_DIR.iterdir():
        if not child.is_dir():
            continue
        job = JOBS.load(child.name)
        if not job:
            continue
        restart_failure = job.get("status") == "failed" and job.get("error") == "Worker restarted before completion."
        resume_count = int(job.get("resumeCount", 0) or 0)
        if restart_failure and (child / "source.wav").is_file() and resume_count < MAX_RESTART_RESUMES:
            _clean_generated(child)
            JOBS.update(
                child.name,
                status="queued",
                stage="recovering",
                progress=2,
                error=None,
                completedAt=None,
                cancelRequested=False,
                resumeCount=resume_count + 1,
                currentTarget=None,
                sourceLane=None,
            )
            JOBS.event(child.name, "recovery-agent", f"Worker restart detected; automatically resuming attempt {resume_count + 1}.", 3, "recovering")
            base._executor.submit(base._process, child.name)


@app.on_event("shutdown")
def phase5_shutdown() -> None:
    _sync_executor.shutdown(wait=False, cancel_futures=True)


@app.get("/agent/system")
def phase5_system() -> dict[str, Any]:
    active = 0
    queued = 0
    for child in DATA_DIR.iterdir():
        if not child.is_dir():
            continue
        job = JOBS.load(child.name)
        if not job:
            continue
        if job.get("status") == "running":
            active += 1
        elif job.get("status") == "queued":
            queued += 1
    return {
        "status": "ok",
        "version": SYSTEM_VERSION,
        "system": "agentic-stem-system",
        "hierarchicalRouting": HIERARCHICAL_ROUTING,
        "routing": {group: {"coreFolder": route[0], "coreFile": route[1], "lane": route[2]} for group, route in ROUTING.items()},
        "restartRecovery": {"enabled": RESUME_ON_START, "maxResumes": MAX_RESTART_RESUMES},
        "cloudMirror": {"configured": _cloud_enabled(), "provider": "supabase" if _cloud_enabled() else None},
        "jobs": {"running": active, "queued": queued, "workers": base.JOB_WORKERS},
        "capabilities": [
            "core-6",
            "deep-60-plus",
            "hierarchical-parent-routing",
            "multi-prompt-recovery",
            "technical-qa",
            "restart-recovery",
            "cloud-job-mirroring",
            "signed-downloads",
            "refinement-jobs",
        ],
    }
