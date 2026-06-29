"""Stem metadata and file download endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.models.project import StemInfo
from app.services.manifest import load_manifest, save_manifest

router = APIRouter(prefix="/projects/{project_id}/stems", tags=["stems"])


def _project_dir(project_id: str) -> Path:
    d = settings.projects_dir / project_id
    if not d.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return d


def _get_stem(manifest, stem_name: str) -> StemInfo:
    for s in manifest.stems:
        if s.name == stem_name:
            return s
    raise HTTPException(status_code=404, detail=f"Stem '{stem_name}' not found")


@router.get("", response_model=list[StemInfo])
async def list_stems(project_id: str):
    """List all stems for a project."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    return manifest.stems


@router.get("/{stem_name}", response_model=StemInfo)
async def get_stem(project_id: str, stem_name: str):
    """Get metadata for a single stem."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    return _get_stem(manifest, stem_name)


@router.get("/{stem_name}/file")
async def download_stem(project_id: str, stem_name: str):
    """Download stem WAV file."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    stem = _get_stem(manifest, stem_name)

    stem_path = project_dir / stem.file
    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem file not found on disk")

    return FileResponse(
        path=str(stem_path),
        media_type="audio/wav",
        filename=f"{stem_name}.wav",
    )


class StemPatchBody(dict):
    pass


from pydantic import BaseModel


class StemUpdate(BaseModel):
    is_muted: bool | None = None
    volume_db: float | None = None
    pan: float | None = None


@router.patch("/{stem_name}", response_model=StemInfo)
async def update_stem(project_id: str, stem_name: str, body: StemUpdate):
    """Update stem settings (mute, volume, pan)."""
    project_dir = _project_dir(project_id)
    manifest = load_manifest(project_dir)
    stem = _get_stem(manifest, stem_name)

    if body.is_muted is not None:
        stem.is_muted = body.is_muted
    if body.volume_db is not None:
        if not (-60 <= body.volume_db <= 12):
            raise HTTPException(status_code=422, detail="volume_db must be between -60 and 12")
        stem.volume_db = body.volume_db
    if body.pan is not None:
        if not (-1.0 <= body.pan <= 1.0):
            raise HTTPException(status_code=422, detail="pan must be between -1.0 and 1.0")
        stem.pan = body.pan

    save_manifest(project_dir, manifest)
    return stem
