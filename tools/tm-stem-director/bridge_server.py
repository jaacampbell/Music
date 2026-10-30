#!/usr/bin/env python3
"""Loopback-only TM Stem Director job bridge.

Jobs persist on disk, require a local bearer token, and run through a bounded
queue. Cancellation, progress, and six-stem alignment are part of the contract.
This process is the companion for Ableton; it is not the installed VST3.
"""
from __future__ import annotations

import hmac
import json
import os
import signal
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from catalog import catalog_payload, resolve_targets, sam_audio_installed
from separate_local import STEMS, alignment_report, wav_info

HOST = "127.0.0.1"
PORT = int(os.environ.get("TM_STEM_BRIDGE_PORT", "8766"))
TOKEN_PATH = Path.home() / ".local" / "share" / "tm-stem-director" / "bridge.token"
AUDIO_SUFFIXES = {".wav", ".mp3", ".flac", ".aiff", ".aif", ".ogg", ".m4a"}
TERMINAL = {"completed", "failed", "cancelled"}


@dataclass
class Config:
    host: str = HOST
    port: int = PORT
    root: Path = Path.home() / "Music" / "TM Music Studio" / "Stems"
    state_dir: Path = Path.home() / ".local" / "share" / "tm-stem-director"
    token: str = ""
    token_file: Path = TOKEN_PATH
    worker: Path = Path(__file__).with_name("separate_local.py")
    max_active: int = 1
    max_queued: int = 3
    device: str = "cpu"
    opener: list[str] | None = None


class JobLimit(Exception):
    pass


def deep_engine_ready() -> bool:
    return sam_audio_installed()


def path_inside(root: Path, candidate: Path) -> bool:
    try:
        candidate.resolve().relative_to(root.resolve())
    except (OSError, ValueError):
        return False
    return candidate.is_file()


def ensure_token(config: Config) -> str:
    if config.token:
        return config.token
    path = config.token_file
    path.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(path.parent, 0o700)
    if path.is_file():
        token = path.read_text(encoding="utf-8").strip()
        if token:
            return token
    token = uuid.uuid4().hex + uuid.uuid4().hex
    path.write_text(token + "\n", encoding="utf-8")
    os.chmod(path, 0o600)
    return token


