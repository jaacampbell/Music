# Producer DNA Research Base

A first-class module of the Agentic Beat Lab OS. Built to be a true
**research base**, not a list of famous producers: every claim is separated
into verified facts, audible/creative analysis, and creative direction, then
turned into searchable fields.

## Architecture overview

The base is structured in three layers, each with its own table set in
`lib/producer-dna/types.ts` and persisted by the in-memory store in
`lib/producer-dna/store.ts`. Replace the store with a real DB (Postgres /
Netlify Database / Supabase) without changing the API contract.

### Layer 1 — Verified Metadata Layer (facts only)

| Table                | Purpose                                                                 |
|----------------------|-------------------------------------------------------------------------|
| `producers`          | Producer ID, name, real name, aliases, identity, region, eras, scenes.  |
| `producer_aliases`   | Aliases, groups, collectives, label identities, periods used.           |
| `works`              | Tracks, albums, remixes, scores, placements, soundtracks, commercials.  |
| `credits`            | Producer, co-producer, exec, arranger, engineer, mixer, programmer, remixer, composer, beatmaker, sound designer, DJ, sampling role. |
| `sources`            | Source URL, type, date accessed, reliability tier, claim, quote, citation. |
| `gear_claims`        | DAW, sampler, synth, drum machine, plugin, console, studio, recording method. Status: confirmed / reported / inferred / unknown. |
| `collaborator_edges` | Producer ↔ artist / producer / engineer / label / scene.                |
| `influence_edges`    | Influenced-by, influenced, adjacent, opposite-style, often-confused, cross-genre parallel. |

### Layer 2 — Analytical DNA Layer

Human / AI musicological analysis. Default confidence is `D` (audible)
unless elevated by primary sources.

| Table                 | Purpose                                                             |
|-----------------------|---------------------------------------------------------------------|
| `producer_profiles`   | Long-form Producer DNA profile.                                     |
| `sonic_dna`           | Atmosphere, warmth, grit, polish, density, distortion, etc.         |
| `rhythmic_dna`        | Swing, grid precision, groove family, kick/snare/hi-hat language.   |
| `melodic_harmonic_dna`| Chord mood, modality, motifs, dissonance, unresolved tension.       |
| `arrangement_dna`     | Intro style, drop/chorus behaviour, transitions, moment design.     |
| `mixing_dna`          | Low end, midrange, high end, loudness, vocal placement, FX chain.   |
| `sampling_dna`        | Source traditions, chopping style, sample ethics, clearance status. |
| `style_nuance_map`    | What casuals hear vs producers / engineers / artists / DJs hear.    |

### Layer 3 — Creative Direction Layer

Where DNA becomes useful for **making** original music.

| Table                 | Purpose                                                             |
|-----------------------|---------------------------------------------------------------------|
| `inspired_directions` | Ethical type-beat translation without imitation.                    |
| `creative_iterations` | 10+ original directions per producer.                               |
| `originality_warnings`| Do-not-copy list: melodies, drum patterns, vocal tags, samples.     |
| `fusion_paths`        | Combine Producer A with Producer B / a genre / a region / an emotion. |
| `prompt_exports`      | Clean prompts for beat-making, song direction, DAW sessions, etc.   |

## Research-confidence system

Every claim should be labelled.

| Tier | Meaning |
|------|---------|
| A    | Primary source: liner notes, official credits, interview, label, publisher, archive. |
| B    | Multiple credible secondary sources. |
| C    | Listed in open databases (MusicBrainz, Discogs, Wikidata, WhoSampled, FMA) but not yet independently verified. |
| D    | Audible / musicological analysis. |
| E    | Educated hypothesis requiring review. |
| Unknown | Not enough reliable information. |

Producers are often miscredited — especially in older music, underground
scenes, remixes, regional releases, and sample-based records — so the
research-confidence tier is part of every relevant row in the schema.

## Master taxonomy

The full enums live in `lib/producer-dna/taxonomy.ts` and are exposed via
`GET /api/producers/taxonomy`.

- **Eras**: pre-tape studio, tape/console, Wall of Sound, dub/soundsystem,
  disco/electronic studio, early hip-hop sampling, MIDI/sampler, DAW,
  internet beatmaker, streaming/social-platform, AI-assisted production.
- **Genres / scenes**: hip-hop, trap, boom bap, G-funk, drill, grime, UK
  garage, dubstep, jungle, drum and bass, techno, house, footwork, ambient,
  IDM, synthpop, disco, funk, R&B, soul, gospel, rock, punk, metal, reggae,
  dub, dancehall, Afrobeats, amapiano, highlife, reggaeton, dembow, Latin
  pop, baile funk, cumbia, salsa, K-pop, J-pop, city pop, Bollywood, Arabic
  pop, experimental, noise, jazz, film score, game score, …
