# AGENTS.md

## Cursor Cloud specific instructions

This repository is **Music** — a single-page music player front end built with **Vite + React + TypeScript**. There is no backend; track audio is synthesized live in the browser with the Web Audio API (`src/audio/useAudioEngine.ts`), so the app runs fully offline with no external audio files or API keys.

### Commands (see `package.json` scripts)
- `npm run dev` — start the Vite dev server (default `http://localhost:5173`).
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — ESLint (flat config in `eslint.config.js`).

### Non-obvious notes
- ESLint is v10 with `eslint-plugin-react-hooks` v7. Use `reactHooks.configs.flat.recommended` (the legacy `recommended-latest` export still uses the array-of-strings `plugins` form that ESLint 10 rejects). The v7 hooks rules also forbid writing a ref's `.current` during render — sync refs inside `useEffect` instead.
- The `AudioContext` is created lazily on the first play interaction (browser autoplay policy), so audio only starts after a user gesture.
- Deployment targets Netlify (`netlify.toml`): build command `npm run build`, publish dir `dist`, with an SPA fallback redirect.
- The startup update script is guarded and installs from `package-lock.json` via `npm ci`; no extra setup is required.
