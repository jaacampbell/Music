"""Local bridge contract tests. The worker here is fake and does not run Demucs."""
from __future__ import annotations

import http.client
import io
import json
import os
import signal
import subprocess
import sys
import threading
import time
import uuid
import wave
from contextlib import redirect_stderr
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.parse import quote

import unittest

from bridge_server import HOST, BridgeServer, Config
from catalog import load_targets, resolve_targets, sam_audio_installed
from separate_local import STEMS, alignment_report

REPO = Path(__file__).resolve().parents[2]
BRIDGE = Path(__file__).with_name("bridge_server.py")
SUBMIT = Path(__file__).with_name("submit_job.py")
TERMINAL = {"completed", "failed", "cancelled"}
WORKER = r"""
import argparse, json, struct, time, wave
from pathlib import Path
STEMS = ("vocals", "drums", "bass", "guitar", "piano", "other")

def publish(path, **payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload), encoding="utf-8")
    temporary.replace(path)

def write_wav(path, rate, frames, marker):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(struct.pack("<h", marker) * frames)

def write_set(directory, rate, frames_for):
    files = []
    for index, name in enumerate(STEMS, 1):
        destination = directory / f"{index:02d}_{name}.wav"
        write_wav(destination, rate, frames_for(index), index)
        files.append(str(destination))
    return files

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", required=True)
    parser.add_argument("--progress-file", type=Path, required=True)
    parser.add_argument("--mode", default="core")
    parser.add_argument("--targets", default="")
    args = parser.parse_args()
    mode_path = args.audio.with_suffix(".mode")
    mode = mode_path.read_text(encoding="utf-8").strip() if mode_path.is_file() else "ok"
    folder = args.output / args.audio.stem
    folder.mkdir(parents=True, exist_ok=True)
    if mode == "block":
        publish(args.progress_file, status="processing", progress=12, stage="separating")
        time.sleep(30)
        return 0
    if mode == "tick":
        publish(args.progress_file, status="processing", progress=37, stage="separating", duration_seconds=999, sample_rate=1)
        time.sleep(2)
        files = write_set(folder, 22050, lambda _index: 2000)
        publish(args.progress_file, status="completed", progress=100, stage="completed", aligned=True, duration_seconds=999, sample_rate=1, stems=files)
        return 0
    if mode == "lie-duration":
        files = write_set(folder, 44100, lambda index: 1000 + index * 100)
        publish(args.progress_file, status="completed", progress=100, stage="completed", aligned=True, duration_seconds=99, sample_rate=44100, stems=files)
        return 0
    if mode == "lie-rate":
        files = []
        for index, name in enumerate(STEMS, 1):
            destination = folder / f"{index:02d}_{name}.wav"
            write_wav(destination, 44100 if index == 1 else 48000, 1000, index)
            files.append(str(destination))
        publish(args.progress_file, status="completed", progress=100, stage="completed", aligned=True, duration_seconds=1, sample_rate=44100, stems=files)
        return 0
    if mode == "lie-deep":
        files = write_set(folder, 22050, lambda _index: 2000)
        publish(args.progress_file, status="completed", progress=100, stage="completed", aligned=True, duration_seconds=1, sample_rate=22050, stems=files, mode="deep", targets=["kick"], deep_stems=[], failed_targets=[])
        return 0
    if mode == "ok":
        files = write_set(folder, 22050, lambda _index: 2000)
        deep_stems = []
        target_ids = [item for item in args.targets.split(",") if item] if args.mode == "deep" else []
        for ident in target_ids:
            destination = folder / "deep" / f"{ident}.wav"
            write_wav(destination, 16000, 480, 3)
            deep_stems.append({"id": ident, "path": str(destination), "label": ident})
        publish(args.progress_file, status="completed", progress=100, stage="completed", aligned=True, duration_seconds=999, sample_rate=1, stems=files, mode=args.mode, targets=target_ids, deep_stems=deep_stems, failed_targets=[])
        return 0
    publish(args.progress_file, status="failed", progress=100, stage="failed", error="unknown fake mode")
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
"""
OPENER = """
import sys
from pathlib import Path
Path(sys.argv[1]).write_text(sys.argv[2], encoding="utf-8")
"""


