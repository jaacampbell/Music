/**
 * Producer DNA Research base — type model.
 *
 * The architecture is split into three layers so that verified facts stay
 * separate from creative/musicological analysis:
 *
 *   Layer 1 — Verified Metadata Layer (facts only)
 *   Layer 2 — Analytical DNA Layer (human/AI musicological analysis)
 *   Layer 3 — Creative Direction Layer (original-music direction)
 *
 * Every claim carries a research-confidence tier so verified facts are never
 * confused with audible analysis or hypotheses.
 */

/** Research-confidence tier attached to any claim. */
export type ConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

/** Era taxonomy (production technology epochs). */
export type EraTag =
  | "pre-tape-studio"
  | "tape-console"
  | "wall-of-sound"
  | "dub-soundsystem"
  | "disco-electronic-studio"
  | "early-hip-hop-sampling"
  | "midi-sampler"
  | "daw"
  | "internet-beatmaker"
  | "streaming-social"
  | "ai-assisted";

/** Producer-role taxonomy. */
export type RoleTag =
  | "beatmaker"
  | "producer-auteur"
  | "studio-producer"
  | "engineer-producer"
  | "dj-producer"
  | "composer-producer"
  | "arranger"
  | "remixer"
  | "sound-designer"
  | "executive-producer"
  | "label-architect"
  | "sampling-architect"
  | "vocal-producer"
  | "mix-engineer-producer"
  | "band-member-producer"
  | "production-collective";

/** Credit roles used on works. */
export type CreditRole =
  | "producer"
  | "co-producer"
  | "executive-producer"
  | "arranger"
  | "engineer"
  | "mixer"
  | "programmer"
  | "remixer"
  | "composer"
  | "beatmaker"
  | "sound-designer"
  | "dj"
  | "sampling";

/** Gear claim status (kept distinct from the global confidence tier). */
export type GearStatus = "confirmed" | "reported" | "inferred" | "unknown";

/* ---------------------------------------------------------------------------
 * Layer 1 — Verified Metadata Layer
 * ------------------------------------------------------------------------- */

export interface ProducerAlias {
  alias: string;
  kind: "alias" | "group" | "collective" | "production-team" | "label-identity";
  periodUsed?: string;
}

export interface SourceRef {
  id: string;
  url?: string;
  sourceType:
    | "primary"
    | "liner-notes"
    | "official-credits"
    | "interview"
    | "label"
    | "publisher"
    | "archive"
    | "musicbrainz"
    | "discogs"
    | "wikidata"
    | "whosampled"
    | "secondary"
    | "open-database";
  dateAccessed?: string;
  reliabilityTier: ConfidenceTier;
  claimSupported: string;
  quoteOrSummary?: string;
  citationStatus: "cited" | "needs-citation" | "self-reported";
}

export interface GearClaim {
  category:
    | "daw"
    | "sampler"
    | "synth"
    | "drum-machine"
    | "plugin"
    | "console"
    | "studio"
    | "recording-method";
  name: string;
  status: GearStatus;
  note?: string;
}

export interface Work {
  id: string;
  title: string;
  kind:
    | "track"
    | "album"
    | "remix"
    | "score"
    | "placement"
    | "game-soundtrack"
    | "film-cue"
    | "commercial";
  releaseYear?: number;
  artist?: string;
  label?: string;
  country?: string;
  identifiers?: string[];
  confidence: ConfidenceTier;
}

export interface Credit {
  workId: string;
  role: CreditRole;
  confidence: ConfidenceTier;
  note?: string;
}

export interface CollaboratorEdge {
  target: string;
  relation:
    | "producer-artist"
    | "producer-producer"
    | "producer-engineer"
    | "producer-label"
    | "producer-scene";
  confidence: ConfidenceTier;
}

export interface InfluenceEdge {
  target: string;
  relation:
    | "influenced-by"
    | "influenced"
    | "adjacent"
    | "opposite-style"
    | "often-confused-with"
    | "cross-genre-parallel";
  confidence: ConfidenceTier;
}

/* ---------------------------------------------------------------------------
 * Layer 2 — Analytical DNA Layer
 * ------------------------------------------------------------------------- */

