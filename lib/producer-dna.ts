import type {
  BatchPlan,
  ConfidenceTier,
  ConfidenceTierInfo,
  EraSlug,
  ProducerCapsule,
  ProducerTaxonomy,
  ScoringDimension,
  TaxonomyTerm
} from "@/lib/types";

/**
 * Producer DNA Research base — Batch 001 seed data + taxonomies.
 *
 * Layer 1 (verified metadata), Layer 2 (audible/creative analysis) and Layer 3
 * (creative direction) are encoded per producer. Only data supplied for the
 * batch is treated as analysis (D-tier); verified facts default to
 * `needs-research` so nothing is presented as a citation it does not have.
 */

const ERAS: TaxonomyTerm<EraSlug>[] = [
  { slug: "pre-tape", label: "Pre-tape studio era" },
  { slug: "tape-console", label: "Tape / console era" },
  { slug: "wall-of-sound", label: "Wall of Sound era" },
  { slug: "dub-soundsystem", label: "Dub / soundsystem era" },
  { slug: "disco-electronic-studio", label: "Disco / electronic studio era" },
  { slug: "early-hiphop-sampling", label: "Early hip-hop sampling era" },
  { slug: "midi-sampler", label: "MIDI / sampler era" },
  { slug: "daw", label: "DAW era" },
  { slug: "internet-beatmaker", label: "Internet beatmaker era" },
  { slug: "streaming-social", label: "Streaming / social-platform era" },
  { slug: "ai-assisted", label: "AI-assisted production era" }
];

const GENRES: TaxonomyTerm[] = [
  { slug: "hip-hop", label: "Hip-hop" },
  { slug: "trap", label: "Trap" },
  { slug: "boom-bap", label: "Boom bap" },
  { slug: "g-funk", label: "G-funk" },
  { slug: "drill", label: "Drill" },
  { slug: "grime", label: "Grime" },
  { slug: "uk-garage", label: "UK garage" },
  { slug: "dubstep", label: "Dubstep" },
  { slug: "jungle", label: "Jungle" },
  { slug: "dnb", label: "Drum and bass" },
  { slug: "techno", label: "Techno" },
  { slug: "house", label: "House" },
  { slug: "footwork", label: "Footwork" },
  { slug: "ambient", label: "Ambient" },
  { slug: "idm", label: "IDM" },
  { slug: "synthpop", label: "Synthpop" },
  { slug: "disco", label: "Disco" },
  { slug: "funk", label: "Funk" },
  { slug: "r-n-b", label: "R&B" },
  { slug: "soul", label: "Soul" },
  { slug: "gospel", label: "Gospel" },
  { slug: "rock", label: "Rock" },
  { slug: "punk", label: "Punk" },
  { slug: "metal", label: "Metal" },
  { slug: "reggae", label: "Reggae" },
  { slug: "dub", label: "Dub" },
  { slug: "dancehall", label: "Dancehall" },
  { slug: "afrobeats", label: "Afrobeats" },
  { slug: "amapiano", label: "Amapiano" },
  { slug: "highlife", label: "Highlife" },
  { slug: "reggaeton", label: "Reggaeton" },
  { slug: "dembow", label: "Dembow" },
  { slug: "latin-pop", label: "Latin pop" },
  { slug: "baile-funk", label: "Baile funk / funk carioca" },
  { slug: "cumbia", label: "Cumbia" },
  { slug: "salsa", label: "Salsa" },
  { slug: "k-pop", label: "K-pop" },
  { slug: "j-pop", label: "J-pop" },
  { slug: "city-pop", label: "City pop" },
  { slug: "bollywood", label: "Bollywood / Indian film music" },
  { slug: "arabic-pop", label: "Arabic pop" },
  { slug: "experimental", label: "Experimental" },
  { slug: "noise", label: "Noise" },
  { slug: "jazz", label: "Jazz" },
  { slug: "film-score", label: "Film score" },
  { slug: "game-score", label: "Game score" },
  { slug: "pop", label: "Pop" }
];

