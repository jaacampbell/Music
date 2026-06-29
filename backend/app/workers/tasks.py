"""Celery tasks for audio processing pipeline."""

from __future__ import annotations

import traceback
from pathlib import Path

from app.workers.celery_app import celery_app
from app.config import settings


def _project_dir(project_id: str) -> Path:
    return settings.projects_dir / project_id


@celery_app.task(bind=True, name="tasks.preprocess_audio")
def preprocess_audio(self, project_id: str) -> dict:
    """Decode uploaded audio → normalized 44100 Hz 24-bit WAV, run analysis."""
    try:
        from app.services.audio_io import decode_to_wav, probe_audio, build_source_info, read_audio
        from app.services.analyzer import run_full_analysis
        from app.services.manifest import load_manifest, save_manifest

        project_dir = _project_dir(project_id)
        manifest = load_manifest(project_dir)

        source_dir = project_dir / "source"
        source_files = list(source_dir.iterdir())
        if not source_files:
            raise FileNotFoundError("No source audio file found")
        original = source_files[0]

        self.update_state(state="PROGRESS", meta={"progress": 10, "message": "Probing audio..."})
        probe = probe_audio(original)
        source_info = build_source_info(original, probe)
        manifest.source = source_info

        preprocessed_dir = project_dir / "preprocessed"
        preprocessed_dir.mkdir(exist_ok=True)
        preprocessed_wav = preprocessed_dir / "audio.wav"

        self.update_state(state="PROGRESS", meta={"progress": 30, "message": "Decoding audio..."})
        decode_to_wav(original, preprocessed_wav, sample_rate=settings.target_sample_rate)

        self.update_state(state="PROGRESS", meta={"progress": 60, "message": "Analyzing BPM, key, loudness..."})
        audio, sr = read_audio(preprocessed_wav)
        analysis = run_full_analysis(audio, sr)
        manifest.analysis = analysis

        save_manifest(project_dir, manifest)
        self.update_state(state="PROGRESS", meta={"progress": 100, "message": "Preprocessing complete"})

        return {
            "bpm": analysis.bpm,
            "key": analysis.key,
            "duration_seconds": source_info.duration_seconds,
        }

    except Exception as exc:
        raise self.retry(exc=exc, countdown=0, max_retries=0)


@celery_app.task(bind=True, name="tasks.separate_stems")
def separate_stems(self, project_id: str, model: str, mode: str) -> dict:
    """Run Demucs stem separation on preprocessed WAV."""
    try:
        from app.services.separator import separate_stems as run_separation
        from app.services.analyzer import measure_loudness
        from app.services.audio_io import read_audio
        from app.services.manifest import load_manifest, save_manifest
        import numpy as np

        project_dir = _project_dir(project_id)
        manifest = load_manifest(project_dir)

        preprocessed_wav = project_dir / "preprocessed" / "audio.wav"
        if not preprocessed_wav.exists():
            raise FileNotFoundError("Preprocessed audio not found. Run preprocess first.")

        stems_dir = project_dir / "stems"
        stems_dir.mkdir(exist_ok=True)

        # Temp output dir for Demucs to write into
        demucs_tmp = project_dir / "_demucs_tmp"

        def cb(pct, msg):
            self.update_state(state="PROGRESS", meta={"progress": pct, "message": msg})

        self.update_state(state="PROGRESS", meta={"progress": 5, "message": "Starting stem separation..."})

        stem_infos, processing_time = run_separation(
            source_wav=preprocessed_wav,
            output_dir=stems_dir,
            model=model,
            mode=mode,
            progress_callback=cb,
        )

        # Measure loudness per stem
        self.update_state(state="PROGRESS", meta={"progress": 90, "message": "Measuring stem levels..."})
        for stem_info in stem_infos:
            stem_wav = project_dir / stem_info.file
            if stem_wav.exists():
                audio, sr = read_audio(stem_wav)
                lufs, _, true_peak = measure_loudness(audio, sr)
                stem_info.lufs_integrated = lufs
                stem_info.true_peak_dbfs = true_peak

        from datetime import datetime, timezone
        from app.models.project import SeparationInfo

        manifest.stems = stem_infos
        manifest.separation = SeparationInfo(
            model=model,
            mode=mode,
            processing_time_seconds=processing_time,
            completed_at=datetime.now(timezone.utc),
        )
        save_manifest(project_dir, manifest)

        return {"stems": [s.name for s in stem_infos], "processing_time_seconds": processing_time}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=0, max_retries=0)


@celery_app.task(bind=True, name="tasks.create_export")
def create_export(self, project_id: str, export_type: str, options: dict) -> dict:
    """Build a ZIP export or REAPER project."""
    try:
        from app.services.exporter import build_wav_zip, build_reaper_rpp
        from app.services.manifest import load_manifest, save_manifest

        project_dir = _project_dir(project_id)
        manifest = load_manifest(project_dir)

        self.update_state(state="PROGRESS", meta={"progress": 20, "message": f"Building {export_type} export..."})

        if export_type == "wav_zip":
            _, record = build_wav_zip(
                project_dir=project_dir,
                manifest=manifest,
                include_stems=options.get("include_stems"),
                include_midi=options.get("include_midi", False),
                include_manifest=options.get("include_manifest", True),
                include_readme=options.get("include_readme", True),
            )
        elif export_type == "reaper_rpp":
            _, record = build_reaper_rpp(project_dir=project_dir, manifest=manifest)
        else:
            raise ValueError(f"Unknown export type: {export_type}")

        manifest.exports.append(record)
        save_manifest(project_dir, manifest)

        self.update_state(state="PROGRESS", meta={"progress": 100, "message": "Export complete"})
        return {"export_id": record.id, "file": record.file, "size_bytes": record.size_bytes}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=0, max_retries=0)
