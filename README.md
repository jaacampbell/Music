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
- [`docs/producer-dna-research.md`](docs/producer-dna-research.md): Producer DNA Research base — three-layer schema, confidence system, Batch 001 seed, taxonomy, scoring rubric, and API reference.

## Built MVP (interface + APIs)

This repository now contains a runnable **Agentic Beat Lab OS command center** built with Next.js:

- 11-tab interface:
  - Song Brief
  - Song DNA
  - **Producer DNA Research** (Batch 001: 50 global foundation producers)
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
  - **producer DNA research** (search, capsules, three-layer profiles, taxonomy, batches)
- **Producer DNA Research base** (Batch 001 seeded with 50 producers):
  - Three-layer architecture: verified metadata, analytical DNA, creative direction
  - Research-confidence tiers (A through Unknown)
  - Searchable fields across facts and audible analysis
  - Metadata source architecture: MusicBrainz, Discogs, Wikidata, WhoSampled, FMA
  - Agent loop integration when commands reference a producer
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