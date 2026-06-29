// ─────────────────────────────────────────────────────────────
// Producer DNA Research Base — Type Definitions
// ─────────────────────────────────────────────────────────────
// Three-layer architecture:
//   Layer 1 – Verified Metadata (facts + citations)
//   Layer 2 – Analytical DNA (musicological analysis)
//   Layer 3 – Creative Direction (ethical type-beat translation)
// ─────────────────────────────────────────────────────────────

// ── Research Confidence System ──────────────────────────────

export type ConfidenceTier =
  | "A"       // Primary source: liner notes, official credits, interview, archive
  | "B"       // Multiple credible secondary sources
  | "C"       // Open databases (MusicBrainz, Discogs, Wikidata) — not yet independently verified
  | "D"       // Audible / musicological analysis
  | "E"       // Educated hypothesis requiring review
  | "unknown"; // Insufficient reliable information

// ── Era Taxonomy ─────────────────────────────────────────────

export type EraTag =
  | "pre-tape"
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

// ── Genre / Scene Tags ───────────────────────────────────────

export type GenreTag =
  | "hip-hop" | "trap" | "boom-bap" | "g-funk" | "drill" | "grime"
  | "uk-garage" | "dubstep" | "jungle" | "drum-and-bass" | "techno"
  | "house" | "footwork" | "ambient" | "idm" | "synthpop" | "disco"
  | "funk" | "rnb" | "soul" | "gospel" | "rock" | "punk" | "metal"
  | "reggae" | "dub" | "dancehall" | "afrobeats" | "amapiano" | "highlife"
  | "reggaeton" | "dembow" | "latin-pop" | "baile-funk" | "cumbia" | "salsa"
  | "k-pop" | "j-pop" | "city-pop" | "bollywood" | "arabic-pop"
  | "experimental" | "noise" | "jazz" | "film-score" | "game-score"
  | "neo-soul" | "alternative" | "indie" | "shoegaze" | "new-wave"
  | "electronic" | "pop" | "classical" | "hyperpop";

// ── Producer Role Taxonomy ───────────────────────────────────

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

// ── Batch Info ───────────────────────────────────────────────

export interface BatchInfo {
  batchNumber: string;
  genreFocus: string;
  regionFocus: string;
  eraFocus: string;
  totalInBatch: number;
  selectionCriteria: string;
}

// ─────────────────────────────────────────────────────────────
// LAYER 1 — Verified Metadata
// ─────────────────────────────────────────────────────────────

export interface KeyWork {
  title: string;
  artist: string;
  year?: number;
  role: string;
  label?: string;
  confidence: ConfidenceTier;
  notes?: string;
}

export interface GearClaim {
  item: string;
  category: "daw" | "sampler" | "synth" | "drum-machine" | "plugin" | "console" | "studio" | "other";
  confidence: ConfidenceTier;
  source?: string;
  notes?: string;
}

export interface CollaboratorEdge {
  name: string;
  type: "artist" | "producer" | "engineer" | "label" | "scene";
  relationship: string;
}

export interface InfluenceEdge {
  name: string;
  direction: "influenced-by" | "influenced";
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// LAYER 2 — Analytical DNA
// ─────────────────────────────────────────────────────────────

export interface RhythmicDna {
  grooveFamily: string;
  swingAmount: "tight" | "medium" | "loose" | "variable" | "none";
  drumDensity: "sparse" | "medium" | "dense" | "variable";
  kickSnareProfile: string;
  hiHatLanguage: string;
  percussionBehavior?: string;
  tempoRange: string;
  notes: string;
}

export interface MelodicHarmonicDna {
  chordMood: string;
  tonality: string;
  keyInfluences: string[];
  motifs: string;
  dissonanceLevel: "consonant" | "slight-tension" | "dissonant" | "variable";
  notes: string;
}

export interface ArrangementDna {
  introStyle: string;
  loopEvolution: string;
  momentDesign: string;
  transitionApproach?: string;
  notes: string;
}

export interface MixingDna {
  lowEnd: string;
  stereoField: string;
  vocalPlacement: string;
  dynamicsApproach: string;
  reverbDelay: string;
  notes: string;
}

export interface SamplingDna {
  sourceTraditions: string[];
  choppingStyle: string;
  pitchShifting?: string;
  filtering?: string;
  loopBehavior: string;
  sampleEthics?: string;
  notes: string;
}

export interface StyleNuanceMap {
  casualListenersHear: string;
  producersHear: string;
  engineersHear: string;
  artistsFeel: string;
  beginnersMisunderstand: string;
}

export interface SonicDna {
  atmosphere: string;
  warmth: string;
  grit: string;
  polish: string;
  darkness: string;
  brightness: string;
  density: string;
  spaceUse: string;
  syntheticOrganicBalance: string;
}

// ─────────────────────────────────────────────────────────────
// LAYER 3 — Creative Direction
// ─────────────────────────────────────────────────────────────

export interface CreativeDirection {
  typeBeatDirection: string;
  originalityTwist: string;
  warnings: string[];
  fusionPaths: string[];
  promptExports: string[];
}

// ─────────────────────────────────────────────────────────────
// Producer DNA Scoring Rubric
// ─────────────────────────────────────────────────────────────
// Score 1–10 per dimension. Not a popularity ranking.
// A 10/underground + 3/commercial is valid and valuable.

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

// ─────────────────────────────────────────────────────────────
// Master Producer Record (denormalized for store/API use)
// ─────────────────────────────────────────────────────────────

export interface ProducerRecord {
  // Identity
  id: string;              // e.g. PDNA-000001
  batchId: string;         // e.g. "001"
  name: string;
  realName?: string;
  aliases: string[];
  country: string;
  region: string;
  activeYearsStart?: number;
  activeYearsEnd?: number;  // undefined = still active
  primaryScenes: string[];
  genres: GenreTag[];
  eras: EraTag[];
  roles: ProducerRole[];
  coreAngle: string;        // one-line DNA identifier from batch table

  // Layer 1 — Verified Metadata
  keyWorks: KeyWork[];
  gearClaims: GearClaim[];
  influencedBy: InfluenceEdge[];
  influenced: InfluenceEdge[];
  keyCollaborators: CollaboratorEdge[];
  sourceNotes: string[];
  overallConfidence: ConfidenceTier;

  // Layer 2 — Analytical DNA (all D-tier unless otherwise noted)
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  sonicDna: SonicDna;
  rhythmicDna: RhythmicDna;
  melodicHarmonicDna: MelodicHarmonicDna;
  arrangementDna: ArrangementDna;
  mixingDna: MixingDna;
  samplingDna?: SamplingDna;
  styleNuance: StyleNuanceMap;

  // Layer 3 — Creative Direction
  creativeDirection: CreativeDirection;

  // Scoring
  scores: ProducerScores;
}

// ─────────────────────────────────────────────────────────────
// API shapes
// ─────────────────────────────────────────────────────────────

export interface ProducerSummary {
  id: string;
  batchId: string;
  name: string;
  country: string;
  region: string;
  genres: GenreTag[];
  eras: EraTag[];
  coreAngle: string;
  signatureSoundSummary: string;
  overallConfidence: ConfidenceTier;
  scores: ProducerScores;
}

export interface ProducerListResponse {
  producers: ProducerSummary[];
  total: number;
  batchStats: Record<string, number>;
}

export interface ProducerDetailResponse {
  producer: ProducerRecord;
}

export interface ProducerSearchParams {
  q?: string;
  genre?: GenreTag;
  era?: EraTag;
  region?: string;
  batchId?: string;
  role?: ProducerRole;
}