const ROLES: TaxonomyTerm[] = [
  { slug: "beatmaker", label: "Beatmaker" },
  { slug: "producer-auteur", label: "Producer-auteur" },
  { slug: "studio-producer", label: "Studio producer" },
  { slug: "engineer-producer", label: "Engineer-producer" },
  { slug: "dj-producer", label: "DJ-producer" },
  { slug: "composer-producer", label: "Composer-producer" },
  { slug: "arranger", label: "Arranger" },
  { slug: "remixer", label: "Remixer" },
  { slug: "sound-designer", label: "Sound designer" },
  { slug: "executive-producer", label: "Executive producer" },
  { slug: "label-architect", label: "Label architect" },
  { slug: "sampling-architect", label: "Sampling architect" },
  { slug: "vocal-producer", label: "Vocal producer" },
  { slug: "mix-engineer-as-producer", label: "Mix engineer as producer" },
  { slug: "band-member-as-producer", label: "Band member as producer" },
  { slug: "production-collective", label: "Production collective" }
];

const CONFIDENCE_TIERS: ConfidenceTierInfo[] = [
  {
    tier: "A",
    meaning:
      "Confirmed by primary source, liner notes, official credits, interview, label, publisher, or direct archive"
  },
  { tier: "B", meaning: "Confirmed by multiple credible secondary sources" },
  { tier: "C", meaning: "Listed in open databases, but not yet independently verified" },
  { tier: "D", meaning: "Audible / musicological analysis" },
  { tier: "E", meaning: "Educated hypothesis requiring review" },
  { tier: "Unknown", meaning: "Not enough reliable information" }
];

const SCORING_DIMENSIONS: TaxonomyTerm<ScoringDimension>[] = [
  { slug: "innovation", label: "Innovation" },
  { slug: "influence", label: "Influence" },
  { slug: "technicalCraft", label: "Technical craft" },
  { slug: "sonicIdentity", label: "Sonic identity" },
  { slug: "arrangement", label: "Arrangement skill" },
  { slug: "rhythmDesign", label: "Rhythm design" },
  { slug: "melodicHarmonic", label: "Melodic / harmonic identity" },
  { slug: "soundDesign", label: "Sound design" },
  { slug: "mixingAesthetics", label: "Mixing aesthetics" },
  { slug: "culturalImportance", label: "Cultural importance" },
  { slug: "commercialImpact", label: "Commercial impact" },
  { slug: "undergroundImpact", label: "Underground impact" },
  { slug: "longevity", label: "Longevity" },
  { slug: "adaptability", label: "Adaptability" },
  { slug: "originality", label: "Originality" }
];

const BATCH_ROADMAP: BatchPlan[] = [
  {
    batch: "001",
    title: "Global foundation producers",
    focus:
      "Pop, hip-hop, electronic, dub, R&B, rock, film/game, Latin, Afrobeats, experimental, and regional club music, 1950s–2020s"
  },
  {
    batch: "002",
    title: "Hip-Hop Foundations",
    focus: "Bronx, Queens, Brooklyn, LA, Houston, Detroit, Memphis, New Orleans, Bay Area, Chicago"
  },
  {
    batch: "003",
    title: "Atlanta Trap / Modern Rap Production Trees",
    focus:
      "Organized Noize, Shawty Redd, Zaytoven, Drumma Boy, Lex Luger, 808 Mafia, Metro lineage, modern melodic trap"
  },
  {
    batch: "004",
    title: "Dub, Reggae, Dancehall, Soundsystem Producers",
    focus: "Jamaica, UK dub, digital dancehall, reggaeton connections"
  },
  {
    batch: "005",
    title: "Electronic Foundations",
    focus: "Kraftwerk, Detroit techno, Chicago house, acid, electro, synthpop, ambient, IDM"
  },
  {
    batch: "006",
    title: "UK Bass Continuum",
    focus: "Jungle, drum and bass, UK garage, grime, dubstep, future garage, UK funky, bassline"
  },
  {
    batch: "007",
    title: "Afrobeats, Amapiano, Highlife, African Club Music",
    focus: "Nigeria, Ghana, South Africa, Angola, Kenya, Tanzania, diaspora producers"
  },
  {
    batch: "008",
    title: "Latin, Caribbean, Reggaeton, Dembow, Funk Carioca",
    focus: "Puerto Rico, Dominican Republic, Colombia, Brazil, Panama, Cuba, Mexico, Argentina"
  },
  {
    batch: "009",
    title: "Pop Architects and Vocal Producers",
    focus: "Max Martin lineage, K-pop/J-pop producers, R&B vocal production, songwriter-producer systems"
  },
  {
    batch: "010",
    title: "Rock, Alternative, Punk, Metal, Indie Studio Producers",
    focus: "Tape-era producers, room-sound engineers, noise-rock, shoegaze, metal producers"
  },
  {
    batch: "011",
    title: "Film, Game, Ambient, Experimental, Sound Design Producers",
    focus: "Film composers, game composers, modular artists, sample-library innovators, sound designers"
  }
];

