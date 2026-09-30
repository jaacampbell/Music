# JO₵YN DAW Bridge

Optional macOS companion for Music OS / Stem Director.

## What it does

When Stem Director creates a `.jocynhandoff` ticket, the bridge:

1. watches `~/Downloads`;
2. validates the handoff schema and HTTPS stem-pack URL;
3. downloads the organized stem ZIP;
4. safely extracts it under:
   `~/Music/JOcYN/Ableton Projects/<PROJECT>/05_Stems/Stem_Director_<JOB_ID>/`;
5. writes `DAW_HANDOFF.json` beside the imported stems;
6. archives the handoff ticket under `12_Archive/DAW_Handoffs/`;
7. opens the newest `.als` from `01_Ableton_Sets/`, or opens that folder when no Live Set exists.

The bridge does **not** use brittle GUI automation to create tracks inside an already-open Ableton Live Set. True one-click track creation should be implemented later with an Ableton Remote Script or Max for Live device.

## Install

From this directory:

```bash
chmod +x install.sh
./install.sh
```

After install, the bridge runs as a user LaunchAgent.

Manual foreground run:

```bash
~/.local/bin/jocyn-daw-bridge
```

## Project structure

The bridge intentionally reuses the existing JO₵YN song structure:

```text
PROJECT/
├── 01_Ableton_Sets/
├── 05_Stems/
│   └── Stem_Director_<JOB_ID>/
│       ├── ...
│       └── DAW_HANDOFF.json
└── 12_Archive/
    └── DAW_Handoffs/
```
