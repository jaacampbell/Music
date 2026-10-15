"""Authenticated Cleanup endpoint contract smoke tests without Demucs/CUDA."""
from __future__ import annotations
import importlib.util
import sys
import types
from pathlib import Path
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

@pytest.fixture
def client(tmp_path, monkeypatch):
    # Isolate the route from the GPU worker while exercising real FastAPI
    # multipart validation, job ownership checks, and response signing.
    root = tmp_path / "jobs"
    root.mkdir()
    (root / "aabbccddeeff").mkdir()
    app = FastAPI()
    fake_api = types.ModuleType("agent_api")
    fake_api.app = app
    class Executor:
        def submit(self, *_args, **_kwargs):
            return None
    fake_api._executor = Executor()
    fake_core = types.ModuleType("agent_core")
    fake_core.DATA_DIR = root
    fake_core.now = lambda: "2026-10-14T20:00:00+00:00"
    fake_core.download_token = lambda job: f"signed-{job}"
    def owned_job(request, job_id):
        if request.headers.get("authorization") != "Bearer owner":
            raise HTTPException(401, "Not authenticated or wrong owner")
        if job_id != "aabbccddeeff":
            raise HTTPException(404, "Unknown job")
        return ({"status":"completed"}, {"sub":"owner"})
    fake_core.owned_job = owned_job
    monkeypatch.setitem(sys.modules, "agent_api", fake_api)
    monkeypatch.setitem(sys.modules, "agent_core", fake_core)
    module_path = Path(__file__).with_name("agent_cleanup.py")
    spec = importlib.util.spec_from_file_location("_test_agent_cleanup", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with TestClient(app) as c:
        yield c, module, root

def test_cleanup_requires_authenticated_owner(client):
    c, _, _ = client
    assert c.post("/agent/jobs/aabbccddeeff/cleanup").status_code == 401
    assert c.post("/agent/jobs/aabbccddeeff/cleanup",headers={"Authorization":"Bearer another"}).status_code == 401
    assert c.get("/agent/jobs/aabbccddeeff/cleanup/status").status_code == 401

def test_cleanup_requires_completed_job_and_valid_settings(client):
    c, _, _ = client
    h={"Authorization":"Bearer owner"}
    assert c.post("/agent/jobs/aabbccddeeff/cleanup",headers=h,data={"denoise":"1.5"}).status_code == 400
    assert c.post("/agent/jobs/aabbccddeeff/cleanup",headers=h,files={"reference":("bad.txt",b"nope","text/plain")}).status_code == 415
    assert c.post("/agent/jobs/aabbccddeeff/cleanup",headers=h,files={"midi":("bad.mid",b"oops","audio/midi")}).status_code == 400

def test_cleanup_queues_job_and_scopes_download_urls(client):
    c, module, root=client
    h={"Authorization":"Bearer owner"}
    res=c.post("/agent/jobs/aabbccddeeff/cleanup",headers=h)
    assert res.status_code == 202 and res.json()["status"]=="queued"
    assert c.get("/agent/jobs/aabbccddeeff/cleanup/status",headers=h).json()["status"]=="queued"
    # Completed result simulates the already-tested DSP pipeline finishing.
    module._write_status(root/"aabbccddeeff", {"status":"completed","runId":"0123456789ab","result":{"stems":["vocals.wav","drums.wav"]}})
    data=c.get("/agent/jobs/aabbccddeeff/cleanup/status",headers=h).json()
    assert "access=signed-aabbccddeeff" in data["zipUrl"]
    assert data["masterUrl"].startswith("/agent/jobs/aabbccddeeff/files/cleanup/0123456789ab/")
    assert set(data["stemUrls"])=={"vocals.wav","drums.wav"}
