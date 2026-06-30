import type {
  ProducerDnaCapsule,
  ProducerDnaRecord,
  ProducerProfile
} from "@/lib/producer-dna/types";
import { BATCH_001_SEED, type Batch001SeedEntry } from "@/lib/producer-dna/seed/batch-001";

const now = (): string => new Date().toISOString();

const buildCapsule = (entry: Batch001SeedEntry): ProducerDnaCapsule => ({
  producerId: entry.id,
  name: entry.name,
  countryRegion: entry.country
    ? `${entry.country}${entry.region ? ` / ${entry.region}` : ""}`
    : entry.regionScene,
  primaryGenres: entry.primaryGenres,
  sceneMovement: entry.sceneMovement,
  signatureSoundSummary: entry.signatureSoundSummary,
  artisticDna: entry.artisticDna,
  technicalDna: entry.technicalDna,
  rhythmicDna: entry.rhythmicDna,
  melodicHarmonicDna: entry.melodicHarmonicDna,
  arrangementDna: entry.arrangementDna,
  typeBeatInspiredDirection: entry.typeBeatInspiredDirection,
  originalityTwist: entry.originalityTwist,
  researchConfidence: entry.researchConfidence
});

const buildProfile = (entry: Batch001SeedEntry): ProducerProfile => ({
  id: `profile-${entry.id}`,
  producerId: entry.id,
  profileText: `${entry.signatureSoundSummary} ${entry.artisticDna}`,
  signatureSoundSummary: entry.signatureSoundSummary,
  artisticDna: entry.artisticDna,
  technicalDna: entry.technicalDna,
  researchConfidence: entry.researchConfidence,
  confidence: "D",
  updatedAt: now()
});

export const buildRecordFromSeed = (entry: Batch001SeedEntry): ProducerDnaRecord => {
  const timestamp = now();
  const capsule = buildCapsule(entry);

  return {
    producer: {
      id: entry.id,
      name: entry.name,
      aliases: [],
      country: entry.country,
      region: entry.region ?? entry.regionScene,
      primaryScenes: [entry.sceneMovement],
      officialLinks: [],
      batchId: "001",
      coreDnaAngle: entry.coreDnaAngle,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    aliases: [],
    works: [],
    credits: [],
    sources: [],
    gearClaims: [],
    collaboratorEdges: [],
    influenceEdges: [],
    profile: buildProfile(entry),
    sonicDna: {
      id: `sonic-${entry.id}`,
      producerId: entry.id,
      atmosphere: entry.signatureSoundSummary,
      confidence: "D"
    },
    rhythmicDna: {
      id: `rhythmic-${entry.id}`,
      producerId: entry.id,
      grooveFamily: entry.rhythmicDna,
      confidence: "D"
    },
    melodicHarmonicDna: {
      id: `melodic-${entry.id}`,
      producerId: entry.id,
      chordMood: entry.melodicHarmonicDna,
      confidence: "D"
    },
    arrangementDna: {
      id: `arrangement-${entry.id}`,
      producerId: entry.id,
      loopEvolution: entry.arrangementDna,
      confidence: "D"
    },
    inspiredDirections: [
      {
        id: `inspired-${entry.id}`,
        producerId: entry.id,
        direction: entry.typeBeatInspiredDirection,
        ethicalTranslation:
          "Translate production logic and feel — never copy recognizable melodies, drum patterns, vocal tags, or sample choices.",
        confidence: "D"
      }
    ],
    creativeIterations: Array.from({ length: 10 }, (_, i) => ({
      id: `iteration-${entry.id}-${i + 1}`,
      producerId: entry.id,
      iterationNumber: i + 1,
      direction: `${entry.originalityTwist} (iteration ${i + 1})`,
      confidence: "E"
    })),
    originalityWarnings: [
      {
        id: `warn-melody-${entry.id}`,
        producerId: entry.id,
        category: "melody",
        warning: `Do not copy ${entry.name}'s signature melodic hooks or recognizable motifs.`,
        confidence: "D"
      },
      {
        id: `warn-drums-${entry.id}`,
        producerId: entry.id,
        category: "drum_pattern",
        warning: `Do not replicate ${entry.name}'s exact drum patterns or timing fingerprints.`,
        confidence: "D"
      },
      {
        id: `warn-samples-${entry.id}`,
        producerId: entry.id,
        category: "sample",
        warning: `Avoid recognizable sample choices associated with ${entry.name}'s catalogue.`,
        confidence: "D"
      }
    ],
    fusionPaths: [
      {
        id: `fusion-${entry.id}`,
        producerId: entry.id,
        fusionTarget: "cross-genre/regional fusion",
        fusionType: "genre",
        path: entry.originalityTwist,
        confidence: "E"
      }
    ],
    promptExports: [
      {
        id: `prompt-beat-${entry.id}`,
        producerId: entry.id,
        exportType: "beat_making",
        prompt: entry.typeBeatInspiredDirection,
        confidence: "D"
      },
      {
        id: `prompt-direction-${entry.id}`,
        producerId: entry.id,
        exportType: "song_direction",
        prompt: `${entry.artisticDna} Apply as creative direction, not imitation.`,
        confidence: "D"
      }
    ],
    capsule
  };
};

export const BATCH_001_RECORDS: ProducerDnaRecord[] = BATCH_001_SEED.map(buildRecordFromSeed);
