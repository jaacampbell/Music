from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class JobType(str, Enum):
    preprocess = "preprocess"
    separate = "separate"
    analyze = "analyze"
    transcribe = "transcribe"
    export = "export"


class StemInfo(BaseModel):
    name: str
    label: str
    file: str
    format: str = "wav"
    sample_rate: int = 44100
    channels: int = 2
    bit_depth: int = 24
    duration_seconds: float = 0.0
    start_time_seconds: float = 0.0
    lufs_integrated: float | None = None
    true_peak_dbfs: float | None = None
    confidence: float | None = None
    midi_file: str | None = None
    is_muted: bool = False
    volume_db: float = 0.0
    pan: float = 0.0


class AnalysisResult(BaseModel):
    bpm: float | None = None
    bpm_confidence: float | None = None
    key: str | None = None
    key_confidence: float | None = None
    time_signature: str = "4/4"
    duration_bars: int | None = None
    lufs_integrated: float | None = None
    lufs_range: float | None = None
    true_peak_dbfs: float | None = None
    beat_times: list[float] = Field(default_factory=list)
    downbeat_times: list[float] = Field(default_factory=list)
    tempo_map: list[dict[str, Any]] = Field(default_factory=list)


class SourceInfo(BaseModel):
    file: str
    format: str
    duration_seconds: float = 0.0
    sample_rate: int = 0
    channels: int = 0
    bit_depth: int | None = None
    codec: str | None = None
    size_bytes: int = 0


class SeparationInfo(BaseModel):
    model: str
    model_version: str | None = None
    mode: str
    processing_time_seconds: float | None = None
    completed_at: datetime | None = None


class ExportRecord(BaseModel):
    id: str = Field(default_factory=lambda: f"exp_{uuid.uuid4().hex[:8]}")
    type: str
    file: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    includes_midi: bool = False
    includes_manifest: bool = True
    size_bytes: int = 0


class ProjectManifest(BaseModel):
    schema_version: str = "1.0"
    project_id: str
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: SourceInfo | None = None
    analysis: AnalysisResult = Field(default_factory=AnalysisResult)
    separation: SeparationInfo | None = None
    stems: list[StemInfo] = Field(default_factory=list)
    chords: list[dict[str, Any]] = Field(default_factory=list)
    markers: list[dict[str, Any]] = Field(default_factory=list)
    exports: list[ExportRecord] = Field(default_factory=list)


# ── Request / Response schemas ────────────────────────────────────────────────

class ProjectCreateResponse(BaseModel):
    project_id: str
    title: str
    created_at: datetime


class SeparationRequest(BaseModel):
    model: str = "htdemucs"
    mode: str = "4stem"
    output_format: str = "wav"
    bit_depth: int = 24
    normalize: bool = True


class ExportRequest(BaseModel):
    type: str = "wav_zip"
    include_stems: list[str] | None = None
    include_midi: bool = False
    include_manifest: bool = True
    include_readme: bool = True
    bit_depth: int = 24
    sample_rate: int = 44100


class JobResponse(BaseModel):
    job_id: str
    project_id: str
    type: JobType
    status: JobStatus
    progress_percent: int = 0
    message: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: datetime | None = None
    completed_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
