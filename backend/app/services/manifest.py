"""Read and write project manifest.json files."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.project import ProjectManifest


def manifest_path(project_dir: Path) -> Path:
    return project_dir / "manifest.json"


def load_manifest(project_dir: Path) -> ProjectManifest:
    path = manifest_path(project_dir)
    if not path.exists():
        raise FileNotFoundError(f"manifest.json not found in {project_dir}")
    data = json.loads(path.read_text())
    return ProjectManifest(**data)


def save_manifest(project_dir: Path, manifest: ProjectManifest) -> None:
    manifest.updated_at = datetime.now(timezone.utc)
    path = manifest_path(project_dir)
    path.write_text(manifest.model_dump_json(indent=2))


def project_dir_from_id(projects_root: Path, project_id: str) -> Path:
    path = projects_root / project_id
    if not path.exists():
        raise FileNotFoundError(f"Project {project_id} not found")
    return path
