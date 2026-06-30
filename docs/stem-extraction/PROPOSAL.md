# Stem Extraction + Music Editor Export — Technical Proposal

> Status: **Planning draft, v0.1** — no code has been written yet. This document is the
> deliverable for the "plan first" stage and is meant to be reviewed and edited before
> Phase 1 implementation begins.
>
> Companion docs:
> - [`agent-prompt.md`](./agent-prompt.md) — the runtime prompt for the Stem Extraction Agent.
> - [`build-checklist.md`](./build-checklist.md) — the practical "build this first" checklist.

---

## 1. Executive summary

We are designing the **Stem Extraction + DAW Export** module of the Universal Agentic
Music Production OS. The module turns any input audio (uploaded file, URL, or internally
generated song) into clean, aligned, editable stems, enriches them with musical analysis
(BPM, key, beats, chords, MIDI), and packages them for use in any major DAW.

**Recommended architecture in one line:**

```
Input → FFmpeg Decode → Loudness/BPM/Key Analysis → Stem Separator (HTDemucs default,
audio-separator for power users, Spleeter for fast fallback) → Quality Scoring →
Edit Layer (solo/mute/transpose/time-stretch/regen) → MIDI + Tempo + Chord Sidecars
→ Aligned 24-bit WAV ZIP + JSON manifest + REAPER .rpp (first DAW session format)
```

**Why this fit is right for an agentic system:**

1. **Modular by stage.** Each pipeline stage (decode, analyze, separate, transcribe,
   export) is an independent service the agent can plan, retry, or substitute. That
   matches the agentic pattern of "one job, one input, one output" agents.
2. **Model-agnostic separator slot.** HTDemucs is the default, but the separator is a
   pluggable contract (`(audio_path, mode) → {stem_name: wav_path, metadata}`). We can
   swap in MDX-Net, UVR models, or a commercial API (AudioShake / LALAL.AI) without
   touching the rest of the pipeline.
3. **Universal export, specific session.** Aligned 24-bit WAV stems + a JSON manifest
   import cleanly into every DAW on earth. We add REAPER `.rpp` first because it is the
   only major session format that is text-based, well-documented, and round-trippable
   without proprietary SDKs. AAF/OMF and Ableton `.als` are explicitly deferred.
4. **Stateful and resumable.** A `project_id` keyed manifest is the single source of
   truth, which gives the agent memory between turns (scorecards, prior exports,
   rejected stems) — the same loop pattern used elsewhere in the OS.
5. **Honest about limits.** AI separation produces approximations, not original
   multitracks. The agent is required to surface artifact risk, bleed, and confidence
   scores in every response.

---

## 2. Competitive feature breakdown

| Capability | Moises | LALAL.AI | Suno stem workflow | AI remix tools (RipX, MusicFlow-style) | **This module (target)** |
|---|---|---|---|---|---|
| 2/4/5+ stem separation | Yes (up to 6) | Yes (up to 10) | Yes (2–stem-style export) | Yes | **Yes — 2 / 4 / 6 / 10 + specialist** |
| Vocal removal / karaoke | Yes | Yes | Yes | Yes | **Yes** |
| Drum sub-separation (kick/snare/hat) | Yes | Yes | No | Partial | **Yes (when model supports)** |
| BPM / key detection | Yes | Limited | No | Yes | **Yes (librosa + Essentia)** |
| Chord chart | Yes | No | No | Partial | **Yes (madmom / Chordino fallback)** |
| Pitch shift / tempo change | Yes | Limited | No | Yes | **Yes (Rubber Band)** |
| Audio → MIDI | Limited | No | No | Yes | **Yes (Basic Pitch + drum transcribers)** |
| Editing UI (solo/mute/mix) | Yes | No | Limited | Yes | **Yes** |
| DAW session export (.rpp / .als) | No | No | No | Partial | **Yes (REAPER .rpp first)** |
| Stem regeneration via generative AI | No | No | Yes (Suno-internal) | No | **Yes (calls internal generator agent)** |
| Agentic natural-language control | No | No | Partial | No | **Yes (primary UX)** |
| Project memory / scorecard / revision loop | No | No | No | No | **Yes (OS-native)** |
| Commercial API option | No | Yes | N/A | No | **Yes (LALAL.AI / AudioShake fallback)** |
| Self-hostable | No | No | No | Some | **Yes (default path)** |

**Must-haves (parity):** clean 4-stem separation, vocal/instrumental, BPM/key,
aligned WAV export, browser playback with solo/mute.