const JDILLA = (): ProducerCapsule => ({
  id: "PDNA-000013",
  name: "J Dilla",
  realName: "James Dewitt Yancey",
  region: "United States / Detroit",
  scenes: ["Detroit beat scene", "Soulquarians-adjacent production culture"],
  era: "midi-sampler",
  genres: ["hip-hop", "r-n-b", "soul"],
  roles: ["beatmaker", "sampling-architect", "producer-auteur"],
  coreDnaAngle: "Humanized swing, asymmetry, emotional imperfection",
  factStatus: "needs-research",
  analysisConfidence: "D",
  scores: {
    innovation: 10,
    influence: 10,
    technicalCraft: 9,
    sonicIdentity: 10,
    arrangement: 8,
    rhythmDesign: 10,
    melodicHarmonic: 9,
    soundDesign: 8,
    mixingAesthetics: 8,
    culturalImportance: 9,
    commercialImpact: 5,
    undergroundImpact: 10,
    longevity: 10,
    adaptability: 8,
    originality: 10
  },
  profile: {
    signatureSummary:
      "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection.",
    artisticDna:
      "Dilla's deeper logic is not just \u201cswing.\u201d It is the feeling that the machine is breathing. His beats often feel slightly bent, intimate, warm, and conversational.",
    technicalDna:
      "Verified tools must be researched per source (A-tier needed). Audible analysis suggests sampler-centered construction, non-rigid quantization, warm low-mid texture, and loop transformation.",
    sonicDna:
      "Warm, dusty, intimate; rounded low-mids, gentle high-end roll-off, organic rather than polished, analog-leaning saturation.",
    rhythmicDna:
      "Loose kicks, late snares, swung hats, and microtiming that feels human rather than sloppy.",
    melodicHarmonicDna:
      "Soul/jazz/gospel fragments, short motifs, bittersweet chord color, unresolved emotional loops.",
    arrangementDna:
      "Often loop-based, but replay value comes from pocket, texture, chops, drops, and subtle variation.",
    mixingDna:
      "Forward drums, glued low-mid warmth, vocals/samples sitting inside the bed rather than on top, restrained stereo width.",
    samplingDna:
      "Soul, jazz and gospel source traditions; expressive chopping and re-pitching; loops reshaped into new phrases. Clearance status varies per record and needs A/B-tier verification.",
    styleNuanceMap: {
      casualListeners: "It just feels good / head-nod warmth.",
      producers: "Deliberate off-grid timing and humanized quantization.",
      engineers: "Low-mid glue, soft transients, intentional lo-fi tone.",
      artists: "Space to ride the beat conversationally.",
      djs: "Loops that loop forever without fatigue.",
      beginnersMisunderstand:
        "That the swing is random or sloppy rather than a controlled feel."
    },
    inspiredDirection:
      "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Avoid copying exact drum timing, sample choices, or recognizable chop patterns.",
    originalityTwist:
      "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
    originalityWarnings: [
      "Do not copy exact drum micro-timing fingerprints.",
      "Do not reuse recognizable sample choices or signature chop patterns.",
      "Do not clone identifiable vocal-chop or tag motifs."
    ],
    fusionPaths: [
      "Dilla humanized rhythm logic + New Orleans bounce percussion",
      "Dilla warm loop feel + ambient pad textures",
      "Dilla pocket + modern melodic rap arrangement space"
    ],
    promptExports: [
      "Beat-making: 88-92 BPM hip-hop with humanized off-grid swing, dusty soul-jazz loop, understated sub bass, soft transient drums; original chords only, no recognizable samples.",
      "Mix reference: warm low-mid glue, gentle high roll-off, drums forward, sample bed underneath, narrow-to-medium stereo width.",
      "Song direction: conversational, bittersweet, loop-driven track with subtle 8-bar variation for replay value."
    ]
  }
});