export interface SonicDna {
  atmosphere: string;
  warmthVsClarity: string;
  gritVsPolish: string;
  darknessVsBrightness: string;
  densityVsSpace: string;
  syntheticVsOrganic: string;
}

export interface RhythmicDna {
  swing: string;
  gridPrecision: string;
  drumDensity: string;
  grooveFamily: string;
  kickSnarePlacement: string;
  hiHatLanguage: string;
  tempoRanges: string;
}

export interface MelodicHarmonicDna {
  chordMood: string;
  modality: string;
  influences: string;
  motifs: string;
  dissonanceTension: string;
}

export interface ArrangementDna {
  introStyle: string;
  dropChorusBehavior: string;
  loopEvolution: string;
  transitions: string;
  tensionRelease: string;
}

export interface MixingDna {
  lowEnd: string;
  midrange: string;
  highEndTexture: string;
  loudnessStereo: string;
  vocalPlacement: string;
  spaceFx: string;
  saturation: string;
}

export interface SamplingDna {
  sourceTraditions: string;
  choppingStyle: string;
  pitchAndFilter: string;
  looping: string;
  ethicsClearance: string;
}

export interface StyleNuanceMap {
  casualListeners: string;
  producers: string;
  engineers: string;
  artists: string;
  djs: string;
  beginnerMisunderstanding: string;
}

/* ---------------------------------------------------------------------------
 * Producer DNA scoring rubric (1–10 per dimension).
 * NOT a popularity ranking — a producer can be 10 underground / 3 commercial.
 * ------------------------------------------------------------------------- */

export interface ProducerScores {
  innovation: number;
  influence: number;
  technicalCraft: number;
  sonicIdentity: number;
  arrangementSkill: number;
  rhythmDesign: number;
  melodicHarmonicIdentity: number;
  soundDesign: number;
  mixingAesthetics: number;
  culturalImportance: number;
  commercialImpact: number;
  undergroundImpact: number;
  longevity: number;
  adaptability: number;
  originality: number;
}

/* ---------------------------------------------------------------------------
 * Layer 3 — Creative Direction Layer
 * ------------------------------------------------------------------------- */

export interface CreativeDirection {
  /** Ethical type-beat translation without imitation. */
  inspiredDirection: string;
  /** 10+ original directions per producer (creative iteration matrix). */
  creativeIterations: string[];
  /** Do-not-copy list. */
  originalityWarnings: string[];
  /** How to combine this producer's logic with another producer/genre/region/mood. */
  fusionPaths: string[];
  /** Clean prompts for beat-making, song direction, DAW sessions, mix references. */
  promptExports: string[];
}

/* ---------------------------------------------------------------------------
 * Compressed capsule (section 7 format) + full profile container.
 * ------------------------------------------------------------------------- */

export interface ProducerDnaCapsule {
  /** Stable Producer ID, e.g. "PDNA-000013". */
  id: string;
  name: string;
  realName?: string;
  aliases: string[];
  countryRegion: string;
  /** Region / Scene label from Batch 001 seed table. */
  regionScene: string;
  primaryGenres: string[];
  sceneMovement: string;
  eras: EraTag[];
  roles: RoleTag[];
  /** Core DNA angle from the seed table. */
  coreDnaAngle: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  typeBeatDirection: string;
  originalityTwist: string;
  /** Confidence tier for verified metadata facts. */
  factConfidence: ConfidenceTier;
  /** Confidence tier for audible/musicological analysis (typically D). */
  analysisConfidence: ConfidenceTier;
  researchConfidenceNote: string;
  scores: ProducerScores;
  batch: string;
}

/** Optional deep profile attached to a capsule once expanded. */
export interface ProducerProfile {
  capsuleId: string;
  longForm: string;
  sonicDna?: SonicDna;
  rhythmicDna?: RhythmicDna;
  melodicHarmonicDna?: MelodicHarmonicDna;
  arrangementDna?: ArrangementDna;
  mixingDna?: MixingDna;
  samplingDna?: SamplingDna;
  styleNuanceMap?: StyleNuanceMap;
  creativeDirection?: CreativeDirection;
  works?: Work[];
  credits?: Credit[];
  sources?: SourceRef[];
  gearClaims?: GearClaim[];
  collaboratorEdges?: CollaboratorEdge[];
  influenceEdges?: InfluenceEdge[];
}
