export type ResearchConfidenceTier = "A" | "B" | "C" | "D" | "E" | "Unknown";

export type ProducerDnaLayer =
  | "verified-metadata"
  | "analytical-dna"
  | "creative-direction";

export interface ProducerDnaTableDefinition {
  layer: ProducerDnaLayer;
  tableName: string;
  purpose: string;
  searchableFields: string[];
}

export interface ProducerDnaSourceOption {
  id: string;
  name: string;
  role: string;
  bestFor: string[];
  caution: string;
  accessPattern: string;
  homepage: string;
}

export interface ConfidenceTierDefinition {
  tier: ResearchConfidenceTier;
  meaning: string;
}

export interface ProducerDnaSeed {
  id: string;
  name: string;
  regionScene: string;
  coreDnaAngle: string;
  metadataConfidence: ResearchConfidenceTier;
  analysisConfidence: ResearchConfidenceTier;
  taxonomyTags: string[];
  searchableFacts: string[];
  searchableAnalysis: string[];
  searchableCreative: string[];
}

export interface ProducerDnaBatch {
  batchNumber: string;
  focus: {
    genreScene: string;
    region: string;
    era: string;
  };
  producerCount: number;
  selectionCriteria: string[];
  seeds: ProducerDnaSeed[];
}

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

export const PRODUCER_DNA_SOURCE_OPTIONS: ProducerDnaSourceOption[] = [
  {
    id: "musicbrainz",
    name: "MusicBrainz",
    role: "Open relational catalogue backbone",
    bestFor: [
      "artists",
      "releases",
      "recordings",
      "works",
      "labels",
      "relationships",
      "genres",
      "instruments",
      "downloadable snapshots"
    ],
    caution:
      "Treat as catalogue metadata that still needs confidence labels and source reconciliation.",
    accessPattern: "API plus downloadable database snapshots",
    homepage: "https://musicbrainz.org/doc/MusicBrainz_Database"
  },
  {
    id: "discogs",
    name: "Discogs",
    role: "Release-level credit and contributor role enrichment",
    bestFor: [
      "release titles",
      "track listings",
      "credits",
      "versions",
      "artist names",
      "labels",
      "release metadata"
    ],
    caution:
      "User-contributed data; verify high-impact claims before promoting above C tier.",
    accessPattern: "API subject to Discogs terms",
    homepage: "https://www.discogs.com/developers"
  },
  {
    id: "wikidata",
    name: "Wikidata",
    role: "Linked-entity relationship layer",
    bestFor: [
      "producer properties",
      "entity identifiers",
      "cross-database links",
      "work-to-person relationships"
    ],
    caution:
      "Use as linked data, not final authority for contested producer credits.",
    accessPattern: "SPARQL endpoint and entity APIs",
    homepage: "https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service"
  },
  {
    id: "whosampled",
    name: "WhoSampled",
    role: "Sample, remix, interpolation, and cover relationship reference",
    bestFor: ["sample relationships", "remixes", "covers", "interpolations"],
    caution:
      "Confirm permissions before ingestion; store only permitted relationship metadata.",
    accessPattern: "Licensed/manual reference depending on terms",
    homepage: "https://www.whosampled.com"
  },
  {
    id: "fma",
    name: "Free Music Archive",
    role: "Genre/audio taxonomy and feature reference",
    bestFor: [
      "hierarchical genre taxonomy",
      "audio features",
      "large-scale music metadata examples"
    ],
    caution:
      "Use as taxonomy inspiration and feature-shape reference, not producer-credit authority.",
    accessPattern: "Dataset/reference materials",
    homepage: "https://github.com/mdeff/fma"
  }
];

