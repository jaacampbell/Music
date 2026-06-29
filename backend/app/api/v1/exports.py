"""Export creation and download endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.models.project import ExportRecord, ExportRequest, JobResponse, JobStatus, JobType
from app.services.manifest import load_manifest, save_manifest

router = APIRouter(prefix="/projects/{project_id}/exports", tags=["exports"])


def _project_dir(project_id: str) -> Path:
    d = settings.projects_dir / project_id
    if not d.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return d


@router.get("", response_model=list[ExportRecord])
async def list_exports(project_id: str):
    """List all exports for a project."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    return manifest.exports


@router.post("", response_model=JobResponse, status_code=202)
async def create_export(project_id: str, body: ExportRequest):
    """Queue an export job (wav_zip or reaper_rpp)."""
    _project_dir(project_id)
    from app.workers.tasks import create_export as task_export
    task = task_export.delay(
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


@router.get("/{export_id}", response_model=ExportRecord)
async def get_export(project_id: str, export_id: str):
    """Get export record by ID."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    for exp in manifest.exports:
        if exp.id == export_id:
            return exp
    raise HTTPException(status_code=404, detail=f"Export {export_id} not found")


@router.get("/{export_id}/download")
async def download_export(project_id: str, export_id: str):
    """Download the export file."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)

    export_rec = None
    for exp in manifest.exports:
        if exp.id == export_id:
            export_rec = exp
            break
    if not export_rec:
        raise HTTPException(status_code=404, detail=f"Export {export_id} not found")

    export_path = project_dir / export_rec.file
    if not export_path.exists():
        raise HTTPException(status_code=404, detail="Export file not found on disk")

    media_type_map = {
        ".zip": "application/zip",
        ".rpp": "application/octet-stream",
        ".json": "application/json",
    }
    media_type = media_type_map.get(export_path.suffix.lower(), "application/octet-stream")

    return FileResponse(
        path=str(export_path),
        media_type=media_type,
        filename=export_path.name,
    )
