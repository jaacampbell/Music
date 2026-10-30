# Music OS authenticated Instrument Cleanup (development)

## How it works
1. The user opens a song and runs Stem Director Core 6 (or Deep, which always includes Core 6).
2. Once the authenticated worker finishes, the existing Stem Director mixer reveals `Clean & Match`.
3. Optional reference audio and a provided MIDI file are uploaded to the *same authenticated worker job*.
4. Cleanup applies modest per-stem restoration, computes a shared reference EQ curve from the Core 6 MIX (rather than mis-matching each solo instrument to the entire reference mix), then applies uniform true-peak limiting.
5. The master is verified against the sum of the six 24-bit exported stems. Deep isolates are never summed, as they may overlap.
6. A signed, job-scoped link returns the master, stems, manifest, and Ableton ZIP. Original source and stems remain unchanged.

## Security and limitations
- Reuses existing worker token, ownership checks, signed download links and job TTL. No standalone unauthenticated cleanup worker should be deployed.
- The prior `cleanup_service.py` was a prototype and is **not** part of the worker entrypoint; do not expose its HTTP port.
- Reference audio upload max 100 MB; MIDI max 5 MB; decoded reference max 15 minutes.
- Cleanup is only offered when `/agent/health` advertises `cleanup.ready`.
- Input files and output manifests are kept inside the owning job directory.
- Supplied MIDI is passed through; extraction and audio pitch correction are not claimed.
- The cleanup job executes in the worker process. Deploy to GPU/CPU image and validate on real music before merging.
- Browser authentication and the full hosted cloud-job handoff require a live integration test.
- Supabase persistence of cleaned outputs and worker recovery for cleanup are not yet included.

## Build/validation
```bash
cd services/separator
python -m pip install numpy scipy soundfile pytest
python -m pytest -q cleanup_engine/test_pipeline.py
```

## Deployment
Review and merge only when the new worker image has been built and authenticated cleanup API smoke tests pass. Worker image contains `agent_cleanup.py` and `cleanup_engine/`; the frontend is safe to deploy earlier because it gates the action on worker health.
