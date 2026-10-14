# Connect BAGGAGE CLAIM to TM Stem Director on macOS

This is a **companion connection**, not an installed VST3 modification. The existing Stem Director plugin in Ableton still shows a preview filterbank until its native source is available and integrated.

## First-time setup
1. Install FFmpeg, Python 3.11, and the dependencies in README.md.
2. In Terminal from repository root: `source .venv-tm/bin/activate`.
3. Start the background processor in Terminal A:
   `python tools/tm-stem-director/bridge_server.py`
4. In Terminal B submit the audio:
   `python tools/tm-stem-director/submit_job.py "$HOME/Downloads/Baggage Claim.mp3" --wait`
5. Find stems at `~/Music/TM Music Studio/Stems/Baggage Claim/` and drag the six WAVs to separate Ableton audio tracks at 1.1.1. Disable Warp initially.

The `start_local.command` launcher is provided for convenience; macOS may require it to be made executable with `chmod +x tools/tm-stem-director/start_local.command`.

## Native VST3 next step
Locate the source for the installed `TM Stem Director.vst3` (possibly outside this repository). Add a background-thread HTTP client to submit the source path and poll job status; add a 'Reveal Stems' action after completion. Do not run subprocesses or HTTP requests from the audio callback.

## Limitations
- Not yet connected inside the plugin UI.
- Job status is in-memory, and processing is sequential only if invoked manually; the bridge does not currently enforce concurrency limits.
- This local API has no authentication. Keep it loopback-only.
- No separation or DAW acceptance test has been run on your Mac.
