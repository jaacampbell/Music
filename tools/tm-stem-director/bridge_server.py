#!/usr/bin/env python3
"""Loopback-only TM Stem Director background job bridge (stdlib)."""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import json, os, subprocess, sys, threading, uuid

HOST = "127.0.0.1"
PORT = int(os.environ.get("TM_STEM_BRIDGE_PORT", "8766"))
ROOT = Path.home() / "Music" / "TM Music Studio" / "Stems"
JOBS = {}
LOCK = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return self.send_json(200, {"service": "tm-stem-bridge", "status": "ready"})
        if path.startswith("/jobs/"):
            job_id = path.removeprefix("/jobs/")
            with LOCK:
                job = JOBS.get(job_id)
                snapshot = dict(job) if job else None
            return self.send_json(200 if snapshot else 404, snapshot or {"error": "unknown job"})
        self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if urlparse(self.path).path != "/jobs":
            return self.send_json(404, {"error": "not found"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 2 or size > 8192:
                return self.send_json(413, {"error": "invalid request size"})
            body = json.loads(self.rfile.read(size))
            audio = Path(body["audio"]).expanduser().resolve(strict=True)
            if not audio.is_file() or audio.suffix.lower() not in {".wav", ".mp3", ".flac", ".aiff", ".aif", ".ogg", ".m4a"}:
                return self.send_json(400, {"error": "unsupported source file"})
            job_id = str(uuid.uuid4())
            with LOCK:
                JOBS[job_id] = {"id": job_id, "status": "queued", "source": str(audio)}
            threading.Thread(target=self.run_job, args=(job_id, audio), daemon=True).start()
            return self.send_json(202, {"id": job_id, "status": "queued"})
        except (KeyError, ValueError, OSError, TypeError, json.JSONDecodeError):
            self.send_json(400, {"error": "invalid source file or JSON"})

    @staticmethod
    def run_job(job_id, audio):
        with LOCK:
            JOBS[job_id]["status"] = "processing"
        worker = Path(__file__).with_name("separate_local.py")
        try:
            result = subprocess.run([sys.executable, str(worker), str(audio), "--output", str(ROOT)], capture_output=True, text=True, timeout=7200)
            with LOCK:
                JOBS[job_id]["status"] = "completed" if result.returncode == 0 else "failed"
                if result.returncode == 0:
                    JOBS[job_id]["output"] = str(ROOT / audio.stem)
                else:
                    JOBS[job_id]["error"] = (result.stderr or "separation failed")[-1200:]
        except (OSError, subprocess.TimeoutExpired) as exc:
            with LOCK:
                JOBS[job_id].update(status="failed", error=str(exc))

if __name__ == "__main__":
    print(f"TM Stem Director bridge listening on http://{HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
