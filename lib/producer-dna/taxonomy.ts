import type {
  BatchDefinition,
  ConfidenceTier,
  DnaScoreDimension,
  EraId,
  ProducerRole,
  SourceType,
  TaxonomyBundle
} from "@/lib/producer-dna/types";

export const ERAS: Array<{ id: EraId; label: string }> = [
  { id: "pre-tape-studio", label: "Pre-tape studio era" },
  { id: "tape-console", label: "Tape/console era" },
  { id: "wall-of-sound", label: "Wall of Sound era" },
  { id: "dub-soundsystem", label: "Dub/soundsystem era" },
  { id: "disco-electronic-studio", label: "Disco/electronic studio era" },
  { id: "early-hip-hop-sampling", label: "Early hip-hop sampling era" },
  { id: "midi-sampler", label: "MIDI/sampler era" },
  { id: "daw", label: "DAW era" },
  { id: "internet-beatmaker", label: "Internet beatmaker era" },
  { id: "streaming-social", label: "Streaming/social-platform era" },
  { id: "ai-assisted", label: "AI-assisted production era" }
];

export const GENRES: string[] = [
  "hip-hop",
  "trap",
  "boom bap",
  "g-funk",
  "drill",
  "grime",
  "uk garage",
  "dubstep",
  "jungle",
  "drum and bass",
  "techno",
  "house",
  "footwork",
  "ambient",
  "idm",
  "synthpop",
  "disco",
  "funk",
  "r&b",
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
  "latin pop",
  "baile funk",
  "cumbia",
  "salsa",
  "k-pop",
  "j-pop",
  "city pop",
  "bollywood",
  "arabic pop",
  "experimental",
  "noise",
  "jazz",
  "film score",
  "game score"
];

export const ROLES: Array<{ id: ProducerRole; label: string }> = [
  { id: "beatmaker", label: "Beatmaker" },
  { id: "producer-auteur", label: "Producer-auteur" },
  { id: "studio-producer", label: "Studio producer" },
  { id: "engineer-producer", label: "Engineer-producer" },
  { id: "dj-producer", label: "DJ-producer" },
  { id: "composer-producer", label: "Composer-producer" },
  { id: "arranger", label: "Arranger" },
  { id: "remixer", label: "Remixer" },
  { id: "sound-designer", label: "Sound designer" },
  { id: "executive-producer", label: "Executive producer" },
  { id: "label-architect", label: "Label architect" },
  { id: "sampling-architect", label: "Sampling architect" },
  { id: "vocal-producer", label: "Vocal producer" },
  { id: "mix-engineer-as-producer", label: "Mix engineer as producer" },
  { id: "band-member-as-producer", label: "Band member as producer" },
  { id: "production-collective", label: "Production collective" }
];

export const CONFIDENCE_TIERS: Array<{ tier: ConfidenceTier; meaning: string }> = [
  {
    tier: "A",
    meaning:
      "Confirmed by primary source: liner notes, official credits, interview, label, publisher, or direct archive."
  },
  { tier: "B", meaning: "Confirmed by multiple credible secondary sources." },
  {
    tier: "C",
    meaning: "Listed in open databases (MusicBrainz, Discogs, Wikidata) but not independently verified."
  },
  { tier: "D", meaning: "Audible/musicological analysis." },
  { tier: "E", meaning: "Educated hypothesis requiring review." },
  { tier: "Unknown", meaning: "Not enough reliable information." }
];

export const SCORING_DIMENSIONS: Array<{ id: DnaScoreDimension; label: string }> = [
  { id: "innovation", label: "Innovation" },
  { id: "influence", label: "Influence" },
  { id: "technicalCraft", label: "Technical craft" },
  { id: "sonicIdentity", label: "Sonic identity" },
  { id: "arrangementSkill", label: "Arrangement skill" },
  { id: "rhythmDesign", label: "Rhythm design" },
  { id: "melodicHarmonicIdentity", label: "Melodic/harmonic identity" },
  { id: "soundDesign", label: "Sound design" },
  { id: "mixingAesthetics", label: "Mixing aesthetics" },
  { id: "culturalImportance", label: "Cultural importance" },
  { id: "commercialImpact", label: "Commercial impact" },
  { id: "undergroundImpact", label: "Underground impact" },
  { id: "longevity", label: "Longevity" },
  { id: "adaptability", label: "Adaptability" },
  { id: "originality", label: "Originality" }
];

