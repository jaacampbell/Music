import type { ProducerBatch } from "@/lib/producer-dna/types";

export const BATCH_001: ProducerBatch = {
  batchNumber: "001",
  title: "Global Foundation Producers",
  genreSceneFocus:
    "Global foundation producers across pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club music",
  regionFocus: "US, UK, Jamaica, Europe, Japan, India, Africa, Latin America, Caribbean, Canada",
  eraFocus: "1950s–2020s",
  producerCount: 50,
  selectionCriteria:
    "Historical importance, technical influence, recognizable production identity, cross-genre usefulness, cultural impact, diversity of region/scene, and future database value",
  status: "seeded"
};

/** Roadmap batches 002–011 toward 100,000 producers. */
export const FUTURE_BATCHES: Array<Pick<ProducerBatch, "batchNumber" | "title" | "genreSceneFocus">> = [
  {
    batchNumber: "002",
    title: "Hip-Hop Foundations",
    genreSceneFocus:
      "Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago"
  },
  {
    batchNumber: "003",
    title: "Atlanta Trap / Modern Rap Production Trees",
    genreSceneFocus:
      "Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap"
  },
  {
    batchNumber: "004",
    title: "Dub, Reggae, Dancehall, Soundsystem Producers",
    genreSceneFocus: "Jamaica, UK dub, digital dancehall, reggaeton connections"
  },
  {
    batchNumber: "005",
    title: "Electronic Foundations",
    genreSceneFocus:
      "Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM"
  },
  {
    batchNumber: "006",
    title: "UK Bass Continuum",
    genreSceneFocus:
      "Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline"
  },
  {
    batchNumber: "007",
    title: "Afrobeats, Amapiano, Highlife, African Club Music",
    genreSceneFocus: "Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers"
  },
  {
    batchNumber: "008",
    title: "Latin, Caribbean, Reggaeton, Dembow, Funk Carioca",
    genreSceneFocus:
      "Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina"
  },
  {
    batchNumber: "009",
    title: "Pop Architects and Vocal Producers",
    genreSceneFocus:
      "Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems"
  },
  {
    batchNumber: "010",
    title: "Rock, Alternative, Punk, Metal, Indie Studio Producers",
    genreSceneFocus:
      "Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers"
  },
  {
    batchNumber: "011",
    title: "Film, Game, Ambient, Experimental, Sound Design Producers",
    genreSceneFocus:
      "Film composers, game composers, modular artists, sample-library innovators, sound designers"
  }
];

export const ALL_BATCHES: ProducerBatch[] = [BATCH_001];
