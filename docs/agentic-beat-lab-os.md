# Agentic Beat Lab OS

## Purpose

This blueprint defines a **universal AI Producer + A&R + Engineer system** for iterative music creation.  
It is **not** a one-shot "AI beat app" flow. It is a loop-engineered operating model:

Song Prompt  
-> Song DNA Analysis  
-> Beat Strategy  
-> Parallel Beat Generation  
-> Stem Breakdown  
-> Audio Analysis  
-> A&R Review  
-> Stem Selection  
-> Mix / Master Preview  
-> Scorecard  
-> Revision Prompt  
-> Loop Again

---

## Why this loop works

- Avoids one-shot generation failure modes.
- Produces multiple candidates in parallel, then merges strongest traits.
- Converts subjective feedback into structured revisions.
- Builds reusable memory: approved references, rejected patterns, stem notes, scorecards.

Example selection strategy:

- Version 1: best atmosphere
- Version 2: best drum bounce
- Version 3: best 808 movement
- Version 4: best female-feature pocket
- Version 5: best intro/breakdown

Final direction:

- Use V2 drums + V1 atmosphere + V3 808 + V4 feature section.

---

## Core architecture principles

1. One agent = one clear job.
2. One input contract + one output contract per agent.
3. Retrieval before generation (RAG) for every revision loop.
4. Structured JSON outputs over free-form prose where possible.
5. Never promise perfection from generated audio or stem extraction.

---

## Agent council

| Agent | Job |
|---|---|
| Song DNA Agent | Turns song description into BPM, mood, key center, structure, vocal space, and palette |
| Copyright Safety Agent | Converts risky artist-copy wording into neutral, original production traits |
| Beat Strategy Agent | Produces 3-6 creative directions (for example, GPS Noir, Night Ride Bounce, Hotel Hallway) |
| Prompt Engineer Agent | Writes generator-specific prompts and parameter variants |
| Parallel Generation Agents | Produce multiple beat candidates simultaneously |
| Stem Breakdown Agent | Organizes stems (drums, 808, chords, guitar, FX, hats, percussion, etc.) |
| Audio Analysis Agent | Computes BPM, key, loudness, low-end behavior, density, vocal room |
| A&R Agent | Evaluates emotional fit, market fit, and replay value |
| Mix Engineer Agent | Balances stems, handles EQ/sidechain/space, prepares preview mixes |
| Revision Agent | Converts scorecard deltas into next revision prompt pack |

---

## Required outputs per iteration

For every song cycle, generate:

1. Song DNA JSON
2. Beat strategy map
3. Prompt pack
4. Stem plan
5. Audio analysis checklist
6. Scorecard
7. Revision prompt
8. Final export plan

---

## Master router prompt

You are the Agentic Beat Lab OS, a loop-engineered AI music production council.

Your job is to take a song description, extract Song DNA, create multiple original beat directions, generate or request beat versions in parallel, analyze stems, score every version, select the best parts, engineer the mix, and produce a revision plan until the beat reaches release-ready quality.

Never copy protected songs, samples, melodies, lyrics, or artist-specific signatures. Use references only as broad mood and market language. Convert artist references into neutral production traits.

For every song, always output:

1. Song DNA JSON
2. Beat strategy map
3. Prompt pack
4. Stem plan
5. Audio analysis checklist
6. Scorecard
7. Revision prompt
8. Final export plan

Loop until the beat is:

- on tempo
- original
- emotionally aligned
- open enough for vocals
- strong enough for release
- organized into stems
- ready for producer/engineer polish

---

## "Location Drop" preset (example profile)

Target concept:

- Dark melodic rap
- 98 BPM
- Trap-soul bounce
- Smooth 808s
- Crisp trap hats
- Soft claps/rimshots
- Moody minor chords
- Muted guitar
- Reversed synth textures
- Late-night GPS/rideshare/hotel hallway atmosphere
- Arrangement that leaves room for male melodic rapper + confident female rap feature

---

## Command center tabs

1. Song Brief
2. Song DNA
3. Prompt Pack
4. Generations
5. Stem Library
6. Beat Breakdown
7. Scorecards
8. Producer DNA
9. Mix Notes
10. Revision Loop
11. Final Export

---

## Parallel build mode (including interface build)

Yes: the agents should build the **interface** in parallel with backend/audio services.

### Parallel squads

| Squad | Scope | Primary output |
|---|---|---|
| Interface Squad | Build command center UI and state flows | Web app screens + interaction logic |
| Orchestration Squad | Agent router, job graph, retries, run history | Agent workflow engine |
| Audio Pipeline Squad | Ingest, decode, stem extraction, analysis | Processing services and workers |
| Export/Interop Squad | ZIP packs, metadata, DAW-ready structures | Export modules + import docs |
| Memory/RAG Squad | Retrieval, ranking, approved/rejected memory | Retrieval API + ranking policies |
| Evaluation Squad | Scorecard, QA harness, regression checks | Automated and listening-test reports |

