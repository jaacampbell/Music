# Producer DNA Research base

The Producer DNA Research base is a structured, citable knowledge base about music
producers. Its central design rule is to **separate verified facts from audible/creative
analysis**, then expose both as searchable, confidence-labeled fields so the data is useful
for original music-making without sliding into imitation or fake research.

Implementation:

- Types: [`lib/types.ts`](../lib/types.ts) (`ProducerCapsule`, `ProducerDnaProfile`,
  `ProducerTaxonomy`, `ConfidenceTier`, `ScoringDimension`, …)
- Data + query helpers: [`lib/producer-dna.ts`](../lib/producer-dna.ts)
- APIs: `app/api/producers/*`
- UI: the **Producer DNA** tab in [`app/page.tsx`](../app/page.tsx)

## 1. Core database architecture (three layers)

- **Layer 1 — Verified Metadata Layer** (facts only): producers, aliases, works, credits,
  sources, gear claims, collaborator edges, influence edges.
- **Layer 2 — Analytical DNA Layer** (human/AI musicological analysis): producer profiles,
  sonic, rhythmic, melodic/harmonic, arrangement, mixing, sampling DNA, and a style nuance map.
- **Layer 3 — Creative Direction Layer**: inspired directions (ethical type-beat translation),
  creative iterations, originality warnings (do-not-copy), fusion paths, and prompt exports.

In code, each producer is a `ProducerCapsule`. The verified layer is represented by
`factStatus` (`needs-research` / `partial` / `cited`) so nothing is presented as a citation it
does not yet have. The analytical and creative layers live on the optional
`ProducerDnaProfile`. `J Dilla` (`PDNA-000013`) is fully expanded as the reference capsule.

## 2. Research-confidence system

Every claim is labeled:

| Tier | Meaning |
| --- | --- |
| A | Confirmed by primary source, liner notes, official credits, interview, label, publisher, or direct archive |
| B | Confirmed by multiple credible secondary sources |
| C | Listed in open databases, but not yet independently verified |
| D | Audible / musicological analysis |
| E | Educated hypothesis requiring review |
| Unknown | Not enough reliable information |

The supplied Batch 001 angles are audible analysis, so they default to **D-tier** while
verified facts remain `needs-research` until cited.

## 3. Master taxonomy

- **Era**: pre-tape → tape/console → Wall of Sound → dub/soundsystem → disco/electronic studio →
  early hip-hop sampling → MIDI/sampler → DAW → internet beatmaker → streaming/social → AI-assisted.
- **Genre/scene**: hip-hop, trap, boom bap, G-funk, drill, grime, UK garage, dubstep, jungle,
  drum and bass, techno, house, footwork, ambient, IDM, synthpop, disco, funk, R&B, soul, gospel,
  rock, punk, metal, reggae, dub, dancehall, Afrobeats, amapiano, highlife, reggaeton, dembow,
  Latin pop, baile funk, cumbia, salsa, K-pop, J-pop, city pop, Bollywood, Arabic pop,
  experimental, noise, jazz, film score, game score, pop.
- **Producer role**: beatmaker, producer-auteur, studio producer, engineer-producer,
  DJ-producer, composer-producer, arranger, remixer, sound designer, executive producer,
  label architect, sampling architect, vocal producer, mix engineer as producer,
  band member as producer, production collective.

## 4. Producer DNA scoring rubric

Each producer is scored 1–10 across: innovation, influence, technical craft, sonic identity,
arrangement, rhythm design, melodic/harmonic identity, sound design, mixing aesthetics,
cultural importance, commercial impact, underground impact, longevity, adaptability,
originality. **This is not a popularity ranking** — a producer can be a 10 in underground
impact and a 3 in commercial impact. Scores are intentionally empty until researched; only the
reference capsule carries illustrative scores.

## 5. Batches

Batch 001 (50 global foundation producers, 1950s–2020s) is seeded. The roadmap (Batches
002–011) toward 100,000 producers is encoded in `getProducerTaxonomy().batchRoadmap`.

## 6. Operating rule for full profiles

Each full profile should be generated in this order: **metadata → source verification →
key works → listening analysis → DNA summary → type-beat translation → originality warnings →
iteration matrix → scoring → open questions.** This keeps the base useful for creative
direction without turning it into shallow imitation or fake research.
