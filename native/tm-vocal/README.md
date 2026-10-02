# TM Vocal — native alpha 0.1.0

Real native C++ vocal effect for TM Music Studio. Targets: VST3 and standalone on macOS, Windows and Linux; Audio Unit on macOS. Mac build produces Intel + Apple Silicon universal bundles. No accounts, API keys, subscriptions, customer tiers or network calls in the plugin.

## Included

- Mono/stereo input and output, host automation and session state recall.
- Input gain → 65 Hz low cut / 180 Hz body / 3.2 kHz presence EQ → linked compressor (5 ms attack, 80 ms release) → band-detected broadband de-esser → tanh saturation → parallel room reverb and fractional delay → wet/dry and output gain.
- Neutral Start, Baritone Forward, Dry Southern Lead and Wide Hook starting presets. These are creative starting values, not measurements or guarantees of a finished mix.
- Simple/Advanced editor, per-module enable controls, input/output peak and compressor reduction readouts.
- User `.tmvocal` preset save/load with schema bounds; DAW project recall is separate.
- Delay divisions: quarter, eighth, dotted eighth, sixteenth. Host tempo if available; manual milliseconds fallback. Delay time is bounded to 30–1500 ms.
- Tracking mode suppresses reverb/delay output. Engine adds zero samples of latency; audio interface/DAW latency still applies. Smoothed gain/send/bypass/time controls; no allocation or network use in playback.

## Build

Install CMake 3.22+, Git and a C++17 compiler. macOS requires Xcode command-line tools; Windows requires Visual Studio 2022 Desktop C++. Linux dependencies are listed in the native workflow.

```sh
cmake -S native/tm-vocal -B native/build -DCMAKE_BUILD_TYPE=Release
cmake --build native/build --config Release --parallel 2
ctest --test-dir native/build -C Release --output-on-failure
```

For a Mac universal build add `'-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64' -DCMAKE_OSX_DEPLOYMENT_TARGET=11.0`. An existing JUCE checkout can be passed with `-DTM_JUCE_SOURCE=/absolute/path/to/JUCE`. Otherwise CMake fetches a SHA-256 verified archive of the pinned JUCE 8.0.12 commit. DSP tests can build offline with `-DTM_BUILD_PLUGIN=OFF`.

Output: `native/build/TMVocal_artefacts/Release/{VST3,AU,Standalone}`. The **Native TM Vocal** GitHub workflow packages platform-specific bundles as downloadable artifacts.

## Install after building

- Mac VST3: copy `TM Vocal.vst3` to `~/Library/Audio/Plug-Ins/VST3/`.
- Mac AU: copy `TM Vocal.component` to `~/Library/Audio/Plug-Ins/Components/`.
- Windows VST3: copy the full `TM Vocal.vst3` bundle to `C:\Program Files\Common Files\VST3\`.
- Linux VST3: copy the bundle to `~/.vst3/`.

Rescan plugins in Ableton, insert TM Vocal on a vocal audio track, begin with conservative input gain, choose a starting preset and compare with Bypass. Output can exceed 0 dBFS; this alpha does not include a limiter. The native workflow does not sign/notarize installers. Mac/Windows DAW scanning, automation, preset recall and audio acceptance testing remain required before calling this a production release. Do not disable system-wide security to install it.

## Scope

This first native release is TM Vocal. TM Tune, native MIDI Shredder, native Stem Director and assistant/DNA cloud synchronization are not implemented here. The web studio remains the project and assistant workspace. Presets reflect the documented vocal direction; the course itself has not been supplied to this build. The de-esser attenuates the full signal when its sibilance band triggers; it is not a split-band de-esser. Reverb is a compact four-comb room model, not convolution. There is no oversampling, pitch correction, automatic key detection, limiter, rack reordering or analysis-based auto mixing in this alpha.

## Dependency license

JUCE is a separately licensed dependency. Its current license is in the pinned JUCE checkout's LICENSE.md. This repository's license does not override JUCE's terms. Review the dependency license before distributing binaries. No JUCE source is vendored in this project.
