# Music

An npm-workspaces monorepo containing two independent web apps:

| App | Path | Stack | Dev URL |
| --- | --- | --- | --- |
| **Agentic Beat Lab OS** | [`apps/beat-lab`](apps/beat-lab) | Next.js (App Router) + TypeScript | http://localhost:3000 |
| **Music player** | [`apps/player`](apps/player) | Vite + React + TypeScript | http://localhost:5173 |

## Getting started

Install all workspace dependencies from the repo root:

```bash
npm install
```

## Running

From the repo root:

```bash
# Agentic Beat Lab OS (Next.js)
npm run dev:beat-lab        # http://localhost:3000

# Music player (Vite)
npm run dev:player          # http://localhost:5173
```

Or target a workspace directly, e.g. `npm run dev -w beat-lab` / `npm run dev -w music-player`.

## Scripts (root)

| Command | Description |
| --- | --- |
| `npm run dev:beat-lab` / `npm run dev:player` | Start a dev server |
| `npm run build:beat-lab` / `npm run build:player` | Production build |
| `npm run lint:beat-lab` / `npm run lint:player` | Lint a workspace |

## The apps

- **`apps/beat-lab`** — AI music-production command center (Producer + A&R + Mix Engineer loop). 10-tab UI backed by Next.js API routes and an in-memory store. See its [README](apps/beat-lab/README.md) and [`apps/beat-lab/docs`](apps/beat-lab/docs).
- **`apps/player`** — a self-contained synth-powered music player; tracks are composed at runtime with the Web Audio API (no audio assets). See its [README](apps/player/README.md).
