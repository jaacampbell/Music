"""Tests for the export service."""

import json
import zipfile
from pathlib import Path
from datetime import datetime

import numpy as np
import pytest
import soundfile as sf

from app.models.project import (
    AnalysisResult,
    ExportRecord,
    ProjectManifest,
    SeparationInfo,
    SourceInfo,
    StemInfo,
)
from app.services.exporter import build_wav_zip, build_reaper_rpp


@pytest.fixture
def tmp_project(tmp_path: Path) -> tuple[Path, ProjectManifest]:
    """Create a fake project directory with WAV stems."""
    project_dir = tmp_path / "proj_test"
    stems_dir = project_dir / "stems"
    stems_dir.mkdir(parents=True)

    sr = 44100
    duration = 3.0
    samples = int(sr * duration)
    silence = np.zeros((samples, 2), dtype=np.float32)

    stem_names = ["vocals", "drums", "bass", "other"]
    stem_infos = []
    for name in stem_names:
        wav_path = stems_dir / f"{name}.wav"
        sf.write(str(wav_path), silence, sr, subtype="PCM_24")
        stem_infos.append(
            StemInfo(
                name=name,
                label=name.title(),
                file=f"stems/{name}.wav",
                sample_rate=sr,
                channels=2,
                bit_depth=24,
                duration_seconds=duration,
                start_time_seconds=0.0,
            )
        )

    manifest = ProjectManifest(
        project_id="proj_test",
        title="Test Song",
        source=SourceInfo(
            file="source/test.mp3",
            format="mp3",
            duration_seconds=duration,
            sample_rate=sr,
            channels=2,
        ),
        analysis=AnalysisResult(bpm=120.0, key="C major"),
        separation=SeparationInfo(model="htdemucs", mode="4stem"),
        stems=stem_infos,
    )
    return project_dir, manifest


def test_wav_zip_created(tmp_project):
    project_dir, manifest = tmp_project
    zip_path, record = build_wav_zip(project_dir, manifest)

    assert zip_path.exists()
    assert record.type == "wav_zip"
    assert record.size_bytes > 0


def test_wav_zip_contains_expected_files(tmp_project):
    project_dir, manifest = tmp_project
    zip_path, _ = build_wav_zip(project_dir, manifest, include_manifest=True, include_readme=True)

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()

    assert "vocals.wav" in names
    assert "drums.wav" in names
    assert "bass.wav" in names
    assert "other.wav" in names
    assert "manifest.json" in names
    assert "README_IMPORT.txt" in names


def test_wav_zip_manifest_valid(tmp_project):
    project_dir, manifest = tmp_project
    zip_path, _ = build_wav_zip(project_dir, manifest, include_manifest=True)

    with zipfile.ZipFile(zip_path) as zf:
        raw = zf.read("manifest.json")

    data = json.loads(raw)
    assert data["project_id"] == "proj_test"
    assert data["analysis"]["bpm"] == 120.0
    assert len(data["stems"]) == 4


def test_wav_zip_subset_stems(tmp_project):
    project_dir, manifest = tmp_project
    zip_path, _ = build_wav_zip(
        project_dir, manifest, include_stems=["vocals", "drums"]
    )
    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()

    assert "vocals.wav" in names
    assert "drums.wav" in names
    assert "bass.wav" not in names
    assert "other.wav" not in names


def test_reaper_rpp_created(tmp_project):
    project_dir, manifest = tmp_project
    rpp_path, record = build_reaper_rpp(project_dir, manifest)

    assert rpp_path.exists()
    assert rpp_path.suffix == ".rpp"
    assert record.type == "reaper_rpp"

    content = rpp_path.read_text()
    assert "REAPER_PROJECT" in content
    assert "TEMPO 120" in content
    assert "vocals" in content.lower()
    assert "drums" in content.lower()
