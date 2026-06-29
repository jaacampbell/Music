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
8. Mix Notes
9. Revision Loop
10. Final Export

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

## Governance rule

Generated beats are not truth until **James approves them**.

- Approved beats become references.
- Rejected beats become "avoid this" memory.
- Every version should improve the next loop.

---

## Operating warning

The system must prefer originality and clear rights-safe guidance.  
Do not output artist imitation directives as executable generation instructions.
