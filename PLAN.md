# Stem Extraction + Music Editor Export — Technical Plan

## 1. Executive Summary

This document is the authoritative technical plan for the **Stem Extraction + DAW Export** module — a production-ready audio pipeline that accepts any audio source, separates it into clean, phase-aligned stems, analyzes its musical properties, and exports the result into formats usable by every major DAW.

The system is designed as a modular, job-queue-backed Python service with a React frontend. It is built to be embedded inside a larger **Universal Agentic Music Production OS** but functions independently as a standalone microservice.

**Recommended first stack:**

| Layer | Choice | Rationale |
|---|---|---|
| Default stem separator | `demucs` (HTDemucs 6s model) | Best open-source quality, Meta lineage, 6-stem support |
| Separator wrapper | `audio-separator` | Wraps UVR MDX-Net + VR Arch + Demucs; one CLI/API |
| Fast CPU fallback | `spleeter` 4stems | Lighter, faster, pre-trained TF/Keras weights |
| BPM / beat grid | `librosa` beat tracker | Battle-tested, integrates naturally |
| Key detection | `librosa` chroma + key estimation | Built-in, no extra deps |
| Audio-to-MIDI | `basic-pitch` (Spotify) | Best open-source melody/chord MIDI; Apache 2.0 |
| Pitch & tempo | `pyrubberband` | Python bindings to Rubber Band Library |
| Audio decode/convert | `ffmpeg-python` + `soundfile` | Universal format support |
| API framework | `FastAPI` | Async, typed, auto-OpenAPI |
| Job queue | `Celery` + `Redis` | Background processing; GPU jobs won't block HTTP |
| Storage | Local FS → S3-compatible | Start simple, swap to S3/Supabase later |
| Frontend | React + TypeScript + Vite | Fast SPA, easy to add wavesurfer.js |
| DAW export (MVP) | Aligned 24-bit WAV + JSON manifest + ZIP | Universal; works in every DAW |
| First real session export | REAPER `.rpp` | Text-based XML-like format; easy to generate |

---

## 2. Feature Comparison

| Feature | Moises | LALAL.AI | Suno-style | **This System** |
|---|---|---|---|---|
| Stem separation | 4–10 stems | Up to 10 stems | Vocals / instruments | 2/4/6/10 stems |
| Vocal isolation | ✅ | ✅ | ✅ | ✅ |
| Drums | ✅ | ✅ | ❌ | ✅ (+ kick/snare/hat) |
| Bass | ✅ | ✅ | ❌ | ✅ |
| Guitar | ✅ | ✅ | ❌ | ✅ (6-stem+) |
| Piano | ✅ | ✅ | ❌ | ✅ (6-stem+) |
| BPM detection | ✅ | ❌ | ❌ | ✅ |
| Key detection | ✅ | ❌ | ❌ | ✅ |
| Chord detection | ✅ | ❌ | ❌ | Phase 3 |
| Audio-to-MIDI | ❌ | ❌ | ❌ | ✅ (Basic Pitch) |
| REAPER export | ❌ | ❌ | ❌ | ✅ |
| Ableton folder | ❌ | ❌ | ❌ | ✅ |
| JSON manifest | ❌ | ❌ | ❌ | ✅ |
| Tempo map | ❌ | ❌ | ❌ | ✅ |
| Pitch shift | ✅ | ❌ | ❌ | ✅ |
| Time stretch | ✅ | ❌ | ❌ | ✅ |
| Agentic NL editing | ❌ | ❌ | ❌ | Phase 4 |
| Self-hosted / private | ❌ | ❌ | ❌ | ✅ |
| Open-source | ❌ | ❌ | ❌ | ✅ |