def write_wav(path: Path, rate: int, frames: int, marker: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    import struct
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(struct.pack("<h", marker) * frames)


def client_binary() -> Path | None:
    root = REPO / "native" / "tm-stem-director" / "build"
    if not root.is_dir():
        return None
    for path in root.rglob("tm_stem_client"):
        if path.is_file() and os.access(path, os.X_OK) and path.name == "tm_stem_client":
            return path
    for path in root.rglob("tm_stem_client.exe"):
        if path.is_file():
            return path
    return None


class AlignmentTests(unittest.TestCase):
    def test_matching_headers(self) -> None:
        with TemporaryDirectory() as temporary:
            folder = Path(temporary)
            files = []
            for name in STEMS:
                path = folder / f"01_{name}.wav"
                write_wav(path, 16000, 800, 4)
                files.append(path)
            report = alignment_report(files)
            self.assertEqual(report["sample_rate"], 16000)
            self.assertAlmostEqual(float(report["duration_seconds"]), 800 / 16000)

    def test_duration_and_rate_mismatch(self) -> None:
        with TemporaryDirectory() as temporary:
            folder = Path(temporary)
            durations = []
            for index, name in enumerate(STEMS, 1):
                path = folder / f"{index:02d}_{name}.wav"
                write_wav(path, 44100, 100 if index == 1 else 140, 1)
                durations.append(path)
            with self.assertRaises(RuntimeError) as caught:
                alignment_report(durations)
            self.assertIn("do not match", str(caught.exception))
            rates = []
            for index, name in enumerate(STEMS, 1):
                path = folder / f"rate_{index:02d}_{name}.wav"
                write_wav(path, 44100 if index == 1 else 48000, 100, 1)
                rates.append(path)
            with self.assertRaises(RuntimeError) as caught:
                alignment_report(rates)
            self.assertIn("do not match", str(caught.exception))


class BridgeContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.state = self.root / "state"
        self.out = self.root / "stems"
        self.audio_dir = self.root / "audio"
        self.audio_dir.mkdir()
        self.token = "tm-secret-token-value"
        self.worker = self.root / "fake_worker.py"
        self.worker.write_text(WORKER, encoding="utf-8")
        self.opener_script = self.root / "opener.py"
        self.opener_script.write_text(OPENER, encoding="utf-8")
        self.marker = self.root / "opened.txt"
        self.server = None
        self.thread = None
        self.port = 0
        self.processes: list[subprocess.Popen[str]] = []

    def tearDown(self) -> None:
        if self.server is not None and self.thread is not None and self.thread.is_alive():
            self.server.shutdown()
            self.server.server_close()
            self.thread.join(timeout=5)
        elif self.server is not None:
            self.server.server_close()
        for process in self.processes:
            self.stop_process(process)
        self.kill_our_workers()
        self.tmp.cleanup()

    def start(self, max_active: int = 1, max_queued: int = 3) -> None:
        config = Config(
            host=HOST,
            port=0,
            root=self.out,
            state_dir=self.state,
            token=self.token,
            token_file=self.state / "bridge.token",
            worker=self.worker,
            max_active=max_active,
            max_queued=max_queued,
            device="cpu",
            opener=[sys.executable, str(self.opener_script), str(self.marker)],
        )
        self.server = BridgeServer(config)
        self.port = int(self.server.server_address[1])
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def request(self, method: str, path: str, payload: dict | None = None, token: str | None = "__default__", raw: bytes | None = None) -> tuple[int, bytes]:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        headers = {}
        body = raw
        if payload is not None:
            body = json.dumps(payload).encode()
            headers["Content-Type"] = "application/json"
        if token == "__default__":
            headers["Authorization"] = f"Bearer {self.token}"
        elif token:
            headers["Authorization"] = f"Bearer {token}"
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read()
        status = response.status
        connection.close()
        return status, data

    def body(self, status: int, payload: bytes) -> dict:
        self.assertGreaterEqual(status, 200)
        return json.loads(payload)

    def make_source(self, name: str, mode: str) -> Path:
        path = self.audio_dir / name
        path.write_bytes(b"not-a-real-song")
        path.with_suffix(".mode").write_text(mode, encoding="utf-8")
        return path

    def submit(self, name: str, mode: str) -> str:
        status, payload = self.request("POST", "/jobs", {"audio": str(self.make_source(name, mode))})
        self.assertEqual(status, 202, payload)
        return json.loads(payload)["id"]

    def get_json(self, job_id: str) -> dict:
        status, payload = self.request("GET", f"/jobs/{job_id}")
        self.assertEqual(status, 200, payload)
        return json.loads(payload)

    def wait_job(self, job_id: str, timeout: float = 6) -> dict:
        deadline = time.time() + timeout
        last = None
        while time.time() < deadline:
            last = self.get_json(job_id)
            if last["status"] in TERMINAL:
                return last
            time.sleep(0.05)
        self.fail(f"timed out at {last}")

    def test_health_console_and_auth(self) -> None:
        self.assertEqual(HOST, "127.0.0.1")
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaises(RuntimeError):
                BridgeServer(Config(host="0.0.0.0", port=0, root=root / "out", state_dir=root / "state", token="t"))
            with self.assertRaises(RuntimeError):
                BridgeServer(Config(device="tpu", port=0, root=root / "out", state_dir=root / "state", token="t"))
        self.start()
        status, payload = self.request("GET", "/health", token=None)
        self.assertEqual(status, 200)
        health = json.loads(payload)
        self.assertEqual(health["service"], "tm-stem-bridge")
        self.assertEqual(health["engine"], "htdemucs_6s")
        self.assertNotIn(self.token, payload.decode())
        for path in ("/", "/console"):
            status, page = self.request("GET", path, token=None)
            self.assertEqual(status, 200)
            text = page.decode()
            self.assertIn("<!DOCTYPE html>", text)
            self.assertIn("decodeAudioData", text)
            self.assertIn("htdemucs_6s", text)
            self.assertIn("not the Ableton Live VST3", text)
            self.assertNotIn("Math.sin", text)
            for name in STEMS:
                self.assertIn(f'data-stem="{name}"', text)
            start = text.index("/* decode-failure-start */")
            end = text.index("/* decode-failure-end */")
            failure = text[start:end]
            self.assertIn("clearWaveform", failure)
            self.assertIn("Could not decode this stem. No waveform is shown.", failure)
            self.assertNotIn("drawWaveform", failure)
        status, payload = self.request("GET", "/favicon.ico", token=None)
        self.assertEqual(status, 404, payload)
        status, payload = self.request("GET", "/jobs", token=None)
        self.assertEqual(status, 401)
        status, payload = self.request("GET", "/jobs", token="wrong-token")
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(payload)["error"], "unauthorized")
        missing = self.root / "missing.wav"
        status, payload = self.request("POST", "/jobs", {"audio": str(missing)})
        self.assertEqual(status, 400)
        text_file = self.make_source("notes.txt", "ok")
        status, payload = self.request("POST", "/jobs", {"audio": str(text_file)})
        self.assertEqual(status, 400)
        status, payload = self.request("POST", "/jobs", raw=b"{" * 9000)
        self.assertEqual(status, 413)

    def test_log_redacts_token(self) -> None:
        self.start()
        captured = io.StringIO()
        with redirect_stderr(captured):
            status, _payload = self.request("GET", f"/health?access_token={quote(self.token)}", token=None)
            deadline = time.time() + 1
            while "[redacted]" not in captured.getvalue() and time.time() < deadline:
                time.sleep(0.01)
        self.assertEqual(status, 200)
        text = captured.getvalue()
        self.assertIn("[redacted]", text)
        self.assertNotIn(self.token, text)

    def test_progress_completion_stem_bytes_and_reveal(self) -> None:
        self.start()
        job_id = self.submit("song.wav", "tick")
        seen = False
        deadline = time.time() + 4
        while time.time() < deadline:
            job = self.get_json(job_id)
            if job["status"] == "processing" and job["progress"] >= 37 and job["stage"] == "separating":
                seen = True
                break
            if job["status"] in TERMINAL:
                self.fail(f"finished before progress was visible: {job}")
            time.sleep(0.05)
        self.assertTrue(seen)
        status, payload = self.request("GET", f"/jobs/{job_id}/stems/vocals")
        self.assertEqual(status, 409, payload)
        job = self.wait_job(job_id, timeout=6)
        self.assertEqual(job["status"], "completed")
        self.assertTrue(job["aligned"])
        self.assertEqual(job["sample_rate"], 22050)
        self.assertAlmostEqual(job["duration_seconds"], 2000 / 22050)
        self.assertNotEqual(job["duration_seconds"], 999)
        vocal = next(Path(item) for item in job["stems"] if item.endswith("_vocals.wav"))
        drums = next(Path(item) for item in job["stems"] if item.endswith("_drums.wav"))
        status, payload = self.request("GET", f"/jobs/{job_id}/stems/vocals")
        self.assertEqual(status, 200)
        self.assertEqual(payload, vocal.read_bytes())
        self.assertTrue(payload.startswith(b"RIFF"))
        self.assertNotEqual(payload, drums.read_bytes())
        status, payload = self.request("GET", f"/jobs/{job_id}/stems/vocals", token=None)
        self.assertEqual(status, 401)
        status, payload = self.request("GET", f"/jobs/{job_id}?access_token={quote(self.token)}", token=None)
        self.assertEqual(status, 200)
        status, payload = self.request("GET", f"/jobs/{job_id}/stems/nope")
        self.assertEqual(status, 404)
        status, payload = self.request("POST", f"/jobs/{job_id}/reveal")
        self.assertEqual(status, 200, payload)
        revealed = json.loads(payload)
        self.assertEqual(revealed["output"], self.marker.read_text(encoding="utf-8"))
        self.assertTrue(revealed["opened"])
        self.assertTrue(Path(revealed["output"]).is_dir())

    def test_alignment_rejection_when_worker_lies(self) -> None:
        self.start()
        for name, mode in (("dur.wav", "lie-duration"), ("rate.wav", "lie-rate")):
            job = self.wait_job(self.submit(name, mode))
            self.assertEqual(job["status"], "failed", job)
            self.assertIs(job["aligned"], False)
            self.assertIsNone(job["duration_seconds"])
            self.assertIn("alignment", str(job["error"]).lower())
            status, payload = self.request("GET", f"/jobs/{job['id']}/stems/vocals")
            self.assertEqual(status, 409, payload)

    def test_cancel_queued_and_processing(self) -> None:
        self.start(max_active=1, max_queued=1)
        running = self.submit("running.wav", "block")
        self.wait_until(running, "processing")
        queued = self.submit("queued.wav", "block")
        self.assertEqual(self.get_json(queued)["status"], "queued")
        status, payload = self.request("POST", f"/jobs/{queued}/cancel")
        self.assertEqual(status, 202, payload)
        cancelled = json.loads(payload)
        self.assertEqual(cancelled["status"], "cancelled")
        self.assertIn("before start", cancelled["error"])
        status, payload = self.request("POST", f"/jobs/{running}/cancel")
        self.assertEqual(status, 202, payload)
        finished = self.wait_job(running)
        self.assertEqual(finished["status"], "cancelled")

    def test_concurrency_limit(self) -> None:
        self.start(max_active=1, max_queued=0)
        self.submit("hold.wav", "block")
        status, payload = self.request("POST", "/jobs", {"audio": str(self.make_source("extra.wav", "block"))})
        self.assertEqual(status, 429, payload)
        body = json.loads(payload)
        self.assertEqual(body["max_active"], 1)
        self.assertEqual(body["max_queued"], 0)

    def test_disk_survives_restart_and_inflight_is_interrupted(self) -> None:
        processing_id = str(uuid.uuid4())
        completed_id = str(uuid.uuid4())
        jobs = self.state / "jobs"
        jobs.mkdir(parents=True)
        (jobs / f"{processing_id}.json").write_text(json.dumps({
            "id": processing_id, "status": "processing", "source": "/tmp/song.wav", "output": "/tmp/out",
            "progress": 10, "stage": "separating", "error": None, "stems": [], "aligned": None,
        }), encoding="utf-8")
        (jobs / f"{completed_id}.json").write_text(json.dumps({
            "id": completed_id, "status": "completed", "source": "/tmp/done.wav", "output": "/tmp/done",
            "progress": 100, "stage": "completed", "error": None, "stems": [], "aligned": True,
            "duration_seconds": 1.25, "sample_rate": 44100,
        }), encoding="utf-8")
        self.start()
        interrupted = self.get_json(processing_id)
        self.assertEqual(interrupted["status"], "failed")
        self.assertEqual(interrupted["stage"], "interrupted")
        self.assertIn("restarted", interrupted["error"])
        kept = self.get_json(completed_id)
        self.assertEqual(kept["status"], "completed")
        self.assertEqual(kept["sample_rate"], 44100)
        self.stop_in_process()
        self.server = None
        self.thread = None
        self.start()
        self.assertEqual(self.get_json(completed_id)["status"], "completed")

    def test_process_restart_keeps_completed_job(self) -> None:
        state = self.root / "proc-state"
        root = self.root / "proc-stems"
        process, port = self.spawn(state, root)
        audio = self.make_source("proc.wav", "ok")
        status, payload = self.http(port, "POST", "/jobs", {"audio": str(audio)})
        self.assertEqual(status, 202, payload)
        job_id = json.loads(payload)["id"]
        job = self.http_wait(port, job_id)
        self.assertEqual(job["status"], "completed")
        self.assertAlmostEqual(job["duration_seconds"], 2000 / 22050)
        self.stop_process(process)
        _again, next_port = self.spawn(state, root)
        status, payload = self.http(next_port, "GET", f"/jobs/{job_id}")
        self.assertEqual(status, 200, payload)
        restored = json.loads(payload)
        self.assertEqual(restored["status"], "completed")
        self.assertEqual(restored["sample_rate"], 22050)

    def test_killed_process_marks_inflight_interrupted(self) -> None:
        if not Path("/proc/self").is_dir():
            self.skipTest("procfs is required to stop the fake worker after a hard kill")
        state = self.root / "kill-state"
        root = self.root / "kill-stems"
        process, port = self.spawn(state, root)
        audio = self.make_source("stuck.wav", "block")
        status, payload = self.http(port, "POST", "/jobs", {"audio": str(audio)})
        self.assertEqual(status, 202, payload)
        job_id = json.loads(payload)["id"]
        self.http_wait_status(port, job_id, "processing")
        workers = worker_pids(process.pid)
        self.assertTrue(workers)
        process.kill()
        process.wait(timeout=5)
        for pid in workers:
            kill_worker(pid)
        _again, next_port = self.spawn(state, root)
        status, payload = self.http(next_port, "GET", f"/jobs/{job_id}")
        self.assertEqual(status, 200, payload)
        job = json.loads(payload)
        self.assertEqual(job["status"], "failed")
        self.assertEqual(job["stage"], "interrupted")

    def test_submit_script(self) -> None:
        self.start()
        denied = subprocess.run(
            [sys.executable, str(SUBMIT), str(self.make_source("deny.wav", "ok")), "--port", str(self.port), "--token", "nope"],
            capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(denied.returncode, 1, denied.stderr)
        self.assertIn("401", denied.stderr)
        audio = self.make_source("cli.wav", "ok")
        accepted = subprocess.run(
            [sys.executable, str(SUBMIT), str(audio), "--wait", "--reveal", "--port", str(self.port), "--token", self.token, "--interval", "0.1"],
            capture_output=True, text=True, timeout=15,
        )
        self.assertEqual(accepted.returncode, 0, accepted.stderr + accepted.stdout)
        self.assertIn("Status: completed", accepted.stdout)
        self.assertIn("opened=True", accepted.stdout)

    def test_native_client_round_trip(self) -> None:
        binary = client_binary()
        if binary is None:
            if os.environ.get("TM_STEM_CLIENT_REQUIRED") == "1":
                self.fail("tm_stem_client was not built")
            self.skipTest("tm_stem_client is not built")
        self.start()
        refused = subprocess.run([str(binary), "--host", "10.0.0.1", "--port", "9", "health"], capture_output=True, text=True, timeout=5)
        self.assertEqual(refused.returncode, 2, refused.stderr)
        self.assertIn("127.0.0.1", refused.stderr)
        health = subprocess.run(
            [str(binary), "--host", "127.0.0.1", "--port", str(self.port), "--token", self.token, "health"],
            capture_output=True, text=True, timeout=5,
        )
        self.assertEqual(health.returncode, 0, health.stderr)
        self.assertIn("tm-stem-bridge", health.stdout)
        submitted = subprocess.run(
            [str(binary), "--host", "127.0.0.1", "--port", str(self.port), "--token", self.token, "submit", "--audio", str(self.make_source("native.wav", "ok")), "--wait", "--interval", "0.1", "--timeout", "10"],
            capture_output=True, text=True, timeout=15,
        )
        self.assertEqual(submitted.returncode, 0, submitted.stderr + submitted.stdout)
        last = [line for line in submitted.stdout.splitlines() if line.strip()][-1]
        job = json.loads(last)
        self.assertEqual(job["status"], "completed")
        self.assertTrue(job["aligned"])
        self.assertEqual(job["sample_rate"], 22050)

    def wait_until(self, job_id: str, status_name: str, timeout: float = 4) -> dict:
        deadline = time.time() + timeout
        last = None
        while time.time() < deadline:
            last = self.get_json(job_id)
            if last["status"] == status_name:
                return last
            if last["status"] in TERMINAL:
                self.fail(f"entered {last['status']} while waiting for {status_name}: {last}")
            time.sleep(0.05)
        self.fail(f"timed out waiting for {status_name}: {last}")

    def kill_our_workers(self) -> None:
        needle = str(self.worker).encode()
        proc = Path("/proc")
        if not proc.is_dir():
            return
        for entry in proc.iterdir():
            if not entry.name.isdigit():
                continue
            try:
                raw = (entry / "cmdline").read_bytes()
            except OSError:
                continue
            if needle in raw:
                kill_worker(int(entry.name))

    def stop_in_process(self) -> None:
        if self.server is not None and self.thread is not None and self.thread.is_alive():
            self.server.shutdown()
            self.server.server_close()
            self.thread.join(timeout=5)

    def spawn(self, state: Path, root: Path) -> tuple[subprocess.Popen[str], int]:
        env = os.environ.copy()
        env.update({
            "TM_STEM_BRIDGE_PORT": "0",
            "TM_STEM_BRIDGE_TOKEN": self.token,
            "TM_STEM_BRIDGE_STATE": str(state),
            "TM_STEM_BRIDGE_ROOT": str(root),
            "TM_STEM_WORKER": str(self.worker),
            "TM_STEM_BRIDGE_MAX_ACTIVE": "1",
            "TM_STEM_BRIDGE_MAX_QUEUED": "2",
            "TM_STEM_DEVICE": "cpu",
            "PYTHONUNBUFFERED": "1",
        })
        process = subprocess.Popen(
            [sys.executable, str(BRIDGE)],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        self.processes.append(process)
        stdout: list[str] = []
        stderr: list[str] = []
        threading.Thread(target=drain, args=(process.stdout, stdout), daemon=True).start()
        threading.Thread(target=drain, args=(process.stderr, stderr), daemon=True).start()
        deadline = time.time() + 5
        while time.time() < deadline:
            if process.poll() is not None:
                self.fail(f"bridge exited early: {''.join(stderr)}")
            for line in stdout:
                if "listening on http://127.0.0.1:" in line:
                    port = int(line.rsplit(":", 1)[1])
                    return process, port
            time.sleep(0.05)
        self.fail(f"bridge did not listen: {''.join(stderr)}")

    def stop_process(self, process: subprocess.Popen[str]) -> None:
        if process.poll() is None:
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        for pid in worker_pids(process.pid):
            kill_worker(pid)

    def http(self, port: int, method: str, path: str, payload: dict | None = None) -> tuple[int, bytes]:
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
        headers = {"Authorization": f"Bearer {self.token}"}
        body = None
        if payload is not None:
            body = json.dumps(payload).encode()
            headers["Content-Type"] = "application/json"
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read()
        status = response.status
        connection.close()
        return status, data

    def http_wait(self, port: int, job_id: str, timeout: float = 6) -> dict:
        deadline = time.time() + timeout
        last = None
        while time.time() < deadline:
            status, payload = self.http(port, "GET", f"/jobs/{job_id}")
            self.assertEqual(status, 200, payload)
            last = json.loads(payload)
            if last["status"] in TERMINAL:
                return last
            time.sleep(0.05)
        self.fail(f"timed out at {last}")

    def http_wait_status(self, port: int, job_id: str, status_name: str) -> dict:
        deadline = time.time() + 4
        last = None
        while time.time() < deadline:
            status, payload = self.http(port, "GET", f"/jobs/{job_id}")
            self.assertEqual(status, 200, payload)
            last = json.loads(payload)
            if last["status"] == status_name:
                return last
            if last["status"] in TERMINAL:
                self.fail(last)
            time.sleep(0.05)
        self.fail(last)


class DeepCatalogTests(unittest.TestCase):
    def test_every_catalog_target_resolves(self) -> None:
        targets = load_targets()
        self.assertGreaterEqual(len(targets), 60)
        ids = [str(item["id"]) for item in targets]
        self.assertEqual(len(ids), len(set(ids)))
        for item in targets:
            resolved = resolve_targets([str(item["id"])])
            self.assertEqual(resolved[0]["id"], item["id"])
            self.assertTrue(str(item["label"]).strip())
            self.assertTrue(str(item["group"]).strip())
            self.assertTrue(str(item["prompt"]).strip())
        with self.assertRaises(ValueError):
            resolve_targets([])
        with self.assertRaises(ValueError):
            resolve_targets(["not_a_real_target"])
        with self.assertRaises(ValueError):
            resolve_targets(ids[:60] + ["extra_target_id"])

    def test_local_worker_stops_before_demucs_without_sam(self) -> None:
        if sam_audio_installed():
            self.skipTest("SAM-Audio is installed. This check only covers the missing-model refusal.")
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "song.wav"
            source.write_bytes(b"not-audio")
            completed = subprocess.run(
                [sys.executable, str(Path(__file__).with_name("separate_local.py")), str(source), "--output", str(root / "out"), "--mode", "deep", "--targets", "kick,snare"],
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 1, completed.stderr)
            self.assertIn("SAM-Audio", completed.stderr)
            status = json.loads((root / "out" / "song" / "status.json").read_text(encoding="utf-8"))
            self.assertEqual(status["status"], "failed")
            self.assertEqual(status["targets"], ["kick", "snare"])
            self.assertFalse(list((root / "out").rglob("*.wav")))


class DeepBridgeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.bridge = BridgeContractTests()
        self.bridge.setUp()

    def tearDown(self) -> None:
        self.bridge.tearDown()

    def test_catalog_and_refusal(self) -> None:
        bridge = self.bridge
        bridge.start()
        status, payload = bridge.request("GET", "/catalog", token=None)
        self.assertEqual(status, 200, payload)
        catalog = json.loads(payload)
        self.assertGreaterEqual(catalog["count"], 60)
        self.assertEqual(catalog["samAudioInstalled"], sam_audio_installed())
        self.assertIn("Deep 60+", bridge.request("GET", "/", token=None)[1].decode())
        source = bridge.make_source("unknown-deep.wav", "ok")
        status, payload = bridge.request("POST", "/jobs", {"audio": str(source), "mode": "deep", "targets": ["not_a_target"]})
        self.assertEqual(status, 400, payload)
        source = bridge.make_source("empty-deep.wav", "ok")
        status, payload = bridge.request("POST", "/jobs", {"audio": str(source), "mode": "deep", "targets": []})
        self.assertEqual(status, 400, payload)
        if sam_audio_installed():
            return
        source = bridge.make_source("needs-model.wav", "ok")
        status, payload = bridge.request("POST", "/jobs", {"audio": str(source), "mode": "deep", "targets": ["kick"]})
        self.assertEqual(status, 409, payload)
        self.assertIn("SAM-Audio", json.loads(payload)["error"])

    def test_each_deep_target_round_trip(self) -> None:
        bridge = self.bridge
        bridge.start()
        targets = load_targets()
        self.assertGreaterEqual(len(targets), 60)
        with patch("bridge_server.deep_engine_ready", return_value=True):
            for target in targets:
                ident = str(target["id"])
                status, payload = bridge.request("POST", "/jobs", {"audio": str(bridge.make_source(f"{ident}.wav", "ok")), "mode": "deep", "targets": [ident]})
                self.assertEqual(status, 202, payload)
                job = bridge.wait_job(json.loads(payload)["id"], timeout=8)
                self.assertEqual(job["status"], "completed", job)
                self.assertEqual([item["id"] for item in job["deep_stems"]], [ident])
                self.assertGreater(float(job["deep_stems"][0]["duration_seconds"]), 0)
                code, audio = bridge.request("GET", f"/jobs/{job['id']}/deep/{ident}")
                self.assertEqual(code, 200, audio[:120])
                self.assertTrue(audio.startswith(b"RIFF"))
                code, core = bridge.request("GET", f"/jobs/{job['id']}/stems/vocals")
                self.assertEqual(code, 200, core[:80])
                self.assertTrue(core.startswith(b"RIFF"))

    def test_deep_claim_without_files_fails(self) -> None:
        bridge = self.bridge
        bridge.start()
        with patch("bridge_server.deep_engine_ready", return_value=True):
            status, payload = bridge.request("POST", "/jobs", {"audio": str(bridge.make_source("lie.wav", "lie-deep")), "mode": "deep", "targets": ["kick"]})
        self.assertEqual(status, 202, payload)
        job = bridge.wait_job(json.loads(payload)["id"])
        self.assertEqual(job["status"], "failed", job)
        self.assertIn("Deep 60+", job["error"])


def drain(stream, bucket: list[str]) -> None:
    if stream is None:
        return
    for line in stream:
        bucket.append(line)


def worker_pids(parent: int) -> list[int]:
    found = []
    proc = Path("/proc")
    if not proc.is_dir():
        return found
    for entry in proc.iterdir():
        if not entry.name.isdigit():
            continue
        pid = int(entry.name)
        try:
            text = (entry / "status").read_text(encoding="utf-8")
        except OSError:
            continue
        if f"PPid:\t{parent}\n" not in text:
            continue
        if is_worker(pid):
            found.append(pid)
    return found


def is_worker(pid: int) -> bool:
    cmdline = Path(f"/proc/{pid}/cmdline")
    if not cmdline.is_file():
        return False
    return b"fake_worker.py" in cmdline.read_bytes().replace(b"\x00", b" ")


def kill_worker(pid: int) -> None:
    if not is_worker(pid):
        return
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        return


if __name__ == "__main__":
    unittest.main()
