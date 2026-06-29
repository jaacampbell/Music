/**
 * Producer DNA Research base — type definitions.
 *
 * Three-layer architecture:
 *   Layer 1 — Verified Metadata (facts only)
 *   Layer 2 — Analytical DNA (musicological analysis)
 *   Layer 3 — Creative Direction (original-music guidance)
 *
 * Every fact-bearing record carries a `confidence` tier so the database can
 * separate verified facts from audible/creative analysis.
 */

/** Research-confidence tier applied to any individual claim or record. */
export type ConfidenceTier =
  /** Primary source: liner notes, official credits, interview, label, publisher, archive. */
  | "A"
  /** Multiple credible secondary sources. */
  | "B"
  /** Open databases (MusicBrainz, Discogs, Wikidata) but not independently verified. */
  | "C"
  /** Audible/musicological analysis. */
  | "D"
  /** Educated hypothesis requiring review. */
  | "E"
  /** Not enough reliable information. */
  | "Unknown";

/** Source reliability tier used in `sources` rows. */
export type SourceReliability = "primary" | "secondary" | "tertiary" | "community";

export type SourceType =
  | "liner-notes"
  | "interview"
  | "label-page"
  | "publisher"
  | "musicbrainz"
  | "discogs"
  | "wikidata"
  | "whosampled"
  | "fma"
  | "article"
  | "video"
  | "podcast"
  | "book"
  | "academic"
  | "other";

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

export type GearStatus = "confirmed" | "reported" | "inferred" | "unknown";

export type ProducerRole =
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
  | "mix-engineer-as-producer"
  | "band-member-as-producer"
  | "production-collective";

export type EraId =
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