**Differentiators:** JSON-manifest-first design, REAPER session generation, MIDI sidecar per stem, agentic NL commands, self-hosted privacy, open model swap.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    INPUT LAYER                       │
│  File upload  │  Generated song  │  URL import      │
│  WAV MP3 FLAC AIFF M4A MP4 OGG                      │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                  PREPROCESSING                       │
│  FFmpeg decode → 16/24/32-bit PCM                    │
│  Loudness normalization (EBU R128)                   │
│  Sample-rate conversion to 44100 Hz                  │
│  Metadata extraction (duration, channels, codec)     │
│  BPM / beat grid / key / LUFS analysis               │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               STEM SEPARATION                        │
│  Model selection: htdemucs / htdemucs_6s /           │
│    htdemucs_ft / MDX-Net / spleeter                  │
│  Mode: 2-stem (vocal+inst) / 4-stem / 6-stem         │
│  Phase-aligned output at original sample rate        │
│  Confidence / quality scoring per stem               │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              MUSICAL ANALYSIS                        │
│  Beat grid + downbeat map (librosa)                  │
│  Key + scale (librosa chroma)                        │
│  Loudness per stem (pyloudnorm / ebur128)             │
│  Chord estimation — Phase 3 (chord-recognition)      │
│  Vocal melody MIDI — Phase 2 (basic-pitch)           │
│  Drum hit MIDI — Phase 3                             │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               EDITING LAYER (Phase 2+)               │
│  Solo / mute stems                                   │
│  Volume + pan per stem                               │
│  Pitch shift (pyrubberband)                          │
│  Time stretch (pyrubberband)                         │
│  Stem regeneration hook                              │
│  Section / bar editing                               │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                 EXPORT LAYER                         │
│  Aligned 24-bit WAV stems                            │
│  FLAC / AIFF variants                                │
│  MIDI sidecars (basic-pitch)                         │
│  Tempo map JSON                                      │
│  Chord chart JSON — Phase 3                          │
│  manifest.json (full project state)                  │
│  README_IMPORT.txt (per-DAW instructions)            │
│  ZIP stem pack                                       │
│  REAPER .rpp session — Phase 2                       │
│  Ableton-friendly folder layout — Phase 2            │
│  Logic/GarageBand folder — Phase 2                   │
└─────────────────────────────────────────────────────┘
```

### Service Topology

```
Browser (React)
    │  HTTP REST
FastAPI (uvicorn)
    │  Celery tasks
Redis broker
    │
Celery Worker(s)
    ├── FFmpegService
    ├── SeparatorService  (demucs / audio-separator)
    ├── AnalysisService   (librosa)
    ├── TranscriptionService (basic-pitch)
    ├── EditingService    (pyrubberband)
    └── ExportService     (zipfile / rpp writer)
    │
Local Storage (/data/projects/<project_id>/)
    ├── source/           original upload
    ├── preprocessed/     normalized WAV
    ├── stems/            separated WAV files
    ├── midi/             MIDI sidecars
    ├── exports/          ZIP, .rpp, etc.
    └── manifest.json
