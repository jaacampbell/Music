"""Integration tests for the REST API."""

import io
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def wav_bytes() -> bytes:
    """Generate a small valid WAV file in memory."""
    sr = 44100
    samples = int(sr * 2)  # 2 seconds
    audio = np.zeros((samples, 2), dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    buf.seek(0)
    return buf.read()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_project(client, wav_bytes):
    r = client.post(
        "/api/v1/projects",
        files={"file": ("test_song.wav", wav_bytes, "audio/wav")},
    )
    assert r.status_code == 201
    data = r.json()
    assert "project_id" in data
    assert data["project_id"].startswith("proj_")
    assert "title" in data


def test_get_project(client, wav_bytes):
    # Create first
    r = client.post(
        "/api/v1/projects",
        files={"file": ("my_track.wav", wav_bytes, "audio/wav")},
    )
    assert r.status_code == 201
    project_id = r.json()["project_id"]

    # Get it
    r2 = client.get(f"/api/v1/projects/{project_id}")
    assert r2.status_code == 200
    manifest = r2.json()
    assert manifest["project_id"] == project_id


def test_list_projects(client, wav_bytes):
    # Create a project first so the list isn't empty
    client.post(
        "/api/v1/projects",
        files={"file": ("song.wav", wav_bytes, "audio/wav")},
    )
    r = client.get("/api/v1/projects")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_nonexistent_project(client):
    r = client.get("/api/v1/projects/proj_doesnotexist")
    assert r.status_code == 404


def test_unsupported_file_type(client):
    r = client.post(
        "/api/v1/projects",
        files={"file": ("track.txt", b"not audio", "text/plain")},
    )
    assert r.status_code == 422


def test_list_stems_empty(client, wav_bytes):
    r = client.post(
        "/api/v1/projects",
        files={"file": ("stem_test.wav", wav_bytes, "audio/wav")},
    )
    project_id = r.json()["project_id"]

    r2 = client.get(f"/api/v1/projects/{project_id}/stems")
    assert r2.status_code == 200
    assert r2.json() == []


def test_delete_project(client, wav_bytes):
    r = client.post(
        "/api/v1/projects",
        files={"file": ("delete_me.wav", wav_bytes, "audio/wav")},
    )
    project_id = r.json()["project_id"]

    r_del = client.delete(f"/api/v1/projects/{project_id}")
    assert r_del.status_code == 204

    r_get = client.get(f"/api/v1/projects/{project_id}")
    assert r_get.status_code == 404
