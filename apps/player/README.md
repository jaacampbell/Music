# JO₵YN Music Workspace

A local-first browser music player for reviewing masters, demos, references, and work-in-progress audio. The interface uses the public display identity **JO₵YN** while keeping **JOCYN** in machine-friendly metadata and internal labels where needed.

The same player is mounted at `/player` in the root Music OS Next.js deployment. Use **Cloud Library** to move from immediate browser-local listening into the authenticated project dashboard and private Supabase storage.

## What works

- Import multiple browser-supported audio files, including MP3, WAV, M4A, AAC, OGG, FLAC, and audio WebM when the browser can decode them.
- Keep imported audio inside the current browser with IndexedDB persistence.
- Reload the page without losing the local library.
- Play, pause, seek, skip, shuffle, repeat one, repeat all, mute, and control volume.
- Search the library and filter to imported files or favorites.
- Drag and drop audio directly into the workspace.
- Remove an imported file only after confirmation.
- Use keyboard controls: Space for play/pause, Left/Right for a 10-second seek, and M for mute.
- Use lock-screen and hardware media controls in browsers that support the Media Session API.
- Start immediately with three generated synth demos when no real audio has been imported.

## Privacy and storage

Imported files are stored in this browser's IndexedDB. They are not uploaded to a remote server by this app. Clearing site data or using a different browser/device produces a separate library.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Validate

```bash
npm run build
npm run lint
```

## Source map

- `src/App.tsx` — workspace UI, transport, library state, import flow, filters, favorites, and media controls.
- `src/library.ts` — local IndexedDB audio persistence and browser metadata decoding.
- `src/synth.ts` — unified real-audio and synth-demo playback engine.
- `src/tracks.ts` — track model, built-in demos, and visual accent system.
