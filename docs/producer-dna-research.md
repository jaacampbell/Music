# Producer DNA Research Base

A three-layer research database that separates **verified facts** from **audible/creative analysis**, then exposes both as searchable fields for the Agentic Beat Lab OS.

This is not a list of famous producers. It is a structured research system designed to scale toward 100,000 producer profiles.

---

## Metadata Source Architecture

| Source | Role | Entities |
|--------|------|----------|
| **MusicBrainz** | Primary catalogue | Artists, releases, recordings, works, labels, relationships, genres, instruments |
| **Discogs** | Release credits | Titles, track listings, credits, versions, labels |
| **Wikidata** | Linked-data layer | Producer credits, entity relationships (not final authority) |
| **WhoSampled** | Sample graph | Samples, remixes, covers, interpolations |
| **FMA** | Genre/audio taxonomy | Hierarchical genres, audio features at scale |

---

## Three-Layer Database Architecture

### Layer 1 — Verified Metadata (facts only)

| Table | Fields |
|-------|--------|
| `producers` | ID, name, real name, aliases, gender, country, city, region, active years, scenes, official links |
| `producer_aliases` | Alias, group, collective, production team, label identity, time period |
| `works` | Track, album, remix, score, placement, game/film/commercial work, year, artist, label, identifiers |
| `credits` | Producer, co-producer, executive producer, arranger, engineer, mixer, programmer, remixer, composer, beatmaker, sound designer, DJ, sampling role |
| `sources` | URL, type, date accessed, reliability tier, claim supported, quote/summary, citation status |
| `gear_claims` | DAW, sampler, synth, drum machine, plugin, console, studio, recording method (confirmed/reported/inferred/unknown) |
| `collaborator_edges` | Producer ↔ artist, producer, engineer, label, scene |
| `influence_edges` | Influenced by, influenced, adjacent, opposite-style, often confused with, cross-genre parallel |

### Layer 2 — Analytical DNA (musicological analysis)

| Table | Fields |
|-------|--------|
| `producer_profiles` | Long-form Producer DNA Profile |
| `sonic_dna` | Atmosphere, warmth, grit, polish, darkness, brightness, density, space, distortion, synthetic/organic balance |
| `rhythmic_dna` | Swing, grid precision, drum density, groove family, kick/snare, hi-hats, percussion, tempo ranges |
| `melodic_harmonic_dna` | Chord mood, modality, tonal center, influences, motifs, dissonance, unresolved tension |
| `arrangement_dna` | Intro style, drop/chorus, loop evolution, transitions, breakdowns, tension/release, moment design |
| `mixing_dna` | Low end, midrange, high-end, loudness, stereo field, vocal placement, reverb/delay, compression, saturation |
| `sampling_dna` | Source traditions, chopping, pitch shifting, filtering, looping, ethics, clearance |
| `style_nuance_map` | What casual listeners, producers, engineers, artists, DJs hear; what beginners misunderstand |

### Layer 3 — Creative Direction (for making original music)

| Table | Fields |
|-------|--------|
| `inspired_directions` | Ethical type-beat translation without imitation |
| `creative_iterations` | 10+ original directions per producer |
| `originality_warnings` | Do-not-copy list: melodies, drum patterns, vocal tags, chains, samples, arrangement habits |
| `fusion_paths` | Combine Producer A logic with Producer B, genre, region, or emotional target |
| `prompt_exports` | Clean prompts for beat-making, song direction, DAW sessions, stems, mix refs, artist coaching |

---

## Research-Confidence System

| Tier | Meaning |
|------|---------|
| **A** | Confirmed by primary source: liner notes, official credits, interview, label, publisher, archive |
| **B** | Confirmed by multiple credible secondary sources |
| **C** | Listed in open databases, not yet independently verified |
| **D** | Audible/musicological analysis |
| **E** | Educated hypothesis requiring review |
| **Unknown** | Not enough reliable information |

Producers are often miscredited — especially in older music, underground scenes, remixes, regional releases, and sample-based records. Every claim must be labeled.

---

## Master Taxonomy

See `GET /api/producer-dna/taxonomy` for the full lists of:

