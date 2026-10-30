# Cursor → CLI → native TM Vocal

This workflow builds the existing real native processor, tests it, packages it and can install/validate it on your own Mac. It does not require Netlify, RunPod or OpenAI credentials. Cursor should run on the computer where the plugin will be installed.

## Get the source

The native implementation and this workflow are on `feat/native-tm-vocal` in `jaacampbell/Music` (PR #51).

```sh
git clone --branch feat/native-tm-vocal https://github.com/jaacampbell/Music.git
cd Music
```

For an existing checkout, inspect `git status` first, preserve your changes, then fetch/switch to that branch. Do not reset your work. If PR #51 has subsequently been merged, use its native source on main instead.

## Prerequisites

- Python 3.9+, CMake 3.22+, Git and a C++17 toolchain.
- Mac: Xcode command-line tools (`xcode-select --install`) and CMake (`brew install cmake` if you use Homebrew). The build targets macOS 11+ and both Intel/Apple Silicon.
- Windows: Visual Studio 2022 with Desktop development with C++, CMake and Python; use its x64 Native Tools terminal.
- Ubuntu: `sudo apt-get install build-essential cmake pkg-config libasound2-dev libx11-dev libxext-dev libxinerama-dev libxrandr-dev libxcursor-dev libfreetype6-dev libfontconfig1-dev libgl1-mesa-dev`.

## Give it to Cursor

In Cursor's Agent chat, paste:

> Read .cursor/prompts/tm-native-cli.md and execute it on this machine. Build, test, package and install TM Vocal, fix concrete errors, and validate what can be verified from CLI. Keep my existing work. Report the Ableton acceptance steps that still require my session.

From Cursor's terminal agent:

```sh
agent "Read .cursor/prompts/tm-native-cli.md and execute the native TM Vocal workflow on this machine."
```

For non-interactive execution, after your Cursor CLI permissions and login are configured:

```sh
agent -p --output-format text "Read .cursor/prompts/tm-native-cli.md and execute the native TM Vocal workflow on this machine."
```

The CLI can also be run without Cursor:

```sh
python3 tools/native/tm_native.py all --install --validate
```

That is the Mac command. For Linux use `all --install`; for Windows use `python tools/native/tm_native.py all` and install the VST3 bundle with normal system-directory privileges. No blanket permissions or security-disable commands are included.

## Stages and evidence

| CLI command | Work |
| --- | --- |
| `doctor` | Check build tools and platform prerequisites |
| `build` | Configure pinned JUCE/CMake and compile Release wrappers |
| `test` | Run DSP and processor/preset regression tests |
| `package` | ZIP only actual plugin/app bundles, README and file-hash manifest |
| `install` | Back up existing user bundles and install Mac AU/VST3 or Linux VST3 |
| `validate` | Mac universal-slice checks + installed AU `auval`; optional pluginval VST3 validation |
| `all` | Doctor → build → tests → package, then explicitly requested install/validation |

All commands accept `--build-dir /absolute/path`; default `native/build-cli`. Use `--jobs 2` to limit CPU/memory, `--juce-source /path/to/JUCE` to reuse the pinned dependency, or `--pluginval /absolute/path/to/pluginval` for an available validator. `--dsp-only` supports offline engine tests with `all`; it creates no installable plugin.

Outputs: `native/dist/TM-Vocal-<platform>-0.1.0.zip` and `.zip.sha256`. Execution log and result report are in `native/build-cli/workflow.log` and `workflow-result.json`. A command failure stops the pipeline and records failure; an automated pass does not imply an Ableton listening pass.

Mac installs: `~/Library/Audio/Plug-Ins/VST3/TM Vocal.vst3` and `~/Library/Audio/Plug-Ins/Components/TM Vocal.component`. Existing versions go to `~/TM-Music-Studio/plugin-backups/<timestamp>/`. Linux installs to `~/.vst3/TM Vocal.vst3`. Close the DAW before replacing bundles. Standalone apps are packaged, not automatically installed.

## Ableton acceptance

Open Ableton's Plug-ins settings, enable the relevant VST3/AU source and rescan. Insert TM Vocal on a duplicate vocal track. Check mono/stereo playback, bypass, tracking, tempo delay, presets and automation. Save/reopen the Live Set and confirm recall. Compare the same take with output loudness matched manually. Record the result rather than treating a compile or auval pass as proof of sound quality. Keep the project marked alpha until those checks pass. Signing/notarization remains a separate release step using your own Apple identity.

## Next native engines

Once TM Vocal is accepted, new tasks can implement native MIDI processing, tuning/key detection, stem-worker integration and assistant/DNA preset synchronization. Each needs a real engine and its own acceptance checks. This workflow does not pretend those features already exist.

References: https://cursor.com/docs/cli/using and https://cursor.com/docs/cli/reference/parameters (verified October 2, 2026).
