# Producer DNA Research base

A searchable research base that treats producers as **DNA profiles**, not a list
of famous names. The defining principle is to **separate verified facts from
audible / creative analysis**, then turn both into searchable fields.

It is integrated into the Agentic Beat Lab OS command center as the
**Producer DNA** tab and exposed through `/api/producers*` endpoints.

## Core architecture (three layers)

| Layer | Purpose | Where it lives |
| --- | --- | --- |
| Layer 1 — Verified Metadata | Facts only: producers, aliases, works, credits, sources, gear claims, collaborator/influence edges | `lib/producer-dna/types.ts` |
| Layer 2 — Analytical DNA | Human/AI musicological analysis: sonic, rhythmic, melodic/harmonic, arrangement, mixing, sampling DNA + style-nuance map | `lib/producer-dna/types.ts` |
| Layer 3 — Creative Direction | Original-music direction: inspired directions, creative iterations, originality warnings, fusion paths, prompt exports | `lib/producer-dna/types.ts` |

The compressed **capsule** (`ProducerDnaCapsule`) is the working unit for every
Batch 001 entry before it is expanded into a fully cited `ProducerProfile`.

## Research-confidence system

Every capsule carries two tiers so verified facts are never confused with
analysis:

- `factConfidence` — tier for verified metadata.
- `analysisConfidence` — tier for audible/musicological analysis (typically `D`).

| Tier | Meaning |
| --- | --- |
| A | Primary source / liner notes / official credits / interview / label / publisher / archive |
| B | Multiple credible secondary sources |
| C | Listed in open databases, not yet independently verified |
| D | Audible / musicological analysis |
| E | Educated hypothesis requiring review |
| Unknown | Not enough reliable information |

## Candidate source architecture

Open/catalogue sources recommended for verification (see `SOURCE_ARCHITECTURE`):

- **MusicBrainz** — relational, downloadable: artists, releases, recordings, works, labels, relationships, genres, instruments.
- **Discogs** — release-level credits and contributor roles, versions, track listings, labels.
- **Wikidata** — linked-entity relationships (producer credits); treat as a linked-data layer, not the final authority.
- **WhoSampled** — sample / remix / cover relationships.
- **Free Music Archive (FMA)** — reference for hierarchical genre taxonomy and audio features at scale.

## Master taxonomy

- **Era taxonomy** (`ERA_TAXONOMY`): pre-tape studio → AI-assisted production.
- **Genre / scene taxonomy** (`GENRE_TAXONOMY`).
- **Producer-role taxonomy** (`ROLE_TAXONOMY`): beatmaker, producer-auteur, engineer-producer, dj-producer, sampling-architect, etc.

## Scoring rubric

Each producer is scored 1–10 across 15 dimensions (`SCORE_DIMENSIONS`):
innovation, influence, technical craft, sonic identity, arrangement skill,
rhythm design, melodic/harmonic identity, sound design, mixing aesthetics,
cultural importance, commercial impact, underground impact, longevity,
adaptability, originality.

**This is not a popularity ranking.** A producer can be a 10 in underground
impact and a 3 in commercial impact.

## Batch 001

50 global foundation producers (1950s–2020s) across pop, hip-hop, electronic,
dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club
music. Seeded in `lib/producer-dna/seed.ts`.

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/producers` | List/search. Query params: `q`, `genre`, `era`, `role`, `region`, `batch`, `sort` (`id`/`name`/`overall`/`innovation`/`influence`/`originality`). |
| `GET /api/producers/:id` | Single capsule (e.g. `PDNA-000013`) with `overallScore`. |
| `GET /api/producers/taxonomy` | Facets, dimension leaders, confidence tiers, eras, roles, genres, score dimensions, source architecture, profile build order. |

## Operating rule (full-profile build order)

`metadata → source verification → key works → listening analysis → DNA summary
→ type-beat translation → originality warnings → iteration matrix → scoring →
open questions` (`PROFILE_BUILD_ORDER`).

## Next batches (toward 100,000 producers)

002 Hip-Hop Foundations · 003 Atlanta Trap trees · 004 Dub/Reggae/Dancehall ·
005 Electronic Foundations · 006 UK Bass Continuum · 007 Afrobeats/Amapiano ·
008 Latin/Caribbean · 009 Pop Architects/Vocal Producers · 010 Rock/Alt/Punk/
Metal/Indie · 011 Film/Game/Ambient/Experimental/Sound Design.