export const RECOMMENDED_SOURCES: Array<{
  id: SourceType;
  label: string;
  purpose: string;
  licenseNote: string;
}> = [
  {
    id: "musicbrainz",
    label: "MusicBrainz",
    purpose:
      "Relational, downloadable catalogue for artists, releases, recordings, works, labels, relationships, genres, instruments.",
    licenseNote: "CC0 core data; downloadable snapshots available."
  },
  {
    id: "discogs",
    label: "Discogs",
    purpose: "Release-level credits, contributor roles, versions, label and pressing detail.",
    licenseNote: "User-contributed; API has rate limits and ToS restrictions on bulk reuse."
  },
  {
    id: "wikidata",
    label: "Wikidata",
    purpose:
      "Linked-entity relationships such as producer credits (P162); treat as a linked-data layer, not the final authority.",
    licenseNote: "CC0 statements; verify against primary sources."
  },
  {
    id: "whosampled",
    label: "WhoSampled",
    purpose: "Sample, remix, cover, and interpolation relationships.",
    licenseNote: "Proprietary content; cite with permission and link out."
  },
  {
    id: "fma",
    label: "Free Music Archive (FMA)",
    purpose: "Reference genre/audio taxonomy with a large hierarchical genre tree and audio features at scale.",
    licenseNote: "Per-track licenses vary; useful as a taxonomy reference."
  },
  {
    id: "liner-notes",
    label: "Liner notes",
    purpose: "Primary credit source for physical and digital releases.",
    licenseNote: "Quote sparingly; cite catalog/pressing identifier."
  },
  {
    id: "interview",
    label: "Interview",
    purpose: "Self-reported gear/process detail from the producer.",
    licenseNote: "Cite outlet, date, interviewer; self-reports are still B-tier unless corroborated."
  },
  {
    id: "label-page",
    label: "Label page",
    purpose: "Official roster, release credits, biographies.",
    licenseNote: "Corporate-controlled; treat marketing claims as B-tier at best."
  },
  {
    id: "publisher",
    label: "Publisher / PRO",
    purpose: "Songwriter, publishing, split, and work-registration data.",
    licenseNote: "BMI/ASCAP/SOCAN/PRS public lookups; verify against ISRC and ISWC."
  }
];

export const TAXONOMY: TaxonomyBundle = {
  eras: ERAS,
  genres: GENRES,
  roles: ROLES,
  confidenceTiers: CONFIDENCE_TIERS,
  scoringDimensions: SCORING_DIMENSIONS,
  recommendedSources: RECOMMENDED_SOURCES
};

export const BATCHES: BatchDefinition[] = [
  {
    id: "BATCH-001",
    number: 1,
    title: "Global foundation producers",
    focus:
      "Global foundation producers across pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club music.",
    regions: [
      "US",
      "UK",
      "Jamaica",
      "Europe",
      "Japan",
      "India",
      "Africa",
      "Latin America",
      "Caribbean",
      "Canada"
    ],
    eras: [
      "wall-of-sound",
      "tape-console",
      "dub-soundsystem",
      "disco-electronic-studio",
      "early-hip-hop-sampling",
      "midi-sampler",
      "daw",
      "internet-beatmaker",
      "streaming-social"
    ],
    targetCount: 50,
    status: "in-progress"
  },
  {
    id: "BATCH-002",
    number: 2,
    title: "Hip-Hop foundations",
    focus: "Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago.",
    regions: ["US"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-003",
    number: 3,
    title: "Atlanta trap / modern rap production trees",
    focus:
      "Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap.",
    regions: ["US"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-004",
    number: 4,
    title: "Dub, reggae, dancehall, soundsystem producers",
    focus: "Jamaica, UK dub, digital dancehall, reggaeton connections.",
    regions: ["Jamaica", "UK", "Latin America", "Caribbean"],
    eras: ["dub-soundsystem", "midi-sampler", "daw"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-005",
    number: 5,
    title: "Electronic foundations",
    focus: "Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM.",
    regions: ["Germany", "US", "UK"],
    eras: ["disco-electronic-studio", "midi-sampler", "daw"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-006",
    number: 6,
    title: "UK bass continuum",
    focus: "Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline.",
    regions: ["UK"],
    eras: ["midi-sampler", "daw", "internet-beatmaker"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-007",
    number: 7,
    title: "Afrobeats, amapiano, highlife, African club music",
    focus: "Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers.",
    regions: ["Africa"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-008",
    number: 8,
    title: "Latin, Caribbean, reggaeton, dembow, funk carioca",
    focus:
      "Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina.",
    regions: ["Latin America", "Caribbean"],
    eras: ["midi-sampler", "daw", "streaming-social"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-009",
    number: 9,
    title: "Pop architects and vocal producers",
    focus: "Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems.",
    regions: ["Sweden", "US", "UK", "Korea", "Japan"],
    eras: ["midi-sampler", "daw", "streaming-social"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-010",
    number: 10,
    title: "Rock, alternative, punk, metal, indie studio producers",
    focus: "Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers.",
    regions: ["US", "UK", "Europe"],
    eras: ["tape-console", "midi-sampler", "daw"],
    targetCount: 100,
    status: "planned"
  },
  {
    id: "BATCH-011",
    number: 11,
    title: "Film, game, ambient, experimental, sound design producers",
    focus: "Film composers, game composers, modular artists, sample-library innovators, sound designers.",
    regions: ["Global"],
    eras: ["tape-console", "midi-sampler", "daw", "ai-assisted"],
    targetCount: 100,
    status: "planned"
  }
];

/**
 * Recommended order for generating a full profile.
 * Used by the UI/agent to keep research disciplined.
 */
export const FULL_PROFILE_PIPELINE: string[] = [
  "metadata first",
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