- **Producer roles**: beatmaker, producer-auteur, studio producer,
  engineer-producer, DJ-producer, composer-producer, arranger, remixer,
  sound designer, executive producer, label architect, sampling architect,
  vocal producer, mix-engineer-as-producer, band-member-as-producer,
  production collective.

## Scoring rubric (1–10 per axis)

`innovation`, `influence`, `technicalCraft`, `sonicIdentity`,
`arrangementSkill`, `rhythmDesign`, `melodicHarmonicIdentity`,
`soundDesign`, `mixingAesthetics`, `culturalImportance`,
`commercialImpact`, `undergroundImpact`, `longevity`, `adaptability`,
`originality`.

The average is **not** a popularity ranking. A producer can be a 10 in
underground impact and a 3 in commercial impact — that's valuable signal.

## Recommended source priority

- **MusicBrainz** for artists, releases, recordings, works, labels,
  relationships, genres, instruments (relational, downloadable snapshots).
- **Discogs** for release-level credits and contributor roles.
- **Wikidata** for linked-entity relationships (producer property, etc.).
  Treat as a linked-data layer, not the final authority.
- **WhoSampled** for sample / remix / cover relationships.
- **FMA** as a reference for genre / audio taxonomy at scale.

## API surface (Next.js App Router)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/producers` | GET | List producers with filters: `q`, `era`, `genre`, `role`, `region`, `confidence`, `minScoreAxis`, `minScoreValue`. |
| `/api/producers` | POST | Create a new producer. |
| `/api/producers/[id]` | GET | Full `ProducerDnaRecord` (all 3 layers + relationships + score). |
| `/api/producers/[id]` | PATCH | Update producer metadata and/or analytical profile. |
| `/api/producers/[id]/credits` | GET/POST | Read or append a credit. |
| `/api/producers/[id]/sources` | GET/POST | Read or append a research source (tier, claim, citation status). |
| `/api/producers/[id]/gear` | GET/POST | Read or append a gear claim (confirmed/reported/inferred/unknown). |
| `/api/producers/[id]/score` | GET/PATCH | Read or update the 15-axis scoring rubric. |
| `/api/producers/[id]/creative` | GET/POST | Read or append Layer 3 artifacts (inspired directions, iterations, warnings, fusion paths, prompt exports). |
| `/api/producers/stats` | GET | Counts by confidence, top region, top genre, era, plus batch roadmap. |
| `/api/producers/taxonomy` | GET | All enums + roadmap (drives the UI selectors). |

## Operating rule

For each full Producer DNA Profile, generate in this exact order:

1. Metadata (Layer 1, with tier per claim)
2. Source verification
3. Key works
4. Listening analysis
5. DNA summary (Layer 2)
6. Type-beat translation (Layer 3 — `inspired_directions`)
7. Originality warnings
8. Iteration matrix (`creative_iterations`)
9. Scoring (`producer_score_card`)
10. Open questions (logged as low-tier source rows or notes)

This is the order enforced by the UI sub-tabs and by the `ProducerDnaRecord`
shape returned from the API.

## Seed data

Batch 001 — 50 global foundation producers — ships in
`lib/producer-dna/seed.ts`. Every entry preserves the user-provided ID,
region/scene, and Core DNA angle verbatim; genre/role/era arrays are first-
pass taxonomy normalisations. Each seeded producer starts at
`researchConfidence = "C"` and `analysisConfidence = "E"` because the
underlying claims have not yet been independently verified by a primary
source.

### Batch roadmap

| Batch | Theme |
|-------|-------|
| 002 | Hip-Hop Foundations (Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, NOLA, Bay Area, Chicago). |
| 003 | Atlanta Trap / Modern Rap Production Trees. |
| 004 | Dub, Reggae, Dancehall, Soundsystem Producers. |
| 005 | Electronic Foundations (Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM). |
| 006 | UK Bass Continuum (jungle, DnB, UK garage, grime, dubstep, future garage, UK funky, bassline). |
| 007 | Afrobeats, Amapiano, Highlife, African Club Music. |
| 008 | Latin, Caribbean, Reggaeton, Dembow, Funk Carioca. |
| 009 | Pop Architects and Vocal Producers. |
| 010 | Rock, Alternative, Punk, Metal, Indie Studio Producers. |
| 011 | Film, Game, Ambient, Experimental, Sound Design Producers. |
