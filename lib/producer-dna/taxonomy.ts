import type { ResearchConfidenceTier } from "@/lib/producer-dna/types";

export const METADATA_SOURCE_PRIORITY = [
  {
    source: "musicbrainz",
    role: "Core open catalogue for artists, releases, recordings, works, labels, and relationships.",
    authorityPolicy: "Primary catalogue spine for relational entities and IDs."
  },
  {
    source: "discogs",
    role: "Release-level credits, contributor roles, and version-aware release metadata.",
    authorityPolicy: "Secondary verification for credits and release variants."
  },
  {
    source: "wikidata",
    role: "Linked-data layer for entity connections, including producer properties.",
    authorityPolicy: "Graph enrichment, never final authority without corroboration."
  },
  {
    source: "whosampled",
    role: "Sample, remix, and cover relationship mapping.",
    authorityPolicy: "Relation hints that require external verification for high tiers."
  },
  {
    source: "fma",
    role: "Genre/audio taxonomy reference for scalable scene and descriptor mapping.",
    authorityPolicy: "Taxonomy and metadata reference layer."
  }
] as const;

export const RESEARCH_CONFIDENCE_DEFINITIONS: Record<ResearchConfidenceTier, string> = {
  A: "Confirmed by primary source, official credits, label, publisher, or direct archive.",
  B: "Confirmed by multiple credible secondary sources.",
  C: "Listed in open databases but not independently verified yet.",
  D: "Audible or musicological analysis.",
  E: "Educated hypothesis requiring review.",
  Unknown: "Not enough reliable information."
};

export const ERA_TAXONOMY = [
  "pre_tape_studio_era",
  "tape_console_era",
  "wall_of_sound_era",
  "dub_soundsystem_era",
  "disco_electronic_studio_era",
  "early_hip_hop_sampling_era",
  "midi_sampler_era",
  "daw_era",
  "internet_beatmaker_era",
  "streaming_social_platform_era",
  "ai_assisted_production_era"
] as const;

export const GENRE_SCENE_TAXONOMY = [
  "pop",
  "electronic",
  "rap",
  "hip_hop",
  "trap",
  "boom_bap",
  "g_funk",
  "drill",
  "grime",
  "uk_garage",
  "dubstep",
  "jungle",
  "drum_and_bass",
  "techno",
  "house",
  "footwork",
  "ambient",
  "idm",
  "synthpop",
  "disco",
  "funk",
  "rnb",
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
  "latin_pop",
  "baile_funk",
  "cumbia",
  "salsa",
  "k_pop",
  "j_pop",
  "city_pop",
  "bollywood_indian_film_music",
  "arabic_pop",
  "experimental",
  "noise",
  "jazz",
  "classical",
  "film_score",
  "game_score"
] as const;

export const PRODUCER_ROLE_TAXONOMY = [
  "beatmaker",
  "producer_auteur",
  "studio_producer",
  "engineer_producer",
  "dj_producer",
  "composer_producer",
  "arranger",
  "remixer",
  "sound_designer",
  "executive_producer",
  "label_architect",
  "sampling_architect",
  "vocal_producer",
  "mix_engineer_as_producer",
  "band_member_as_producer",
  "production_collective"
] as const;

export const PROFILE_GENERATION_ORDER = [
  "metadata_first",
  "source_verification",
  "key_works",
  "listening_analysis",
  "dna_summary",
  "type_beat_translation",
  "originality_warnings",
  "iteration_matrix",
  "scoring",
  "open_questions"
] as const;