**Nice-to-haves (parity-plus):** 6/10-stem separation, chord chart, MIDI sidecars,
pitch/tempo edit, drum sub-separation.

**Differentiators (only we have):** agentic natural-language control, automatic
DAW session generation, regeneration of individual stems via the OS's generator agent,
project-level memory (scorecards, revision history, "avoid this" data), and
phase-aligned cross-version stem swapping (use V2 drums + V1 atmosphere etc.).

---

## 3. Recommended architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            INPUT LAYER                                   │
│  upload | generated_song_session | url_import (rights-gated)             │
└────────────────────────┬─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          PREPROCESSING                                   │
│  FFmpeg decode → 44.1k or 48k / 24-bit float WAV (mono+stereo preserved) │
│  loudness scan (ITU-R BS.1770 / EBU R128) → store integrated LUFS        │
│  duration, sample rate, channels, peak, true-peak, codec metadata        │
│  store original file + decoded canonical copy in object storage          │
└────────────────────────┬─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       STEM SEPARATION                                    │
│  router picks model from policy:                                         │
│    quality  → HTDemucs (htdemucs_ft) or MDX-Net via audio-separator      │
│    speed    → Spleeter 4-stem or Open-Unmix UMXL                         │
│    premium  → AudioShake / LALAL.AI API                                  │
│  modes: 2 / 4 / 6 / 10 / specialist (vocals-only, drums-only, bass-only) │
│  guarantees: identical length, sample-aligned, identical sample rate,    │
│               sum-of-stems ≈ source within tolerance                     │
│  emits per-stem confidence + spectral-quality score                      │
└────────────────────────┬─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      MUSICAL ANALYSIS                                    │
│  BPM + beat grid + downbeats        (librosa, madmom)                    │
│  key + mode                         (Essentia KeyExtractor)              │
│  chord estimation                   (Chordino / madmom)                  │
│  vocal melody (f0 + notes)          (Basic Pitch)                        │
│  melodic stem → MIDI                (Basic Pitch)                        │
│  drum stem → MIDI                   (ADTLib / OaF Drums, optional)       │
│  structural segmentation            (msaf, optional)                     │
└────────────────────────┬─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          EDIT LAYER                                      │
│  solo / mute / gain / pan / polarity                                     │
│  pitch shift + time stretch         (Rubber Band via pyrubberband)       │
│  key transpose (whole project)      (Rubber Band, formant-preserving)    │
│  stem replacement / regeneration    (delegates to Generator Agent)       │
│  bar/section arrangement edits      (uses beat grid + downbeats)         │
└────────────────────────┬─────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXPORT LAYER                                     │
│  aligned WAV / FLAC / AIFF stems (24-bit, project sample rate)           │
│  loudness-normalized AND raw variants                                    │
│  MIDI sidecars per melodic + drum stem                                   │
│  tempo_map.json, beats.json, chords.json, markers.json                   │
│  manifest.json (canonical project state)                                 │
│  ZIP "Universal Stem Pack" (any DAW)                                     │
│  REAPER .rpp generated session (first-class)                             │
│  Ableton/Logic friendly folder (named stems + README + tempo metadata)   │
│  AAF/OMF: feasibility-tracked, not in initial scope                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Input layer details

- **Accepted formats:** WAV, MP3, FLAC, AIFF, M4A, MP4, MOV, OGG, OPUS.
- **Video inputs:** FFmpeg strips the audio track; original video is kept for reference
  but not processed.
- **URL imports:** behind a `rights_acknowledged: true` flag from the agent or user.
  Implementation note: we do not bundle a YouTube downloader in the default build to
  avoid platform-of-record ToS issues — URL imports route through a separate, opt-in
  "Import" service that the agent must explicitly invoke and that logs the rights
  attestation.
- **Internal generated songs:** consumed directly as in-memory PCM, skipping decode.

### 3.2 Preprocessing details

- Canonical working format: **48 kHz, 24-bit float, preserved channel count**. We pick
  48 kHz to align with video DAWs (Pro Tools, Logic for picture) and resample to 44.1
  kHz only at export when requested.
- Loudness measured to **integrated LUFS (BS.1770-4)** and **true peak**, stored in the
  manifest. We never destructively normalize the source; normalization is an export-time
  variant.
- Original file is preserved byte-for-byte in object storage alongside the canonical
  decoded copy.

### 3.3 Stem separation details

- **Default model:** HTDemucs (`htdemucs_ft` for quality, `htdemucs` for speed) for the
  4-stem case (vocals / drums / bass / other). 6-stem variant adds guitar + piano.
