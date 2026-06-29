# Stem Extraction + DAW Export — Feature Plan

Status: Draft v0.1 (plan-only, no implementation yet)
Owner: TBD
Target system: Universal Agentic Music Production OS

This document is the planning artifact requested before any code is written. It captures the architecture, module boundaries, data model, API surface, agent design, phased implementation, and risks for a production-ready "Stem Extraction + Music Editor Export" feature. Tool/model recommendations are summarized here at a decision level; deeper comparative research (with links and benchmark tables) is intentionally deferred to a follow-up research doc so this plan stays focused on what we will build.

---

## 1. Executive summary

We will build a modular pipeline that takes any audio source (upload, URL, or internally generated song) and produces aligned, editable stems plus a DAW-friendly export package. The core insight is that DAW interoperability is solved primarily by **discipline, not by a fancy file format**: aligned WAV stems with identical start time / sample rate / bit depth + a JSON manifest + MIDI sidecars import cleanly into every major DAW. A native REAPER `.rpp` is the first "real session" export because it is the easiest professional session format to emit deterministically. AAF/OMF and DAW-specific session formats are explicitly deferred.

Default separator: **HTDemucs (Hybrid Transformer Demucs)** via a maintained fork or container.
Power-user separator: **audio-separator** wrapping UVR-style MDX-Net / VR Arch / MDXC / Demucs models.
Fast fallback: **Spleeter** or **Open-Unmix** for CPU-only / low-latency paths.
Audio-to-MIDI: **Basic Pitch** for melodic stems; a separate drum-transcription path later.
Musical analysis: **librosa** + **Essentia** for BPM / beat grid / key / loudness.
Pitch / time: **Rubber Band** (via `pyrubberband` or native binding).
Decode / convert: **FFmpeg** everywhere.
Premium API fallback (optional): **AudioShake** or **LALAL.AI** behind a feature flag.

We treat the separator as a swappable backend behind a stable internal interface. Nothing in the rest of the system should care which model produced the stems.

---

## 2. Competitive feature matrix

| Capability                              | Moises | LALAL.AI | Suno workflow | Ours (MVP) | Ours (target) |
|-----------------------------------------|:------:|:--------:|:-------------:|:----------:|:-------------:|
| 2/4/6/10-stem separation                |   Y    |    Y     |  partial      |    4-stem  |    Y          |
| Vocal isolation / karaoke               |   Y    |    Y     |     Y         |     Y      |     Y         |
| BPM / key detection                     |   Y    |    N     |     N         |     Y      |     Y         |
| Chord chart                             |   Y    |    N     |     N         |     N      |     Y         |
| Pitch / tempo change                    |   Y    |    Y     |     N         |     N      |     Y         |
| Audio-to-MIDI                           | limited|    N     |     N         |     N      |     Y         |
| Aligned WAV stem ZIP                    |   Y    |    Y     |     Y         |     Y      |     Y         |
| Native DAW session export               |   N    |    N     |     N         |     N      |  REAPER first |
| Agentic natural-language editing        |   N    |    N     |  partial      |     N      |     Y (diff.) |
| Stem regeneration from prompt           |   N    |    N     |  partial      |     N      |     Y (diff.) |

**Must-have for v1:** aligned WAV stems, vocals/drums/bass/other, BPM + key, JSON manifest, ZIP export, solo/mute web player, karaoke + acapella one-click.

**Differentiators we own:** agentic natural-language editing, stem regeneration tied back to our song-DNA system, scorecard + revision loop, REAPER session auto-build.

---

## 3. Recommended architecture

Flow:

```
Source (upload | URL | generated)
  -> Ingest + rights check
  -> FFmpeg decode + normalize
  -> Analyze (BPM, key, loudness, duration, SR)
  -> Separate stems (pluggable backend)
  -> Per-stem QC (alignment, phase, loudness, confidence)
  -> Optional MIDI / chord / melody extraction
  -> Editing layer (solo/mute/gain/pan/pitch/time)
  -> Export packager (WAV ZIP | REAPER .rpp | DAW folders | MIDI sidecars | manifest)
  -> Persist project state + scorecard
```

