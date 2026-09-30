#!/usr/bin/env python3
"""JO₵YN DAW Bridge.

Receives *.jocynhandoff files from Music OS, stages the organized stem pack in
the existing JO₵YN project tree, creates an Ableton import command for the
JOcYNStemImporter Remote Script, and opens the current Live Set.

No third-party Python packages are required.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

DOWNLOADS = Path.home() / "Downloads"
PROJECT_ROOT = Path.home() / "Music" / "JOcYN" / "Ableton Projects"
BRIDGE_ROOT = Path.home() / ".local" / "share" / "jocyn-daw-bridge"
ABLETON_INBOX = BRIDGE_ROOT / "ableton_inbox"
ALLOWED_SCHEMES = {"https"}
ALLOWED_SUFFIXES = (".netlify.app", ".supabase.co", ".runpod.net", ".runpod.io")
FAMILY_ORDER = {"vocals": 0, "drums": 1, "bass": 2, "guitar": 3, "piano": 4, "keys": 4, "other": 9}


def safe_project_name(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "_", value.strip()).strip("_").upper()
    return value or "UNTITLED_PROJECT"


def is_allowed_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False
    return bool(host) and (host == "musicdevnc.netlify.app" or host.endswith(ALLOWED_SUFFIXES))


def safe_extract(zip_path: Path, destination: Path) -> None:
    destination = destination.resolve()
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            candidate = (destination / member.filename).resolve()
            if not str(candidate).startswith(str(destination) + os.sep):
                raise RuntimeError(f"Unsafe ZIP member: {member.filename}")
        archive.extractall(destination)


def download(url: str, target: Path) -> None:
    if not is_allowed_url(url):
        raise RuntimeError(f"Refusing unapproved stem URL: {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "JOcYN-DAW-Bridge/2.0"})
    with urllib.request.urlopen(request, timeout=120) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out)


def find_als(ableton_dir: Path) -> Path | None:
    sets = sorted(ableton_dir.glob("*.als"), key=lambda p: p.stat().st_mtime, reverse=True)
    return sets[0] if sets else None


def family_for(stem: dict[str, Any]) -> str:
    family = str(stem.get("family") or "").lower()
    hay = f"{family} {stem.get('name','')} {stem.get('label','')}".lower()
    if "vocal" in hay or "adlib" in hay or "ad-lib" in hay:
        return "vocals"
    if any(x in hay for x in ("drum", "kick", "snare", "hat", "percussion", "cymbal")):
        return "drums"
    if any(x in hay for x in ("bass", "808", "sub")):
        return "bass"
    if "guitar" in hay:
        return "guitar"
    if any(x in hay for x in ("piano", "key", "keyboard")):
        return "piano"
    return family if family in FAMILY_ORDER else "other"


def load_stem_manifest(import_dir: Path) -> dict[str, Any]:
    path = import_dir / "manifest.json"
    if not path.is_file():
        raise RuntimeError("Stem package is missing manifest.json")
    return json.loads(path.read_text(encoding="utf-8"))


def build_import_command(import_dir: Path, payload: dict[str, Any]) -> dict[str, Any]:
    manifest = load_stem_manifest(import_dir)
    stems = []
    for stem in manifest.get("stems") or []:
        relative = str(stem.get("file") or "")
        if not relative:
            continue
        path = (import_dir / relative).resolve()
        if import_dir.resolve() not in path.parents or not path.is_file():
            raise RuntimeError(f"Manifest stem path is invalid: {relative}")
        item = {
            "name": stem.get("name"),
            "label": stem.get("label") or stem.get("name"),
            "family": family_for(stem),
            "path": str(path),
        }
        stems.append(item)

    stems.sort(key=lambda item: (FAMILY_ORDER.get(item["family"], 99), str(item.get("label") or "").lower()))
    if not stems:
        raise RuntimeError("No importable WAV stems were found in the organized pack.")

    return {
        "schema": "jocyn-ableton-import/v1",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "projectId": payload.get("projectId"),
        "projectTitle": payload.get("projectTitle"),
        "projectFolderName": payload.get("projectFolderName"),
        "stemJobId": payload.get("stemJobId"),
        "arrangementPositionBeats": 0.0,
        "groupIntent": ["vocals", "drums", "bass", "guitar", "piano", "other"],
        "stems": stems,
    }


def queue_ableton_import(command: dict[str, Any]) -> Path:
    ABLETON_INBOX.mkdir(parents=True, exist_ok=True)
    token = f"{safe_project_name(str(command.get('projectTitle') or 'PROJECT'))}_{command.get('stemJobId') or int(time.time())}"
    path = ABLETON_INBOX / f"{token}.json"
    temp = path.with_suffix(".json.tmp")
    temp.write_text(json.dumps(command, indent=2), encoding="utf-8")
    temp.replace(path)
    return path


def process_handoff(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") not in {"jocyn-daw-handoff/v1", "jocyn-daw-handoff/v2"}:
        raise RuntimeError("Unsupported handoff schema")

    project_name = safe_project_name(
        payload.get("projectFolderName")
        or payload.get("projectTitle")
        or "UNTITLED_PROJECT"
    )
    project_dir = (PROJECT_ROOT / project_name).resolve()
    if not str(project_dir).startswith(str(PROJECT_ROOT.resolve()) + os.sep):
        raise RuntimeError("Project path escaped the approved root")

    stems_dir = project_dir / "05_Stems"
    ableton_dir = project_dir / "01_Ableton_Sets"
    archive_dir = project_dir / "12_Archive" / "DAW_Handoffs"
    stems_dir.mkdir(parents=True, exist_ok=True)
    ableton_dir.mkdir(parents=True, exist_ok=True)
    archive_dir.mkdir(parents=True, exist_ok=True)

    job_id = str(payload.get("stemJobId") or "stem-job")
    import_dir = stems_dir / f"Stem_Director_{job_id}"
    import_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="jocyn-daw-") as temp:
        zip_path = Path(temp) / "stems.zip"
        download(str(payload["stemZipUrl"]), zip_path)
        safe_extract(zip_path, import_dir)

    command = build_import_command(import_dir, payload)
    command_path = queue_ableton_import(command)

    audit = {
        **payload,
        "processedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "localProject": str(project_dir),
        "localStemFolder": str(import_dir),
        "abletonImportCommand": str(command_path),
        "bridgeVersion": "2.0",
    }
    (import_dir / "DAW_HANDOFF.json").write_text(json.dumps(audit, indent=2), encoding="utf-8")

    archived_ticket = archive_dir / path.name
    if archived_ticket.exists():
        archived_ticket = archive_dir / f"{path.stem}_{int(time.time())}{path.suffix}"
    shutil.move(str(path), str(archived_ticket))

    als = find_als(ableton_dir)
    if als:
        subprocess.run(["open", str(als)], check=False)
        print(f"[JOcYN DAW Bridge] Opened Live Set: {als.name}")
    else:
        subprocess.run(["open", "-a", "Ableton Live", str(ableton_dir)], check=False)
        print("[JOcYN DAW Bridge] No .als found; opened Ableton and project folder.")

    print(f"[JOcYN DAW Bridge] Queued {len(command['stems'])} tracks for automatic Ableton import.")


def main() -> int:
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    ABLETON_INBOX.mkdir(parents=True, exist_ok=True)
    print(f"[JOcYN DAW Bridge] Watching {DOWNLOADS} for *.jocynhandoff")

    seen: set[Path] = set()
    while True:
        try:
            for path in sorted(DOWNLOADS.glob("*.jocynhandoff")):
                if path in seen:
                    continue
                seen.add(path)
                try:
                    process_handoff(path)
                except Exception as exc:
                    print(f"[JOcYN DAW Bridge] Failed {path.name}: {exc}", file=sys.stderr)
                    seen.discard(path)
            time.sleep(2)
        except KeyboardInterrupt:
            print("\n[JOcYN DAW Bridge] Stopped.")
            return 0


if __name__ == "__main__":
    raise SystemExit(main())