class JobManager:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.lock = threading.Lock()
        self.jobs: dict[str, dict] = {}
        self.queue: list[str] = []
        self.procs: dict[str, subprocess.Popen[str]] = {}
        self.progress_paths: dict[str, Path] = {}
        self.output_logs: dict[str, list[str]] = {}
        self.drain_threads: dict[str, list[threading.Thread]] = {}
        self.cancel_flags: set[str] = set()
        self.wake = threading.Event()
        self.stop = threading.Event()
        self.config.state_dir.mkdir(parents=True, exist_ok=True)
        (self.config.state_dir / "jobs").mkdir(parents=True, exist_ok=True)
        self._load()
        self.thread = threading.Thread(target=self._loop, name="tm-stem-jobs", daemon=True)
        self.thread.start()

    def _job_path(self, job_id: str) -> Path:
        return self.config.state_dir / "jobs" / f"{job_id}.json"

    def _persist_locked(self, job: dict) -> None:
        path = self._job_path(job["id"])
        temporary = path.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(job, indent=2), encoding="utf-8")
        temporary.replace(path)

    def _load(self) -> None:
        folder = self.config.state_dir / "jobs"
        for path in sorted(folder.glob("*.json")):
            try:
                job = json.loads(path.read_text(encoding="utf-8"))
                job_id = str(job.get("id") or "")
                uuid.UUID(job_id)
            except (OSError, ValueError, json.JSONDecodeError):
                continue
            if job.get("status") in {"queued", "processing"}:
                job["status"] = "failed"
                job["stage"] = "interrupted"
                job["error"] = "Bridge restarted before this job finished."
                job["updated_at"] = time.time()
                self.jobs[job_id] = job
                self._persist_locked(job)
            else:
                self.jobs[job_id] = job

    def snapshot(self, job_id: str) -> dict | None:
        with self.lock:
            job = self.jobs.get(job_id)
            return dict(job) if job else None

    def submit(self, audio: Path, mode: str = "core", targets: list[str] | None = None) -> dict:
        with self.lock:
            active = sum(1 for job in self.jobs.values() if job["status"] == "processing")
            queued = sum(1 for job in self.jobs.values() if job["status"] == "queued")
            if active + queued >= self.config.max_active + self.config.max_queued:
                raise JobLimit()
            job_id = str(uuid.uuid4())
            now = time.time()
            job = {
                "id": job_id,
                "status": "queued",
                "source": str(audio),
                "output": str(self.config.root / audio.stem),
                "progress": 0,
                "stage": "queued",
                "error": None,
                "engine": "htdemucs_6s+sam-audio" if mode == "deep" else "htdemucs_6s",
                "mode": mode,
                "targets": list(targets or []),
                "aligned": None,
                "duration_seconds": None,
                "sample_rate": None,
                "stems": [],
                "deep_stems": [],
                "failed_targets": [],
                "created_at": now,
                "updated_at": now,
            }
            self.jobs[job_id] = job
            self.queue.append(job_id)
            self._persist_locked(job)
            snapshot = dict(job)
        self.wake.set()
        return snapshot

    def cancel(self, job_id: str) -> dict | None:
        process = None
        with self.lock:
            job = self.jobs.get(job_id)
            if job is None:
                return None
            if job["status"] in TERMINAL:
                return dict(job)
            self.cancel_flags.add(job_id)
            if job["status"] == "queued":
                self.queue = [item for item in self.queue if item != job_id]
                self._finish_locked(job, "cancelled", error="Cancelled before start.")
                return dict(job)
            process = self.procs.get(job_id)
        if process is not None:
            terminate_process(process)
        self.wake.set()
        return self.snapshot(job_id)

    def _finish_locked(self, job: dict, status: str, **extra: object) -> None:
        job["status"] = status
        job["stage"] = str(extra.pop("stage", status))
        job["progress"] = 100 if status in TERMINAL else job.get("progress", 0)
        job["updated_at"] = time.time()
        for key, value in extra.items():
            job[key] = value
        self._persist_locked(job)

    def _loop(self) -> None:
        while not self.stop.is_set():
            with self.lock:
                self._start_queued_locked()
                active = list(self.procs)
            for job_id in active:
                self._poll(job_id)
            self.wake.wait(0.25)
            self.wake.clear()

    def close(self) -> None:
        """Stop the queue and terminate worker processes. Safe to call twice."""
        if self.stop.is_set() and not self.thread.is_alive():
            return
        self.stop.set()
        self.wake.set()
        with self.lock:
            processes = list(self.procs.values())
        for process in processes:
            terminate_process(process)
        if self.thread.is_alive() and threading.current_thread() is not self.thread:
            self.thread.join(timeout=5)
        with self.lock:
            running = list(self.procs)
        for job_id in running:
            with self.lock:
                self._release_locked(job_id)

    def _start_queued_locked(self) -> None:
        if self.stop.is_set():
            return
        active = sum(1 for job in self.jobs.values() if job["status"] == "processing")
        while active < self.config.max_active and self.queue:
            job_id = self.queue.pop(0)
            job = self.jobs.get(job_id)
            if not job or job["status"] != "queued":
                continue
            if job_id in self.cancel_flags:
                self._finish_locked(job, "cancelled", error="Cancelled before start.")
                continue
            self._spawn_locked(job)
            active += 1

    def _spawn_locked(self, job: dict) -> None:
        progress = self.config.state_dir / "progress" / f"{job['id']}.json"
        progress.parent.mkdir(parents=True, exist_ok=True)
        command = [
            sys.executable,
            str(self.config.worker),
            job["source"],
            "--output",
            str(self.config.root),
            "--device",
            self.config.device,
            "--progress-file",
            str(progress),
            "--mode",
            str(job.get("mode") or "core"),
        ]
        targets = [str(item) for item in job.get("targets") or []]
        if targets:
            command.extend(["--targets", ",".join(targets)])
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            start_new_session=os.name != "nt",
        )
        bucket: list[str] = []
        drains = [
            threading.Thread(target=drain, args=(process.stdout, bucket), daemon=True),
            threading.Thread(target=drain, args=(process.stderr, bucket), daemon=True),
        ]
        for thread in drains:
            thread.start()
        job["status"] = "processing"
        job["stage"] = "starting"
        job["progress"] = 1
        job["updated_at"] = time.time()
        self.procs[job["id"]] = process
        self.progress_paths[job["id"]] = progress
        self.output_logs[job["id"]] = bucket
        self.drain_threads[job["id"]] = drains
        self._persist_locked(job)

    def _poll(self, job_id: str) -> None:
        with self.lock:
            process = self.procs.get(job_id)
            job = self.jobs.get(job_id)
            progress_path = self.progress_paths.get(job_id)
            cancelled = job_id in self.cancel_flags
        if process is None or job is None:
            return
        if cancelled and process.poll() is None:
            terminate_process(process)
        if progress_path and progress_path.is_file() and process.poll() is None:
            self._merge_progress(job_id, progress_path)
        if process.poll() is None:
            return
        for thread in self.drain_threads.get(job_id, []):
            thread.join(timeout=2)
        log = "".join(self.output_logs.get(job_id, []))[-1200:]
        final = read_json(progress_path) if progress_path else None
        with self.lock:
            current = self.jobs.get(job_id)
            if current is None or current["status"] in TERMINAL:
                self._release_locked(job_id)
                return
            if job_id in self.cancel_flags:
                self._finish_locked(current, "cancelled", error="Cancelled.")
            elif process.returncode == 0 and self._accept_result(current, final):
                assert final is not None
                self._finish_locked(
                    current,
                    "completed",
                    stage="completed",
                    error=None,
                    aligned=True,
                    duration_seconds=final.get("duration_seconds"),
                    sample_rate=final.get("sample_rate"),
                    stems=list(final.get("stems") or []),
                    deep_stems=list(final.get("deep_stems") or []),
                    failed_targets=list(final.get("failed_targets") or []),
                    output=str(self.config.root / Path(current["source"]).stem),
                )
            else:
                message = (final or {}).get("error") or log or "Separation failed."
                self._finish_locked(current, "failed", stage="failed", error=str(message)[-1200:], aligned=False)
            self._release_locked(job_id)

    def _release_locked(self, job_id: str) -> None:
        process = self.procs.pop(job_id, None)
        self.drain_threads.pop(job_id, None)
        self.progress_paths.pop(job_id, None)
        self.output_logs.pop(job_id, None)
        if process is None:
            return
        for stream in (process.stdout, process.stderr):
            if stream is not None:
                stream.close()

    def _aligned_result(self, final: dict | None) -> bool:
        if not final or final.get("status") != "completed":
            return False
        stems = [Path(item) for item in final.get("stems") or []]
        if len(stems) != len(STEMS) or not all(path.is_file() for path in stems):
            final["error"] = "Separation did not produce six stem WAV files."
            return False
        names = {path.stem.split("_", 1)[-1] for path in stems}
        if names != set(STEMS):
            final["error"] = "Stem names do not match the Core 6 set."
            return False
        try:
            report = alignment_report(stems)
        except (OSError, RuntimeError, wave_error()) as exc:
            final["error"] = f"Stem alignment check failed: {exc}"
            return False
        final["aligned"] = True
        final["duration_seconds"] = report["duration_seconds"]
        final["sample_rate"] = report["sample_rate"]
        return True

    def _accept_result(self, job: dict, final: dict | None) -> bool:
        if not self._aligned_result(final):
            return False
        if job.get("mode") != "deep":
            return True
        return self._deep_result(job, final or {})

    def _deep_result(self, job: dict, final: dict) -> bool:
        requested = [str(item) for item in job.get("targets") or []]
        if not requested:
            return False
        root = Path(str(job.get("output") or ""))
        seen: list[dict] = []
        used: set[str] = set()
        for item in final.get("deep_stems") or []:
            if not isinstance(item, dict):
                return False
            ident = str(item.get("id") or "")
            candidate = Path(str(item.get("path") or ""))
            if ident not in requested or ident in used or not path_inside(root, candidate):
                final["error"] = f"Deep target {ident or 'unknown'} is missing or outside the job folder."
                return False
            try:
                info = wav_info(candidate)
            except (OSError, RuntimeError):
                return False
            used.add(ident)
            seen.append({
                "id": ident,
                "path": str(candidate.resolve()),
                "label": str(item.get("label") or ident),
                "duration_seconds": info["duration_seconds"],
                "sample_rate": info["sample_rate"],
            })
        failed: list[dict] = []
        failed_ids: set[str] = set()
        for item in final.get("failed_targets") or []:
            if not isinstance(item, dict):
                return False
            ident = str(item.get("id") or "")
            if ident not in requested or ident in failed_ids or ident in used:
                return False
            failed_ids.add(ident)
            failed.append({"id": ident, "error": str(item.get("error") or "Deep target failed.")[:500]})
        if not seen or used | failed_ids != set(requested):
            final["error"] = "Deep 60+ did not produce a playable WAV for every requested target."
            return False
        final["deep_stems"] = seen
        final["failed_targets"] = failed
        return True

    def _merge_progress(self, job_id: str, path: Path) -> None:
        payload = read_json(path)
        if not payload:
            return
        with self.lock:
            job = self.jobs.get(job_id)
            if not job or job["status"] != "processing":
                return
            if "progress" in payload:
                try:
                    job["progress"] = max(1, min(99, int(payload["progress"])))
                except (TypeError, ValueError):
                    pass
            stage = payload.get("stage")
            if isinstance(stage, str) and stage:
                job["stage"] = stage[:80]
            job["updated_at"] = time.time()
            self._persist_locked(job)