- **Era taxonomy** — pre-tape studio era through AI-assisted production era
- **Genre/scene taxonomy** — hip-hop through game score
- **Producer-role taxonomy** — beatmaker through production collective

---

## Producer DNA Scoring Rubric

Score each producer 1–10 across 15 dimensions:

Innovation, influence, technical craft, sonic identity, arrangement skill, rhythm design, melodic/harmonic identity, sound design, mixing aesthetics, cultural importance, commercial impact, underground impact, longevity, adaptability, originality.

**Not a popularity ranking.** A producer can score 10 in underground impact and 3 in commercial impact.

---

## Batch 001 — Global Foundation (50 producers)

| Field | Value |
|-------|-------|
| Batch | 001 |
| Focus | Global foundation across pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, regional club |
| Regions | US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, Caribbean, Canada |
| Era | 1950s–2020s |
| Count | 50 seed producers (PDNA-000001 through PDNA-000050) |

### Roadmap (Batches 002–011)

1. Hip-Hop Foundations
2. Atlanta Trap / Modern Rap Production Trees
3. Dub, Reggae, Dancehall, Soundsystem
4. Electronic Foundations
5. UK Bass Continuum
6. Afrobeats, Amapiano, Highlife, African Club
7. Latin, Caribbean, Reggaeton, Dembow, Funk Carioca
8. Pop Architects and Vocal Producers
9. Rock, Alternative, Punk, Metal, Indie Studio
10. Film, Game, Ambient, Experimental, Sound Design

---

## Profile Generation Order

Every full profile must be generated in this order:

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

This keeps the database useful for creative direction without shallow imitation or fake research.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/producer-dna` | GET | List all producers or search with query params |
| `/api/producer-dna/search` | POST | Advanced search with JSON body |
| `/api/producer-dna/[producerId]` | GET | Full three-layer record |
| `/api/producer-dna/batches` | GET | Current and roadmap batches |
| `/api/producer-dna/taxonomy` | GET | Eras, genres, roles, confidence tiers, scoring dimensions |

### Search parameters

- `query` — full-text across name, region, scene, genres, DNA fields
- `batchId` — filter by batch (e.g. `001`)
- `region` — filter by region or country
- `genre` — filter by primary genre
- `profileStatus` — `capsule`, `draft`, `reviewed`, `published`

---

## Code Layout

```
lib/producer-dna/
  types.ts           # Three-layer type contracts
  taxonomy.ts        # Era, genre, role taxonomies
  confidence.ts      # Research-confidence tiers
  scoring.ts         # 15-dimension scoring rubric
  metadata-sources.ts
  batches.ts         # Batch 001 + roadmap
  seed-entries.json  # Batch 001 seed data
  seed-batch-001.ts  # Record builder
  store.ts           # In-memory store (Postgres-ready)
  search.ts          # Searchable field logic
  agent-context.ts   # Agent loop integration
  index.ts           # Public exports

app/api/producer-dna/   # REST API
components/ProducerDnaResearchPanel.tsx  # UI tab
```

---

## Agent Loop Integration

When an agent command references a producer by name or ID (e.g. `PDNA-000013` or `J Dilla`), the prompt cache pulls:

- **Tier 2** — type-beat direction, originality twist, do-not-copy warnings
- **Tier 3** — signature sound summary, artistic DNA, scores

---

## Example Capsule (J Dilla — PDNA-000013)

```
Producer ID: PDNA-000013
Name: J Dilla
Country/Region: United States / Detroit
Primary Genres: Hip-hop, neo-soul, underground rap
Scene/Movement: Detroit beat scene, Soulquarians-adjacent production culture
Signature Sound Summary: Off-grid drum feel, warm sample loops, chopped soul/jazz fragments
Artistic DNA: The machine is breathing — slightly bent, intimate, warm, conversational
Research Confidence: Mixed — historical facts need citation; audible analysis is D-tier
```

---

## Migration Path

Current implementation uses an in-memory store matching the Beat Lab OS MVP pattern. Schema types are designed for Postgres (Netlify Database + Drizzle) migration:

- Layer 1 tables as relational rows with foreign keys
- Layer 2 DNA fields as normalized tables + JSONB for nuance maps
- Layer 3 creative direction as linked iteration/warning/fusion tables
- `searchableText` column + full-text index for cross-layer search
