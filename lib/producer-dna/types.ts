import type {
  ConfidenceTier,
  CreditRole,
  Era,
  GearClaimStatus,
  Genre,
  ProducerRole,
  ScoringAxis,
  SourceType
} from "@/lib/producer-dna/taxonomy";

/**
 * Layer 1 — Verified Metadata Layer
 *
 * Facts only. Every claim should be backed by a source row (or marked
 * `Unknown` in `researchConfidence`).
 */

export interface ProducerAlias {
  id: string;
  alias: string;
  kind: "alias" | "group" | "collective" | "production-team" | "label-identity";
  periodStart?: number;
  periodEnd?: number;
  notes?: string;
}

export interface ProducerLink {
  label: string;
  url: string;
}

export interface Producer {
  id: string;
  name: string;
  realName?: string;
  aliases: ProducerAlias[];
  publicIdentity?: string;
  country?: string;
  city?: string;
  region?: string;
  activeYearsStart?: number;
  activeYearsEnd?: number;
  primaryScenes: string[];
  primaryGenres: Genre[];
  primaryRoles: ProducerRole[];
  primaryEras: Era[];
  officialLinks: ProducerLink[];
  coreDnaAngle: string;
  researchConfidence: ConfidenceTier;
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  producerId: string;
  workType:
    | "track"
    | "album"
    | "remix"
    | "score"
    | "placement"
    | "game-soundtrack"
    | "film-cue"
    | "commercial";
  title: string;
  releaseYear?: number;
  primaryArtist?: string;
  label?: string;
  country?: string;
  identifiers: {
    musicbrainzId?: string;
    discogsId?: string;
    wikidataId?: string;
    isrc?: string;
    upc?: string;
  };
  notes?: string;
  researchConfidence: ConfidenceTier;
}

export interface Credit {
  id: string;
  producerId: string;
  workId?: string;
  workTitle?: string;
  primaryArtist?: string;
  role: CreditRole;
  notes?: string;
  researchConfidence: ConfidenceTier;
  sourceIds: string[];
}

export interface Source {
  id: string;
  producerId: string;
  url?: string;
  sourceType: SourceType;
  dateAccessed: string;
  reliabilityTier: ConfidenceTier;
  claimSupported: string;
  quote?: string;
  citationStatus: "verified" | "pending" | "rejected";
}

export interface GearClaim {
  id: string;
  producerId: string;
  category:
    | "daw"
    | "sampler"
    | "synth"
    | "drum-machine"
    | "plugin"
    | "console"
    | "studio"
    | "recording-method"
    | "outboard";
  item: string;
  status: GearClaimStatus;
  notes?: string;
  sourceIds: string[];
}

export interface CollaboratorEdge {
  id: string;
  producerId: string;
  counterpartType:
    | "producer"
    | "artist"
    | "engineer"
    | "label"
    | "scene"
    | "studio";
  counterpartName: string;
  relationship: string;
  periodStart?: number;
  periodEnd?: number;
  sourceIds: string[];
  researchConfidence: ConfidenceTier;
}

export interface InfluenceEdge {
  id: string;
  producerId: string;
  kind:
    | "influenced-by"
    | "influenced"
    | "adjacent"
    | "opposite-style"
    | "often-confused-with"
    | "cross-genre-parallel";
  counterpartName: string;
  notes?: string;
  researchConfidence: ConfidenceTier;
}

/**
 * Layer 2 — Analytical DNA Layer
 *
 * Human / AI musicological analysis. Default confidence is `D` unless
 * elevated by primary sources.
 */

export interface SonicDna {
  atmosphere?: string;
  warmth?: number;
  grit?: number;
  polish?: number;
  darkness?: number;
  brightness?: number;
  density?: number;
  space?: number;
  distortion?: number;
  syntheticOrganicBalance?: number;
  notes?: string;
}

export interface RhythmicDna {
  swingFeel?: string;
  gridPrecision?: number;
  drumDensity?: number;
  grooveFamily?: string[];
  kickPlacement?: string;
  snarePlacement?: string;
  hiHatLanguage?: string;
  percussionBehavior?: string;
  tempoRangeLow?: number;
  tempoRangeHigh?: number;
  notes?: string;
}