def wave_error() -> type[Exception]:
    import wave

    return wave.Error


def read_json(path: Path | None) -> dict | None:
    if path is None or not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def drain(stream, bucket: list[str]) -> None:
    if stream is None:
        return
    for line in stream:
        bucket.append(line)
        if len(bucket) > 400:
            del bucket[:-200]


def terminate_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    try:
        if os.name == "nt":
            process.terminate()
        else:
            os.killpg(process.pid, signal.SIGTERM)
    except OSError:
        process.terminate()
    try:
        process.wait(timeout=2)
    except subprocess.TimeoutExpired:
        try:
            if os.name == "nt":
                process.kill()
            else:
                os.killpg(process.pid, signal.SIGKILL)
        except OSError:
            process.kill()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            return


def platform_opener() -> list[str]:
    if sys.platform == "darwin":
        return ["open"]
    if os.name == "nt":
        return ["explorer"]
    return ["xdg-open"]


class BridgeServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, config: Config) -> None:
        if config.host != HOST:
            raise RuntimeError("Refusing to bind TM Stem Director outside 127.0.0.1")
        if config.device not in {"cpu", "cuda", "mps"}:
            raise RuntimeError("Unsupported separation device.")
        config.token = ensure_token(config)
        config.root.mkdir(parents=True, exist_ok=True)
        self.config = config
        super().__init__((config.host, config.port), Handler)
        self.manager = JobManager(config)

    def server_close(self) -> None:
        manager = getattr(self, "manager", None)
        if manager is not None:
            manager.close()
        super().server_close()


