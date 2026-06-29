# Producer DNA Research base

A research-grade database for producers — not a list of famous producers.
Separates verified facts from audible/creative analysis, then turns both into
searchable fields so the system is useful for original music direction
without sliding into shallow imitation or fake research.

## 1. Three-layer architecture

### Layer 1 — Verified Metadata (facts only)

| Entity              | Purpose                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `producers`         | ID, name, real name, aliases, country/city/region, active years, primary scenes, official links.                           |
| `producer_aliases`  | Alias, group, collective, production team, label identity, period.                                                         |
| `works`             | Track, album, remix, score, placement, game soundtrack, film cue, commercial; release year, artist, label, identifiers.    |
| `credits`           | Producer / co-producer / executive / arranger / engineer / mixer / programmer / remixer / composer / beatmaker / sampling. |
| `sources`           | URL, type, date accessed, reliability tier, claim supported, quote/summary, citation status.                               |
| `gear_claims`       | DAW, sampler, synth, drum machine, plugin, console, studio, recording method. Status: confirmed / reported / inferred / unknown. |
| `collaborator_edges`| Producer ↔ artist / producer / engineer / label / scene.                                                                   |
| `influence_edges`   | Influenced by / influenced / adjacent / opposite-style / often-confused-with / cross-genre parallel.                        |

### Layer 2 — Analytical DNA (musicological analysis)

`producer_profiles` long-form profile, plus `sonic_dna`, `rhythmic_dna`,
`melodic_harmonic_dna`, `arrangement_dna`, `mixing_dna`, `sampling_dna`, and
`style_nuance_map`. All Layer-2 records are tagged Tier D by default
(audible analysis) and may be promoted with citations.

### Layer 3 — Creative Direction (original-music guidance)

`inspired_directions` (ethical type-beat translation without imitation),
`creative_iterations` (10+ original directions per producer),
`originality_warnings` (do-not-copy list),
`fusion_paths` (combine producer logic with other producers / genres / regions),
and `prompt_exports` (clean prompts for beat-making, song direction, DAW
sessions, stem generation, mix references, artist coaching).

## 2. Research-confidence tiers

| Tier | Meaning |
| ---- | ------- |
| A    | Confirmed by primary source — liner notes, official credits, interview, label, publisher, or direct archive. |
| B    | Confirmed by multiple credible secondary sources. |
| C    | Listed in open databases (MusicBrainz, Discogs, Wikidata) but not independently verified. |
| D    | Audible / musicological analysis. |
| E    | Educated hypothesis requiring review. |
| Unknown | Not enough reliable information. |

Every claim and record carries a confidence tier. Producers are often
miscredited — especially in older music, underground scenes, remixes,
regional releases, and sample-based records — so the tier is treated as a
first-class field.

## 3. Master taxonomies

Encoded in `lib/producer-dna/taxonomy.ts`:

- **Eras** — pre-tape studio, tape/console, Wall of Sound, dub/soundsystem,
  disco/electronic studio, early hip-hop sampling, MIDI/sampler, DAW,
  internet beatmaker, streaming/social, AI-assisted.
- **Genres / scenes** — hip-hop, trap, boom bap, G-funk, drill, grime, UK
  garage, dubstep, jungle, drum and bass, techno, house, footwork,
  ambient, IDM, synthpop, disco, funk, R&B, soul, gospel, rock, punk,
  metal, reggae, dub, dancehall, Afrobeats, amapiano, highlife, reggaeton,
  dembow, Latin pop, baile funk, cumbia, salsa, K-pop, J-pop, city pop,
  Bollywood, Arabic pop, experimental, noise, jazz, film score, game score.
- **Producer roles** — beatmaker, producer-auteur, studio producer,
  engineer-producer, DJ-producer, composer-producer, arranger, remixer,
  sound designer, executive producer, label architect, sampling architect,
  vocal producer, mix engineer as producer, band member as producer,
  production collective.
- **Recommended sources** — MusicBrainz (relational/downloadable, CC0
  core), Discogs (release credits), Wikidata (linked entities), WhoSampled
  (samples/remixes/covers), FMA (genre/audio taxonomy reference), liner
  notes, interviews, label pages, publishers/PROs.

## 4. DNA scoring rubric

Each producer is scored 1–10 across 15 dimensions: innovation, influence,
technical craft, sonic identity, arrangement skill, rhythm design,
melodic/harmonic identity, sound design, mixing aesthetics, cultural
importance, commercial impact, underground impact, longevity, adaptability,
originality.

**The score is not a popularity ranking.** A producer can be a 10 in
underground impact and a 3 in commercial impact — that contrast is the
useful signal.

## 5. Batch 001 — first 50 seed producers

`lib/producer-dna/seed.ts` ships Batch 001: 50 producers spanning the US,
UK, Jamaica, Europe, Japan, India, Africa, the Caribbean, and Latin
America, across the 1950s–2020s. Each profile contains the full capsule
fields, eras, DNA score, and a set of open research questions. Verified
metadata fields (works, credits, sources, gear, collaborators, influences)
are intentionally left as empty scaffolds — they must be populated by the
verification pipeline before being promoted out of tier C/D/E to avoid
fabricating facts.

Subsequent batches (002–011) are encoded as `BATCHES` and cover hip-hop
foundations, Atlanta trap lineage, dub/reggae/dancehall, electronic
foundations, the UK bass continuum, Afrobeats/amapiano/highlife, Latin /
Caribbean / reggaeton / dembow / funk carioca, pop architects, rock /
alternative / punk / metal / indie, and film/game/ambient/experimental.

## 6. Full-profile generation pipeline

For every producer, profiles are generated in this order — enforced by the
agent / UI / API:

1. metadata first
2. source verification
3. key works
4. listening analysis
5. DNA summary
6. type-beat translation
7. originality warnings
8. iteration matrix
9. scoring
10. open questions

This sequence keeps the database useful for creative direction without
turning it into shallow imitation or fake research.

## 7. API surface (`/api/producer-dna`)

| Endpoint                          | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `GET /api/producer-dna`           | Search producers. Query params: `q`, `region`, `genre`, `role`, `era`, `minHistoricalTier`, `minScoreDimension`, `minScoreValue`. Returns summaries + database stats. |
| `GET /api/producer-dna/:id`       | Full Producer DNA profile.                                    |
| `GET /api/producer-dna/taxonomy`  | Eras, genres, roles, confidence tiers, scoring dimensions, recommended sources, and the full-profile pipeline. |
| `GET /api/producer-dna/batches`   | Batch roadmap (001–011) with focus, regions, eras, target count, status. |

## 8. UI (`/producer-dna`)

`app/producer-dna/page.tsx` is a dedicated page that exposes search,
filters (region, genre, role, era, minimum historical-fact tier), database
stats by tier, the batch roadmap, the confidence-tier legend, and a full
profile reader with scoring, capsule DNA, creative direction (with the
ethics-aware originality twist), and open research questions.