### Module breakdown

| Module              | Responsibility                                                                | Default tools                          |
|---------------------|--------------------------------------------------------------------------------|----------------------------------------|
| `ingest`            | Accept upload/URL/internal handle, virus/size checks, rights gate              | FastAPI + storage adapter              |
| `decode`            | Convert to canonical PCM (44.1k or 48k / 24-bit / stereo), preserve metadata   | FFmpeg, soundfile                      |
| `analyze`           | BPM, downbeats, key, integrated LUFS, true peak, duration, SR                  | librosa, Essentia, pyloudnorm          |
| `separate`          | Run stem model, return per-stem PCM aligned to source                          | HTDemucs (default), audio-separator    |
| `qc`                | Alignment check, sum-vs-original null test, per-stem LUFS, confidence score    | numpy, pyloudnorm                      |
| `transcribe`        | Optional audio->MIDI for melodic stems; drum MIDI later                        | Basic Pitch                            |
| `edit`              | Apply gain/pan/mute/solo/pitch/time non-destructively to project state         | Rubber Band via pyrubberband           |
| `export`            | Build target package (ZIP, REAPER, DAW folder, MIDI sidecar set)               | custom emitters                        |
| `project`           | Persist manifest + revision history + scorecard                                | Postgres + object storage              |
| `agent`             | Translate NL intent into a pipeline plan, run it, summarize limitations        | LLM + tool-calling                     |

### Canonical internal audio format
- 48 kHz, 24-bit PCM, stereo, WAV.
- All stems share **exact** sample count and start at sample 0.
- Sum-of-stems vs. original null-test RMS is stored as a QC metric.

### Pluggable separator interface (pseudocode)
```python
class Separator(Protocol):
    name: str
    supported_modes: list[str]   # e.g. ["2", "4", "6"]
    def separate(self, audio: AudioBuffer, mode: str) -> dict[str, AudioBuffer]: ...
    def model_metadata(self) -> dict: ...
```
Backends registered: `htdemucs`, `audio_separator`, `spleeter`, `open_unmix`, `audioshake_api`, `lalal_api`.

---

## 4. DAW interoperability plan

Universal strategy first, native sessions second.

**Universal package** (works in every DAW listed below):
- One folder per project, lowercase ASCII filenames.
- `stems/` with one WAV per stem, identical SR/bit-depth/length, all starting at 0.
- `midi/` sidecar files for any transcribed parts.
- `manifest.json` (schema in §5).
- `README.txt` with import instructions per DAW.
- Optional `tempo_map.mid` (type-1 MIDI with tempo events) for DAWs that read tempo from MIDI.

**Per-DAW notes** (informational, no per-DAW code in MVP except REAPER):

| DAW           | Import path                                                          | Notes                                   |
|---------------|----------------------------------------------------------------------|-----------------------------------------|
| Ableton Live  | Drag stems folder onto an empty set; set project tempo from manifest | "Warp from here" disabled keeps timing  |
| FL Studio     | Drag WAVs to playlist at bar 1                                       | Set project BPM manually from manifest  |
| Logic Pro     | File > Import > Audio File (multi-select)                            | Stems land at playhead — start at 1.1.1 |
| GarageBand    | Same as Logic, fewer tracks                                          | -                                       |
| REAPER        | Open generated `.rpp` directly                                       | Native session export                   |
| Pro Tools     | File > Import > Audio                                                | Requires matching SR session            |
| Cubase        | File > Import > Audio Files                                          | -                                       |
| Studio One    | Drag folder to arrange                                               | -                                       |
| BandLab       | Upload stems individually                                            | -                                       |

**Native session export (phase 2):** REAPER `.rpp` only. AAF/OMF stays in a research doc; we will not ship it in early phases.

---

## 5. Data model

