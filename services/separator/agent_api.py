from __future__ import annotations

import hashlib
import json
import os
import shutil
import threading
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from fastapi import File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import app as legacy
from agent_core import (
    ACTIVE_STATUSES, ALLOWED_EXTENSIONS, DATA_DIR, JOBS, MAX_UPLOAD_BYTES, TERMINAL_STATUSES,
    WORKER_AUTH_SECRET, audio_profile, cleanup_expired, download_allowed, download_token,
    now, owned_job, plan, require_job, technical_qa, worker_claims,
)

legacy.DATA_DIR = DATA_DIR
legacy.DATA_DIR.mkdir(parents=True, exist_ok=True)
app = legacy.app
MAX_DEEP_TARGETS = legacy.MAX_DEEP_TARGETS
JOB_WORKERS = max(1, int(os.environ.get("SEPARATOR_JOB_WORKERS", "1")))
DEEP_RETRY_COUNT = max(0, min(3, int(os.environ.get("STEM_AGENT_DEEP_RETRIES", "1"))))
CLEANUP_INTERVAL = max(60, int(os.environ.get("SEPARATOR_CLEANUP_INTERVAL_SECONDS", "600")))
_executor = ThreadPoolExecutor(max_workers=JOB_WORKERS, thread_name_prefix="stem-agent")
_shutdown = threading.Event()


class RefineRequest(BaseModel):
    instruction: str = Field(default="", max_length=2000)
    strategy: str = Field(default="auto", max_length=80)
    targets: list[str] = Field(default_factory=list, max_length=MAX_DEEP_TARGETS)


def _check_cancelled(job_id: str) -> None:
    job = JOBS.load(job_id)
    if job and job.get("cancelRequested"):
        JOBS.update(job_id, status="cancelled", stage="cancelled", completedAt=now())
        JOBS.event(job_id, "orchestrator", "Job cancelled by user.")
        raise InterruptedError("cancelled")


def _parse_targets(raw: str | None) -> list[str]:
    if not raw: return []
    try: values = json.loads(raw)
    except json.JSONDecodeError as exc: raise HTTPException(400, "targets must be a JSON array") from exc
    if not isinstance(values, list) or not all(isinstance(x, str) for x in values): raise HTTPException(400, "targets must be a JSON array")
    values = list(dict.fromkeys(values))
    unknown = [x for x in values if x not in legacy.TARGET_BY_ID]
    if unknown: raise HTTPException(400, f"Unknown targets: {', '.join(unknown[:8])}")
    return values[:MAX_DEEP_TARGETS]


def _attach_qa(stem: dict[str, Any], job_dir: Path) -> dict[str, Any]:
    path = job_dir / stem["file"]
    qa = technical_qa(path)
    return {**stem, "technicalQa": qa, "integratedDb": qa["metrics"]["rmsDb"]}


def _prompt_candidates(target: dict[str, Any]) -> list[str]:
    label = target["label"]
    return [
        target["prompt"],
        f"Isolate only {label}. Suppress accompaniment, bleed, ambience, and unrelated instruments.",
        f"Clean studio stem containing {label} with as little of every other source as possible.",
        f"Foreground {label}; remove competing music, percussion, vocals, effects, and room sound.",
    ][:1 + DEEP_RETRY_COUNT]


