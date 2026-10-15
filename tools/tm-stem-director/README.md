# TM Stem Director — local Core 6 bridge

This folder is a loopback companion for six-stem Demucs `htdemucs_6s` separation and, when SAM-Audio is installed, the same Deep 60+ named isolates used by Stem Studio. It writes real WAV files when the local worker succeeds. It does not change the installed Ableton `TM Stem Director.vst3`, and that plugin's source is not in this repository.

The bridge binds to `127.0.0.1` only. A token stops other local programs from casually enqueueing jobs, but this is not a multi-user security boundary: anything that can see the token and reach loopback can use the bridge.

No run in this workspace has separated *BAGGAGE CLAIM*, rebuilt the VST3, or signed it.

## What is local

- `separate_local.py` runs Demucs and refuses to publish a completed result whose six WAVs disagree in duration or sample rate.
- `bridge_server.py` queues jobs on disk, limits how many can run or wait, accepts cancel, and checks the WAV headers again after the worker exits. A worker that claims success with mismatched files is stored as `failed`.
- `console.html` is served at `http://127.0.0.1:8766/`. It fetches stem bytes with the bearer token, decodes them with `decodeAudioData`, and draws peaks from the decoded channel data. A decode failure leaves that channel empty.
- `submit_job.py` and `native/tm-stem-director` are background clients. They only dial `127.0.0.1`.

Jobs that are still `queued` or `processing` when the process starts again are marked `failed` with stage `interrupted`. Completed jobs stay on disk under the state directory.

## Mac setup for a real separation

Install Python 3.11 and FFmpeg, then from the repository root:

```bash
python3.11 -m venv .venv-tm
source .venv-tm/bin/activate
python -m pip install torch torchaudio demucs
python tools/tm-stem-director/bridge_server.py
```

The process prints a loopback console URL that includes the bearer token. The same token is stored in `~/.local/share/tm-stem-director/bridge.token` when it was not already provided by `TM_STEM_BRIDGE_TOKEN`. Keep that file private.

In another terminal:

```bash
source .venv-tm/bin/activate
python tools/tm-stem-director/submit_job.py "$HOME/Downloads/Baggage Claim.mp3" --wait --reveal
```

That command is the intended workflow. It has not been verified against that recording here. On success, files land in `~/Music/TM Music Studio/Stems/Baggage Claim/`: six numbered WAVs plus `stems.zip`. Import those WAVs onto separate Ableton audio tracks at bar 1 and turn Warp off initially. Do not also stack the full mix on top of every stem.

`start_local.command` launches the bridge with `.venv-tm`. macOS may require `chmod +x tools/tm-stem-director/start_local.command`.

## Background client

```bash
cmake -S native/tm-stem-director -B native/tm-stem-director/build
cmake --build native/tm-stem-director/build
ctest --test-dir native/tm-stem-director/build --output-on-failure
./native/tm-stem-director/build/tm_stem_client --token "$TM_STEM_BRIDGE_TOKEN" health
```

`BridgeClient` performs blocking socket I/O. A future plugin UI can call it from a background thread. It must not be called from the audio callback, and this CMake project does not install a VST3.

## Environment

| Variable | Role |
| --- | --- |
| `TM_STEM_BRIDGE_PORT` | Loopback port, default `8766` |
| `TM_STEM_BRIDGE_ROOT` | Export root, default `~/Music/TM Music Studio/Stems` |
| `TM_STEM_BRIDGE_STATE` | Job directory, default `~/.local/share/tm-stem-director` |
| `TM_STEM_BRIDGE_TOKEN` | Bearer token. When empty, the bridge reads or creates the token file |
| `TM_STEM_WORKER` | Worker command, default `separate_local.py` |
| `TM_STEM_BRIDGE_MAX_ACTIVE` | Simultaneous separations, at least 1, default 1 |
| `TM_STEM_BRIDGE_MAX_QUEUED` | Extra waiting jobs, default 3 |
| `TM_STEM_DEVICE` | `cpu`, `cuda`, or `mps` |

## Checks still required on your Mac

1. Run a short authorized recording through Demucs and confirm six playable WAVs share one duration and sample rate.
2. Import them into Ableton Live 11 Standard and listen, including *BAGGAGE CLAIM* when you choose to.
3. Locate the original `TM Stem Director.vst3` source before any rebuild, sign, or notarize step.

```bash
python -m py_compile tools/tm-stem-director/bridge_server.py tools/tm-stem-director/separate_local.py tools/tm-stem-director/submit_job.py
python -m unittest discover -s tools/tm-stem-director -t tools/tm-stem-director
```

The Python tests use a fake worker. They do not download Demucs weights and they do not claim a musical result.
