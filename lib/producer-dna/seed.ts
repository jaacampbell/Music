import type {
  ConfidenceTier,
  EraTag,
  ProducerDnaCapsule,
  ProducerScores,
  RoleTag
} from "@/lib/producer-dna/types";

const scores = (values: number[]): ProducerScores => ({
  innovation: values[0],
  influence: values[1],
  technicalCraft: values[2],
  sonicIdentity: values[3],
  arrangementSkill: values[4],
  rhythmDesign: values[5],
  melodicHarmonicIdentity: values[6],
  soundDesign: values[7],
  mixingAesthetics: values[8],
  culturalImportance: values[9],
  commercialImpact: values[10],
  undergroundImpact: values[11],
  longevity: values[12],
  adaptability: values[13],
  originality: values[14]
});

interface SeedInput {
  id: string;
  name: string;
  countryRegion: string;
  regionScene: string;
  primaryGenres: string[];
  sceneMovement: string;
  eras: EraTag[];
  roles: RoleTag[];
  coreDnaAngle: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  typeBeatDirection: string;
  originalityTwist: string;
  scores: number[];
  aliases?: string[];
  realName?: string;
  factConfidence?: ConfidenceTier;
  analysisConfidence?: ConfidenceTier;
  researchConfidenceNote?: string;
}

const DEFAULT_NOTE =
  "Historical facts need per-source citation (Tier A/B target). Audible/musicological analysis marked D-tier.";

const cap = (input: SeedInput): ProducerDnaCapsule => ({
  id: input.id,
  name: input.name,
  realName: input.realName,
  aliases: input.aliases ?? [],
  countryRegion: input.countryRegion,
  regionScene: input.regionScene,
  primaryGenres: input.primaryGenres,
  sceneMovement: input.sceneMovement,
  eras: input.eras,
  roles: input.roles,
  coreDnaAngle: input.coreDnaAngle,
  signatureSoundSummary: input.signatureSoundSummary,
  artisticDna: input.artisticDna,
  technicalDna: input.technicalDna,
  rhythmicDna: input.rhythmicDna,
  melodicHarmonicDna: input.melodicHarmonicDna,
  arrangementDna: input.arrangementDna,
  typeBeatDirection: input.typeBeatDirection,
  originalityTwist: input.originalityTwist,
  factConfidence: input.factConfidence ?? "C",
  analysisConfidence: input.analysisConfidence ?? "D",
  researchConfidenceNote: input.researchConfidenceNote ?? DEFAULT_NOTE,
  scores: scores(input.scores),
  batch: "001"
});

/**
 * Batch 001 — Global foundation producers (1950s–2020s).
 *
 * Verified facts (name/era/credits) are tagged factConfidence; the DNA prose
 * is audible/musicological analysis tagged analysisConfidence (D). Scores are
 * D/E-tier analytical estimates, NOT a popularity ranking.
 */
