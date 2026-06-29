export type ResearchConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

export type SourceType =
  | "musicbrainz"
  | "discogs"
  | "wikidata"
  | "whosampled"
  | "fma"
  | "official_site"
  | "interview"
  | "label_archive"
  | "publisher_archive"
  | "internal_note";

export type GearClaimStatus = "confirmed" | "reported" | "inferred" | "unknown";

export type WorkType =
  | "track"
  | "album"
  | "remix"
  | "score"
  | "placement"
  | "game_soundtrack"
  | "film_cue"
  | "commercial_work";

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
  | "sampling_role";

export interface ProducerEntity {
  producerId: string;
  name: string;
  realName: string | null;
  aliases: string[];
  publicIdentity: string | null;
  country: string;
  city: string | null;
  region: string;
  activeYears: string;
  primaryScenes: string[];
  officialLinks: string[];
}

export interface ProducerAliasEntity {
  producerId: string;
  alias: string;
  aliasType: "alias" | "group_name" | "collective" | "production_team" | "label_identity";
  timePeriodUsed: string | null;
}

export interface WorkEntity {
  workId: string;
  producerId: string;
  title: string;
  type: WorkType;
  releaseYear: number | null;
  artist: string;
  label: string | null;
  country: string | null;
  identifiers: Partial<{
    musicbrainzId: string;
    discogsId: string;
    wikidataId: string;
    isrc: string;
    upc: string;
  }>;
}

export interface CreditEntity {
  creditId: string;
  producerId: string;
  workId: string | null;
  role: CreditRole;
  creditedAs: string;
  confidenceTier: ResearchConfidenceTier;
  notes: string;
}

export interface SourceEntity {
  sourceId: string;
  producerId: string;
  sourceUrl: string;
  sourceType: SourceType;
  dateAccessed: string;
  reliabilityTier: ResearchConfidenceTier;
  claimSupported: string;
  quoteOrSummary: string;
  citationStatus: "pending" | "verified" | "needs_review";
}

export interface GearClaimEntity {
  claimId: string;
  producerId: string;
  category:
    | "daw"
    | "sampler"
    | "synth"
    | "drum_machine"
    | "plugin"
    | "console"
    | "studio"
    | "recording_method";
  value: string;
  claimStatus: GearClaimStatus;
  confidenceTier: ResearchConfidenceTier;
  sourceId: string | null;
}

export interface CollaboratorEdgeEntity {
  edgeId: string;
  producerId: string;
  targetType: "artist" | "producer" | "engineer" | "label" | "scene";
  targetName: string;
  relationLabel: string;
  confidenceTier: ResearchConfidenceTier;
}

export interface InfluenceEdgeEntity {
  edgeId: string;
  producerId: string;
  targetName: string;
  relation:
    | "influenced_by"
    | "influenced"
    | "adjacent"
    | "opposite_style"
    | "often_confused_with"
    | "cross_genre_parallel";
  confidenceTier: ResearchConfidenceTier;
  notes: string;
}

export interface ProducerProfileEntity {
  producerId: string;
  capsuleSummary: string;
  artisticDna: string;
  technicalDna: string;
  researchConfidence: ResearchConfidenceTier;
}

export interface SonicDnaEntity {
  producerId: string;
  atmosphere: number;
  warmth: number;
  grit: number;
  polish: number;
  darkness: number;
  brightness: number;
  density: number;
  space: number;
  distortion: number;
  syntheticOrganicBalance: number;
  analysisTier: ResearchConfidenceTier;
}

export interface RhythmicDnaEntity {
  producerId: string;
  swing: string;
  gridPrecision: string;
  drumDensity: string;
  grooveFamily: string;
  kickSnarePlacement: string;
  hihatLanguage: string;
  percussionBehavior: string;
  tempoRanges: string[];
  analysisTier: ResearchConfidenceTier;
}

export interface MelodicHarmonicDnaEntity {
  producerId: string;
  chordMood: string;
  modality: string;
  tonalCenterBehavior: string;
  influences: string[];
  motifs: string;
  dissonanceProfile: string;
  unresolvedTensionProfile: string;
  analysisTier: ResearchConfidenceTier;
}

export interface ArrangementDnaEntity {
  producerId: string;
  introStyle: string;
  dropOrChorusBehavior: string;
  loopEvolution: string;
  transitions: string;
  breakdowns: string;
  tensionRelease: string;
  momentDesign: string;
  analysisTier: ResearchConfidenceTier;
}

