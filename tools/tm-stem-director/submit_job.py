#!/usr/bin/env python3
"""Submit an existing local audio file to the TM Stem Director loopback bridge."""
from __future__ import annotations
import argparse
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = "http://127.0.0.1:8766"

def call(path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = Request(BASE + path, data=data, headers={"Content-Type": "application/json"} if data else {}, method="POST" if data else "GET")
    with urlopen(req, timeout=10) as response:
        return json.load(response)

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("audio", type=Path)
    p.add_argument("--wait", action="store_true", help="Poll until the separation finishes")
    p.add_argument("--interval", type=float, default=2)
    args = p.parse_args()
    try:
        audio = args.audio.expanduser().resolve(strict=True)
        if not audio.is_file():
            p.error("Audio source must be a file")
        job = call("/jobs", {"audio": str(audio)})
        print(f"Job {job['id']}: queued")
        if not args.wait:
            print(f"Check: {BASE}/jobs/{job['id']}")
            return 0
        while True:
            time.sleep(max(0.5, args.interval))
            result = call("/jobs/" + job["id"])
            state = result["status"]
            print(f"Status: {state}", flush=True)
            if state == "completed":
                print("Stems: " + result["output"])
                return 0
            if state == "failed":
                print(result.get("error", "Separation failed"), file=sys.stderr)
                return 1
    except (OSError, HTTPError, URLError, ValueError, KeyError) as exc:
        print(f"Bridge unavailable or request failed: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
