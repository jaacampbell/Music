import {
  GENRE_SCENE_TAXONOMY,
  PRODUCER_ROLE_TAXONOMY,
  RESEARCH_CONFIDENCE_DEFINITIONS
} from "@/lib/producer-dna/taxonomy";
import type {
  CreativeIterationEntity,
  ProducerDnaQuery,
  ProducerDnaRecord,
  ResearchConfidenceTier
} from "@/lib/producer-dna/types";

interface BatchSeedRow {
  producerId: string;
  name: string;
  country: string;
  region: string;
  city: string | null;
  scenes: string[];
  genres: string[];
  eras: string[];
  producerRoles: string[];
  coreDnaAngle: string;
  capsuleSummary: string;
}

const ITERATION_TEMPLATES = [
  "minimal groove-first draft",
  "drum-language reinterpretation",
  "harmonic palette variation",
  "space-and-atmosphere variation",
  "regional rhythm hybrid",
  "band-vs-synthetic contrast",
  "tempo-shift adaptation",
  "vocal-pocket-first arrangement",
  "club-energy adaptation",
  "cinematic score adaptation"
] as const;

const BATCH_001_ROWS: BatchSeedRow[] = [
  {
    producerId: "PDNA-000001",
    name: "George Martin",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["pop", "rock", "studio_era"],
    genres: ["rock", "pop"],
    eras: ["tape_console_era", "wall_of_sound_era"],
    producerRoles: ["studio_producer", "arranger", "producer_auteur"],
    coreDnaAngle: "Arrangement-as-production, orchestral pop architecture, studio imagination.",
    capsuleSummary:
      "Transforms song arrangement into production architecture with orchestral imagination."
  },
  {
    producerId: "PDNA-000002",
    name: "Phil Spector",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["pop", "studio_orchestration"],
    genres: ["pop"],
    eras: ["wall_of_sound_era"],
    producerRoles: ["studio_producer", "producer_auteur"],
    coreDnaAngle: "Dense mono drama, layered percussion, wall-arrangement thinking.",
    capsuleSummary: "Builds dramatic density through layered mono orchestration and percussion walls."
  },
  {
    producerId: "PDNA-000003",
    name: "Quincy Jones",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["jazz", "rnb", "pop"],
    genres: ["jazz", "rnb", "pop"],
    eras: ["tape_console_era", "disco_electronic_studio_era"],
    producerRoles: ["arranger", "studio_producer", "executive_producer"],
    coreDnaAngle: "Sophisticated arrangement, groove polish, elite collaborator architecture.",
    capsuleSummary: "Combines elite arrangement craft, groove precision, and collaborator orchestration."
  },
  {
    producerId: "PDNA-000004",
    name: "Brian Eno",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["art_rock", "ambient", "experimental"],
    genres: ["ambient", "experimental", "rock"],
    eras: ["disco_electronic_studio_era", "daw_era"],
    producerRoles: ["producer_auteur", "sound_designer", "composer_producer"],
    coreDnaAngle: "Systems, atmosphere, generative texture, emotional minimalism.",
    capsuleSummary: "Uses systems-based production to create emotionally minimal yet textured atmospheres."
  },
  {
    producerId: "PDNA-000005",
    name: "Lee \"Scratch\" Perry",
    country: "Jamaica",
    region: "Caribbean",
    city: null,
    scenes: ["dub", "reggae", "soundsystem"],
    genres: ["dub", "reggae"],
    eras: ["dub_soundsystem_era"],
    producerRoles: ["producer_auteur", "sound_designer", "sampling_architect"],
    coreDnaAngle: "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism.",
    capsuleSummary: "Treats the studio as an instrument for surreal dub manipulation and spiritual texture."
  },
  {
    producerId: "PDNA-000006",
    name: "King Tubby",
    country: "Jamaica",
    region: "Caribbean",
    city: null,
    scenes: ["dub", "reggae", "soundsystem"],
    genres: ["dub", "reggae"],
    eras: ["dub_soundsystem_era"],
    producerRoles: ["engineer_producer", "producer_auteur", "mix_engineer_as_producer"],
    coreDnaAngle: "Mixer-as-composer, space, delay throws, bass-and-drum architecture.",
    capsuleSummary: "Composes with the mixing desk, shaping bass, drum space, and delay movement."
  },
  {
    producerId: "PDNA-000007",
    name: "Giorgio Moroder",
    country: "Italy",
    region: "Europe",
    city: null,
    scenes: ["disco", "electronic"],
    genres: ["disco", "electronic"],
    eras: ["disco_electronic_studio_era", "midi_sampler_era"],
    producerRoles: ["producer_auteur", "composer_producer", "sound_designer"],
    coreDnaAngle: "Sequenced propulsion, synth disco, machine sensuality.",
    capsuleSummary: "Defines synth-driven disco propulsion through machine-sequenced sensual groove."
  },
  {
    producerId: "PDNA-000008",
    name: "Tom Dowd",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["soul", "rock", "jazz"],
    genres: ["soul", "rock", "jazz"],
    eras: ["tape_console_era"],
    producerRoles: ["engineer_producer", "studio_producer"],
    coreDnaAngle: "Engineering innovation, live feel, multitrack clarity.",
    capsuleSummary: "Balances technical innovation with live-feel capture and multitrack clarity."
  },
  {
    producerId: "PDNA-000009",
    name: "Teo Macero",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["jazz", "studio_editing"],
    genres: ["jazz"],
    eras: ["tape_console_era"],
    producerRoles: ["producer_auteur", "arranger", "composer_producer"],
    coreDnaAngle: "Tape editing, jazz architecture, post-performance composition.",
    capsuleSummary: "Reconstructs performances through tape editing as a compositional tool."
  },
  {
    producerId: "PDNA-000010",
    name: "Sylvia Robinson",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["soul", "early_hip_hop", "label_building"],
    genres: ["soul", "hip_hop"],
    eras: ["early_hip_hop_sampling_era"],
    producerRoles: ["executive_producer", "label_architect", "studio_producer"],
    coreDnaAngle: "Label vision, early rap record architecture, commercial bridge-building.",
    capsuleSummary: "Builds label and production frameworks that bridge underground rap to commerce."
  },
  {
    producerId: "PDNA-000011",
    name: "Rick Rubin",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["hip_hop", "rock", "cross_genre"],
    genres: ["hip_hop", "rock"],
    eras: ["early_hip_hop_sampling_era", "daw_era"],
    producerRoles: ["producer_auteur", "executive_producer", "label_architect"],
    coreDnaAngle: "Reduction, rawness, cross-genre minimal power.",
    capsuleSummary: "Uses reduction and raw arrangement choices to unlock cross-genre impact."
  },
  {
    producerId: "PDNA-000012",
    name: "Dr. Dre",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["west_coast_hip_hop", "g_funk"],
    genres: ["hip_hop", "g_funk"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["producer_auteur", "beatmaker", "engineer_producer"],
    coreDnaAngle: "Low-end authority, polished menace, vocal pocket control.",
    capsuleSummary: "Pairs pristine low-end engineering with controlled aggression and vocal pocket design."
  },
  {
    producerId: "PDNA-000013",
    name: "J Dilla",
    country: "United States",
    region: "US",
    city: "Detroit",
    scenes: ["detroit_beat_scene", "neo_soul", "underground_hip_hop"],
    genres: ["hip_hop", "soul"],
    eras: ["midi_sampler_era", "internet_beatmaker_era"],
    producerRoles: ["beatmaker", "producer_auteur", "sampling_architect"],
    coreDnaAngle: "Humanized swing, asymmetry, emotional imperfection.",
    capsuleSummary: "Makes machine rhythm feel conversational through intentional microtiming asymmetry."
  },
  {
    producerId: "PDNA-000014",
    name: "DJ Premier",
    country: "United States",
    region: "US",
    city: "New York",
    scenes: ["boom_bap", "turntablism"],
    genres: ["hip_hop", "boom_bap"],
    eras: ["early_hip_hop_sampling_era", "midi_sampler_era"],
    producerRoles: ["beatmaker", "dj_producer", "sampling_architect"],
    coreDnaAngle: "Chopped grit, scratched hooks, drum-loop authority.",
    capsuleSummary: "Defines boom bap architecture with chopped samples, scratches, and hard drum loops."
  },
  {
    producerId: "PDNA-000015",
    name: "RZA",
    country: "United States",
    region: "US",
    city: "Staten Island",
    scenes: ["wu_tang", "boom_bap", "cinematic_hip_hop"],
    genres: ["hip_hop", "boom_bap"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["producer_auteur", "beatmaker", "composer_producer"],
    coreDnaAngle: "Dusty soul, martial arts cinema, raw texture, minor-key mythology.",
    capsuleSummary: "Fuses dusty soul fragments with cinematic tension and raw minor-key atmosphere."
  },
  {
    producerId: "PDNA-000016",
    name: "Timbaland",
    country: "United States",
    region: "US",
    city: "Virginia",
    scenes: ["hip_hop", "rnb", "pop"],
    genres: ["hip_hop", "rnb", "pop"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["producer_auteur", "sound_designer", "beatmaker"],
    coreDnaAngle: "Percussive futurism, negative space, vocal rhythm as drum language.",
    capsuleSummary: "Turns vocal cadence and unconventional percussion into futuristic groove architecture."
  },
  {
    producerId: "PDNA-000017",
    name: "The Neptunes",
    country: "United States",
    region: "US",
    city: "Virginia",
    scenes: ["pop", "rap", "rnb", "synthetic_funk"],
    genres: ["hip_hop", "pop", "rnb", "funk"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["production_collective", "producer_auteur", "sound_designer"],
    coreDnaAngle: "Sparse bounce, synthetic funk, weird minimal hooks.",
    capsuleSummary: "Balances sparse rhythmic bounce with synthetic timbre and unconventional hook writing."
  },
  {
    producerId: "PDNA-000018",
    name: "Missy Elliott",
    country: "United States",
    region: "US",
    city: "Virginia",
    scenes: ["hip_hop", "rnb", "pop", "vocal_production"],
    genres: ["hip_hop", "rnb", "pop"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["vocal_producer", "producer_auteur", "beatmaker"],
    coreDnaAngle: "Vocal-producer imagination, playful futurism, rhythm-first song design.",
    capsuleSummary: "Centers rhythm and characterful vocal production in playful futuristic song structures."
  },
  {
    producerId: "PDNA-000019",
    name: "Metro Boomin",
    country: "United States",
    region: "US",
    city: "Atlanta",
    scenes: ["trap", "modern_rap"],
    genres: ["trap", "hip_hop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["beatmaker", "producer_auteur"],
    coreDnaAngle: "Dark cinematic trap, negative space, 808 mood architecture.",
    capsuleSummary: "Builds cinematic trap tension using sparse structure and mood-led 808 movement."
  },
  {
    producerId: "PDNA-000020",
    name: "Mike WiLL Made-It",
    country: "United States",
    region: "US",
    city: "Atlanta",
    scenes: ["trap", "pop_rap"],
    genres: ["trap", "hip_hop", "pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["beatmaker", "producer_auteur"],
    coreDnaAngle: "Elastic 808s, hard minimal loops, hook-forward trap design.",
    capsuleSummary: "Pairs elastic 808 programming with hard minimalist loops and hook-led arrangement."
  },
  {
    producerId: "PDNA-000021",
    name: "Zaytoven",
    country: "United States",
    region: "US",
    city: "Atlanta",
    scenes: ["trap", "gospel_influenced_hip_hop"],
    genres: ["trap", "hip_hop", "gospel"],
    eras: ["daw_era", "internet_beatmaker_era"],
    producerRoles: ["beatmaker", "producer_auteur", "composer_producer"],
    coreDnaAngle: "Church chords, loose piano, trap bounce, human touch.",
    capsuleSummary: "Injects gospel-informed piano language and looseness into trap groove frameworks."
  },
  {
    producerId: "PDNA-000022",
    name: "Lex Luger",
    country: "United States",
    region: "US",
    city: "South",
    scenes: ["southern_trap"],
    genres: ["trap", "hip_hop"],
    eras: ["daw_era", "internet_beatmaker_era"],
    producerRoles: ["beatmaker", "producer_auteur"],
    coreDnaAngle: "Maximal brass/synth aggression, hard snare energy.",
    capsuleSummary: "Defines trap maximalism via brass-heavy synths, hard snares, and relentless impact."
  },
  {
    producerId: "PDNA-000023",
    name: "Southside",
    country: "United States",
    region: "US",
    city: "Atlanta",
    scenes: ["trap", "808_mafia"],
    genres: ["trap", "hip_hop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["beatmaker", "production_collective"],
    coreDnaAngle: "Dark drum programming, high-energy 808 pressure.",
    capsuleSummary: "Leans on high-pressure drum programming and dark tonal framing for trap energy."
  },
  {
    producerId: "PDNA-000024",
    name: "Madlib",
    country: "United States",
    region: "US",
    city: "California",
    scenes: ["underground_hip_hop", "jazz_rap"],
    genres: ["hip_hop", "jazz"],
    eras: ["midi_sampler_era", "internet_beatmaker_era"],
    producerRoles: ["sampling_architect", "producer_auteur", "beatmaker"],
    coreDnaAngle: "Crate-digging collage, raw loops, jazz-damaged texture.",
    capsuleSummary: "Builds collage-like beat worlds from raw loops and damaged jazz textures."
  },
  {
    producerId: "PDNA-000025",
    name: "Pete Rock",
    country: "United States",
    region: "US",
    city: "New York",
    scenes: ["boom_bap", "soul_jazz_hip_hop"],
    genres: ["hip_hop", "soul", "jazz"],
    eras: ["early_hip_hop_sampling_era", "midi_sampler_era"],
    producerRoles: ["beatmaker", "sampling_architect"],
    coreDnaAngle: "Warm horn loops, soul-jazz chops, head-nod elegance.",
    capsuleSummary: "Combines warm horn-led sampling with elegant head-nod groove construction."
  },
  {
    producerId: "PDNA-000026",
    name: "Marley Marl",
    country: "United States",
    region: "US",
    city: "Queensbridge",
    scenes: ["early_hip_hop", "sampling_foundations"],
    genres: ["hip_hop", "boom_bap"],
    eras: ["early_hip_hop_sampling_era"],
    producerRoles: ["beatmaker", "sampling_architect"],
    coreDnaAngle: "Sampling architecture, drum reconstruction, early beat science.",
    capsuleSummary: "Pioneers drum and sample reconstruction techniques foundational to hip-hop production."
  },
  {
    producerId: "PDNA-000027",
    name: "DJ Screw",
    country: "United States",
    region: "US",
    city: "Houston",
    scenes: ["chopped_and_screwed", "southern_hip_hop"],
    genres: ["hip_hop"],
    eras: ["midi_sampler_era", "internet_beatmaker_era"],
    producerRoles: ["dj_producer", "remixer", "producer_auteur"],
    coreDnaAngle: "Slowed time, syrup atmosphere, remix-as-worldbuilding.",
    capsuleSummary: "Reimagines tracks by stretching time and turning remix into atmosphere design."
  },
  {
    producerId: "PDNA-000028",
    name: "SOPHIE",
    country: "United Kingdom",
    region: "UK",
    city: "Scotland",
    scenes: ["hyperpop", "electronic", "experimental_pop"],
    genres: ["electronic", "experimental", "pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["sound_designer", "producer_auteur"],
    coreDnaAngle: "Plastic-metal sound design, extreme synthetic physicality.",
    capsuleSummary: "Pushes synthetic timbre to physical extremes with hyper-detailed sound design."
  },
  {
    producerId: "PDNA-000029",
    name: "Arca",
    country: "Venezuela",
    region: "Latin America",
    city: null,
    scenes: ["experimental_pop", "avant_club"],
    genres: ["experimental", "electronic", "pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "sound_designer", "composer_producer"],
    coreDnaAngle: "Mutant sound design, body-horror beauty, fractured rhythm.",
    capsuleSummary: "Blends fractured rhythm and radical timbral mutation into emotionally charged forms."
  },
  {
    producerId: "PDNA-000030",
    name: "Burial",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["uk_garage", "dubstep", "future_garage"],
    genres: ["uk_garage", "dubstep", "ambient"],
    eras: ["daw_era", "internet_beatmaker_era"],
    producerRoles: ["producer_auteur", "beatmaker", "sound_designer"],
    coreDnaAngle: "Ghostly urban ambience, shuffled drums, emotional decay.",
    capsuleSummary: "Uses shuffled rhythms and haunted ambience to encode emotional urban melancholy."
  },
  {
    producerId: "PDNA-000031",
    name: "Aphex Twin",
    country: "United Kingdom",
    region: "UK/Ireland",
    city: null,
    scenes: ["idm", "electronic", "experimental"],
    genres: ["idm", "electronic", "experimental"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["producer_auteur", "sound_designer", "composer_producer"],
    coreDnaAngle: "Algorithmic rhythm, alien melody, playful technical extremity.",
    capsuleSummary: "Combines algorithmic rhythm complexity with playful, alien melodic sensibility."
  },
  {
    producerId: "PDNA-000032",
    name: "Daft Punk",
    country: "France",
    region: "Europe",
    city: null,
    scenes: ["house", "electronic_pop", "french_touch"],
    genres: ["house", "electronic", "pop", "funk"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["production_collective", "producer_auteur", "dj_producer"],
    coreDnaAngle: "Robotic funk, filter-house memory, vocoder mythology.",
    capsuleSummary: "Builds robotic funk identity around filter-house dynamics and vocoder narrative."
  },
  {
    producerId: "PDNA-000033",
    name: "Kraftwerk",
    country: "Germany",
    region: "Europe",
    city: null,
    scenes: ["electronic_foundation", "synthpop"],
    genres: ["electronic", "synthpop"],
    eras: ["disco_electronic_studio_era", "midi_sampler_era"],
    producerRoles: ["production_collective", "producer_auteur", "composer_producer"],
    coreDnaAngle: "Machine minimalism, sequencer logic, electronic-pop foundation.",
    capsuleSummary: "Establishes machine-minimal sequencer logic as a global electronic-pop foundation."
  },
  {
    producerId: "PDNA-000034",
    name: "Wendy Carlos",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["electronic_classical", "synth_orchestration"],
    genres: ["electronic", "classical"],
    eras: ["disco_electronic_studio_era", "midi_sampler_era"],
    producerRoles: ["composer_producer", "arranger", "sound_designer"],
    coreDnaAngle: "Synth translation, timbre discipline, electronic orchestration.",
    capsuleSummary: "Applies disciplined timbre design to synth-based orchestration and adaptation."
  },
  {
    producerId: "PDNA-000035",
    name: "Ryuichi Sakamoto",
    country: "Japan",
    region: "Japan",
    city: null,
    scenes: ["electronic_acoustic_fusion", "film_composition"],
    genres: ["electronic", "ambient", "film_score"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["composer_producer", "producer_auteur", "arranger"],
    coreDnaAngle: "Elegant harmony, electronic-acoustic fusion, cinematic restraint.",
    capsuleSummary: "Merges elegant harmonic writing with restrained cinematic electronic-acoustic fusion."
  },
  {
    producerId: "PDNA-000036",
    name: "Yasutaka Nakata",
    country: "Japan",
    region: "Japan",
    city: null,
    scenes: ["j_pop", "electro_pop"],
    genres: ["j_pop", "electronic", "pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "vocal_producer", "sound_designer"],
    coreDnaAngle: "Glossy synthetic pop, vocal processing, kawaii-futurist precision.",
    capsuleSummary: "Delivers high-gloss synthetic pop with precise vocal processing and futurist polish."
  },
  {
    producerId: "PDNA-000037",
    name: "A. R. Rahman",
    country: "India",
    region: "India",
    city: null,
    scenes: ["film_music", "indian_pop", "global_fusion"],
    genres: ["bollywood_indian_film_music", "pop", "electronic"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["composer_producer", "producer_auteur", "arranger"],
    coreDnaAngle: "Orchestral-electronic fusion, spiritual melody, cinematic scale.",
    capsuleSummary: "Bridges orchestral and electronic language with spiritual melody at cinematic scale."
  },
  {
    producerId: "PDNA-000038",
    name: "Max Martin",
    country: "Sweden",
    region: "Europe",
    city: null,
    scenes: ["pop", "songwriting_systems"],
    genres: ["pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "vocal_producer", "arranger"],
    coreDnaAngle: "Hook architecture, melodic math, chorus engineering.",
    capsuleSummary: "Engineers high-precision pop hooks through melodic and chorus architecture."
  },
  {
    producerId: "PDNA-000039",
    name: "Shellback",
    country: "Sweden",
    region: "Europe",
    city: null,
    scenes: ["pop", "rock_pop_hybrid"],
    genres: ["pop", "rock"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "arranger", "vocal_producer"],
    coreDnaAngle: "Modern pop punch, guitar/synth hybrid hooks.",
    capsuleSummary: "Combines guitar and synth hook language with modern pop punch."
  },
  {
    producerId: "PDNA-000040",
    name: "Nile Rodgers",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["disco", "funk", "pop"],
    genres: ["disco", "funk", "pop"],
    eras: ["disco_electronic_studio_era", "daw_era"],
    producerRoles: ["producer_auteur", "band_member_as_producer", "arranger"],
    coreDnaAngle: "Guitar groove architecture, live-dance precision, elegant repetition.",
    capsuleSummary: "Designs dance-floor momentum through guitar-centric groove architecture and repetition."
  },
  {
    producerId: "PDNA-000041",
    name: "Trevor Horn",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["synthpop", "new_wave", "studio_maximalism"],
    genres: ["synthpop", "pop", "rock"],
    eras: ["midi_sampler_era", "daw_era"],
    producerRoles: ["studio_producer", "producer_auteur", "arranger"],
    coreDnaAngle: "Hyper-detailed pop production, studio maximalism, digital sheen.",
    capsuleSummary: "Builds hyper-detailed studio maximalism with polished digital-era sheen."
  },
  {
    producerId: "PDNA-000042",
    name: "Flood",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["alternative_rock", "electronic_rock", "industrial"],
    genres: ["rock", "electronic"],
    eras: ["daw_era"],
    producerRoles: ["studio_producer", "engineer_producer"],
    coreDnaAngle: "Industrial space, texture-forward rock, atmospheric mixing.",
    capsuleSummary: "Drives rock records through atmospheric texture and industrial spatial treatment."
  },
  {
    producerId: "PDNA-000043",
    name: "Nigel Godrich",
    country: "United Kingdom",
    region: "UK",
    city: null,
    scenes: ["alternative_rock", "art_rock"],
    genres: ["rock", "electronic"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["studio_producer", "engineer_producer", "producer_auteur"],
    coreDnaAngle: "Intimate abstraction, band texture, emotional digital-era space.",
    capsuleSummary: "Shapes intimate abstraction by balancing band texture with emotional digital space."
  },
  {
    producerId: "PDNA-000044",
    name: "Steve Albini",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["alternative_rock", "noise_rock", "punk"],
    genres: ["rock", "punk", "noise"],
    eras: ["tape_console_era", "daw_era"],
    producerRoles: ["engineer_producer", "studio_producer"],
    coreDnaAngle: "Raw room sound, anti-gloss recording, performance realism.",
    capsuleSummary: "Prioritizes authentic room capture and performance realism over polish."
  },
  {
    producerId: "PDNA-000045",
    name: "Linda Perry",
    country: "United States",
    region: "US",
    city: null,
    scenes: ["pop", "rock", "songwriter_production"],
    genres: ["pop", "rock", "rnb"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "vocal_producer", "composer_producer"],
    coreDnaAngle: "Song-first emotional production, vocal-centered arrangements.",
    capsuleSummary: "Uses song-first emotional framing and vocal-centered arrangement decisions."
  },
  {
    producerId: "PDNA-000046",
    name: "Tainy",
    country: "Puerto Rico",
    region: "Latin America",
    city: null,
    scenes: ["reggaeton", "latin_pop"],
    genres: ["reggaeton", "latin_pop", "dembow"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "beatmaker", "sound_designer"],
    coreDnaAngle: "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere.",
    capsuleSummary: "Modernizes reggaeton through sleek dembow evolution and atmospheric melody framing."
  },
  {
    producerId: "PDNA-000047",
    name: "Luny Tunes",
    country: "Puerto Rico",
    region: "Latin America",
    city: null,
    scenes: ["reggaeton", "club_foundations"],
    genres: ["reggaeton", "dembow"],
    eras: ["daw_era", "internet_beatmaker_era"],
    producerRoles: ["production_collective", "beatmaker"],
    coreDnaAngle: "Classic dembow architecture, club-reggaeton foundations.",
    capsuleSummary: "Establishes foundational dembow architecture for early reggaeton club formats."
  },
  {
    producerId: "PDNA-000048",
    name: "Sarz",
    country: "Nigeria",
    region: "Africa",
    city: null,
    scenes: ["afrobeats", "afropop"],
    genres: ["afrobeats", "pop"],
    eras: ["daw_era", "streaming_social_platform_era"],
    producerRoles: ["producer_auteur", "beatmaker"],
    coreDnaAngle: "Clean rhythmic bounce, melodic restraint, Afropop polish.",
    capsuleSummary: "Pairs rhythmic bounce with restrained melody to achieve polished Afropop feel."
  },
  {
    producerId: "PDNA-000049",
    name: "Kabza De Small",
    country: "South Africa",
    region: "Africa",
    city: null,
    scenes: ["amapiano", "south_african_club_music"],
    genres: ["amapiano", "house"],
    eras: ["streaming_social_platform_era"],
    producerRoles: ["dj_producer", "producer_auteur", "beatmaker"],
    coreDnaAngle: "Log-drum language, hypnotic piano loops, long-form groove.",
    capsuleSummary: "Builds hypnotic amapiano movement through log-drum grammar and long-form loops."
  },
  {
    producerId: "PDNA-000050",
    name: "DJ Rashad",
    country: "United States",
    region: "US",
    city: "Chicago",
    scenes: ["footwork", "juke"],
    genres: ["footwork", "electronic", "hip_hop"],
    eras: ["internet_beatmaker_era", "streaming_social_platform_era"],
    producerRoles: ["dj_producer", "beatmaker", "sampling_architect"],
    coreDnaAngle: "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed.",
    capsuleSummary: "Uses rapid-fire sample mutation and battle rhythm to create emotional footwork intensity."
  }
];

const SOURCE_LINKS = {
  musicbrainz: "https://musicbrainz.org/doc/MusicBrainz_Database",
  discogs: "https://www.discogs.com/developers/",
  wikidata: "https://www.wikidata.org/wiki/Property:P162",
  whosampled: "https://www.whosampled.com/",
  fma: "https://github.com/mdeff/fma"
} as const;

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildCreativeIterations = (
  producerId: string,
  coreDnaAngle: string
): CreativeIterationEntity[] =>
  ITERATION_TEMPLATES.map((label, index) => ({
    producerId,
    iterationId: `${producerId}-IT-${String(index + 1).padStart(2, "0")}`,
    label: `Iteration ${String(index + 1).padStart(2, "0")} - ${label}`,
    promptSeed: `Original direction based on ${coreDnaAngle} interpreted as ${label} without copying signature motifs.`,
    originalityTwist:
      "Blend with regional rhythm accents and alternate harmonic movement to stay reference-safe."
  }));

const buildPrompt = (name: string, coreDnaAngle: string, useCase: string): string =>
  `Create an original ${useCase.replace(/_/g, " ")} direction inspired by ${name}'s creative logic (${coreDnaAngle}) without reusing signature melodies, exact drum timing, vocal tags, or recognizable samples.`;

const buildSearchableFields = (
  row: BatchSeedRow,
  confidenceTier: ResearchConfidenceTier
): ProducerDnaRecord["searchable"] => {
  const verifiedFields = [
    row.producerId,
    row.name,
    row.country,
    row.region,
    row.scenes.join(" "),
    row.genres.join(" "),
    row.eras.join(" "),
    row.producerRoles.join(" "),
    confidenceTier
  ];
  const analyticalFields = [row.coreDnaAngle, row.capsuleSummary, "audible analysis"];
  const creativeFields = [
    "ethical type-beat translation",
    "originality warning",
    "fusion path",
    "iteration matrix"
  ];

  return {
    verifiedFields,
    analyticalFields,
    creativeFields,
    verifiedSearchText: normalizeText(verifiedFields.join(" ")),
    analyticalSearchText: normalizeText(analyticalFields.join(" ")),
    creativeSearchText: normalizeText(creativeFields.join(" ")),
    globalSearchText: normalizeText([...verifiedFields, ...analyticalFields, ...creativeFields].join(" "))
  };
};

const sanitizeByTaxonomy = (values: string[], taxonomy: readonly string[]): string[] =>
  values.filter((value) => taxonomy.includes(value));

const EMPTY_SCORE = {
  innovation: null,
  influence: null,
  technicalCraft: null,
  sonicIdentity: null,
  arrangementSkill: null,
  rhythmDesign: null,
  melodicHarmonicIdentity: null,
  soundDesign: null,
  mixingAesthetics: null,
  culturalImportance: null,
  commercialImpact: null,
  undergroundImpact: null,
  longevity: null,
  adaptability: null,
  originality: null
} as const;

export const PRODUCER_DNA_BATCH_001: ProducerDnaRecord[] = BATCH_001_ROWS.map((row) => {
  const confidenceTier: ResearchConfidenceTier = "C";
  const iterationList = buildCreativeIterations(row.producerId, row.coreDnaAngle);

  return {
    batchNumber: "001",
    producer: {
      producerId: row.producerId,
      name: row.name,
      realName: null,
      aliases: [],
      publicIdentity: null,
      country: row.country,
      city: row.city,
      region: row.region,
      activeYears: "research_pending",
      primaryScenes: row.scenes,
      officialLinks: []
    },
    producerAliases: [],
    works: [],
    credits: [
      {
        creditId: `${row.producerId}-CRED-01`,
        producerId: row.producerId,
        workId: null,
        role: "producer",
        creditedAs: row.name,
        confidenceTier,
        notes: "Seed-level producer credit imported from Batch 001."
      }
    ],
    sources: [
      {
        sourceId: `${row.producerId}-SRC-MB`,
        producerId: row.producerId,
        sourceUrl: SOURCE_LINKS.musicbrainz,
        sourceType: "musicbrainz",
        dateAccessed: new Date().toISOString(),
        reliabilityTier: "C",
        claimSupported: "Core producer and release graph ingestion target.",
        quoteOrSummary:
          "MusicBrainz is the relational base for artists, releases, recordings, works, labels, and relationships.",
        citationStatus: "pending"
      },
      {
        sourceId: `${row.producerId}-SRC-DG`,
        producerId: row.producerId,
        sourceUrl: SOURCE_LINKS.discogs,
        sourceType: "discogs",
        dateAccessed: new Date().toISOString(),
        reliabilityTier: "C",
        claimSupported: "Release-level contributor roles and credits.",
        quoteOrSummary:
          "Discogs API is used for release metadata, versions, track listings, and contributor credits.",
        citationStatus: "pending"
      },
      {
        sourceId: `${row.producerId}-SRC-WD`,
        producerId: row.producerId,
        sourceUrl: SOURCE_LINKS.wikidata,
        sourceType: "wikidata",
        dateAccessed: new Date().toISOString(),
        reliabilityTier: "C",
        claimSupported: "Linked entity relationships including producer property graph.",
        quoteOrSummary:
          "Wikidata is a linked-data enrichment layer and must be corroborated before A/B tier assignment.",
        citationStatus: "pending"
      },
      {
        sourceId: `${row.producerId}-SRC-WS`,
        producerId: row.producerId,
        sourceUrl: SOURCE_LINKS.whosampled,
        sourceType: "whosampled",
        dateAccessed: new Date().toISOString(),
        reliabilityTier: "C",
        claimSupported: "Sample/remix/cover relationship hints.",
        quoteOrSummary:
          "WhoSampled is used as relationship input for sample lineage and remix adjacency checks.",
        citationStatus: "needs_review"
      },
      {
        sourceId: `${row.producerId}-SRC-FMA`,
        producerId: row.producerId,
        sourceUrl: SOURCE_LINKS.fma,
        sourceType: "fma",
        dateAccessed: new Date().toISOString(),
        reliabilityTier: "C",
        claimSupported: "Genre and taxonomy normalization.",
        quoteOrSummary:
          "FMA hierarchy is used to normalize broad genre and scene tags.",
        citationStatus: "pending"
      }
    ],
    gearClaims: [
      {
        claimId: `${row.producerId}-GEAR-01`,
        producerId: row.producerId,
        category: "studio",
        value: "research_pending",
        claimStatus: "unknown",
        confidenceTier: "Unknown",
        sourceId: null
      }
    ],
    collaboratorEdges: [],
    influenceEdges: [],
    producerProfile: {
      producerId: row.producerId,
      capsuleSummary: row.capsuleSummary,
      artisticDna: row.coreDnaAngle,
      technicalDna:
        "Verified tools and workflow details pending source-backed extraction. Audible analysis currently marked D-tier.",
      researchConfidence: "D"
    },
    sonicDna: {
      producerId: row.producerId,
      atmosphere: 7,
      warmth: 6,
      grit: 5,
      polish: 6,
      darkness: 5,
      brightness: 5,
      density: 6,
      space: 6,
      distortion: 4,
      syntheticOrganicBalance: 5,
      analysisTier: "D"
    },
    rhythmicDna: {
      producerId: row.producerId,
      swing: "scene-dependent",
      gridPrecision: "variable",
      drumDensity: "contextual",
      grooveFamily: row.scenes[0] ?? "general",
      kickSnarePlacement: "analysis pending",
      hihatLanguage: "analysis pending",
      percussionBehavior: "analysis pending",
      tempoRanges: ["research_pending"],
      analysisTier: "D"
    },
    melodicHarmonicDna: {
      producerId: row.producerId,
      chordMood: "analysis pending",
      modality: "analysis pending",
      tonalCenterBehavior: "analysis pending",
      influences: row.genres,
      motifs: "analysis pending",
      dissonanceProfile: "analysis pending",
      unresolvedTensionProfile: "analysis pending",
      analysisTier: "D"
    },
    arrangementDna: {
      producerId: row.producerId,
      introStyle: "analysis pending",
      dropOrChorusBehavior: "analysis pending",
      loopEvolution: "analysis pending",
      transitions: "analysis pending",
      breakdowns: "analysis pending",
      tensionRelease: "analysis pending",
      momentDesign: "analysis pending",
      analysisTier: "D"
    },
    mixingDna: {
      producerId: row.producerId,
      lowEnd: "analysis pending",
      midrange: "analysis pending",
      highEndTexture: "analysis pending",
      loudness: "analysis pending",
      stereoField: "analysis pending",
      vocalPlacement: "analysis pending",
      reverbDelay: "analysis pending",
      compression: "analysis pending",
      saturationClipping: "analysis pending",
      analysisTier: "D"
    },
    samplingDna: {
      producerId: row.producerId,
      sourceTraditions: "analysis pending",
      choppingStyle: "analysis pending",
      pitchShifting: "analysis pending",
      filtering: "analysis pending",
      looping: "analysis pending",
      sampleEthics: "reference-safe translation required",
      clearanceStatus: "unknown",
      analysisTier: "D"
    },
    styleNuanceMap: {
      producerId: row.producerId,
      casualListener: "Hears recognizable scene energy and signature mood.",
      producers: "Notices rhythm language, spacing decisions, and motif economy.",
      engineers: "Focuses on gain structure, stereo decisions, and texture control.",
      artists: "Feels emotional framing and vocal-supportive arrangement choices.",
      djs: "Tracks transition utility, low-end behavior, and section movement.",
      beginnerMisunderstanding: "Confuses scene conventions with copyable formulas.",
      analysisTier: "D"
    },
    inspiredDirections: [
      {
        producerId: row.producerId,
        directionId: `${row.producerId}-DIR-01`,
        title: `${row.name} logic reinterpretation`,
        ethicalTranslation: `Translate ${row.coreDnaAngle} into new melodic and rhythmic material without imitation.`,
        intendedEmotion: "contextual",
        avoidImitationNotes: [
          "Do not copy recognizable melodies or hooks.",
          "Do not recreate signature drum timing exactly.",
          "Avoid artist-specific tags and trademarked motifs."
        ]
      }
    ],
    creativeIterations: iterationList,
    originalityWarnings: [
      {
        producerId: row.producerId,
        warningId: `${row.producerId}-WARN-01`,
        category: "melody",
        warning: "Avoid direct melodic lift from canonical songs."
      },
      {
        producerId: row.producerId,
        warningId: `${row.producerId}-WARN-02`,
        category: "drum_pattern",
        warning: "Avoid exact recreation of signature drum placements."
      },
      {
        producerId: row.producerId,
        warningId: `${row.producerId}-WARN-03`,
        category: "recognizable_sample",
        warning: "Do not use identifiable samples without verified clearance."
      }
    ],
    fusionPaths: [
      {
        producerId: row.producerId,
        pathId: `${row.producerId}-FUS-01`,
        combineWith: "contrast producer logic",
        genreOrRegionTarget: "cross-regional adaptation",
        emotionalTarget: "new emotional register",
        approach: `Fuse ${row.name}'s structural logic with a different rhythmic tradition and modern vocal space planning.`
      }
    ],
    promptExports: [
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-01`,
        useCase: "beat_making",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "beat making")
      },
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-02`,
        useCase: "song_direction",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "song direction")
      },
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-03`,
        useCase: "daw_session",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "DAW session planning")
      },
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-04`,
        useCase: "stem_generation",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "stem generation")
      },
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-05`,
        useCase: "mix_reference",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "mix reference")
      },
      {
        producerId: row.producerId,
        exportId: `${row.producerId}-PROMPT-06`,
        useCase: "artist_coaching",
        prompt: buildPrompt(row.name, row.coreDnaAngle, "artist coaching")
      }
    ],
    dnaScores: { ...EMPTY_SCORE },
    taxonomy: {
      eras: row.eras,
      genres: sanitizeByTaxonomy(row.genres, GENRE_SCENE_TAXONOMY),
      scenes: row.scenes,
      producerRoles: sanitizeByTaxonomy(row.producerRoles, PRODUCER_ROLE_TAXONOMY)
    },
    openQuestions: [
      "Which works should be promoted to Tier A from primary source confirmation?",
      "Which collaborator edges are historically central for this producer?",
      "Which gear claims are source-confirmed versus inferred?"
    ],
    searchable: buildSearchableFields(row, confidenceTier)
  };
});

export const BATCH_001_CONFIG = {
  batchNumber: "001",
  genreSceneFocus:
    "Global foundation producers across pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club music.",
  regionFocus: [
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
  eraFocus: "1950s-2020s",
  targetProducerCount: 50,
  selectionCriteria: [
    "historical_importance",
    "technical_influence",
    "recognizable_production_identity",
    "cross_genre_usefulness",
    "cultural_impact",
    "region_scene_diversity",
    "future_database_value"
  ]
} as const;

export const CONFIDENCE_RUBRIC = RESEARCH_CONFIDENCE_DEFINITIONS;

export const querySeedRows = (query: ProducerDnaQuery): ProducerDnaRecord[] => {
  const normalizedQuery = query.q ? normalizeText(query.q) : "";
  const searchScope = query.searchScope ?? "all";
  const genres = query.genres?.map((value) => normalizeText(value)) ?? [];
  const scenes = query.scenes?.map((value) => normalizeText(value)) ?? [];
  const eras = query.eras?.map((value) => normalizeText(value)) ?? [];
  const regions = query.regions?.map((value) => normalizeText(value)) ?? [];
  const roles = query.producerRoles?.map((value) => normalizeText(value)) ?? [];
  const tiers = query.confidenceTiers ?? [];
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);

  return PRODUCER_DNA_BATCH_001.filter((row) => {
    const searchText =
      searchScope === "verified"
        ? row.searchable.verifiedSearchText
        : searchScope === "analysis"
          ? row.searchable.analyticalSearchText
          : searchScope === "creative"
            ? row.searchable.creativeSearchText
            : row.searchable.globalSearchText;
    const qMatch = !normalizedQuery || searchText.includes(normalizedQuery);

    const genreMatch =
      genres.length === 0 ||
      genres.some((genre) => row.taxonomy.genres.some((candidate) => normalizeText(candidate) === genre));
    const sceneMatch =
      scenes.length === 0 ||
      scenes.some((scene) => row.taxonomy.scenes.some((candidate) => normalizeText(candidate) === scene));
    const eraMatch =
      eras.length === 0 ||
      eras.some((era) => row.taxonomy.eras.some((candidate) => normalizeText(candidate) === era));
    const regionMatch =
      regions.length === 0 || regions.includes(normalizeText(row.producer.region));
    const roleMatch =
      roles.length === 0 ||
      roles.some((role) =>
        row.taxonomy.producerRoles.some((candidate) => normalizeText(candidate) === role)
      );
    const tierMatch = tiers.length === 0 || row.sources.some((source) => tiers.includes(source.reliabilityTier));

    return qMatch && genreMatch && sceneMatch && eraMatch && regionMatch && roleMatch && tierMatch;
  })
    .slice()
    .sort((a, b) => a.producer.name.localeCompare(b.producer.name))
    .slice(0, limit);
};
