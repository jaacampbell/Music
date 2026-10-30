# Use the local bridge beside Ableton Live 11

This is a companion on the same Mac. It does not modify, rebuild, sign, notarize, or replace the installed `TM Stem Director.vst3`. That plugin can still show its preview filterbank. Its native source was not in this repository (`native/tm-vocal` is a different plugin), so it was not relinked here.

## While Live is open

1. Install FFmpeg, Python 3.11, and the packages in `README.md`.
2. Start the bridge: `python tools/tm-stem-director/bridge_server.py`
3. Open the printed `http://127.0.0.1:8766/?access_token=...` URL, or run `python tools/tm-stem-director/submit_job.py "/absolute/path/to/song.mp3" --wait --reveal`
4. The console polls progress, can cancel, and previews stems only after Web Audio decodes each WAV.
5. Drag the six exported WAVs onto separate audio tracks at 1.1.1. Turn Warp off initially. Do not layer the original full mix on top of all six stems.

`start_local.command` is a convenience launcher for `.venv-tm`. It does not install a plugin.

## Background-thread contract

`native/tm-stem-director` is a C++17 client with no JUCE dependency and no installer. `BridgeClient` rejects every host except `127.0.0.1`. Its header says not to call it from the audio thread: the methods block on sockets.

A future UI inside the real Stem Director plugin can use that client from a background thread to submit a source path, poll status, cancel, and reveal. Doing that requires the original VST3 project, then a rebuild and whatever signing you choose. None of that was done in this change.

The native CLI:

```bash
cmake -S native/tm-stem-director -B native/tm-stem-director/build
cmake --build native/tm-stem-director/build
./native/tm-stem-director/build/tm_stem_client --token "$TM_STEM_BRIDGE_TOKEN" submit --audio "/absolute/path/to/song.wav" --wait
```

## What is still yours to confirm

- Demucs on your machine, including a listening pass of *BAGGAGE CLAIM* if that is the recording you want separated.
- Ableton import, alignment, and Warp settings.
- Any VST3 rebuild, code signature, or notarization.

This workspace did not perform those steps. The local bridge tests use a fake worker so they can check auth, restart, cancel, the concurrency limit, and WAV alignment even when the worker reports success.
