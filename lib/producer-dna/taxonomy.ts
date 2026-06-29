export const ERAS = [
  "pre-tape-studio",
  "tape-console",
  "wall-of-sound",
  "dub-soundsystem",
  "disco-electronic-studio",
  "early-hip-hop-sampling",
  "midi-sampler",
  "daw",
  "internet-beatmaker",
  "streaming-social-platform",
  "ai-assisted-production"
] as const;

export type Era = (typeof ERAS)[number];

export const GENRES = [
  "hip-hop",
  "trap",
  "boom-bap",
  "g-funk",
  "drill",
  "grime",
  "uk-garage",
  "dubstep",
  "jungle",
  "drum-and-bass",
  "techno",
  "house",
  "footwork",
  "ambient",
  "idm",
  "synthpop",
  "disco",
  "funk",
  "r-and-b",
  "soul",
  "gospel",
  "rock",
  "punk",
  "metal",
  "reggae",
  "dub",
  "dancehall",
  "afrobeats",
  "amapiano",
  "highlife",
  "reggaeton",
  "dembow",
  "latin-pop",
  "baile-funk",
  "cumbia",
  "salsa",
  "k-pop",
  "j-pop",
  "city-pop",
  "bollywood",
  "arabic-pop",
  "experimental",
  "noise",
  "jazz",
  "film-score",
  "game-score",
  "neo-soul",
  "alternative",
  "indie",
  "shoegaze",
  "industrial",
  "hyperpop",
  "electronic",
  "pop",
  "art-rock"
] as const;

export type Genre = (typeof GENRES)[number];

export const PRODUCER_ROLES = [
  "beatmaker",
  "producer-auteur",
  "studio-producer",
  "engineer-producer",
  "dj-producer",
  "composer-producer",
  "arranger",
  "remixer",
  "sound-designer",
  "executive-producer",
  "label-architect",
  "sampling-architect",
  "vocal-producer",
  "mix-engineer-as-producer",
  "band-member-as-producer",
  "production-collective"
] as const;

export type ProducerRole = (typeof PRODUCER_ROLES)[number];

export const CONFIDENCE_TIERS = ["A", "B", "C", "D", "E", "Unknown"] as const;
export type ConfidenceTier = (typeof CONFIDENCE_TIERS)[number];

export const CONFIDENCE_TIER_LABELS: Record<ConfidenceTier, string> = {
  A: "Primary source / liner notes / official credit / interview",
  B: "Multiple credible secondary sources",
  C: "Listed in open databases, not yet independently verified",
  D: "Audible / musicological analysis",
  E: "Educated hypothesis requiring review",
  Unknown: "Not enough reliable information"
};

export const CREDIT_ROLES = [
  "producer",
  "co-producer",
  "executive-producer",
  "arranger",
  "engineer",
  "mixer",
  "programmer",
  "remixer",
  "composer",
  "beatmaker",
  "sound-designer",
  "dj",
  "sampling-role",
  "vocal-producer",
  "mastering"
] as const;

export type CreditRole = (typeof CREDIT_ROLES)[number];

export const GEAR_CLAIM_STATUS = [
  "confirmed",
  "reported",
  "inferred",
  "unknown"
] as const;
export type GearClaimStatus = (typeof GEAR_CLAIM_STATUS)[number];

export const SOURCE_TYPES = [
  "musicbrainz",
  "discogs",
  "wikidata",
  "whosampled",
  "fma",
  "interview",
  "liner-notes",
  "label",
  "publisher",
  "press",
  "documentary",
  "podcast",
  "social-media",
  "academic",
  "other"
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SCORING_AXES = [
  "innovation",
  "influence",
  "technicalCraft",
  "sonicIdentity",
  "arrangementSkill",
  "rhythmDesign",
  "melodicHarmonicIdentity",
  "soundDesign",
  "mixingAesthetics",
  "culturalImportance",
  "commercialImpact",
  "undergroundImpact",
  "longevity",
  "adaptability",
  "originality"
] as const;

export type ScoringAxis = (typeof SCORING_AXES)[number];