/** Producer DNA scoring rubric (1–10 per dimension, never a popularity ranking). */
export interface DnaScore {
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

export type DnaScoreDimension = keyof DnaScore;

/* ---------- Layer 1: Verified Metadata ---------- */

export interface ProducerAlias {
  alias: string;
  /** group, collective, production team, or label identity. */
  context?: string;
  /** approximate period during which the alias was active. */
  period?: string;
  confidence: ConfidenceTier;
}

export interface ProducerRecord {
  /** Stable identifier of the form `PDNA-000001`. */
  id: string;
  name: string;
  realName?: string;
  aliases: ProducerAlias[];
  /** Artist-disclosed only — leave blank otherwise. */
  publicIdentity?: string;
  country: string;
  city?: string;
  region?: string;
  activeYears: string;
  primaryScenes: string[];
  primaryRoles: ProducerRole[];
  officialLinks: string[];
}

export interface WorkRecord {
  id: string;
  producerIds: string[];
  /** track, album, remix, score, placement, game soundtrack, film cue, commercial work. */
  kind:
    | "track"
    | "album"
    | "remix"
    | "score"
    | "placement"
    | "game-soundtrack"
    | "film-cue"
    | "commercial";
  title: string;
  artist: string;
  releaseYear?: number;
  label?: string;
  country?: string;
  /** identifiers: musicbrainz, discogs, isrc, upc, etc. */
  identifiers?: Record<string, string>;
  confidence: ConfidenceTier;
}

export interface CreditRecord {
  workId: string;
  producerId: string;
  role: CreditRole;
  notes?: string;
  confidence: ConfidenceTier;
}

export interface SourceRecord {
  id: string;
  url?: string;
  type: SourceType;
  reliability: SourceReliability;
  dateAccessed?: string;
  claimSupported: string;
  /** quote or summary substantiating the claim. */
  quote?: string;
  cited: boolean;
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
  notes?: string;
  sourceIds?: string[];
}

export interface CollaboratorEdge {
  /** subject is always the producer profile this edge hangs off of. */
  kind:
    | "producer-artist"
    | "producer-producer"
    | "producer-engineer"
    | "producer-label"
    | "producer-scene";
  partner: string;
  notes?: string;
  confidence: ConfidenceTier;
}

export interface InfluenceEdge {
  kind:
    | "influenced-by"
    | "influenced"
    | "adjacent"
    | "opposite-style"
    | "often-confused-with"
    | "cross-genre-parallel";
  partner: string;
  notes?: string;
  confidence: ConfidenceTier;
}

/* ---------- Layer 2: Analytical DNA ---------- */

export interface SonicDna {
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
}

export interface RhythmicDna {
  swing: string;
  gridPrecision: string;
  drumDensity: string;
  grooveFamily: string;
  kickSnarePlacement: string;
  hiHatLanguage: string;
  percussionBehavior: string;
  tempoRanges: string;
}

export interface MelodicHarmonicDna {
  chordMood: string;
  modality: string;
  tonalCenter: string;
  traditionalInfluence: string;
  motifs: string;
  dissonance: string;
  unresolvedTension: string;
}

export interface ArrangementDna {
  introStyle: string;
  dropOrChorus: string;
  loopEvolution: string;
  transitions: string;
  breakdowns: string;
  tensionRelease: string;
  momentDesign: string;
}

export interface MixingDna {
  lowEnd: string;
  midrange: string;
  highEndTexture: string;
  loudness: string;
  stereoField: string;
  vocalPlacement: string;
  reverbDelay: string;
  compression: string;
  saturationOrClipping: string;
}

export interface SamplingDna {
  sourceTraditions: string;
  choppingStyle: string;
  pitchShifting: string;
  filtering: string;
  looping: string;
  sampleEthics: string;
  clearanceStatus: string;
}

export interface StyleNuanceMap {
  casualListeners: string;
  producers: string;
  engineers: string;
  artists: string;
  djs: string;
  beginnersMisunderstand: string;
}

export interface AnalyticalDna {
  /** Main long-form Producer DNA Profile. Tier should normally be D. */
  profileSummary: string;
  sonic: SonicDna;
  rhythmic: RhythmicDna;
  melodicHarmonic: MelodicHarmonicDna;
  arrangement: ArrangementDna;
  mixing: MixingDna;
  sampling: SamplingDna;
  styleNuance: StyleNuanceMap;
  /** Tier applied to all analytical fields above. */
  confidence: ConfidenceTier;
}

/* ---------- Layer 3: Creative Direction ---------- */

export interface InspiredDirection {
  title: string;
  description: string;
  ethicsNote: string;
}

export interface CreativeIteration {
  /** numbered 1..N — at least 10 per full profile. */
  index: number;
  title: string;
  description: string;
}

export interface OriginalityWarning {
  kind:
    | "melody"
    | "drum-pattern"
    | "vocal-tag"
    | "exact-chain"
    | "recognizable-sample"
    | "arrangement-habit"
    | "other";
  description: string;
}

export interface FusionPath {
  with: string;
  description: string;
}

export interface PromptExport {
  surface:
    | "beat-making"
    | "song-direction"
    | "daw-session"
    | "stem-generation"
    | "mix-reference"
    | "artist-coaching";
  prompt: string;
}

export interface CreativeDirection {
  inspired: InspiredDirection[];
  iterations: CreativeIteration[];
  warnings: OriginalityWarning[];
  fusionPaths: FusionPath[];
  promptExports: PromptExport[];
}

/* ---------- Compressed capsule (Batch 001) ---------- */

export interface ProducerCapsule {
  id: string;
  name: string;
  country: string;
  region?: string;
  primaryGenres: string[];
  scene: string;
  coreDnaAngle: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  inspiredDirection: string;
  originalityTwist: string;
  /** Tier blueprint for this capsule's claims. */
  researchConfidence: {
    historicalFacts: ConfidenceTier;
    audibleAnalysis: ConfidenceTier;
  };
}

/** Open research questions to drive the next pass of citations. */
export interface OpenQuestion {
  question: string;
  /** Which tier the answer would unlock (e.g. moving E → B). */
  targetTier: ConfidenceTier;
}

/* ---------- Full profile ---------- */

export interface ProducerProfile {
  producer: ProducerRecord;
  capsule: ProducerCapsule;
  scoring: DnaScore;
  eras: EraId[];
  keyWorks: WorkRecord[];
  credits: CreditRecord[];
  sources: SourceRecord[];
  gear: GearClaim[];
  collaborators: CollaboratorEdge[];
  influences: InfluenceEdge[];
  analytical?: AnalyticalDna;
  creative?: CreativeDirection;
  openQuestions: OpenQuestion[];
}

/* ---------- Batches & taxonomies ---------- */

export interface BatchDefinition {
  id: string;
  number: number;
  title: string;
  focus: string;
  regions: string[];
  eras: EraId[];
  targetCount: number;
  status: "planned" | "in-progress" | "shipped";
}

export interface TaxonomyBundle {
  eras: Array<{ id: EraId; label: string }>;
  genres: string[];
  roles: Array<{ id: ProducerRole; label: string }>;
  confidenceTiers: Array<{ tier: ConfidenceTier; meaning: string }>;
  scoringDimensions: Array<{ id: DnaScoreDimension; label: string }>;
  recommendedSources: Array<{
    id: SourceType;
    label: string;
    purpose: string;
    licenseNote: string;
  }>;
}