```

---

## 4. Data Model — manifest.json Schema

```json
{
  "schema_version": "1.0",
  "project_id": "proj_abc123",
  "title": "My Song",
  "created_at": "2026-06-29T08:00:00Z",
  "updated_at": "2026-06-29T08:05:00Z",

  "source": {
    "file": "source/original.mp3",
    "format": "mp3",
    "duration_seconds": 183.4,
    "sample_rate": 44100,
    "channels": 2,
    "bit_depth": 16,
    "codec": "libmp3lame",
    "size_bytes": 4521984
  },

  "analysis": {
    "bpm": 98.0,
    "bpm_confidence": 0.92,
    "key": "A minor",
    "key_confidence": 0.78,
    "time_signature": "4/4",
    "duration_bars": 96,
    "lufs_integrated": -14.2,
    "lufs_range": 7.1,
    "true_peak_dbfs": -0.8,
    "beat_times": [0.0, 0.612, 1.224],
    "downbeat_times": [0.0, 2.449],
    "tempo_map": [
      { "bar": 1, "beat": 1, "time_seconds": 0.0, "bpm": 98.0 }
    ]
  },

  "separation": {
    "model": "htdemucs_6s",
    "model_version": "4.0.1",
    "mode": "6stem",
    "processing_time_seconds": 42.1,
    "completed_at": "2026-06-29T08:04:10Z"
  },

  "stems": [
    {
      "name": "vocals",
      "label": "Vocals",
      "file": "stems/vocals.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -18.3,
      "true_peak_dbfs": -2.1,
      "confidence": 0.89,
      "midi_file": "midi/vocals.mid",
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    },
    {
      "name": "drums",
      "label": "Drums",
      "file": "stems/drums.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -16.1,
      "true_peak_dbfs": -0.5,
      "confidence": 0.95,
      "midi_file": null,
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    },
    {
      "name": "bass",
      "label": "Bass",
      "file": "stems/bass.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -17.2,
      "true_peak_dbfs": -1.3,
      "confidence": 0.91,
      "midi_file": "midi/bass.mid",
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    },
    {
      "name": "guitar",
      "label": "Guitar",
      "file": "stems/guitar.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -22.1,
      "true_peak_dbfs": -5.2,
      "confidence": 0.76,
      "midi_file": null,
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    },
    {
      "name": "piano",
      "label": "Piano / Keys",
      "file": "stems/piano.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -24.0,
      "true_peak_dbfs": -7.1,
      "confidence": 0.72,
      "midi_file": "midi/piano.mid",
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    },
    {
      "name": "other",
      "label": "Other",
      "file": "stems/other.wav",
      "format": "wav",
      "sample_rate": 44100,
      "channels": 2,
      "bit_depth": 24,
      "duration_seconds": 183.4,
      "start_time_seconds": 0.0,
      "lufs_integrated": -25.3,
      "true_peak_dbfs": -9.0,
      "confidence": 0.68,
      "midi_file": null,
      "is_muted": false,
      "volume_db": 0.0,
      "pan": 0.0
    }
  ],

  "chords": [],
  "markers": [],

  "exports": [
    {
      "id": "exp_001",
      "type": "wav_zip",
      "file": "exports/stems_pack.zip",
      "created_at": "2026-06-29T08:05:00Z",
      "includes_midi": true,
      "includes_manifest": true
    }
  ]
}
```

---

## 5. API Design

### Base URL: `/api/v1`

#### Projects

| Method | Path | Description |
|---|---|---|
| `POST` | `/projects` | Create project (upload audio) |
| `GET` | `/projects/{id}` | Get project state + manifest |
| `GET` | `/projects` | List all projects |
| `DELETE` | `/projects/{id}` | Delete project + files |

#### Jobs

| Method | Path | Description |
|---|---|---|
| `POST` | `/projects/{id}/jobs/separate` | Start stem separation |
| `POST` | `/projects/{id}/jobs/analyze` | Run musical analysis |
| `POST` | `/projects/{id}/jobs/transcribe` | Generate MIDI from stems |
| `GET` | `/projects/{id}/jobs/{job_id}` | Poll job status |

#### Stems

| Method | Path | Description |
|---|---|---|
| `GET` | `/projects/{id}/stems` | List stems |
| `GET` | `/projects/{id}/stems/{stem_name}` | Get stem metadata |
| `GET` | `/projects/{id}/stems/{stem_name}/file` | Download stem audio |
| `PATCH` | `/projects/{id}/stems/{stem_name}` | Update stem (mute, volume, pan) |

#### Editing

| Method | Path | Description |
|---|---|---|
| `POST` | `/projects/{id}/edit/transpose` | Transpose key (semitones) |
| `POST` | `/projects/{id}/edit/stretch` | Time stretch (ratio) |
| `POST` | `/projects/{id}/edit/remix` | Mix selected stems to mono file |

#### Exports

| Method | Path | Description |
|---|---|---|
| `POST` | `/projects/{id}/exports` | Create export (type: wav_zip, reaper, ableton) |
| `GET` | `/projects/{id}/exports/{export_id}` | Get export status |
| `GET` | `/projects/{id}/exports/{export_id}/download` | Download export file |

---

### Example: Create Stem Separation Job

**Request**
```http
POST /api/v1/projects/proj_abc123/jobs/separate
Content-Type: application/json

