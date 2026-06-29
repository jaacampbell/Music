# Producer DNA Research Base

## Goal

Turn producer research into an operational database, not a flat list:

1. Separate **verified facts** from **audible/creative analysis**.
2. Keep both layers searchable with explicit field boundaries.
3. Add a creative direction layer for originality-safe music making.

## Source architecture (priority order)

1. **MusicBrainz**: canonical open catalogue graph for artists, releases, recordings, works, labels, and relationships.
2. **Discogs**: release-level credits, versions, contributor roles.
3. **Wikidata**: linked-entity enrichment layer (never sole authority for final claims).
4. **WhoSampled**: sample/remix/cover relationship hints.
5. **FMA**: genre hierarchy and large-scale taxonomy reference.

## Three-layer database model

### Layer 1: Verified metadata layer (facts only)

- `producers`
- `producer_aliases`
- `works`
- `credits`
- `sources`
- `gear_claims`
- `collaborator_edges`
- `influence_edges`

Claims in this layer are confidence-scored (`A/B/C/Unknown`) and tied to source records.

### Layer 2: Analytical DNA layer (musicological interpretation)

- `producer_profiles`
- `sonic_dna`
- `rhythmic_dna`
- `melodic_harmonic_dna`
- `arrangement_dna`
- `mixing_dna`
- `sampling_dna`
- `style_nuance_map`

This layer stores listening analysis and should default to `D` tier unless source-backed.

### Layer 3: Creative direction layer (original work support)

- `inspired_directions`
- `creative_iterations` (10+ per producer)
- `originality_warnings`
- `fusion_paths`
- `prompt_exports`

This layer is explicitly anti-imitation and focuses on ethical translation.

## Confidence system

| Tier | Meaning |
|---|---|
| A | Confirmed by primary source / official credits / direct archive |
| B | Confirmed by multiple credible secondary sources |
| C | Listed in open databases but not yet independently verified |
| D | Audible/musicological analysis |
| E | Educated hypothesis requiring review |
| Unknown | Not enough reliable information |

## Master taxonomy

### Era taxonomy

- pre-tape studio era
- tape/console era
- wall of sound era
- dub/soundsystem era
- disco/electronic studio era
- early hip-hop sampling era
- MIDI/sampler era
- DAW era
- internet beatmaker era
- streaming/social-platform era
- AI-assisted production era

### Genre + scene taxonomy

Includes hip-hop/trap/boom bap/G-funk/drill/grime/UK garage/dubstep/jungle/drum and bass/techno/house/footwork/ambient/IDM/synthpop/disco/funk/R&B/soul/gospel/rock/punk/metal/reggae/dub/dancehall/Afrobeats/amapiano/highlife/reggaeton/dembow/Latin pop/baile funk/cumbia/salsa/K-pop/J-pop/city pop/Bollywood + Indian film music/Arabic pop/experimental/noise/jazz/film score/game score.

### Producer-role taxonomy

Beatmaker, producer-auteur, studio producer, engineer-producer, DJ-producer, composer-producer, arranger, remixer, sound designer, executive producer, label architect, sampling architect, vocal producer, mix engineer as producer, band member as producer, production collective.

## Scoring rubric (1-10 each)

- innovation
- influence
- technical craft
- sonic identity
- arrangement skill
- rhythm design
- melodic/harmonic identity
- sound design
- mixing aesthetics
- cultural importance
- commercial impact
- underground impact
- longevity
- adaptability
- originality

Scoring is multidimensional, not popularity ranking.

## Batch 001 seed

Configured in code as:

- batch number: `001`
- producer count: `50`
- era focus: `1950s-2020s`
- region focus: US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, Caribbean, Canada

The seed set includes 50 foundation producers from George Martin (`PDNA-000001`) to DJ Rashad (`PDNA-000050`), each preloaded with:

- verified metadata scaffolding
- source placeholders
- DNA capsule
- searchable verified + analysis + creative fields
- originality-safe direction templates and iteration matrix

## Search API

### List and query records

`GET /api/research/producers`

Query params:

- `q`: free text
- `scope`: `all` | `verified` | `analysis` | `creative`
- `genres`: CSV
- `scenes`: CSV
- `roles`: CSV
- `eras`: CSV
- `regions`: CSV
- `tiers`: CSV (`A,B,C,D,E,Unknown`)
- `limit`: `1-100`

### Fetch a single record

`GET /api/research/producers/:producerId`

## Profile generation order (enforced)

`metadata first -> source verification -> key works -> listening analysis -> DNA summary -> type-beat translation -> originality warnings -> iteration matrix -> scoring -> open questions`