export interface MelodicHarmonicDna {
  chordMood?: string;
  modality?: string[];
  tonalCenter?: string;
  externalInfluences?: string[];
  motifs?: string[];
  dissonance?: number;
  unresolvedTension?: number;
  notes?: string;
}

export interface ArrangementDna {
  introStyle?: string;
  dropChorusBehavior?: string;
  loopEvolution?: string;
  transitions?: string;
  breakdowns?: string;
  tensionRelease?: string;
  momentDesign?: string;
  notes?: string;
}

export interface MixingDna {
  lowEnd?: string;
  midrange?: string;
  highEndTexture?: string;
  loudness?: string;
  stereoField?: string;
  vocalPlacement?: string;
  reverbDelay?: string;
  compression?: string;
  saturation?: string;
  clipping?: string;
  notes?: string;
}

export interface SamplingDna {
  sourceTraditions?: string[];
  choppingStyle?: string;
  pitchShifting?: string;
  filtering?: string;
  looping?: string;
  sampleEthics?: string;
  clearanceStatus?: "known-clean" | "known-disputed" | "unknown";
  notes?: string;
}

export interface StyleNuanceMap {
  casualListeners?: string;
  producers?: string;
  engineers?: string;
  artists?: string;
  djs?: string;
  beginnersMisunderstand?: string;
}

export interface ProducerProfile {
  id: string;
  producerId: string;
  longForm: string;
  sonicDna: SonicDna;
  rhythmicDna: RhythmicDna;
  melodicHarmonicDna: MelodicHarmonicDna;
  arrangementDna: ArrangementDna;
  mixingDna: MixingDna;
  samplingDna: SamplingDna;
  styleNuanceMap: StyleNuanceMap;
  analysisConfidence: ConfidenceTier;
  updatedAt: string;
}

/**
 * Layer 3 — Creative Direction Layer
 *
 * Output-facing artifacts that turn DNA into ethical, original new music.
 */

export interface InspiredDirection {
  id: string;
  producerId: string;
  title: string;
  description: string;
  ethicsNote: string;
}

export interface CreativeIteration {
  id: string;
  producerId: string;
  index: number;
  title: string;
  prompt: string;
  twist: string;
}

export interface OriginalityWarning {
  id: string;
  producerId: string;
  category:
    | "melody"
    | "drum-pattern"
    | "vocal-tag"
    | "exact-chain"
    | "recognizable-sample"
    | "arrangement-habit";
  detail: string;
}

export interface FusionPath {
  id: string;
  producerId: string;
  partner: string;
  partnerKind: "producer" | "genre" | "region" | "emotional-target";
  description: string;
}

export interface PromptExport {
  id: string;
  producerId: string;
  target:
    | "beat-making"
    | "song-direction"
    | "daw-session"
    | "stem-generation"
    | "mix-reference"
    | "artist-coaching";
  prompt: string;
}

/**
 * Scoring rubric (per producer DNA scoring spec).
 *
 * Each axis is 1–10; missing axes are treated as "not yet rated".
 */
export type ProducerScoreCard = Partial<Record<ScoringAxis, number>> & {
  notes?: string;
  scoredAt?: string;
};

/**
 * Full Producer DNA record — the union of all three layers + scoring +
 * relationship edges, returned by the GET /api/producers/:id endpoint.
 */
export interface ProducerDnaRecord {
  producer: Producer;
  profile: ProducerProfile;
  works: Work[];
  credits: Credit[];
  sources: Source[];
  gearClaims: GearClaim[];
  collaboratorEdges: CollaboratorEdge[];
  influenceEdges: InfluenceEdge[];
  inspiredDirections: InspiredDirection[];
  creativeIterations: CreativeIteration[];
  originalityWarnings: OriginalityWarning[];
  fusionPaths: FusionPath[];
  promptExports: PromptExport[];
  score: ProducerScoreCard;
}

export interface ProducerSearchFilters {
  q?: string;
  era?: string;
  genre?: string;
  role?: string;
  region?: string;
  confidence?: ConfidenceTier;
  minScoreAxis?: ScoringAxis;
  minScoreValue?: number;
}

export interface ProducerSummary {
  id: string;
  name: string;
  country?: string;
  region?: string;
  primaryGenres: Genre[];
  primaryRoles: ProducerRole[];
  primaryEras: Era[];
  coreDnaAngle: string;
  researchConfidence: ConfidenceTier;
  scoreAverage: number | null;
}
