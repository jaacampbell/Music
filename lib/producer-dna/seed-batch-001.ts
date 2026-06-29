import seedEntries from "@/lib/producer-dna/seed-entries.json";
import type {
  Producer,
  ProducerDnaCapsule,
  ProducerDnaRecord,
  ProducerScores
} from "@/lib/producer-dna/types";

const now = "2026-06-29T00:00:00.000Z";

interface RawSeedEntry {
  id: string;
  name: string;
  region: string;
  scene: string;
  coreDnaAngle: string;
  country: string;
  genres: string[];
}

/** Expanded capsule for J Dilla — the reference example from the spec. */
const DILLA_CAPSULE: Omit<
  ProducerDnaCapsule,
  "producerId" | "name" | "countryRegion" | "primaryGenres" | "sceneMovement"
> = {
  signatureSoundSummary:
    "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection.",
  artisticDna:
    "Dilla's deeper logic is not just swing. It is the feeling that the machine is breathing. His beats often feel slightly bent, intimate, warm, and conversational.",
  technicalDna:
    "Verified tools must be researched per source. Audible analysis suggests sampler-centered construction, non-rigid quantization, warm low-mid texture, and loop transformation.",
  rhythmicDna:
    "Loose kicks, late snares, swung hats, and microtiming that feels human rather than sloppy.",
  melodicHarmonicDna:
    "Soul/jazz/gospel fragments, short motifs, bittersweet chord color, unresolved emotional loops.",
  arrangementDna:
    "Often loop-based, but replay value comes from pocket, texture, chops, drops, and subtle variation.",
  typeBeatInspiredDirection:
    "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Avoid copying exact drum timing, sample choices, or recognizable chop patterns.",
  originalityTwist:
    "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
  researchConfidence:
    "Mixed: historical facts need citation; audible analysis can be marked as D-tier analysis."
};

const DEFAULT_RESEARCH_CONFIDENCE =
  "Mixed: historical facts need citation; audible analysis marked D-tier.";

const buildCapsuleFields = (
  entry: RawSeedEntry
): Omit<
  ProducerDnaCapsule,
  "producerId" | "name" | "countryRegion" | "primaryGenres" | "sceneMovement"
> => {
  if (entry.id === "PDNA-000013") return DILLA_CAPSULE;

  return {
    signatureSoundSummary: entry.coreDnaAngle,
    artisticDna: `${entry.name}'s production identity centers on ${entry.coreDnaAngle.toLowerCase()}.`,
    technicalDna:
      "Verified tools must be researched per source. Audible analysis pending full profile expansion.",
    rhythmicDna: `Rhythm design aligned with ${entry.scene} conventions — requires listening analysis.`,
    melodicHarmonicDna: `Harmonic/melodic tendencies across ${entry.genres.join(", ")} — requires listening analysis.`,
    arrangementDna: `Arrangement logic tied to ${entry.scene} — requires listening analysis.`,
    typeBeatInspiredDirection: `Ethical type-beat direction inspired by ${entry.name}'s ${entry.coreDnaAngle.toLowerCase()}. Avoid copying signature patterns.`,
    originalityTwist: `Combine ${entry.name}-like creative logic with an unexpected genre, region, or emotional target.`,
    researchConfidence: DEFAULT_RESEARCH_CONFIDENCE
  };
};

const DEFAULT_SCORES: Omit<ProducerScores, "producerId" | "confidence"> = {
  innovation: 8,
  influence: 8,
  technicalCraft: 7,
  sonicIdentity: 8,
  arrangementSkill: 7,
  rhythmDesign: 7,
  melodicHarmonicIdentity: 7,
  soundDesign: 7,
  mixingAesthetics: 7,
  culturalImportance: 8,
  commercialImpact: 7,
  undergroundImpact: 7,
  longevity: 7,
  adaptability: 7,
  originality: 8
};

const SCORE_OVERRIDES: Record<string, Partial<Omit<ProducerScores, "producerId" | "confidence">>> = {
  "PDNA-000001": { innovation: 10, influence: 10, arrangementSkill: 10, melodicHarmonicIdentity: 10, culturalImportance: 10, commercialImpact: 10, longevity: 10 },
  "PDNA-000013": { innovation: 10, influence: 10, rhythmDesign: 10, sonicIdentity: 10, undergroundImpact: 10, longevity: 10, originality: 10 },
  "PDNA-000031": { innovation: 10, influence: 10, technicalCraft: 10, rhythmDesign: 10, soundDesign: 10, sonicIdentity: 10, originality: 10 },
  "PDNA-000033": { innovation: 10, influence: 10, sonicIdentity: 10, culturalImportance: 10, undergroundImpact: 10, longevity: 10, originality: 10 },
  "PDNA-000050": { innovation: 9, rhythmDesign: 10, sonicIdentity: 10, undergroundImpact: 10, originality: 9 }
};

