#!/usr/bin/env python3
"""Create and manage the Music OS Stem Director RunPod worker.

Uses only the Python standard library. Runtime credentials are read from environment
variables so they never need to appear in workflow arguments or logs.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

API = "https://rest.runpod.io/v1"
DEFAULT_IMAGE = "ghcr.io/jaacampbell/music-separator:latest"
DEFAULT_GPU_TYPES = [
    "NVIDIA GeForce RTX 4090",
    "NVIDIA RTX A6000",
    "NVIDIA RTX A5000",
    "NVIDIA L4",
]
CHARGE_CONFIRMATION = "I ACCEPT GPU CHARGES"
TERMINATION_CONFIRMATION = "TERMINATE STEM POD"


def api_key() -> str:
    value = os.environ.get("RUNPOD_API_KEY", "").strip()
    if not value:
        raise SystemExit("RUNPOD_API_KEY is required.")
    return value


def request_json(method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib_request.Request(
        f"{API}{path}",
        data=payload,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
            "User-Agent": "MusicOS-StemDirector-Deploy/1.0",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=45) as response:
            if response.status == 204:
                return {}
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[-1500:]
        raise SystemExit(f"RunPod API {method} {path} failed ({exc.code}): {detail}") from exc
    except urllib_error.URLError as exc:
        raise SystemExit(f"RunPod API {method} {path} could not be reached: {exc.reason}") from exc


def require_charge_confirmation(value: str) -> None:
    if value != CHARGE_CONFIRMATION:
        raise SystemExit(f"Paid GPU action requires confirmation text: {CHARGE_CONFIRMATION}")


def worker_env() -> dict[str, str]:
    gateway = os.environ.get("SEPARATOR_GATEWAY_SECRET", "").strip()
    if not gateway:
        raise SystemExit("SEPARATOR_GATEWAY_SECRET is required for a production worker.")
    supabase_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    if not supabase_url.startswith("https://"):
        raise SystemExit("SUPABASE_URL must be explicitly configured as the production HTTPS Supabase project URL.")

    hf = os.environ.get("HF_TOKEN", "").strip()
    openai = os.environ.get("OPENAI_API_KEY", "").strip()
    env = {
        "SEPARATOR_GATEWAY_SECRET": gateway,
        "SUPABASE_URL": supabase_url,
        "CORS_ORIGINS": os.environ.get("CORS_ORIGINS", "https://musicdevnc.netlify.app").strip(),
        "DEMUCS_DEVICE": "cuda",
        "SAM_AUDIO_DEVICE": "cuda",
        "SAM_AUDIO_MODEL": os.environ.get("SAM_AUDIO_MODEL", "facebook/sam-audio-small").strip(),
        "MAX_DEEP_TARGETS": os.environ.get("MAX_DEEP_TARGETS", "60").strip(),
        "STEM_AGENT_HIERARCHICAL": "true",
        "SEPARATOR_RESUME_ON_START": "true",
        "SEPARATOR_MAX_RESTART_RESUMES": os.environ.get("SEPARATOR_MAX_RESTART_RESUMES", "2").strip(),
        "SEPARATOR_CLOUD_SYNC_INTERVAL_SECONDS": os.environ.get("SEPARATOR_CLOUD_SYNC_INTERVAL_SECONDS", "2").strip(),
        "STEM_AGENT_USE_LLM": "true" if openai else "false",
        "STEM_AGENT_MODEL": os.environ.get("STEM_AGENT_MODEL", "gpt-5-mini").strip(),
    }
    if hf:
        env["HF_TOKEN"] = hf
        env["HUGGING_FACE_HUB_TOKEN"] = hf
    if openai:
        env["OPENAI_API_KEY"] = openai
    return env


def pod_url(pod_id: str) -> str:
    return f"https://{pod_id}-8000.proxy.runpod.net"


def github_output(name: str, value: str) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as output:
            output.write(f"{name}={value}\n")
    else:
        print(f"{name}={value}")


def github_summary(markdown: str) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as output:
            output.write(markdown.rstrip() + "\n")


def create_pod(args: argparse.Namespace) -> dict[str, Any]:
    require_charge_confirmation(args.confirm_charges)
    gpu_types = [item.strip() for item in args.gpu_types.split(",") if item.strip()] or DEFAULT_GPU_TYPES
    body = {
        "name": args.name,
        "computeType": "GPU",
        "cloudType": args.cloud_type,
        "gpuCount": 1,
        "gpuTypeIds": gpu_types,
        "gpuTypePriority": "availability",
        "allowedCudaVersions": ["12.8"],
        "imageName": args.image,
        "containerDiskInGb": args.container_disk_gb,
        "volumeInGb": args.volume_gb,
        "volumeMountPath": "/workspace",
        "ports": ["8000/http"],
        "interruptible": args.interruptible,
        "minRAMPerGPU": args.min_ram_per_gpu,
        "minVCPUPerGPU": args.min_vcpu_per_gpu,
        "supportPublicIp": True,
        "env": worker_env(),
    }
    return request_json("POST", "/pods", body)


def update_pod(args: argparse.Namespace) -> dict[str, Any]:
    require_charge_confirmation(args.confirm_charges)
    if not args.pod_id:
        raise SystemExit("--pod-id is required for update.")
    body = {
        "name": args.name,
        "imageName": args.image,
        "containerDiskInGb": args.container_disk_gb,
        "volumeInGb": args.volume_gb,
        "volumeMountPath": "/workspace",
        "ports": ["8000/http"],
        "env": worker_env(),
    }
    return request_json("POST", f"/pods/{args.pod_id}/update", body)


def lifecycle(args: argparse.Namespace) -> dict[str, Any]:
    if not args.pod_id:
        raise SystemExit(f"--pod-id is required for {args.operation}.")
    if args.operation in {"start", "restart"}:
        require_charge_confirmation(args.confirm_charges)
    if args.operation == "delete":
        if args.confirm_termination != TERMINATION_CONFIRMATION:
            raise SystemExit(f"Pod deletion requires confirmation text: {TERMINATION_CONFIRMATION}")
        request_json("DELETE", f"/pods/{args.pod_id}")
        return {"id": args.pod_id, "desiredStatus": "TERMINATED"}
    if args.operation == "status":
        return request_json("GET", f"/pods/{args.pod_id}")
    return request_json("POST", f"/pods/{args.pod_id}/{args.operation}")


def probe(url: str, timeout: float = 8.0) -> tuple[bool, dict[str, Any] | None, str | None]:
    try:
        req = urllib_request.Request(url, headers={"User-Agent": "MusicOS-StemDirector-Deploy/1.0"})
        with urllib_request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
            return response.status < 400, data, None
    except Exception as exc:
        return False, None, str(exc)


def wait_for_worker(url: str, attempts: int, interval: int) -> dict[str, Any]:
    last_error = "worker did not answer"
    for attempt in range(1, attempts + 1):
        ok, ready, error = probe(f"{url}/agent/ready")
        if ok and ready and ready.get("ready") is True:
            _, health, _ = probe(f"{url}/agent/health")
            _, system, _ = probe(f"{url}/agent/system")
            _, mirror, _ = probe(f"{url}/agent/mirror/edge")
            return {"ready": ready, "health": health, "system": system, "mirror": mirror, "attempt": attempt}
        last_error = error or json.dumps(ready or {})
        print(f"Health attempt {attempt}/{attempts}: not ready ({last_error[-300:]})")
        if attempt < attempts:
            time.sleep(interval)
    raise SystemExit(f"RunPod worker never became ready at {url}: {last_error}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--operation", choices=["create", "update", "start", "stop", "restart", "delete", "status"], required=True)
    parser.add_argument("--pod-id", default="")
    parser.add_argument("--name", default="music-os-stem-director")
    parser.add_argument("--image", default=DEFAULT_IMAGE)
    parser.add_argument("--gpu-types", default=",".join(DEFAULT_GPU_TYPES))
    parser.add_argument("--cloud-type", choices=["SECURE", "COMMUNITY"], default="SECURE")
    parser.add_argument("--interruptible", action="store_true")
    parser.add_argument("--volume-gb", type=int, default=80)
    parser.add_argument("--container-disk-gb", type=int, default=60)
    parser.add_argument("--min-ram-per-gpu", type=int, default=24)
    parser.add_argument("--min-vcpu-per-gpu", type=int, default=4)
    parser.add_argument("--confirm-charges", default="")
    parser.add_argument("--confirm-termination", default="")
    parser.add_argument("--health-attempts", type=int, default=60)
    parser.add_argument("--health-interval", type=int, default=10)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.operation == "create":
        pod = create_pod(args)
    elif args.operation == "update":
        pod = update_pod(args)
    else:
        pod = lifecycle(args)

    pod_id = str(pod.get("id") or args.pod_id or "")
    if not pod_id:
        raise SystemExit(f"RunPod response did not include a Pod id: {json.dumps(pod)[:800]}")

    url = pod_url(pod_id)
    cost = str(pod.get("adjustedCostPerHr") or pod.get("costPerHr") or "")
    desired = str(pod.get("desiredStatus") or "")
    github_output("pod_id", pod_id)
    github_output("worker_url", url)
    github_output("cost_per_hr", cost)
    github_output("desired_status", desired)

    if args.operation in {"create", "update", "start", "restart"}:
        diagnostics = wait_for_worker(url, args.health_attempts, args.health_interval)
        health = diagnostics.get("health") or {}
        github_output("worker_version", str(health.get("version") or ""))
        github_output("deep_ready", str(bool((health.get("samAudio") or {}).get("installed") and (health.get("samAudio") or {}).get("cudaAvailable"))).lower())
        github_summary(
            f"## Stem Director GPU deployment\n\n"
            f"- Pod: `{pod_id}`\n"
            f"- Worker: `{url}`\n"
            f"- Desired state: `{desired or 'RUNNING'}`\n"
            f"- Reported worker version: `{health.get('version', 'unknown')}`\n"
            f"- CUDA: `{(health.get('samAudio') or {}).get('cudaAvailable', False)}`\n"
            f"- SAM-Audio: `{(health.get('samAudio') or {}).get('installed', False)}`\n"
            + (f"- RunPod estimated cost/hr: `{cost}`\n" if cost else "")
        )
    else:
        github_summary(f"## Stem Director Pod `{args.operation}`\n\n- Pod: `{pod_id}`\n- State: `{desired or 'unknown'}`\n")


if __name__ == "__main__":
    main()
