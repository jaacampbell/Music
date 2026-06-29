# Music

A tiny, self-contained music player built with **Vite + React + TypeScript**. It
ships no audio files — every "track" is composed programmatically and rendered in
the browser with the **Web Audio API**, complete with a live frequency
visualizer.

## Features

- Synth-powered playback (oscillators + envelopes) with play/pause, next/prev,
  seek, and volume.
- Four built-in generated tracks with distinct tempos and moods.
- Real-time frequency-bar visualizer driven by an `AnalyserNode`.
- Auto-advance to the next track when the current one ends.

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
```

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server (development mode) |
| `npm run build`   | Type-check (`tsc -b`) and build for prod     |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Lint the codebase with oxlint                |

## Project structure

- `src/tracks.ts` — track definitions and the procedural music composer.
- `src/synth.ts` — `SynthEngine`: a Web Audio scheduler (play/pause/seek/volume).
- `src/App.tsx` — player UI, playlist, and the canvas visualizer.
