from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import os
import re
import shutil
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request as urllib_request

import numpy as np
import soundfile as sf
from fastapi import HTTPException, Request

DATA_DIR = Path(os.environ.get("SEPARATOR_DATA_DIR", str(Path(__file__).parent / "data")))
DATA_DIR.mkdir(parents=True, exist_ok=True)
WORKER_AUTH_SECRET = os.environ.get("SEPARATOR_GATEWAY_SECRET", "").strip()
MAX_UPLOAD_BYTES = max(10, int(os.environ.get("SEPARATOR_MAX_UPLOAD_MB", "500"))) * 1024 * 1024
JOB_TTL_HOURS = max(1, int(os.environ.get("SEPARATOR_JOB_TTL_HOURS", "24")))
DOWNLOAD_TTL_SECONDS = max(600, int(os.environ.get("SEPARATOR_DOWNLOAD_TTL_SECONDS", "21600")))
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
STEM_AGENT_MODEL = os.environ.get("STEM_AGENT_MODEL", "gpt-5-mini")
STEM_AGENT_USE_LLM = os.environ.get("STEM_AGENT_USE_LLM", "true").lower() == "true"
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".m4a", ".mp4", ".aiff", ".aif", ".aac", ".ogg"}
ACTIVE_STATUSES = {"queued", "running", "cancelling"}
TERMINAL_STATUSES = {"completed", "failed", "cancelled"}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def sign_payload(payload: dict[str, Any]) -> str:
    if not WORKER_AUTH_SECRET:
        return ""
    encoded = b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    signature = hmac.new(WORKER_AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{b64url_encode(signature)}"


def verify_token(token: str, scope: str | None = None) -> dict[str, Any]:
    if not WORKER_AUTH_SECRET:
        return {"sub": "development", "scope": scope or "worker", "exp": int(time.time()) + 3600}
    try:
        encoded, supplied = token.split(".", 1)
        expected = hmac.new(WORKER_AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, b64url_decode(supplied)):
            raise ValueError("signature")
        payload = json.loads(b64url_decode(encoded))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        if scope and payload.get("scope") != scope:
            raise ValueError("scope")
        return payload
    except Exception as exc:
        raise HTTPException(401, "Invalid or expired Stem Agent token.") from exc


def bearer(request: Request) -> str:
    value = request.headers.get("authorization", "")
    return value[7:].strip() if value.lower().startswith("bearer ") else ""


def worker_claims(request: Request) -> dict[str, Any]:
    if not WORKER_AUTH_SECRET:
        return {"sub": "development", "scope": "worker"}
    token = bearer(request)
    if not token:
        raise HTTPException(401, "Stem Agent authentication is required.")
    return verify_token(token, "worker")


def download_token(job_id: str) -> str:
    return sign_payload({"exp": int(time.time()) + DOWNLOAD_TTL_SECONDS, "jobId": job_id, "nonce": uuid.uuid4().hex[:12], "scope": "download"})


def rms_db(audio: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(np.square(audio)))) if audio.size else 0.0
    return round(20 * math.log10(rms), 2) if rms > 1e-9 else -120.0


def peak_db(audio: np.ndarray) -> float:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    return round(20 * math.log10(peak), 2) if peak > 1e-9 else -120.0