def _deep_target(job_id: str, job_dir: Path, source_wav: Path, target: dict[str, Any], index: int) -> dict[str, Any]:
    attempts: list[tuple[Path, dict[str, Any], str]] = []
    for attempt, prompt in enumerate(_prompt_candidates(target), start=1):
        _check_cancelled(job_id)
        candidate_dir = job_dir / "candidates" / target["id"] / f"attempt-{attempt}"
        candidate_dir.mkdir(parents=True, exist_ok=True)
        candidate_source = candidate_dir / "source.wav"
        try: os.link(source_wav, candidate_source)
        except OSError: shutil.copyfile(source_wav, candidate_source)
        candidate_target = {**target, "prompt": prompt}
        meta = legacy._separate_sam_target(candidate_dir, candidate_source, candidate_target, index)
        candidate_path = candidate_dir / meta["file"]
        qa = technical_qa(candidate_path)
        attempts.append((candidate_path, qa, prompt))
        JOBS.event(job_id, "deep-agent" if attempt == 1 else "recovery-agent",
                   f"{target['label']} attempt {attempt} scored {qa['score']}/100 technical QA.",
                   data={"target": target["id"], "attempt": attempt, "technicalQa": qa})
        if qa["score"] >= 75: break
    chosen_path, qa, prompt = max(attempts, key=lambda item: item[1]["score"])
    final_path = legacy._stem_path(job_dir, target["group"], index, target["label"])
    shutil.copyfile(chosen_path, final_path)
    meta = legacy._stem_meta(job_dir, final_path, name=target["id"], label=target["label"], group=target["group"],
                             family=target["group"], engine=f"SAM-Audio {legacy.SAM_MODEL_NAME}", mixable=False, prompt=prompt)
    meta["technicalQa"] = qa; meta["attemptCount"] = len(attempts)
    meta["agentDecision"] = {"selectionBasis": "best technical integrity among attempted prompts", "attempts": len(attempts)}
    return meta


def _signed_manifest(job_id: str, manifest: dict[str, Any]) -> dict[str, Any]:
    token = download_token(job_id)
    copy = json.loads(json.dumps(manifest))
    for stem in copy.get("stems", []):
        raw = stem["file"]
        stem["url"] = f"/agent/jobs/{job_id}/files/{raw}" + (f"?access={token}" if token else "")
    copy["zipUrl"] = f"/agent/jobs/{job_id}/stems.zip" + (f"?access={token}" if token else "")
    return copy


def _package(job_dir: Path) -> Path:
    path = job_dir / "Agentic_Stem_Pack.zip"
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for stem in sorted((job_dir / "stems").rglob("*.wav")): archive.write(stem, arcname=stem.relative_to(job_dir).as_posix())
        for name in ["manifest.json", "agent-report.json"]:
            extra = job_dir / name
            if extra.is_file(): archive.write(extra, arcname=name)
    return path