export const PRODUCER_DNA_TABLES: ProducerDnaTableDefinition[] = [
  {
    layer: "verified-metadata",
    tableName: "producers",
    purpose: "Stores artist-disclosed and catalogue-backed producer identities.",
    searchableFields: [
      "producerId",
      "name",
      "realName",
      "aliases",
      "genderPublicIdentity",
      "country",
      "city",
      "region",
      "activeYears",
      "primaryScenes",
      "officialLinks"
    ]
  },
  {
    layer: "verified-metadata",
    tableName: "producer_aliases",
    purpose: "Tracks aliases, collectives, group names, labels, and time-bounded identities.",
    searchableFields: ["producerId", "alias", "groupName", "collective", "labelIdentity", "timePeriodUsed"]
  },
  {
    layer: "verified-metadata",
    tableName: "works",
    purpose: "Stores tracks, albums, remixes, scores, placements, cues, and identifiers.",
    searchableFields: [
      "workId",
      "title",
      "workType",
      "releaseYear",
      "artist",
      "label",
      "country",
      "identifiers"
    ]
  },
  {
    layer: "verified-metadata",
    tableName: "credits",
    purpose: "Separates contributor roles from general fame or reputation.",
    searchableFields: [
      "producer",
      "coProducer",
      "executiveProducer",
      "arranger",
      "engineer",
      "mixer",
      "programmer",
      "remixer",
      "composer",
      "beatmaker",
      "soundDesigner",
      "dj",
      "samplingRole"
    ]
  },
  {
    layer: "verified-metadata",
    tableName: "sources",
    purpose: "Stores evidence and citation state for every claim.",
    searchableFields: [
      "sourceUrl",
      "sourceType",
      "dateAccessed",
      "reliabilityTier",
      "claimSupported",
      "quoteSummary",
      "citationStatus"
    ]
  },
  {
    layer: "verified-metadata",
    tableName: "gear_claims",
    purpose: "Labels tools and studios as confirmed, reported, inferred, or unknown.",
    searchableFields: [
      "daw",
      "sampler",
      "synth",
      "drumMachine",
      "plugin",
      "console",
      "studio",
      "recordingMethod",
      "claimStatus"
    ]
  },
  {
    layer: "verified-metadata",
    tableName: "collaborator_edges",
    purpose: "Stores producer-to-artist, producer, engineer, label, and scene graph links.",
    searchableFields: ["fromProducer", "toArtist", "toProducer", "toEngineer", "toLabel", "toScene"]
  },
  {
    layer: "verified-metadata",
    tableName: "influence_edges",
    purpose: "Stores directional, adjacent, opposite, confused-with, and cross-genre relationships.",
    searchableFields: [
      "influencedBy",
      "influenced",
      "adjacent",
      "oppositeStyle",
      "oftenConfusedWith",
      "crossGenreParallel"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "producer_profiles",
    purpose: "Stores long-form Producer DNA Profiles after source verification.",
    searchableFields: ["producerId", "profileText", "openQuestions", "reviewStatus"]
  },
  {
    layer: "analytical-dna",
    tableName: "sonic_dna",
    purpose: "Captures audible texture and tone without confusing it for verified fact.",
    searchableFields: [
      "atmosphere",
      "warmth",
      "grit",
      "polish",
      "darkness",
      "brightness",
      "density",
      "space",
      "distortion",
      "syntheticOrganicBalance"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "rhythmic_dna",
    purpose: "Captures pocket, timing, groove, and drum-language analysis.",
    searchableFields: [
      "swing",
      "gridPrecision",
      "drumDensity",
      "grooveFamily",
      "kickPlacement",
      "snarePlacement",
      "hiHatLanguage",
      "percussionBehavior",
      "tempoRanges"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "melodic_harmonic_dna",
    purpose: "Captures harmonic mood, modality, motifs, and unresolved tension.",
    searchableFields: [
      "chordMood",
      "modality",
      "tonalCenter",
      "jazzInfluence",
      "gospelInfluence",
      "bluesInfluence",
      "classicalInfluence",
      "folkRegionalInfluence",
      "motifs",
      "dissonance",
      "unresolvedTension"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "arrangement_dna",
    purpose: "Captures how sections move, develop, break, and release tension.",
    searchableFields: [
      "introStyle",
      "dropBehavior",
      "chorusBehavior",
      "loopEvolution",
      "transitions",
      "breakdowns",
      "tensionRelease",
      "momentDesign"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "mixing_dna",
    purpose: "Captures mix aesthetics as analysis fields.",
    searchableFields: [
      "lowEnd",
      "midrange",
      "highEndTexture",
      "loudness",
      "stereoField",
      "vocalPlacement",
      "reverbDelay",
      "compression",
      "saturation",
      "clipping"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "sampling_dna",
    purpose: "Captures sample traditions and transformation habits.",
    searchableFields: [
      "sourceTraditions",
      "choppingStyle",
      "pitchShifting",
      "filtering",
      "looping",
      "sampleEthics",
      "clearanceStatus"
    ]
  },
  {
    layer: "analytical-dna",
    tableName: "style_nuance_map",
    purpose: "Separates how different listener groups perceive the same producer.",
    searchableFields: [
      "casualListenersHear",
      "producersHear",
      "engineersHear",
      "artistsFeel",
      "djsNotice",
      "beginnersMisunderstand"
    ]
  },
  {
    layer: "creative-direction",
    tableName: "inspired_directions",
    purpose: "Turns analysis into rights-safe original beat directions.",
    searchableFields: ["producerId", "ethicalTranslation", "referenceSafeTraits", "avoidanceRules"]
  },
  {
    layer: "creative-direction",
    tableName: "creative_iterations",
    purpose: "Stores ten or more original directions per producer.",
    searchableFields: ["producerId", "iterationNumber", "directionName", "creativeBrief", "targetUse"]
  },
  {
    layer: "creative-direction",
    tableName: "originality_warnings",
    purpose: "Defines what not to copy.",
    searchableFields: [
      "melodies",
      "signatureDrumPatterns",
      "vocalTags",
      "exactChains",
      "recognizableSamples",
      "patentedArrangementHabits"
    ]
  },
  {
    layer: "creative-direction",
    tableName: "fusion_paths",
    purpose: "Combines creative logic across producers, genres, regions, or emotions.",
    searchableFields: ["producerA", "producerB", "genre", "region", "emotionalTarget", "fusionPrompt"]
  },
  {
    layer: "creative-direction",
    tableName: "prompt_exports",
    purpose: "Outputs clean prompts for beat-making, DAW sessions, stems, mixes, and coaching.",
    searchableFields: ["beatPrompt", "songDirection", "dawSessionPrompt", "stemPrompt", "mixReference", "artistCoaching"]
  }
];

export const CONFIDENCE_TIERS: ConfidenceTierDefinition[] = [
  {
    tier: "A",
    meaning:
      "Confirmed by primary source, liner notes, official credits, interview, label, publisher, or direct archive."
  },
  {
    tier: "B",
    meaning: "Confirmed by multiple credible secondary sources."
  },
  {
    tier: "C",
    meaning: "Listed in open databases, but not yet independently verified."
  },
  {
    tier: "D",
    meaning: "Audible or musicological analysis."
  },
  {
    tier: "E",
    meaning: "Educated hypothesis requiring review."
  },
  {
    tier: "Unknown",
    meaning: "Not enough reliable information."
  }
];

export const PRODUCER_DNA_TAXONOMY = {
  eras: [
    "pre-tape studio era",
    "tape/console era",
    "wall of sound era",
    "dub/soundsystem era",
    "disco/electronic studio era",
    "early hip-hop sampling era",
    "MIDI/sampler era",
    "DAW era",
    "internet beatmaker era",
    "streaming/social-platform era",
    "AI-assisted production era"
  ],
  genreScenes: [
    "hip-hop",
    "trap",
    "boom bap",
    "G-funk",
    "drill",
    "grime",
    "UK garage",
    "dubstep",
    "jungle",
    "drum and bass",
    "techno",
    "house",
    "footwork",
    "ambient",
    "IDM",
    "synthpop",
    "disco",
    "funk",
    "R&B",
    "soul",
    "gospel",
    "rock",
    "punk",
    "metal",
    "reggae",
    "dub",
    "dancehall",
    "Afrobeats",
    "amapiano",
    "highlife",
    "reggaeton",
    "dembow",
    "Latin pop",
    "baile funk/funk carioca",
    "cumbia",
    "salsa",
    "K-pop",
    "J-pop",
    "city pop",
    "Bollywood/Indian film music",
    "Arabic pop",
    "experimental",
    "noise",
    "jazz",
    "film score",
    "game score"
  ],
  producerRoles: [
    "beatmaker",
    "producer-auteur",
    "studio producer",
    "engineer-producer",
    "DJ-producer",
    "composer-producer",
    "arranger",
    "remixer",
    "sound designer",
    "executive producer",
    "label architect",
    "sampling architect",
    "vocal producer",
    "mix engineer as producer",
    "band member as producer",
    "production collective"
  ]
};

export const PRODUCER_DNA_SCORING_RUBRIC = [
  "innovation",
  "influence",
  "technical craft",
  "sonic identity",
  "arrangement skill",
  "rhythm design",
  "melodic/harmonic identity",
  "sound design",
  "mixing aesthetics",
  "cultural importance",
  "commercial impact",
  "underground impact",
  "longevity",
  "adaptability",
  "originality"
];

export const PRODUCER_DNA_OPERATING_ORDER = [
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

const makeSeed = (
  id: string,
  name: string,
  regionScene: string,
  coreDnaAngle: string,
  taxonomyTags: string[]
): ProducerDnaSeed => ({
  id,
  name,
  regionScene,
  coreDnaAngle,
  metadataConfidence: "C",
  analysisConfidence: "D",
  taxonomyTags,
  searchableFacts: [id, name, regionScene],
  searchableAnalysis: [coreDnaAngle, ...taxonomyTags],
  searchableCreative: [
    `Original direction inspired by ${name}: translate ${coreDnaAngle.toLowerCase()} into new source material, new melodies, and rights-safe arrangement choices.`
  ]
});

export const BATCH_001_SEEDS: ProducerDnaSeed[] = [
  makeSeed(
    "PDNA-000001",
    "George Martin",
    "UK pop/rock studio era",
    "Arrangement-as-production, orchestral pop architecture, studio imagination",
    ["pop", "rock", "studio producer", "arranger", "tape/console era"]
  ),
  makeSeed(
    "PDNA-000002",
    "Phil Spector",
    "US pop",
    "Dense mono drama, layered percussion, wall arrangement thinking",
    ["pop", "wall of sound era", "studio producer"]
  ),
  makeSeed(
    "PDNA-000003",
    "Quincy Jones",
    "US jazz/R&B/pop",
    "Sophisticated arrangement, groove polish, elite collaborator architecture",
    ["jazz", "R&B", "pop", "arranger", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000004",
    "Brian Eno",
    "UK art rock/ambient",
    "Systems, atmosphere, generative texture, emotional minimalism",
    ["ambient", "art rock", "sound designer", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000005",
    "Lee \"Scratch\" Perry",
    "Jamaica dub/reggae",
    "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism",
    ["dub", "reggae", "dub/soundsystem era", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000006",
    "King Tubby",
    "Jamaica dub",
    "Mixer-as-composer, space, delay throws, bass-and-drum architecture",
    ["dub", "reggae", "mix engineer as producer", "dub/soundsystem era"]
  ),
  makeSeed(
    "PDNA-000007",
    "Giorgio Moroder",
    "Italy/Germany disco/electronic",
    "Sequenced propulsion, synth disco, machine sensuality",
    ["disco", "electronic", "synthpop", "disco/electronic studio era"]
  ),
  makeSeed(
    "PDNA-000008",
    "Tom Dowd",
    "US soul/rock/jazz",
    "Engineering innovation, live feel, multitrack clarity",
    ["soul", "rock", "jazz", "engineer-producer", "tape/console era"]
  ),
  makeSeed(
    "PDNA-000009",
    "Teo Macero",
    "US jazz",
    "Tape editing, jazz architecture, post-performance composition",
    ["jazz", "arranger", "tape/console era"]
  ),
  makeSeed(
    "PDNA-000010",
    "Sylvia Robinson",
    "US soul/early hip-hop",
    "Label vision, early rap record architecture, commercial bridge-building",
    ["soul", "hip-hop", "label architect", "early hip-hop sampling era"]
  ),
  makeSeed(
    "PDNA-000011",
    "Rick Rubin",
    "US hip-hop/rock",
    "Reduction, rawness, cross-genre minimal power",
    ["hip-hop", "rock", "producer-auteur", "studio producer"]
  ),
  makeSeed(
    "PDNA-000012",
    "Dr. Dre",
    "US West Coast hip-hop",
    "Low-end authority, polished menace, vocal pocket control",
    ["hip-hop", "G-funk", "producer-auteur", "mixing aesthetics"]
  ),
  makeSeed(
    "PDNA-000013",
    "J Dilla",
    "Detroit hip-hop",
    "Humanized swing, asymmetry, emotional imperfection",
    ["hip-hop", "boom bap", "sampling architect", "MIDI/sampler era"]
  ),
  makeSeed(
    "PDNA-000014",
    "DJ Premier",
    "New York boom bap",
    "Chopped grit, scratched hooks, drum-loop authority",
    ["hip-hop", "boom bap", "DJ-producer", "sampling architect"]
  ),
  makeSeed(
    "PDNA-000015",
    "RZA",
    "Staten Island/Wu-Tang",
    "Dusty soul, martial arts cinema, raw texture, minor-key mythology",
    ["hip-hop", "boom bap", "producer-auteur", "sampling architect"]
  ),
  makeSeed(
    "PDNA-000016",
    "Timbaland",
    "Virginia hip-hop/R&B/pop",
    "Percussive futurism, negative space, vocal rhythm as drum language",
    ["hip-hop", "R&B", "pop", "rhythm design", "vocal producer"]
  ),
  makeSeed(
    "PDNA-000017",
    "The Neptunes",
    "Virginia pop/rap/R&B",
    "Sparse bounce, synthetic funk, weird minimal hooks",
    ["hip-hop", "R&B", "pop", "production collective", "sound design"]
  ),
  makeSeed(
    "PDNA-000018",
    "Missy Elliott",
    "Virginia hip-hop/R&B",
    "Vocal-producer imagination, playful futurism, rhythm-first song design",
    ["hip-hop", "R&B", "vocal producer", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000019",
    "Metro Boomin",
    "Atlanta trap",
    "Dark cinematic trap, negative space, 808 mood architecture",
    ["trap", "hip-hop", "beatmaker", "DAW era"]
  ),
  makeSeed(
    "PDNA-000020",
    "Mike WiLL Made-It",
    "Atlanta trap/pop rap",
    "Elastic 808s, hard minimal loops, hook-forward trap design",
    ["trap", "hip-hop", "pop rap", "beatmaker", "DAW era"]
  ),
  makeSeed(
    "PDNA-000021",
    "Zaytoven",
    "Atlanta trap/gospel",
    "Church chords, loose piano, trap bounce, human touch",
    ["trap", "gospel", "hip-hop", "beatmaker"]
  ),
  makeSeed(
    "PDNA-000022",
    "Lex Luger",
    "Southern trap",
    "Maximal brass/synth aggression, hard snare energy",
    ["trap", "hip-hop", "beatmaker", "internet beatmaker era"]
  ),
  makeSeed(
    "PDNA-000023",
    "Southside",
    "Atlanta trap",
    "Dark drum programming, high-energy 808 pressure",
    ["trap", "hip-hop", "beatmaker", "production collective"]
  ),
  makeSeed(
    "PDNA-000024",
    "Madlib",
    "California underground hip-hop",
    "Crate-digging collage, raw loops, jazz-damaged texture",
    ["hip-hop", "jazz", "sampling architect", "underground impact"]
  ),
  makeSeed(
    "PDNA-000025",
    "Pete Rock",
    "New York hip-hop",
    "Warm horn loops, soul-jazz chops, head-nod elegance",
    ["hip-hop", "boom bap", "soul", "sampling architect"]
  ),
  makeSeed(
    "PDNA-000026",
    "Marley Marl",
    "Queensbridge hip-hop",
    "Sampling architecture, drum reconstruction, early beat science",
    ["hip-hop", "early hip-hop sampling era", "sampling architect"]
  ),
  makeSeed(
    "PDNA-000027",
    "DJ Screw",
    "Houston",
    "Slowed time, syrup atmosphere, remix-as-worldbuilding",
    ["hip-hop", "DJ-producer", "remixer", "underground impact"]
  ),
  makeSeed(
    "PDNA-000028",
    "SOPHIE",
    "UK/Scotland hyperpop/electronic",
    "Plastic-metal sound design, extreme synthetic physicality",
    ["electronic", "experimental", "sound designer", "DAW era"]
  ),
  makeSeed(
    "PDNA-000029",
    "Arca",
    "Venezuela/global experimental pop",
    "Mutant sound design, body-horror beauty, fractured rhythm",
    ["experimental", "pop", "sound designer", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000030",
    "Burial",
    "UK garage/dubstep",
    "Ghostly urban ambience, shuffled drums, emotional decay",
    ["UK garage", "dubstep", "ambient", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000031",
    "Aphex Twin",
    "UK/Ireland IDM",
    "Algorithmic rhythm, alien melody, playful technical extremity",
    ["IDM", "ambient", "electronic", "sound designer"]
  ),
  makeSeed(
    "PDNA-000032",
    "Daft Punk",
    "France house/pop",
    "Robotic funk, filter-house memory, vocoder mythology",
    ["house", "pop", "disco", "production collective"]
  ),
  makeSeed(
    "PDNA-000033",
    "Kraftwerk",
    "Germany electronic",
    "Machine minimalism, sequencer logic, electronic-pop foundation",
    ["electronic", "synthpop", "production collective", "disco/electronic studio era"]
  ),
  makeSeed(
    "PDNA-000034",
    "Wendy Carlos",
    "US electronic/classical",
    "Synth translation, timbre discipline, electronic orchestration",
    ["electronic", "classical", "composer-producer", "sound designer"]
  ),
  makeSeed(
    "PDNA-000035",
    "Ryuichi Sakamoto",
    "Japan/global",
    "Elegant harmony, electronic-acoustic fusion, cinematic restraint",
    ["film score", "electronic", "city pop", "composer-producer"]
  ),
  makeSeed(
    "PDNA-000036",
    "Yasutaka Nakata",
    "Japan J-pop/electro",
    "Glossy synthetic pop, vocal processing, kawaii-futurist precision",
    ["J-pop", "electronic", "vocal producer", "DAW era"]
  ),
  makeSeed(
    "PDNA-000037",
    "A. R. Rahman",
    "India film/pop",
    "Orchestral-electronic fusion, spiritual melody, cinematic scale",
    ["Bollywood/Indian film music", "film score", "composer-producer"]
  ),
  makeSeed(
    "PDNA-000038",
    "Max Martin",
    "Sweden pop",
    "Hook architecture, melodic math, chorus engineering",
    ["pop", "vocal producer", "songwriter-producer systems"]
  ),
  makeSeed(
    "PDNA-000039",
    "Shellback",
    "Sweden pop",
    "Modern pop punch, guitar/synth hybrid hooks",
    ["pop", "rock", "vocal producer", "DAW era"]
  ),
  makeSeed(
    "PDNA-000040",
    "Nile Rodgers",
    "US disco/funk/pop",
    "Guitar groove architecture, live-dance precision, elegant repetition",
    ["disco", "funk", "pop", "producer-auteur"]
  ),
  makeSeed(
    "PDNA-000041",
    "Trevor Horn",
    "UK synthpop/new wave",
    "Hyper-detailed pop production, studio maximalism, digital sheen",
    ["synthpop", "pop", "studio producer", "sound design"]
  ),
  makeSeed(
    "PDNA-000042",
    "Flood",
    "UK alternative/electronic rock",
    "Industrial space, texture-forward rock, atmospheric mixing",
    ["rock", "electronic", "engineer-producer", "mixing aesthetics"]
  ),
  makeSeed(
    "PDNA-000043",
    "Nigel Godrich",
    "UK alternative rock",
    "Intimate abstraction, band texture, emotional digital-era space",
    ["rock", "alternative", "studio producer", "mixing aesthetics"]
  ),
  makeSeed(
    "PDNA-000044",
    "Steve Albini",
    "US alternative rock",
    "Raw room sound, anti-gloss recording, performance realism",
    ["rock", "punk", "engineer-producer", "room sound"]
  ),
  makeSeed(
    "PDNA-000045",
    "Linda Perry",
    "US pop/rock",
    "Song-first emotional production, vocal-centered arrangements",
    ["pop", "rock", "vocal producer", "songwriter-producer systems"]
  ),
  makeSeed(
    "PDNA-000046",
    "Tainy",
    "Puerto Rico reggaeton/Latin pop",
    "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere",
    ["reggaeton", "dembow", "Latin pop", "DAW era"]
  ),
  makeSeed(
    "PDNA-000047",
    "Luny Tunes",
    "Puerto Rico reggaeton",
    "Classic dembow architecture, club-reggaeton foundations",
    ["reggaeton", "dembow", "production collective", "club music"]
  ),
  makeSeed(
    "PDNA-000048",
    "Sarz",
    "Nigeria Afrobeats",
    "Clean rhythmic bounce, melodic restraint, Afropop polish",
    ["Afrobeats", "highlife", "pop", "rhythm design"]
  ),
  makeSeed(
    "PDNA-000049",
    "Kabza De Small",
    "South Africa amapiano",
    "Log-drum language, hypnotic piano loops, long-form groove",
    ["amapiano", "house", "African club music", "rhythm design"]
  ),
  makeSeed(
    "PDNA-000050",
    "DJ Rashad",
    "Chicago footwork",
    "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed",
    ["footwork", "house", "sampling architect", "DJ-producer"]
  )
];

export const BATCH_001: ProducerDnaBatch = {
  batchNumber: "001",
  focus: {
    genreScene:
      "Global foundation producers across pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club music",
    region: "US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, Caribbean, Canada",
    era: "1950s-2020s"
  },
  producerCount: BATCH_001_SEEDS.length,
  selectionCriteria: [
    "historical importance",
    "technical influence",
    "recognizable production identity",
    "cross-genre usefulness",
    "cultural impact",
    "diversity of region/scene",
    "future database value"
  ],
  seeds: BATCH_001_SEEDS
};

export const J_DILLA_CAPSULE: ProducerDnaCapsule = {
  producerId: "PDNA-000013",
  name: "J Dilla",
  countryRegion: "United States / Detroit",
  primaryGenres: ["hip-hop", "neo-soul", "underground rap"],
  sceneMovement: "Detroit beat scene, Soulquarians-adjacent production culture",
  signatureSoundSummary:
    "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection.",
  artisticDna:
    "Dilla's deeper logic is not just swing. It is the feeling that the machine is breathing. His beats often feel slightly bent, intimate, warm, and conversational.",
  technicalDna:
    "Verified tools must be researched per source. Audible analysis suggests sampler-centered construction, non-rigid quantization, warm low-mid texture, and loop transformation.",
  rhythmicDna:
    "Loose kicks, late snares, swung hats, and microtiming that feels human rather than sloppy.",
  melodicHarmonicDna:
    "Soul/jazz/gospel fragments, short motifs, bittersweet chord color, unresolved emotional loops.",
  arrangementDna:
    "Often loop-based, but replay value comes from pocket, texture, chops, drops, and subtle variation.",
  typeBeatInspiredDirection:
    "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Avoid copying exact drum timing, sample choices, or recognizable chop patterns.",
  originalityTwist:
    "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
  researchConfidence:
    "Mixed: historical facts need citation; audible analysis can be marked as D-tier analysis."
};

export const NEXT_PRODUCER_DNA_BATCHES = [
  "Batch 002 - Hip-Hop Foundations: Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago.",
  "Batch 003 - Atlanta Trap / Modern Rap Production Trees: Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap.",
  "Batch 004 - Dub, Reggae, Dancehall, Soundsystem Producers: Jamaica, UK dub, digital dancehall, reggaeton connections.",
  "Batch 005 - Electronic Foundations: Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM.",
  "Batch 006 - UK Bass Continuum: Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline.",
  "Batch 007 - Afrobeats, Amapiano, Highlife, African Club Music: Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers.",
  "Batch 008 - Latin, Caribbean, Reggaeton, Dembow, Funk Carioca: Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina.",
  "Batch 009 - Pop Architects and Vocal Producers: Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems.",
  "Batch 010 - Rock, Alternative, Punk, Metal, Indie Studio Producers: Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers.",
  "Batch 011 - Film, Game, Ambient, Experimental, Sound Design Producers: Film composers, game composers, modular artists, sample-library innovators, sound designers."
];

export const producerDnaSearchText = (seed: ProducerDnaSeed): string =>
  [
    seed.id,
    seed.name,
    seed.regionScene,
    seed.coreDnaAngle,
    ...seed.taxonomyTags,
    ...seed.searchableFacts,
    ...seed.searchableAnalysis,
    ...seed.searchableCreative
  ]
    .join(" ")
    .toLowerCase();

export const searchProducerDnaSeeds = (
  query: string,
  confidenceTier?: ResearchConfidenceTier
): ProducerDnaSeed[] => {
  const normalized = query.trim().toLowerCase();
  return BATCH_001_SEEDS.filter((seed) => {
    const matchesQuery = normalized.length === 0 || producerDnaSearchText(seed).includes(normalized);
    const matchesTier =
      !confidenceTier ||
      seed.metadataConfidence === confidenceTier ||
      seed.analysisConfidence === confidenceTier;
    return matchesQuery && matchesTier;
  });
};
