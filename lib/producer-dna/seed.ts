/**
 * Batch 001 — 50 seed producer capsules.
 *
 * Each capsule is a compressed Producer DNA entry per the operating brief.
 * Verified-metadata fields (keyWorks, credits, sources, gear, collaborators,
 * influences) are intentionally left as empty scaffolds — they must be filled
 * by the verification pipeline (metadata → source verification → key works …)
 * before being promoted out of tier C/D/E. This avoids fabricating facts.
 */

import type {
  DnaScore,
  EraId,
  OpenQuestion,
  ProducerCapsule,
  ProducerProfile,
  ProducerRecord,
  ProducerRole
} from "@/lib/producer-dna/types";

interface SeedInput {
  id: string;
  name: string;
  realName?: string;
  country: string;
  region?: string;
  activeYears: string;
  primaryGenres: string[];
  scene: string;
  primaryRoles: ProducerRole[];
  eras: EraId[];
  coreDnaAngle: string;
  signatureSoundSummary: string;
  artisticDna: string;
  technicalDna: string;
  rhythmicDna: string;
  melodicHarmonicDna: string;
  arrangementDna: string;
  inspiredDirection: string;
  originalityTwist: string;
  scoring: DnaScore;
  openQuestions?: OpenQuestion[];
}

const baseQuestions: OpenQuestion[] = [
  { question: "Confirm primary tools (DAW, sampler, console, signature synth) via interview or liner notes.", targetTier: "A" },
  { question: "Catalogue verified release credits via MusicBrainz/Discogs cross-check.", targetTier: "B" },
  { question: "Identify cleared vs. uncleared samples in the producer's catalogue (WhoSampled + clearance lookup).", targetTier: "B" }
];

const toProfile = (seed: SeedInput): ProducerProfile => {
  const producer: ProducerRecord = {
    id: seed.id,
    name: seed.name,
    realName: seed.realName,
    aliases: [],
    country: seed.country,
    region: seed.region,
    activeYears: seed.activeYears,
    primaryScenes: [seed.scene, ...seed.primaryGenres],
    primaryRoles: seed.primaryRoles,
    officialLinks: []
  };

  const capsule: ProducerCapsule = {
    id: seed.id,
    name: seed.name,
    country: seed.country,
    region: seed.region,
    primaryGenres: seed.primaryGenres,
    scene: seed.scene,
    coreDnaAngle: seed.coreDnaAngle,
    signatureSoundSummary: seed.signatureSoundSummary,
    artisticDna: seed.artisticDna,
    technicalDna: seed.technicalDna,
    rhythmicDna: seed.rhythmicDna,
    melodicHarmonicDna: seed.melodicHarmonicDna,
    arrangementDna: seed.arrangementDna,
    inspiredDirection: seed.inspiredDirection,
    originalityTwist: seed.originalityTwist,
    researchConfidence: {
      historicalFacts: "C",
      audibleAnalysis: "D"
    }
  };

  return {
    producer,
    capsule,
    scoring: seed.scoring,
    eras: seed.eras,
    keyWorks: [],
    credits: [],
    sources: [],
    gear: [],
    collaborators: [],
    influences: [],
    openQuestions: seed.openQuestions ?? baseQuestions
  };
};

const s = (
  values: Partial<DnaScore> & {
    innovation: number;
    influence: number;
    technicalCraft: number;
    sonicIdentity: number;
    arrangementSkill: number;
    rhythmDesign: number;
    melodicHarmonicIdentity: number;
    soundDesign: number;
    mixingAesthetics: number;
    culturalImportance: number;
    commercialImpact: number;
    undergroundImpact: number;
    longevity: number;
    adaptability: number;
    originality: number;
  }
): DnaScore => values;