def audio_profile(path: Path) -> dict[str, Any]:
    audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
    if audio.size == 0:
        raise RuntimeError("Decoded audio contained no samples.")
    max_frames = sr * 180
    sample = audio[:: max(1, len(audio) // max_frames)] if len(audio) > max_frames else audio
    mono = np.mean(sample, axis=1)
    abs_audio = np.abs(sample)
    peak = float(np.max(abs_audio))
    rms = float(np.sqrt(np.mean(np.square(sample))))
    clipping_ratio = float(np.mean(abs_audio >= 0.999))
    silence_ratio = float(np.mean(np.abs(mono) < 10 ** (-55 / 20)))
    fft_size = min(len(mono), 262144)
    centroid = 0.0
    if fft_size >= 2048:
        spectrum = np.abs(np.fft.rfft(mono[:fft_size] * np.hanning(fft_size)))
        frequencies = np.fft.rfftfreq(fft_size, 1 / sr)
        centroid = float(np.sum(frequencies * spectrum) / max(np.sum(spectrum), 1e-9))
    stereo_corr = None
    if sample.shape[1] >= 2 and np.std(sample[:, 0]) > 1e-8 and np.std(sample[:, 1]) > 1e-8:
        stereo_corr = float(np.corrcoef(sample[:, 0], sample[:, 1])[0, 1])
    return {
        "sampleRate": int(sr), "channels": int(audio.shape[1]), "durationSec": round(len(audio) / sr, 3),
        "rmsDb": rms_db(sample), "peakDb": peak_db(sample), "clippingRatio": round(clipping_ratio, 6),
        "silenceRatio": round(silence_ratio, 4), "crestFactor": round(peak / max(rms, 1e-9), 3),
        "spectralCentroidHz": round(centroid, 1), "stereoCorrelation": None if stereo_corr is None else round(stereo_corr, 4),
    }


def technical_qa(path: Path) -> dict[str, Any]:
    metrics = audio_profile(path)
    score = 100.0
    reasons: list[str] = []
    if metrics["rmsDb"] < -65:
        score -= 65; reasons.append("output is nearly silent")
    elif metrics["rmsDb"] < -52:
        score -= 30; reasons.append("output level is very low")
    if metrics["clippingRatio"] > 0.01:
        score -= 35; reasons.append("frequent digital clipping detected")
    elif metrics["clippingRatio"] > 0.001:
        score -= 15; reasons.append("some digital clipping detected")
    if metrics["silenceRatio"] > 0.98:
        score -= 25; reasons.append("output contains almost no active signal")
    score = max(0.0, min(100.0, score))
    return {
        "score": round(score, 1),
        "grade": "excellent" if score >= 90 else "good" if score >= 75 else "review" if score >= 50 else "weak",
        "reasons": reasons, "metrics": metrics,
        "meaning": "Technical integrity score only; it does not claim semantic isolation accuracy.",
    }


class JobStore:
    def __init__(self, root: Path):
        self.root = root; self.lock = threading.RLock()

    def path(self, job_id: str) -> Path:
        return self.root / job_id / "job.json"

    def load(self, job_id: str) -> dict[str, Any] | None:
        path = self.path(job_id)
        if not path.is_file(): return None
        with self.lock:
            try: return json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError): return None

    def write(self, job_id: str, payload: dict[str, Any]) -> None:
        path = self.path(job_id); path.parent.mkdir(parents=True, exist_ok=True); payload["updatedAt"] = now()
        temp = path.with_suffix(".tmp")
        with self.lock:
            temp.write_text(json.dumps(payload, indent=2), encoding="utf-8"); temp.replace(path)

    def create(self, job_id: str, data: dict[str, Any]) -> dict[str, Any]:
        payload = {"jobId": job_id, "status": "queued", "stage": "queued", "progress": 0, "events": [],
                   "cancelRequested": False, "createdAt": now(), "updatedAt": now(), **data}
        self.write(job_id, payload); self.event(job_id, "orchestrator", "Job accepted and queued.", 1, "queued")
        return self.load(job_id) or payload

    def update(self, job_id: str, **changes: Any) -> dict[str, Any]:
        with self.lock:
            payload = self.load(job_id)
            if not payload: raise KeyError(job_id)
            payload.update(changes); self.write(job_id, payload); return payload

    def event(self, job_id: str, agent: str, message: str, progress: int | None = None,
              stage: str | None = None, data: dict[str, Any] | None = None) -> None:
        with self.lock:
            payload = self.load(job_id)
            if not payload: raise KeyError(job_id)
            event: dict[str, Any] = {"at": now(), "agent": agent, "message": message}
            if data: event["data"] = data
            payload.setdefault("events", []).append(event); payload["events"] = payload["events"][-250:]
            if progress is not None: payload["progress"] = max(0, min(100, int(progress)))
            if stage: payload["stage"] = stage
            self.write(job_id, payload)


JOBS = JobStore(DATA_DIR)


def require_job(job_id: str) -> dict[str, Any]:
    if not re.fullmatch(r"[a-f0-9]{12}", job_id): raise HTTPException(404, "job not found")
    job = JOBS.load(job_id)
    if not job: raise HTTPException(404, "job not found")
    return job


def owned_job(request: Request, job_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    claims = worker_claims(request); job = require_job(job_id)
    if WORKER_AUTH_SECRET and job.get("owner") != claims.get("sub"): raise HTTPException(403, "You do not own this stem job.")
    return job, claims


def download_allowed(request: Request, job_id: str, access: str | None) -> None:
    if not WORKER_AUTH_SECRET: return
    payload = verify_token(access or bearer(request))
    if payload.get("scope") == "download" and payload.get("jobId") == job_id: return
    if payload.get("scope") == "worker" and require_job(job_id).get("owner") == payload.get("sub"): return
    raise HTTPException(403, "This token does not grant download access.")


def targets_for_group(targets: list[dict[str, Any]], *keywords: str) -> list[str]:
    keys = tuple(k.lower() for k in keywords); result: list[str] = []
    for target in targets:
        hay = f"{target.get('group','')} {target.get('label','')} {target.get('id','')}".lower()
        if any(key in hay for key in keys): result.append(target["id"])
    return result


def deterministic_plan(mode: str, strategy: str, instruction: str, requested: list[str], targets: list[dict[str, Any]]) -> dict[str, Any]:
    if mode == "core": return {"strategy": "core", "targets": [], "reasoning": ["Core mode requested."], "qaFocus": ["reconstruction", "clipping"], "planner": "deterministic"}
    if requested: return {"strategy": strategy or "manual", "targets": requested, "reasoning": ["Using explicitly selected deep targets."], "qaFocus": ["signal", "clipping", "silence"], "planner": "deterministic"}
    text = f"{strategy} {instruction}".lower(); selected: list[str] = []; reasons: list[str] = []
    if any(x in text for x in ["vocal", "acapella", "ad-lib", "background", "lead"]): selected += targets_for_group(targets, "vocal", "adlib"); reasons.append("Vocal goal detected.")
    if any(x in text for x in ["drum", "kick", "snare", "hi-hat", "percussion"]): selected += targets_for_group(targets, "drum", "kick", "snare", "hat", "percussion"); reasons.append("Drum goal detected.")
    if any(x in text for x in ["beat", "808", "bass", "instrumental"]): selected += targets_for_group(targets, "bass", "808", "sub", "drum"); reasons.append("Beat/low-end goal detected.")
    if any(x in text for x in ["instrument", "guitar", "piano", "keys", "string", "brass"]): selected += targets_for_group(targets, "guitar", "piano", "key", "string", "brass", "orchestral"); reasons.append("Instrument goal detected.")
    valid = {t["id"] for t in targets}; selected = list(dict.fromkeys(x for x in selected if x in valid))
    if not selected:
        selected = [x for x in ["lead_vocals", "background_vocals", "adlibs", "kick", "snare", "bass_808", "sub_bass"] if x in valid]
        reasons.append("Balanced production target set selected.")
    return {"strategy": strategy or "auto", "targets": selected, "reasoning": reasons, "qaFocus": ["signal", "clipping", "silence", "retries"], "planner": "deterministic"}


def openai_plan(mode: str, strategy: str, instruction: str, requested: list[str], source: dict[str, Any], targets: list[dict[str, Any]], limit: int) -> dict[str, Any] | None:
    if not (OPENAI_API_KEY and STEM_AGENT_USE_LLM and mode == "deep"): return None
    ids = [t["id"] for t in targets]
    schema = {"type":"object","properties":{"strategy":{"type":"string"},"targets":{"type":"array","items":{"type":"string","enum":ids},"maxItems":limit},"reasoning":{"type":"array","items":{"type":"string"},"maxItems":6},"qaFocus":{"type":"array","items":{"type":"string"},"maxItems":6}},"required":["strategy","targets","reasoning","qaFocus"],"additionalProperties":False}
    payload = {"model": STEM_AGENT_MODEL, "store": False,
               "instructions": "You are a stem-separation strategy agent. Choose only target IDs in the schema. You receive measured signal metadata, not audio, so never claim you heard the song. Prefer a focused production-useful set.",
               "input": json.dumps({"mode":mode,"strategy":strategy,"instruction":instruction,"requestedTargets":requested,"sourceProfile":source}),
               "text":{"format":{"type":"json_schema","name":"stem_agent_plan","strict":True,"schema":schema}}}
    req = urllib_request.Request("https://api.openai.com/v1/responses", data=json.dumps(payload).encode(), headers={"Authorization":f"Bearer {OPENAI_API_KEY}","Content-Type":"application/json"}, method="POST")
    try:
        with urllib_request.urlopen(req, timeout=45) as response: body = json.loads(response.read())
        text = "".join(c.get("text","") for item in body.get("output",[]) if item.get("type")=="message" for c in item.get("content",[]) if c.get("type")=="output_text")
        if not text: return None
        plan = json.loads(text); plan["targets"] = [x for x in plan.get("targets",[]) if x in ids][:limit]; plan["planner"] = f"OpenAI {STEM_AGENT_MODEL}"; return plan
    except Exception: return None


def plan(mode: str, strategy: str, instruction: str, requested: list[str], source: dict[str, Any], targets: list[dict[str, Any]], limit: int) -> dict[str, Any]:
    return openai_plan(mode, strategy, instruction, requested, source, targets, limit) or deterministic_plan(mode, strategy, instruction, requested, targets)


def cleanup_expired() -> int:
    cutoff = time.time() - JOB_TTL_HOURS * 3600; removed = 0
    for child in DATA_DIR.iterdir():
        job = JOBS.load(child.name) if child.is_dir() else None
        if not job or job.get("status") in ACTIVE_STATUSES: continue
        marker = child / "job.json"
        try:
            if marker.stat().st_mtime < cutoff: shutil.rmtree(child, ignore_errors=True); removed += 1
        except OSError: pass
    return removed