class Handler(BaseHTTPRequestHandler):
    server: BridgeServer
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args: object) -> None:
        message = fmt % args
        token = self.server.config.token
        if token:
            message = message.replace(token, "[redacted]")
        sys.stderr.write("%s - %s\n" % (self.address_string(), message))

    def send_json(self, status: int, payload: dict) -> None:
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_bytes(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self) -> bool:
        expected = self.server.config.token
        supplied = ""
        header = self.headers.get("Authorization", "")
        if header.lower().startswith("bearer "):
            supplied = header[7:].strip()
        if not supplied:
            supplied = (parse_qs(urlparse(self.path).query).get("access_token") or [""])[0]
        if not expected or not supplied:
            return False
        return hmac.compare_digest(supplied, expected)

    def discard_body(self) -> None:
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.close_connection = True
            return
        if size <= 0:
            return
        if size > 65536:
            self.close_connection = True
            return
        remaining = size
        while remaining:
            chunk = self.rfile.read(min(remaining, 8192))
            if not chunk:
                break
            remaining -= len(chunk)

    def require_auth(self) -> bool:
        if self.authorized():
            return True
        if self.command == "POST":
            self.discard_body()
        self.send_json(401, {"error": "unauthorized"})
        return False

    def route(self) -> str:
        return urlparse(self.path).path.rstrip("/") or "/"

    def job_id_from(self, prefix: str) -> str | None:
        rest = self.route().removeprefix(prefix).strip("/")
        job_id = rest.split("/", 1)[0]
        try:
            return str(uuid.UUID(job_id))
        except ValueError:
            return None

    def do_GET(self) -> None:
        path = self.route()
        if path in {"/", "/console"}:
            page_path = Path(__file__).with_name("console.html")
            try:
                page = page_path.read_bytes()
            except OSError:
                return self.send_json(500, {"error": "console is not installed"})
            return self.send_bytes(200, page, "text/html; charset=utf-8")
        if path == "/health":
            catalog = catalog_payload()
            return self.send_json(200, {
                "service": "tm-stem-bridge",
                "status": "ready",
                "engine": "htdemucs_6s",
                "deepTargetCount": catalog["count"],
                "samAudioInstalled": deep_engine_ready(),
            })
        if path == "/catalog":
            payload = catalog_payload()
            payload["samAudioInstalled"] = deep_engine_ready()
            return self.send_json(200, payload)
        if not path.startswith("/jobs"):
            return self.send_json(404, {"error": "not found"})
        if not self.require_auth():
            return
        if path.startswith("/jobs/") and "/stems/" in path:
            return self.serve_stem()
        if path.startswith("/jobs/") and "/deep/" in path:
            return self.serve_deep()
        if path.startswith("/jobs/"):
            job_id = self.job_id_from("/jobs/")
            job = self.server.manager.snapshot(job_id) if job_id else None
            return self.send_json(200 if job else 404, job or {"error": "unknown job"})
        self.send_json(404, {"error": "not found"})

    def serve_stem(self) -> None:
        path = self.route()
        try:
            _, job_id, _, name = path.strip("/").split("/")
            job_id = str(uuid.UUID(job_id))
        except ValueError:
            return self.send_json(404, {"error": "unknown stem"})
        if name not in STEMS:
            return self.send_json(404, {"error": "unknown stem"})
        job = self.server.manager.snapshot(job_id)
        if not job or job.get("status") != "completed" or job.get("aligned") is not True:
            return self.send_json(409, {"error": "stem is not ready"})
        match = next((Path(item) for item in job.get("stems") or [] if Path(item).name.endswith(f"_{name}.wav")), None)
        root = Path(str(job.get("output") or "")).resolve()
        if match is None:
            return self.send_json(404, {"error": "missing stem"})
        audio = match.resolve()
        if root != audio.parent or not audio.is_file():
            return self.send_json(404, {"error": "missing stem"})
        data = audio.read_bytes()
        self.send_bytes(200, data, "audio/wav")

    def serve_deep(self) -> None:
        path = self.route()
        try:
            _, job_id, _, name = path.strip("/").split("/")
            job_id = str(uuid.UUID(job_id))
        except ValueError:
            return self.send_json(404, {"error": "unknown stem"})
        if not name or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789_" for character in name):
            return self.send_json(404, {"error": "unknown stem"})
        job = self.server.manager.snapshot(job_id)
        if not job or job.get("status") != "completed":
            return self.send_json(409, {"error": "stem is not ready"})
        match = next((item for item in job.get("deep_stems") or [] if item.get("id") == name), None)
        root = Path(str(job.get("output") or ""))
        if not isinstance(match, dict):
            return self.send_json(404, {"error": "missing stem"})
        audio = Path(str(match.get("path") or ""))
        if not path_inside(root, audio):
            return self.send_json(404, {"error": "missing stem"})
        self.send_bytes(200, audio.resolve().read_bytes(), "audio/wav")

    def do_POST(self) -> None:
        if not self.require_auth():
            return
        path = self.route()
        if path == "/jobs":
            return self.create_job()
        if path.startswith("/jobs/") and path.endswith("/cancel"):
            return self.cancel_job()
        if path.startswith("/jobs/") and path.endswith("/reveal"):
            return self.reveal_job()
        self.send_json(404, {"error": "not found"})

    def create_job(self) -> None:
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 2 or size > 8192:
                self.discard_body()
                return self.send_json(413, {"error": "invalid request size"})
            body = json.loads(self.rfile.read(size))
            audio = Path(body["audio"]).expanduser().resolve(strict=True)
            if not audio.is_file() or audio.suffix.lower() not in AUDIO_SUFFIXES:
                return self.send_json(400, {"error": "unsupported source file"})
            mode = body.get("mode") or "core"
            if mode not in {"core", "deep"}:
                return self.send_json(400, {"error": "mode must be core or deep"})
            raw_targets = body.get("targets") or []
            targets: list[str] = []
            if mode == "deep":
                try:
                    targets = [str(item["id"]) for item in resolve_targets(list(raw_targets))]
                except ValueError as exc:
                    return self.send_json(400, {"error": str(exc)})
                if not deep_engine_ready():
                    return self.send_json(409, {"error": "Deep 60+ needs SAM-Audio on this computer. Core 6 is available locally. Stem Studio and Stem Director run Deep 60+ on a CUDA worker when this machine does not have the model."})
            elif raw_targets:
                return self.send_json(400, {"error": "Core 6 does not take Deep 60+ targets."})
            job = self.server.manager.submit(audio, mode, targets)
            return self.send_json(202, {"id": job["id"], "status": job["status"], "mode": mode})
        except JobLimit:
            self.send_json(429, {"error": "too many jobs", "max_active": self.server.config.max_active, "max_queued": self.server.config.max_queued})
        except (KeyError, ValueError, OSError, TypeError, json.JSONDecodeError):
            self.send_json(400, {"error": "invalid source file or JSON"})

    def cancel_job(self) -> None:
        job_id = self.job_id_from("/jobs/")
        job = self.server.manager.snapshot(job_id) if job_id else None
        if job is None:
            return self.send_json(404, {"error": "unknown job"})
        if job["status"] in TERMINAL:
            return self.send_json(409, {"error": "job already finished", "status": job["status"]})
        updated = self.server.manager.cancel(job_id or "")
        self.send_json(202, updated or {"error": "unknown job"})

    def reveal_job(self) -> None:
        job_id = self.job_id_from("/jobs/")
        job = self.server.manager.snapshot(job_id) if job_id else None
        if job is None:
            return self.send_json(404, {"error": "unknown job"})
        if job["status"] != "completed":
            return self.send_json(409, {"error": "stems are not ready", "status": job["status"]})
        output = Path(str(job["output"]))
        opened = False
        opener = self.server.config.opener if self.server.config.opener is not None else platform_opener()
        if opener:
            try:
                subprocess.run([*opener, str(output)], check=False, timeout=10)
                opened = True
            except (OSError, subprocess.TimeoutExpired):
                opened = False
        self.send_json(200, {"id": job["id"], "output": str(output), "opened": opened})