{
  "model": "htdemucs_6s",
  "mode": "6stem",
  "output_format": "wav",
  "bit_depth": 24,
  "normalize": true
}
```

**Response**
```json
{
  "job_id": "job_xyz789",
  "project_id": "proj_abc123",
  "type": "separate",
  "status": "queued",
  "created_at": "2026-06-29T08:00:00Z",
  "estimated_duration_seconds": 60
}
```

---

### Example: Poll Job Status

**Request**
```http
GET /api/v1/projects/proj_abc123/jobs/job_xyz789
```

**Response (in progress)**
```json
{
  "job_id": "job_xyz789",
  "status": "running",
  "progress_percent": 45,
  "message": "Separating stems (htdemucs_6s)...",
  "started_at": "2026-06-29T08:00:05Z"
}
```

**Response (complete)**
```json
{
  "job_id": "job_xyz789",
  "status": "completed",
  "progress_percent": 100,
  "result": {
    "stems": ["vocals", "drums", "bass", "guitar", "piano", "other"],
    "processing_time_seconds": 42.1
  },
  "completed_at": "2026-06-29T08:04:10Z"
}
```

---

### Example: Create WAV ZIP Export

**Request**
```http
POST /api/v1/projects/proj_abc123/exports
Content-Type: application/json

{
  "type": "wav_zip",
  "include_stems": ["vocals", "drums", "bass", "guitar", "piano", "other"],
  "include_midi": true,
  "include_manifest": true,
  "include_readme": true,
  "bit_depth": 24,
  "sample_rate": 44100
}
```

**Response**
```json
{
  "export_id": "exp_001",
  "status": "completed",
  "file": "exports/stems_pack.zip",
  "size_bytes": 182345678,
  "download_url": "/api/v1/projects/proj_abc123/exports/exp_001/download"
}
```

---

## 6. Model Selection

| Use Case | Model | Why |
|---|---|---|
| Default (best quality) | `htdemucs_6s` | 6 stems; best open-source SDR scores; Meta lineage |
| Fine-tuned vocal isolation | `htdemucs_ft` | Fine-tuned variant; better vocals in dense mixes |
| High-quality offline | `MDX-Net` via audio-separator | Excellent in UVR community benchmarks |
| Fast CPU fallback | `spleeter:4stems` | TF-based; fast on CPU; usable quality |
| Karaoke / instrumental only | `spleeter:2stems` | Quickest vocal strip |
| Audio-to-MIDI | `basic-pitch` | Best open-source piano-roll MIDI; Apache 2.0 |
| Commercial API fallback | LALAL.AI or AudioShake API | For cases where local model fails |

**Model comparison table:**

| Model | Stems | SDR Vocals | SDR Drums | GPU Needed | License | Maintained |
|---|---|---|---|---|---|---|
| htdemucs_6s | 6 | ~8.0 dB | ~11.4 dB | Optional | MIT | ✅ (adefossez fork) |
| htdemucs_ft | 4 | ~8.9 dB | ~11.9 dB | Optional | MIT | ✅ |
| MDX-Net (UVR) | 4+ | ~8.5 dB | ~11.0 dB | Recommended | MIT | ✅ |
| Open-Unmix | 4 | ~6.3 dB | ~9.0 dB | Optional | MIT | Moderate |
| Spleeter | 2/4/5 | ~6.0 dB | ~8.1 dB | Optional | MIT | ⚠️ Less active |

*(SDR = Signal-to-Distortion Ratio; higher is better. Values are approximate from MUSDB18-HQ benchmarks.)*

---

## 7. DAW Export Strategy

The universal rule: **all stems start at exactly 0.0 seconds, have the same sample rate (44100 Hz), same bit depth (24-bit), and same duration.** This lets any DAW import them as a grid-aligned multi-track session.

| DAW | Import Method | Notes |
|---|---|---|
| Ableton Live | Drag stems into Session/Arrangement view | Warp markers can lock to detected BPM |
| FL Studio | Open in Mixer as audio clips | Use tempo metadata from manifest |
| Logic Pro | File → Import Audio | Use BPM from manifest in tempo track |
| GarageBand | Drag into tracks | Works with aligned WAV |
| REAPER | `.rpp` auto-session (Phase 2) or drag-and-drop | Best programmatic support |
| Pro Tools | Drag to timeline at 0:00 | Use Broadcast WAV for sample-accurate sync |
| Cubase | Import as tracks | Pool import preserves sample positions |
| Studio One | Drag to arrange view | Smart templates match tempo |
| BandLab | Import WAV tracks | Browser-based; 44.1 kHz WAV required |

**Phase 2: REAPER `.rpp` auto-session** — A programmatically generated text file that places every stem at position 0 with correct BPM, names each track, and sets volume/pan from the manifest. This is the single most impactful DAW export addition after ZIP.

**Ableton-friendly export folder layout:**
```
ProjectName_Ableton/
├── ProjectName_120BPM_Aminor/
│   ├── 01_Vocals.wav
│   ├── 02_Drums.wav
│   ├── 03_Bass.wav
│   ├── 04_Guitar.wav
│   ├── 05_Piano.wav
│   ├── 06_Other.wav
│   ├── MIDI/
│   │   ├── Vocals.mid
│   │   └── Bass.mid
│   └── manifest.json
└── README_ABLETON.txt
```

---

## 8. Implementation Phases

### Phase 1 — MVP (this PR)
**Goal:** Upload audio → extract 4 stems → export aligned WAV ZIP with JSON manifest.

- [ ] FastAPI app skeleton + CORS + error handling
- [ ] File upload endpoint (WAV/MP3/FLAC/AIFF/M4A)
- [ ] FFmpeg preprocessing (decode → 44100 Hz 24-bit PCM WAV)
- [ ] Metadata extraction (duration, sample rate, channels)
- [ ] BPM + key detection (librosa)
- [ ] LUFS/loudness measurement (pyloudnorm)
- [ ] Demucs 4-stem separation (htdemucs model)
- [ ] Stem alignment verification
- [ ] manifest.json generation
- [ ] ZIP export endpoint
- [ ] Celery job queue (Redis broker)
- [ ] React frontend: upload + job polling + stem list + download
- [ ] Docker Compose for local dev

### Phase 2 — DAW-Ready Export
- [ ] REAPER `.rpp` session generator
- [ ] Basic Pitch MIDI transcription per melodic stem
- [ ] Ableton / Logic-friendly folder export layout
- [ ] Broadcast WAV (BWAV) metadata embedding
- [ ] `htdemucs_6s` 6-stem mode
- [ ] README_IMPORT.txt per DAW

### Phase 3 — Advanced Music Intelligence
- [ ] Downbeat detection
- [ ] Chord estimation (via chroma + template matching or `chord-recognition`)
- [ ] Drum MIDI transcription
- [ ] Vocal melody extraction refinement
- [ ] Section/marker detection (intro/verse/chorus)
- [ ] Pitch shift (pyrubberband) endpoint
- [ ] Time stretch (pyrubberband) endpoint

### Phase 4 — Agentic Editing
- [ ] Natural-language command interpreter (LLM router)
- [ ] Stem mute/solo/volume mix-down
- [ ] Stem replacement / regeneration hooks
- [ ] Arrangement editor (by bar number)
- [ ] Remix suggestion engine
- [ ] Per-stem re-prompt to music generators

### Phase 5 — Production Hardening
- [ ] GPU-aware job priority queue
- [ ] Result caching (hash-based)
- [ ] Batch processing (multiple songs)
- [ ] S3-compatible remote storage
- [ ] User library + project history
- [ ] Cost monitoring per job
- [ ] Rate limiting + auth

---

## 9. Directory Structure

```
/
├── PLAN.md                         ← this file
├── README.md
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py                 FastAPI entry point
│   │   ├── config.py               Settings (pydantic-settings)
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py       Assembles all routers
│   │   │       ├── projects.py     CRUD for projects
│   │   │       ├── jobs.py         Job submission + polling
│   │   │       ├── stems.py        Stem file + metadata
│   │   │       ├── exports.py      Export creation + download
│   │   │       └── edit.py         Transpose / stretch / remix
│   │   ├── models/
│   │   │   ├── project.py          Pydantic schemas
│   │   │   ├── stem.py
│   │   │   ├── job.py
│   │   │   └── export.py
│   │   ├── services/
│   │   │   ├── audio_io.py         FFmpeg decode/convert
│   │   │   ├── separator.py        Demucs / audio-separator
│   │   │   ├── analyzer.py         librosa BPM/key/LUFS
│   │   │   ├── transcriber.py      basic-pitch MIDI
│   │   │   ├── editor.py           pyrubberband pitch/tempo
│   │   │   ├── exporter.py         ZIP / REAPER / Ableton
│   │   │   └── manifest.py         manifest.json read/write
│   │   └── workers/
│   │       ├── celery_app.py       Celery + Redis config
│   │       └── tasks.py            Task definitions
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
│       ├── test_api.py
│       ├── test_separator.py
│       └── test_analyzer.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts           Typed API client
│   │   ├── components/
│   │   │   ├── AudioUpload.tsx     Drag-and-drop upload
│   │   │   ├── JobStatus.tsx       Polling + progress bar
│   │   │   ├── StemCard.tsx        Per-stem controls
│   │   │   ├── StemGrid.tsx        All stems grid
│   │   │   ├── ExportPanel.tsx     Export options + download
│   │   │   └── ManifestView.tsx    BPM/key/analysis display
│   │   ├── hooks/
│   │   │   ├── useJob.ts           Job polling hook
│   │   │   └── useProject.ts       Project state hook
│   │   └── types/
│   │       └── api.ts              TypeScript types from API
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── data/                           Runtime storage (gitignored)
    └── projects/
        └── <project_id>/
            ├── source/
            ├── preprocessed/
            ├── stems/
            ├── midi/
            ├── exports/
            └── manifest.json
