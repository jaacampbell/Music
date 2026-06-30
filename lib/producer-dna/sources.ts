/**
 * Open/catalogue metadata source definitions for Producer DNA research.
 */

import type { SourceType } from "@/lib/producer-dna/types";

export interface MetadataSourceDefinition {
  id: SourceType;
  name: string;
  role: string;
  authorityLevel: "primary_catalogue" | "linked_data" | "community_catalogue" | "analysis_reference";
  dataDomains: string[];
  notes: string;
}

export const METADATA_SOURCES: MetadataSourceDefinition[] = [
  {
    id: "musicbrainz",
    name: "MusicBrainz",
    role: "Relational open catalogue for artists, releases, recordings, works, labels, relationships, genres, instruments",
    authorityLevel: "primary_catalogue",
    dataDomains: [
      "artists",
      "releases",
      "recordings",
      "works",
      "labels",
      "relationships",
      "genres",
      "instruments"
    ],
    notes:
      "Especially useful: relational schema, downloadable snapshots, cross-entity relationships. Treat as catalogue layer (Tier C) until independently verified."
  },
  {
    id: "discogs",
    name: "Discogs",
    role: "Release-level credits and contributor roles from user-contributed catalogue",
    authorityLevel: "community_catalogue",
    dataDomains: [
      "release_titles",
      "track_listings",
      "credits",
      "versions",
      "artist_names",
      "labels",
      "release_metadata"
    ],
    notes:
      "Strong for release-level producer credits and role granularity. User-contributed — verify against primary sources when possible."
  },
  {
    id: "wikidata",
    name: "Wikidata",
    role: "Linked-entity relationships including producer credits via P162 (producer)",
    authorityLevel: "linked_data",
    dataDomains: ["producer_credits", "entity_relationships", "cross_references"],
    notes:
      "Linked-data layer, not final authority. Use to connect works to producers and discover citation trails."
  },
  {
    id: "whosampled",
    name: "WhoSampled",
    role: "Sample, remix, and cover relationship mapping",
    authorityLevel: "community_catalogue",
    dataDomains: ["samples", "remixes", "covers", "interpolations"],
    notes: "Valuable for sampling DNA and influence edges. Community-sourced — mark Tier C unless corroborated."
  },
  {
    id: "fma",
    name: "Free Music Archive (FMA)",
    role: "Hierarchical genre taxonomy and audio features/metadata at scale",
    authorityLevel: "analysis_reference",
    dataDomains: ["genre_taxonomy", "audio_features", "metadata"],
    notes: "Reference for genre/audio taxonomy alignment, not producer biography."
  },
  {
    id: "liner_notes",
    name: "Liner notes / sleeve credits",
    role: "Primary credit verification",
    authorityLevel: "primary_catalogue",
    dataDomains: ["credits", "gear", "studio", "personnel"],
    notes: "Tier A when directly photographed or archived from original release."
  },
  {
    id: "interview",
    name: "Interviews / documentaries",
    role: "Primary or secondary source for process, gear, and intent",
    authorityLevel: "primary_catalogue",
    dataDomains: ["gear", "process", "influences", "studio"],
    notes: "Tier A when direct quote from producer; Tier B when reported by credible outlet."
  },
  {
    id: "official_credit",
    name: "Official credits (DSP, publisher, PRO)",
    role: "Rights and credit verification",
    authorityLevel: "primary_catalogue",
    dataDomains: ["credits", "works", "publishing"],
    notes: "Watch for miscredits in older, underground, remix, and sample-based records."
  },
  {
    id: "audible_analysis",
    name: "Audible / musicological analysis",
    role: "Layer 2 analytical DNA input",
    authorityLevel: "analysis_reference",
    dataDomains: ["sonic_dna", "rhythmic_dna", "arrangement_dna", "mixing_dna"],
    notes: "Always Tier D. Separate from verified metadata."
  }
];

export const getSourceById = (id: SourceType): MetadataSourceDefinition | undefined =>
  METADATA_SOURCES.find((s) => s.id === id);
