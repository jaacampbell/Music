"""Shared Deep 60+ target catalog for the local Stem Director bridge."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parents[2] / "services" / "separator" / "stem_catalog.json"
MAX_DEEP_TARGETS = 60

PRESETS: dict[str, list[str]] = {
    "vocals": ["lead_vocals", "background_vocals", "adlibs", "harmonies", "vocal_doubles"],
    "drums": ["kick", "snare", "clap", "closed_hihat", "open_hihat", "toms", "ride", "crash", "cymbals", "percussion"],
    "beat": ["kick", "snare", "clap", "hihat", "percussion", "bass_808", "sub_bass", "synth_bass"],
    "instruments": [
        "bass_guitar", "piano", "electric_piano", "organ", "synthesizer", "acoustic_guitar",
        "electric_guitar", "lead_guitar", "rhythm_guitar", "strings", "brass", "saxophone", "flute",
    ],
}


def load_targets() -> list[dict]:
    payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, list) or len(payload) < 60:
        raise RuntimeError("Deep 60+ catalog is missing or incomplete.")
    return payload


def target_map() -> dict[str, dict]:
    return {str(item["id"]): item for item in load_targets()}


def resolve_targets(ids: list[str]) -> list[dict]:
    if not isinstance(ids, list) or not ids or not all(isinstance(item, str) and item for item in ids):
        raise ValueError("Choose at least one Deep 60+ target.")
    unique = list(dict.fromkeys(ids))
    if len(unique) > MAX_DEEP_TARGETS:
        raise ValueError(f"Choose at most {MAX_DEEP_TARGETS} Deep 60+ targets.")
    known = target_map()
    unknown = [item for item in unique if item not in known]
    if unknown:
        raise ValueError("Unknown Deep 60+ targets: " + ", ".join(unknown[:8]))
    return [known[item] for item in unique]


def sam_audio_installed() -> bool:
    return importlib.util.find_spec("sam_audio") is not None


def catalog_payload() -> dict:
    targets = load_targets()
    groups: list[str] = []
    for target in targets:
        group = str(target.get("group") or "Other")
        if group not in groups:
            groups.append(group)
    presets = dict(PRESETS)
    presets["all"] = [str(target["id"]) for target in targets[:MAX_DEEP_TARGETS]]
    return {
        "count": len(targets),
        "maxDeepTargets": MAX_DEEP_TARGETS,
        "groups": groups,
        "targets": targets,
        "presets": presets,
        "samAudioInstalled": sam_audio_installed(),
        "note": "Deep 60+ isolates are independent text-prompt stems. They can overlap and are not a second Core 6 mix.",
    }
