/** Research-confidence tier for every claim in the Producer DNA system. */
export type ConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

/** How gear/tool claims are sourced. */
export type GearClaimStatus = "confirmed" | "reported" | "inferred" | "unknown";

/** Source reliability for verified metadata. */
export type SourceType =
  | "musicbrainz"
  | "discogs"
  | "wikidata"
  | "whosampled"
  | "fma"
  | "liner_notes"
  | "interview"
  | "official_credit"
  | "label_archive"
  | "press"
  | "other";

export type CitationStatus = "verified" | "pending" | "disputed" | "retracted";

export type CreditRole =
  | "producer"
  | "co-producer"
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

export type WorkType =
  | "track"
  | "album"
  | "remix"
  | "score"
  | "placement"
  | "game_soundtrack"
  | "film_cue"
  | "commercial";

export type CollaboratorEdgeType =
  | "producer_artist"
  | "producer_producer"
  | "producer_engineer"
  | "producer_label"
  | "producer_scene";

export type InfluenceEdgeType =
  | "influenced_by"
  | "influenced"
  | "adjacent"
  | "opposite_style"
  | "often_confused_with"
  | "cross_genre_parallel";

export type PromptExportType =
  | "beat_making"
  | "song_direction"
  | "daw_session"
  | "stem_generation"
  | "mix_reference"
  | "artist_coaching";

export type EthicalDirectionType = "type_beat_translation" | "fusion" | "iteration";

/** Layer 1 — Verified Metadata */