/** Compact Batch 001 capsule builder for entries pending full expansion. */
const capsule = (
  id: string,
  name: string,
  region: string,
  scenes: string[],
  era: EraSlug,
  genres: string[],
  roles: string[],
  coreDnaAngle: string
): ProducerCapsule => ({
  id,
  name,
  region,
  scenes,
  era,
  genres,
  roles,
  coreDnaAngle,
  factStatus: "needs-research",
  analysisConfidence: "D",
  scores: {}
});

const PRODUCERS: ProducerCapsule[] = [
  capsule(
    "PDNA-000001",
    "George Martin",
    "United Kingdom",
    ["UK pop/rock studio era"],
    "tape-console",
    ["pop", "rock"],
    ["studio-producer", "arranger", "composer-producer"],
    "Arrangement-as-production, orchestral pop architecture, studio imagination"
  ),
  capsule(
    "PDNA-000002",
    "Phil Spector",
    "United States",
    ["US pop"],
    "wall-of-sound",
    ["pop", "rock"],
    ["studio-producer", "arranger", "producer-auteur"],
    "Dense mono drama, layered percussion, \u201cwall\u201d arrangement thinking"
  ),
  capsule(
    "PDNA-000003",
    "Quincy Jones",
    "United States",
    ["US jazz/R&B/pop"],
    "tape-console",
    ["jazz", "r-n-b", "pop", "soul", "funk"],
    ["studio-producer", "arranger", "composer-producer", "executive-producer"],
    "Sophisticated arrangement, groove polish, elite collaborator architecture"
  ),
  capsule(
    "PDNA-000004",
    "Brian Eno",
    "United Kingdom",
    ["UK art rock/ambient"],
    "disco-electronic-studio",
    ["ambient", "rock", "experimental"],
    ["producer-auteur", "sound-designer", "studio-producer"],
    "Systems, atmosphere, generative texture, emotional minimalism"
  ),
  capsule(
    "PDNA-000005",
    "Lee \u201cScratch\u201d Perry",
    "Jamaica",
    ["Jamaica dub/reggae"],
    "dub-soundsystem",
    ["dub", "reggae"],
    ["studio-producer", "sound-designer", "producer-auteur"],
    "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism"
  ),
  capsule(
    "PDNA-000006",
    "King Tubby",
    "Jamaica",
    ["Jamaica dub"],
    "dub-soundsystem",
    ["dub", "reggae"],
    ["engineer-producer", "mix-engineer-as-producer", "sound-designer"],
    "Mixer-as-composer, space, delay throws, bass-and-drum architecture"
  ),
  capsule(
    "PDNA-000007",
    "Giorgio Moroder",
    "Italy / Germany",
    ["Italy/Germany disco/electronic"],
    "disco-electronic-studio",
    ["disco", "synthpop", "pop"],
    ["producer-auteur", "studio-producer"],
    "Sequenced propulsion, synth disco, machine sensuality"
  ),
  capsule(
    "PDNA-000008",
    "Tom Dowd",
    "United States",
    ["US soul/rock/jazz"],
    "tape-console",
    ["soul", "rock", "jazz"],
    ["engineer-producer", "mix-engineer-as-producer"],
    "Engineering innovation, live feel, multitrack clarity"
  ),
  capsule(
    "PDNA-000009",
    "Teo Macero",
    "United States",
    ["US jazz"],
    "tape-console",
    ["jazz"],
    ["studio-producer", "composer-producer"],
    "Tape editing, jazz architecture, post-performance composition"
  ),
  capsule(
    "PDNA-000010",
    "Sylvia Robinson",
    "United States",
    ["US soul/early hip-hop"],
    "early-hiphop-sampling",
    ["soul", "hip-hop"],
    ["executive-producer", "label-architect", "studio-producer"],
    "Label vision, early rap record architecture, commercial bridge-building"
  ),
  capsule(
    "PDNA-000011",
    "Rick Rubin",
    "United States",
    ["US hip-hop/rock"],
    "midi-sampler",
    ["hip-hop", "rock"],
    ["producer-auteur", "studio-producer", "executive-producer"],
    "Reduction, rawness, cross-genre minimal power"
  ),
  capsule(
    "PDNA-000012",
    "Dr. Dre",
    "United States / West Coast",
    ["US West Coast hip-hop"],
    "midi-sampler",
    ["hip-hop", "g-funk"],
    ["producer-auteur", "studio-producer", "executive-producer", "mix-engineer-as-producer"],
    "Low-end authority, polished menace, vocal pocket control"
  ),
  JDILLA(),
  capsule(
    "PDNA-000014",
    "DJ Premier",
    "United States / New York",
    ["New York boom bap"],
    "midi-sampler",
    ["hip-hop", "boom-bap"],
    ["beatmaker", "dj-producer", "sampling-architect"],
    "Chopped grit, scratched hooks, drum-loop authority"
  ),
  capsule(
    "PDNA-000015",
    "RZA",
    "United States / Staten Island",
    ["Staten Island/Wu-Tang"],
    "midi-sampler",
    ["hip-hop", "boom-bap"],
    ["producer-auteur", "sampling-architect", "beatmaker"],
    "Dusty soul, martial arts cinema, raw texture, minor-key mythology"
  ),
  capsule(
    "PDNA-000016",
    "Timbaland",
    "United States / Virginia",
    ["Virginia hip-hop/R&B/pop"],
    "midi-sampler",
    ["hip-hop", "r-n-b", "pop"],
    ["producer-auteur", "beatmaker", "studio-producer"],
    "Percussive futurism, negative space, vocal rhythm as drum language"
  ),
  capsule(
    "PDNA-000017",
    "The Neptunes",
    "United States / Virginia",
    ["Virginia pop/rap/R&B"],
    "daw",
    ["pop", "hip-hop", "r-n-b"],
    ["production-collective", "producer-auteur", "beatmaker"],
    "Sparse bounce, synthetic funk, weird minimal hooks"
  ),
  capsule(
    "PDNA-000018",
    "Missy Elliott",
    "United States / Virginia",
    ["Virginia hip-hop/R&B"],
    "daw",
    ["hip-hop", "r-n-b"],
    ["vocal-producer", "producer-auteur"],
    "Vocal-producer imagination, playful futurism, rhythm-first song design"
  ),
  capsule(
    "PDNA-000019",
    "Metro Boomin",
    "United States / Atlanta",
    ["Atlanta trap"],
    "daw",
    ["trap", "hip-hop"],
    ["beatmaker", "producer-auteur"],
    "Dark cinematic trap, negative space, 808 mood architecture"
  ),
  capsule(
    "PDNA-000020",
    "Mike WiLL Made-It",
    "United States / Atlanta",
    ["Atlanta trap/pop rap"],
    "daw",
    ["trap", "hip-hop", "pop"],
    ["beatmaker", "producer-auteur"],
    "Elastic 808s, hard minimal loops, hook-forward trap design"
  ),
  capsule(
    "PDNA-000021",
    "Zaytoven",
    "United States / Atlanta",
    ["Atlanta trap/gospel"],
    "daw",
    ["trap", "gospel", "hip-hop"],
    ["beatmaker"],
    "Church chords, loose piano, trap bounce, human touch"
  ),
  capsule(
    "PDNA-000022",
    "Lex Luger",
    "United States / South",
    ["Southern trap"],
    "daw",
    ["trap", "hip-hop"],
    ["beatmaker"],
    "Maximal brass/synth aggression, hard snare energy"
  ),
  capsule(
    "PDNA-000023",
    "Southside",
    "United States / Atlanta",
    ["Atlanta trap"],
    "daw",
    ["trap", "hip-hop"],
    ["beatmaker", "production-collective"],
    "Dark drum programming, high-energy 808 pressure"
  ),
  capsule(
    "PDNA-000024",
    "Madlib",
    "United States / California",
    ["California underground hip-hop"],
    "midi-sampler",
    ["hip-hop", "jazz", "experimental"],
    ["beatmaker", "sampling-architect", "producer-auteur"],
    "Crate-digging collage, raw loops, jazz-damaged texture"
  ),
  capsule(
    "PDNA-000025",
    "Pete Rock",
    "United States / New York",
    ["New York hip-hop"],
    "midi-sampler",
    ["hip-hop", "boom-bap"],
    ["beatmaker", "dj-producer", "sampling-architect"],
    "Warm horn loops, soul-jazz chops, head-nod elegance"
  ),
  capsule(
    "PDNA-000026",
    "Marley Marl",
    "United States / Queensbridge",
    ["Queensbridge hip-hop"],
    "early-hiphop-sampling",
    ["hip-hop"],
    ["sampling-architect", "beatmaker", "dj-producer"],
    "Sampling architecture, drum reconstruction, early beat science"
  ),
  capsule(
    "PDNA-000027",
    "DJ Screw",
    "United States / Houston",
    ["Houston"],
    "midi-sampler",
    ["hip-hop"],
    ["dj-producer", "remixer"],
    "Slowed time, syrup atmosphere, remix-as-worldbuilding"
  ),
  capsule(
    "PDNA-000028",
    "SOPHIE",
    "United Kingdom / Scotland",
    ["UK/Scotland hyperpop/electronic"],
    "streaming-social",
    ["pop", "experimental"],
    ["sound-designer", "producer-auteur"],
    "Plastic-metal sound design, extreme synthetic physicality"
  ),
  capsule(
    "PDNA-000029",
    "Arca",
    "Venezuela / global",
    ["Venezuela/global experimental pop"],
    "daw",
    ["experimental", "pop"],
    ["sound-designer", "producer-auteur"],
    "Mutant sound design, body-horror beauty, fractured rhythm"
  ),
  capsule(
    "PDNA-000030",
    "Burial",
    "United Kingdom",
    ["UK garage/dubstep"],
    "daw",
    ["uk-garage", "dubstep"],
    ["producer-auteur", "sound-designer"],
    "Ghostly urban ambience, shuffled drums, emotional decay"
  ),
  capsule(
    "PDNA-000031",
    "Aphex Twin",
    "United Kingdom / Ireland",
    ["UK/Ireland IDM"],
    "midi-sampler",
    ["idm", "ambient", "experimental"],
    ["producer-auteur", "sound-designer"],
    "Algorithmic rhythm, alien melody, playful technical extremity"
  ),
  capsule(
    "PDNA-000032",
    "Daft Punk",
    "France",
    ["France house/pop"],
    "daw",
    ["house", "pop"],
    ["production-collective", "producer-auteur"],
    "Robotic funk, filter-house memory, vocoder mythology"
  ),
  capsule(
    "PDNA-000033",
    "Kraftwerk",
    "Germany",
    ["Germany electronic"],
    "disco-electronic-studio",
    ["synthpop"],
    ["production-collective", "producer-auteur", "sound-designer"],
    "Machine minimalism, sequencer logic, electronic-pop foundation"
  ),
  capsule(
    "PDNA-000034",
    "Wendy Carlos",
    "United States",
    ["US electronic/classical"],
    "disco-electronic-studio",
    ["film-score", "experimental"],
    ["composer-producer", "sound-designer"],
    "Synth translation, timbre discipline, electronic orchestration"
  ),
  capsule(
    "PDNA-000035",
    "Ryuichi Sakamoto",
    "Japan / global",
    ["Japan/global"],
    "disco-electronic-studio",
    ["synthpop", "film-score", "pop"],
    ["composer-producer", "producer-auteur"],
    "Elegant harmony, electronic-acoustic fusion, cinematic restraint"
  ),
  capsule(
    "PDNA-000036",
    "Yasutaka Nakata",
    "Japan",
    ["Japan J-pop/electro"],
    "daw",
    ["j-pop", "synthpop"],
    ["producer-auteur", "vocal-producer"],
    "Glossy synthetic pop, vocal processing, kawaii-futurist precision"
  ),
  capsule(
    "PDNA-000037",
    "A. R. Rahman",
    "India",
    ["India film/pop"],
    "midi-sampler",
    ["bollywood", "film-score", "pop"],
    ["composer-producer", "arranger"],
    "Orchestral-electronic fusion, spiritual melody, cinematic scale"
  ),
  capsule(
    "PDNA-000038",
    "Max Martin",
    "Sweden",
    ["Sweden pop"],
    "daw",
    ["pop"],
    ["producer-auteur", "studio-producer"],
    "Hook architecture, melodic math, chorus engineering"
  ),
  capsule(
    "PDNA-000039",
    "Shellback",
    "Sweden",
    ["Sweden pop"],
    "daw",
    ["pop", "rock"],
    ["producer-auteur", "studio-producer"],
    "Modern pop punch, guitar/synth hybrid hooks"
  ),
  capsule(
    "PDNA-000040",
    "Nile Rodgers",
    "United States",
    ["US disco/funk/pop"],
    "disco-electronic-studio",
    ["disco", "funk", "pop"],
    ["studio-producer", "band-member-as-producer", "arranger"],
    "Guitar groove architecture, live-dance precision, elegant repetition"
  ),
  capsule(
    "PDNA-000041",
    "Trevor Horn",
    "United Kingdom",
    ["UK synthpop/new wave"],
    "disco-electronic-studio",
    ["synthpop", "pop"],
    ["studio-producer", "producer-auteur"],
    "Hyper-detailed pop production, studio maximalism, digital sheen"
  ),
  capsule(
    "PDNA-000042",
    "Flood",
    "United Kingdom",
    ["UK alternative/electronic rock"],
    "midi-sampler",
    ["rock", "experimental"],
    ["studio-producer", "engineer-producer"],
    "Industrial space, texture-forward rock, atmospheric mixing"
  ),
  capsule(
    "PDNA-000043",
    "Nigel Godrich",
    "United Kingdom",
    ["UK alternative rock"],
    "daw",
    ["rock"],
    ["studio-producer", "engineer-producer"],
    "Intimate abstraction, band texture, emotional digital-era space"
  ),
  capsule(
    "PDNA-000044",
    "Steve Albini",
    "United States",
    ["US alternative rock"],
    "tape-console",
    ["rock", "punk"],
    ["engineer-producer"],
    "Raw room sound, anti-gloss recording, performance realism"
  ),
  capsule(
    "PDNA-000045",
    "Linda Perry",
    "United States",
    ["US pop/rock"],
    "daw",
    ["pop", "rock"],
    ["producer-auteur", "vocal-producer", "studio-producer"],
    "Song-first emotional production, vocal-centered arrangements"
  ),
  capsule(
    "PDNA-000046",
    "Tainy",
    "Puerto Rico",
    ["Puerto Rico reggaeton/Latin pop"],
    "streaming-social",
    ["reggaeton", "latin-pop", "dembow"],
    ["producer-auteur", "beatmaker"],
    "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere"
  ),
  capsule(
    "PDNA-000047",
    "Luny Tunes",
    "Puerto Rico",
    ["Puerto Rico reggaeton"],
    "daw",
    ["reggaeton", "dembow"],
    ["production-collective", "beatmaker"],
    "Classic dembow architecture, club-reggaeton foundations"
  ),
  capsule(
    "PDNA-000048",
    "Sarz",
    "Nigeria",
    ["Nigeria Afrobeats"],
    "daw",
    ["afrobeats"],
    ["beatmaker", "producer-auteur"],
    "Clean rhythmic bounce, melodic restraint, Afropop polish"
  ),
  capsule(
    "PDNA-000049",
    "Kabza De Small",
    "South Africa",
    ["South Africa amapiano"],
    "streaming-social",
    ["amapiano"],
    ["producer-auteur", "dj-producer"],
    "Log-drum language, hypnotic piano loops, long-form groove"
  ),
  capsule(
    "PDNA-000050",
    "DJ Rashad",
    "United States / Chicago",
    ["Chicago footwork"],
    "daw",
    ["footwork"],
    ["dj-producer", "beatmaker", "sampling-architect"],
    "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed"
  )
];

