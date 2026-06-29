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

## Built MVP (interface + APIs)

This repository now contains a runnable **Agentic Beat Lab OS command center** built with Next.js:

- 11-tab interface:
  - Song Brief
  - Song DNA
  - Prompt Pack
  - Generations
  - Stem Library
  - Beat Breakdown
  - Scorecards
  - Producer DNA
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
- Producer DNA Research base:
  - verified metadata, analytical DNA, and creative direction layers
  - confidence tiers for facts, catalogue claims, audible analysis, and hypotheses
  - searchable Batch 001 seed producers and source architecture endpoint

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).