def _process(job_id: str) -> None:
    job = JOBS.load(job_id)
    if not job: return
    job_dir = DATA_DIR / job_id
    try:
        JOBS.update(job_id, status="running", stage="intake", progress=3, startedAt=now())
        JOBS.event(job_id, "intake-agent", "Source accepted; initializing production workspace.", 5, "intake")
        source_wav = job_dir / "source.wav"
        if not source_wav.is_file():
            JOBS.event(job_id, "intake-agent", "Decoding source to 44.1 kHz stereo WAV.", 8, "decode")
            legacy._decode_to_wav(job_dir / job["uploadFile"], source_wav)
        _check_cancelled(job_id)
        source = audio_profile(source_wav)
        JOBS.update(job_id, sourceProfile=source)
        JOBS.event(job_id, "analysis-agent", "Measured source technical profile.", 12, "source-analysis", source)
        strategy = plan(job["mode"], job["strategy"], job["instruction"], job["requestedTargets"], source, legacy.TARGETS, MAX_DEEP_TARGETS)
        JOBS.update(job_id, plan=strategy)
        JOBS.event(job_id, "strategy-agent", f"Plan ready: {len(strategy['targets'])} deep targets via {strategy['planner']}.", 18, "planning", strategy)
        _check_cancelled(job_id)
        JOBS.event(job_id, "core-agent", f"Running Core 6 with {legacy.CORE_MODEL}.", 24, "core-separation")
        core = legacy._separate_core(job_dir, source_wav)
        core["stems"] = [_attach_qa(stem, job_dir) for stem in core["stems"]]
        JOBS.event(job_id, "core-agent", "Core 6 and reconstruction check complete.", 58, "core-complete", core["alignment"])
        failed: list[dict[str, str]] = []; deep: list[dict[str, Any]] = []
        planned = strategy["targets"] if job["mode"] == "deep" else []
        if planned and not legacy._sam_package_available():
            failed = [{"id": target, "error": "SAM-Audio unavailable"} for target in planned]
            JOBS.event(job_id, "deep-agent", "Deep plan skipped because SAM-Audio is unavailable on this image.")
        else:
            for index, target_id in enumerate(planned, start=1):
                _check_cancelled(job_id)
                target = legacy.TARGET_BY_ID[target_id]
                if target_id in legacy.CORE_TARGET_ALIASES:
                    JOBS.event(job_id, "strategy-agent", f"{target['label']} already exists in Core 6; duplicate skipped.")
                    continue
                try: deep.append(_deep_target(job_id, job_dir, source_wav, target, index))
                except Exception as exc:
                    failed.append({"id": target_id, "error": str(exc)[-500:]})
                    JOBS.event(job_id, "recovery-agent", f"Deep target failed: {target['label']}.", data={"error": str(exc)[-500:]})
                JOBS.update(job_id, stage="deep-separation", progress=58 + round(27 * index / max(1, len(planned))))
        stems = core["stems"] + deep
        quality = {
            "stemCount": len(stems),
            "excellent": sum(1 for stem in stems if stem["technicalQa"]["score"] >= 90),
            "good": sum(1 for stem in stems if 75 <= stem["technicalQa"]["score"] < 90),
            "review": sum(1 for stem in stems if stem["technicalQa"]["score"] < 75),
            "failedTargets": len(failed),
        }
        JOBS.event(job_id, "qa-agent", "Technical QA complete across generated outputs.", 89, "quality-control", quality)
        warnings = [
            "AI-separated stems are estimates, not original studio multitracks.",
            "Technical QA scores file integrity and signal behavior; judge semantic isolation by ear.",
        ]
        report = {"jobId": job_id, "generatedAt": now(), "strategy": strategy, "sourceProfile": source,
                  "quality": quality, "failedTargets": failed, "warnings": warnings,
                  "agents": ["intake-agent","analysis-agent","strategy-agent","core-agent","deep-agent","recovery-agent","qa-agent","package-agent"]}
        manifest = {"jobId":job_id,"source":{"filename":job["sourceName"],"sha256":job.get("sourceSha256")},
                    "model":core["model"],"device":core.get("device"),"mode":job["mode"],"sampleRate":core["sampleRate"],
                    "channels":core["channels"],"durationSec":core["durationSec"],"stems":stems,"requestedTargets":job["requestedTargets"],
                    "plannedTargets":planned,"failedTargets":failed,"alignment":core["alignment"],"warnings":warnings,
                    "engines":{"core":f"Demucs {legacy.CORE_MODEL}","deep":f"SAM-Audio {legacy.SAM_MODEL_NAME}"},
                    "agentPlan":strategy,"qualitySummary":quality}
        (job_dir / "agent-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        (job_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        JOBS.event(job_id, "package-agent", "Building organized stem pack and decision report.", 96, "packaging")
        _package(job_dir)
        JOBS.update(job_id, status="completed", stage="completed", progress=100, completedAt=now(), qualitySummary=quality)
        JOBS.event(job_id, "orchestrator", "Agentic stem job completed.", 100, "completed")
    except InterruptedError: return
    except Exception as exc:
        JOBS.update(job_id, status="failed", stage="failed", error=str(exc)[-1600:], completedAt=now())
        JOBS.event(job_id, "orchestrator", "Job failed; inspect error details.", data={"error": str(exc)[-800:]})


def _cleanup_loop() -> None:
    while not _shutdown.wait(CLEANUP_INTERVAL): cleanup_expired()


@app.on_event("startup")
def agent_startup() -> None:
    for child in DATA_DIR.iterdir():
        job = JOBS.load(child.name) if child.is_dir() else None
        if job and job.get("status") in ACTIVE_STATUSES:
            JOBS.update(child.name, status="failed", stage="failed", error="Worker restarted before completion.", completedAt=now())
    threading.Thread(target=_cleanup_loop, daemon=True, name="stem-agent-cleanup").start()


@app.on_event("shutdown")
def agent_shutdown() -> None:
    _shutdown.set(); _executor.shutdown(wait=False, cancel_futures=True)


@app.get("/agent/health")
def agent_health() -> dict[str, Any]:
    return {"status":"ok","version":"3.0.0","system":"agentic-stem-system","coreModel":legacy.CORE_MODEL,
            "deepTargetCount":len(legacy.TARGETS),"queue":{"workers":JOB_WORKERS},"auth":{"required":bool(WORKER_AUTH_SECRET)},
            "samAudio":{"installed":legacy._sam_package_available(),"model":legacy.SAM_MODEL_NAME,"cudaAvailable":legacy._cuda_available(),
                        "hfTokenPresent":bool(os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN"))},
            "planner":{"openaiConfigured":bool(os.environ.get("OPENAI_API_KEY")),"model":os.environ.get("STEM_AGENT_MODEL","gpt-5-mini"),"enabled":os.environ.get("STEM_AGENT_USE_LLM","true").lower()=="true"}}


@app.get("/agent/ready")
def agent_ready() -> dict[str, Any]:
    return {"ready":shutil.which("ffmpeg") is not None,"demucs":True,"samAudio":legacy._sam_package_available(),"cuda":legacy._cuda_available()}


async def _save_upload(file: UploadFile, destination: Path) -> tuple[int, str]:
    total = 0; digest = hashlib.sha256()
    with destination.open("wb") as output:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk: break
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                destination.unlink(missing_ok=True); raise HTTPException(413, f"Upload exceeds {MAX_UPLOAD_BYTES // 1024 // 1024} MB.")
            digest.update(chunk); output.write(chunk)
    return total, digest.hexdigest()


@app.post("/agent/jobs", status_code=202)
async def create_agent_job(request: Request, file: UploadFile = File(...), mode: str = Form("deep"), targets: str | None = Form(None),
                           strategy: str = Form("auto"), instruction: str = Form(""), project_id: str | None = Form(None)) -> dict[str, Any]:
    claims = worker_claims(request)
    if mode not in {"core","deep"}: raise HTTPException(400, "mode must be core or deep")
    requested = _parse_targets(targets) if mode == "deep" else []
    suffix = Path(file.filename or "audio").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS: raise HTTPException(415, f"Unsupported audio extension: {suffix or 'unknown'}")
    job_id = uuid.uuid4().hex[:12]; job_dir = DATA_DIR / job_id; job_dir.mkdir(parents=True, exist_ok=True)
    upload_name = f"source-upload{suffix}"; size, digest = await _save_upload(file, job_dir / upload_name)
    state = JOBS.create(job_id, {"owner":claims.get("sub","unknown"),"projectId":project_id,"mode":mode,"strategy":strategy[:80],
                                      "instruction":instruction[:2000],"requestedTargets":requested,"sourceName":file.filename or "audio",
                                      "sourceSize":size,"sourceSha256":digest,"uploadFile":upload_name})
    _executor.submit(_process, job_id)
    return {"jobId":job_id,"status":state["status"],"stage":state["stage"],"progress":state["progress"],"pollUrl":f"/agent/jobs/{job_id}"}


@app.get("/agent/jobs/{job_id}")
def agent_job_status(request: Request, job_id: str) -> dict[str, Any]:
    job, _ = owned_job(request, job_id); return {k:v for k,v in job.items() if k != "uploadFile"}


@app.get("/agent/jobs/{job_id}/manifest")
def agent_manifest(request: Request, job_id: str) -> dict[str, Any]:
    job, _ = owned_job(request, job_id)
    if job.get("status") != "completed": raise HTTPException(409, f"Job is {job.get('status')}")
    path = DATA_DIR / job_id / "manifest.json"
    if not path.is_file(): raise HTTPException(404, "manifest not found")
    return _signed_manifest(job_id, json.loads(path.read_text(encoding="utf-8")))


@app.get("/agent/jobs/{job_id}/report")
def agent_report(request: Request, job_id: str) -> dict[str, Any]:
    owned_job(request, job_id); path = DATA_DIR / job_id / "agent-report.json"
    if not path.is_file(): return {"jobId":job_id,"status":require_job(job_id).get("status"),"events":require_job(job_id).get("events",[])}
    return json.loads(path.read_text(encoding="utf-8"))


@app.delete("/agent/jobs/{job_id}", status_code=202)
def cancel_agent_job(request: Request, job_id: str) -> dict[str, Any]:
    job, _ = owned_job(request, job_id)
    if job.get("status") in TERMINAL_STATUSES: return {"jobId":job_id,"status":job.get("status")}
    JOBS.update(job_id, cancelRequested=True, status="cancelling", stage="cancelling")
    JOBS.event(job_id, "orchestrator", "Cancellation requested; current model step will finish before stopping.")
    return {"jobId":job_id,"status":"cancelling"}


@app.post("/agent/jobs/{job_id}/refine", status_code=202)
def refine_agent_job(request: Request, job_id: str, body: RefineRequest) -> dict[str, Any]:
    parent, claims = owned_job(request, job_id); source = DATA_DIR / job_id / "source.wav"
    if not source.is_file(): raise HTTPException(409, "Parent source is not reusable")
    unknown = [x for x in body.targets if x not in legacy.TARGET_BY_ID]
    if unknown: raise HTTPException(400, f"Unknown targets: {', '.join(unknown[:8])}")
    child = uuid.uuid4().hex[:12]; child_dir = DATA_DIR / child; child_dir.mkdir(parents=True, exist_ok=True)
    try: os.link(source, child_dir / "source.wav")
    except OSError: shutil.copyfile(source, child_dir / "source.wav")
    JOBS.create(child, {"owner":claims.get("sub","unknown"),"projectId":parent.get("projectId"),"parentJobId":job_id,"mode":"deep",
                        "strategy":body.strategy,"instruction":body.instruction,"requestedTargets":list(dict.fromkeys(body.targets))[:MAX_DEEP_TARGETS],
                        "sourceName":parent.get("sourceName","source audio"),"sourceSize":parent.get("sourceSize"),"sourceSha256":parent.get("sourceSha256"),"uploadFile":""})
    JOBS.event(child, "strategy-agent", f"Refinement branched from {job_id} without re-uploading source audio.", 3, "queued")
    _executor.submit(_process, child); return {"jobId":child,"parentJobId":job_id,"status":"queued","stage":"queued","progress":3}


@app.get("/agent/jobs/{job_id}/stems.zip")
def agent_zip(request: Request, job_id: str, access: str | None = Query(default=None)) -> FileResponse:
    download_allowed(request, job_id, access); require_job(job_id); path = DATA_DIR / job_id / "Agentic_Stem_Pack.zip"
    if not path.is_file(): path = _package(DATA_DIR / job_id)
    return FileResponse(str(path), media_type="application/zip", filename="Agentic_Stem_Pack.zip")


@app.get("/agent/jobs/{job_id}/files/{file_path:path}")
def agent_file(request: Request, job_id: str, file_path: str, access: str | None = Query(default=None)) -> FileResponse:
    download_allowed(request, job_id, access)
    if ".." in file_path: raise HTTPException(404, "file not found")
    root = (DATA_DIR / job_id).resolve(); path = (root / file_path).resolve()
    if root not in path.parents or not path.is_file(): raise HTTPException(404, "file not found")
    media = "audio/wav" if path.suffix.lower() == ".wav" else "application/octet-stream"
    return FileResponse(str(path), media_type=media, filename=path.name)
