#!/usr/bin/env python3
"""Submit a local audio path to the TM Stem Director loopback bridge.

The bridge must already be running on 127.0.0.1. This script never contacts
another host. It does not separate audio by itself and it does not modify the
installed Ableton VST3.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from bridge_server import TOKEN_PATH

HOST = "127.0.0.1"


def load_token(explicit: str) -> str:
    if explicit.strip():
        return explicit.strip()
    env = os.environ.get("TM_STEM_BRIDGE_TOKEN", "").strip()
    if env:
        return env
    if TOKEN_PATH.is_file():
        return TOKEN_PATH.read_text(encoding="utf-8").strip()
    return ""


def call(port: int, path: str, token: str, payload: dict | None = None, *, post: bool = False) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
        post = True
    elif post:
        data = b""
    request = Request(f"http://{HOST}:{port}{path}", data=data, headers=headers, method="POST" if post else "GET")
    with urlopen(request, timeout=10) as response:
        return json.load(response)


def poll(port: int, token: str, job_id: str, interval: float) -> dict:
    while True:
        result = call(port, f"/jobs/{job_id}", token)
        state = str(result.get("status") or "")
        progress = result.get("progress", "")
        stage = result.get("stage") or ""
        print(f"Status: {state} {progress}% {stage}", flush=True)
        if state in {"completed", "failed", "cancelled"}:
            return result
        time.sleep(max(0.05, interval))


def main() -> int:
    parser = argparse.ArgumentParser(description="Talk to the local TM Stem Director bridge on 127.0.0.1.")
    parser.add_argument("audio", nargs="?", type=Path)
    parser.add_argument("--id", default="", help="Existing job id for status, cancel, or reveal")
    parser.add_argument("--wait", action="store_true", help="Poll until the job finishes")
    parser.add_argument("--reveal", action="store_true", help="Ask the bridge to reveal a completed folder")
    parser.add_argument("--cancel", action="store_true", help="Cancel an existing job")
    parser.add_argument("--port", type=int, default=int(os.environ.get("TM_STEM_BRIDGE_PORT", "8766")))
    parser.add_argument("--token", default="")
    parser.add_argument("--interval", type=float, default=0.5)
    parser.add_argument("--mode", choices=("core", "deep"), default="core")
    parser.add_argument("--targets", default="", help="Comma-separated Deep 60+ target ids")
    args = parser.parse_args()
    if args.audio and args.id:
        parser.error("Pass a source file or --id, not both.")
    if args.cancel and not args.id:
        parser.error("--cancel requires --id.")
    if not args.audio and not args.id:
        parser.error("Pass a source file or --id.")
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535.")
    token = load_token(args.token)
    if not token:
        print("No bridge token. Set --token, TM_STEM_BRIDGE_TOKEN, or start the bridge and use its token file.", file=sys.stderr)
        return 1
    try:
        if args.cancel:
            call(args.port, f"/jobs/{args.id}/cancel", token, post=True)
            deadline = time.time() + 8
            result = call(args.port, f"/jobs/{args.id}", token)
            while result.get("status") not in {"cancelled", "failed", "completed"} and time.time() < deadline:
                time.sleep(0.1)
                result = call(args.port, f"/jobs/{args.id}", token)
            print(json.dumps(result))
            return 0 if result.get("status") == "cancelled" else 1
        if args.id and not args.audio:
            result = poll(args.port, token, args.id, args.interval) if args.wait else call(args.port, f"/jobs/{args.id}", token)
            if not args.wait:
                print(json.dumps(result))
            if args.reveal:
                if result.get("status") != "completed":
                    print("Stems are not ready to reveal.", file=sys.stderr)
                    return 1
                revealed = call(args.port, f"/jobs/{args.id}/reveal", token, post=True)
                print(f"Reveal: {revealed.get('output')} opened={revealed.get('opened')}")
            state = result.get("status")
            return 0 if state == "completed" or (not args.wait and state not in {"failed", "cancelled"}) else 1
        audio = args.audio.expanduser().resolve(strict=True)
        if not audio.is_file():
            parser.error("Audio source must be a file.")
        payload: dict[str, object] = {"audio": str(audio), "mode": args.mode}
        if args.mode == "deep":
            payload["targets"] = [part.strip() for part in args.targets.split(",") if part.strip()]
        job = call(args.port, "/jobs", token, payload)
        print(f"Job {job['id']}: {job.get('status', 'queued')}")
        result = poll(args.port, token, job["id"], args.interval) if args.wait else None
        if result is None:
            print(f"Check: http://{HOST}:{args.port}/jobs/{job['id']}")
            return 0
        if result.get("status") == "completed":
            print("Stems: " + str(result.get("output")))
            if args.reveal:
                revealed = call(args.port, f"/jobs/{job['id']}/reveal", token, post=True)
                print(f"Reveal: {revealed.get('output')} opened={revealed.get('opened')}")
            return 0
        print(result.get("error") or f"Job {result.get('status')}", file=sys.stderr)
        return 1
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        print(f"Bridge request failed ({exc.code}): {detail}", file=sys.stderr)
        return 1
    except (OSError, URLError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"Bridge unavailable or request failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