export const getProducerTaxonomy = (): ProducerTaxonomy => ({
  eras: ERAS,
  genres: GENRES,
  roles: ROLES,
  confidenceTiers: CONFIDENCE_TIERS,
  scoringDimensions: SCORING_DIMENSIONS,
  batchRoadmap: BATCH_ROADMAP
});

export const listProducers = (): ProducerCapsule[] => PRODUCERS;

export const getProducer = (producerId: string): ProducerCapsule | undefined =>
  PRODUCERS.find(
    (producer) => producer.id.toLowerCase() === producerId.toLowerCase()
  );

export interface ProducerSearchFilters {
  query?: string;
  era?: EraSlug;
  genre?: string;
  role?: string;
  confidence?: ConfidenceTier;
}

export const searchProducers = (
  filters: ProducerSearchFilters
): ProducerCapsule[] => {
  const query = filters.query?.trim().toLowerCase();
  return PRODUCERS.filter((producer) => {
    if (filters.era && producer.era !== filters.era) return false;
    if (filters.genre && !producer.genres.includes(filters.genre)) return false;
    if (filters.role && !producer.roles.includes(filters.role)) return false;
    if (filters.confidence && producer.analysisConfidence !== filters.confidence) {
      return false;
    }
    if (query) {
      const haystack = [
        producer.id,
        producer.name,
        producer.realName ?? "",
        producer.region,
        producer.scenes.join(" "),
        producer.coreDnaAngle,
        producer.genres.join(" "),
        producer.roles.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
};

export interface PromptExportOptions {
  fusionWith?: string;
  emotionalTarget?: string;
}

export interface PromptExportResult {
  producerId: string;
  producerName: string;
  prompts: string[];
  originalityWarnings: string[];
  confidenceNote: string;
}

const genreLabel = (slug: string): string =>
  GENRES.find((genre) => genre.slug === slug)?.label ?? slug;

/**
 * Build ethical, reference-safe prompt exports for a producer. Uses the full
 * profile when available, otherwise derives a translation from the audible
 * core DNA angle. Always returns an explicit do-not-copy safeguard.
 */
export const generatePromptExport = (
  producerId: string,
  options: PromptExportOptions = {}
): PromptExportResult | undefined => {
  const producer = getProducer(producerId);
  if (!producer) return undefined;

  const genreText = producer.genres.map(genreLabel).join(", ");
  const prompts: string[] = [];

  if (producer.profile) {
    prompts.push(...producer.profile.promptExports);
  } else {
    prompts.push(
      `Beat-making: original ${genreText} track inspired by the creative logic of "${producer.coreDnaAngle}". Build new chords, drums, and melodies from scratch.`,
      `Song direction: capture the feeling of ${producer.name}'s approach (${producer.coreDnaAngle}) without imitating any specific record.`,
      `Mix reference: aim for the sonic character implied by "${producer.coreDnaAngle}" using your own sound sources.`
    );
  }

  if (options.fusionWith) {
    prompts.push(
      `Fusion path: combine ${producer.name}'s creative logic with ${options.fusionWith}, keeping both translated rather than copied.`
    );
  }
  if (options.emotionalTarget) {
    prompts.push(
      `Emotional target: steer the arrangement toward ${options.emotionalTarget} while preserving originality.`
    );
  }

  const originalityWarnings = producer.profile?.originalityWarnings ?? [
    "Do not copy recognizable melodies, signature drum patterns, or exact processing chains.",
    "Do not reuse identifiable samples, vocal tags, or patented arrangement habits.",
    "Translate the creative logic into original material instead of imitating any single record."
  ];

  return {
    producerId: producer.id,
    producerName: producer.name,
    prompts,
    originalityWarnings,
    confidenceNote:
      `Audible/creative analysis is ${producer.analysisConfidence}-tier; ` +
      `verified facts for this producer are "${producer.factStatus}" and require citation before A/B labeling.`
  };
};