export const BATCH_001: ProducerDnaCapsule[] = [
  cap({
    id: "PDNA-000001",
    name: "George Martin",
    countryRegion: "United Kingdom",
    regionScene: "UK pop/rock studio era",
    primaryGenres: ["Rock", "Soul", "Film score"],
    sceneMovement: "British studio-pop / orchestral pop architecture",
    eras: ["tape-console"],
    roles: ["studio-producer", "arranger", "composer-producer"],
    coreDnaAngle:
      "Arrangement-as-production, orchestral pop architecture, studio imagination",
    signatureSoundSummary:
      "Orchestral imagination fused with pop song form; the studio used as a compositional instrument.",
    artisticDna:
      "Treats arrangement and sonic experimentation as the core creative act, not decoration.",
    technicalDna:
      "Tape-era multitrack craft, varispeed, tape loops, and orchestral overdubs (verify per source).",
    rhythmicDna:
      "Song-serving grooves; tempo and feel bent to support melody and narrative.",
    melodicHarmonicDna:
      "Classically informed harmony, countermelody, and string/brass voicings layered over pop changes.",
    arrangementDna:
      "Section-driven drama: orchestral builds, key modulations, and texture changes mark structure.",
    typeBeatDirection:
      "Orchestral-pop bed with live-feel strings and tape character; avoid copying specific motifs or scores.",
    originalityTwist:
      "Fuse orchestral-pop arrangement logic with modern hybrid-trap or cinematic rap space.",
    scores: [9, 10, 9, 9, 10, 6, 9, 7, 7, 10, 9, 6, 10, 9, 8]
  }),
  cap({
    id: "PDNA-000002",
    name: "Phil Spector",
    countryRegion: "United States",
    regionScene: "US pop",
    primaryGenres: ["Soul", "R&B", "Disco"],
    sceneMovement: "Wall of Sound pop",
    eras: ["wall-of-sound", "tape-console"],
    roles: ["studio-producer", "arranger"],
    coreDnaAngle:
      "Dense mono drama, layered percussion, \u201cwall\u201d arrangement thinking",
    signatureSoundSummary:
      "Massed instrumentation collapsed into dense, dramatic mono — orchestral pop as wall of sound.",
    artisticDna:
      "Maximal emotional saturation: many players doubling parts to create one huge texture.",
    technicalDna:
      "Echo chambers, doubled/tripled instruments, mono summing (verify per source).",
    rhythmicDna:
      "Driving backbeat with layered percussion (castanets, tambourine) thickening the pulse.",
    melodicHarmonicDna:
      "Simple, anthemic pop changes made grand by orchestration and reverb depth.",
    arrangementDna:
      "Build-and-release pop drama; everything points to a towering, reverberant chorus.",
    typeBeatDirection:
      "Dense, reverb-soaked percussion bed with anthemic chords; avoid imitating signature reverb chains.",
    originalityTwist:
      "Apply wall-of-sound density logic to ambient pop or modern orchestral drill.",
    scores: [8, 9, 8, 9, 8, 6, 7, 7, 7, 8, 9, 5, 7, 6, 8]
  }),
  cap({
    id: "PDNA-000003",
    name: "Quincy Jones",
    countryRegion: "United States",
    regionScene: "US jazz/R&B/pop",
    primaryGenres: ["Jazz", "R&B", "Soul", "Disco"],
    sceneMovement: "Sophisticated arrangement / elite collaborator architecture",
    eras: ["tape-console", "disco-electronic-studio", "midi-sampler"],
    roles: ["studio-producer", "arranger", "composer-producer", "executive-producer"],
    coreDnaAngle:
      "Sophisticated arrangement, groove polish, elite collaborator architecture",
    signatureSoundSummary:
      "Jazz-trained arrangement intelligence applied to glossy, groove-forward pop and R&B.",
    artisticDna:
      "Orchestrates talent and parts like a bandleader; the arrangement is the star.",
    technicalDna:
      "Big-band-to-pop arranging discipline plus high-end studio polish (verify per source).",
    rhythmicDna:
      "Tight, danceable pocket; horn and rhythm-section interplay built for groove.",
    melodicHarmonicDna:
      "Rich jazz/gospel harmony, lush voicings, and memorable melodic hooks.",
    arrangementDna:
      "Dynamic, section-aware arranging with stabs, breakdowns, and call-and-response.",
    typeBeatDirection:
      "Groove-polished R&B/funk bed with jazzy chords and live horns; avoid copying signature arrangements.",
    originalityTwist:
      "Blend big-band arrangement logic with modern Afrobeats or neo-soul rap.",
    scores: [9, 10, 10, 9, 10, 8, 9, 7, 9, 10, 10, 6, 10, 10, 8]
  }),
  cap({
    id: "PDNA-000004",
    name: "Brian Eno",
    countryRegion: "United Kingdom",
    regionScene: "UK art rock/ambient",
    primaryGenres: ["Ambient", "Experimental", "Rock", "Synthpop"],
    sceneMovement: "Art-rock / ambient / generative systems",
    eras: ["tape-console", "midi-sampler", "daw"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"],
    coreDnaAngle: "Systems, atmosphere, generative texture, emotional minimalism",
    signatureSoundSummary:
      "Process- and texture-first production: atmosphere, generative systems, and emotional restraint.",
    artisticDna:
      "Designs systems and constraints (Oblique Strategies, generative patches) that produce emotion.",
    technicalDna:
      "Tape treatments, synth/processing chains, and generative/looping methods (verify per source).",
    rhythmicDna:
      "Often beatless or slow-evolving pulse; rhythm emerges from texture more than drums.",
    melodicHarmonicDna:
      "Slow modal drift, suspended harmony, and unresolved ambient color.",
    arrangementDna:
      "Long-form evolution; layers fade in/out rather than verse-chorus structure.",
    typeBeatDirection:
      "Generative ambient pad bed with slow evolving texture; avoid copying specific patches or works.",
    originalityTwist:
      "Use generative texture logic under modern melodic rap or amapiano pads.",
    scores: [10, 10, 8, 9, 8, 4, 7, 10, 8, 9, 6, 9, 10, 9, 10]
  }),
  cap({
    id: "PDNA-000005",
    name: "Lee \u201cScratch\u201d Perry",
    countryRegion: "Jamaica",
    regionScene: "Jamaica dub/reggae",
    primaryGenres: ["Dub", "Reggae"],
    sceneMovement: "Dub / Black Ark studio surrealism",
    eras: ["dub-soundsystem", "tape-console"],
    roles: ["producer-auteur", "engineer-producer", "sound-designer"],
    coreDnaAngle:
      "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism",
    signatureSoundSummary:
      "The mixing studio as a surreal instrument: heavy effects, tape character, and spiritual chaos.",
    artisticDna:
      "Intuitive, ritualistic studio play; happy accidents and saturation become the art.",
    technicalDna:
      "Tape echo, spring reverb, layered effects, and creative overload (verify per source).",
    rhythmicDna:
      "Reggae one-drop foundations stretched and dubbed with drops and delay throws.",
    melodicHarmonicDna:
      "Simple roots-reggae harmony made strange by effects and submerged textures.",
    arrangementDna:
      "Live-mix dub arrangement: instruments dropped in/out, echo tails as structure.",
    typeBeatDirection:
      "Dub-treated reggae bed with tape echo and spring reverb; avoid copying signature dub mixes.",
    originalityTwist:
      "Apply dub drop/throw arrangement to electronic bass music or experimental rap.",
    scores: [10, 9, 8, 10, 8, 7, 6, 10, 8, 9, 5, 10, 9, 8, 10]
  }),
  cap({
    id: "PDNA-000006",
    name: "King Tubby",
    countryRegion: "Jamaica",
    regionScene: "Jamaica dub",
    primaryGenres: ["Dub", "Reggae"],
    sceneMovement: "Dub mixing / soundsystem",
    eras: ["dub-soundsystem", "tape-console"],
    roles: ["engineer-producer", "mix-engineer-producer", "sound-designer"],
    coreDnaAngle:
      "Mixer-as-composer, space, delay throws, bass-and-drum architecture",
    signatureSoundSummary:
      "The mixing desk as compositional tool: space, delay throws, and stripped bass-and-drum.",
    artisticDna:
      "Treats subtraction and the mix itself as the composition — remix as original art.",
    technicalDna:
      "Custom desk, high-pass filtering, reverb/delay sends, and live fader rides (verify per source).",
    rhythmicDna:
      "Riddim skeletons reduced to bass and drum, punctuated by dramatic drops.",
    melodicHarmonicDna:
      "Harmony hinted via filtered fragments rather than stated chords.",
    arrangementDna:
      "Dub arrangement: elements thrown into echo, muted, and reintroduced for tension.",
    typeBeatDirection:
      "Spacious dub mix focused on bass/drum with delay throws; avoid copying classic dub versions.",
    originalityTwist:
      "Use dub mixer-as-composer logic in dubstep, techno, or minimal trap.",
    scores: [10, 10, 9, 10, 8, 8, 5, 9, 10, 9, 5, 10, 9, 7, 10]
  }),
  cap({
    id: "PDNA-000007",
    name: "Giorgio Moroder",
    countryRegion: "Italy / Germany",
    regionScene: "Italy/Germany disco/electronic",
    primaryGenres: ["Disco", "Synthpop", "House"],
    sceneMovement: "Synth disco / Munich machine sound",
    eras: ["disco-electronic-studio"],
    roles: ["producer-auteur", "composer-producer", "sound-designer"],
    coreDnaAngle: "Sequenced propulsion, synth disco, machine sensuality",
    signatureSoundSummary:
      "Sequenced synth-bass propulsion turning disco into hypnotic, sensual machine music.",
    artisticDna:
      "Pioneers the 4-on-the-floor sequencer as emotional, sexy, forward motion.",
    technicalDna:
      "Moog/sequencer-driven basslines, click-locked machines, and synth layering (verify per source).",
    rhythmicDna:
      "Relentless straight-eighth sequencer groove; arpeggiated bass as the rhythmic engine.",
    melodicHarmonicDna:
      "Catchy minor/major synth motifs over driving disco changes.",
    arrangementDna:
      "Long, building electronic arrangement with filter sweeps and additive layering.",
    typeBeatDirection:
      "Arpeggiated synth-bass propulsion with filter motion; avoid copying signature sequences.",
    originalityTwist:
      "Map sequencer-propulsion logic onto modern hyperpop or melodic techno-rap.",
    scores: [10, 10, 9, 9, 8, 8, 7, 9, 8, 9, 9, 7, 9, 8, 9]
  }),
  cap({
    id: "PDNA-000008",
    name: "Tom Dowd",
    countryRegion: "United States",
    regionScene: "US soul/rock/jazz",
    primaryGenres: ["Soul", "Rock", "Jazz", "R&B"],
    sceneMovement: "Atlantic Records engineering innovation",
    eras: ["tape-console"],
    roles: ["engineer-producer", "studio-producer"],
    coreDnaAngle: "Engineering innovation, live feel, multitrack clarity",
    signatureSoundSummary:
      "Engineering-led clarity that captures live ensemble feel with pioneering multitrack craft.",
    artisticDna:
      "Serves the performance; technical innovation in service of natural, musical sound.",
    technicalDna:
      "Early multitrack adoption, balanced miking, and clean signal flow (verify per source).",
    rhythmicDna:
      "Locked-in live rhythm sections captured with punch and clarity.",
    melodicHarmonicDna:
      "Soul/jazz harmony preserved with transparent, uncolored capture.",
    arrangementDna:
      "Arrangements tracked live; clarity lets each section breathe naturally.",
    typeBeatDirection:
      "Live-feel soul/rock bed with transparent multitrack clarity; avoid copying specific records.",
    originalityTwist:
      "Combine live-tracked clarity with modern soul-sample chop production.",
    scores: [8, 8, 10, 7, 8, 6, 7, 6, 9, 8, 8, 6, 9, 8, 6]
  }),
  cap({
    id: "PDNA-000009",
    name: "Teo Macero",
    countryRegion: "United States",
    regionScene: "US jazz",
    primaryGenres: ["Jazz", "Experimental"],
    sceneMovement: "Jazz tape-editing / post-performance composition",
    eras: ["tape-console"],
    roles: ["studio-producer", "engineer-producer", "composer-producer"],
    coreDnaAngle:
      "Tape editing, jazz architecture, post-performance composition",
    signatureSoundSummary:
      "Tape splicing as composition: improvisation reassembled into new architecture after the fact.",
    artisticDna:
      "Treats recorded improvisation as raw material edited into structured works.",
    technicalDna:
      "Razor-blade tape editing, loops, and montage of session takes (verify per source).",
    rhythmicDna:
      "Fluid jazz rhythm re-sequenced via edits; grooves spliced and recombined.",
    melodicHarmonicDna:
      "Modal/free jazz harmony rearranged through editing rather than written changes.",
    arrangementDna:
      "Post-performance arrangement: structure created in the edit, not the take.",
    typeBeatDirection:
      "Edit-driven jazz collage with spliced live takes; avoid reusing recognizable session material.",
    originalityTwist:
      "Apply tape-montage logic to modern sample-collage or plunderphonic rap.",
    scores: [10, 8, 9, 8, 9, 6, 8, 7, 7, 8, 5, 8, 7, 8, 10]
  }),
  cap({
    id: "PDNA-000010",
    name: "Sylvia Robinson",
    countryRegion: "United States",
    regionScene: "US soul/early hip-hop",
    primaryGenres: ["Soul", "Hip-hop", "Funk"],
    sceneMovement: "Early rap records / Sugar Hill label vision",
    eras: ["disco-electronic-studio", "early-hip-hop-sampling"],
    roles: ["executive-producer", "label-architect", "studio-producer"],
    coreDnaAngle:
      "Label vision, early rap record architecture, commercial bridge-building",
    signatureSoundSummary:
      "Visionary label/record architecture that translated live rap culture into hit records.",
    artisticDna:
      "Sees the commercial format before the scene does; builds the bridge to records.",
    technicalDna:
      "Live re-played funk/disco grooves backing early rap (verify per source).",
    rhythmicDna:
      "Tight funk/disco band pockets engineered for danceable rap delivery.",
    melodicHarmonicDna:
      "Funk/disco vamps and bass riffs as durable harmonic foundations.",
    arrangementDna:
      "Long groove vamps with verse cycles built for MC performance.",
    typeBeatDirection:
      "Live-band funk vamp for rap delivery; avoid copying recognizable interpolations.",
    originalityTwist:
      "Blend early-rap live-band vamp logic with modern boom bap or Afro-rap.",
    scores: [9, 9, 7, 7, 7, 7, 6, 5, 6, 10, 8, 7, 7, 8, 8]
  }),
  cap({
    id: "PDNA-000011",
    name: "Rick Rubin",
    countryRegion: "United States",
    regionScene: "US hip-hop/rock",
    primaryGenres: ["Hip-hop", "Rock", "Metal"],
    sceneMovement: "Def Jam minimalism / cross-genre reduction",
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    roles: ["producer-auteur", "executive-producer"],
    coreDnaAngle: "Reduction, rawness, cross-genre minimal power",
    signatureSoundSummary:
      "Strip to essence: raw, minimal arrangements that maximize impact across genres.",
    artisticDna:
      "Subtractive producer-philosopher; removes everything that isn't the song's core.",
    technicalDna:
      "Minimal layering, dry/raw capture, and performance-first decisions (verify per source).",
    rhythmicDna:
      "Hard, exposed drum/rhythm; space around hits gives them weight.",
    melodicHarmonicDna:
      "Lets core riff or vocal carry harmony; little ornamentation.",
    arrangementDna:
      "Lean arrangement with dramatic restraint; arrangements feel skeletal and powerful.",
    typeBeatDirection:
      "Raw, minimal hard-hitting bed with lots of space; avoid copying specific records.",
    originalityTwist:
      "Apply reductionist logic to maximalist trap or orchestral rock crossover.",
    scores: [8, 10, 7, 9, 8, 7, 5, 6, 7, 9, 10, 7, 10, 10, 8]
  }),
  cap({
    id: "PDNA-000012",
    name: "Dr. Dre",
    realName: "Andre Young",
    countryRegion: "United States / Los Angeles",
    regionScene: "US West Coast hip-hop",
    primaryGenres: ["Hip-hop", "G-funk", "R&B"],
    sceneMovement: "G-funk / polished West Coast rap",
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    roles: ["producer-auteur", "mix-engineer-producer", "executive-producer"],
    coreDnaAngle: "Low-end authority, polished menace, vocal pocket control",
    signatureSoundSummary:
      "Cinematic, polished West Coast rap with deep low-end authority and precise vocal pockets.",
    artisticDna:
      "Perfectionist sound-sculptor; obsessive about groove, low-end, and vocal placement.",
    technicalDna:
      "Live re-played parts, meticulous mixing, deep sub control (verify per source).",
    rhythmicDna:
      "Laid-back funk swing with hard, deliberate kick/snare and head-nod pocket.",
    melodicHarmonicDna:
      "Minor-key synth leads, P-funk basslines, and moody melodic hooks.",
    arrangementDna:
      "Clean, spacious arrangement built around the rapper's pocket and hook impact.",
    typeBeatDirection:
      "Polished G-funk-adjacent bed with deep 808/sub and clear vocal lane; avoid copying signature leads.",
    originalityTwist:
      "Fuse West Coast low-end authority with UK drill or amapiano log-drum bounce.",
    scores: [8, 10, 10, 10, 9, 8, 7, 8, 10, 10, 10, 7, 10, 9, 8]
  }),
  cap({
    id: "PDNA-000013",
    name: "J Dilla",
    realName: "James Dewitt Yancey",
    aliases: ["Jay Dee"],
    countryRegion: "United States / Detroit",
    regionScene: "Detroit hip-hop",
    primaryGenres: ["Hip-hop", "Soul", "R&B"],
    sceneMovement: "Detroit beat scene, Soulquarians-adjacent production culture",
    eras: ["midi-sampler", "daw"],
    roles: ["beatmaker", "producer-auteur", "sampling-architect"],
    coreDnaAngle: "Humanized swing, asymmetry, emotional imperfection",
    signatureSoundSummary:
      "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection.",
    artisticDna:
      "The feeling that the machine is breathing — beats feel slightly bent, intimate, and conversational.",
    technicalDna:
      "Audible analysis suggests sampler-centered construction, non-rigid quantization, and loop transformation (verify tools per source).",
    rhythmicDna:
      "Loose kicks, late snares, swung hats, and microtiming that feels human rather than sloppy.",
    melodicHarmonicDna:
      "Soul/jazz/gospel fragments, short motifs, bittersweet chord color, unresolved emotional loops.",
    arrangementDna:
      "Often loop-based; replay value comes from pocket, texture, chops, drops, and subtle variation.",
    typeBeatDirection:
      "Warm sample-based beat with humanized swing, understated bass, dusty drums, emotional loop repetition. Avoid copying exact drum timing, sample choices, or chop patterns.",
    originalityTwist:
      "Combine Dilla-like humanized rhythm with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
    researchConfidenceNote:
      "Mixed: historical facts need citation; audible analysis marked as D-tier.",
    scores: [10, 10, 9, 10, 8, 10, 8, 8, 8, 9, 6, 10, 9, 7, 10]
  }),
  cap({
    id: "PDNA-000014",
    name: "DJ Premier",
    realName: "Christopher Martin",
    aliases: ["Preemo", "Primo"],
    countryRegion: "United States / New York",
    regionScene: "New York boom bap",
    primaryGenres: ["Hip-hop", "Boom bap"],
    sceneMovement: "NYC boom bap / Gang Starr",
    eras: ["midi-sampler", "daw"],
    roles: ["beatmaker", "dj-producer", "sampling-architect"],
    coreDnaAngle: "Chopped grit, scratched hooks, drum-loop authority",
    signatureSoundSummary:
      "Gritty chopped loops, scratched vocal hooks, and hard, authoritative boom-bap drums.",
    artisticDna:
      "DJ-first producer: turntable language and chops are the song's identity.",
    technicalDna:
      "Sampler chopping, layered breaks, and turntable scratching (verify per source).",
    rhythmicDna:
      "Hard, swung boom-bap drums with heavy, punchy snare and tight pocket.",
    melodicHarmonicDna:
      "Short jazz/soul stabs and bass chops forming minimal, looping harmony.",
    arrangementDna:
      "Loop-and-cut structure; scratched hooks replace sung choruses.",
    typeBeatDirection:
      "Gritty boom-bap loop with scratched-style hook and hard drums; avoid reusing recognizable chops.",
    originalityTwist:
      "Blend boom-bap chop authority with drill drum programming or jazz-rap live texture.",
    scores: [8, 10, 9, 10, 7, 9, 7, 7, 8, 9, 7, 10, 9, 6, 8]
  }),
  cap({
    id: "PDNA-000015",
    name: "RZA",
    realName: "Robert Diggs",
    countryRegion: "United States / Staten Island",
    regionScene: "Staten Island / Wu-Tang",
    primaryGenres: ["Hip-hop", "Soul"],
    sceneMovement: "Wu-Tang Clan / kung-fu cinema rap",
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    roles: ["producer-auteur", "sampling-architect", "composer-producer"],
    coreDnaAngle:
      "Dusty soul, martial arts cinema, raw texture, minor-key mythology",
    signatureSoundSummary:
      "Dusty soul chops, kung-fu film texture, raw lo-fi grit, and dark minor-key mythology.",
    artisticDna:
      "Builds a cinematic mythology; rawness and imperfection are deliberate atmosphere.",
    technicalDna:
      "Pitched soul samples, lo-fi sampler grit, and film dialogue cuts (verify per source).",
    rhythmicDna:
      "Hard, sometimes off-kilter drums with dusty swing and heavy kicks.",
    melodicHarmonicDna:
      "Minor-key soul loops, sped/slowed vocals, and ominous melodic fragments.",
    arrangementDna:
      "Loop-driven with cinematic skits, dialogue, and abrupt texture shifts.",
    typeBeatDirection:
      "Dusty minor-key soul chop with cinematic samples and raw drums; avoid recognizable soul/film clips.",
    originalityTwist:
      "Combine Wu-style dusty mythology with modern horrorcore trap or orchestral drill.",
    scores: [9, 9, 8, 10, 8, 8, 7, 8, 6, 9, 7, 10, 9, 8, 9]
  }),
  cap({
    id: "PDNA-000016",
    name: "Timbaland",
    realName: "Timothy Mosley",
    countryRegion: "United States / Virginia",
    regionScene: "Virginia hip-hop/R&B/pop",
    primaryGenres: ["Hip-hop", "R&B", "Synthpop"],
    sceneMovement: "Virginia futurist rap/R&B",
    eras: ["midi-sampler", "daw"],
    roles: ["producer-auteur", "beatmaker", "vocal-producer"],
    coreDnaAngle:
      "Percussive futurism, negative space, vocal rhythm as drum language",
    signatureSoundSummary:
      "Futuristic, percussive beats with negative space and vocals used as rhythmic instruments.",
    artisticDna:
      "Rhythm-obsessed innovator; treats every element, including voice, as percussion.",
    technicalDna:
      "Layered global percussion, beatbox/vocal stabs, and syncopated programming (verify per source).",
    rhythmicDna:
      "Syncopated, stuttering grooves with world-percussion accents and bounce.",
    melodicHarmonicDna:
      "Sparse exotic melodic motifs and bass riffs over rhythmic frameworks.",
    arrangementDna:
      "Negative-space arrangement; gaps and stutters define hooks as much as notes.",
    typeBeatDirection:
      "Syncopated percussive bed with negative space and vocal-chop rhythm; avoid copying signature stabs.",
    originalityTwist:
      "Fuse percussive-futurism with Afrobeats, baile funk, or hyperpop vocal chops.",
    scores: [10, 10, 9, 10, 8, 10, 7, 9, 8, 9, 10, 7, 9, 9, 10]
  }),
  cap({
    id: "PDNA-000017",
    name: "The Neptunes",
    aliases: ["Pharrell Williams", "Chad Hugo"],
    countryRegion: "United States / Virginia",
    regionScene: "Virginia pop/rap/R&B",
    primaryGenres: ["Hip-hop", "R&B", "Synthpop", "Funk"],
    sceneMovement: "Star Trak minimal-funk pop",
    eras: ["daw"],
    roles: ["production-collective", "producer-auteur", "beatmaker"],
    coreDnaAngle: "Sparse bounce, synthetic funk, weird minimal hooks",
    signatureSoundSummary:
      "Sparse, bouncy, synthetic funk with quirky minimal hooks and instantly identifiable space.",
    artisticDna:
      "Minimalist funk weirdos; a few odd, perfect sounds carry the whole record.",
    technicalDna:
      "Drum-machine programming, distinctive synth/keys patches, and dry punchy mixes (verify per source).",
    rhythmicDna:
      "Bouncy, snappy four-count grooves with crisp snaps and syncopated kick.",
    melodicHarmonicDna:
      "Simple, catchy synth/keyboard riffs with odd, memorable chord choices.",
    arrangementDna:
      "Stripped, hook-forward arrangement with playful breakdowns and space.",
    typeBeatDirection:
      "Sparse synthetic-funk bounce with a quirky lead hook; avoid copying signature patches/riffs.",
    originalityTwist:
      "Blend minimal-funk bounce with amapiano log-drums or experimental pop.",
    scores: [9, 10, 8, 10, 7, 9, 7, 9, 8, 9, 10, 6, 9, 9, 10]
  }),
  cap({
    id: "PDNA-000018",
    name: "Missy Elliott",
    realName: "Melissa Elliott",
    countryRegion: "United States / Virginia",
    regionScene: "Virginia hip-hop/R&B",
    primaryGenres: ["Hip-hop", "R&B"],
    sceneMovement: "Virginia futurist rap/R&B",
    eras: ["daw"],
    roles: ["vocal-producer", "producer-auteur", "arranger"],
    coreDnaAngle:
      "Vocal-producer imagination, playful futurism, rhythm-first song design",
    signatureSoundSummary:
      "Playful, futuristic, rhythm-first song design driven by vocal-production imagination.",
    artisticDna:
      "Designs songs from the vocal hook and rhythm outward; fearless, fun futurism.",
    technicalDna:
      "Vocal arrangement, ad-lib layering, and rhythmic chant structures (verify per source).",
    rhythmicDna:
      "Bouncy, chant-driven grooves where vocal cadence is the main rhythm.",
    melodicHarmonicDna:
      "Catchy minimal melodic hooks supporting playful, syncopated vocals.",
    arrangementDna:
      "Hook-saturated, call-and-response arrangement with surprising switch-ups.",
    typeBeatDirection:
      "Rhythm-first bounce with space for chant hooks and ad-libs; avoid copying signature cadences.",
    originalityTwist:
      "Combine vocal-rhythm song design with Jersey club or Afrobeats chant logic.",
    scores: [9, 9, 8, 9, 8, 9, 7, 8, 7, 9, 9, 6, 8, 9, 9]
  }),
  cap({
    id: "PDNA-000019",
    name: "Metro Boomin",
    realName: "Leland Wayne",
    countryRegion: "United States / Atlanta (St. Louis-born)",
    regionScene: "Atlanta trap",
    primaryGenres: ["Trap", "Hip-hop"],
    sceneMovement: "Modern Atlanta trap / cinematic trap",
    eras: ["daw", "streaming-social"],
    roles: ["beatmaker", "producer-auteur"],
    coreDnaAngle: "Dark cinematic trap, negative space, 808 mood architecture",
    signatureSoundSummary:
      "Dark, cinematic trap built on moody 808 architecture and deliberate negative space.",
    artisticDna:
      "Mood-first beatmaker; atmosphere and 808 weight carry emotional narrative.",
    technicalDna:
      "Tuned 808 glides, dark melodic samples, and crisp hi-hat programming (verify per source).",
    rhythmicDna:
      "Spacious trap pocket, rolling hats, and melodic 808 bass as lead rhythm.",
    melodicHarmonicDna:
      "Minor-key cinematic melodies, bells, and ominous pads with strong tonal mood.",
    arrangementDna:
      "Intro-driven cinematic builds, beat switches, and dramatic drops.",
    typeBeatDirection:
      "Dark cinematic trap with tuned 808 and spacious melody; avoid copying signature melodic phrases.",
    originalityTwist:
      "Fuse cinematic trap 808 mood with orchestral score or UK drill slides.",
    scores: [8, 10, 9, 10, 8, 9, 8, 8, 9, 9, 10, 8, 8, 8, 8]
  }),
  cap({
    id: "PDNA-000020",
    name: "Mike WiLL Made-It",
    realName: "Michael Williams",
    countryRegion: "United States / Atlanta",
    regionScene: "Atlanta trap/pop rap",
    primaryGenres: ["Trap", "Hip-hop", "R&B"],
    sceneMovement: "Atlanta trap-to-pop crossover",
    eras: ["daw", "streaming-social"],
    roles: ["beatmaker", "producer-auteur"],
    coreDnaAngle: "Elastic 808s, hard minimal loops, hook-forward trap design",
    signatureSoundSummary:
      "Elastic, gliding 808s and hard minimal loops engineered for hook-forward trap-pop.",
    artisticDna:
      "Hit-focused minimalist; finds the elastic 808 and loop that becomes the hook.",
    technicalDna:
      "Pitch-glide 808s, minimal melodic loops, and punchy drum programming (verify per source).",
    rhythmicDna:
      "Hard knock with elastic 808 movement and tight, simple hat patterns.",
    melodicHarmonicDna:
      "Minimal, catchy minor-key motifs designed to loop hypnotically.",
    arrangementDna:
      "Hook-forward loop arrangement with strong drops and clean vocal lanes.",
    typeBeatDirection:
      "Hard minimal trap loop with elastic 808 glide; avoid copying signature melodic loops.",
    originalityTwist:
      "Blend elastic-808 trap with reggaeton dembow or Afro-trap bounce.",
    scores: [7, 9, 8, 9, 7, 9, 7, 8, 8, 8, 10, 6, 8, 8, 7]
  }),
  cap({
    id: "PDNA-000021",
    name: "Zaytoven",
    realName: "Xavier Dotson",
    countryRegion: "United States / Atlanta",
    regionScene: "Atlanta trap/gospel",
    primaryGenres: ["Trap", "Hip-hop", "Gospel"],
    sceneMovement: "Atlanta trap-gospel",
    eras: ["daw", "streaming-social"],
    roles: ["beatmaker", "producer-auteur"],
    coreDnaAngle: "Church chords, loose piano, trap bounce, human touch",
    signatureSoundSummary:
      "Church-rooted piano chords and loose, hand-played melodies over bouncy trap drums.",
    artisticDna:
      "Gospel-musician feel in trap; live keyboard humanity over programmed knock.",
    technicalDna:
      "Hand-played piano/keys, preset synth leads, and quick beat construction (verify per source).",
    rhythmicDna:
      "Bouncy trap drums with skipping hats and a loose, human keyboard pocket.",
    melodicHarmonicDna:
      "Gospel/church chord progressions and bright piano runs with real voice-leading.",
    arrangementDna:
      "Loop-based with live-feel piano variation and simple hard drops.",
    typeBeatDirection:
      "Trap bounce under loose live-feel gospel piano; avoid copying signature piano runs.",
    originalityTwist:
      "Fuse trap-gospel piano with amapiano keys or soul-jazz chord voicings.",
    scores: [7, 9, 8, 9, 7, 8, 8, 6, 7, 8, 9, 7, 8, 7, 8]
  }),
  cap({
    id: "PDNA-000022",
    name: "Lex Luger",
    realName: "Lexus Lewis",
    countryRegion: "United States / Virginia",
    regionScene: "Southern trap",
    primaryGenres: ["Trap", "Hip-hop"],
    sceneMovement: "Maximal Southern trap (early 2010s)",
    eras: ["daw", "streaming-social"],
    roles: ["beatmaker"],
    coreDnaAngle: "Maximal brass/synth aggression, hard snare energy",
    signatureSoundSummary:
      "Maximal, aggressive trap with booming brass/synth stabs and explosive snare rolls.",
    artisticDna:
      "Energy-maximalist; designs beats as adrenaline and anthemic aggression.",
    technicalDna:
      "Orchestral brass/string presets, fast snare/hi-hat rolls, and loud 808s (verify per source).",
    rhythmicDna:
      "High-energy trap with dramatic snare rolls, triplet hats, and pounding 808.",
    melodicHarmonicDna:
      "Ominous minor brass/string motifs and bell stabs for cinematic menace.",
    arrangementDna:
      "Tension-building rolls into massive, anthemic drops.",
    typeBeatDirection:
      "Maximal trap with brass stabs and snare rolls; avoid copying signature orchestral hooks.",
    originalityTwist:
      "Blend maximal trap aggression with phonk or hybrid orchestral drill.",
    scores: [8, 9, 7, 9, 7, 9, 6, 7, 6, 8, 8, 7, 6, 6, 8]
  }),
  cap({
    id: "PDNA-000023",
    name: "Southside",
    realName: "Joshua Luellen",
    aliases: ["808 Mafia"],
    countryRegion: "United States / Atlanta",
    regionScene: "Atlanta trap",
    primaryGenres: ["Trap", "Hip-hop"],
    sceneMovement: "808 Mafia trap",
    eras: ["daw", "streaming-social"],
    roles: ["beatmaker", "production-collective"],
    coreDnaAngle: "Dark drum programming, high-energy 808 pressure",
    signatureSoundSummary:
      "Dark, high-pressure trap with aggressive drum programming and dominant 808 force.",
    artisticDna:
      "Pressure-and-menace specialist; relentless 808 and drum drive define the mood.",
    technicalDna:
      "Hard 808 tuning, dense hat programming, and dark melodic layers (verify per source).",
    rhythmicDna:
      "Driving trap with busy triplet hats, snappy snares, and heavy 808 pressure.",
    melodicHarmonicDna:
      "Dark minor melodies, bells, and ominous synth leads.",
    arrangementDna:
      "Energy-forward loop arrangement with hard drops and beat switches.",
    typeBeatDirection:
      "Dark high-energy trap with heavy 808 and busy hats; avoid copying signature melodies.",
    originalityTwist:
      "Combine 808-pressure trap with drill rhythm or industrial sound design.",
    scores: [7, 9, 8, 9, 7, 9, 7, 8, 7, 8, 9, 7, 8, 7, 7]
  }),
  cap({
    id: "PDNA-000024",
    name: "Madlib",
    realName: "Otis Jackson Jr.",
    aliases: ["Quasimoto", "Yesterdays New Quintet"],
    countryRegion: "United States / California",
    regionScene: "California underground hip-hop",
    primaryGenres: ["Hip-hop", "Jazz", "Soul"],
    sceneMovement: "Stones Throw underground / crate-digging collage",
    eras: ["midi-sampler", "daw"],
    roles: ["beatmaker", "producer-auteur", "sampling-architect"],
    coreDnaAngle: "Crate-digging collage, raw loops, jazz-damaged texture",
    signatureSoundSummary:
      "Crate-dug collage of raw, jazz-damaged loops with woozy, unpolished texture.",
    artisticDna:
      "Prolific crate-digging auteur; raw, off-the-cuff loops as personal jazz collage.",
    technicalDna:
      "Obscure vinyl sampling, minimal cleanup, and lo-fi texture (verify per source).",
    rhythmicDna:
      "Loose, dusty drums with swung, slightly off pocket and head-nod feel.",
    melodicHarmonicDna:
      "Jazz/psych/global samples with rich, unresolved harmonic fragments.",
    arrangementDna:
      "Short loop sketches, abrupt switches, and collage-like sequencing.",
    typeBeatDirection:
      "Raw jazz-damaged loop collage with dusty drums; avoid reusing recognizable samples.",
    originalityTwist:
      "Blend crate-collage texture with modern lo-fi or experimental jazz-rap.",
    scores: [9, 9, 8, 10, 7, 8, 8, 8, 6, 9, 6, 10, 9, 8, 10]
  }),
  cap({
    id: "PDNA-000025",
    name: "Pete Rock",
    realName: "Peter Phillips",
    countryRegion: "United States / New York",
    regionScene: "New York hip-hop",
    primaryGenres: ["Hip-hop", "Soul", "Jazz"],
    sceneMovement: "NYC soul-jazz boom bap",
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    roles: ["beatmaker", "dj-producer", "sampling-architect"],
    coreDnaAngle: "Warm horn loops, soul-jazz chops, head-nod elegance",
    signatureSoundSummary:
      "Warm horn-soul loops and elegant soul-jazz chops with deep head-nod pocket.",
    artisticDna:
      "Soul-warm craftsman; lush horns and chops create an elegant, nostalgic mood.",
    technicalDna:
      "Layered horn/soul samples, filtered chops, and punchy drums (verify per source).",
    rhythmicDna:
      "Hard yet smooth boom-bap drums with deep swing and warm low-end.",
    melodicHarmonicDna:
      "Soul/jazz horn loops with rich, warm harmony and memorable motifs.",
    arrangementDna:
      "Loop-driven with tasteful filtering, horn stabs, and smooth transitions.",
    typeBeatDirection:
      "Warm horn-soul boom-bap loop with head-nod drums; avoid reusing recognizable horn samples.",
    originalityTwist:
      "Fuse soul-jazz horn warmth with modern neo-soul or lo-fi rap.",
    scores: [8, 9, 8, 9, 7, 9, 8, 7, 8, 8, 7, 9, 8, 6, 8]
  }),
  cap({
    id: "PDNA-000026",
    name: "Marley Marl",
    realName: "Marlon Williams",
    countryRegion: "United States / New York (Queensbridge)",
    regionScene: "Queensbridge hip-hop",
    primaryGenres: ["Hip-hop", "Boom bap"],
    sceneMovement: "Juice Crew / early sampling science",
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    roles: ["beatmaker", "sampling-architect", "dj-producer"],
    coreDnaAngle: "Sampling architecture, drum reconstruction, early beat science",
    signatureSoundSummary:
      "Pioneering drum-sampling science: reconstructing breakbeats from individually sampled hits.",
    artisticDna:
      "Inventor-engineer of sampled drums; built the template for modern beat construction.",
    technicalDna:
      "Sampling individual drum hits and resequencing them — foundational beat science (verify per source).",
    rhythmicDna:
      "Punchy reconstructed breaks with crisp, sampled kicks/snares and tight swing.",
    melodicHarmonicDna:
      "Funk/soul stabs and bass chops as minimal looping harmony.",
    arrangementDna:
      "Loop-and-break arrangement built around the rebuilt drum pattern.",
    typeBeatDirection:
      "Reconstructed sampled-drum break with funk stabs; avoid reusing recognizable breaks.",
    originalityTwist:
      "Apply drum-reconstruction science to footwork, jungle, or modern boom bap.",
    scores: [10, 9, 9, 8, 7, 9, 6, 7, 7, 9, 7, 9, 8, 7, 9]
  }),
  cap({
    id: "PDNA-000027",
    name: "DJ Screw",
    realName: "Robert Earl Davis Jr.",
    countryRegion: "United States / Houston",
    regionScene: "Houston",
    primaryGenres: ["Hip-hop"],
    sceneMovement: "Chopped and screwed / Houston",
    eras: ["midi-sampler"],
    roles: ["dj-producer", "remixer"],
    coreDnaAngle: "Slowed time, syrup atmosphere, remix-as-worldbuilding",
    signatureSoundSummary:
      "Slowed, screwed remixing that warps time into a hazy, syrupy regional atmosphere.",
    artisticDna:
      "Turntable auteur who built a whole aesthetic world from tempo and pitch manipulation.",
    technicalDna:
      "Pitched-down playback, chopping/doubling, and tape-mix texture (verify per source).",
    rhythmicDna:
      "Heavily slowed grooves with stuttered chops and elongated swing.",
    melodicHarmonicDna:
      "Existing harmony pitched down into darker, woozier tonal color.",
    arrangementDna:
      "Remix-as-arrangement: chops, doubles, and tempo define the new structure.",
    typeBeatDirection:
      "Slowed, screwed-style hazy remix texture; avoid screwing recognizable copyrighted records.",
    originalityTwist:
      "Apply screw tempo/pitch logic to ambient, plugg, or vaporwave-adjacent beats.",
    scores: [9, 9, 7, 10, 6, 7, 6, 8, 6, 9, 6, 10, 8, 6, 10]
  }),
  cap({
    id: "PDNA-000028",
    name: "SOPHIE",
    realName: "Sophie Xeon",
    countryRegion: "United Kingdom / Scotland",
    regionScene: "UK/Scotland hyperpop/electronic",
    primaryGenres: ["Experimental", "Synthpop", "IDM"],
    sceneMovement: "PC Music-adjacent hyperpop / sound design",
    eras: ["daw", "streaming-social"],
    roles: ["sound-designer", "producer-auteur"],
    coreDnaAngle: "Plastic-metal sound design, extreme synthetic physicality",
    signatureSoundSummary:
      "Hyper-detailed synthetic sound design — plastic, metallic, and physically tactile textures.",
    artisticDna:
      "Treats synthesis as sculpture; builds new physical-feeling materials from pure sound.",
    technicalDna:
      "Modular/FM synthesis, extreme sound design, and pristine high-res mixing (verify per source).",
    rhythmicDna:
      "Sharp, synthetic, often glitchy rhythms with exaggerated transients and bounce.",
    melodicHarmonicDna:
      "Bright, candy-pop melodies twisted with detuned, alien harmonic color.",
    arrangementDna:
      "Maximal/minimal swings; sudden drops, silence, and explosive texture changes.",
    typeBeatDirection:
      "Synthetic plastic-metal sound-design bed with tactile transients; avoid copying signature patches.",
    originalityTwist:
      "Fuse hyperpop sound design with experimental club or modern R&B space.",
    scores: [10, 9, 9, 10, 8, 8, 7, 10, 9, 8, 6, 9, 7, 8, 10]
  }),
  cap({
    id: "PDNA-000029",
    name: "Arca",
    realName: "Alejandra Ghersi",
    countryRegion: "Venezuela / global",
    regionScene: "Venezuela/global experimental pop",
    primaryGenres: ["Experimental", "IDM", "Reggaeton"],
    sceneMovement: "Global experimental/deconstructed pop",
    eras: ["daw", "streaming-social"],
    roles: ["sound-designer", "producer-auteur"],
    coreDnaAngle: "Mutant sound design, body-horror beauty, fractured rhythm",
    signatureSoundSummary:
      "Mutant, fractured sound design balancing body-horror grotesquerie with fragile beauty.",
    artisticDna:
      "Transformation-as-aesthetic; identity, body, and sound are all in flux.",
    technicalDna:
      "Granular processing, pitch/time mutation, and dense sound design (verify per source).",
    rhythmicDna:
      "Fractured, irregular rhythms; reggaeton/club pulses warped and dismantled.",
    melodicHarmonicDna:
      "Fragile vocal melodies over dissonant, shifting, unstable harmony.",
    arrangementDna:
      "Through-composed, unpredictable arrangement with collapse and rebuild.",
    typeBeatDirection:
      "Fractured mutant sound design with warped club pulse; avoid copying signature vocal treatments.",
    originalityTwist:
      "Blend deconstructed-club mutation with ambient pop or experimental reggaeton.",
    scores: [10, 8, 9, 10, 8, 8, 8, 10, 8, 8, 5, 9, 7, 9, 10]
  }),
  cap({
    id: "PDNA-000030",
    name: "Burial",
    realName: "William Bevan",
    countryRegion: "United Kingdom",
    regionScene: "UK garage/dubstep",
    primaryGenres: ["Dubstep", "UK garage", "Ambient"],
    sceneMovement: "UK future garage / nocturnal electronic",
    eras: ["daw"],
    roles: ["producer-auteur", "sound-designer"],
    coreDnaAngle: "Ghostly urban ambience, shuffled drums, emotional decay",
    signatureSoundSummary:
      "Ghostly, rain-soaked urban ambience over shuffled garage drums and decayed vocal fragments.",
    artisticDna:
      "Melancholic atmosphere-builder; nostalgia and city-night loneliness as sound.",
    technicalDna:
      "Hand-placed (non-quantized) drums, vinyl crackle, and pitched vocal cuts (verify per source).",
    rhythmicDna:
      "Loose, swung 2-step garage shuffle with intentionally imperfect timing.",
    melodicHarmonicDna:
      "Wistful, hazy chords and detuned pads with bittersweet emotional color.",
    arrangementDna:
      "Long, drifting arrangement with ambient interludes and slow emotional swells.",
    typeBeatDirection:
      "Ghostly garage shuffle with rainy ambience and decayed vocal chops; avoid recognizable vocal samples.",
    originalityTwist:
      "Fuse future-garage melancholy with ambient rap or downtempo R&B.",
    scores: [9, 9, 8, 10, 8, 8, 8, 9, 8, 8, 6, 10, 8, 7, 10]
  }),
  cap({
    id: "PDNA-000031",
    name: "Aphex Twin",
    realName: "Richard D. James",
    aliases: ["AFX", "Polygon Window"],
    countryRegion: "United Kingdom / Ireland",
    regionScene: "UK/Ireland IDM",
    primaryGenres: ["IDM", "Ambient", "Techno", "Experimental"],
    sceneMovement: "Braindance / IDM",
    eras: ["midi-sampler", "daw"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"],
    coreDnaAngle: "Algorithmic rhythm, alien melody, playful technical extremity",
    signatureSoundSummary:
      "Algorithmic, hyper-complex rhythm paired with alien melody and playful technical extremity.",
    artisticDna:
      "Mad-scientist auteur; technical extremity and humor coexist with deep emotion.",
    technicalDna:
      "Custom software, breakbeat editing, and synthesis experimentation (verify per source).",
    rhythmicDna:
      "Ultra-complex programmed breaks, polyrhythm, and abrupt tempo/feel shifts.",
    melodicHarmonicDna:
      "Beautiful, eerie modal melodies and detuned, otherworldly harmony.",
    arrangementDna:
      "Unpredictable through-composition from ambient calm to chaotic intensity.",
    typeBeatDirection:
      "Complex programmed breaks under eerie modal melody; avoid copying signature drum edits.",
    originalityTwist:
      "Blend IDM breakbeat complexity with footwork or experimental trap.",
    scores: [10, 10, 10, 10, 9, 10, 8, 10, 8, 9, 6, 10, 9, 9, 10]
  }),
  cap({
    id: "PDNA-000032",
    name: "Daft Punk",
    aliases: ["Thomas Bangalter", "Guy-Manuel de Homem-Christo"],
    countryRegion: "France",
    regionScene: "France house/pop",
    primaryGenres: ["House", "Disco", "Synthpop", "Funk"],
    sceneMovement: "French house / robot pop",
    eras: ["daw", "disco-electronic-studio"],
    roles: ["production-collective", "producer-auteur"],
    coreDnaAngle: "Robotic funk, filter-house memory, vocoder mythology",
    signatureSoundSummary:
      "Robotic funk and filter-house nostalgia wrapped in vocoder-driven robot mythology.",
    artisticDna:
      "Human emotion through machines; nostalgia and funk fused with robotic persona.",
    technicalDna:
      "Filtered disco sampling/loops, vocoder/talkbox, and analog-warm mixing (verify per source).",
    rhythmicDna:
      "Four-on-the-floor house groove with funky, filtered, looping bounce.",
    melodicHarmonicDna:
      "Disco/funk chord loops and catchy vocoded vocal melodies.",
    arrangementDna:
      "Loop-and-filter builds with dramatic drops and additive layering.",
    typeBeatDirection:
      "Filtered disco-house loop with vocoder hook; avoid reusing recognizable disco samples.",
    originalityTwist:
      "Fuse filter-house funk with modern pop-rap or amapiano groove.",
    scores: [9, 10, 9, 10, 8, 8, 8, 9, 9, 10, 10, 7, 9, 8, 9]
  }),
  cap({
    id: "PDNA-000033",
    name: "Kraftwerk",
    aliases: ["Ralf H\u00fctter", "Florian Schneider"],
    countryRegion: "Germany",
    regionScene: "Germany electronic",
    primaryGenres: ["Synthpop", "Techno", "Experimental"],
    sceneMovement: "Electronic-pop foundation / man-machine",
    eras: ["disco-electronic-studio", "tape-console"],
    roles: ["production-collective", "composer-producer", "sound-designer"],
    coreDnaAngle:
      "Machine minimalism, sequencer logic, electronic-pop foundation",
    signatureSoundSummary:
      "Minimal man-machine pop built on sequencer logic — a foundation for electronic music.",
    artisticDna:
      "Concept-driven minimalists; the machine aesthetic itself is the artistic statement.",
    technicalDna:
      "Early sequencers, custom electronics, vocoders, and clean synth tones (verify per source).",
    rhythmicDna:
      "Precise, mechanical sequencer pulse with minimal, robotic percussion.",
    melodicHarmonicDna:
      "Simple, memorable synth motifs and clean, consonant harmony.",
    arrangementDna:
      "Repetitive, additive arrangement with subtle motif evolution.",
    typeBeatDirection:
      "Minimal sequencer-pulse synth bed with robotic motif; avoid copying signature melodies.",
    originalityTwist:
      "Apply machine-minimalism to electro-rap or modern minimal techno-pop.",
    scores: [10, 10, 8, 9, 8, 8, 7, 8, 7, 10, 8, 8, 10, 7, 10]
  }),
  cap({
    id: "PDNA-000034",
    name: "Wendy Carlos",
    countryRegion: "United States",
    regionScene: "US electronic/classical",
    primaryGenres: ["Experimental", "Film score", "Ambient"],
    sceneMovement: "Synth-classical / electronic orchestration",
    eras: ["disco-electronic-studio", "tape-console"],
    roles: ["composer-producer", "sound-designer", "arranger"],
    coreDnaAngle: "Synth translation, timbre discipline, electronic orchestration",
    signatureSoundSummary:
      "Disciplined electronic orchestration translating classical works to synthesizer timbre.",
    artisticDna:
      "Rigorous timbral craftsperson; treats the synth as a precise orchestral palette.",
    technicalDna:
      "Modular Moog programming, multitrack layering, and precise tuning (verify per source).",
    rhythmicDna:
      "Classical rhythmic structures realized with exact electronic articulation.",
    melodicHarmonicDna:
      "Classical harmony and counterpoint rendered in pure, controlled synth tone.",
    arrangementDna:
      "Orchestration-as-arrangement: voicing and timbre choices define structure.",
    typeBeatDirection:
      "Electronic-orchestral synth arrangement with precise timbre; avoid copying specific arrangements.",
    originalityTwist:
      "Fuse synth-orchestration discipline with cinematic trap or ambient score.",
    scores: [10, 9, 10, 9, 9, 6, 9, 9, 8, 9, 6, 8, 9, 7, 9]
  }),
  cap({
    id: "PDNA-000035",
    name: "Ryuichi Sakamoto",
    countryRegion: "Japan / global",
    regionScene: "Japan/global",
    primaryGenres: ["Synthpop", "Film score", "Ambient", "Experimental"],
    sceneMovement: "YMO / cinematic electronic-acoustic fusion",
    eras: ["disco-electronic-studio", "midi-sampler", "daw"],
    roles: ["composer-producer", "producer-auteur", "arranger"],
    coreDnaAngle:
      "Elegant harmony, electronic-acoustic fusion, cinematic restraint",
    signatureSoundSummary:
      "Elegant harmony and restraint bridging electronic and acoustic worlds with cinematic feel.",
    artisticDna:
      "Refined composer-auteur; emotional depth through restraint and exquisite harmony.",
    technicalDna:
      "Synth/MIDI programming blended with piano/orchestral recording (verify per source).",
    rhythmicDna:
      "From precise electro-pop sequencing to free, rubato cinematic pulse.",
    melodicHarmonicDna:
      "Sophisticated, bittersweet harmony with impressionist and modal color.",
    arrangementDna:
      "Spacious, dynamic arrangement balancing acoustic and electronic textures.",
    typeBeatDirection:
      "Restrained electronic-acoustic bed with elegant harmony; avoid copying signature themes.",
    originalityTwist:
      "Blend cinematic restraint with lo-fi rap or ambient amapiano.",
    scores: [9, 9, 10, 9, 10, 6, 10, 8, 8, 9, 7, 8, 10, 10, 9]
  }),
  cap({
    id: "PDNA-000036",
    name: "Yasutaka Nakata",
    countryRegion: "Japan",
    regionScene: "Japan J-pop/electro",
    primaryGenres: ["J-pop", "Synthpop", "House"],
    sceneMovement: "Japanese electro-pop (Perfume / Kyary)",
    eras: ["daw", "streaming-social"],
    roles: ["producer-auteur", "vocal-producer", "sound-designer"],
    coreDnaAngle:
      "Glossy synthetic pop, vocal processing, kawaii-futurist precision",
    signatureSoundSummary:
      "Glossy, precise synthetic J-pop with heavy vocal processing and kawaii-futurist sheen.",
    artisticDna:
      "Hyper-precise pop futurist; vocals and synths fused into one glossy machine.",
    technicalDna:
      "Heavy vocal tuning/chopping, bright synth design, and loud clean mixing (verify per source).",
    rhythmicDna:
      "Fast, tight electro/house grooves with crisp, snappy programmed drums.",
    melodicHarmonicDna:
      "Bright, catchy major-key J-pop melodies over energetic synth changes.",
    arrangementDna:
      "Maximal hook-stacked arrangement with rapid switch-ups and drops.",
    typeBeatDirection:
      "Glossy electro-pop bed with processed vocal chops; avoid copying signature vocal hooks.",
    originalityTwist:
      "Fuse kawaii-futurist electro-pop with hyperpop or future-bass rap.",
    scores: [8, 8, 9, 9, 8, 8, 8, 9, 9, 8, 9, 6, 8, 8, 8]
  }),
  cap({
    id: "PDNA-000037",
    name: "A. R. Rahman",
    countryRegion: "India",
    regionScene: "India film/pop",
    primaryGenres: ["Bollywood / Indian film", "Film score", "Synthpop"],
    sceneMovement: "Indian film music / orchestral-electronic fusion",
    eras: ["midi-sampler", "daw"],
    roles: ["composer-producer", "arranger", "producer-auteur"],
    coreDnaAngle:
      "Orchestral-electronic fusion, spiritual melody, cinematic scale",
    signatureSoundSummary:
      "Grand orchestral-electronic fusion with spiritual melody and cinematic scale.",
    artisticDna:
      "Spiritual, genre-spanning composer; melody and devotion at cinematic scale.",
    technicalDna:
      "Layered orchestral, Indian classical, and electronic production (verify per source).",
    rhythmicDna:
      "Blends Indian classical/folk rhythm with electronic and orchestral grooves.",
    melodicHarmonicDna:
      "Raga-influenced, soaring melody fused with lush Western harmony.",
    arrangementDna:
      "Large, dynamic arrangements blending choir, orchestra, and synths.",
    typeBeatDirection:
      "Orchestral-electronic fusion bed with soaring melody; avoid copying specific themes or ragas verbatim.",
    originalityTwist:
      "Fuse cinematic Indian fusion with global club, Afrobeats, or melodic rap.",
    scores: [9, 9, 10, 9, 10, 7, 10, 8, 8, 10, 9, 6, 9, 10, 9]
  }),
  cap({
    id: "PDNA-000038",
    name: "Max Martin",
    realName: "Karl Martin Sandberg",
    countryRegion: "Sweden",
    regionScene: "Sweden pop",
    primaryGenres: ["Synthpop", "R&B"],
    sceneMovement: "Swedish pop hit factory (Cheiron lineage)",
    eras: ["daw"],
    roles: ["producer-auteur", "vocal-producer", "arranger"],
    coreDnaAngle: "Hook architecture, melodic math, chorus engineering",
    signatureSoundSummary:
      "Precision hook architecture and 'melodic math' engineering choruses for maximum recall.",
    artisticDna:
      "Systematic hit-craftsman; melody and phrasing optimized like engineering.",
    technicalDna:
      "Melodic-math phrasing, vocal stacking, and polished pop mixing (verify per source).",
    rhythmicDna:
      "Tight, punchy pop grooves serving syllable-perfect vocal phrasing.",
    melodicHarmonicDna:
      "Powerful, symmetrical melodic hooks over strong, simple pop changes.",
    arrangementDna:
      "Tension-to-chorus arrangement engineered for maximum payoff and recall.",
    typeBeatDirection:
      "Polished pop bed engineered around a strong chorus lane; avoid copying signature toplines.",
    originalityTwist:
      "Apply hook-architecture logic to melodic rap or K-pop crossover.",
    scores: [7, 10, 9, 8, 9, 7, 9, 7, 9, 9, 10, 4, 9, 9, 7]
  }),
  cap({
    id: "PDNA-000039",
    name: "Shellback",
    realName: "Karl Johan Schuster",
    countryRegion: "Sweden",
    regionScene: "Sweden pop",
    primaryGenres: ["Synthpop", "Rock"],
    sceneMovement: "Modern Swedish pop (with Max Martin)",
    eras: ["daw"],
    roles: ["producer-auteur", "arranger", "vocal-producer"],
    coreDnaAngle: "Modern pop punch, guitar/synth hybrid hooks",
    signatureSoundSummary:
      "Punchy modern pop with guitar/synth hybrid hooks and big, clean energy.",
    artisticDna:
      "Energy-and-hook craftsman; merges rock punch with pop precision.",
    technicalDna:
      "Guitar/synth layering, punchy drum programming, and bright mixing (verify per source).",
    rhythmicDna:
      "Driving, punchy pop-rock grooves with crisp, energetic drums.",
    melodicHarmonicDna:
      "Big, catchy hooks over guitar-and-synth-backed pop changes.",
    arrangementDna:
      "Dynamic verse-to-chorus lifts with strong instrumental hooks.",
    typeBeatDirection:
      "Guitar/synth hybrid pop bed with punchy energy; avoid copying signature riffs.",
    originalityTwist:
      "Fuse pop-rock punch with hyperpop or pop-trap crossover.",
    scores: [7, 8, 9, 8, 9, 7, 8, 7, 9, 8, 10, 4, 8, 8, 7]
  }),
  cap({
    id: "PDNA-000040",
    name: "Nile Rodgers",
    countryRegion: "United States",
    regionScene: "US disco/funk/pop",
    primaryGenres: ["Disco", "Funk", "R&B", "Synthpop"],
    sceneMovement: "Chic / disco-funk architecture",
    eras: ["disco-electronic-studio", "tape-console", "daw"],
    roles: ["band-member-producer", "producer-auteur", "arranger"],
    coreDnaAngle:
      "Guitar groove architecture, live-dance precision, elegant repetition",
    signatureSoundSummary:
      "Crisp rhythm-guitar groove architecture built for dancing — elegant, precise repetition.",
    artisticDna:
      "Groove-as-architecture; the rhythm guitar riff is the song's structural engine.",
    technicalDna:
      "Tight live rhythm-section tracking and clean funk-guitar capture (verify per source).",
    rhythmicDna:
      "Precise, syncopated rhythm-guitar chucks locked to a danceable pocket.",
    melodicHarmonicDna:
      "Funky extended chords and bass riffs forming hypnotic, elegant grooves.",
    arrangementDna:
      "Repetition-with-variation arrangement; groove sustains across long sections.",
    typeBeatDirection:
      "Funky rhythm-guitar groove with live-dance precision; avoid copying signature riffs.",
    originalityTwist:
      "Fuse disco-funk guitar architecture with house, Afrobeats, or pop-rap.",
    scores: [8, 10, 9, 10, 8, 9, 8, 7, 8, 10, 10, 6, 10, 9, 8]
  }),
  cap({
    id: "PDNA-000041",
    name: "Trevor Horn",
    countryRegion: "United Kingdom",
    regionScene: "UK synthpop/new wave",
    primaryGenres: ["Synthpop", "Rock"],
    sceneMovement: "UK studio-maximalist new wave (ZTT)",
    eras: ["midi-sampler", "disco-electronic-studio"],
    roles: ["studio-producer", "producer-auteur", "sound-designer"],
    coreDnaAngle: "Hyper-detailed pop production, studio maximalism, digital sheen",
    signatureSoundSummary:
      "Hyper-detailed, maximalist pop production with cutting-edge digital sheen.",
    artisticDna:
      "Studio-maximalist visionary; embraces new technology for grand pop spectacle.",
    technicalDna:
      "Early Fairlight sampling, dense overdubs, and meticulous editing (verify per source).",
    rhythmicDna:
      "Big, precise programmed and live grooves with dramatic gated drums.",
    melodicHarmonicDna:
      "Lush, anthemic harmony with layered hooks and orchestral synth color.",
    arrangementDna:
      "Cinematic, section-rich arrangement with dramatic builds and detail.",
    typeBeatDirection:
      "Maximalist synthpop bed with gated drums and digital sheen; avoid copying signature productions.",
    originalityTwist:
      "Fuse studio-maximalism with hyperpop or cinematic pop-trap.",
    scores: [9, 9, 10, 9, 10, 7, 8, 9, 9, 8, 9, 6, 9, 9, 8]
  }),
  cap({
    id: "PDNA-000042",
    name: "Flood",
    realName: "Mark Ellis",
    countryRegion: "United Kingdom",
    regionScene: "UK alternative/electronic rock",
    primaryGenres: ["Rock", "Synthpop", "Experimental"],
    sceneMovement: "Alternative/industrial-leaning rock production",
    eras: ["midi-sampler", "daw"],
    roles: ["studio-producer", "engineer-producer", "sound-designer"],
    coreDnaAngle: "Industrial space, texture-forward rock, atmospheric mixing",
    signatureSoundSummary:
      "Texture-forward alternative rock with industrial space and atmospheric, immersive mixing.",
    artisticDna:
      "Atmosphere-and-texture producer; space and sound design serve the band's mood.",
    technicalDna:
      "Creative effects, sampling/loops within rock, and spatial mixing (verify per source).",
    rhythmicDna:
      "Driving rock and programmed grooves with industrial weight and space.",
    melodicHarmonicDna:
      "Moody, atmospheric harmony supporting guitar and synth textures.",
    arrangementDna:
      "Dynamic, immersive arrangement balancing texture, space, and impact.",
    typeBeatDirection:
      "Atmospheric texture-forward rock bed with industrial space; avoid copying specific records.",
    originalityTwist:
      "Fuse industrial-rock atmosphere with electronic trap or dark ambient.",
    scores: [8, 8, 9, 9, 8, 7, 7, 9, 9, 8, 8, 7, 9, 9, 8]
  }),
  cap({
    id: "PDNA-000043",
    name: "Nigel Godrich",
    countryRegion: "United Kingdom",
    regionScene: "UK alternative rock",
    primaryGenres: ["Rock", "Experimental", "Ambient"],
    sceneMovement: "UK art-rock (Radiohead-associated)",
    eras: ["daw"],
    roles: ["studio-producer", "engineer-producer", "producer-auteur"],
    coreDnaAngle: "Intimate abstraction, band texture, emotional digital-era space",
    signatureSoundSummary:
      "Intimate, abstract band textures with emotional, digital-era spatial production.",
    artisticDna:
      "Texture-intimacy auteur; blends warm band feel with abstract digital processing.",
    technicalDna:
      "Hybrid analog/digital capture, creative processing, and detailed editing (verify per source).",
    rhythmicDna:
      "Organic band grooves intercut with programmed/processed rhythmic texture.",
    melodicHarmonicDna:
      "Rich, unconventional harmony framed with spacious, emotional color.",
    arrangementDna:
      "Detailed, dynamic arrangement balancing intimacy and abstraction.",
    typeBeatDirection:
      "Intimate band-texture bed with digital-era space; avoid copying specific records.",
    originalityTwist:
      "Fuse art-rock intimacy with ambient rap or electronic-acoustic R&B.",
    scores: [9, 8, 10, 9, 9, 6, 8, 8, 9, 8, 7, 8, 9, 9, 9]
  }),
  cap({
    id: "PDNA-000044",
    name: "Steve Albini",
    countryRegion: "United States",
    regionScene: "US alternative rock",
    primaryGenres: ["Rock", "Punk", "Noise"],
    sceneMovement: "Anti-gloss independent rock recording",
    eras: ["tape-console", "daw"],
    roles: ["engineer-producer", "band-member-producer"],
    coreDnaAngle: "Raw room sound, anti-gloss recording, performance realism",
    signatureSoundSummary:
      "Raw, honest room sound and anti-gloss recording capturing real performance energy.",
    artisticDna:
      "Documentarian engineer; captures the band as-is, rejecting artificial polish.",
    technicalDna:
      "Room miking, analog capture, and minimal processing for realism (verify per source).",
    rhythmicDna:
      "Powerful, natural live drums with real room dynamics and attack.",
    melodicHarmonicDna:
      "Harmony left to the band; capture serves raw performance, not sweetening.",
    arrangementDna:
      "Arrangement is the live performance; structure captured, not constructed.",
    typeBeatDirection:
      "Raw live-room rock capture with natural drums; avoid copying specific records.",
    originalityTwist:
      "Apply raw-room realism to live-band rap or noise-rock crossover.",
    scores: [7, 9, 10, 9, 6, 7, 5, 7, 8, 9, 6, 10, 9, 6, 8]
  }),
  cap({
    id: "PDNA-000045",
    name: "Linda Perry",
    countryRegion: "United States",
    regionScene: "US pop/rock",
    primaryGenres: ["Rock", "Synthpop", "Soul"],
    sceneMovement: "Song-first emotional pop/rock production",
    eras: ["daw"],
    roles: ["producer-auteur", "vocal-producer", "composer-producer"],
    coreDnaAngle: "Song-first emotional production, vocal-centered arrangements",
    signatureSoundSummary:
      "Song-first, emotionally direct production with arrangements built around the vocal.",
    artisticDna:
      "Songwriter-producer; emotional truth of the vocal drives every decision.",
    technicalDna:
      "Vocal-forward tracking and arrangement built to serve the lyric (verify per source).",
    rhythmicDna:
      "Supportive, dynamic grooves that follow the song's emotional arc.",
    melodicHarmonicDna:
      "Strong, emotive chord progressions framing a central vocal melody.",
    arrangementDna:
      "Build-around-the-vocal arrangement with dynamic emotional swells.",
    typeBeatDirection:
      "Emotive song-first bed with clear vocal-centered space; avoid copying signature toplines.",
    originalityTwist:
      "Fuse song-first emotional production with soul-rap or singer-songwriter R&B.",
    scores: [7, 8, 8, 8, 9, 6, 9, 6, 8, 8, 9, 6, 8, 8, 7]
  }),
  cap({
    id: "PDNA-000046",
    name: "Tainy",
    realName: "Marcos Masis",
    countryRegion: "Puerto Rico",
    regionScene: "Puerto Rico reggaeton/Latin pop",
    primaryGenres: ["Reggaeton", "Latin pop", "Dembow"],
    sceneMovement: "Modern futuristic reggaeton",
    eras: ["daw", "streaming-social"],
    roles: ["producer-auteur", "beatmaker", "sound-designer"],
    coreDnaAngle:
      "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere",
    signatureSoundSummary:
      "Futuristic, atmospheric reggaeton evolving the dembow groove with sleek melodic design.",
    artisticDna:
      "Modernizer of reggaeton; atmosphere and sound design push the genre forward.",
    technicalDna:
      "Polished dembow programming, lush synth atmosphere, and clean mixing (verify per source).",
    rhythmicDna:
      "Evolved dembow pocket with crisp percussion and modern bounce.",
    melodicHarmonicDna:
      "Atmospheric, melodic minor-key motifs and lush pads over dembow.",
    arrangementDna:
      "Dynamic arrangement with builds, drops, and atmospheric interludes.",
    typeBeatDirection:
      "Sleek futuristic dembow groove with melodic atmosphere; avoid copying signature melodies.",
    originalityTwist:
      "Fuse futuristic reggaeton with Afrobeats, hyperpop, or melodic trap.",
    scores: [9, 9, 9, 9, 8, 9, 8, 9, 9, 9, 10, 7, 8, 9, 8]
  }),
  cap({
    id: "PDNA-000047",
    name: "Luny Tunes",
    aliases: ["Francisco Salda\u00f1a", "V\u00edctor Cabrera"],
    countryRegion: "Puerto Rico",
    regionScene: "Puerto Rico reggaeton",
    primaryGenres: ["Reggaeton", "Dembow"],
    sceneMovement: "Classic reggaeton foundations",
    eras: ["daw"],
    roles: ["production-collective", "beatmaker"],
    coreDnaAngle: "Classic dembow architecture, club-reggaeton foundations",
    signatureSoundSummary:
      "Foundational dembow architecture that defined classic club reggaeton.",
    artisticDna:
      "Genre-architects; built the club-reggaeton template a generation followed.",
    technicalDna:
      "Classic dembow drum programming and synth-string hooks (verify per source).",
    rhythmicDna:
      "Signature dembow boom-ch-boom-chick pocket built for the club.",
    melodicHarmonicDna:
      "Catchy minor synth/string motifs over driving dembow grooves.",
    arrangementDna:
      "Club-ready loop arrangement with strong drops and vocal hooks.",
    typeBeatDirection:
      "Classic dembow club groove with synth-string hook; avoid copying signature riddims.",
    originalityTwist:
      "Fuse classic dembow with modern Afro-reggaeton or dancehall-trap.",
    scores: [8, 9, 7, 8, 7, 9, 6, 6, 7, 9, 9, 7, 8, 7, 7]
  }),
  cap({
    id: "PDNA-000048",
    name: "Sarz",
    realName: "Osabuohien Osaretin",
    countryRegion: "Nigeria",
    regionScene: "Nigeria Afrobeats",
    primaryGenres: ["Afrobeats"],
    sceneMovement: "Modern Afrobeats / Afropop",
    eras: ["daw", "streaming-social"],
    roles: ["producer-auteur", "beatmaker", "sound-designer"],
    coreDnaAngle: "Clean rhythmic bounce, melodic restraint, Afropop polish",
    signatureSoundSummary:
      "Clean, bouncy Afrobeats grooves with melodic restraint and polished space.",
    artisticDna:
      "Minimal-bounce specialist; restraint and groove create modern Afropop sophistication.",
    technicalDna:
      "Crisp percussion programming, log-drum/synth design, and clean mixing (verify per source).",
    rhythmicDna:
      "Syncopated Afrobeats pocket with crisp percussion and spacious bounce.",
    melodicHarmonicDna:
      "Restrained, catchy melodic motifs and warm, simple harmony.",
    arrangementDna:
      "Spacious, groove-forward arrangement with tasteful builds and drops.",
    typeBeatDirection:
      "Clean bouncy Afrobeats groove with restrained melody; avoid copying signature motifs.",
    originalityTwist:
      "Fuse Afrobeats bounce with amapiano log-drums or futuristic R&B.",
    scores: [8, 8, 9, 9, 8, 9, 7, 8, 9, 8, 9, 7, 8, 8, 8]
  }),
  cap({
    id: "PDNA-000049",
    name: "Kabza De Small",
    realName: "Kabelo Motha",
    countryRegion: "South Africa",
    regionScene: "South Africa amapiano",
    primaryGenres: ["Amapiano", "House"],
    sceneMovement: "Amapiano (the \u201cKing of Amapiano\u201d)",
    eras: ["daw", "streaming-social"],
    roles: ["producer-auteur", "beatmaker", "dj-producer"],
    coreDnaAngle: "Log-drum language, hypnotic piano loops, long-form groove",
    signatureSoundSummary:
      "Deep log-drum language and hypnotic piano loops driving long-form amapiano grooves.",
    artisticDna:
      "Groove-architect of amapiano; hypnosis and patience over quick payoff.",
    technicalDna:
      "Log-drum bass design, jazzy piano loops, and spacious house programming (verify per source).",
    rhythmicDna:
      "Mid-tempo, swung amapiano pocket led by the bouncing log-drum bass.",
    melodicHarmonicDna:
      "Jazzy, hypnotic piano chord loops with warm, soulful harmony.",
    arrangementDna:
      "Long-form, evolving arrangement with patient builds and groove shifts.",
    typeBeatDirection:
      "Hypnotic amapiano groove with log-drum and jazzy piano; avoid copying signature loops.",
    originalityTwist:
      "Fuse amapiano log-drum groove with Afro-house, lo-fi, or melodic rap.",
    scores: [9, 9, 8, 9, 8, 9, 8, 8, 8, 9, 9, 8, 8, 8, 9]
  }),
  cap({
    id: "PDNA-000050",
    name: "DJ Rashad",
    realName: "Rashad Harden",
    countryRegion: "United States / Chicago",
    regionScene: "Chicago footwork",
    primaryGenres: ["Footwork", "Jungle", "IDM"],
    sceneMovement: "Chicago footwork / Teklife",
    eras: ["daw"],
    roles: ["producer-auteur", "dj-producer", "sampling-architect"],
    coreDnaAngle:
      "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed",
    signatureSoundSummary:
      "Hyperkinetic 160 BPM footwork: chopped samples, battle rhythm, and emotional repetition.",
    artisticDna:
      "Battle-floor innovator; finds deep emotion within frantic, repetitive speed.",
    technicalDna:
      "Rapid sample chopping, triplet programming, and sparse sub-bass (verify per source).",
    rhythmicDna:
      "Fast (~160 BPM) syncopated triplet patterns with stuttered, rolling kicks.",
    melodicHarmonicDna:
      "Short chopped soul/vocal fragments looped into hypnotic emotional motifs.",
    arrangementDna:
      "Repetition-and-variation arrangement built for dance battles and trance.",
    typeBeatDirection:
      "Fast footwork triplet pattern with chopped vocal stabs; avoid reusing recognizable samples.",
    originalityTwist:
      "Fuse footwork rhythm with jungle, drum and bass, or experimental trap.",
    scores: [10, 9, 9, 10, 7, 10, 7, 8, 7, 9, 5, 10, 7, 7, 10]
  })
];
