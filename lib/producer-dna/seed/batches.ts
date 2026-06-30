import type { ProducerBatch } from "@/lib/producer-dna/types";

export const BATCH_001: ProducerBatch = {
  batchNumber: "001",
  title: "Global Foundation Producers",
  genreSceneFocus:
    "Pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, regional club music",
  regionFocus: "US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, Caribbean, Canada",
  eraFocus: "1950s–2020s",
  producerCount: 50,
  selectionCriteria: [
    "Historical importance",
    "Technical influence",
    "Recognizable production identity",
    "Cross-genre usefulness",
    "Cultural impact",
    "Diversity of region/scene",
    "Future database value"
  ],
  status: "seeded"
};

export const BATCH_002: ProducerBatch = {
  batchNumber: "002",
  title: "Hip-Hop Foundations",
  genreSceneFocus:
    "Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago",
  regionFocus: "United States",
  eraFocus: "1970s–2000s",
  producerCount: 30,
  selectionCriteria: ["Regional scene founders", "Sampling pioneers", "Drum architecture innovators"],
  status: "seeded"
};

export const BATCH_003: ProducerBatch = {
  batchNumber: "003",
  title: "Atlanta Trap / Modern Rap Production Trees",
  genreSceneFocus:
    "Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap",
  regionFocus: "Atlanta, Southern US",
  eraFocus: "1990s–2020s",
  producerCount: 25,
  selectionCriteria: ["Trap architecture", "808 evolution", "Production lineage mapping"],
  status: "seeded"
};

export const FUTURE_BATCHES: ProducerBatch[] = [
  {
    batchNumber: "004",
    title: "Dub, Reggae, Dancehall, Soundsystem Producers",
    genreSceneFocus: "Jamaica, UK dub, digital dancehall, reggaeton connections",
    regionFocus: "Jamaica, UK, Caribbean",
    eraFocus: "1960s–2020s",
    producerCount: 0,
    selectionCriteria: ["Soundsystem culture", "Mixer-as-composer tradition", "Bass architecture"]
  },
  {
    batchNumber: "005",
    title: "Electronic Foundations",
    genreSceneFocus: "Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM",
    regionFocus: "Germany, US, UK, Europe",
    eraFocus: "1970s–2000s",
    producerCount: 0,
    selectionCriteria: ["Sequencer logic", "Machine minimalism", "Club music architecture"]
  },
  {
    batchNumber: "006",
    title: "UK Bass Continuum",
    genreSceneFocus: "Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline",
    regionFocus: "United Kingdom",
    eraFocus: "1990s–2020s",
    producerCount: 0,
    selectionCriteria: ["Bass weight evolution", "Shuffle/garage feel", "Soundsystem-to-club pipeline"]
  },
  {
    batchNumber: "007",
    title: "Afrobeats, Amapiano, Highlife, African Club Music",
    genreSceneFocus: "Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers",
    regionFocus: "Africa, diaspora",
    eraFocus: "1960s–2020s",
    producerCount: 0,
    selectionCriteria: ["Rhythmic bounce", "Regional groove languages", "Global crossover impact"]
  },
  {
    batchNumber: "008",
    title: "Latin, Caribbean, Reggaeton, Dembow, Funk Carioca",
    genreSceneFocus: "Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina",
    regionFocus: "Latin America, Caribbean",
    eraFocus: "1970s–2020s",
    producerCount: 0,
    selectionCriteria: ["Dembow architecture", "Club-reggaeton foundations", "Regional fusion"]
  },
  {
    batchNumber: "009",
    title: "Pop Architects and Vocal Producers",
    genreSceneFocus: "Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems",
    regionFocus: "Global",
    eraFocus: "1980s–2020s",
    producerCount: 0,
    selectionCriteria: ["Hook architecture", "Vocal production craft", "Chorus engineering"]
  },
  {
    batchNumber: "010",
    title: "Rock, Alternative, Punk, Metal, Indie Studio Producers",
    genreSceneFocus: "Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers",
    regionFocus: "US, UK, global",
    eraFocus: "1960s–2020s",
    producerCount: 0,
    selectionCriteria: ["Room sound", "Performance realism", "Texture-forward rock"]
  },
  {
    batchNumber: "011",
    title: "Film, Game, Ambient, Experimental, Sound Design Producers",
    genreSceneFocus:
      "Film composers, game composers, modular artists, sample-library innovators, sound designers",
    regionFocus: "Global",
    eraFocus: "1950s–2020s",
    producerCount: 0,
    selectionCriteria: ["Cinematic scale", "Modular/experimental craft", "Immersive sound design"]
  }
];

export const ALL_BATCHES: ProducerBatch[] = [BATCH_001, BATCH_002, BATCH_003, ...FUTURE_BATCHES];

export const ROADMAP_TARGET_PRODUCERS = 100_000;
