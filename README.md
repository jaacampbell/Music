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
  - Mix Notes
  - Revision Loop
  - Final Export
  - Producer DNA
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

## Producer DNA Research base

A three-layer research base that separates **verified facts** from **audible/creative
analysis** and turns both into searchable, confidence-labeled fields:

- **Layer 1 — Verified Metadata** (facts only), **Layer 2 — Analytical DNA**
  (sonic/rhythmic/melodic/arrangement/mixing/sampling), **Layer 3 — Creative Direction**
  (ethical type-beat translation, originality warnings, fusion paths, prompt exports).
- **Research-confidence tiers** (A–E + Unknown) label every claim.
- **Taxonomies** for era, genre/scene, and producer role, plus a 1–10 scoring rubric
  (which is explicitly not a popularity ranking) and the Batch 002–011 roadmap.
- **Batch 001** seeds 50 global foundation producers, with `J Dilla` fully expanded as the
  reference capsule.

Data and helpers live in [`lib/producer-dna.ts`](lib/producer-dna.ts); see
[`docs/producer-dna-research-base.md`](docs/producer-dna-research-base.md) for the full model.

APIs:

- `GET /api/producers` (filter by `query`, `era`, `genre`, `role`, `confidence`)
- `GET /api/producers/:id`
- `GET /api/producers/taxonomy`
- `POST /api/producers/:id/prompt-export` (optional `fusionWith`, `emotionalTarget`)

The **Producer DNA** tab provides search, filtering, capsule detail, and reference-safe prompt
exports.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).