import type {
  ConfidenceTier,
  EraTag,
  RoleTag
} from "@/lib/producer-dna/types";

export interface LabeledTag<T extends string> {
  value: T;
  label: string;
}

/** Research-confidence tier system. */
export const CONFIDENCE_TIERS: Array<{
  tier: ConfidenceTier;
  meaning: string;
}> = [
  {
    tier: "A",
    meaning:
      "Confirmed by primary source, liner notes, official credits, interview, label, publisher, or direct archive."
  },
  { tier: "B", meaning: "Confirmed by multiple credible secondary sources." },
  {
    tier: "C",
    meaning: "Listed in open databases, but not yet independently verified."
  },
  { tier: "D", meaning: "Audible / musicological analysis." },
  { tier: "E", meaning: "Educated hypothesis requiring review." },
  { tier: "Unknown", meaning: "Not enough reliable information." }
];

/** Era taxonomy (production-technology epochs). */
export const ERA_TAXONOMY: Array<LabeledTag<EraTag>> = [
  { value: "pre-tape-studio", label: "Pre-tape studio era" },
  { value: "tape-console", label: "Tape / console era" },
  { value: "wall-of-sound", label: "Wall of Sound era" },
  { value: "dub-soundsystem", label: "Dub / soundsystem era" },
  { value: "disco-electronic-studio", label: "Disco / electronic studio era" },
  { value: "early-hip-hop-sampling", label: "Early hip-hop sampling era" },
  { value: "midi-sampler", label: "MIDI / sampler era" },
  { value: "daw", label: "DAW era" },
  { value: "internet-beatmaker", label: "Internet beatmaker era" },
  { value: "streaming-social", label: "Streaming / social-platform era" },
  { value: "ai-assisted", label: "AI-assisted production era" }
];

/** Producer-role taxonomy. */
export const ROLE_TAXONOMY: Array<LabeledTag<RoleTag>> = [
  { value: "beatmaker", label: "Beatmaker" },
  { value: "producer-auteur", label: "Producer-auteur" },
  { value: "studio-producer", label: "Studio producer" },
  { value: "engineer-producer", label: "Engineer-producer" },
  { value: "dj-producer", label: "DJ-producer" },
  { value: "composer-producer", label: "Composer-producer" },
  { value: "arranger", label: "Arranger" },
  { value: "remixer", label: "Remixer" },
  { value: "sound-designer", label: "Sound designer" },
  { value: "executive-producer", label: "Executive producer" },
  { value: "label-architect", label: "Label architect" },
  { value: "sampling-architect", label: "Sampling architect" },
  { value: "vocal-producer", label: "Vocal producer" },
  { value: "mix-engineer-producer", label: "Mix engineer as producer" },
  { value: "band-member-producer", label: "Band member as producer" },
  { value: "production-collective", label: "Production collective" }
];

/** Genre / scene taxonomy. */
export const GENRE_TAXONOMY: string[] = [
  "Hip-hop",
  "Trap",
  "Boom bap",
  "G-funk",
  "Drill",
  "Grime",
  "UK garage",
  "Dubstep",
  "Jungle",
  "Drum and bass",
  "Techno",
  "House",
  "Footwork",
  "Ambient",
  "IDM",
  "Synthpop",
  "Disco",
  "Funk",
  "R&B",
  "Soul",
  "Gospel",
  "Rock",
  "Punk",
  "Metal",
  "Reggae",
  "Dub",
  "Dancehall",
  "Afrobeats",
  "Amapiano",
  "Highlife",
  "Reggaeton",
  "Dembow",
  "Latin pop",
  "Baile funk",
  "Cumbia",
  "Salsa",
  "K-pop",
  "J-pop",
  "City pop",
  "Bollywood / Indian film",
  "Arabic pop",
  "Experimental",
  "Noise",
  "Jazz",
  "Film score",
  "Game score"
];

/** Producer DNA scoring rubric dimensions (1–10 each). */
export const SCORE_DIMENSIONS: Array<{
  key: keyof import("@/lib/producer-dna/types").ProducerScores;
  label: string;
}> = [
  { key: "innovation", label: "Innovation" },
  { key: "influence", label: "Influence" },
  { key: "technicalCraft", label: "Technical craft" },
  { key: "sonicIdentity", label: "Sonic identity" },
  { key: "arrangementSkill", label: "Arrangement skill" },
  { key: "rhythmDesign", label: "Rhythm design" },
  { key: "melodicHarmonicIdentity", label: "Melodic / harmonic identity" },
  { key: "soundDesign", label: "Sound design" },
  { key: "mixingAesthetics", label: "Mixing aesthetics" },
  { key: "culturalImportance", label: "Cultural importance" },
  { key: "commercialImpact", label: "Commercial impact" },
  { key: "undergroundImpact", label: "Underground impact" },
  { key: "longevity", label: "Longevity" },
  { key: "adaptability", label: "Adaptability" },
  { key: "originality", label: "Originality" }
];

/** Recommended candidate-source architecture (open / catalogue layers). */
export const SOURCE_ARCHITECTURE: Array<{
  source: string;
  role: string;
}> = [
  {
    source: "MusicBrainz",
    role:
      "Relational, downloadable catalogue: artists, releases, recordings, works, labels, relationships, genres, instruments."
  },
  {
    source: "Discogs",
    role:
      "Release-level credits and contributor roles, versions, track listings, labels."
  },
  {
    source: "Wikidata",
    role:
      "Linked-entity relationships (e.g. producer credits) — treat as linked-data layer, not final authority."
  },
  {
    source: "WhoSampled",
    role: "Sample / remix / cover relationships."
  },
  {
    source: "Free Music Archive (FMA)",
    role:
      "Reference for hierarchical genre taxonomy and audio features/metadata at scale."
  }
];

/** Operating rule: order in which a full profile should be generated. */
export const PROFILE_BUILD_ORDER: string[] = [
  "metadata",
  "source verification",
  "key works",
  "listening analysis",
  "DNA summary",
  "type-beat translation",
  "originality warnings",
  "iteration matrix",
  "scoring",
  "open questions"
];