const buildSearchableText = (entry: RawSeedEntry, capsule: ProducerDnaCapsule): string =>
  [
    entry.name,
    entry.region,
    entry.scene,
    entry.coreDnaAngle,
    entry.country,
    ...entry.genres,
    capsule.signatureSoundSummary,
    capsule.artisticDna
  ]
    .join(" ")
    .toLowerCase();

const buildRecord = (entry: RawSeedEntry): ProducerDnaRecord => {
  const capsuleFields = buildCapsuleFields(entry);
  const capsule: ProducerDnaCapsule = {
    producerId: entry.id,
    name: entry.name,
    countryRegion: `${entry.country} / ${entry.region}`,
    primaryGenres: entry.genres,
    sceneMovement: entry.scene,
    ...capsuleFields
  };

  const producer: Producer = {
    id: entry.id,
    name: entry.name,
    realName: null,
    gender: null,
    country: entry.country,
    city: null,
    region: entry.region,
    activeYears: null,
    primaryScenes: [entry.scene],
    officialLinks: [],
    batchId: "001",
    coreDnaAngle: entry.coreDnaAngle,
    searchableText: buildSearchableText(entry, capsule),
    createdAt: now,
    updatedAt: now
  };

  const scores: ProducerScores = {
    producerId: entry.id,
    confidence: "D",
    ...DEFAULT_SCORES,
    ...(SCORE_OVERRIDES[entry.id] ?? {})
  };

  const isDilla = entry.id === "PDNA-000013";

  return {
    producer,
    aliases: [],
    works: [],
    credits: [],
    sources: [],
    gearClaims: [],
    collaboratorEdges: [],
    influenceEdges: [],
    profile: {
      id: `profile-${entry.id}`,
      producerId: entry.id,
      longFormProfile: isDilla ? capsule.artisticDna : "",
      signatureSoundSummary: capsule.signatureSoundSummary,
      artisticDna: capsule.artisticDna,
      technicalDna: capsule.technicalDna,
      researchConfidence: capsule.researchConfidence,
      confidence: "D",
      profileStatus: isDilla ? "draft" : "capsule",
      updatedAt: now
    },
    sonicDna: null,
    rhythmicDna: isDilla
      ? {
          id: `rhythm-${entry.id}`,
          producerId: entry.id,
          swing: "Humanized off-grid",
          gridPrecision: "Intentionally loose",
          drumDensity: "Moderate with space",
          grooveFamily: "Soul-quantized hip-hop",
          kickSnarePlacement: "Late snare, loose kick",
          hiHatLanguage: "Swung, conversational",
          percussionBehavior: "Subtle variation over loops",
          tempoRanges: "85-95 BPM typical",
          confidence: "D"
        }
      : null,
    melodicHarmonicDna: null,
    arrangementDna: null,
    mixingDna: null,
    samplingDna: isDilla
      ? {
          id: `sampling-${entry.id}`,
          producerId: entry.id,
          sourceTraditions: "Soul, jazz, gospel records",
          choppingStyle: "Short melodic fragments",
          pitchShifting: "Subtle, warmth-preserving",
          filtering: "Warm low-pass, dusty texture",
          looping: "Emotional loop repetition",
          sampleEthics: "Transformative chopping; clearance varies per track",
          clearanceStatus: "Mixed per track",
          confidence: "D"
        }
      : null,
    styleNuanceMap: null,
    inspiredDirections: [
      {
        id: `inspired-${entry.id}`,
        producerId: entry.id,
        title: "Type-beat translation",
        description: capsule.typeBeatInspiredDirection,
        ethicalType: "type_beat_translation",
        confidence: "D"
      }
    ],
    creativeIterations: [
      {
        id: `iteration-${entry.id}-01`,
        producerId: entry.id,
        directionNumber: 1,
        title: "Originality twist",
        description: capsule.originalityTwist,
        confidence: "E"
      }
    ],
    originalityWarnings: [
      {
        id: `warning-${entry.id}-01`,
        producerId: entry.id,
        category: "general",
        warning: `Do not copy ${entry.name}'s signature drum patterns, exact sample choices, or recognizable arrangement habits.`,
        severity: "high"
      }
    ],
    fusionPaths: [],
    promptExports: [],
    scores,
    capsule
  };
};

export const BATCH_001_RECORDS: ProducerDnaRecord[] = (seedEntries as RawSeedEntry[]).map(
  buildRecord
);

export const BATCH_001_PRODUCER_COUNT = BATCH_001_RECORDS.length;