export interface MixingDnaEntity {
  producerId: string;
  lowEnd: string;
  midrange: string;
  highEndTexture: string;
  loudness: string;
  stereoField: string;
  vocalPlacement: string;
  reverbDelay: string;
  compression: string;
  saturationClipping: string;
  analysisTier: ResearchConfidenceTier;
}

export interface SamplingDnaEntity {
  producerId: string;
  sourceTraditions: string;
  choppingStyle: string;
  pitchShifting: string;
  filtering: string;
  looping: string;
  sampleEthics: string;
  clearanceStatus: string;
  analysisTier: ResearchConfidenceTier;
}

export interface StyleNuanceMapEntity {
  producerId: string;
  casualListener: string;
  producers: string;
  engineers: string;
  artists: string;
  djs: string;
  beginnerMisunderstanding: string;
  analysisTier: ResearchConfidenceTier;
}

export interface InspiredDirectionEntity {
  producerId: string;
  directionId: string;
  title: string;
  ethicalTranslation: string;
  intendedEmotion: string;
  avoidImitationNotes: string[];
}

export interface CreativeIterationEntity {
  producerId: string;
  iterationId: string;
  label: string;
  promptSeed: string;
  originalityTwist: string;
}

export interface OriginalityWarningEntity {
  producerId: string;
  warningId: string;
  category:
    | "melody"
    | "drum_pattern"
    | "vocal_tag"
    | "processing_chain"
    | "recognizable_sample"
    | "arrangement_habit";
  warning: string;
}

export interface FusionPathEntity {
  producerId: string;
  pathId: string;
  combineWith: string;
  genreOrRegionTarget: string;
  emotionalTarget: string;
  approach: string;
}

export interface PromptExportEntity {
  producerId: string;
  exportId: string;
  useCase:
    | "beat_making"
    | "song_direction"
    | "daw_session"
    | "stem_generation"
    | "mix_reference"
    | "artist_coaching";
  prompt: string;
}

export interface ProducerDnaScore {
  innovation: number | null;
  influence: number | null;
  technicalCraft: number | null;
  sonicIdentity: number | null;
  arrangementSkill: number | null;
  rhythmDesign: number | null;
  melodicHarmonicIdentity: number | null;
  soundDesign: number | null;
  mixingAesthetics: number | null;
  culturalImportance: number | null;
  commercialImpact: number | null;
  undergroundImpact: number | null;
  longevity: number | null;
  adaptability: number | null;
  originality: number | null;
}

export interface ProducerDnaTaxonomyTags {
  eras: string[];
  genres: string[];
  scenes: string[];
  producerRoles: string[];
}

export interface SearchableProducerFields {
  verifiedFields: string[];
  analyticalFields: string[];
  creativeFields: string[];
  verifiedSearchText: string;
  analyticalSearchText: string;
  creativeSearchText: string;
  globalSearchText: string;
}

export interface ProducerDnaRecord {
  batchNumber: string;
  producer: ProducerEntity;
  producerAliases: ProducerAliasEntity[];
  works: WorkEntity[];
  credits: CreditEntity[];
  sources: SourceEntity[];
  gearClaims: GearClaimEntity[];
  collaboratorEdges: CollaboratorEdgeEntity[];
  influenceEdges: InfluenceEdgeEntity[];
  producerProfile: ProducerProfileEntity;
  sonicDna: SonicDnaEntity;
  rhythmicDna: RhythmicDnaEntity;
  melodicHarmonicDna: MelodicHarmonicDnaEntity;
  arrangementDna: ArrangementDnaEntity;
  mixingDna: MixingDnaEntity;
  samplingDna: SamplingDnaEntity;
  styleNuanceMap: StyleNuanceMapEntity;
  inspiredDirections: InspiredDirectionEntity[];
  creativeIterations: CreativeIterationEntity[];
  originalityWarnings: OriginalityWarningEntity[];
  fusionPaths: FusionPathEntity[];
  promptExports: PromptExportEntity[];
  dnaScores: ProducerDnaScore;
  taxonomy: ProducerDnaTaxonomyTags;
  openQuestions: string[];
  searchable: SearchableProducerFields;
}

export interface ProducerDnaQuery {
  q?: string;
  searchScope?: "all" | "verified" | "analysis" | "creative";
  genres?: string[];
  scenes?: string[];
  producerRoles?: string[];
  eras?: string[];
  regions?: string[];
  confidenceTiers?: ResearchConfidenceTier[];
  limit?: number;
}
