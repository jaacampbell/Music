"""Project CRUD endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.project import ProjectCreateResponse, ProjectManifest
from app.services.manifest import load_manifest, manifest_path, save_manifest
from app.services.audio_io import SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/projects", tags=["projects"])


def _project_dir(project_id: str) -> Path:
    return settings.projects_dir / project_id


@router.post("", response_model=ProjectCreateResponse, status_code=201)
async def create_project(file: UploadFile = File(...)):
    """Upload an audio file and create a new project."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{suffix}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}",
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_mb} MB.",
        )

    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    project_dir = _project_dir(project_id)
    source_dir = project_dir / "source"
    source_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or f"audio{suffix}").name
    dest = source_dir / safe_name
    dest.write_bytes(content)

    title = Path(safe_name).stem.replace("_", " ").replace("-", " ").title()
    manifest = ProjectManifest(project_id=project_id, title=title)
    save_manifest(project_dir, manifest)

    return ProjectCreateResponse(
        project_id=project_id,
        title=title,
        created_at=manifest.created_at,
    )


@router.get("", response_model=list[dict])
async def list_projects():
    """List all projects."""
    projects = []
    for path in sorted(settings.projects_dir.iterdir()):
        if path.is_dir():
            try:
                m = load_manifest(path)
                projects.append({
                    "project_id": m.project_id,
                    "title": m.title,
                    "created_at": m.created_at,
                    "bpm": m.analysis.bpm,
                    "key": m.analysis.key,
                    "stem_count": len(m.stems),
                    "has_exports": len(m.exports) > 0,
                })
            except Exception:
                pass
    return projects


@router.get("/{project_id}", response_model=ProjectManifest)
async def get_project(project_id: str):
    """Get full project manifest."""
    project_dir = _project_dir(project_id)
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    try:
        return load_manifest(project_dir)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project manifest not found")


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """Delete a project and all its files."""
    import shutil
    project_dir = _project_dir(project_id)
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    shutil.rmtree(project_dir)