def config_from_env() -> Config:
    device = os.environ.get("TM_STEM_DEVICE", "cpu")
    worker = Path(os.environ.get("TM_STEM_WORKER", Path(__file__).with_name("separate_local.py")))
    return Config(
        port=PORT,
        root=Path(os.environ.get("TM_STEM_BRIDGE_ROOT", Path.home() / "Music" / "TM Music Studio" / "Stems")).expanduser(),
        state_dir=Path(os.environ.get("TM_STEM_BRIDGE_STATE", Path.home() / ".local" / "share" / "tm-stem-director")).expanduser(),
        token=os.environ.get("TM_STEM_BRIDGE_TOKEN", ""),
        worker=worker,
        max_active=max(1, int(os.environ.get("TM_STEM_BRIDGE_MAX_ACTIVE", "1"))),
        max_queued=max(0, int(os.environ.get("TM_STEM_BRIDGE_MAX_QUEUED", "3"))),
        device=device,
    )


def main() -> None:
    config = config_from_env()
    server = BridgeServer(config)

    def stop(_signum: int, _frame: object) -> None:
        threading.Thread(target=server.shutdown, name="tm-stem-shutdown", daemon=True).start()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    port = server.server_address[1]
    print(f"TM Stem Director bridge listening on http://{HOST}:{port}", flush=True)
    print(f"Local console: http://{HOST}:{port}/?access_token={config.token}", flush=True)
    print(f"Token file: {config.token_file}", flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
