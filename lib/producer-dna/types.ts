/**
 * Producer DNA Research Base — domain types.
 * Three layers: Verified Metadata, Analytical DNA, Creative Direction.
 */

// ─── Research confidence ───────────────────────────────────────────────────────

export type ConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

export type GearClaimStatus = "confirmed" | "reported" | "inferred" | "unknown";

export type SourceType =
  | "musicbrainz"
  | "discogs"
  | "wikidata"
  | "whosampled"
  | "fma"
  | "liner_notes"
  | "interview"
  | "official_credit"
  | "archive"
  | "audible_analysis"
  | "other";

export type CitationStatus = "verified" | "pending" | "disputed" | "retracted";

// ─── Layer 1 — Verified Metadata ─────────────────────────────────────────────

export interface Producer {
  id: string;
  name: string;
  realName?: string;
  aliases: string[];
  gender?: string;
  country?: string;
  city?: string;
  region?: string;
  activeYears?: string;
  primaryScenes: string[];
  officialLinks: string[];
  batchId?: string;
  coreDnaAngle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProducerAlias {
  id: string;
  producerId: string;
  alias: string;
  aliasType: "alias" | "group" | "collective" | "production_team" | "label_identity";
  timePeriod?: string;
  confidence: ConfidenceTier;
}

export interface Work {
  id: string;
  title: string;
  workType:
    | "track"
    | "album"
    | "remix"
    | "score"
    | "placement"
    | "game_soundtrack"
    | "film_cue"
    | "commercial";
  releaseYear?: number;
  artist?: string;
  label?: string;
  country?: string;
  identifiers: Record<string, string>;
  confidence: ConfidenceTier;
}

export type CreditRole =
  | "producer"
  | "co_producer"
  | "executive_producer"
  | "arranger"
  | "engineer"
  | "mixer"
  | "programmer"
  | "remixer"
  | "composer"
  | "beatmaker"
  | "sound_designer"
  | "dj"
  | "sampling";

export interface Credit {
  id: string;
  producerId: string;
  workId: string;
  role: CreditRole;
  confidence: ConfidenceTier;
  sourceId?: string;
}

export interface Source {
  id: string;
  url: string;
  sourceType: SourceType;
  dateAccessed: string;
  reliabilityTier: ConfidenceTier;
  claimSupported: string;
  quoteOrSummary?: string;
  citationStatus: CitationStatus;
}

export interface GearClaim {
  id: string;
  producerId: string;
  category: "daw" | "sampler" | "synth" | "drum_machine" | "plugin" | "console" | "studio" | "recording_method";
  name: string;
  status: GearClaimStatus;
  confidence: ConfidenceTier;
  sourceId?: string;
}

export type CollaboratorEdgeType =
  | "producer_artist"
  | "producer_producer"
  | "producer_engineer"
  | "producer_label"
  | "producer_scene";

export interface CollaboratorEdge {
  id: string;
  producerId: string;
  targetId: string;
  targetName: string;
  edgeType: CollaboratorEdgeType;
  confidence: ConfidenceTier;
}

export type InfluenceEdgeType =
  | "influenced_by"
  | "influenced"
  | "adjacent"
  | "opposite_style"
  | "often_confused_with"
  | "cross_genre_parallel";

export interface InfluenceEdge {
  id: string;
  producerId: string;
  targetId: string;
  targetName: string;
  edgeType: InfluenceEdgeType;
  confidence: ConfidenceTier;
}

// ─── Layer 2 — Analytical DNA ────────────────────────────────────────────────

export interface ProducerProfile {
  id: string;
  producerId: string;
  profileText: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  researchConfidence: string;
  confidence: ConfidenceTier;
  updatedAt: string;
}

export interface SonicDna {
  id: string;
  producerId: string;
  atmosphere?: string;
  warmth?: string;
  grit?: string;
  polish?: string;
  darkness?: string;
  brightness?: string;
  density?: string;
  space?: string;
  distortion?: string;
  syntheticOrganicBalance?: string;
  confidence: ConfidenceTier;
}

export interface RhythmicDna {
  id: string;
  producerId: string;
  swing?: string;
  gridPrecision?: string;
  drumDensity?: string;
  grooveFamily?: string;
  kickSnarePlacement?: string;
  hiHatLanguage?: string;
  percussionBehavior?: string;
  tempoRanges?: string;
  confidence: ConfidenceTier;
}

export interface MelodicHarmonicDna {
  id: string;
  producerId: string;
  chordMood?: string;
  modality?: string;
  tonalCenter?: string;
  influences?: string[];
  motifs?: string;
  dissonance?: string;
  unresolvedTension?: string;
  confidence: ConfidenceTier;
}

export interface ArrangementDna {
  id: string;
  producerId: string;
  introStyle?: string;
  dropChorusBehavior?: string;
  loopEvolution?: string;
  transitions?: string;
  breakdowns?: string;
  tensionRelease?: string;
  momentDesign?: string;
  confidence: ConfidenceTier;
}

export interface MixingDna {
  id: string;
  producerId: string;
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
  confidence: ConfidenceTier;
}

export interface SamplingDna {
  id: string;
  producerId: string;
  sourceTraditions?: string[];
  choppingStyle?: string;
  pitchShifting?: string;
  filtering?: string;
  looping?: string;
  sampleEthics?: string;
  clearanceStatus?: string;
  confidence: ConfidenceTier;
}

export interface StyleNuanceMap {
  id: string;
  producerId: string;
  casualListeners?: string;
  producers?: string;
  engineers?: string;
  artists?: string;
  djs?: string;
  beginnersMisunderstand?: string;
  confidence: ConfidenceTier;
}

// ─── Layer 3 — Creative Direction ────────────────────────────────────────────

export interface InspiredDirection {
  id: string;
  producerId: string;
  direction: string;
  ethicalTranslation: string;
  confidence: ConfidenceTier;
}

export interface CreativeIteration {
  id: string;
  producerId: string;
  iterationNumber: number;
  direction: string;
  confidence: ConfidenceTier;
}

export interface OriginalityWarning {
  id: string;
  producerId: string;
  category:
    | "melody"
    | "drum_pattern"
    | "vocal_tag"
    | "effect_chain"
    | "sample"
    | "arrangement_habit";
  warning: string;
  confidence: ConfidenceTier;
}

export interface FusionPath {
  id: string;
  producerId: string;
  fusionTarget: string;
  fusionType: "producer" | "genre" | "region" | "emotional_target";
  path: string;
  confidence: ConfidenceTier;
}

export type PromptExportType =
  | "beat_making"
  | "song_direction"
  | "daw_session"
  | "stem_generation"
  | "mix_reference"
  | "artist_coaching";

export interface PromptExport {
  id: string;
  producerId: string;
  exportType: PromptExportType;
  prompt: string;
  confidence: ConfidenceTier;
}

// ─── Scoring & capsules ───────────────────────────────────────────────────────

export type DnaScoreDimension =
  | "innovation"
  | "influence"
  | "technicalCraft"
  | "sonicIdentity"
  | "arrangementSkill"
  | "rhythmDesign"
  | "melodicHarmonicIdentity"
  | "soundDesign"
  | "mixingAesthetics"
  | "culturalImportance"
  | "commercialImpact"
  | "undergroundImpact"
  | "longevity"
  | "adaptability"
  | "originality";

export interface ProducerDnaScores {
  producerId: string;
  scores: Record<DnaScoreDimension, number>;
  notes?: string;
  confidence: ConfidenceTier;
}

export interface ProducerDnaCapsule {
  producerId: string;
  name: string;
  countryRegion: string;
  primaryGenres: string[];
  sceneMovement: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  typeBeatInspiredDirection: string;
  originalityTwist: string;
  researchConfidence: string;
}

// ─── Batch & full record ──────────────────────────────────────────────────────

export interface ProducerBatch {
  batchNumber: string;
  title: string;
  genreSceneFocus: string;
  regionFocus: string;
  eraFocus: string;
  producerCount: number;
  selectionCriteria: string[];
}

export interface ProducerDnaRecord {
  producer: Producer;
  aliases: ProducerAlias[];
  works: Work[];
  credits: Credit[];
  sources: Source[];
  gearClaims: GearClaim[];
  collaboratorEdges: CollaboratorEdge[];
  influenceEdges: InfluenceEdge[];
  profile?: ProducerProfile;
  sonicDna?: SonicDna;
  rhythmicDna?: RhythmicDna;
  melodicHarmonicDna?: MelodicHarmonicDna;
  arrangementDna?: ArrangementDna;
  mixingDna?: MixingDna;
  samplingDna?: SamplingDna;
  styleNuanceMap?: StyleNuanceMap;
  inspiredDirections: InspiredDirection[];
  creativeIterations: CreativeIteration[];
  originalityWarnings: OriginalityWarning[];
  fusionPaths: FusionPath[];
  promptExports: PromptExport[];
  scores?: ProducerDnaScores;
  capsule?: ProducerDnaCapsule;
}

export interface ProducerSearchFilters {
  query?: string;
  batchId?: string;
  region?: string;
  genre?: string;
  era?: string;
  confidenceTier?: ConfidenceTier;
  layer?: "verified" | "analytical" | "creative" | "all";
  limit?: number;
  offset?: number;
}

export interface ProducerSearchResult {
  producerId: string;
  name: string;
  region?: string;
  coreDnaAngle?: string;
  matchedFields: string[];
  matchedLayer: "verified" | "analytical" | "creative";
  confidence: ConfidenceTier;
  snippet: string;
}