```

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Stem bleed (drums leaking into bass, etc.) | Medium | Set user expectations; show confidence scores per stem |
| Demucs original repo archived | Low | Use `python-demucs` PyPI package or `audio-separator` wrapper |
| Long files (> 10 min) → OOM | High | Chunk-based processing; 30-second overlap windows |
| GPU unavailable in cloud | Medium | CPU fallback via spleeter; async job queue handles latency |
| Copyright / fair use | High | Clear UI notice: "Use only files you own or have rights to" |
| Basic Pitch accuracy on dense mixes | Medium | Transcription is optional/experimental; clearly labeled |
| Large file storage costs | Medium | Auto-delete exports after 24h; user-controlled retention |
| DAW format compatibility drift | Low | Prioritize universal WAV ZIP; .rpp is a bonus |
| Artifacts on low-bitrate MP3 (< 128 kbps) | Medium | Warn user; decode at highest available quality |

---

## 11. Testing Plan

### Unit Tests
- `test_separator.py`: Run htdemucs on a 10-second test clip; assert 4 output files exist with matching duration.
- `test_analyzer.py`: BPM detection on a 120 BPM click track → assert output within ±1 BPM.
- `test_exporter.py`: Assert ZIP contains all stem files + manifest.json + all stems start at 0.0s.

### Integration Tests
- Upload → separate → export full flow via API (pytest + httpx).
- Phase cancellation test: mix stems back together; assert near-zero residual (tests phase alignment).

### Compatibility Tests
- Import ZIP stems into REAPER; verify all tracks align at bar 1.
- Import into Ableton; confirm warp detection matches detected BPM.

### Edge Cases
- Mono input file → converted to stereo before separation.
- Very short file (< 5 seconds) → graceful error.
- Corrupt/truncated file → FFmpeg error caught and returned as 422.
- Low-bitrate MP3 (64 kbps) → warn; still process.

---

## 12. Build-This-First Checklist

The minimum viable product that proves the core value:

- [ ] `POST /api/v1/projects` — accept MP3/WAV upload, return `project_id`
- [ ] FFmpeg decode to normalized 44100 Hz 24-bit WAV
- [ ] librosa BPM + key detection
- [ ] Demucs 4-stem separation (htdemucs model)
- [ ] manifest.json written to project directory
- [ ] `POST /api/v1/projects/{id}/exports` with `type=wav_zip`
- [ ] Download ZIP of 4 aligned stems + manifest.json + README
- [ ] Celery job with `GET /api/v1/projects/{id}/jobs/{job_id}` polling
- [ ] React upload component + job progress bar + download button
- [ ] Docker Compose: FastAPI + Celery + Redis

When this checklist is complete, the system matches the core Moises/LALAL workflow with a self-hosted, open-source stack and a data model ready for Phase 2 REAPER + MIDI export.