### Interface squad backlog (must-have)

1. Song Brief intake (prompt, references, constraints)
2. Song DNA inspector and editable controls
3. Prompt Pack editor with variant compare
4. Generations grid with A/B/X listening
5. Stem Library with solo/mute, gain, pan
6. Beat Breakdown timeline with section markers
7. Scorecards dashboard and winner selection
8. Mix Notes panel with structured revision inputs
9. Revision Loop console ("run next iteration")
10. Final Export panel (DAW profiles + bundle download)

### Parallel development rules

- Each squad works on a focused branch/worktree, then merges via contracts.
- Shared contracts are versioned first (API schemas, manifest schemas, event types).
- Integration cadence: short merge windows after each contract-stable milestone.
- No squad blocks UI progress; use mocks when downstream services are unavailable.

---

## MVP stack

- Frontend: React or Next.js dashboard
- Backend: FastAPI or Node.js
- Automation: n8n
- Storage: S3 / Supabase Storage / cloud drive
- Database: Postgres / Supabase
- Audio tools: FFmpeg + librosa (plus optional higher-end DSP tools)
- AI layer: LLM for prompt analysis, critique, revision writing
- Music generation providers: any provider allowing audio export and stem workflows
- Stem workflow: native generator stems when available; otherwise separation pipeline

---

## Prompt caching + token saver policy

The system should aggressively reduce token waste while preserving quality.

### Prompt cache strategy

1. **Stable system prefix**: keep long base instructions fixed so cache hits are maximized.
2. **Prompt template IDs**: reference reusable templates by ID, not repeated full text.
3. **Context blocks by hash**: include immutable context via content hashes and references.
4. **Revision delta prompts**: pass only changes since prior iteration, not full history.
5. **Agent-local memory summaries**: store concise structured summaries after each run.

### Token saver rules

- Hard budget per agent call (input + output token caps).
- Use tiered context:
  - Tier 1: current task facts
  - Tier 2: top-k retrieved approved/rejected examples
  - Tier 3: compressed long-term memory summary
- Prefer JSON fields over narrative paragraphs for internal agent-to-agent communication.
- Truncate low-value logs and retain decision-critical fields only.
- Cache embeddings and retrieval results by project + revision hash.
- Reuse analysis artifacts (BPM/key/scorecards) unless source audio changes.

### Caching checkpoints in the loop

1. After Song DNA extraction
2. After strategy map generation
3. After each generation batch evaluation
4. After scorecard + selected stem decision
5. After revision prompt generation

### Minimum telemetry for savings tracking

- Cache hit rate by agent
- Tokens saved by cache reuse
- Average tokens per successful iteration
- Cost per accepted revision
- Latency impact of cache lookup vs regeneration

---

## Producer DNA Research base

Producer DNA is a research base, not a fame list. It separates verified facts from
audible and creative analysis, then turns both into searchable fields for original
music direction.

### Layer model

1. Verified Metadata Layer: producers, aliases, works, credits, sources,
   gear claims, collaborator edges, and influence edges.
2. Analytical DNA Layer: producer profiles, sonic DNA, rhythmic DNA,
   melodic/harmonic DNA, arrangement DNA, mixing DNA, sampling DNA, and
   style nuance maps.
3. Creative Direction Layer: inspired directions, creative iterations,
   originality warnings, fusion paths, and prompt exports.

### Confidence tiers

| Tier | Meaning |
|---|---|
| A | Primary source, liner note, official credit, interview, label, publisher, or direct archive |
| B | Multiple credible secondary sources |
| C | Open database listing that still needs independent verification |
| D | Audible or musicological analysis |
| E | Educated hypothesis requiring review |
| Unknown | Not enough reliable information |

### Metadata source strategy

- MusicBrainz: relational catalogue backbone for artists, releases, recordings,
  works, labels, relationships, genres, instruments, and snapshots.
- Discogs: release-level credits, roles, versions, labels, and track metadata.
- Wikidata: linked-entity layer for producer relationships, not final authority.
- WhoSampled: sample, remix, interpolation, and cover relationships when terms
  permit ingestion.
- FMA: hierarchical genre taxonomy and audio-feature reference.

### Batch 001

Batch 001 contains 50 global foundation producers across pop, hip-hop,
electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and
regional club music. Selection is based on historical importance, technical
influence, recognizable production identity, cross-genre usefulness, cultural
impact, region/scene diversity, and future database value.

### Full-profile operating order

metadata first -> source verification -> key works -> listening analysis -> DNA
summary -> type-beat translation -> originality warnings -> iteration matrix ->
scoring -> open questions.

---

## Governance rule

Generated beats are not truth until **James approves them**.

- Approved beats become references.
- Rejected beats become "avoid this" memory.
- Every version should improve the next loop.

---

## Operating warning

The system must prefer originality and clear rights-safe guidance.  
Do not output artist imitation directives as executable generation instructions.