const SEED_INPUTS: SeedInput[] = [
  {
    id: "PDNA-000001",
    name: "George Martin",
    country: "United Kingdom",
    region: "London",
    activeYears: "1950s–2010s",
    primaryGenres: ["rock", "pop"],
    scene: "UK pop/rock studio era",
    primaryRoles: ["studio-producer", "arranger", "composer-producer"],
    eras: ["tape-console"],
    coreDnaAngle: "Arrangement-as-production, orchestral pop architecture, studio imagination.",
    signatureSoundSummary:
      "Orchestral colour grafted onto pop song forms; tape editing as compositional tool; clean, voicing-aware mixes.",
    artisticDna:
      "Treats the studio as a composer's room. Pulls classical, music-hall, and avant-garde devices into 3-minute pop without losing the song.",
    technicalDna:
      "Audible mastery of arrangement layering, tape splicing, and analog signal flow. Specific consoles/instruments must be researched per source.",
    rhythmicDna:
      "Pocket led by live drums; tempo flexibility per take; deliberate ritardandos and tape-speed effects.",
    melodicHarmonicDna:
      "Tonal pop with chromatic substitutions, modal turns, and string/horn voicings that elevate the topline.",
    arrangementDna:
      "Section-led: intros set tone, bridges introduce new colour, fades carry payoff. Builds drama via instrumentation, not loudness.",
    inspiredDirection:
      "Orchestrally enriched pop with deliberate sectional contrast and tape-style ear candy. Avoid copying specific motifs or famous arrangements.",
    originalityTwist:
      "Fuse Martin-style arrangement discipline with modern hybrid orchestra + synth design and minimal hip-hop drum staging.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 6,
      longevity: 10,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000002",
    name: "Phil Spector",
    country: "United States",
    region: "Los Angeles",
    activeYears: "1958–2003",
    primaryGenres: ["pop", "r&b", "rock"],
    scene: "US pop",
    primaryRoles: ["producer-auteur", "arranger"],
    eras: ["wall-of-sound", "tape-console"],
    coreDnaAngle: "Dense mono drama, layered percussion, 'wall' arrangement thinking.",
    signatureSoundSummary:
      "Massed instrumentation tracked into a single dramatic mono image; reverb-as-architecture; vocal in front of cathedral.",
    artisticDna:
      "Maximalist romanticism: doubled and tripled parts treated as one instrument. Drama over clarity.",
    technicalDna:
      "Audible use of room reverb, heavy compression, and doubled rhythm-section stacking. Specific chain details must be sourced per session.",
    rhythmicDna:
      "Steady four-on-the-floor or shuffle pocket; percussion stacked (maracas, tambourine, castanets) for shimmer.",
    melodicHarmonicDna:
      "Doo-wop and Brill Building harmony with orchestral pop colour; major-key sentimentality with minor turns.",
    arrangementDna:
      "Build via additive layering; no empty space; choruses unleash full wall; ad-libs ride above.",
    inspiredDirection:
      "Mono-leaning maximal pop with stacked percussion shimmer and a single dominant vocal line. Avoid copying signature drum or string fills.",
    originalityTwist:
      "Apply the 'wall' philosophy to ambient pop or trap-soul: dense stacked layers but in a modern stereo field with clean low end.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 5,
      longevity: 8,
      adaptability: 6,
      originality: 9
    })
  },
  {
    id: "PDNA-000003",
    name: "Quincy Jones",
    country: "United States",
    activeYears: "1950s–2020s",
    primaryGenres: ["jazz", "r&b", "soul", "pop", "film score"],
    scene: "US jazz/R&B/pop",
    primaryRoles: ["studio-producer", "arranger", "composer-producer", "executive-producer"],
    eras: ["tape-console", "midi-sampler"],
    coreDnaAngle: "Sophisticated arrangement, groove polish, elite collaborator architecture.",
    signatureSoundSummary:
      "Tight session-musician pockets, horn/string voicings with jazz sophistication, glossy and groove-forward mixes.",
    artisticDna:
      "Curates the best player for every chair, then frames them. Producer-as-conductor-as-A&R.",
    technicalDna:
      "Audibly tight rhythm-section editing, jazz-informed horn writing, multi-stage mixing across eras of analog and digital studios.",
    rhythmicDna:
      "Backbeat funk with jazz swing, tight 16ths on hats, precise but human pocket.",
    melodicHarmonicDna:
      "Extended jazz harmony (9ths, 11ths, alterations) inside pop structures; modulation as climax tool.",
    arrangementDna:
      "Pre-chorus lifts, signature horn punches, breakdown into ad-lib zone, key change for final chorus.",
    inspiredDirection:
      "Pop-soul with jazz-informed voicings and surgical groove polish. Avoid imitating specific famous arrangements or signature horn lines.",
    originalityTwist:
      "Pair Quincy-style harmonic sophistication with sparse modern trap-soul drums and minimal vocal stacking.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 10,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 7,
      longevity: 10,
      adaptability: 10,
      originality: 9
    })
  },
  {
    id: "PDNA-000004",
    name: "Brian Eno",
    country: "United Kingdom",
    activeYears: "1970s–present",
    primaryGenres: ["ambient", "art rock", "experimental"],
    scene: "UK art rock/ambient",
    primaryRoles: ["producer-auteur", "sound-designer", "composer-producer"],
    eras: ["tape-console", "midi-sampler", "daw"],
    coreDnaAngle: "Systems, atmosphere, generative texture, emotional minimalism.",
    signatureSoundSummary:
      "Long evolving pads, processed instruments, restrained dynamics; arrangement framed as a slow environment rather than a song event.",
    artisticDna:
      "Treats production as a rule-set: oblique strategies, generative patches, constraint-driven composition.",
    technicalDna:
      "Audible use of tape delays, modular routing, processing chains that transform source sounds beyond recognition.",
    rhythmicDna:
      "Often rhythmless or with subtle pulses; when drums appear they are dry, minimal, and human.",
    melodicHarmonicDna:
      "Modal/static harmony, suspended chords, melodies that hint rather than resolve.",
    arrangementDna:
      "Slow reveals, gradual layering, fade-in/fade-out as structural moves, almost no traditional chorus.",
    inspiredDirection:
      "Generative ambient bed with slow harmonic drift, processed organic timbres, and one quiet human element. Avoid copying recognizable Eno patches.",
    originalityTwist:
      "Combine Eno-style systems thinking with modern field-recording sound design and a quiet rhythmic skeleton from amapiano or footwork.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000005",
    name: "Lee “Scratch” Perry",
    country: "Jamaica",
    activeYears: "1960s–2021",
    primaryGenres: ["dub", "reggae"],
    scene: "Jamaica dub/reggae",
    primaryRoles: ["producer-auteur", "engineer-producer", "sound-designer"],
    eras: ["dub-soundsystem", "tape-console"],
    coreDnaAngle: "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism.",
    signatureSoundSummary:
      "Heavy spring reverbs, tape echo, percussion stacked with found sound; drums and bass anchor while everything else dissolves and reappears.",
    artisticDna:
      "Treats the mixing desk as a séance. Effects routed creatively to push tracks into surreal, dreamlike states.",
    technicalDna:
      "Audible Echoplex/spring-reverb use, creative bus routing, percussive object recordings. Specific session chains require source-by-source confirmation.",
    rhythmicDna:
      "One-drop reggae feels with extended drum/bass dropouts and percussive surprises.",
    melodicHarmonicDna:
      "Modal/minor blues with skanking chord stabs; melodic fragments treated as effect targets.",
    arrangementDna:
      "Dub-as-arrangement: extreme dropouts, sudden returns, vocal phrases echoed into infinity.",
    inspiredDirection:
      "Surreal dub-influenced beat with creative effect routing, dropout-heavy arrangement, and percussive found sound. Avoid copying signature dub stems.",
    originalityTwist:
      "Fuse Perry-style dub mixing with modern hyperpop sound design or amapiano low end.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000006",
    name: "King Tubby",
    realName: "Osbourne Ruddock",
    country: "Jamaica",
    activeYears: "1960s–1989",
    primaryGenres: ["dub", "reggae"],
    scene: "Jamaica dub",
    primaryRoles: ["engineer-producer", "mix-engineer-as-producer", "remixer"],
    eras: ["dub-soundsystem"],
    coreDnaAngle: "Mixer-as-composer, space, delay throws, bass-and-drum architecture.",
    signatureSoundSummary:
      "Massive low end, drum/bass-led versions, surgical delay throws on vocals and skanks, EQ used as performance.",
    artisticDna:
      "Demonstrates that the mix is a composition. Faders, EQ, and sends become instruments played live.",
    technicalDna:
      "Audible custom-modded console work and dub-plate culture; specifics on transformer mods/EQ tweaks must be sourced.",
    rhythmicDna:
      "Steady one-drop or rockers groove; emphasis on snare/kick relationship at sub volume.",
    melodicHarmonicDna:
      "Skank-led harmony; melody often reduced to fragments and reintroduced via delay.",
    arrangementDna:
      "Build and strip: pull the drums, drop the bass, throw delay, return. Tension lives in dropouts.",
    inspiredDirection:
      "Drum/bass-anchored dub-aware beat with surgical FX throws and a live-feeling mix-as-arrangement. Avoid copying iconic version structures.",
    originalityTwist:
      "Apply Tubby-style mix-as-composition to a modern R&B or melodic rap track where the mix itself becomes the hook.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 6,
      soundDesign: 10,
      mixingAesthetics: 10,
      culturalImportance: 10,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 7,
      originality: 10
    })
  },
  {
    id: "PDNA-000007",
    name: "Giorgio Moroder",
    country: "Italy",
    region: "Munich (Musicland Studios)",
    activeYears: "1960s–present",
    primaryGenres: ["disco", "synthpop", "electronic"],
    scene: "Italy/Germany disco/electronic",
    primaryRoles: ["producer-auteur", "composer-producer"],
    eras: ["disco-electronic-studio"],
    coreDnaAngle: "Sequenced propulsion, synth disco, machine sensuality.",
    signatureSoundSummary:
      "Pulsing 16th-note synth bass, glossy strings, four-on-the-floor kick, vocoder/synth lead — disco mechanized.",
    artisticDna:
      "Bridges club and pop with a sequenced engine; treats repetition as hypnotic rather than empty.",
    technicalDna:
      "Audible analog sequencer + synth bass approach. Specific synth models documented in many interviews; verify per release.",
    rhythmicDna:
      "Four-on-the-floor with locked 16th hats, sequenced bass aligned tightly to grid.",
    melodicHarmonicDna:
      "Diatonic with chromatic lifts; modulating progressions; long, soaring vocal lines on top.",
    arrangementDna:
      "Long intros, sequenced bed established first, layered build to vocal, instrumental breakdowns for the club.",
    inspiredDirection:
      "Sequenced disco-pop with hypnotic 16ths, slow harmonic arc, and a vocal hook engineered for a long climb. Avoid copying signature Moroder basslines.",
    originalityTwist:
      "Combine Moroder-style sequencer pulse with modern reggaeton dembow or amapiano log drums.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000008",
    name: "Tom Dowd",
    country: "United States",
    activeYears: "1947–2002",
    primaryGenres: ["soul", "rock", "jazz", "r&b"],
    scene: "US soul/rock/jazz",
    primaryRoles: ["engineer-producer", "studio-producer", "mix-engineer-as-producer"],
    eras: ["tape-console"],
    coreDnaAngle: "Engineering innovation, live feel, multitrack clarity.",
    signatureSoundSummary:
      "Live ensemble captured with separation and air; drums punchy and natural; vocals up front; arrangements breathe.",
    artisticDna:
      "Engineer-producer who prioritizes the players' chemistry, then captures it cleanly.",
    technicalDna:
      "Audible early multitrack discipline; pioneered console workflow improvements documented in interviews and biographies.",
    rhythmicDna:
      "Human pocket from live rhythm sections; minimal editing; subtle pushed/pulled feels.",
    melodicHarmonicDna:
      "Soul/blues/jazz harmony captured faithfully; arrangements respect the song.",
    arrangementDna:
      "Trusts the band's arrangement; adds only what serves; lets dynamic builds emerge from performance.",
    inspiredDirection:
      "Live-feeling soul/rock production with separation and headroom; minimal automation; emphasis on real-performance dynamics. Avoid copying specific room signatures.",
    originalityTwist:
      "Apply Dowd-style live-capture discipline to a modern hybrid setup of live drums + synth-bass + sample loops.",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 8,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 10,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 7,
      longevity: 10,
      adaptability: 9,
      originality: 8
    })
  },
  {
    id: "PDNA-000009",
    name: "Teo Macero",
    country: "United States",
    activeYears: "1950s–2000s",
    primaryGenres: ["jazz"],
    scene: "US jazz",
    primaryRoles: ["producer-auteur", "engineer-producer", "composer-producer"],
    eras: ["tape-console"],
    coreDnaAngle: "Tape editing, jazz architecture, post-performance composition.",
    signatureSoundSummary:
      "Long-form jazz sessions reassembled into multi-section compositions via splice; ambient passages stitched against intense ensemble work.",
    artisticDna:
      "Producer-as-editor: the take is raw material; the record is constructed in post.",
    technicalDna:
      "Audible tape-splice transitions, loop-style returns; documented in interviews and Columbia Records production history.",
    rhythmicDna:
      "Driven by the jazz ensemble; tempos and feels can shift between edits.",
    melodicHarmonicDna:
      "Modal and post-bop colour; harmony is exploratory rather than functional.",
    arrangementDna:
      "Sectional collage: stitch contrasting takes; introduce silence; let an idea recur transformed.",
    inspiredDirection:
      "Post-recording editorial composition: track long, edit ruthlessly, let sections collide. Avoid copying specific famous edits or splice points.",
    originalityTwist:
      "Apply Macero-style splice-composition logic to modern improvised electronic jams or sample-based beat tapes.",
    scoring: s({
      innovation: 10,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 8,
      arrangementSkill: 10,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000010",
    name: "Sylvia Robinson",
    country: "United States",
    activeYears: "1950s–2011",
    primaryGenres: ["soul", "hip-hop"],
    scene: "US soul/early hip-hop",
    primaryRoles: ["executive-producer", "label-architect", "producer-auteur"],
    eras: ["disco-electronic-studio", "early-hip-hop-sampling"],
    coreDnaAngle: "Label vision, early rap record architecture, commercial bridge-building.",
    signatureSoundSummary:
      "Studio-band re-creations of disco/funk grooves under recorded raps; clean grooves with vocal as the foreground event.",
    artisticDna:
      "Producer-as-translator: takes a live street form and engineers a way to ship it on vinyl.",
    technicalDna:
      "Audible live-band session production behind early rap records; specific session musicians and arrangements are well-documented historically.",
    rhythmicDna:
      "Tight disco/funk pockets; consistent tempo; designed for vocal cadence and DJ blends.",
    melodicHarmonicDna:
      "Loop-friendly diatonic vamps lifted from disco-funk vocabulary.",
    arrangementDna:
      "Long instrumental sections to host long rap verses; minimal structural shifts; built for the dance floor.",
    inspiredDirection:
      "Long-form vocal-first grooves with disciplined backing-band pockets. Avoid copying recognizable hooks or basslines from foundational rap records.",
    originalityTwist:
      "Pair Robinson-style label discipline with current-generation regional sounds (drill, amapiano, baile funk) to create vocal-first 'event' records.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 8,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000011",
    name: "Rick Rubin",
    country: "United States",
    activeYears: "1980s–present",
    primaryGenres: ["hip-hop", "rock", "metal", "pop"],
    scene: "US hip-hop/rock",
    primaryRoles: ["producer-auteur", "executive-producer"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    coreDnaAngle: "Reduction, rawness, cross-genre minimal power.",
    signatureSoundSummary:
      "Stripped arrangements, dry drums, performance-forward vocal staging, almost no ear candy.",
    artisticDna:
      "Edits by subtraction. Asks 'what can we remove?' until only the essential is left.",
    technicalDna:
      "Audible preference for dry, direct sound; minimal effects; clear mid-forward mixes. Specific gear/chains vary widely by era.",
    rhythmicDna:
      "Heavy backbeat or simple drum-machine pattern; intentionally rigid in early rap work; loose live drumming in later rock work.",
    melodicHarmonicDna:
      "Riff- or loop-based; rarely harmonic-heavy; lets the song's natural progression carry weight.",
    arrangementDna:
      "Verse/chorus simplicity; one dominant musical idea; dynamic shift through space, not layering.",
    inspiredDirection:
      "Stripped-back arrangement built around one strong central element. Avoid copying iconic drum chains or signature riffs.",
    originalityTwist:
      "Apply Rubin-style reduction philosophy to maximalist genres (trap, hyperpop) to force discipline.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 9,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 10,
      originality: 9
    })
  },
  {
    id: "PDNA-000012",
    name: "Dr. Dre",
    realName: "Andre Young",
    country: "United States",
    region: "Los Angeles / Compton",
    activeYears: "1980s–present",
    primaryGenres: ["hip-hop", "g-funk"],
    scene: "US West Coast hip-hop",
    primaryRoles: ["producer-auteur", "executive-producer", "mix-engineer-as-producer"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    coreDnaAngle: "Low-end authority, polished menace, vocal pocket control.",
    signatureSoundSummary:
      "Massive controlled low end, surgical drums, glossy mid-range, vocals carved into a precise pocket.",
    artisticDna:
      "Obsessive engineer-producer: every element is mixed, re-tracked, and curated until it sits perfectly.",
    technicalDna:
      "Audible mastery of low-end management, mid-range carving, and vocal compression. Documented multi-pass mixing process across eras.",
    rhythmicDna:
      "Hard, tight kicks; sharp snares; precise hat patterns; pocket-driven swing.",
    melodicHarmonicDna:
      "Funk/soul/g-funk harmonic palette; melodic synth leads; live-instrumented bass lines.",
    arrangementDna:
      "Verse hook arrangement with deliberate drops, vocal-led builds, and engineered chorus impacts.",
    inspiredDirection:
      "West-coast-informed beat with controlled low end, surgical drums, and a carved vocal pocket. Avoid copying signature synth leads or talkbox phrases.",
    originalityTwist:
      "Pair Dre-style low-end discipline with UK garage swing or amapiano log drums.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 10,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000013",
    name: "J Dilla",
    realName: "James Dewitt Yancey",
    country: "United States",
    region: "Detroit",
    activeYears: "1990s–2006",
    primaryGenres: ["hip-hop", "soul", "neo-soul"],
    scene: "Detroit beat scene; Soulquarians-adjacent production culture",
    primaryRoles: ["beatmaker", "producer-auteur", "sampling-architect"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Humanized swing, asymmetry, emotional imperfection.",
    signatureSoundSummary:
      "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection.",
    artisticDna:
      "Deeper logic is not just 'swing' — it is the feeling that the machine is breathing. Beats often feel slightly bent, intimate, warm, and conversational.",
    technicalDna:
      "Verified tools must be researched per source. Audible analysis suggests sampler-centered construction, non-rigid quantization, warm low-mid texture, and loop transformation.",
    rhythmicDna:
      "Loose kicks, late snares, swung hats, and microtiming that feels human rather than sloppy.",
    melodicHarmonicDna:
      "Soul/jazz/gospel fragments, short motifs, bittersweet chord colour, unresolved emotional loops.",
    arrangementDna:
      "Often loop-based, but replay value comes from pocket, texture, chops, drops, and subtle variation.",
    inspiredDirection:
      "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Avoid copying exact drum timing, sample choices, or recognizable chop patterns.",
    originalityTwist:
      "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000014",
    name: "DJ Premier",
    realName: "Christopher Edward Martin",
    country: "United States",
    region: "Houston/New York",
    activeYears: "late 1980s–present",
    primaryGenres: ["hip-hop", "boom bap"],
    scene: "New York boom bap",
    primaryRoles: ["beatmaker", "dj-producer", "producer-auteur"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    coreDnaAngle: "Chopped grit, scratched hooks, drum-loop authority.",
    signatureSoundSummary:
      "Hard-knocking sampled drums, chopped jazz/soul stabs, scratched chorus hooks, no-nonsense arrangement.",
    artisticDna:
      "Boom-bap purist: trust the chop, trust the scratch, leave room for the MC.",
    technicalDna:
      "Audible sampler-led chop construction; signature scratch hooks. Specific gear and chain detail must be sourced.",
    rhythmicDna:
      "Tight, hard 4-bar drum loops; consistent BPM; minimal swing; deliberate snare crack.",
    melodicHarmonicDna:
      "Jazz/soul fragments chopped and re-pitched; harmony often vestigial, used as colour.",
    arrangementDna:
      "Verse + scratched hook + verse, with one or two musical drops; arrangement serves the rapper.",
    inspiredDirection:
      "Sampler-led boom-bap beat with a scratched hook, room-for-the-MC arrangement, and hard, simple drums. Avoid copying recognizable Premier hooks or signature snare.",
    originalityTwist:
      "Translate Premier-style chop discipline to non-US source material (Afrobeats, baile funk, K-pop b-sides) for a fresh sample palette.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 7,
      originality: 9
    })
  },
  {
    id: "PDNA-000015",
    name: "RZA",
    realName: "Robert Diggs",
    country: "United States",
    region: "Staten Island, New York",
    activeYears: "early 1990s–present",
    primaryGenres: ["hip-hop"],
    scene: "Staten Island / Wu-Tang",
    primaryRoles: ["producer-auteur", "sampling-architect", "composer-producer"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"],
    coreDnaAngle: "Dusty soul, martial-arts cinema, raw texture, minor-key mythology.",
    signatureSoundSummary:
      "Lo-fi soul loops, cinematic dialog samples, sparse drums, dark and cinematic minor-key atmosphere.",
    artisticDna:
      "Producer-as-world-builder. Treats the album as a cinematic universe with consistent texture and motif.",
    technicalDna:
      "Audible preference for grainy sampler texture, deliberate lo-fi imperfection, and short minor-key loops.",
    rhythmicDna:
      "Sparse drum patterns; emphasis on negative space; slow-to-mid tempo; pocketed but not flashy.",
    melodicHarmonicDna:
      "Minor-key soul fragments, dark string motifs, ominous keys.",
    arrangementDna:
      "Loop with dropouts; dialog samples as transitions; minimal instrumental variation, maximal vocal weight.",
    inspiredDirection:
      "Lo-fi minor-key sample loop with cinematic interludes and dark, sparse drums. Avoid copying recognizable kung-fu film samples or signature Wu motifs.",
    originalityTwist:
      "Pair RZA-style cinematic loop logic with modern drill drum programming or amapiano log drums.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 7,
      culturalImportance: 10,
      commercialImpact: 9,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000016",
    name: "Timbaland",
    realName: "Timothy Mosley",
    country: "United States",
    region: "Virginia Beach",
    activeYears: "mid-1990s–present",
    primaryGenres: ["hip-hop", "r&b", "pop"],
    scene: "Virginia hip-hop/R&B/pop",
    primaryRoles: ["producer-auteur", "beatmaker", "vocal-producer"],
    eras: ["midi-sampler", "daw", "streaming-social"],
    coreDnaAngle: "Percussive futurism, negative space, vocal rhythm as drum language.",
    signatureSoundSummary:
      "Off-grid syncopated drums, unusual percussion, beatbox/vocal-fragment textures, wide-open mid frequencies.",
    artisticDna:
      "Treats vocal rhythm and percussion as the same instrument. Uses silence as drama.",
    technicalDna:
      "Audible inventive percussion layering and signature stutter edits. Specific gear and process documented in interviews; verify per session.",
    rhythmicDna:
      "Syncopated, halftime swing, wide BPM range, unusual subdivisions, vocal hiccups as percussion.",
    melodicHarmonicDna:
      "Minor/exotic-mode flavour; sparse pad/keyboard hits as harmonic backbone.",
    arrangementDna:
      "Sparse intros, vocal-led drops, rhythmic drops where drums vanish and stutter returns.",
    inspiredDirection:
      "Syncopated percussion-first beat with vocal hiccups, sparse harmony, and engineered silence. Avoid copying recognizable Timbaland tags or signature drum chains.",
    originalityTwist:
      "Pair Timbaland-style percussion-as-vocal thinking with regional patterns from amapiano, dembow, or baile funk.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 9,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000017",
    name: "The Neptunes",
    country: "United States",
    region: "Virginia Beach",
    activeYears: "late 1990s–present",
    primaryGenres: ["hip-hop", "r&b", "pop"],
    scene: "Virginia pop/rap/R&B",
    primaryRoles: ["production-collective", "producer-auteur"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Sparse bounce, synthetic funk, weird minimal hooks.",
    signatureSoundSummary:
      "Hyper-minimal drum pockets, plucky synths, bone-dry mids, unexpected sound-effect hooks.",
    artisticDna:
      "Pop minimalists with avant-funk sensibilities; treat weirdness as a hook.",
    technicalDna:
      "Audible synth/drum-machine palette (often associated with specific hardware) — verify per session.",
    rhythmicDna:
      "Mid-tempo bounce; deliberate empty bars; high-impact accents.",
    melodicHarmonicDna:
      "Two- or three-note synth riffs; minimal chord movement; alternating tonal colour for choruses.",
    arrangementDna:
      "Two-bar loop with hook-as-arrangement; dramatic drum entries; arrangement built around a single sonic gag.",
    inspiredDirection:
      "Minimal bounce beat with a 2-note synth motif and one sonic surprise per section. Avoid copying recognizable Neptunes synth presets or signature snare tones.",
    originalityTwist:
      "Apply Neptunes-style minimalism to genres that tend to overload (drill, hyperpop, K-pop).",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000018",
    name: "Missy Elliott",
    realName: "Melissa Arnette Elliott",
    country: "United States",
    region: "Virginia",
    activeYears: "1990s–present",
    primaryGenres: ["hip-hop", "r&b"],
    scene: "Virginia hip-hop/R&B",
    primaryRoles: ["producer-auteur", "vocal-producer", "composer-producer"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Vocal-producer imagination, playful futurism, rhythm-first song design.",
    signatureSoundSummary:
      "Playful vocal arrangements, percussive rhythmic phrasing, futuristic textures, hook-first structure.",
    artisticDna:
      "Treats vocal arrangement as production. Verse melody, ad-libs, and tags are pre-composed instruments.",
    technicalDna:
      "Audible multi-layer vocal production with rhythmic stacking; often co-produced with Timbaland-era tools.",
    rhythmicDna:
      "Syncopated half-time grooves with unexpected vocal entrances driving the pocket.",
    melodicHarmonicDna:
      "Minor-key R&B/hip-hop colour with short, hooky motifs and vocal harmonization.",
    arrangementDna:
      "Hook every 8 bars; verses interrupted by mini-hooks; pre-choruses removed in favor of vocal drops.",
    inspiredDirection:
      "Vocal-arrangement-led pop-rap beat with futurist textures and a rhythm-first hook. Avoid copying specific Missy vocal tags or signature ad-lib patterns.",
    originalityTwist:
      "Apply Missy-style vocal-as-instrument thinking to non-English-language pop or alternative R&B.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 9,
      undergroundImpact: 9,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000019",
    name: "Metro Boomin",
    realName: "Leland Tyler Wayne",
    country: "United States",
    region: "St. Louis / Atlanta",
    activeYears: "early 2010s–present",
    primaryGenres: ["trap", "hip-hop"],
    scene: "Atlanta trap",
    primaryRoles: ["producer-auteur", "beatmaker"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    coreDnaAngle: "Dark cinematic trap, negative space, 808 mood architecture.",
    signatureSoundSummary:
      "Cinematic minor-key keys, long 808 glides, sparse hi-hat patterns, theatrical drops.",
    artisticDna:
      "Treats trap as score: tension, motif, recurrence, dramatic punctuation.",
    technicalDna:
      "Audible production using DAW + sample-pack + signature drum kits; documented in many interviews.",
    rhythmicDna:
      "Half-time-feel trap pockets, syncopated 808 glides, controlled hi-hat rolls.",
    melodicHarmonicDna:
      "Minor-key melodic motifs, dark pads, simple but emotive chord beds.",
    arrangementDna:
      "Intro tag + main loop + drop + minor variation + outro; engineered drops every 16 bars.",
    inspiredDirection:
      "Cinematic minor-key trap with long 808 glides and engineered drops. Avoid copying signature producer tags or recognizable Metro motifs.",
    originalityTwist:
      "Combine Metro-style cinematic trap with film-score harmonic movement or amapiano grooves.",
    scoring: s({
      innovation: 8,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 8,
      originality: 8
    })
  },
  {
    id: "PDNA-000020",
    name: "Mike WiLL Made-It",
    realName: "Michael Len Williams II",
    country: "United States",
    region: "Atlanta",
    activeYears: "late 2000s–present",
    primaryGenres: ["trap", "pop rap"],
    scene: "Atlanta trap/pop rap",
    primaryRoles: ["producer-auteur", "beatmaker"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    coreDnaAngle: "Elastic 808s, hard minimal loops, hook-forward trap design.",
    signatureSoundSummary:
      "Punchy and elastic 808 lines, single dominant lead motif, hook-engineered drops.",
    artisticDna:
      "Designs beats around a single instantly memorable hook element; everything else supports.",
    technicalDna:
      "Audible DAW + sample-led workflow; specific kits documented in artist communities.",
    rhythmicDna:
      "Trap halftime with elastic 808 glides; consistent hat patterns; punchy snares.",
    melodicHarmonicDna:
      "Simple minor-key motifs; vocal-friendly tonal centres; little chord movement.",
    arrangementDna:
      "Tag + 16-bar verses + hook drops with simple drum-only sections.",
    inspiredDirection:
      "Hook-first trap beat with a single dominant motif and elastic 808 anchor. Avoid copying recognizable producer tags or signature snares.",
    originalityTwist:
      "Apply Mike WiLL-style hook-first design to non-trap genres (Afrobeats, dembow) while keeping the elastic 808 anchor.",
    scoring: s({
      innovation: 7,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 10,
      undergroundImpact: 7,
      longevity: 8,
      adaptability: 8,
      originality: 7
    })
  },
  {
    id: "PDNA-000021",
    name: "Zaytoven",
    realName: "Xavier Lamar Dotson",
    country: "United States",
    region: "Atlanta",
    activeYears: "late 1990s–present",
    primaryGenres: ["trap", "gospel"],
    scene: "Atlanta trap/gospel",
    primaryRoles: ["beatmaker", "producer-auteur"],
    eras: ["daw", "internet-beatmaker"],
    coreDnaAngle: "Church chords, loose piano, trap bounce, human touch.",
    signatureSoundSummary:
      "Live-feel piano lines, gospel-tinged harmony, looser drum quantization, jubilant or melancholic moods.",
    artisticDna:
      "Combines gospel-piano feel with trap drum frameworks; production retains live-finger looseness.",
    technicalDna:
      "Audible live-piano-into-DAW workflow with trap drum templates; documented widely in interviews.",
    rhythmicDna:
      "Trap drum bed with loose human piano sitting slightly ahead or behind grid.",
    melodicHarmonicDna:
      "Gospel/church voicings, 7ths and 9ths, vamp-style progressions in minor and major.",
    arrangementDna:
      "Loop + drop logic but with piano variation each cycle; minor harmonic resolution as climax.",
    inspiredDirection:
      "Trap beat with live-feel gospel piano and minor/major vamp harmony. Avoid copying signature Zaytoven flute motifs or recognizable piano lines.",
    originalityTwist:
      "Apply Zaytoven-style gospel harmonic vamps to Afrobeats or amapiano rhythms.",
    scoring: s({
      innovation: 8,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 7,
      originality: 8
    })
  },
  {
    id: "PDNA-000022",
    name: "Lex Luger",
    realName: "Lexus Lewis",
    country: "United States",
    region: "Virginia / Atlanta",
    activeYears: "late 2000s–present",
    primaryGenres: ["trap", "hip-hop"],
    scene: "Southern trap",
    primaryRoles: ["beatmaker", "producer-auteur"],
    eras: ["daw", "internet-beatmaker"],
    coreDnaAngle: "Maximal brass/synth aggression, hard snare energy.",
    signatureSoundSummary:
      "Big brass/synth lead lines, rapid hat rolls, hard snares, high-energy stadium-ready loops.",
    artisticDna:
      "Aggression and impact first; designs beats to perform at maximum intensity on speaker systems.",
    technicalDna:
      "Audible FL Studio-era trap template; specific drum kits and lead presets widely documented.",
    rhythmicDna:
      "Trap drums at moderate tempo, dense hat-roll patterns, hard snare backbeat.",
    melodicHarmonicDna:
      "Minor-key brass/synth motifs, declarative leads, little harmonic movement.",
    arrangementDna:
      "Open intro → hard drop → minor variation → hard drop again; engineered for crowd reaction.",
    inspiredDirection:
      "Stadium-energy trap beat with a brass/synth lead and hard snares. Avoid copying recognizable Luger brass patches or signature drum chains.",
    originalityTwist:
      "Apply Luger-style aggression to drill or hyperpop while substituting brass with non-Western lead instruments.",
    scoring: s({
      innovation: 8,
      influence: 9,
      technicalCraft: 7,
      sonicIdentity: 9,
      arrangementSkill: 7,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 9,
      longevity: 7,
      adaptability: 7,
      originality: 8
    })
  },
  {
    id: "PDNA-000023",
    name: "Southside",
    realName: "Joshua Howard Luellen",
    country: "United States",
    region: "Atlanta",
    activeYears: "late 2000s–present",
    primaryGenres: ["trap", "hip-hop"],
    scene: "Atlanta trap / 808 Mafia",
    primaryRoles: ["beatmaker", "producer-auteur", "production-collective"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    coreDnaAngle: "Dark drum programming, high-energy 808 pressure.",
    signatureSoundSummary:
      "Dark minor-key motifs, aggressive 808 pressure, layered drum programming, cinematic intensity.",
    artisticDna:
      "Architect of dark trap pressure; drums and 808s carry the emotional weight.",
    technicalDna:
      "Audible DAW + sample-pack workflow; 808 layering and pitch automation widely documented.",
    rhythmicDna:
      "Aggressive trap halftime; layered hats and percussion; punchy snares.",
    melodicHarmonicDna:
      "Dark minor motifs, cinematic pads, restrained harmonic movement.",
    arrangementDna:
      "Atmospheric intro + drum drop + 808 entry + minimal variation across hooks/verses.",
    inspiredDirection:
      "Dark high-pressure trap with layered drum programming. Avoid copying signature producer tags or 808 Mafia signature drum kits.",
    originalityTwist:
      "Apply Southside-style 808 pressure to non-trap genres (UK garage, baile funk) with restraint.",
    scoring: s({
      innovation: 7,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 9,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 7,
      originality: 7
    })
  },
  {
    id: "PDNA-000024",
    name: "Madlib",
    realName: "Otis Jackson Jr.",
    country: "United States",
    region: "Oxnard, California",
    activeYears: "1990s–present",
    primaryGenres: ["hip-hop", "jazz", "experimental"],
    scene: "California underground hip-hop",
    primaryRoles: ["beatmaker", "producer-auteur", "sampling-architect"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Crate-digging collage, raw loops, jazz-damaged texture.",
    signatureSoundSummary:
      "Dusty jazz/soul/world loops, raw drum chops, loose tape-style mixing, lo-fi warmth.",
    artisticDna:
      "Producer-as-archivist: digs deep, chops minimally, lets the source's character lead.",
    technicalDna:
      "Audible portable-sampler workflow; minimal post-processing; tape-style summing aesthetic.",
    rhythmicDna:
      "Loose, often unquantized drums; relaxed swing; mid-tempo head-nodding pocket.",
    melodicHarmonicDna:
      "Whatever the sampled source brings — jazz, soul, psychedelia, library music, world music.",
    arrangementDna:
      "Short tracks, loop-led, minimal hooks; vibe over song-form.",
    inspiredDirection:
      "Crate-dug loop-led beat with minimal processing and a relaxed drum pocket. Avoid copying recognizable Madlib chops or specific source samples.",
    originalityTwist:
      "Apply Madlib-style crate-digging philosophy to under-sampled regional music libraries (cumbia, highlife, Bollywood B-sides).",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000025",
    name: "Pete Rock",
    realName: "Peter Phillips",
    country: "United States",
    region: "Mount Vernon, New York",
    activeYears: "late 1980s–present",
    primaryGenres: ["hip-hop", "boom bap"],
    scene: "New York hip-hop",
    primaryRoles: ["beatmaker", "producer-auteur"],
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    coreDnaAngle: "Warm horn loops, soul-jazz chops, head-nod elegance.",
    signatureSoundSummary:
      "Warm horn samples, classic soul/jazz chops, fat sampled drums, mellow but punchy mixes.",
    artisticDna:
      "Soul connoisseur with a producer's discipline. Beats feel like a long Sunday morning.",
    technicalDna:
      "Audible classic sampler workflow; warm low-mid mixes; signature horn-loop chops.",
    rhythmicDna:
      "Mid-tempo boom-bap pocket with subtle swing and consistent snare crack.",
    melodicHarmonicDna:
      "Soul-jazz chord colour, occasionally extended; melody often led by horn samples.",
    arrangementDna:
      "Verse + hook with horn-driven drops; minimal variation; relies on pocket and warmth.",
    inspiredDirection:
      "Warm horn-led boom-bap beat with a mid-tempo pocket and minor harmonic colour. Avoid copying recognizable Pete Rock horn loops or signature snares.",
    originalityTwist:
      "Translate Pete Rock-style warmth to live-instrument neo-soul or downtempo electronic without sampled horns.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 7,
      originality: 9
    })
  },
  {
    id: "PDNA-000026",
    name: "Marley Marl",
    realName: "Marlon Lu'ree Williams",
    country: "United States",
    region: "Queensbridge, New York",
    activeYears: "1980s–present",
    primaryGenres: ["hip-hop"],
    scene: "Queensbridge hip-hop",
    primaryRoles: ["producer-auteur", "sampling-architect", "engineer-producer"],
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    coreDnaAngle: "Sampling architecture, drum reconstruction, early beat science.",
    signatureSoundSummary:
      "Reconstructed drum breaks from individual hit samples, hard pocket, foundational golden-age sonic palette.",
    artisticDna:
      "Pioneer of recombinant drum programming; rebuilds breaks from kicks, snares, and hats.",
    technicalDna:
      "Audible early sampler innovation (SP-1200/AKAI-era workflows widely documented).",
    rhythmicDna:
      "Hard boom-bap pocket with deliberate sample-based drum imperfection.",
    melodicHarmonicDna:
      "Soul/funk samples chopped for melodic colour; harmony often skeletal.",
    arrangementDna:
      "Verse + scratch-led hook; arrangement subordinate to the rapper.",
    inspiredDirection:
      "Drum-reconstruction-led beat using individual hit samples and a hard pocket. Avoid copying recognizable Marley Marl drum kits.",
    originalityTwist:
      "Use Marley-style sample-based drum construction to build rhythms from non-drum sources (vocal phonemes, field-recordings).",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 7,
      originality: 10
    })
  },
  {
    id: "PDNA-000027",
    name: "DJ Screw",
    realName: "Robert Earl Davis Jr.",
    country: "United States",
    region: "Houston, Texas",
    activeYears: "1990s–2000",
    primaryGenres: ["hip-hop"],
    scene: "Houston",
    primaryRoles: ["dj-producer", "remixer", "producer-auteur"],
    eras: ["early-hip-hop-sampling", "midi-sampler"],
    coreDnaAngle: "Slowed time, syrup atmosphere, remix-as-worldbuilding.",
    signatureSoundSummary:
      "Slowed playback, chopped-and-screwed transitions, hazy lo-fi atmosphere, drawn-out vocals.",
    artisticDna:
      "Treats remix-style time stretching as a worldbuilding tool; mixtapes function as immersive environments.",
    technicalDna:
      "Audible turntable + tape workflow with documented chopped-and-screwed methodology.",
    rhythmicDna:
      "Slowed tempos, dragged pockets, exaggerated snare/kick weight.",
    melodicHarmonicDna:
      "Whatever the source brings, pitched down — minor colour and detuned warmth dominate.",
    arrangementDna:
      "Long-form mixtape arrangement; tracks bleed into each other via chops and tape edits.",
    inspiredDirection:
      "Slowed/screwed-aware beat with hazy atmosphere and dragged pocket. Avoid copying recognizable Screw tape edits or DJ tags.",
    originalityTwist:
      "Apply Screw-style time/tempo manipulation to Afrobeats, K-pop, or amapiano source material.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 7,
      culturalImportance: 10,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000028",
    name: "SOPHIE",
    realName: "Sophie Xeon",
    country: "United Kingdom",
    region: "Scotland",
    activeYears: "early 2010s–2021",
    primaryGenres: ["hyperpop", "experimental", "electronic"],
    scene: "UK/Scotland hyperpop/electronic",
    primaryRoles: ["sound-designer", "producer-auteur"],
    eras: ["daw", "streaming-social"],
    coreDnaAngle: "Plastic-metal sound design, extreme synthetic physicality.",
    signatureSoundSummary:
      "Glassy, latex, metallic synth design; hyper-real percussive impacts; clean and ultra-loud mixes.",
    artisticDna:
      "Treats synthesis as sculpting tactile objects; sound design IS the song.",
    technicalDna:
      "Audible heavy modular/wavetable synthesis and sample design; documented preference for synthesized-from-scratch sounds.",
    rhythmicDna:
      "Sharp, slamming drum hits; off-grid impacts; tempo range from ballad to hyper.",
    melodicHarmonicDna:
      "Pop-friendly diatonic hooks alternating with abstract atonal interludes.",
    arrangementDna:
      "Pop verse/chorus skeletons exploded with abstract drops and sound-design moments.",
    inspiredDirection:
      "Hyperpop-style beat where sound design IS the melody; tactile synthesized hits and one ultra-clean hook. Avoid copying recognizable SOPHIE patches.",
    originalityTwist:
      "Apply SOPHIE-style synthetic physicality to traditional pop or singer-songwriter forms.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 10,
      culturalImportance: 10,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000029",
    name: "Arca",
    realName: "Alejandra Ghersi",
    country: "Venezuela",
    activeYears: "2010s–present",
    primaryGenres: ["experimental", "electronic", "pop"],
    scene: "Venezuela/global experimental pop",
    primaryRoles: ["producer-auteur", "sound-designer", "composer-producer"],
    eras: ["daw", "streaming-social", "ai-assisted"],
    coreDnaAngle: "Mutant sound design, body-horror beauty, fractured rhythm.",
    signatureSoundSummary:
      "Hyperdetailed synthesis, fractured rhythmic textures, vocal/body-like timbres, dark beauty.",
    artisticDna:
      "Producer-as-sculptor of the uncanny; emotional intensity through deformation.",
    technicalDna:
      "Audible deep DAW/plugin sound design with significant processing chains; widely discussed in interviews.",
    rhythmicDna:
      "Asymmetric, syncopated patterns; tempos shift inside tracks; rhythm often emerges and dissolves.",
    melodicHarmonicDna:
      "Modal/atonal motifs alongside emotional pop fragments; latent latin rhythmic influences.",
    arrangementDna:
      "Through-composed: sections morph rather than repeat; climaxes are textural rather than tonal.",
    inspiredDirection:
      "Experimental pop track where sound design and arrangement morph through-composed. Avoid copying recognizable Arca textures or vocal effect chains.",
    originalityTwist:
      "Combine Arca-style mutation with reggaeton dembow or amapiano log drums to create dancefloor-experimental hybrids.",
    scoring: s({
      innovation: 10,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 9,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000030",
    name: "Burial",
    realName: "William Bevan",
    country: "United Kingdom",
    region: "London",
    activeYears: "mid-2000s–present",
    primaryGenres: ["dubstep", "uk garage", "ambient"],
    scene: "UK garage / dubstep",
    primaryRoles: ["producer-auteur", "sound-designer"],
    eras: ["daw", "internet-beatmaker"],
    coreDnaAngle: "Ghostly urban ambience, shuffled drums, emotional decay.",
    signatureSoundSummary:
      "Vinyl-style crackle, distant pitched vocal samples, shuffled 2-step drums, hazy melancholy.",
    artisticDna:
      "Producer-as-poet of post-rave decay; treats rhythm as memory.",
    technicalDna:
      "Audible non-grid drum programming (off-grid by ear), heavy use of pitched vocal chops, vinyl-style noise textures.",
    rhythmicDna:
      "2-step garage shuffle with deliberately humanized timing; halftime feels in slower tracks.",
    melodicHarmonicDna:
      "Minor pads, pitched vocal motifs, suspended chord movement.",
    arrangementDna:
      "Long-form pieces with extended atmospheric intros and slowly evolving sections.",
    inspiredDirection:
      "Hazy 2-step-aware beat with off-grid drums, pitched vocal samples, and slow emotional decay. Avoid copying recognizable Burial vocal samples or signature noise textures.",
    originalityTwist:
      "Apply Burial-style off-grid programming to drill or amapiano rhythms.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000031",
    name: "Aphex Twin",
    realName: "Richard D. James",
    country: "United Kingdom / Ireland",
    activeYears: "early 1990s–present",
    primaryGenres: ["idm", "ambient", "techno", "experimental"],
    scene: "UK/Ireland IDM",
    primaryRoles: ["producer-auteur", "sound-designer", "composer-producer"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Algorithmic rhythm, alien melody, playful technical extremity.",
    signatureSoundSummary:
      "Hyper-detailed drum programming, idiosyncratic synth voices, abrupt structural shifts, tender ambient passages.",
    artisticDna:
      "Treats music as software-art: builds tools, then plays them; constantly contrasts beauty with abrasion.",
    technicalDna:
      "Audible bespoke patching/programming workflows; documented use of custom tools and modified hardware.",
    rhythmicDna:
      "Extremely fast, programmed drum patterns; polyrhythms; sudden tempo changes.",
    melodicHarmonicDna:
      "Tonal ambient motifs alongside dissonant chord colour; signature detuned pads.",
    arrangementDna:
      "Through-composed; ambient tracks evolve slowly; drum tracks erupt and dissolve.",
    inspiredDirection:
      "Highly programmed drum beat with one tender ambient passage and one abrasive synth element. Avoid copying recognizable Aphex Twin patches or drum chains.",
    originalityTwist:
      "Translate Aphex-style algorithmic complexity to footwork or jungle source material at lower tempos.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000032",
    name: "Daft Punk",
    country: "France",
    activeYears: "1993–2021",
    primaryGenres: ["house", "electronic", "pop"],
    scene: "France house/pop",
    primaryRoles: ["production-collective", "producer-auteur"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Robotic funk, filter-house memory, vocoder mythology.",
    signatureSoundSummary:
      "Filter-swept disco/funk loops, robotic vocoder vocals, four-on-the-floor pulse, glossy production.",
    artisticDna:
      "Pop-house architects who blur sample worship with futuristic mythmaking.",
    technicalDna:
      "Audible classic sampler + analog filter workflows; later catalogue mixes hardware and DAW.",
    rhythmicDna:
      "Four-on-the-floor at 110–130 BPM with disco-funk swing; later catalogue varies tempo for ballads.",
    melodicHarmonicDna:
      "Diatonic disco/funk loops; modulating builds; vocoder/talkbox vocal hooks.",
    arrangementDna:
      "Long filter builds; loop-led drops; ballad-style break sections in later work.",
    inspiredDirection:
      "Filter-driven house/disco beat with a vocoder vocal motif and a slow filter build. Avoid copying recognizable Daft Punk vocoder phrases or signature filter sweeps.",
    originalityTwist:
      "Apply Daft Punk-style robotic funk to baile funk or amapiano rhythms with vocoder hooks in non-English languages.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 9,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000033",
    name: "Kraftwerk",
    country: "Germany",
    activeYears: "1970s–present",
    primaryGenres: ["electronic", "synthpop"],
    scene: "Germany electronic",
    primaryRoles: ["production-collective", "producer-auteur"],
    eras: ["disco-electronic-studio", "midi-sampler"],
    coreDnaAngle: "Machine minimalism, sequencer logic, electronic-pop foundation.",
    signatureSoundSummary:
      "Sequenced analog synth lines, robotic vocals, minimal arrangements with hypnotic repetition.",
    artisticDna:
      "Foundational electronic-pop architects; designed an aesthetic that the next 40 years would borrow from.",
    technicalDna:
      "Audible sequencer-led composition and analog synth voicing; their studio (Kling Klang) is heavily documented.",
    rhythmicDna:
      "Steady mechanical pulses; minimal swing; precise locked grids.",
    melodicHarmonicDna:
      "Diatonic motifs, simple progressions, robotic vocoder hooks.",
    arrangementDna:
      "Add-element-every-32-bars build; minimal structural drama; rely on motif repetition.",
    inspiredDirection:
      "Sequenced minimal electronic pop with a mechanical pulse and a vocoder hook. Avoid copying recognizable Kraftwerk motifs.",
    originalityTwist:
      "Apply Kraftwerk-style mechanical minimalism to non-Western percussion or as a backbone for dembow/amapiano hybrids.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000034",
    name: "Wendy Carlos",
    country: "United States",
    activeYears: "1960s–present",
    primaryGenres: ["electronic", "classical", "film score"],
    scene: "US electronic/classical",
    primaryRoles: ["composer-producer", "sound-designer", "arranger"],
    eras: ["disco-electronic-studio", "tape-console"],
    coreDnaAngle: "Synth translation, timbre discipline, electronic orchestration.",
    signatureSoundSummary:
      "Modular synth arrangements of classical repertoire, careful timbre-by-timbre orchestration, controlled dynamic range.",
    artisticDna:
      "Treats the synthesizer as an orchestra; every voice patched, played, and recorded with classical discipline.",
    technicalDna:
      "Audible early Moog modular orchestration; widely documented technical process.",
    rhythmicDna:
      "Driven by source compositions — classical pulse with synth precision.",
    melodicHarmonicDna:
      "Full classical harmony rendered through electronic timbre choices.",
    arrangementDna:
      "Faithful classical structures with timbre-as-arrangement decisions.",
    inspiredDirection:
      "Synthesizer-orchestrated piece with classical-style structure and one timbre per voice. Avoid copying recognizable Switched-On Bach textures.",
    originalityTwist:
      "Apply Carlos-style synth-orchestration discipline to non-classical material (jazz, video-game themes, world music).",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 9,
      longevity: 10,
      adaptability: 8,
      originality: 10
    })
  },
  {
    id: "PDNA-000035",
    name: "Ryuichi Sakamoto",
    country: "Japan",
    activeYears: "1970s–2023",
    primaryGenres: ["electronic", "ambient", "film score", "pop"],
    scene: "Japan / global",
    primaryRoles: ["composer-producer", "producer-auteur", "arranger"],
    eras: ["disco-electronic-studio", "midi-sampler", "daw"],
    coreDnaAngle: "Elegant harmony, electronic-acoustic fusion, cinematic restraint.",
    signatureSoundSummary:
      "Refined harmonic palette, hybrid acoustic-electronic textures, restrained dynamics, cinematic intimacy.",
    artisticDna:
      "Producer-composer who fuses classical training with electronic-music sensibility; emphasizes restraint over spectacle.",
    technicalDna:
      "Audible careful piano + synth + processing workflows; widely documented across decades.",
    rhythmicDna:
      "Often rhythmless or with subtle pulses; pop work uses precise sequenced grooves.",
    melodicHarmonicDna:
      "Modal jazz, impressionist harmony, Japanese pentatonic colour woven into Western forms.",
    arrangementDna:
      "Sparse intros; slowly building textures; arrangements designed for emotional resonance.",
    inspiredDirection:
      "Restrained hybrid acoustic-electronic piece with impressionist harmony and one delicate motif. Avoid copying recognizable Sakamoto motifs.",
    originalityTwist:
      "Apply Sakamoto-style restraint and harmonic vocabulary to modern alternative R&B or melodic rap beats.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 10,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000036",
    name: "Yasutaka Nakata",
    country: "Japan",
    activeYears: "2000s–present",
    primaryGenres: ["j-pop", "electro", "synthpop"],
    scene: "Japan J-pop/electro",
    primaryRoles: ["producer-auteur", "composer-producer"],
    eras: ["daw", "streaming-social"],
    coreDnaAngle: "Glossy synthetic pop, vocal processing, kawaii-futurist precision.",
    signatureSoundSummary:
      "Hyper-polished synth pop, processed-but-cute vocals, dense melodic motion, club-pop arrangement instincts.",
    artisticDna:
      "Producer-as-pop-engineer: every micro-decision tuned for maximum hook density and image cohesion.",
    technicalDna:
      "Audible DAW + soft-synth workflow with heavy vocal processing.",
    rhythmicDna:
      "Four-on-the-floor with electro/funk swing; fast bouncy 16ths.",
    melodicHarmonicDna:
      "Dense pop harmony with frequent modulation; melodic hooks every 2-4 bars.",
    arrangementDna:
      "Maximal arrangement: hook, hook, hook; instrumental drops as bridge.",
    inspiredDirection:
      "Hyper-polished electro-pop beat with dense melodic motion and processed vocal hook. Avoid copying recognizable Nakata vocal effect chains.",
    originalityTwist:
      "Apply Nakata-style hook density to non-J-pop language vocal production while preserving the cute-futurist sound.",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 10,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 9
    })
  },
  {
    id: "PDNA-000037",
    name: "A. R. Rahman",
    country: "India",
    activeYears: "early 1990s–present",
    primaryGenres: ["film score", "bollywood", "pop"],
    scene: "India film/pop",
    primaryRoles: ["composer-producer", "arranger", "producer-auteur"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Orchestral-electronic fusion, spiritual melody, cinematic scale.",
    signatureSoundSummary:
      "Hybrid Indian-classical and Western orchestral arrangements with electronic textures; spiritual, sweeping melodic lines.",
    artisticDna:
      "Composer-producer fusing devotional melody with cinematic scope.",
    technicalDna:
      "Audible orchestral programming + live ensemble + electronic processing; documented hybrid studio workflow.",
    rhythmicDna:
      "Indian classical and folk rhythms blended with Western pop and electronic grooves.",
    melodicHarmonicDna:
      "Raga-informed melody, modal colour, dramatic key changes for emotional payoff.",
    arrangementDna:
      "Cinematic builds, large ensemble payoffs, intimate solo passages, vocal-as-focal-point.",
    inspiredDirection:
      "Hybrid orchestral-electronic cinematic piece with modal melody and spiritual atmosphere. Avoid copying recognizable Rahman themes.",
    originalityTwist:
      "Apply Rahman-style hybrid orchestration to a modern alternative R&B or Afrobeats arrangement.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 10,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000038",
    name: "Max Martin",
    realName: "Karl Martin Sandberg",
    country: "Sweden",
    activeYears: "early 1990s–present",
    primaryGenres: ["pop"],
    scene: "Sweden pop",
    primaryRoles: ["producer-auteur", "composer-producer", "vocal-producer"],
    eras: ["midi-sampler", "daw", "streaming-social"],
    coreDnaAngle: "Hook architecture, melodic math, chorus engineering.",
    signatureSoundSummary:
      "Surgical pop arrangement, hook-rich melodic phrasing, choruses engineered for radio impact, polished but punchy mixes.",
    artisticDna:
      "Producer-as-pop-architect: melodic math (melodic stress, contour, phrase length) tuned for maximum memorability.",
    technicalDna:
      "Audible Cheiron/Cheiron-descended pop production workflow; documented across decades.",
    rhythmicDna:
      "Mid-to-uptempo pop pockets with controlled syncopation in vocal phrasing.",
    melodicHarmonicDna:
      "Diatonic with smart chromatic surprises; symmetrical hook contours.",
    arrangementDna:
      "Verse → pre-chorus lift → engineered chorus → post-chorus hook; drop choruses for emotional climax.",
    inspiredDirection:
      "Pop song with engineered chorus impact and a post-chorus instrumental hook. Avoid copying recognizable Max Martin hook contours.",
    originalityTwist:
      "Apply Max Martin's melodic-math approach to non-English pop or to long-form ballads that resist a traditional chorus.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 10,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 6,
      longevity: 10,
      adaptability: 10,
      originality: 9
    })
  },
  {
    id: "PDNA-000039",
    name: "Shellback",
    realName: "Karl Johan Schuster",
    country: "Sweden",
    activeYears: "late 2000s–present",
    primaryGenres: ["pop", "rock"],
    scene: "Sweden pop",
    primaryRoles: ["producer-auteur", "composer-producer"],
    eras: ["daw", "streaming-social"],
    coreDnaAngle: "Modern pop punch, guitar/synth hybrid hooks.",
    signatureSoundSummary:
      "Punchy guitar/synth hybrid hooks, contemporary pop rhythm beds, polished but aggressive mixes.",
    artisticDna:
      "Bridges rock energy and pop structure; instinct for choruses that feel both modern and timeless.",
    technicalDna:
      "Audible modern DAW pop workflow with frequent guitar/synth layering.",
    rhythmicDna:
      "Pop tempo grids with subtle rock backbeat punctuation.",
    melodicHarmonicDna:
      "Pop-rock progressions with chromatic chorus lifts and hook-rich vocals.",
    arrangementDna:
      "Tight intros, fast lifts to chorus, instrumental hook in post-chorus.",
    inspiredDirection:
      "Pop-rock beat with guitar/synth hybrid hook and punchy modern chorus. Avoid copying recognizable Shellback chorus motifs.",
    originalityTwist:
      "Apply Shellback-style hybrid hooks to genres outside pop-rock (Afrobeats, K-pop, country-pop).",
    scoring: s({
      innovation: 8,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 8,
      commercialImpact: 10,
      undergroundImpact: 6,
      longevity: 9,
      adaptability: 9,
      originality: 8
    })
  },
  {
    id: "PDNA-000040",
    name: "Nile Rodgers",
    country: "United States",
    activeYears: "1970s–present",
    primaryGenres: ["disco", "funk", "pop"],
    scene: "US disco/funk/pop",
    primaryRoles: ["producer-auteur", "composer-producer", "band-member-as-producer"],
    eras: ["disco-electronic-studio", "midi-sampler", "daw"],
    coreDnaAngle: "Guitar groove architecture, live-dance precision, elegant repetition.",
    signatureSoundSummary:
      "Funk-disco rhythm guitar as the foundational engine, tight live rhythm section, vocal-forward arrangements.",
    artisticDna:
      "Producer-as-rhythm-guitarist: the guitar IS the production; everything else accents.",
    technicalDna:
      "Audible disciplined rhythm-guitar arrangement, tight live tracking, classic console workflow.",
    rhythmicDna:
      "Locked four-on-the-floor with elegant 16th-note guitar comping.",
    melodicHarmonicDna:
      "Major-7th funk and disco voicings; vocal-led melodic motion.",
    arrangementDna:
      "Long instrumental sections, signature breakdowns, repetition as architecture.",
    inspiredDirection:
      "Disco/funk beat anchored by a 16th-note rhythm guitar; vocal-led arrangement. Avoid copying recognizable Nile riffs or signature breakdowns.",
    originalityTwist:
      "Apply Nile-style rhythm-guitar architecture to Afrobeats or amapiano grooves.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 10,
      originality: 10
    })
  },
  {
    id: "PDNA-000041",
    name: "Trevor Horn",
    country: "United Kingdom",
    activeYears: "late 1970s–present",
    primaryGenres: ["synthpop", "new wave", "pop"],
    scene: "UK synthpop/new wave",
    primaryRoles: ["producer-auteur", "composer-producer", "engineer-producer"],
    eras: ["disco-electronic-studio", "midi-sampler"],
    coreDnaAngle: "Hyper-detailed pop production, studio maximalism, digital sheen.",
    signatureSoundSummary:
      "Layered orchestral hits, early-digital synth sheen, theatrical arrangements, cinematic pop scale.",
    artisticDna:
      "Producer-as-impresario: treats pop singles like cinema; layers every section.",
    technicalDna:
      "Audible pioneering use of early sampling and digital synthesis (Fairlight era); documented in interviews.",
    rhythmicDna:
      "Programmed drum grids with live drum punctuation; controlled tempo.",
    melodicHarmonicDna:
      "Bold pop progressions with cinematic modulations and theatrical hook structure.",
    arrangementDna:
      "Long, layered intros; theatrical builds; dramatic key changes for final choruses.",
    inspiredDirection:
      "Theatrical, layered pop production with one cinematic build. Avoid copying recognizable Horn orchestral-hit chains.",
    originalityTwist:
      "Apply Horn-style layered theatricality to alternative R&B or hyperpop rather than mainstream pop.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 10,
      mixingAesthetics: 10,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 7,
      longevity: 10,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000042",
    name: "Flood",
    realName: "Mark Ellis",
    country: "United Kingdom",
    activeYears: "1980s–present",
    primaryGenres: ["alternative rock", "electronic", "industrial"],
    scene: "UK alternative/electronic rock",
    primaryRoles: ["producer-auteur", "engineer-producer", "mix-engineer-as-producer"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Industrial space, texture-forward rock, atmospheric mixing.",
    signatureSoundSummary:
      "Wide stereo spaces, abrasive textures within polished mixes, atmospheric vocal staging, industrial rhythm beds.",
    artisticDna:
      "Producer-as-spatial-designer for rock bands; mix is part of the song.",
    technicalDna:
      "Audible heavy ambient processing, programmed beats alongside live drums, dense bus-mix workflow.",
    rhythmicDna:
      "Hybrid live + programmed grooves; mid-tempo intensity; industrial pulse.",
    melodicHarmonicDna:
      "Dark minor-key rock harmony with synth/electronic colour and unresolved tension.",
    arrangementDna:
      "Spatial build/release; mix-driven dynamic contrast; atmospheric breakdowns.",
    inspiredDirection:
      "Atmospheric alternative-rock beat with industrial percussion and wide stereo space. Avoid copying recognizable Flood-era band textures.",
    originalityTwist:
      "Apply Flood-style spatial mixing to hyperpop or trap to create wide cinematic versions.",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 10,
      culturalImportance: 8,
      commercialImpact: 9,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000043",
    name: "Nigel Godrich",
    country: "United Kingdom",
    activeYears: "mid-1990s–present",
    primaryGenres: ["alternative rock"],
    scene: "UK alternative rock",
    primaryRoles: ["producer-auteur", "engineer-producer"],
    eras: ["daw", "midi-sampler"],
    coreDnaAngle: "Intimate abstraction, band texture, emotional digital-era space.",
    signatureSoundSummary:
      "Intimate vocal staging, textural guitar layering, electronic processing of acoustic elements, emotional space.",
    artisticDna:
      "Producer-as-band-collaborator who treats abstraction as a way to emotional clarity.",
    technicalDna:
      "Audible heavy DAW + processing on organic source material; documented hybrid workflow.",
    rhythmicDna:
      "Programmed and live drums fused, mid-tempo to ambient feels.",
    melodicHarmonicDna:
      "Modal rock harmony, suspended chord motion, sparse melodic motifs.",
    arrangementDna:
      "Through-composed indie/alt structures; quiet-to-loud builds; ambient interludes.",
    inspiredDirection:
      "Intimate alt-rock beat with processed acoustic guitar, programmed-plus-live drums, and one ambient interlude. Avoid copying recognizable Radiohead-era textures.",
    originalityTwist:
      "Apply Godrich-style intimate processing to neo-soul or alternative R&B without using rock instrumentation.",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000044",
    name: "Steve Albini",
    country: "United States",
    activeYears: "1980s–2024",
    primaryGenres: ["alternative rock", "punk"],
    scene: "US alternative rock",
    primaryRoles: ["engineer-producer", "mix-engineer-as-producer"],
    eras: ["tape-console"],
    coreDnaAngle: "Raw room sound, anti-gloss recording, performance realism.",
    signatureSoundSummary:
      "Hyper-realistic drum room sound, minimal-to-zero processing, performance-first capture, transparent mixes.",
    artisticDna:
      "Engineer-as-witness: documents the band; refuses to flatter the source.",
    technicalDna:
      "Documented anti-overdub, anti-compression workflow; mic placement IS the production.",
    rhythmicDna:
      "Whatever the band plays; tempo flexibility per take; emphasis on physical drum sound.",
    melodicHarmonicDna:
      "Whatever the band writes; production never sweetens harmony.",
    arrangementDna:
      "Capture the band's arrangement; minimal edits; the mix is mostly faders.",
    inspiredDirection:
      "Performance-realistic rock recording with prominent room sound and minimal processing. Avoid copying recognizable Albini-room signatures.",
    originalityTwist:
      "Apply Albini-style transparent capture to non-rock genres (jazz, gospel, traditional folk).",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 6,
      soundDesign: 9,
      mixingAesthetics: 10,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 10,
      adaptability: 7,
      originality: 9
    })
  },
  {
    id: "PDNA-000045",
    name: "Linda Perry",
    country: "United States",
    activeYears: "1990s–present",
    primaryGenres: ["pop", "rock"],
    scene: "US pop/rock",
    primaryRoles: ["producer-auteur", "composer-producer", "vocal-producer"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Song-first emotional production, vocal-centered arrangements.",
    signatureSoundSummary:
      "Song-first arrangements, raw vocal performance up front, organic-leaning instrumental beds, dynamic acoustic-to-electric arcs.",
    artisticDna:
      "Producer-as-songwriter: serves the lyric and the voice; production is always in support.",
    technicalDna:
      "Audible live-room-friendly workflow, vocal-led mixing, restrained automation.",
    rhythmicDna:
      "Live-feeling rhythm sections; ballad-to-rock tempo arcs; dramatic dynamic shifts.",
    melodicHarmonicDna:
      "Classic singer-songwriter and pop-rock progressions; modulations for emotional climax.",
    arrangementDna:
      "Verse builds to chorus, bridge as catharsis, post-bridge final chorus with full band.",
    inspiredDirection:
      "Song-first ballad-to-anthem arc with a vocal-centered arrangement and one cathartic bridge. Avoid copying recognizable Perry-led hooks.",
    originalityTwist:
      "Apply Perry-style song-first restraint to electronic or hyperpop frames.",
    scoring: s({
      innovation: 8,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 9,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 7,
      longevity: 9,
      adaptability: 9,
      originality: 8
    })
  },
  {
    id: "PDNA-000046",
    name: "Tainy",
    realName: "Marcos Efraín Masís Fernández",
    country: "Puerto Rico",
    activeYears: "mid-2000s–present",
    primaryGenres: ["reggaeton", "latin pop"],
    scene: "Puerto Rico reggaeton/Latin pop",
    primaryRoles: ["producer-auteur", "beatmaker"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    coreDnaAngle: "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere.",
    signatureSoundSummary:
      "Refined dembow patterns, atmospheric melodic beds, sleek vocal staging, cinematic Latin pop scale.",
    artisticDna:
      "Producer-as-architect of modern reggaeton: keeps the dembow DNA but expands the harmonic and atmospheric palette.",
    technicalDna:
      "Audible modern DAW workflow with deep attention to atmospheric synth/pad design.",
    rhythmicDna:
      "Dembow pattern with subtle modern variations; tempo around 90-100 BPM.",
    melodicHarmonicDna:
      "Minor-key Latin pop progressions with atmospheric synth pads and emotional hooks.",
    arrangementDna:
      "Atmospheric intros, vocal-led verses, full-band drops, cinematic outros.",
    inspiredDirection:
      "Atmospheric modern reggaeton with refined dembow and emotional minor-key beds. Avoid copying recognizable Tainy producer tags or signature pads.",
    originalityTwist:
      "Apply Tainy-style atmospheric reggaeton to non-reggaeton genres (alternative R&B, Afrobeats, K-pop).",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000047",
    name: "Luny Tunes",
    country: "Puerto Rico",
    activeYears: "early 2000s–present",
    primaryGenres: ["reggaeton"],
    scene: "Puerto Rico reggaeton",
    primaryRoles: ["production-collective", "producer-auteur"],
    eras: ["midi-sampler", "daw"],
    coreDnaAngle: "Classic dembow architecture, club-reggaeton foundations.",
    signatureSoundSummary:
      "Foundational dembow patterns, classic reggaeton synth/horn motifs, club-ready translations of street rhythms.",
    artisticDna:
      "Production-collective architects of mid-2000s reggaeton vocabulary.",
    technicalDna:
      "Audible classic DAW + sampler workflow; documented across many releases.",
    rhythmicDna:
      "Foundational dembow pattern with consistent club-tempo BPMs.",
    melodicHarmonicDna:
      "Minor-key Latin progressions with horn/synth motifs.",
    arrangementDna:
      "DJ-friendly long intros, vocal-led verses, instrumental drops for club use.",
    inspiredDirection:
      "Classic dembow-anchored reggaeton beat with horn/synth motifs and DJ-friendly arrangement. Avoid copying recognizable Luny Tunes hooks.",
    originalityTwist:
      "Apply Luny Tunes-style foundational reggaeton structure to dembow + amapiano hybrids.",
    scoring: s({
      innovation: 9,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 9,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 9
    })
  },
  {
    id: "PDNA-000048",
    name: "Sarz",
    realName: "Osabuohien Osaretin",
    country: "Nigeria",
    activeYears: "late 2000s–present",
    primaryGenres: ["afrobeats"],
    scene: "Nigeria Afrobeats",
    primaryRoles: ["producer-auteur", "beatmaker"],
    eras: ["daw", "internet-beatmaker", "streaming-social"],
    coreDnaAngle: "Clean rhythmic bounce, melodic restraint, Afropop polish.",
    signatureSoundSummary:
      "Clean polyrhythmic Afrobeats grooves, restrained melodic motifs, polished and percussive arrangements.",
    artisticDna:
      "Producer-as-modern-Afropop-architect: balances percussive complexity with pop accessibility.",
    technicalDna:
      "Audible modern DAW workflow with custom drum design; widely documented in interviews.",
    rhythmicDna:
      "Polyrhythmic Afrobeats grooves with subtle log-drum / shaker patterns.",
    melodicHarmonicDna:
      "Major and minor pop progressions with restrained melodic figures.",
    arrangementDna:
      "Percussive intros, vocal-led verses, hook-driven choruses, instrumental drops.",
    inspiredDirection:
      "Clean polyrhythmic Afrobeats beat with restrained melodic motifs and polished arrangement. Avoid copying recognizable Sarz drum chains or producer tags.",
    originalityTwist:
      "Apply Sarz-style restraint and percussive cleanliness to alternative R&B or experimental dance music.",
    scoring: s({
      innovation: 9,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 9,
      originality: 9
    })
  },
  {
    id: "PDNA-000049",
    name: "Kabza De Small",
    realName: "Kabelo Petrus Motha",
    country: "South Africa",
    activeYears: "mid-2010s–present",
    primaryGenres: ["amapiano"],
    scene: "South Africa amapiano",
    primaryRoles: ["producer-auteur", "beatmaker", "dj-producer"],
    eras: ["daw", "streaming-social"],
    coreDnaAngle: "Log-drum language, hypnotic piano loops, long-form groove.",
    signatureSoundSummary:
      "Deep log-drum bass, looped piano motifs, layered shakers/percussion, long-form hypnotic grooves.",
    artisticDna:
      "Architect of modern amapiano vocabulary; treats groove duration as part of the composition.",
    technicalDna:
      "Audible modern DAW + sample-pack + custom log-drum workflow; widely documented in interviews.",
    rhythmicDna:
      "Slow-to-mid tempo amapiano grooves around 110-115 BPM with deep log-drum syncopation.",
    melodicHarmonicDna:
      "Minor/dorian piano loops with simple but emotionally rich harmonic motion.",
    arrangementDna:
      "Long-form arrangement: extended intros, slowly evolving sections, hypnotic vocal layering.",
    inspiredDirection:
      "Long-form amapiano-aware beat with log-drum bass and a hypnotic piano motif. Avoid copying recognizable Kabza loops or signature log-drum patches.",
    originalityTwist:
      "Apply Kabza-style long-form amapiano groove logic to alternative R&B, melodic rap, or ambient electronic.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 9,
      originality: 10
    })
  },
  {
    id: "PDNA-000050",
    name: "DJ Rashad",
    realName: "Rashad Harden",
    country: "United States",
    region: "Chicago",
    activeYears: "late 1990s–2014",
    primaryGenres: ["footwork"],
    scene: "Chicago footwork",
    primaryRoles: ["dj-producer", "producer-auteur", "beatmaker"],
    eras: ["daw", "internet-beatmaker"],
    coreDnaAngle: "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed.",
    signatureSoundSummary:
      "160 BPM footwork patterns, sample chops repeated and re-pitched, emotional vocal fragments, juke-derived 4-on-the-floor.",
    artisticDna:
      "Treats dance-battle rhythm as emotional composition; repetition becomes catharsis at extreme tempo.",
    technicalDna:
      "Audible DAW-based footwork production with documented sample-chopping workflow.",
    rhythmicDna:
      "160 BPM with halftime feels; densely chopped sub bass; sparse but driving percussion.",
    melodicHarmonicDna:
      "Whatever the source sample brings, pitched and chopped — soul, R&B, hip-hop fragments.",
    arrangementDna:
      "Loop-led with chopped variations; long sections of sample manipulation; minimal traditional arrangement.",
    inspiredDirection:
      "Footwork-aware beat at 160 BPM with chopped emotional sample, halftime feel, and minimal arrangement. Avoid copying recognizable Rashad chops.",
    originalityTwist:
      "Apply Rashad-style footwork chop logic to non-footwork sources (Afrobeats, dembow, K-pop) at the same tempo logic.",
    scoring: s({
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 8,
      originality: 10
    })
  }
];

export const SEED_PROFILES: ProducerProfile[] = SEED_INPUTS.map(toProfile);
