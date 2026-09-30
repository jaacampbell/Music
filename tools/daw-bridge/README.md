# JO₵YN DAW Bridge 2.0

The hosted Music OS remains the primary production environment. This optional
macOS companion turns a completed Stem Director job into real Ableton Live
Arrangement tracks without Finder dragging or mouse automation.

## End-to-end flow

```text
Stem Director
  -> Send to Ableton
  -> .jocynhandoff
  -> JO₵YN DAW Bridge
  -> 05_Stems/Stem_Director_<JOB_ID>
  -> local Ableton import command
  -> JOcYNStemImporter Remote Script
  -> Live Arrangement tracks at 1.1.1
```

The importer:

- creates one Audio Track per stem;
- places each audio file at beat 0 in Arrangement View;
- names tracks by family and stem, such as `VOCALS — LEAD VOCALS`;
- orders tracks as Vocals, Drums, Bass, Guitar, Piano/Keys, Other;
- color-codes those families;
- writes a success/failure result under
  `~/.local/share/jocyn-daw-bridge/ableton_processed` or
  `ableton_failed`.

Ableton Live exposes audio-clip creation to Remote Scripts in current Live 12
builds. Automatic import requires Live 12.0.5 or newer.

## Group Track limitation

Current Live 12.1.x Python Remote Script APIs do not expose programmatic Group
Track creation. The importer therefore keeps family tracks contiguous and
color-coded and records the group intent in the import command. It does not
pretend grouping succeeded.

## Install

```bash
cd tools/daw-bridge
chmod +x install.sh
./install.sh
```

Then restart Ableton Live and select **JOcYNStemImporter** in:

`Live > Settings/Preferences > MIDI > Control Surface`

No MIDI input or output port is required.

## Project structure

```text
PROJECT/
├── 01_Ableton_Sets/
├── 05_Stems/
│   └── Stem_Director_<JOB_ID>/
│       ├── stems/...
│       ├── manifest.json
│       └── DAW_HANDOFF.json
└── 12_Archive/
    └── DAW_Handoffs/
```

## Diagnostics

Bridge logs:

```text
~/.local/share/jocyn-daw-bridge/bridge.log
~/.local/share/jocyn-daw-bridge/bridge.err.log
```

Ableton Remote Script errors appear in Ableton's `Log.txt`.