Project manifest (JSON, versioned). This is the source of truth for what the agent and the editor see.

```json
{
  "schema_version": "1.0",
  "project_id": "uuid",
  "title": "string",
  "created_at": "iso8601",
  "updated_at": "iso8601",
  "source": {
    "kind": "upload|url|generated",
    "original_filename": "string",
    "checksum_sha256": "hex",
    "rights": {
      "status": "user_owned|licensed|public_domain|unknown",
      "notes": "string"
    }
  },
  "audio": {
    "sample_rate": 48000,
    "bit_depth": 24,
    "channels": 2,
    "duration_seconds": 183.42,
    "lufs_integrated": -14.1,
    "true_peak_dbtp": -1.0
  },
  "musical": {
    "bpm": 120.0,
    "bpm_confidence": 0.92,
    "key": "A minor",
    "key_confidence": 0.78,
    "beat_grid": [{"t": 0.0, "beat": 1, "bar": 1, "downbeat": true}],
    "chords": [{"start": 0.0, "end": 2.0, "symbol": "Am"}],
    "markers": [{"t": 0.0, "label": "intro"}]
  },
  "separation": {
    "backend": "htdemucs",
    "model_version": "v4",
    "mode": "4-stem",
    "null_test_rms_db": -38.2
  },
  "stems": [
    {
      "name": "vocals",
      "file": "stems/vocals.wav",
      "start_sample": 0,
      "num_samples": 8804160,
      "sample_rate": 48000,
      "channels": 2,
      "lufs_integrated": -16.2,
      "true_peak_dbtp": -1.1,
      "confidence": 0.91,
      "midi_file": "midi/vocals.mid",
      "tags": ["lead_vocal"]
    }
  ],
  "tempo_map": [{"t": 0.0, "bpm": 120.0}],
  "edits": [
    {"id": "e1", "type": "gain", "stem": "vocals", "db": -2.0},
    {"id": "e2", "type": "mute", "stem": "drums", "value": false}
  ],
  "exports": [
    {"id": "x1", "kind": "zip_wav", "path": "exports/x1.zip", "created_at": "..."}
  ],
  "scorecard": {
    "separation_quality": 0.86,
    "alignment_quality": 0.99,
    "musicality": null
  },
  "revision_history": [
    {"version": 1, "summary": "initial extraction", "at": "..."}
  ]
}
```

Database tables (Postgres): `projects`, `stems`, `exports`, `jobs`, `events`. Manifest is materialized into both the DB and an object-storage JSON for portability.

---

## 6. API design (REST first)

All long-running operations return a `job_id` and stream progress over SSE/WebSocket.

| Method | Path                                          | Purpose                                    |
|--------|-----------------------------------------------|--------------------------------------------|
| POST   | `/v1/projects`                                | Create project from upload/URL/generated   |
| GET    | `/v1/projects/{id}`                           | Fetch manifest                             |
| POST   | `/v1/projects/{id}/jobs/separate`             | Start separation (body: `{mode, backend}`) |
| POST   | `/v1/projects/{id}/jobs/analyze`              | BPM/key/loudness                           |
| POST   | `/v1/projects/{id}/jobs/transcribe`           | MIDI for given stem(s)                     |
| POST   | `/v1/projects/{id}/edits`                     | Append non-destructive edit                |
| POST   | `/v1/projects/{id}/jobs/transpose`            | Pitch shift / key change                   |
| POST   | `/v1/projects/{id}/jobs/timestretch`          | Tempo change                               |
| POST   | `/v1/projects/{id}/jobs/regenerate-stem`      | Replace stem via generator                 |
| POST   | `/v1/projects/{id}/exports`                   | Build export (`kind`, `target_daw`)        |
| GET    | `/v1/jobs/{id}`                               | Job status                                 |
| GET    | `/v1/jobs/{id}/events`                        | SSE stream                                 |

