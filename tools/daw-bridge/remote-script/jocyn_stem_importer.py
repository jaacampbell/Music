from __future__ import absolute_import, print_function

import json
import os
import shutil
import time
import traceback

from _Framework.ControlSurface import ControlSurface


INBOX = os.path.expanduser("~/.local/share/jocyn-daw-bridge/ableton_inbox")
PROCESSED = os.path.expanduser("~/.local/share/jocyn-daw-bridge/ableton_processed")
FAILED = os.path.expanduser("~/.local/share/jocyn-daw-bridge/ableton_failed")

FAMILY_ORDER = {
    "vocals": 0,
    "drums": 1,
    "bass": 2,
    "guitar": 3,
    "piano": 4,
    "keys": 4,
    "other": 9,
}

FAMILY_COLORS = {
    "vocals": 0xB7D36B,
    "drums": 0xEFA65B,
    "bass": 0x7FB3FF,
    "guitar": 0xC79AF4,
    "piano": 0xF2D36B,
    "keys": 0xF2D36B,
    "other": 0xA7AAA5,
}


def _safe_text(value):
    try:
        return str(value or "").strip()
    except Exception:
        return ""


def _family_for(stem):
    family = _safe_text(stem.get("family")).lower()
    name = (_safe_text(stem.get("name")) + " " + _safe_text(stem.get("label"))).lower()
    hay = family + " " + name
    if "vocal" in hay or "adlib" in hay or "ad-lib" in hay:
        return "vocals"
    if any(token in hay for token in ("drum", "kick", "snare", "hat", "percussion", "cymbal")):
        return "drums"
    if any(token in hay for token in ("bass", "808", "sub")):
        return "bass"
    if "guitar" in hay:
        return "guitar"
    if any(token in hay for token in ("piano", "key", "keyboard")):
        return "piano"
    return family if family in FAMILY_ORDER else "other"


def _track_name(stem):
    family = _family_for(stem).upper()
    label = _safe_text(stem.get("label") or stem.get("name") or "STEM").upper()
    if label == family:
        return family
    return "%s — %s" % (family, label)


class JOCYNStemImporter(ControlSurface):
    def __init__(self, c_instance):
        ControlSurface.__init__(self, c_instance)
        self._last_poll = 0.0
        self._busy = False
        for folder in (INBOX, PROCESSED, FAILED):
            try:
                os.makedirs(folder)
            except OSError:
                pass
        self.log_message("JOcYN Stem Importer loaded. Inbox: %s" % INBOX)

    def disconnect(self):
        self.log_message("JOcYN Stem Importer disconnected.")
        ControlSurface.disconnect(self)

    def update_display(self):
        ControlSurface.update_display(self)
        now = time.time()
        if self._busy or now - self._last_poll < 1.0:
            return
        self._last_poll = now
        self._poll()

    def _poll(self):
        try:
            names = sorted(name for name in os.listdir(INBOX) if name.endswith(".json"))
        except Exception:
            return
        if not names:
            return
        self._busy = True
        try:
            self._process(os.path.join(INBOX, names[0]))
        finally:
            self._busy = False

    def _process(self, command_path):
        try:
            with open(command_path, "r") as handle:
                payload = json.load(handle)
            if payload.get("schema") != "jocyn-ableton-import/v1":
                raise RuntimeError("Unsupported import command schema.")

            stems = payload.get("stems") or []
            stems = sorted(stems, key=lambda item: (
                FAMILY_ORDER.get(_family_for(item), 99),
                _safe_text(item.get("label") or item.get("name")).lower()
            ))
            if not stems:
                raise RuntimeError("Import command contains no stems.")

            song = self.song()
            created = []
            with self.component_guard():
                for stem in stems:
                    path = os.path.abspath(os.path.expanduser(_safe_text(stem.get("path"))))
                    if not os.path.isfile(path):
                        raise RuntimeError("Missing stem: %s" % path)

                    song.create_audio_track(-1)
                    track = song.tracks[-1]
                    family = _family_for(stem)
                    track.name = _track_name(stem)
                    try:
                        track.color = FAMILY_COLORS.get(family, FAMILY_COLORS["other"])
                    except Exception:
                        pass

                    position = float(payload.get("arrangementPositionBeats", 0.0) or 0.0)
                    imported = False

                    if hasattr(track, "create_audio_clip"):
                        track.create_audio_clip(path, position)
                        imported = True
                    elif getattr(track, "clip_slots", None):
                        slot = track.clip_slots[0]
                        if hasattr(slot, "create_audio_clip"):
                            slot.create_audio_clip(path)
                            imported = True

                    if not imported:
                        raise RuntimeError(
                            "This Live build does not expose create_audio_clip. "
                            "Live 12.0.5 or newer is required for automatic audio import."
                        )

                    created.append({
                        "track": track.name,
                        "family": family,
                        "path": path,
                    })

                try:
                    song.view.selected_track = song.tracks[-len(created)]
                except Exception:
                    pass

            result = {
                "schema": "jocyn-ableton-import-result/v1",
                "status": "completed",
                "completedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "projectTitle": payload.get("projectTitle"),
                "stemJobId": payload.get("stemJobId"),
                "createdTracks": created,
                "grouping": {
                    "requested": True,
                    "applied": False,
                    "reason": "Live 12 Python Remote Script API does not expose programmatic Group Track creation. Tracks were ordered and color-coded by family."
                }
            }
            self._finish(command_path, result, PROCESSED)
            self.show_message("JOcYN: imported %d stems into Arrangement View" % len(created))
            self.log_message("JOcYN import complete: %d tracks" % len(created))
        except Exception as exc:
            result = {
                "schema": "jocyn-ableton-import-result/v1",
                "status": "failed",
                "failedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "error": str(exc),
                "traceback": traceback.format_exc(),
            }
            self._finish(command_path, result, FAILED)
            self.show_message("JOcYN stem import failed — see Log.txt")
            self.log_message("JOcYN import failed: %s" % traceback.format_exc())

    def _finish(self, command_path, result, destination):
        base = os.path.splitext(os.path.basename(command_path))[0]
        result_path = os.path.join(destination, base + ".result.json")
        try:
            with open(result_path, "w") as handle:
                json.dump(result, handle, indent=2)
        except Exception:
            pass
        try:
            shutil.move(command_path, os.path.join(destination, os.path.basename(command_path)))
        except Exception:
            try:
                os.unlink(command_path)
            except Exception:
                pass