- **10-stem and specialist modes:** route via [`audio-separator`](https://github.com/nomadkaraoke/python-audio-separator)
  which exposes UVR's MDX-Net, VR-Arch, Demucs, and MDXC ensembles. Specialist models
  (Kim Vocal, MDX23C, UVR-DeNoise, UVR-DeEcho-DeReverb) chain inside this slot.
- **Drum sub-separation** (kick/snare/hat/cymbals): two paths — (a) UVR's "drum kit
  separation" specialist models when available, (b) drum transcription to MIDI + sample
  reconstruction as a fallback. The chosen path is recorded in stem metadata.
- **Alignment contract:** every stem file has identical length and sample rate to the
  canonical decoded source. The pipeline asserts `len(stem) == len(source)` and
  `sum(stems) ≈ source` (RMS error < tunable threshold) before any export is allowed.
- **Quality metadata stored per stem:** model name, model version, SDR estimate (when
  computable), spectral-flatness score, silence ratio, and a heuristic "bleed score"
  comparing stem energy in frequency bands typical of other stems.

### 3.4 Musical analysis details

- **BPM + beats:** librosa for fast path, madmom for higher-accuracy and downbeat
  detection. We store both estimates and flag disagreement.
- **Key + mode:** Essentia `KeyExtractor` (Krumhansl / Temperley profiles); store
  confidence.
- **Chords:** Chordino (via Sonic Annotator) or madmom's `CNNChordFeatureProcessor`.
  Chord chart is best-effort and labeled as such.
- **Melody / audio-to-MIDI:** Basic Pitch (Spotify). Run on vocals, lead, bass,
  keys/guitar stems individually. Each `vocals.mid`, `bass.mid` etc. is stored as a
  sidecar.
- **Drum MIDI:** ADTLib or OaF Drums for kick/snare/hat events when sub-separation
  isn't available.

### 3.5 Edit layer details

- All edit operations are recorded as a **non-destructive edit list** on the project,
  rendered on export. Source stems are never overwritten.
- Pitch/time uses Rubber Band's R3 engine with formant preservation toggleable per
  stem.
- "Regenerate this stem" calls into the OS's generator agent with the surrounding
  context (BPM, key, chord chart, neighboring stems as references) and writes the
  result as a new stem version. Old versions are kept for the revision loop.

### 3.6 Export layer details

See section 4 for DAW-specific notes. Universal contract:

- Every stem in an export package starts at sample 0 of the source timeline.
- Every stem has the same sample rate, bit depth, and length.
- A `manifest.json` ships in every package.
- A `README.txt` ships in every package with per-DAW import instructions.

---

## 4. DAW interoperability plan

### 4.1 Universal strategy (works in every DAW)

A ZIP containing:

```
ProjectName_StemPack.zip
├── README.txt
├── manifest.json
├── tempo_map.json
├── chords.json
├── markers.json
├── stems/
│   ├── 01_vocals.wav
│   ├── 02_drums.wav
│   ├── 03_bass.wav
│   ├── 04_other.wav
│   └── ...
├── stems_normalized/   (optional: -14 LUFS variants)
├── midi/
│   ├── vocals.mid
│   ├── bass.mid
│   └── drums.mid
└── reference/
    ├── source.wav      (the canonical decoded source)
    └── instrumental.wav (sum of non-vocal stems)
```

All stems are **Broadcast WAV (BWF)** with embedded `bext` chunk (origination time =
00:00:00.000) and `iXML` chunk containing project metadata. Every modern DAW reads BWF
timestamps and will place stems at the correct timeline position when "Import at
original time" is enabled.

### 4.2 DAW-by-DAW notes

| DAW | Import method | Tempo/key carried? | Effort |
|---|---|---|---|
| **REAPER** | Open generated `.rpp` directly | Yes, native | Built in Phase 2 |
| **Ableton Live** | Drag stem folder into a track, or import `.aaf` (later) | Tempo via folder name suffix + README; user sets project BPM | Phase 2 (folder), Phase 5 (`.als` if feasible) |
| **Logic Pro** | File → Import → Audio File with "Import at original location" | Tempo via README; user sets project BPM | Phase 2 |
| **GarageBand** | Drag stems into separate tracks | No (manual BPM) | Phase 2 |
| **FL Studio** | Drag stems into playlist; use ASIO sample-aligned import | No (manual BPM) | Phase 2 |
| **Pro Tools** | File → Import → Audio with "Maintain time-stamps" | Yes via BWF `bext` | Phase 2 |
| **Cubase / Nuendo** | Pool → Import Audio | Yes via BWF `bext` | Phase 2 |
| **Studio One** | Drag into arrangement; Song Setup → Pickup tempo from file | Yes via BWF `bext` | Phase 2 |
| **BandLab / browser DAWs** | Upload stems sequentially | No | Phase 2 |

### 4.3 REAPER `.rpp` (first generated session format)

`.rpp` is plain text, easy to template, and well documented. Generating one gives the
user a one-click "Open in REAPER → everything is on the grid, named, color-coded, with
tempo set, key set, and markers placed." Implementation: a Jinja-style template that
takes the manifest and emits the project file. Validation: open in headless REAPER on
CI and check the project loads and the render matches `source.wav` within tolerance.

### 4.4 Ableton `.als`, AAF, OMF (deferred)

- **Ableton `.als`** is a gzipped XML with no public schema. Possible via
  reverse-engineered libraries but fragile; treat as Phase 5 spike, not commitment.
- **AAF/OMF** require Avid SDKs or `pyaaf2` (community). High complexity, narrow user
  base. Track as a feasibility study; do not promise on the roadmap.

---

## 5. Data model

### 5.1 Canonical project manifest

```json
{
  "schema_version": "1.0.0",
  "project_id": "proj_01J8R7...",
  "title": "Location Drop — V3 Hybrid",
  "created_at": "2026-06-29T08:00:00Z",
  "updated_at": "2026-06-29T08:14:21Z",
  "owner_id": "user_...",
  "source": {
    "original_file": "s3://.../original.mp4",
    "canonical_file": "s3://.../canonical.wav",
    "format": "wav",
    "codec": "pcm_f32le",
    "sample_rate": 48000,
    "bit_depth": 24,
    "channels": 2,
    "duration_seconds": 183.412,
    "loudness_lufs": -11.8,
    "true_peak_dbfs": -0.4,
    "sha256": "...",
    "rights": {
      "source_type": "user_upload",
      "rights_attestation": true,
      "license": null
    }
  },
  "analysis": {
    "bpm": { "value": 98.0, "confidence": 0.96, "method": "madmom" },
    "key": { "value": "A minor", "confidence": 0.81, "method": "essentia" },
    "downbeats_present": true,
    "structure": [
      { "label": "intro", "start": 0.0, "end": 8.32 },
      { "label": "verse",  "start": 8.32, "end": 40.10 }
    ]
  },
  "separation": {
    "mode": "4-stem",
    "model": "htdemucs_ft",
    "model_version": "4.0.0",
    "provider": "local",
    "runtime_seconds": 31.7,
    "device": "cuda:0"
  },
  "stems": [
    {
      "id": "stem_vocals",
      "name": "vocals",
      "role": "lead_vocals",
      "file": "stems/01_vocals.wav",
      "start_time_seconds": 0.0,
      "duration_seconds": 183.412,
      "sample_rate": 48000,
      "bit_depth": 24,
      "channels": 2,
      "loudness_lufs": -16.2,
      "true_peak_dbfs": -1.1,
      "confidence": 0.91,
      "quality": {
        "sdr_estimate_db": null,
        "spectral_flatness": 0.18,
        "silence_ratio": 0.07,
        "bleed_score": 0.12
      },
      "midi_file": "midi/vocals.mid",
      "notes_summary": { "count": 412, "lowest_midi": 48, "highest_midi": 76 }
    }
  ],
  "tempo_map": [
    { "time_seconds": 0.0, "bpm": 98.0, "time_signature": [4, 4] }
  ],
  "beats": [
    { "time_seconds": 0.612, "beat": 1, "downbeat": true }
  ],
  "chords": [
    { "start": 0.0, "end": 1.224, "label": "Am" }
  ],
  "markers": [
    { "time_seconds": 8.32, "label": "verse 1" }
  ],
  "edits": [
    {
      "id": "edit_01",
      "type": "transpose",
      "params": { "semitones": -2, "preserve_formants": true },
      "applied_to": "project",
      "created_at": "2026-06-29T08:12:00Z"
    }
  ],
  "exports": [
    {
      "id": "exp_01",
      "format": "universal_stem_pack_zip",
      "created_at": "2026-06-29T08:14:21Z",
      "uri": "s3://.../exports/exp_01.zip",
      "options": { "normalize_lufs": -14, "include_midi": true }
    }
  ],
  "agent_state": {
    "last_intent": "Extract vocals and drums and export for Ableton.",
    "last_score": { "stem_quality": 0.88, "user_alignment": 0.95 },
    "revision_count": 2,
    "linked_song_dna_id": "dna_..."
  }
}
```

### 5.2 Notes on the schema

- **Schema versioning:** every manifest carries `schema_version`. Migrations are owned
  by the export service.
- **Identifiers:** ULIDs (`proj_`, `stem_`, `exp_`, `edit_`) — sortable, URL-safe.
- **Edits are non-destructive and ordered.** The render service replays them.
- **`rights` block is mandatory.** Any export refuses to run if `rights_attestation`
  is false on a non-user-generated source.
- **Storage layout:** flat `s3://bucket/{project_id}/...` so a project is one prefix.

---

## 6. API design

REST first (operationally simpler; jobs are long-running and benefit from clear HTTP
semantics). All long-running operations are async with a `job_id` and a status
endpoint. WebSocket / SSE optional for progress streaming.

### 6.1 Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/projects` | Create a project from upload, URL, or generated-song reference |
| `GET` | `/v1/projects/{id}` | Fetch manifest |
| `POST` | `/v1/projects/{id}/analyze` | Run/refresh musical analysis |
| `POST` | `/v1/projects/{id}/separate` | Start stem separation job |
| `GET` | `/v1/jobs/{job_id}` | Job status + progress |
| `GET` | `/v1/projects/{id}/stems` | List stems |
| `GET` | `/v1/projects/{id}/stems/{stem_id}` | Download or stream a stem |
| `POST` | `/v1/projects/{id}/transcribe` | Run audio-to-MIDI on selected stems |
| `POST` | `/v1/projects/{id}/edits` | Append a non-destructive edit |
| `POST` | `/v1/projects/{id}/transpose` | Convenience: append a transpose edit |
| `POST` | `/v1/projects/{id}/tempo` | Convenience: append a tempo change edit |
| `POST` | `/v1/projects/{id}/stems/{stem_id}/regenerate` | Delegate to generator agent |
| `POST` | `/v1/projects/{id}/exports` | Create an export (format, DAW target, options) |
| `GET` | `/v1/projects/{id}/exports/{export_id}` | Download export |
| `POST` | `/v1/projects/{id}/snapshots` | Save named project state |

### 6.2 Example: create + separate

`POST /v1/projects`

```json
{
  "source": { "type": "upload", "upload_id": "up_..." },
  "title": "Location Drop — V3",
  "rights_attestation": true
}
```

→ `201 Created`

```json
{ "project_id": "proj_01J8R7...", "manifest_url": "/v1/projects/proj_01J8R7..." }
```

`POST /v1/projects/proj_01J8R7.../separate`

```json
{
  "mode": "4-stem",
  "model_preference": "quality",
  "include_drum_submix": false
}
```

→ `202 Accepted`

```json
{ "job_id": "job_01J8R7...", "status_url": "/v1/jobs/job_01J8R7..." }
```

`GET /v1/jobs/job_01J8R7...`

```json
{
  "job_id": "job_01J8R7...",
  "type": "separation",
  "status": "running",
  "progress": 0.42,
  "model": "htdemucs_ft",
  "eta_seconds": 18
}
```

### 6.3 Example: export for Ableton

`POST /v1/projects/proj_01J8R7.../exports`

```json
{
  "target": "ableton_folder",
  "options": {
    "sample_rate": 44100,
    "bit_depth": 24,
    "normalize_lufs": -14,
    "include_midi": true,
    "include_instrumental": true,
    "include_acapella": true
  }
}
```

→ `202 Accepted` then `GET /v1/projects/.../exports/exp_01` returns a presigned ZIP URL
on completion.

### 6.4 Example: natural-language transpose

`POST /v1/projects/proj_.../transpose`

```json
{ "semitones": -2, "preserve_formants": true, "scope": "project" }
```

→ `200 OK` with the appended edit. Render happens at next export.

### 6.5 Errors

Standard problem+json:

```json
{
  "type": "https://errors.example.com/separation-failed",
  "title": "Separation failed",
  "status": 422,
  "detail": "Source duration 24m37s exceeds 20m limit for free tier",
  "instance": "/v1/jobs/job_..."
}
```

---

## 7. Agentic workflow design

The Stem Extraction Agent is one of the OS's specialist agents. Its loop:

1. **Interpret intent.** Map the user message to a known operation set (separate,
   transcribe, transpose, export, regenerate, karaoke, acapella). Disambiguate by
   asking only when truly necessary.
2. **Confirm source + rights.** If the source is an upload or generated song, proceed.
   If it's a URL, require explicit rights attestation.
3. **Choose stem mode.** 2-stem for karaoke/acapella, 4-stem for general remix,
   6-stem for arrangement work, 10-stem for deep editing. Default to 4-stem.
4. **Choose model.** Use the policy table in §8.5 — quality default unless user asked
   for speed.
5. **Run separation** via the API.
6. **Analyze** BPM, key, beats, chords (always; cheap and useful as context).
7. **Recommend edits** based on intent (e.g. "you asked for karaoke → suggest -3 dB
   reverb tail on instrumental").
8. **Export** in the requested DAW format, or default to Universal Stem Pack + REAPER
   `.rpp`.
9. **Explain limitations** in the response: which stems are high vs low confidence,
   where bleed is likely, what the model can't do.
10. **Save state.** Update manifest, append to project scorecard, push to RAG memory
    so the next turn can reference this project.

### 7.1 Command mapping

| User says | Agent does |
|---|---|
| "Extract vocals and drums from this song." | `separate(mode=4-stem)` → return vocals + drums as primary, others as bonus |
| "Put this in D minor and export for Ableton." | `analyze` → compute interval from detected key to Dm → `transpose` → `export(target=ableton_folder)` |
| "Remove the vocals and give me a karaoke version." | `separate(mode=2-stem)` → export `instrumental.wav` + optional `acapella.wav` |
| "Turn the bassline into MIDI." | `separate(mode=4-stem)` → `transcribe(stem=bass)` → return `bass.mid` |
| "Separate into 10 stems and create a REAPER project." | `separate(mode=10-stem)` → `export(target=reaper_rpp)` |
| "Transpose down 2 semitones without changing tempo." | `transpose(semitones=-2)` — Rubber Band already decouples pitch and time |
| "Replace the drums with a harder trap pattern." | `regenerate(stem=drums, prompt=…)` delegated to Generator Agent |

### 7.2 Honesty contract

The agent's response template must include:

- Which stems were extracted, with confidence and bleed scores.
- Any warnings (long file truncation, model fallback used, low source quality).
- A "what this isn't" line for high-stakes operations ("This is an AI approximation —
  the vocals will not be perfectly studio-clean").

---

## 8. Model selection recommendation

### 8.1 Best open-source default

**HTDemucs (`htdemucs_ft`, fine-tuned)** — strong 4-stem quality, well-validated,
runs on CPU and GPU. Caveat: the original Meta repo is archived; we pin a known-good
release and containerize, or track an actively maintained fork. Use as the day-one
default.

### 8.2 Best high-quality offline

**audio-separator** with an **MDX23C** or **UVR-MDXNet Inst HQ** ensemble for vocals,
plus HTDemucs for the rest. Higher VRAM and longer inference time but noticeably
cleaner vocals on dense mixes.

### 8.3 Best fast model

**Spleeter 4-stem (11 kHz model)** for sub-real-time CPU separation when latency
matters more than quality (e.g. live preview).

### 8.4 Best CPU-friendly fallback

**Open-Unmix (UMXL)** — small, simple, reasonably good 4-stem on CPU. Useful for
edge/local deployments without a GPU.

### 8.5 Best vocal isolation

**UVR Kim Vocal / MDX23C vocal models** via audio-separator. These are the de-facto
choice in the karaoke/cover community and produce the cleanest vocal stems on
modern, loudness-war-era masters.

### 8.6 Best commercial/API fallback

**AudioShake** (commercial-friendly licensing, high quality) as primary commercial.
**LALAL.AI** as secondary (well-known, supports up to 10 stems, but per-minute pricing
needs cost modeling). Used when the local GPU queue is saturated or when a user
explicitly asks for the highest possible quality and accepts the cost.

### 8.7 Model selection policy (one table)

| Preference | Stem mode | Choice |
|---|---|---|
| `quality` | 2/4 | HTDemucs `htdemucs_ft` |
| `quality` | 6/10 | audio-separator: HTDemucs + UVR vocal + Demucs guitar/piano specialists |
| `speed`   | 4 | Spleeter |
| `cpu_only` | 4 | Open-Unmix UMXL |
| `premium_api` | any | AudioShake (LALAL.AI fallback) |
| `vocals_only` | 2 | UVR Kim Vocal via audio-separator |

---

## 9. Implementation plan

### Phase 1 — MVP (separation + universal pack)

- FFmpeg decode service.
- HTDemucs separation worker (4-stem only).
- Basic BPM + key analysis (librosa).
- Aligned 24-bit WAV stems.
- Universal Stem Pack ZIP export.
- Manifest v1.0.0.
- Minimal API: create project, separate, fetch stems, export.
- Minimal UI: upload, progress, per-stem download, solo/mute player.

**Exit criteria:** end-to-end "upload a 3-minute MP3, get a ZIP of 4 aligned WAV stems
with a manifest" within a documented latency budget.

### Phase 2 — DAW-ready export

- Broadcast WAV with `bext` + `iXML` chunks.
- REAPER `.rpp` generator (templated) + headless REAPER CI test.
- Ableton / Logic / GarageBand named-folder exports with READMEs.
- MIDI sidecars via Basic Pitch (vocals, bass, melodic stems).
- Tempo map + chord chart JSON sidecars.
- madmom downbeat detection added to analysis.

**Exit criteria:** generated `.rpp` opens in REAPER, all stems on grid, render bounces
to a file matching the source within RMS tolerance.

### Phase 3 — Advanced music intelligence

- Beat grid + downbeats (madmom) surfaced in UI.
- Chord estimation (Chordino / madmom).
- Vocal melody extraction (Basic Pitch tuned for vocals).
- Drum transcription to MIDI (ADTLib / OaF Drums).
- Pitch / key transpose with Rubber Band (project-wide + per-stem).
- Time stretching with Rubber Band.
- 6-stem and 10-stem modes via audio-separator.

### Phase 4 — Agentic editing

- Natural-language stem editing pipeline (the agent prompt in `agent-prompt.md`).
- Stem regeneration delegating to the Generator Agent.
- Cross-version stem swapping (V2 drums + V1 atmosphere) using shared tempo grid.
- Section-based arrangement edits.
- Remix-suggestion agent that scores stems and proposes combinations.

### Phase 5 — Production optimization

- GPU queue with per-tenant fairness.
- Stem and analysis caching keyed by source SHA-256 + model id.
- Batch / album-level processing.
- User library with searchable stems and projects.
- Cloud storage tiering (hot / cold).
- Cost optimization: prewarm pool, mixed-precision inference, model unloading.
- Commercial API fallback (AudioShake / LALAL.AI) wired in.
- Optional: Ableton `.als` spike, AAF/OMF feasibility decision.

---

## 10. Risks and limitations

| Risk | Mitigation |
|---|---|
| **AI separation artifacts** (musical noise, swimmy reverb, "underwater" vocals) | Surface bleed/confidence scores; offer model swap; never market output as "studio multitrack" |
| **Stem bleed** between vocals and drums on dense mixes | Provide UVR vocal-specialist re-pass option; expose bleed score |
| **Copyright on user-uploaded material** | Mandatory `rights_attestation` for non-uploaded sources; logging; no built-in URL ripping |
| **Model licensing** (Demucs MIT, Spleeter MIT, UVR mixed, some MDX checkpoints non-commercial) | Maintain a license matrix per model; gate commercial features by license; never ship a non-commercial checkpoint as the default |
| **Demucs repo archived** | Pin a release; mirror weights; track maintained forks |
| **GPU cost** | Cache by source hash; offer fast/CPU path; rate-limit free tier; route long jobs to spot GPUs |
| **Long-file handling** (>20 min) | Chunked separation with overlap-add; document length limits per tier |
| **User expectations** ("make it sound like the studio version") | Honesty contract in agent responses; show before/after spectrograms |
| **DAW format drift** (`.als`, `.aaf`) | Treat as opt-in / experimental; keep universal pack as primary |
| **Commercial deployment** (cloud GPU markup, API costs) | Cost model in Phase 5; per-tenant quotas; choose providers with transparent pricing |
| **Variable input quality** (low-bitrate MP3, mono, live recording) | Pre-flight quality check; warn user before processing; consider denoise pre-pass |

---

## 11. Testing and evaluation

### 11.1 Objective metrics

- **Stem alignment:** assert `len(stem) == len(source)` and sample-accurate start.
- **Sum-of-stems fidelity:** `sum(stems)` vs `source` RMS error below threshold per
  model. Logged per job; alerts on regression.
- **SDR** (Signal-to-Distortion Ratio) on the MUSDB18 test set per separator model
  per release. Tracked in CI to catch model-update regressions.
- **Loudness accuracy:** measured LUFS within ±0.5 LU of target on normalized exports.
- **Phase cancellation check:** mixing `vocals.wav` with phase-inverted `instrumental.wav`
  on a 2-stem export should approximately null in the instrumental regions.

### 11.2 Subjective tests

- A blinded MOS-style listening test on a fixed corpus (modern pop, rap, rock, EDM,
  acoustic, live) — 5 raters, 1–5 scale per stem type. Run on every model change.

### 11.3 DAW compatibility tests

- For each target DAW: import the universal pack, verify all stems land on the grid,
  bounce, compare bounce to `source.wav` within RMS tolerance.
- REAPER test is headless and runs in CI; others are documented manual smoke tests
  with screenshots.

### 11.4 Performance / scale tests

- Latency benchmark per model per device per duration (1/3/5/10 minute inputs).
- Throughput benchmark on the GPU queue.
- Stress test: 100 concurrent jobs, measure p50/p95/p99 wait + run time.

### 11.5 Edge cases

- Live recordings with audience noise.
- Mono inputs (split-to-stereo handling).
- Low-bitrate MP3s (32 kbps).
- Very dense mixes (mastered loudness-war material).
- Very long files (45+ min DJ sets).
- Files with silence at start/end.
- Variable-tempo recordings (live performance, rubato).
- A-cappella / instrumental-only inputs (the "nothing to separate" case).

---

## 12. Final recommendation

**Build this stack:**

| Layer | Choice |
|---|---|
| Decode / convert | FFmpeg, soundfile, torchaudio |
| Analysis (BPM/beats) | librosa (fast path) + madmom (downbeats) |
| Analysis (key) | Essentia `KeyExtractor` |
| Analysis (chords) | Chordino or madmom |
| Audio-to-MIDI | Basic Pitch (Spotify) |
| Drum MIDI | ADTLib / OaF Drums |
| Pitch / time | Rubber Band via pyrubberband |
| Separator (default) | HTDemucs `htdemucs_ft` |
| Separator (power user) | audio-separator with UVR/MDX-Net/Demucs/MDXC ensembles |
| Separator (fast) | Spleeter |
| Separator (CPU) | Open-Unmix UMXL |
| Separator (premium) | AudioShake (primary), LALAL.AI (fallback) |
| Export — universal | Aligned 24-bit BWF WAV + JSON manifest + ZIP |
| Export — first DAW session | REAPER `.rpp` |
| Export — secondary | Ableton/Logic friendly named-folder pack |
| Export — deferred | Ableton `.als`, AAF/OMF |
| Service runtime | Python workers (FastAPI control plane), GPU queue, object storage |

**Build-this-first checklist** lives in [`build-checklist.md`](./build-checklist.md).

**Agent runtime prompt** lives in [`agent-prompt.md`](./agent-prompt.md).

---

## Appendix A — Reference list (to validate before implementation)

> These are the candidates to confirm at implementation time. License, maintenance,
> and checkpoint availability must be re-verified before any are pulled into the
> production image. Anything marked archived, non-commercial, or unmaintained is
> excluded from the default path.

- **Demucs / HTDemucs** — `facebookresearch/demucs` (note: repo archived; pin release
  or use maintained fork). MIT-licensed code.
- **audio-separator** — `nomadkaraoke/python-audio-separator`. Wraps UVR-style models.
- **Spleeter** — `deezer/spleeter`. MIT, low-maintenance but stable.
- **Open-Unmix** — `sigsep/open-unmix-pytorch`. MIT, MUSDB18-trained.
- **Basic Pitch** — `spotify/basic-pitch`. Apache-2.0.
- **librosa** — `librosa/librosa`. ISC.
- **Essentia** — `MTG/essentia`. AGPL — license-flag this if shipping closed-source;
  consider Essentia.js or per-extractor reimplementation in restricted contexts.
- **madmom** — `CPJKU/madmom`. BSD; relatively quiet maintenance, validate fork.
- **Rubber Band Library** + **pyrubberband** — GPL/commercial dual; commercial deploy
  requires a Rubber Band commercial license OR routing through a separate process.
- **FFmpeg** — LGPL/GPL depending on build; pick LGPL build for commercial linking.
- **pedalboard** — `spotify/pedalboard`. GPL-3.0 — flag for license review before use.
- **REAPER `.rpp`** — plain-text format, multiple community parsers/emitters exist;
  spec is reverse-engineered but stable.
- **AAF** — `pyaaf2` community library; complex.
- **MusicXML** — `music21` for generation; standardized but mostly notation-oriented.
- **AudioShake / LALAL.AI** — commercial APIs; revalidate pricing and ToS at
  contract time.