Example create-separation request:
```http
POST /v1/projects/abc123/jobs/separate
{
  "mode": "4-stem",
  "backend": "htdemucs",
  "options": {"shifts": 1, "overlap": 0.25}
}
```
Example response:
```json
{ "job_id": "job_789", "status": "queued" }
```

Errors use RFC 7807 problem+json. All write endpoints are idempotent via `Idempotency-Key`.

---

## 7. Agentic workflow design

The agent is a thin planner over the API above. It must:

1. Parse intent → choose a tool chain.
2. Confirm rights status when the source looks third-party.
3. Choose stem mode and backend (favor defaults unless user constrains).
4. Submit jobs, watch progress, surface partial results.
5. Run musical analysis if intent needs it (e.g., "transpose down 2 semitones" requires key + tempo).
6. Build the requested export and explain limitations honestly.

Intent → plan examples:

| User says                                            | Agent plan                                                                 |
|------------------------------------------------------|----------------------------------------------------------------------------|
| "Extract vocals and drums."                          | analyze → separate(4-stem) → export ZIP of {vocals,drums}                  |
| "Karaoke version."                                   | analyze → separate(2-stem) → export instrumental WAV                       |
| "Put this in D minor and export for Ableton."        | analyze → separate(4-stem) → transpose(detected_key→Dm) → export Ableton   |
| "Bassline to MIDI."                                  | separate(4-stem) → transcribe(bass) → export MIDI                          |
| "10 stems + REAPER project."                         | separate(10-stem via audio-separator) → export REAPER `.rpp`               |
| "Down 2 semitones, same tempo."                      | transpose(-2 st) only (no time stretch)                                    |

Hard rules the agent must follow:
- Never claim "studio multitrack" quality; outputs are approximations.
- Surface bleed / null-test score whenever it is poor.
- Refuse rights-uncertain commercial export paths.

---

## 8. Model selection (decision summary)

| Slot                          | Pick                          | Reason                                                                 |
|-------------------------------|-------------------------------|------------------------------------------------------------------------|
| Default 4-stem                | HTDemucs (maintained fork)    | Best quality/speed tradeoff in OSS for vocals/drums/bass/other         |
| 6/10-stem + power user        | audio-separator + UVR models  | Widest model coverage; community-vetted weights                        |
| Fast / CPU fallback           | Spleeter or Open-Unmix        | Lightweight, well-known, deterministic                                 |
| Vocal isolation specialist    | UVR MDX-Net vocal models      | Strongest dedicated vocal results in OSS                               |
| Audio → MIDI (melodic)        | Basic Pitch                   | Practical, permissive license, low setup                               |
| BPM / beat / downbeats        | librosa + Essentia            | Combined coverage; cross-check confidence                              |
| Key detection                 | Essentia `KeyExtractor`       | Reliable, fast                                                         |
| Pitch / time                  | Rubber Band                   | Industry-grade quality                                                 |
| Commercial fallback           | AudioShake or LALAL.AI        | When OSS quality is insufficient and rights allow API send-out         |

Note: the original Meta Demucs repo is archived; we will pin to a maintained fork and container the inference environment.

---

## 9. Phased implementation plan

### Phase 1 — MVP (vertical slice)
- `ingest` (upload only), `decode`, `analyze` (BPM, key, LUFS).
- `separate` with HTDemucs, 4-stem only.
- `qc` with null-test + per-stem LUFS.
- `export` ZIP of aligned WAVs + `manifest.json`.
- Minimal web player: waveform, solo/mute, karaoke + acapella buttons.

Exit criteria: a user can upload an MP3 and download a working stem ZIP that imports cleanly into Ableton, Logic, and REAPER.

### Phase 2 — DAW-ready exports
- MIDI sidecars (tempo map first; per-stem MIDI gated on phase 3).
- REAPER `.rpp` emitter.
- DAW-targeted folder layouts (Ableton/Logic/GarageBand variants — just folder + readme differences).
- 2-stem and 6-stem modes via the same backend interface.

