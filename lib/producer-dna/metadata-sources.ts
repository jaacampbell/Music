/** Open/catalogue metadata source architecture for Producer DNA Research. */
export const METADATA_SOURCES = {
  musicbrainz: {
    name: "MusicBrainz",
    role: "primary_catalogue",
    entities: [
      "artists",
      "releases",
      "recordings",
      "works",
      "labels",
      "relationships",
      "genres",
      "instruments"
    ],
    notes: "Relational, downloadable snapshots; strongest for verified credits and relationships"
  },
  discogs: {
    name: "Discogs",
    role: "release_credits",
    entities: [
      "release titles",
      "track listings",
      "credits",
      "versions",
      "artist names",
      "labels",
      "related release metadata"
    ],
    notes: "User-contributed catalogue data; release-level credits and contributor roles"
  },
  wikidata: {
    name: "Wikidata",
    role: "linked_data_layer",
    entities: ["producer credits", "entity relationships", "cross-references"],
    notes: "Linked-data layer, not final authority; connects works to producers"
  },
  whosampled: {
    name: "WhoSampled",
    role: "sample_relationships",
    entities: ["samples", "remixes", "covers", "interpolations"],
    notes: "Sample/remix/cover relationship graph"
  },
  fma: {
    name: "FMA (Free Music Archive)",
    role: "genre_audio_taxonomy",
    entities: ["hierarchical genre taxonomy", "audio features", "metadata at scale"],
    notes: "Reference for genre/audio taxonomy and audio feature metadata"
  }
} as const;

export type MetadataSourceKey = keyof typeof METADATA_SOURCES;