export interface Producer {
  id: string;
  name: string;
  realName: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  activeYears: string | null;
  primaryScenes: string[];
  officialLinks: string[];
  batchId: string;
  coreDnaAngle: string;
  searchableText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProducerAlias {
  id: string;
  producerId: string;
  alias: string;
  aliasType: "alias" | "group" | "collective" | "production_team" | "label_identity";
  timePeriod: string | null;
  confidence: ConfidenceTier;
}

export interface Work {
  id: string;
  producerId: string;
  title: string;
  workType: WorkType;
  releaseYear: number | null;
  artist: string | null;
  label: string | null;
  country: string | null;
  identifiers: Record<string, string>;
  confidence: ConfidenceTier;
}

export interface Credit {
  id: string;
  producerId: string;
  workId: string | null;
  role: CreditRole;
  creditedName: string;
  confidence: ConfidenceTier;
  sourceId: string | null;
}

export interface Source {
  id: string;
  producerId: string;
  url: string;
  sourceType: SourceType;
  dateAccessed: string;
  reliabilityTier: ConfidenceTier;
  claimSupported: string;
  quoteOrSummary: string;
  citationStatus: CitationStatus;
}

export interface GearClaim {
  id: string;
  producerId: string;
  category: "daw" | "sampler" | "synth" | "drum_machine" | "plugin" | "console" | "studio" | "recording_method";
  name: string;
  status: GearClaimStatus;
  confidence: ConfidenceTier;
  notes: string | null;
}

export interface CollaboratorEdge {
  id: string;
  producerId: string;
  targetId: string;
  targetName: string;
  edgeType: CollaboratorEdgeType;
  confidence: ConfidenceTier;
  notes: string | null;
}

export interface InfluenceEdge {
  id: string;
  producerId: string;
  targetId: string;
  targetName: string;
  edgeType: InfluenceEdgeType;
  confidence: ConfidenceTier;
  notes: string | null;
}

/** Layer 2 — Analytical DNA */

export interface ProducerProfile {
  id: string;
  producerId: string;
  longFormProfile: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  researchConfidence: string;
  confidence: ConfidenceTier;
  profileStatus: "capsule" | "draft" | "reviewed" | "published";
  updatedAt: string;
}

export interface SonicDna {
  id: string;
  producerId: string;
  atmosphere: string;
  warmth: string;
  grit: string;
  polish: string;
  darkness: string;
  brightness: string;
  density: string;
  space: string;
  distortion: string;
  syntheticOrganicBalance: string;
  confidence: ConfidenceTier;
}

export interface RhythmicDna {
  id: string;
  producerId: string;
  swing: string;
  gridPrecision: string;
  drumDensity: string;
  grooveFamily: string;
  kickSnarePlacement: string;
  hiHatLanguage: string;
  percussionBehavior: string;
  tempoRanges: string;
  confidence: ConfidenceTier;
}

export interface MelodicHarmonicDna {
  id: string;
  producerId: string;
  chordMood: string;
  modality: string;
  tonalCenter: string;
  influences: string[];
  motifs: string;
  dissonance: string;
  unresolvedTension: string;
  confidence: ConfidenceTier;
}

export interface ArrangementDna {
  id: string;
  producerId: string;
  introStyle: string;
  dropChorusBehavior: string;
  loopEvolution: string;
  transitions: string;
  breakdowns: string;
  tensionRelease: string;
  momentDesign: string;
  confidence: ConfidenceTier;
}

export interface MixingDna {
  id: string;
  producerId: string;
  lowEnd: string;
  midrange: string;
  highEndTexture: string;
  loudness: string;
  stereoField: string;
  vocalPlacement: string;
  reverbDelay: string;
  compression: string;
  saturation: string;
  clipping: string;
  confidence: ConfidenceTier;
}

export interface SamplingDna {
  id: string;
  producerId: string;
  sourceTraditions: string;
  choppingStyle: string;
  pitchShifting: string;
  filtering: string;
  looping: string;
  sampleEthics: string;
  clearanceStatus: string | null;
  confidence: ConfidenceTier;
}

export interface StyleNuanceMap {
  id: string;
  producerId: string;
  casualListeners: string;
  producers: string;
  engineers: string;
  artists: string;
  djs: string;
  beginnersMisunderstand: string;
  confidence: ConfidenceTier;
}

/** Layer 3 — Creative Direction */

export interface InspiredDirection {
  id: string;
  producerId: string;
  title: string;
  description: string;
  ethicalType: EthicalDirectionType;
  confidence: ConfidenceTier;
}

export interface CreativeIteration {
  id: string;
  producerId: string;
  directionNumber: number;
  title: string;
  description: string;
  confidence: ConfidenceTier;
}

export interface OriginalityWarning {
  id: string;
  producerId: string;
  category: string;
  warning: string;
  severity: "high" | "medium" | "low";
}

export interface FusionPath {
  id: string;
  producerId: string;
  fusionTarget: string;
  description: string;
  confidence: ConfidenceTier;
}

export interface PromptExport {
  id: string;
  producerId: string;
  exportType: PromptExportType;
  prompt: string;
  confidence: ConfidenceTier;
}

/** Scoring + batch metadata */

export interface ProducerScores {
  producerId: string;
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
  confidence: ConfidenceTier;
}

export interface ProducerBatch {
  batchNumber: string;
  title: string;
  genreSceneFocus: string;
  regionFocus: string;
  eraFocus: string;
  producerCount: number;
  selectionCriteria: string;
  status: "seeded" | "in_progress" | "complete";
}

/** Compressed capsule format shown before full profile expansion. */

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

/** Full producer record combining all layers. */

export interface ProducerDnaRecord {
  producer: Producer;
  aliases: ProducerAlias[];
  works: Work[];
  credits: Credit[];
  sources: Source[];
  gearClaims: GearClaim[];
  collaboratorEdges: CollaboratorEdge[];
  influenceEdges: InfluenceEdge[];
  profile: ProducerProfile | null;
  sonicDna: SonicDna | null;
  rhythmicDna: RhythmicDna | null;
  melodicHarmonicDna: MelodicHarmonicDna | null;
  arrangementDna: ArrangementDna | null;
  mixingDna: MixingDna | null;
  samplingDna: SamplingDna | null;
  styleNuanceMap: StyleNuanceMap | null;
  inspiredDirections: InspiredDirection[];
  creativeIterations: CreativeIteration[];
  originalityWarnings: OriginalityWarning[];
  fusionPaths: FusionPath[];
  promptExports: PromptExport[];
  scores: ProducerScores | null;
  capsule: ProducerDnaCapsule;
}

/** Search filters across verified facts and analytical fields. */

export interface ProducerDnaSearchFilters {
  query?: string;
  batchId?: string;
  region?: string;
  genre?: string;
  era?: string;
  role?: string;
  confidenceTier?: ConfidenceTier;
  profileStatus?: ProducerProfile["profileStatus"];
  limit?: number;
  offset?: number;
}

export interface ProducerDnaSearchResult {
  producer: Producer;
  capsule: ProducerDnaCapsule;
  scores: ProducerScores | null;
  matchFields: string[];
}