### Phase 3 — Music intelligence
- Downbeat + beat grid, chord estimation, vocal melody extraction.
- Basic Pitch for melodic stems; drum MIDI (e.g., onset+kit classifier) as research spike.
- Pitch/key transposition and tempo change with Rubber Band.

### Phase 4 — Agentic editing
- Natural-language plan executor over the existing API.
- Stem regeneration hook (delegates to the song-generation side of the OS).
- Section/arrangement edits driven by the beat grid.
- Revision-loop integration with the scorecard.

### Phase 5 — Production hardening
- GPU job queue, autoscaling worker pool, result caching by checksum+config.
- Batch jobs, user library, cloud storage backends, cost dashboards.
- Premium API fallback behind feature flag.

---

## 10. Risks and limitations

| Risk                                              | Mitigation                                                           |
|---------------------------------------------------|-----------------------------------------------------------------------|
| Artifacts and bleed between stems                 | QC scorecard exposed in UI; never claim "perfect"                     |
| Copyright on user uploads                         | Rights gate + ToS acceptance + watermarked logs                       |
| Demucs upstream archived                          | Pin to maintained fork; container the env                             |
| GPU cost spikes                                   | Per-checksum cache, queue with backpressure, CPU fallback model       |
| Long files (>15 min)                              | Stream chunks with overlap-add; cap MVP at 12 min                     |
| User expects studio multitracks                   | Agent must always disclose approximation                              |
| DAW format drift                                  | Stick to WAV + MIDI + REAPER; defer AAF/OMF                           |
| Model license drift                               | Track license per backend in `model_metadata`; gate commercial paths  |

---

## 11. Testing and evaluation

- **Objective:** SI-SDR and SDR against MUSDB18 test set per backend release; null-test RMS of sum-of-stems vs source on every job.
- **Subjective:** small internal listening panel with a fixed playlist (rap, pop, rock, EDM, acoustic, live, lo-fi MP3).
- **Alignment:** sample-accurate length + zero start offset asserted in CI.
- **Phase:** invert one stem against the source, expect predictable cancellation envelope.
- **DAW compat:** smoke test import in Ableton, Logic, REAPER on each release.
- **Latency:** per-minute-of-audio benchmark per backend and per GPU class.
- **Stress:** 12-min file, dense mix, mono source, 96 kHz source, low-bitrate MP3, live recording with crowd noise.

---

## 12. Final stack recommendation

- Language/runtime: Python 3.11 worker, FastAPI gateway, TypeScript/React web client.
- Audio: FFmpeg, soundfile, librosa, Essentia, pyloudnorm, Rubber Band.
- Separation: HTDemucs default, audio-separator for power modes, Spleeter/Open-Unmix CPU fallback.
- Transcription: Basic Pitch.
- Storage/DB: object storage (S3-compatible) + Postgres.
- Queue: Redis + RQ or Celery; GPU workers as a separate pool.
- Packaging: container per backend so model deps stay isolated.

---

## Build-this-first checklist (one screen)

1. Repo scaffolding: `apps/api`, `apps/worker`, `apps/web`, `packages/schemas`.
2. FFmpeg decode + canonical 48k/24-bit/stereo PCM.
3. HTDemucs container with a `separate()` function behind the `Separator` interface.
4. BPM + key via librosa/Essentia; LUFS via pyloudnorm.
5. Null-test QC; write `manifest.json`.
6. ZIP exporter: stems + manifest + README.
7. Minimal web player: waveform, solo/mute, karaoke + acapella buttons.
8. Job API: `POST /projects`, `POST /jobs/separate`, `GET /jobs/{id}`, SSE events.
9. Smoke-test import in Ableton, Logic, REAPER.
10. Wire the agent: intent → plan → API calls → human-readable summary with limitations.

---

## Out of scope for this plan
- Deep comparative research with links/benchmarks per model (separate doc).
- AAF/OMF export.
- Native Ableton `.als` or Logic `.logicx` session emission.
- VST/AU plugin distribution.
- Real-time (sub-second) separation.
