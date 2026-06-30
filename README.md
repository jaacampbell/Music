# Music

This repository now includes a production blueprint for a **universal Agentic Beat Lab OS** (AI Producer + A&R + Mix Engineer loop), including:

- Song DNA and beat strategy decomposition
- Parallel generation and stem-first selection
- Audio analysis + A&R scoring loop
- Revision prompting and iterative quality improvement
- DAW/export-oriented output planning
- Parallel multi-agent implementation plan (including UI squad)
- Prompt caching and token-saver policy for lower inference cost

## Documents

- [`docs/agentic-beat-lab-os.md`](docs/agentic-beat-lab-os.md): Full operating model, agent council roles, master router prompt, command-center tabs, MVP stack, and governance rules.

### Stem Extraction + DAW Export (planning)

- [`docs/stem-extraction/PROPOSAL.md`](docs/stem-extraction/PROPOSAL.md): Technical proposal for the stem extraction + music editor export module.
- [`docs/stem-extraction/agent-prompt.md`](docs/stem-extraction/agent-prompt.md): Runtime prompt for the Stem Extraction Agent.
- [`docs/stem-extraction/build-checklist.md`](docs/stem-extraction/build-checklist.md): Phase 1 "build this first" checklist.

## Producer DNA Research OS (integrated + standalone)

The [`producer-dna/`](producer-dna/) directory vendors the **Producer DNA Research OS** — a Python research project (producer taxonomies, 3-layer musicological DNA, Batch 001 seed of 50 producers, ingestion adapters, scoring, and CLI) that feeds Song DNA. It is integrated here as a subproject **and** maintained as its own standalone repository. See [`producer-dna/README.md`](producer-dna/README.md).

## Built MVP (interface + APIs)

This repository now contains a runnable **Agentic Beat Lab OS command center** built with Next.js:

- 10-tab interface:
  - Song Brief
  - Song DNA
  - Prompt Pack
  - Generations
  - Stem Library
  - Beat Breakdown
  - Scorecards
  - Mix Notes
  - Revision Loop
  - Final Export
- API routes for:
  - project creation/listing
  - stem extraction jobs (2/4/6/10 modes)
  - music analysis jobs
  - export jobs (WAV ZIP, REAPER, Ableton-style, Logic-style)
  - natural-language agent loop execution (single or multitask batch)
  - prompt cache statistics
- Prompt caching + token saver policy implemented in code:
  - stable template keying
  - hash-based context blocks
  - revision-delta context
  - cache hit/token savings telemetry

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).