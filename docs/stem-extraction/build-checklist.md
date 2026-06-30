# Build This First — Practical Checklist

The 10-step MVP that gives us a Moises/LALAL/Suno-style stem workflow inside the
agentic OS. Each item should be a single small PR. The goal is end-to-end working
slices, not a polished feature.

> Scope: **Phase 1 only.** Anything DAW-session-specific (REAPER `.rpp`, Ableton
> folders, MIDI sidecars) belongs to Phase 2 and is intentionally excluded here.

## The 10 steps

- [ ] **1. Upload audio.** `POST /v1/projects` accepting WAV, MP3, FLAC, AIFF, M4A, MP4.
      Persist the original to object storage. Return a `project_id`.

- [ ] **2. Decode with FFmpeg.** Convert to canonical 48 kHz / 24-bit float WAV.
      Persist alongside the original. Capture duration, sample rate, channels, peak,
      true peak, and integrated LUFS. Write source SHA-256.

- [ ] **3. Run 4-stem extraction (HTDemucs `htdemucs_ft`).** Worker accepts
      `(canonical_wav_uri, project_id)` and writes 4 stems back to object storage.
      Containerize the model + weights; pin the release.

- [ ] **4. Save `vocals.wav` / `drums.wav` / `bass.wav` / `other.wav`.** 24-bit, same
      sample rate as canonical, same length, sample-aligned, two channels preserved.

- [ ] **5. Verify alignment.** Assert `len(stem) == len(source)` for each stem.
      Assert `sum(stems)` vs `source` RMS error < threshold. Fail the job loudly if
      either check fails — never silently ship misaligned stems.

- [ ] **6. Detect BPM and key.** librosa `beat_track` for BPM; Essentia `KeyExtractor`
      for key. Store both with confidence in the manifest.

- [ ] **7. Create `manifest.json`.** Subset of the schema in
      [`PROPOSAL.md` §5.1](./PROPOSAL.md#51-canonical-project-manifest): `project_id`,
      `source`, `analysis`, `separation`, and the four `stems` entries.

- [ ] **8. Export the aligned WAV ZIP.** `POST /v1/projects/{id}/exports` with
      `target: "universal_stem_pack_zip"`. Contents: `manifest.json`, `README.txt`,
      `stems/01_vocals.wav` … `stems/04_other.wav`, `reference/source.wav`.

- [ ] **9. Add a browser solo/mute player.** Minimal UI: 4 channel strips, each with
      solo, mute, gain. Plays all stems back in sync from object storage URLs.

- [ ] **10. Add karaoke and acapella buttons.** Convenience routes that re-mix from
       the existing stems (no separation re-run): karaoke = sum of all stems except
       vocals; acapella = vocals only. Both produce on-demand WAV exports.

## Definition of done for Phase 1

- End-to-end demo: upload a 3-minute MP3 → within the documented latency budget,
  receive a ZIP with 4 aligned WAV stems and a manifest, plus a working in-browser
  solo/mute player and karaoke/acapella buttons.
- Every stem passes the alignment assertions in step 5.
- A CI test runs the full pipeline on a fixture file on every PR.
- Honesty contract enforced in agent responses (model name, confidence, warnings).

## Explicitly out of scope for Phase 1

- REAPER `.rpp` generation → Phase 2.
- MIDI sidecars → Phase 2.
- Chord chart → Phase 3.
- 6/10-stem modes → Phase 3.
- Pitch shift, time stretch, transpose → Phase 3.
- Stem regeneration via Generator Agent → Phase 4.
- GPU queue, caching, batch processing, commercial API fallback → Phase 5.
