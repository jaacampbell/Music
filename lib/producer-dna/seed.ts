import type {
  ConfidenceTier,
  Era,
  Genre,
  ProducerRole
} from "@/lib/producer-dna/taxonomy";

/**
 * Batch 001 — Global foundation producers across pop, hip-hop, electronic,
 * dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional
 * club music. 50 entries covering 1950s–2020s.
 *
 * Each entry carries the user-provided ID, region/scene, and "Core DNA
 * angle" verbatim. Genre / role / era arrays are first-pass taxonomy
 * normalisations and should be reviewed against open catalogue sources
 * (MusicBrainz, Discogs, Wikidata) before being elevated above tier C.
 */
export interface SeedProducer {
  id: string;
  name: string;
  country?: string;
  region?: string;
  city?: string;
  primaryScenes: string[];
  primaryGenres: Genre[];
  primaryRoles: ProducerRole[];
  primaryEras: Era[];
  coreDnaAngle: string;
  researchConfidence: ConfidenceTier;
  activeYearsStart?: number;
  activeYearsEnd?: number;
}

export const BATCH_001_PRODUCERS: SeedProducer[] = [
  {
    id: "PDNA-000001",
    name: "George Martin",
    country: "United Kingdom",
    region: "London",
    primaryScenes: ["UK pop/rock studio era"],
    primaryGenres: ["pop", "rock"],
    primaryRoles: ["studio-producer", "arranger", "composer-producer"],
    primaryEras: ["tape-console"],
    coreDnaAngle:
      "Arrangement-as-production, orchestral pop architecture, studio imagination",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000002",
    name: "Phil Spector",
    country: "United States",
    region: "Los Angeles",
    primaryScenes: ["US pop"],
    primaryGenres: ["pop"],
    primaryRoles: ["studio-producer", "producer-auteur"],
    primaryEras: ["wall-of-sound"],
    coreDnaAngle: "Dense mono drama, layered percussion, \"wall\" arrangement thinking",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000003",
    name: "Quincy Jones",
    country: "United States",
    primaryScenes: ["US jazz/R&B/pop"],
    primaryGenres: ["jazz", "r-and-b", "pop"],
    primaryRoles: ["studio-producer", "arranger", "composer-producer", "executive-producer"],
    primaryEras: ["tape-console", "disco-electronic-studio", "midi-sampler"],
    coreDnaAngle:
      "Sophisticated arrangement, groove polish, elite collaborator architecture",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000004",
    name: "Brian Eno",
    country: "United Kingdom",
    primaryScenes: ["UK art rock/ambient"],
    primaryGenres: ["ambient", "art-rock", "electronic"],
    primaryRoles: ["producer-auteur", "sound-designer", "composer-producer"],
    primaryEras: ["tape-console", "disco-electronic-studio", "midi-sampler", "daw"],
    coreDnaAngle: "Systems, atmosphere, generative texture, emotional minimalism",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000005",
    name: "Lee \"Scratch\" Perry",
    country: "Jamaica",
    primaryScenes: ["Jamaica dub/reggae"],
    primaryGenres: ["dub", "reggae"],
    primaryRoles: ["producer-auteur", "engineer-producer"],
    primaryEras: ["tape-console", "dub-soundsystem"],
    coreDnaAngle:
      "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000006",
    name: "King Tubby",
    country: "Jamaica",
    city: "Kingston",
    primaryScenes: ["Jamaica dub"],
    primaryGenres: ["dub", "reggae"],
    primaryRoles: ["engineer-producer", "mix-engineer-as-producer"],
    primaryEras: ["tape-console", "dub-soundsystem"],
    coreDnaAngle:
      "Mixer-as-composer, space, delay throws, bass-and-drum architecture",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000007",
    name: "Giorgio Moroder",
    country: "Italy",
    region: "Munich",
    primaryScenes: ["Italy/Germany disco/electronic"],
    primaryGenres: ["disco", "electronic", "synthpop"],
    primaryRoles: ["producer-auteur", "composer-producer"],
    primaryEras: ["disco-electronic-studio", "midi-sampler"],
    coreDnaAngle: "Sequenced propulsion, synth disco, machine sensuality",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000008",
    name: "Tom Dowd",
    country: "United States",
    primaryScenes: ["US soul/rock/jazz"],
    primaryGenres: ["soul", "rock", "jazz", "r-and-b"],
    primaryRoles: ["engineer-producer", "studio-producer"],
    primaryEras: ["tape-console"],
    coreDnaAngle: "Engineering innovation, live feel, multitrack clarity",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000009",
    name: "Teo Macero",
    country: "United States",
    primaryScenes: ["US jazz"],
    primaryGenres: ["jazz"],
    primaryRoles: ["studio-producer", "composer-producer"],
    primaryEras: ["tape-console"],
    coreDnaAngle:
      "Tape editing, jazz architecture, post-performance composition",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000010",
    name: "Sylvia Robinson",
    country: "United States",
    primaryScenes: ["US soul/early hip-hop"],
    primaryGenres: ["soul", "hip-hop"],
    primaryRoles: ["executive-producer", "label-architect", "producer-auteur"],
    primaryEras: ["disco-electronic-studio", "early-hip-hop-sampling"],
    coreDnaAngle:
      "Label vision, early rap record architecture, commercial bridge-building",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000011",
    name: "Rick Rubin",
    country: "United States",
    primaryScenes: ["US hip-hop/rock"],
    primaryGenres: ["hip-hop", "rock", "metal"],
    primaryRoles: ["producer-auteur", "studio-producer"],
    primaryEras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    coreDnaAngle: "Reduction, rawness, cross-genre minimal power",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000012",
    name: "Dr. Dre",
    country: "United States",
    region: "West Coast",
    city: "Compton",
    primaryScenes: ["US West Coast hip-hop"],
    primaryGenres: ["hip-hop", "g-funk"],
    primaryRoles: ["producer-auteur", "executive-producer", "mix-engineer-as-producer"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle: "Low-end authority, polished menace, vocal pocket control",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000013",
    name: "J Dilla",
    country: "United States",
    region: "Detroit",
    primaryScenes: ["Detroit hip-hop", "Soulquarians-adjacent production culture"],
    primaryGenres: ["hip-hop", "neo-soul"],
    primaryRoles: ["beatmaker", "sampling-architect", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle: "Humanized swing, asymmetry, emotional imperfection",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000014",
    name: "DJ Premier",
    country: "United States",
    region: "New York",
    primaryScenes: ["New York boom bap"],
    primaryGenres: ["hip-hop", "boom-bap"],
    primaryRoles: ["beatmaker", "dj-producer", "sampling-architect"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle: "Chopped grit, scratched hooks, drum-loop authority",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000015",
    name: "RZA",
    country: "United States",
    region: "Staten Island",
    primaryScenes: ["Staten Island/Wu-Tang"],
    primaryGenres: ["hip-hop"],
    primaryRoles: ["producer-auteur", "sampling-architect", "composer-producer"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Dusty soul, martial arts cinema, raw texture, minor-key mythology",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000016",
    name: "Timbaland",
    country: "United States",
    region: "Virginia",
    primaryScenes: ["Virginia hip-hop/R&B/pop"],
    primaryGenres: ["hip-hop", "r-and-b", "pop"],
    primaryRoles: ["producer-auteur", "beatmaker", "vocal-producer"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Percussive futurism, negative space, vocal rhythm as drum language",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000017",
    name: "The Neptunes",
    country: "United States",
    region: "Virginia",
    primaryScenes: ["Virginia pop/rap/R&B"],
    primaryGenres: ["pop", "hip-hop", "r-and-b"],
    primaryRoles: ["production-collective", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle: "Sparse bounce, synthetic funk, weird minimal hooks",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000018",
    name: "Missy Elliott",
    country: "United States",
    region: "Virginia",
    primaryScenes: ["Virginia hip-hop/R&B"],
    primaryGenres: ["hip-hop", "r-and-b"],
    primaryRoles: ["vocal-producer", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Vocal-producer imagination, playful futurism, rhythm-first song design",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000019",
    name: "Metro Boomin",
    country: "United States",
    region: "Atlanta",
    primaryScenes: ["Atlanta trap"],
    primaryGenres: ["trap", "hip-hop"],
    primaryRoles: ["beatmaker", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle:
      "Dark cinematic trap, negative space, 808 mood architecture",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000020",
    name: "Mike WiLL Made-It",
    country: "United States",
    region: "Atlanta",
    primaryScenes: ["Atlanta trap/pop rap"],
    primaryGenres: ["trap", "hip-hop", "pop"],
    primaryRoles: ["beatmaker", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle: "Elastic 808s, hard minimal loops, hook-forward trap design",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000021",
    name: "Zaytoven",
    country: "United States",
    region: "Atlanta",
    primaryScenes: ["Atlanta trap/gospel"],
    primaryGenres: ["trap", "hip-hop", "gospel"],
    primaryRoles: ["beatmaker", "composer-producer"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle: "Church chords, loose piano, trap bounce, human touch",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000022",
    name: "Lex Luger",
    country: "United States",
    region: "Southern US",
    primaryScenes: ["Southern trap"],
    primaryGenres: ["trap", "hip-hop"],
    primaryRoles: ["beatmaker"],
    primaryEras: ["daw"],
    coreDnaAngle: "Maximal brass/synth aggression, hard snare energy",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000023",
    name: "Southside",
    country: "United States",
    region: "Atlanta",
    primaryScenes: ["Atlanta trap", "808 Mafia"],
    primaryGenres: ["trap", "hip-hop"],
    primaryRoles: ["beatmaker", "production-collective"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle: "Dark drum programming, high-energy 808 pressure",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000024",
    name: "Madlib",
    country: "United States",
    region: "California",
    primaryScenes: ["California underground hip-hop"],
    primaryGenres: ["hip-hop", "jazz", "soul"],
    primaryRoles: ["beatmaker", "sampling-architect", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle: "Crate-digging collage, raw loops, jazz-damaged texture",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000025",
    name: "Pete Rock",
    country: "United States",
    region: "New York",
    primaryScenes: ["New York hip-hop"],
    primaryGenres: ["hip-hop", "boom-bap", "soul"],
    primaryRoles: ["beatmaker", "sampling-architect", "dj-producer"],
    primaryEras: ["midi-sampler"],
    coreDnaAngle: "Warm horn loops, soul-jazz chops, head-nod elegance",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000026",
    name: "Marley Marl",
    country: "United States",
    region: "Queensbridge, NY",
    primaryScenes: ["Queensbridge hip-hop"],
    primaryGenres: ["hip-hop", "boom-bap"],
    primaryRoles: ["sampling-architect", "beatmaker", "dj-producer"],
    primaryEras: ["early-hip-hop-sampling", "midi-sampler"],
    coreDnaAngle:
      "Sampling architecture, drum reconstruction, early beat science",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000027",
    name: "DJ Screw",
    country: "United States",
    region: "Houston",
    primaryScenes: ["Houston"],
    primaryGenres: ["hip-hop"],
    primaryRoles: ["dj-producer", "remixer", "producer-auteur"],
    primaryEras: ["midi-sampler"],
    coreDnaAngle: "Slowed time, syrup atmosphere, remix-as-worldbuilding",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000028",
    name: "SOPHIE",
    country: "United Kingdom",
    region: "Scotland",
    primaryScenes: ["UK/Scotland hyperpop/electronic"],
    primaryGenres: ["hyperpop", "electronic", "experimental", "pop"],
    primaryRoles: ["sound-designer", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle: "Plastic-metal sound design, extreme synthetic physicality",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000029",
    name: "Arca",
    country: "Venezuela",
    primaryScenes: ["Venezuela/global experimental pop"],
    primaryGenres: ["experimental", "pop", "electronic"],
    primaryRoles: ["sound-designer", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle:
      "Mutant sound design, body-horror beauty, fractured rhythm",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000030",
    name: "Burial",
    country: "United Kingdom",
    region: "London",
    primaryScenes: ["UK garage/dubstep"],
    primaryGenres: ["dubstep", "uk-garage", "ambient"],
    primaryRoles: ["producer-auteur", "sound-designer"],
    primaryEras: ["daw"],
    coreDnaAngle: "Ghostly urban ambience, shuffled drums, emotional decay",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000031",
    name: "Aphex Twin",
    country: "United Kingdom",
    region: "Ireland/UK",
    primaryScenes: ["UK/Ireland IDM"],
    primaryGenres: ["idm", "electronic", "experimental", "ambient"],
    primaryRoles: ["producer-auteur", "sound-designer", "composer-producer"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Algorithmic rhythm, alien melody, playful technical extremity",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000032",
    name: "Daft Punk",
    country: "France",
    primaryScenes: ["France house/pop"],
    primaryGenres: ["house", "electronic", "pop"],
    primaryRoles: ["production-collective", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Robotic funk, filter-house memory, vocoder mythology",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000033",
    name: "Kraftwerk",
    country: "Germany",
    primaryScenes: ["Germany electronic"],
    primaryGenres: ["electronic", "synthpop"],
    primaryRoles: ["production-collective", "producer-auteur", "composer-producer"],
    primaryEras: ["disco-electronic-studio", "midi-sampler"],
    coreDnaAngle:
      "Machine minimalism, sequencer logic, electronic-pop foundation",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000034",
    name: "Wendy Carlos",
    country: "United States",
    primaryScenes: ["US electronic/classical"],
    primaryGenres: ["electronic", "film-score"],
    primaryRoles: ["composer-producer", "sound-designer"],
    primaryEras: ["tape-console", "disco-electronic-studio"],
    coreDnaAngle:
      "Synth translation, timbre discipline, electronic orchestration",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000035",
    name: "Ryuichi Sakamoto",
    country: "Japan",
    primaryScenes: ["Japan/global"],
    primaryGenres: ["electronic", "film-score", "ambient", "pop"],
    primaryRoles: ["composer-producer", "producer-auteur"],
    primaryEras: ["disco-electronic-studio", "midi-sampler", "daw"],
    coreDnaAngle:
      "Elegant harmony, electronic-acoustic fusion, cinematic restraint",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000036",
    name: "Yasutaka Nakata",
    country: "Japan",
    primaryScenes: ["Japan J-pop/electro"],
    primaryGenres: ["j-pop", "electronic", "synthpop"],
    primaryRoles: ["producer-auteur", "vocal-producer"],
    primaryEras: ["daw"],
    coreDnaAngle:
      "Glossy synthetic pop, vocal processing, kawaii-futurist precision",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000037",
    name: "A. R. Rahman",
    country: "India",
    primaryScenes: ["India film/pop"],
    primaryGenres: ["bollywood", "film-score", "pop"],
    primaryRoles: ["composer-producer", "producer-auteur"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Orchestral-electronic fusion, spiritual melody, cinematic scale",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000038",
    name: "Max Martin",
    country: "Sweden",
    primaryScenes: ["Sweden pop"],
    primaryGenres: ["pop"],
    primaryRoles: ["producer-auteur", "vocal-producer", "composer-producer"],
    primaryEras: ["midi-sampler", "daw", "streaming-social-platform"],
    coreDnaAngle: "Hook architecture, melodic math, chorus engineering",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000039",
    name: "Shellback",
    country: "Sweden",
    primaryScenes: ["Sweden pop"],
    primaryGenres: ["pop", "rock"],
    primaryRoles: ["producer-auteur", "composer-producer"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle: "Modern pop punch, guitar/synth hybrid hooks",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000040",
    name: "Nile Rodgers",
    country: "United States",
    primaryScenes: ["US disco/funk/pop"],
    primaryGenres: ["disco", "funk", "pop"],
    primaryRoles: ["producer-auteur", "band-member-as-producer"],
    primaryEras: ["disco-electronic-studio", "midi-sampler", "daw"],
    coreDnaAngle:
      "Guitar groove architecture, live-dance precision, elegant repetition",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000041",
    name: "Trevor Horn",
    country: "United Kingdom",
    primaryScenes: ["UK synthpop/new wave"],
    primaryGenres: ["synthpop", "pop"],
    primaryRoles: ["producer-auteur", "studio-producer", "arranger"],
    primaryEras: ["disco-electronic-studio", "midi-sampler"],
    coreDnaAngle: "Hyper-detailed pop production, studio maximalism, digital sheen",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000042",
    name: "Flood",
    country: "United Kingdom",
    primaryScenes: ["UK alternative/electronic rock"],
    primaryGenres: ["alternative", "electronic", "industrial", "rock"],
    primaryRoles: ["producer-auteur", "mix-engineer-as-producer"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Industrial space, texture-forward rock, atmospheric mixing",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000043",
    name: "Nigel Godrich",
    country: "United Kingdom",
    primaryScenes: ["UK alternative rock"],
    primaryGenres: ["alternative", "rock", "indie"],
    primaryRoles: ["producer-auteur", "engineer-producer"],
    primaryEras: ["daw"],
    coreDnaAngle:
      "Intimate abstraction, band texture, emotional digital-era space",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000044",
    name: "Steve Albini",
    country: "United States",
    primaryScenes: ["US alternative rock"],
    primaryGenres: ["alternative", "rock", "punk", "noise"],
    primaryRoles: ["engineer-producer"],
    primaryEras: ["tape-console", "midi-sampler"],
    coreDnaAngle: "Raw room sound, anti-gloss recording, performance realism",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000045",
    name: "Linda Perry",
    country: "United States",
    primaryScenes: ["US pop/rock"],
    primaryGenres: ["pop", "rock"],
    primaryRoles: ["producer-auteur", "vocal-producer", "composer-producer"],
    primaryEras: ["daw"],
    coreDnaAngle:
      "Song-first emotional production, vocal-centered arrangements",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000046",
    name: "Tainy",
    country: "Puerto Rico",
    primaryScenes: ["Puerto Rico reggaeton/Latin pop"],
    primaryGenres: ["reggaeton", "latin-pop", "dembow"],
    primaryRoles: ["producer-auteur", "beatmaker"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle:
      "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000047",
    name: "Luny Tunes",
    country: "Puerto Rico",
    primaryScenes: ["Puerto Rico reggaeton"],
    primaryGenres: ["reggaeton", "dembow"],
    primaryRoles: ["production-collective", "beatmaker"],
    primaryEras: ["midi-sampler", "daw"],
    coreDnaAngle:
      "Classic dembow architecture, club-reggaeton foundations",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000048",
    name: "Sarz",
    country: "Nigeria",
    primaryScenes: ["Nigeria Afrobeats"],
    primaryGenres: ["afrobeats", "pop"],
    primaryRoles: ["beatmaker", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle:
      "Clean rhythmic bounce, melodic restraint, Afropop polish",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000049",
    name: "Kabza De Small",
    country: "South Africa",
    primaryScenes: ["South Africa amapiano"],
    primaryGenres: ["amapiano", "house"],
    primaryRoles: ["dj-producer", "producer-auteur"],
    primaryEras: ["daw", "streaming-social-platform"],
    coreDnaAngle:
      "Log-drum language, hypnotic piano loops, long-form groove",
    researchConfidence: "C"
  },
  {
    id: "PDNA-000050",
    name: "DJ Rashad",
    country: "United States",
    region: "Chicago",
    primaryScenes: ["Chicago footwork"],
    primaryGenres: ["footwork", "electronic"],
    primaryRoles: ["dj-producer", "producer-auteur"],
    primaryEras: ["daw"],
    coreDnaAngle:
      "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed",
    researchConfidence: "C"
  }
];

/**
 * Roadmap published in the user brief — used by the UI to surface what's
 * next after Batch 001.
 */
export interface SeedBatchPlan {
  id: string;
  number: number;
  title: string;
  focus: string;
}

export const BATCH_ROADMAP: SeedBatchPlan[] = [
  {
    id: "BATCH-002",
    number: 2,
    title: "Hip-Hop Foundations",
    focus:
      "Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago."
  },
  {
    id: "BATCH-003",
    number: 3,
    title: "Atlanta Trap / Modern Rap Production Trees",
    focus:
      "Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap."
  },
  {
    id: "BATCH-004",
    number: 4,
    title: "Dub, Reggae, Dancehall, Soundsystem Producers",
    focus:
      "Jamaica, UK dub, digital dancehall, reggaeton connections."
  },
  {
    id: "BATCH-005",
    number: 5,
    title: "Electronic Foundations",
    focus:
      "Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM."
  },
  {
    id: "BATCH-006",
    number: 6,
    title: "UK Bass Continuum",
    focus:
      "Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline."
  },
  {
    id: "BATCH-007",
    number: 7,
    title: "Afrobeats, Amapiano, Highlife, African Club Music",
    focus:
      "Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers."
  },
  {
    id: "BATCH-008",
    number: 8,
    title: "Latin, Caribbean, Reggaeton, Dembow, Funk Carioca",
    focus:
      "Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina."
  },
  {
    id: "BATCH-009",
    number: 9,
    title: "Pop Architects and Vocal Producers",
    focus:
      "Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems."
  },
  {
    id: "BATCH-010",
    number: 10,
    title: "Rock, Alternative, Punk, Metal, Indie Studio Producers",
    focus:
      "Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers."
  },
  {
    id: "BATCH-011",
    number: 11,
    title: "Film, Game, Ambient, Experimental, Sound Design Producers",
    focus:
      "Film composers, game composers, modular artists, sample-library innovators, sound designers."
  }
];
