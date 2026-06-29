"""Job submission and polling endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path

from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.models.project import (
    ExportRequest,
    JobResponse,
    JobStatus,
    JobType,
    SeparationRequest,
)
from app.workers.celery_app import celery_app

router = APIRouter(prefix="/projects/{project_id}/jobs", tags=["jobs"])


def _project_dir(project_id: str) -> Path:
    return settings.projects_dir / project_id


def _require_project(project_id: str) -> Path:
    d = _project_dir(project_id)
    if not d.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return d


def _celery_to_job_response(
    task: AsyncResult,
    project_id: str,
    job_type: JobType,
) -> JobResponse:
    state = task.state
    meta = task.info or {}

    if state == "PENDING":
        status = JobStatus.queued
        progress = 0
        message = "Queued..."
    elif state == "PROGRESS":
        status = JobStatus.running
        progress = meta.get("progress", 0)
        message = meta.get("message", "Running...")
    elif state == "SUCCESS":
        status = JobStatus.completed
        progress = 100
        message = "Completed"
    elif state == "FAILURE":
        status = JobStatus.failed
        progress = 0
        message = str(meta) if meta else "Task failed"
    elif state == "STARTED":
        status = JobStatus.running
        progress = 5
        message = "Starting..."
    else:
        status = JobStatus.queued
        progress = 0
        message = state

    result = None
    if state == "SUCCESS" and isinstance(meta, dict):
        result = meta

    return JobResponse(
        job_id=task.id,
        project_id=project_id,
        type=job_type,
        status=status,
        progress_percent=progress,
        message=message,
        result=result,
        error=str(meta) if state == "FAILURE" else None,
    )


@router.post("/preprocess", response_model=JobResponse, status_code=202)
async def start_preprocess(project_id: str):
    """Decode audio, extract metadata, detect BPM and key."""
    _require_project(project_id)
    from app.workers.tasks import preprocess_audio
    task = preprocess_audio.delay(project_id)
    return JobResponse(
        job_id=task.id,
        project_id=project_id,
        type=JobType.preprocess,
        status=JobStatus.queued,
        message="Preprocessing queued",
    )


@router.post("/separate", response_model=JobResponse, status_code=202)
async def start_separation(project_id: str, body: SeparationRequest):
    """Start stem separation with the given model and mode."""
    _require_project(project_id)
    from app.workers.tasks import separate_stems
    task = separate_stems.delay(project_id, body.model, body.mode)
    return JobResponse(
        job_id=task.id,
        project_id=project_id,
        type=JobType.separate,
        status=JobStatus.queued,
        message=f"Separation queued ({body.model}, {body.mode})",
    )


@router.post("/export", response_model=JobResponse, status_code=202)
async def start_export(project_id: str, body: ExportRequest):
    """Create a DAW export package (wav_zip, reaper_rpp)."""
    _require_project(project_id)
    from app.workers.tasks import create_export
    task = create_export.delay(
        project_id,
        body.type,
        {
            "include_stems": body.include_stems,
            "include_midi": body.include_midi,
            "include_manifest": body.include_manifest,
            "include_readme": body.include_readme,
        },
    )
    return JobResponse(
        job_id=task.id,
        project_id=project_id,
        type=JobType.export,
        status=JobStatus.queued,
        message=f"Export queued ({body.type})",
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(project_id: str, job_id: str):
    """Poll job status."""
    _require_project(project_id)
    task = AsyncResult(job_id, app=celery_app)

    # Infer job type from task name if available
    task_name = getattr(task, "name", "") or ""
    type_map = {
        "preprocess": JobType.preprocess,
        "separate": JobType.separate,
        "export": JobType.export,
        "analyze": JobType.analyze,
        "transcribe": JobType.transcribe,
    }
    job_type = JobType.preprocess
    for key, val in type_map.items():
        if key in task_name:
            job_type = val
            break

    return _celery_to_job_response(task, project_id, job_type)
