# Producer DNA Research Base

A three-layer research system for producer identity — separating verified facts from audible analysis and creative direction. Designed to scale toward 100,000 producers with open-catalogue metadata sources.

## Architecture

### Layer 1 — Verified Metadata

Facts only. Every claim requires a source and confidence tier.

| Table | Purpose |
|-------|---------|
| `producers` | Core identity: name, aliases, region, scenes, links |
| `producer_aliases` | Alias, collective, label identity, time period |
| `works` | Tracks, albums, remixes, scores, placements |
| `credits` | Producer, co-producer, engineer, mixer, remixer, etc. |
| `sources` | URL, type, reliability tier, citation status |
| `gear_claims` | DAW, sampler, synth — confirmed/reported/inferred/unknown |
| `collaborator_edges` | Producer ↔ artist, engineer, label, scene |
| `influence_edges` | Influenced by, adjacent, often confused with |

### Layer 2 — Analytical DNA

Human/AI musicological analysis. Always Tier D or E unless corroborated.

| Table | Purpose |
|-------|---------|
| `producer_profiles` | Long-form Producer DNA Profile |
| `sonic_dna` | Atmosphere, warmth, grit, polish, space |
| `rhythmic_dna` | Swing, groove family, hat language, tempo ranges |
| `melodic_harmonic_dna` | Chord mood, modality, regional influences |
| `arrangement_dna` | Intro style, drops, loop evolution, tension/release |
| `mixing_dna` | Low end, stereo field, vocal placement, saturation |
| `sampling_dna` | Chopping style, source traditions, clearance |
| `style_nuance_map` | What casual listeners vs producers vs engineers hear |

### Layer 3 — Creative Direction

Where the database becomes useful for making original music.

| Table | Purpose |
|-------|---------|
| `inspired_directions` | Ethical type-beat translation without imitation |
| `creative_iterations` | 10+ original directions per producer |
| `originality_warnings` | Do-not-copy list: melodies, drums, tags, chains |
| `fusion_paths` | Combine Producer A logic with genre/region/emotion |
| `prompt_exports` | Clean prompts for beat-making, DAW sessions, coaching |

## Research Confidence Tiers

| Tier | Meaning |
|------|---------|
| A | Primary source: liner notes, official credits, interview, archive |
| B | Multiple credible secondary sources |
| C | Open databases (MusicBrainz, Discogs, Wikidata) — not independently verified |
| D | Audible/musicological analysis |
| E | Educated hypothesis requiring review |
| Unknown | Not enough reliable information |

## Metadata Sources

| Source | Role |
|--------|------|
| **MusicBrainz** | Relational catalogue: artists, releases, recordings, works, labels, relationships |
| **Discogs** | Release-level credits and contributor roles |
| **Wikidata** | Linked-entity producer credits (P162) — linked-data layer, not final authority |
| **WhoSampled** | Sample, remix, cover relationships |
| **FMA** | Hierarchical genre taxonomy and audio features reference |

## Master Taxonomy

- **Eras:** Pre-tape studio → AI-assisted production (11 eras)
- **Genres/scenes:** Hip-hop, trap, dub, amapiano, reggaeton, K-pop, film score, etc. (46 genres)
- **Producer roles:** Beatmaker, engineer-producer, sampling architect, vocal producer, etc. (16 roles)

## Scoring Rubric

Each producer scored 1–10 across 15 dimensions. Not a popularity ranking — a producer can score 10 in underground impact and 3 in commercial impact.

Innovation, influence, technical craft, sonic identity, arrangement skill, rhythm design, melodic/harmonic identity, sound design, mixing aesthetics, cultural importance, commercial impact, underground impact, longevity, adaptability, originality.

## Profile Generation Order

1. Metadata first
2. Source verification
3. Key works
4. Listening analysis
5. DNA summary
6. Type-beat translation
7. Originality warnings
8. Iteration matrix
9. Scoring
10. Open questions

## Batch 001 — Global Foundation (50 producers)

Seeded producers PDNA-000001 through PDNA-000050 spanning US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, and Caribbean scenes from the 1950s–2020s.

## Roadmap — Batches 002–011

| Batch | Focus |
|-------|-------|
| 002 | Hip-Hop Foundations (Bronx, Queens, LA, Houston, Detroit…) |
| 003 | Atlanta Trap / Modern Rap Production Trees |
| 004 | Dub, Reggae, Dancehall, Soundsystem |
| 005 | Electronic Foundations |
| 006 | UK Bass Continuum |
| 007 | Afrobeats, Amapiano, Highlife |
| 008 | Latin, Caribbean, Reggaeton, Funk Carioca |
| 009 | Pop Architects and Vocal Producers |
| 010 | Rock, Alternative, Punk, Metal, Indie |
| 011 | Film, Game, Ambient, Experimental |

