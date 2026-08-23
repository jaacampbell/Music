# JO₵YN Music Workspace

A private browser music player for reviewing masters, demos, references, and work-in-progress audio. The interface uses the public display identity **JO₵YN** while keeping **JOCYN** in machine-friendly metadata and internal labels where needed.

The same player is mounted at `/player` in the root Music OS Next.js deployment. Signed-in users upload directly into the existing Music OS project/version graph and private Supabase storage. Signed-out users retain the device-only IndexedDB workflow.

## What works

- Upload a browser-supported audio file, including MP3, WAV, M4A, AAC, OGG, FLAC, AIFF, and audio WebM when the browser can decode it.
- Default to private cloud storage while signed in, with visible upload progress and a clear completion state.
- Create a new song project or add the upload as the next version of an existing project.
- Edit title, artist, version label, BPM, key, and artwork from the player.
- Load and play the signed-in user's private cloud versions from the same playback queue.
- Keep device-only audio inside the current browser with IndexedDB persistence.
- Reload the page without losing the local library.
- Play, pause, seek, skip, shuffle, repeat one, repeat all, mute, and control volume.
- Search the library and filter to cloud files, device files, or favorites.
- Drag and drop audio directly into the workspace.
- Remove an imported file only after confirmation.
- Use keyboard controls: Space for play/pause, Left/Right for a 10-second seek, and M for mute.
- Use lock-screen and hardware media controls in browsers that support the Media Session API.
- Start immediately with three generated synth demos when no real audio has been imported.

## Privacy and storage

The destination is explicit before saving. **Cloud Library** uploads use the signed-in Supabase access token, private Storage, and Row Level Security. **This device** stores the audio and optional artwork in IndexedDB and does not upload it. Clearing site data removes device-only files but does not remove cloud files.

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
- `src/cloud.ts` — authenticated RLS-backed project, version, artwork, upload-progress, and playback integration.
- `src/synth.ts` — unified real-audio and synth-demo playback engine.
- `src/tracks.ts` — track model, built-in demos, and visual accent system.
