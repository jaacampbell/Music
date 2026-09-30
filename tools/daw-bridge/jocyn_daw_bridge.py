#!/usr/bin/env python3
"""JO₵YN DAW Bridge.

Watches ~/Downloads for *.jocynhandoff files created by Music OS, downloads the
organized stem ZIP, safely extracts it into the song's 05_Stems folder, writes
an audit manifest, and opens the song's Ableton Sets folder or most-recent .als.

No third-party Python packages are required.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

DOWNLOADS = Path.home() / "Downloads"
PROJECT_ROOT = Path.home() / "Music" / "JOcYN" / "Ableton Projects"
ALLOWED_SCHEMES = {"https"}
ALLOWED_SUFFIXES = (".netlify.app", ".supabase.co", ".runpod.net", ".runpod.io")


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
    request = urllib.request.Request(url, headers={"User-Agent": "JOcYN-DAW-Bridge/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out)


def find_als(ableton_dir: Path) -> Path | None:
    sets = sorted(ableton_dir.glob("*.als"), key=lambda p: p.stat().st_mtime, reverse=True)
    return sets[0] if sets else None


def process_handoff(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") != "jocyn-daw-handoff/v1":
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

    audit = {
        **payload,
        "processedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "localProject": str(project_dir),
        "localStemFolder": str(import_dir),
        "bridgeVersion": "1.0",
    }
    (import_dir / "DAW_HANDOFF.json").write_text(
        json.dumps(audit, indent=2), encoding="utf-8"
    )

    archived_ticket = archive_dir / path.name
    if archived_ticket.exists():
        archived_ticket = archive_dir / f"{path.stem}_{int(time.time())}{path.suffix}"
    shutil.move(str(path), str(archived_ticket))

    als = find_als(ableton_dir)
    subprocess.run(["open", str(als if als else ableton_dir)], check=False)

    print(f"[JOcYN DAW Bridge] Imported {project_name} -> {import_dir}")


def main() -> int:
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
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