Target: **100,000 producers** across all batches.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/producer-dna` | GET | List all producers + store stats |
| `/api/producer-dna/search` | GET | Search across layers (`query`, `layer`, `genre`, `region`, `batchId`) |
| `/api/producer-dna/batches` | GET | List batches + roadmap target |
| `/api/producer-dna/[producerId]` | GET | Full three-layer record |
| `/api/producer-dna/taxonomy` | GET | Eras, genres, roles, confidence tiers, sources, scoring dimensions |

## Code Layout

```
lib/producer-dna/
  types.ts          # All domain interfaces
  taxonomy.ts       # Era, genre, role taxonomies
  confidence.ts     # Research confidence system
  scoring.ts        # 15-dimension scoring rubric
  sources.ts        # MusicBrainz, Discogs, Wikidata, etc.
  store.ts          # In-memory store + search
  seed/
    batch-001.ts    # 50 seed producers with DNA capsules
    batches.ts      # Batch 001 + future batches 002–011
    build-records.ts # Seed → full ProducerDnaRecord
db/
  producer-dna-schema.sql  # Postgres migration ready
```

## Example DNA Capsule (J Dilla)

```
Producer ID: PDNA-000013
Name: J Dilla
Country/Region: United States / Detroit
Primary Genres: Hip-hop, neo-soul, underground rap
Signature Sound: Off-grid drum feel, warm sample loops, emotional imperfection
Type-Beat Direction: Warm sample-based beat with humanized swing — avoid exact timing/samples
Originality Twist: Dilla rhythm logic + New Orleans bounce or ambient pads
Research Confidence: Mixed — facts need citation; analysis is D-tier
```

## Batch 002 — Hip-Hop Foundations (30 producers)

Seeded producers PDNA-000051 through PDNA-000080 covering Bronx, Queens, Brooklyn, LA, Houston, Memphis, New Orleans, Bay Area, Chicago, and Atlanta foundations.

## Catalogue batching

Research runs at two levels:

1. **Catalogue batch** — all producers in Batch 001, 002, etc.
2. **Parallel agents** — concurrent producer pipelines within each batch

### Batch status

| Status | Meaning |
|--------|---------|
| planned | Batch defined, not yet seeded |
| seeded | Producers loaded with DNA capsules |
| researching | Agent pipeline in progress |
| researched | Full 10-step pipeline completed |

### API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/producer-dna/batches/run-next` | GET | Batch queue + progress |
| `/api/producer-dna/batches/run-next` | POST | Research next N catalogue batches |
| `/api/producer-dna/batches/[batchNumber]/run` | POST | Research one catalogue batch |

### Keep batching

```json
POST /api/producer-dna/batches/run-next
{ "count": 2, "concurrency": 5 }
```

Processes the next unresearched seeded batches in sequence (001, then 002, …).

## Next Steps

1. Expand each Batch 001 producer with MusicBrainz/Discogs/Wikidata citations (Tier A–C)
2. Add gear claims with source verification
3. Score each producer across 15 dimensions
4. Wire Producer DNA into agent loop prompt cache (Tier 1 facts, Tier 2 examples)
5. Migrate from in-memory store to Netlify Database using `db/producer-dna-schema.sql`

## Parallel Agentic Work

The system runs producer research pipelines in parallel while preserving per-producer step order.

### Agent squads

| Squad | Agents |
|-------|--------|
| Metadata | Metadata Agent, Key Works Agent |
| Source Verification | Source Verification Agent (MusicBrainz, Discogs, Wikidata) |
| Analytical | Listening Analysis Agent, DNA Summary Agent |
| Creative | Type-Beat Translation Agent, Iteration Matrix Agent |
| Copyright Safety | Originality Agent |
| Evaluation | Scoring Agent, Open Questions Agent |

### Parallelism model

- **Across producers:** up to N concurrent pipelines (default 5)
- **Within producer:** 10 steps run sequentially per operating rule
- **Beat lab multitask:** commands now execute in parallel via `runWithConcurrency`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/producer-dna/research/parallel` | POST | Run parallel research on producer IDs |
| `/api/producer-dna/research/parallel` | GET | List batches + stats |
| `/api/producer-dna/research/parallel?batchId=` | GET | Get specific batch |
| `/api/agent/parallel` | POST | Parallel beat-lab commands with concurrency |
| `/api/agent/batches/[batchId]` | GET | Get parallel batch status |

### Example

```json
POST /api/producer-dna/research/parallel
{
  "producerIds": ["PDNA-000013", "PDNA-000014", "PDNA-000015"],
  "concurrency": 3
}
```

Each producer runs: metadata → source verification → key works → listening analysis → DNA summary → type-beat translation → originality warnings → iteration matrix → scoring → open questions.
