import type {
  ProducerRecord,
  ProducerSummary,
  ProducerSearchParams
} from "@/lib/producer-types";

// Batch 001 - Global Foundation Producers
// 50 seed records across pop, hip-hop, electronic, dub, R&B,
// rock, film/game, Latin, Afrobeats, experimental, and regional
// club music. Region: US, UK, Jamaica, Europe, Japan, India,
// Africa, Latin America. Era: 1950s-2020s.

export const BATCH_001: ProducerRecord[] = [
  {
    id: "PDNA-000001",
    batchId: "001",
    name: "George Martin",
    realName: "George Henry Martin",
    aliases: ["The Fifth Beatle"],
    country: "United Kingdom",
    region: "London, England",
    activeYearsStart: 1950,
    activeYearsEnd: 2016,
    primaryScenes: ["British Invasion", "Abbey Road pop", "film scoring"],
    genres: ["pop", "rock", "film-score", "jazz"] as ProducerRecord["genres"],
    eras: ["tape-console"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "arranger", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Arrangement-as-production, orchestral pop architecture, studio imagination",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Orchestral and classical arrangement fused with pop song craft. Strings as production instruments, not decoration. The studio itself as a compositional space.",
    artisticDna: "Martin translated classical training into vernacular rock and pop with zero condescension. He heard the latent orchestral logic inside a pop song and made it feel inevitable.",
    technicalDna: "Orchestration scores, live session direction, tape editing, backward loops, varispeed, ADT (Automatic Double Tracking) as studio chain composition tool.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Identify the emotional core of the song, add one orchestral element that would feel missing without it. Strings or brass counter-melody. Use space intentionally.",
      originalityTwist: "Martin arrangement logic + Dilla swing = orchestral neo-soul. Apply his AABA sectional discipline to a trap or R&B structure.",
      warnings: ["Do not replicate Eleanor Rigby string arrangement", "Avoid Sgt Pepper drum sound as pastiche"],
      fusionPaths: [],
      promptExports: [
        "Identify the emotional core of the song, add one orchestral element that would feel missing without it. Strings or brass counter-melody. Use space intentionally.",
        "Martin arrangement logic + Dilla swing = orchestral neo-soul. Apply his AABA sectional discipline to a trap or R&B structure."
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 9,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 6,
      longevity: 10,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000002",
    batchId: "001",
    name: "Phil Spector",
    realName: "Harvey Phillip Spector",
    aliases: ["The Tycoon of Teen"],
    country: "United States",
    region: "New York / Los Angeles",
    activeYearsStart: 1958,
    activeYearsEnd: 2003,
    primaryScenes: ["Brill Building pop", "girl groups", "Wall of Sound"],
    genres: ["pop", "rock", "soul"] as ProducerRecord["genres"],
    eras: ["tape-console", "wall-of-sound"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "studio-producer"] as ProducerRecord["roles"],
    coreAngle: "Dense mono drama, layered percussion, Wall of Sound arrangement thinking",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Wall of Sound: multiple instruments playing the same parts simultaneously in a reverb-saturated mono room, creating an orchestral wash of rhythm and melody.",
    artisticDna: "Spector weaponized the studio itself. His productions are maximalist mono cathedrals: dense, reverberant, emotionally overwhelming in a compressed space.",
    technicalDna: "Gold Star Studios echo chambers, stacked acoustic guitars doubling piano lines, multiple percussionists playing simultaneously, all mono. The density creates its own low end.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Stack identical rhythm parts (2-4 guitars, piano, bass) so they form a mass rather than individual voices. Saturate with plate reverb. Mix mono. The density IS the arrangement.",
      originalityTwist: "Wall of Sound density logic applied to electronic music: layer 4 arp synthesizers on the same chord progression, add room reverb to everything, mix narrow.",
      warnings: ["Do not copy specific Ronettes or Crystals melodies", "Extreme mono philosophy needs modern translation for streaming"],
      fusionPaths: [],
      promptExports: [
        "Stack identical rhythm parts (2-4 guitars, piano, bass) so they form a mass rather than individual voices. Saturate with plate reverb. Mix mono. The density IS the arrangement.",
        "Wall of Sound density logic applied to electronic music: layer 4 arp synthesizers on the same chord progression, add room reverb to everything, mix narrow."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 5,
      melodicHarmonicIdentity: 7,
      soundDesign: 6,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 5,
      longevity: 6,
      adaptability: 3,
      originality: 9
    }
  },
  {
    id: "PDNA-000003",
    batchId: "001",
    name: "Quincy Jones",
    realName: "Quincy Delight Jones Jr.",
    aliases: ["Q"],
    country: "United States",
    region: "Chicago / Los Angeles",
    activeYearsStart: 1951,
    activeYearsEnd: 2024,
    primaryScenes: ["jazz", "film scoring", "pop", "soul", "funk"],
    genres: ["jazz", "rnb", "soul", "pop", "funk", "film-score"] as ProducerRecord["genres"],
    eras: ["tape-console", "disco-electronic-studio", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "arranger", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Sophisticated arrangement, groove polish, elite collaborator architecture",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "A",
    signatureSoundSummary: "Rhythmically locked, harmonically deep, perfectly mixed pop productions. Every element earns its place. Groove is never sacrificed for density.",
    artisticDna: "Jones operates as an architect of talent: assembling the right musicians, writers, and technicians and creating conditions for great performances. His productions are collaborative triumphs engineered by a master coordinator.",
    technicalDna: "Full orchestral arrangement capability, multi-genre harmonic vocabulary (jazz, gospel, R&B, pop), meticulous mix supervision. Thriller sessions used cutting-edge SSL consoles.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Build a production team, not a solo session. Assign every element a structural role. Every note should be intentional. Groove first, then melody, then arrangement.",
      originalityTwist: "Quincy layering logic applied to modern trap: jazz chord voicings under 808s, live bass mixed with electronic sub, orchestral hit samples as transitions.",
      warnings: ["Do not copy the exact synth bass line from Thriller", "Avoid replicating the Off the Wall drum sound without understanding the room"],
      fusionPaths: [],
      promptExports: [
        "Build a production team, not a solo session. Assign every element a structural role. Every note should be intentional. Groove first, then melody, then arrangement.",
        "Quincy layering logic applied to modern trap: jazz chord voicings under 808s, live bass mixed with electronic sub, orchestral hit samples as transitions."
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 10,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 7,
      longevity: 10,
      adaptability: 9,
      originality: 8
    }
  },
  {
    id: "PDNA-000004",
    batchId: "001",
    name: "Brian Eno",
    realName: "Brian Peter George St John le Baptiste de la Salle Eno",
    aliases: ["Eno"],
    country: "United Kingdom",
    region: "Suffolk / London",
    activeYearsStart: 1971,

    primaryScenes: ["art rock", "ambient", "experimental", "new wave"],
    genres: ["ambient", "experimental", "electronic", "rock", "new-wave"] as ProducerRecord["genres"],
    eras: ["tape-console", "disco-electronic-studio", "midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Systems, atmosphere, generative texture, emotional minimalism",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Ambient music as a genre: background sound that is as ignorable as it is interesting. Tape loops, generative systems, and texture as composition rather than melody.",
    artisticDna: "Eno introduced systems thinking to music production: rules, chance, and process replace conventional composition. His productions (U2, Talking Heads) use atmosphere as a structural element.",
    technicalDna: "Tape delay loops, prepared piano, unconventional instrument techniques, oblique strategies, generative process. Early synthesizer experimentation (VCS3, EMS Synthi).",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Design a generative system before writing a note. Set a delay time, a loop length, a rule for when elements enter and exit. Let the system produce the arrangement.",
      originalityTwist: "Eno atmospheric logic applied to hip-hop: long-reverb pad beds under boom bap drums. Apply his oblique strategies to beat revision: change one rule, not the groove.",
      warnings: ["Do not copy specific ambient textures from Ambient 1 or Music For Airports", "Avoid imitating the U2 big room sound without understanding spatial mixing"],
      fusionPaths: [],
      promptExports: [
        "Design a generative system before writing a note. Set a delay time, a loop length, a rule for when elements enter and exit. Let the system produce the arrangement.",
        "Eno atmospheric logic applied to hip-hop: long-reverb pad beds under boom bap drums. Apply his oblique strategies to beat revision: change one rule, not the groove."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 7,
      rhythmDesign: 5,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 9,
      originality: 10
    }
  },
  {
    id: "PDNA-000005",
    batchId: "001",
    name: "Lee Scratch Perry",
    realName: "Rainford Hugh Perry",
    aliases: ["The Upsetter", "Super Ape"],
    country: "Jamaica",
    region: "Kingston, Jamaica",
    activeYearsStart: 1958,
    activeYearsEnd: 2021,
    primaryScenes: ["reggae", "dub", "roots reggae", "soundsystem"],
    genres: ["reggae", "dub"] as ProducerRecord["genres"],
    eras: ["tape-console", "dub-soundsystem"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "engineer-producer"] as ProducerRecord["roles"],
    coreAngle: "Studio-as-instrument, dub weirdness, spiritual distortion, tape surrealism",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "The Black Ark Studio became a living instrument. Perry printed bass onto tape multiple times to create unprecedented low-end density. He treated the mixer and effects chain as composition tools in real time.",
    artisticDna: "Perry productions exist in a category of their own: ritualistic, surreal, bass-heavy, and spiritually charged. The studio environment was part of the creative process.",
    technicalDna: "TEAC 4-track, overdubbing bass tracks repeatedly, spring reverb as texture, delay throws as melody, tape manipulation for atmosphere.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Start with bass and drums only, then remove elements rather than add them. Treat echo and reverb as live performers, not post-processing. Leave holes in the arrangement.",
      originalityTwist: "Perry bass density logic applied to electronic music: layer three different bass sounds (sub sine, mid bass, attack transient) printed at different levels for depth.",
      warnings: ["Do not imitate specific vocal samples from Black Ark sessions", "Do not reduce his approach to simply adding reverb to everything"],
      fusionPaths: [],
      promptExports: [
        "Start with bass and drums only, then remove elements rather than add them. Treat echo and reverb as live performers, not post-processing. Leave holes in the arrangement.",
        "Perry bass density logic applied to electronic music: layer three different bass sounds (sub sine, mid bass, attack transient) printed at different levels for depth."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 7,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 8,
      culturalImportance: 10,
      commercialImpact: 5,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000006",
    batchId: "001",
    name: "King Tubby",
    realName: "Osbourne Ruddock",
    aliases: ["The Father of Dub"],
    country: "Jamaica",
    region: "Waterhouse, Kingston, Jamaica",
    activeYearsStart: 1968,
    activeYearsEnd: 1989,
    primaryScenes: ["dub", "reggae", "soundsystem"],
    genres: ["dub", "reggae"] as ProducerRecord["genres"],
    eras: ["tape-console", "dub-soundsystem"] as ProducerRecord["eras"],
    roles: ["engineer-producer", "dj-producer"] as ProducerRecord["roles"],
    coreAngle: "Mixer-as-composer, space, delay throws, bass-and-drum architecture",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Invented dub as a genre by re-mixing reggae riddim tracks: stripping out vocals and instruments, throwing in echo and reverb in real time, turning the mixing desk into a live instrument.",
    artisticDna: "Tubby genius was negative space. By removing what was there, he revealed what had always been there: the bass, the drum, the space between notes.",
    technicalDna: "Custom-built mixing console, spring reverb units, tape echo, live fader rides during playback, drum and bass isolation from riddim tracks.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Take a finished instrumental and perform a dub version: cut the chords in and out, send drums through the delay, drop the bass intermittently. The performance IS the new composition.",
      originalityTwist: "Tubby real-time mix-as-performance logic applied to a DJ set or live electronic performance. In DAW: automate radical mutes and sends on a finished instrumental to create a dub version.",
      warnings: ["Do not imitate King Tubby by simply adding reverb: study the specific delay throw techniques", "Do not confuse dub mixing with lo-fi production"],
      fusionPaths: [],
      promptExports: [
        "Take a finished instrumental and perform a dub version: cut the chords in and out, send drums through the delay, drop the bass intermittently. The performance IS the new composition.",
        "Tubby real-time mix-as-performance logic applied to a DJ set or live electronic performance. In DAW: automate radical mutes and sends on a finished instrumental to create a dub version."
      ]
    },
    scores: {
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 7,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 6,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 4,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 5,
      originality: 10
    }
  },
  {
    id: "PDNA-000007",
    batchId: "001",
    name: "Giorgio Moroder",
    realName: "Giovanni Giorgio Moroder",
    aliases: [],
    country: "Italy / Germany",
    region: "Bolzano, Italy / Munich, Germany",
    activeYearsStart: 1966,

    primaryScenes: ["Eurodisco", "electronic", "synthpop", "film score"],
    genres: ["disco", "electronic", "synthpop", "film-score", "pop"] as ProducerRecord["genres"],
    eras: ["disco-electronic-studio", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "composer-producer", "sound-designer"] as ProducerRecord["roles"],
    coreAngle: "Sequenced propulsion, synth disco, machine sensuality",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "The continuous four-on-the-floor sequenced synthesizer bass line as a structural device. Electronic machinery given warmth and eroticism through arrangement and performance layering.",
    artisticDna: "Moroder married European classical synth sensibility to American disco rhythm, creating a third thing: machine-driven dance music with cinematic emotional range.",
    technicalDna: "Moog synthesizer bass lines sequenced instead of played live, Oberheim drum machines, Donna Summer vocal production, multi-track disco arrangements, Musicland Studios Munich.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program a sequenced synth bass line at 120-130 BPM that carries the entire emotional weight of the track. Build the arrangement around it. Add melodic synth leads last.",
      originalityTwist: "Moroder sequencer logic applied to amapiano: log drum rhythm under continuous arpeggiated synth bass. Or apply his film-score sensibility to a trap beat: cinematic swells between bars.",
      warnings: ["Do not copy the I Feel Love bassline directly", "Avoid pastiche Eurodisco that lacks the emotional architecture"],
      fusionPaths: [],
      promptExports: [
        "Program a sequenced synth bass line at 120-130 BPM that carries the entire emotional weight of the track. Build the arrangement around it. Add melodic synth leads last.",
        "Moroder sequencer logic applied to amapiano: log drum rhythm under continuous arpeggiated synth bass. Or apply his film-score sensibility to a trap beat: cinematic swells between bars."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 7,
      longevity: 9,
      adaptability: 7,
      originality: 9
    }
  },
  {
    id: "PDNA-000008",
    batchId: "001",
    name: "Tom Dowd",
    realName: "Thomas John Dowd",
    aliases: [],
    country: "United States",
    region: "New York / Miami",
    activeYearsStart: 1947,
    activeYearsEnd: 2002,
    primaryScenes: ["soul", "jazz", "rock", "R&B", "Atlantic Records"],
    genres: ["soul", "rnb", "jazz", "rock"] as ProducerRecord["genres"],
    eras: ["tape-console"] as ProducerRecord["eras"],
    roles: ["engineer-producer", "studio-producer"] as ProducerRecord["roles"],
    coreAngle: "Engineering innovation, live feel, multitrack clarity",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Tom Dowd was responsible for significant technical advances in recording: early stereo, multitrack recording, and the transparent capture of live ensemble performances.",
    artisticDna: "Dowd art was the art of listening: understanding a musician sound and building a recording chain and room that made that sound more itself. His productions never call attention to the production.",
    technicalDna: "Early stereo recording experiments (1947), Atlantic Records studio design, multitrack innovation, transparent EQ and compression philosophy, live band recording methodology.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Record the rhythm section live in a room together. Use minimal processing. EQ subtracts before it adds. The arrangement clarity comes from spacing and role, not plugins.",
      originalityTwist: "Dowd live-room transparency philosophy applied to neo-soul or indie R&B: track drums, bass, and piano live, overdub vocals and leads later. Preserve the room sound.",
      warnings: ["Do not confuse technical minimalism with under-production", "Do not strip context from Dowd engineering methods: they were room and instrument specific"],
      fusionPaths: [],
      promptExports: [
        "Record the rhythm section live in a room together. Use minimal processing. EQ subtracts before it adds. The arrangement clarity comes from spacing and role, not plugins.",
        "Dowd live-room transparency philosophy applied to neo-soul or indie R&B: track drums, bass, and piano live, overdub vocals and leads later. Preserve the room sound."
      ]
    },
    scores: {
      innovation: 9,
      influence: 8,
      technicalCraft: 10,
      sonicIdentity: 7,
      arrangementSkill: 7,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 10,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 6,
      longevity: 8,
      adaptability: 7,
      originality: 8
    }
  },
  {
    id: "PDNA-000009",
    batchId: "001",
    name: "Teo Macero",
    realName: "Attilio Joseph Macero",
    aliases: [],
    country: "United States",
    region: "New York City",
    activeYearsStart: 1953,
    activeYearsEnd: 2007,
    primaryScenes: ["jazz", "Columbia Records", "avant-garde"],
    genres: ["jazz", "experimental"] as ProducerRecord["genres"],
    eras: ["tape-console"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "engineer-producer", "arranger"] as ProducerRecord["roles"],
    coreAngle: "Tape editing, jazz architecture, post-performance composition",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "The transformation of live improvisation into composed structure through tape editing. Bitches Brew and In a Silent Way are as much Macero compositions as Miles Davis performances.",
    artisticDna: "Macero invented post-production as a compositional act for jazz. He assembled, rearranged, and looped tape recordings after sessions to create final works that had no single-take precedent.",
    technicalDna: "Splice editing, tape looping, section rearrangement, speed manipulation, echo and reverb as structural elements, Columbia Records 30th Street Studio.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Record longer than you need, then edit. Treat the edit as composition: rearrange sections, loop the best four bars into a motif, cut transitions to create surprise.",
      originalityTwist: "Macero tape-edit logic applied to beatmaking: record a live band jam, then chop and re-sequence it in a DAW the way Macero chopped tape: creating a composition from a performance.",
      warnings: ["Do not copy the specific studio techniques without understanding the originating performances", "Do not reduce to jazz samples plus edits: the architecture is deeper"],
      fusionPaths: [],
      promptExports: [
        "Record longer than you need, then edit. Treat the edit as composition: rearrange sections, loop the best four bars into a motif, cut transitions to create surprise.",
        "Macero tape-edit logic applied to beatmaking: record a live band jam, then chop and re-sequence it in a DAW the way Macero chopped tape: creating a composition from a performance."
      ]
    },
    scores: {
      innovation: 10,
      influence: 8,
      technicalCraft: 9,
      sonicIdentity: 8,
      arrangementSkill: 9,
      rhythmDesign: 5,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 5,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000010",
    batchId: "001",
    name: "Sylvia Robinson",
    realName: "Sylvia Vanderpool",
    aliases: ["Little Sylvia", "Mickey and Sylvia"],
    country: "United States",
    region: "New York City / Englewood NJ",
    activeYearsStart: 1950,
    activeYearsEnd: 2011,
    primaryScenes: ["soul", "R&B", "early hip-hop", "Sugar Hill Records"],
    genres: ["soul", "rnb", "hip-hop"] as ProducerRecord["genres"],
    eras: ["tape-console", "early-hip-hop-sampling"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "label-architect", "vocal-producer"] as ProducerRecord["roles"],
    coreAngle: "Label vision, early rap record architecture, commercial bridge-building",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Produced Rappers Delight (1979), the first commercially successful hip-hop single. She understood how to translate the soundsystem culture of hip-hop into a record format that radio and retail could distribute.",
    artisticDna: "Robinson insight was structural: hip-hop had been a live/soundsystem art form. She understood it could be a record. The architecture of Rappers Delight is the template for the next 40 years.",
    technicalDna: "Studio production of live disco backing track, vocal coaching of MC performances, Sugar Hill Records studio.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Identify a scene happening live that has no record yet. Figure out what the record version of that scene sounds like. Make the blueprint, not the copy.",
      originalityTwist: "Robinson label architecture thinking applied to emerging scenes: amapiano, Afrobeats, or footwork. What is the first commercially structured record from that scene?",
      warnings: ["Do not copy the Chic interpolation without clearance", "The Rappers Delight origin involved complex credit issues that remain unresolved"],
      fusionPaths: [],
      promptExports: [
        "Identify a scene happening live that has no record yet. Figure out what the record version of that scene sounds like. Make the blueprint, not the copy.",
        "Robinson label architecture thinking applied to emerging scenes: amapiano, Afrobeats, or footwork. What is the first commercially structured record from that scene?"
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 6,
      sonicIdentity: 7,
      arrangementSkill: 7,
      rhythmDesign: 5,
      melodicHarmonicIdentity: 6,
      soundDesign: 5,
      mixingAesthetics: 6,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 7,
      longevity: 6,
      adaptability: 6,
      originality: 8
    }
  },
  {
    id: "PDNA-000011",
    batchId: "001",
    name: "Rick Rubin",
    realName: "Frederick Jay Rubin",
    aliases: [],
    country: "United States",
    region: "New York / Los Angeles",
    activeYearsStart: 1983,

    primaryScenes: ["hip-hop", "rock", "metal", "country", "pop", "Def Jam"],
    genres: ["hip-hop", "rock", "metal", "pop", "country"] as ProducerRecord["genres"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "executive-producer"] as ProducerRecord["roles"],
    coreAngle: "Reduction, rawness, cross-genre minimal power",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Rubin signature is subtraction. His productions often strip away everything non-essential until only the most powerful core remains. This philosophy works across hip-hop, rock, metal, and country.",
    artisticDna: "Rubin functions as a curatorial intelligence more than a technical producer. He creates the conditions for artists to access their most authentic expression by removing obstacles: production complexity, label pressure, second-guessing.",
    technicalDna: "Known more for philosophical approach than technical signature. Major productions: Def Jam early hip-hop, Red Hot Chili Peppers, Johnny Cash American Recordings, Adele 30.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Before adding any element, ask: does this track need this? Remove one thing you think is essential. If it still works, it was unnecessary. Repeat until only the core remains.",
      originalityTwist: "Rubin minimalism logic applied to trap: remove the pad, the melody, the tag. Leave only 808, snare, and hi-hat. Then add back only the single element that makes it feel complete.",
      warnings: ["Do not confuse Rubin curatorial minimalism with lo-fi aesthetics", "His approach is context-specific: reduction that works for rock does not automatically work for all genres"],
      fusionPaths: [],
      promptExports: [
        "Before adding any element, ask: does this track need this? Remove one thing you think is essential. If it still works, it was unnecessary. Repeat until only the core remains.",
        "Rubin minimalism logic applied to trap: remove the pad, the melody, the tag. Leave only 808, snare, and hi-hat. Then add back only the single element that makes it feel complete."
      ]
    },
    scores: {
      innovation: 8,
      influence: 9,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 9,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 7,
      soundDesign: 6,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 9,
      undergroundImpact: 7,
      longevity: 9,
      adaptability: 9,
      originality: 7
    }
  },
  {
    id: "PDNA-000012",
    batchId: "001",
    name: "Dr. Dre",
    realName: "Andre Romelle Young",
    aliases: ["Dre"],
    country: "United States",
    region: "Compton / Los Angeles, California",
    activeYearsStart: 1984,

    primaryScenes: ["West Coast hip-hop", "G-funk", "gangsta rap", "Aftermath Records"],
    genres: ["hip-hop", "g-funk"] as ProducerRecord["genres"],
    eras: ["early-hip-hop-sampling", "midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "beatmaker", "vocal-producer"] as ProducerRecord["roles"],
    coreAngle: "Low-end authority, polished menace, vocal pocket control",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Deep, warm low-end foundation with a meticulous midrange that cuts through. Tight snare, vocal coaching clarity. The Chronic defined West Coast G-funk. 2001 defined polished menace.",
    artisticDna: "Dre builds sonic environments. His productions are not just beats: they are spaces with geography. The low frequencies are the ground, the snare defines the walls, the melody occupies a specific pocket.",
    technicalDna: "Akai MPC (various), Korg Triton (verified on Chronic and 2001 era), Roland JD-800, Minimoog, meticulous EQ and sidechain work, vocal production with hands-on performance direction.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Build the low end first: sub bass, kick relationship, 808 placement. Make sure every element has a frequency home that does not compete. Add melody last.",
      originalityTwist: "Dre low-end architecture applied to a different regional sound: what does a Lagos G-funk sound like? What does a Tokyo G-funk sound like? Different melodies, same low-end logic.",
      warnings: ["Do not copy the Nate Dogg vocal hook approach without original melody", "Do not replicate the G-funk synth slide: it has a specific regional identity", "The Dre snare is instantly recognizable: use its dynamics, not its exact sound"],
      fusionPaths: [],
      promptExports: [
        "Build the low end first: sub bass, kick relationship, 808 placement. Make sure every element has a frequency home that does not compete. Add melody last.",
        "Dre low-end architecture applied to a different regional sound: what does a Lagos G-funk sound like? What does a Tokyo G-funk sound like? Different melodies, same low-end logic."
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 10,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 9,
      longevity: 9,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000013",
    batchId: "001",
    name: "J Dilla",
    realName: "James Dewitt Yancey",
    aliases: ["Jay Dee", "Jay Dilla"],
    country: "United States",
    region: "Detroit, Michigan",
    activeYearsStart: 1991,
    activeYearsEnd: 2006,
    primaryScenes: ["Detroit beat scene", "neo-soul", "underground hip-hop", "Soulquarians"],
    genres: ["hip-hop", "neo-soul", "jazz"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur", "sampling-architect"] as ProducerRecord["roles"],
    coreAngle: "Humanized swing, asymmetry, emotional imperfection",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Off-grid drum feel, warm sample loops, chopped soul/jazz fragments, emotionally human imperfection. Dilla beats feel like they are breathing.",
    artisticDna: "Dilla deeper logic is not just swing. It is the feeling that the machine is breathing. His beats often feel slightly bent, intimate, warm, and conversational. The imperfection is not a mistake: it is the language.",
    technicalDna: "Akai MPC3000 (verified), Roland SP-303, record crate sourcing (soul, jazz, gospel), non-rigid quantization, warm low-mid texture, loop transformation over time.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Do not quantize the drums to grid. Let the kick breathe late.",
      originalityTwist: "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space.",
      warnings: ["Do not copy exact drum timing profiles from Donuts or Ruff Draft", "Do not replicate specific sample choices or chop patterns", "The emotional register is about intimacy: avoid making it sound simply lo-fi"],
      fusionPaths: [],
      promptExports: [
        "Warm sample-based beat with humanized swing, understated bass, dusty drums, and emotional loop repetition. Do not quantize the drums to grid. Let the kick breathe late.",
        "Combine Dilla-like humanized rhythm logic with New Orleans bounce percussion, ambient pads, or modern melodic rap space."
      ]
    },
    scores: {
      innovation: 10,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 7,
      culturalImportance: 10,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000014",
    batchId: "001",
    name: "DJ Premier",
    realName: "Christopher Edward Martin",
    aliases: ["Premo", "Primo"],
    country: "United States",
    region: "Brooklyn / Houston / New York City",
    activeYearsStart: 1989,

    primaryScenes: ["New York boom bap", "Gang Starr", "D&D Studios"],
    genres: ["hip-hop", "boom-bap"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "dj-producer", "sampling-architect"] as ProducerRecord["roles"],
    coreAngle: "Chopped grit, scratched hooks, drum-loop authority",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Hard-chopped sample loops with precisely placed horns, strings, or vocal fragments. Scratched hooks that replace traditional sung choruses. Drum loop authority: the loop IS the composition.",
    artisticDna: "Premier MPC is an instrument. His sample selections are crate-deep and rarely obvious. The scratch hook is his signature compositional device: a vocal phrase DJ-chopped into a rhythmic melodic statement.",
    technicalDna: "Akai MPC2500 and 60 (verified), Technics 1200 turntables, precise sample chop timing, drum loop editing at the bar level, D&D Studios NYC.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Find a sample with a single horn or string phrase. Chop it to two or three notes. Build a drum loop from a different source. Program the chops as a counter-melody. No pads, no fill.",
      originalityTwist: "Premier chop logic applied to a different crate: cumbia records, Japanese city pop, Indian film music. Same architecture, different source material.",
      warnings: ["Do not copy specific Nas, Biggie, or Jay-Z instrumentals", "The scratch hook is Premier signature: use it as inspiration for a different interactive element, not imitation"],
      fusionPaths: [],
      promptExports: [
        "Find a sample with a single horn or string phrase. Chop it to two or three notes. Build a drum loop from a different source. Program the chops as a counter-melody. No pads, no fill.",
        "Premier chop logic applied to a different crate: cumbia records, Japanese city pop, Indian film music. Same architecture, different source material."
      ]
    },
    scores: {
      innovation: 8,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 7,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000015",
    batchId: "001",
    name: "RZA",
    realName: "Robert Fitzgerald Diggs",
    aliases: ["Bobby Digital", "Prince Rakeem", "The Abbot"],
    country: "United States",
    region: "Staten Island, New York",
    activeYearsStart: 1991,

    primaryScenes: ["Wu-Tang Clan", "Staten Island underground hip-hop"],
    genres: ["hip-hop", "boom-bap"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur", "sampling-architect"] as ProducerRecord["roles"],
    coreAngle: "Dusty soul, martial arts cinema, raw texture, minor-key mythology",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Heavily distorted, compressed drum loops from soul and jazz records. Martial arts film dialogue and sound effects as compositional elements. Minor key samples, minor key melodies, dark claustrophobic texture.",
    artisticDna: "RZA built a mythology through sound. The Wu-Tang universe has a sonic identity: raw, basement-textured, philosophically dense. His samples from kung fu films were not decorations: they were narrative infrastructure.",
    technicalDna: "Akai MPC60 (early era, verified), sampling soul/jazz/kung-fu film audio, heavy compression and saturation on drum loops, minimal mastering: raw dynamics preserved.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Sample a melancholy soul record (piano or strings), compress it until it sounds like it is coming from another room. Add a chopped kung-fu film dialogue line as a rhythmic element. Hard kick, minimal snare reverb.",
      originalityTwist: "RZA texture logic applied to a different mythology: sample West African film, or Indian cinema. Dark minor key, same raw compression, different cultural narrative.",
      warnings: ["Do not copy specific Wu-Tang sample sources", "Do not replicate the martial arts dialogue samples: the cultural specificity is the point"],
      fusionPaths: [],
      promptExports: [
        "Sample a melancholy soul record (piano or strings), compress it until it sounds like it is coming from another room. Add a chopped kung-fu film dialogue line as a rhythmic element. Hard kick, minimal snare reverb.",
        "RZA texture logic applied to a different mythology: sample West African film, or Indian cinema. Dark minor key, same raw compression, different cultural narrative."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 7,
      culturalImportance: 10,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 9,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000016",
    batchId: "001",
    name: "Timbaland",
    realName: "Timothy Zachery Mosley",
    aliases: ["Tim"],
    country: "United States",
    region: "Virginia Beach, Virginia",
    activeYearsStart: 1993,

    primaryScenes: ["Virginia hip-hop", "R&B futurism", "pop production"],
    genres: ["hip-hop", "rnb", "pop", "electronic"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur", "vocal-producer"] as ProducerRecord["roles"],
    coreAngle: "Percussive futurism, negative space, vocal rhythm as drum language",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Syncopated drum programming where the hi-hat, kick, and ad-lib vocals function as a single polyrhythmic organism. Pitched down bass hits, unusual time signatures disguised as pop. Silence is as active as sound.",
    artisticDna: "Timbaland introduced non-Western rhythmic logic into R&B and pop: Bollywood, Middle Eastern, and West African rhythmic structures encoded into what sounds like a hit record. His negative space is active.",
    technicalDna: "Akai MPC, Roland samplers, vocal percussion (beatbox as composition layer), pitch-shifted bass hits, polyrhythmic drum programming, extensive use of unusual samples.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program drums where no two bars are identical in hi-hat rhythm. Use the ad-lib vocal as a drum voice. Leave large gaps where the listener expects a fill: replace with silence or a single hit.",
      originalityTwist: "Timbaland rhythmic complexity applied to a different genre context: what does an Afrobeats record sound like with Timbaland-style hi-hat polyrhythm? What does amapiano sound like with his negative-space philosophy?",
      warnings: ["Do not copy the specific Cry Me a River intro or Are You That Somebody sound design", "The polyrhythmic feel is systemic: copying individual sounds misses the architecture"],
      fusionPaths: [],
      promptExports: [
        "Program drums where no two bars are identical in hi-hat rhythm. Use the ad-lib vocal as a drum voice. Leave large gaps where the listener expects a fill: replace with silence or a single hit.",
        "Timbaland rhythmic complexity applied to a different genre context: what does an Afrobeats record sound like with Timbaland-style hi-hat polyrhythm? What does amapiano sound like with his negative-space philosophy?"
      ]
    },
    scores: {
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
      commercialImpact: 9,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 9,
      originality: 10
    }
  },
  {
    id: "PDNA-000017",
    batchId: "001",
    name: "The Neptunes",
    realName: "Pharrell Williams and Chad Hugo",
    aliases: ["Pharrell", "N.E.R.D."],
    country: "United States",
    region: "Virginia Beach, Virginia",
    activeYearsStart: 1992,

    primaryScenes: ["Virginia hip-hop", "pop", "R&B", "funk revival"],
    genres: ["hip-hop", "rnb", "pop", "funk"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Sparse bounce, synthetic funk, weird minimal hooks",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Percussion-forward minimalism where the snare and clap carry more emotional weight than the melody. Synthetic bass tones and synth leads that function like guitar licks. Hooks that feel strange but inevitable.",
    artisticDna: "The Neptunes stripped pop and rap down to percussion and a few carefully chosen elements. Their records feel like they are breathing: open, spacious, but rhythmically irresistible. Chad Hugo musical theory gives unusual chord color to what sounds casual.",
    technicalDna: "Korg Trinity (confirmed), E-mu samplers, Roland TR series, live guitar (Pharrell), precise hi-hat programming, unusual chord voicings, minimal reverb.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program snare and clap first: make them feel like a song on their own. Add a single bass line (two or three notes). Add one melodic element. Stop. Evaluate.",
      originalityTwist: "Neptunes sparse bounce applied to grime or UK garage: same minimal snare philosophy, different rhythmic grid (two-step or four-four), UK bass texture.",
      warnings: ["Do not copy Grindin drums or Frontin synth lead", "The weirdness is harmonic and structural: copying the sonic palette without the harmonic logic misses the point"],
      fusionPaths: [],
      promptExports: [
        "Program snare and clap first: make them feel like a song on their own. Add a single bass line (two or three notes). Add one melodic element. Stop. Evaluate.",
        "Neptunes sparse bounce applied to grime or UK garage: same minimal snare philosophy, different rhythmic grid (two-step or four-four), UK bass texture."
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 9,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 10
    }
  },
  {
    id: "PDNA-000018",
    batchId: "001",
    name: "Missy Elliott",
    realName: "Melissa Arnette Elliott",
    aliases: ["Misdemeanor"],
    country: "United States",
    region: "Portsmouth, Virginia",
    activeYearsStart: 1991,

    primaryScenes: ["Virginia hip-hop", "R&B", "pop"],
    genres: ["hip-hop", "rnb", "pop"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "vocal-producer", "beatmaker"] as ProducerRecord["roles"],
    coreAngle: "Vocal-producer imagination, playful futurism, rhythm-first song design",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Missy Elliott is primarily a vocal architect who uses her own voice as a production element: rhythmic ad-libs, pitch-shifted harmonies, and wordplay patterns that function as drum programming.",
    artisticDna: "Elliott production identity (primarily with Timbaland) is the result of a vocalist thinking like a producer. Song structure is determined by rhythmic vocal ideas first, not chord progressions.",
    technicalDna: "Primarily worked with Timbaland as her core producer; her contribution is vocal arrangement, song concept, and creative direction. Understanding her means understanding the collaboration architecture.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Write the drum pattern from a vocal rhythm perspective: what syllable pattern does this groove need? Program it. Then add chords to match the rhythm, not the other way around.",
      originalityTwist: "Missy rhythm-first vocal architecture applied to an Afrobeats or K-pop context. What does a Korean-language Missy-style vocal pattern sound like over a contemporary production?",
      warnings: ["Do not copy specific ad-lib patterns or vocal arrangements from her catalog", "The playful tone is emotionally specific: imitation without emotional intelligence reads as parody"],
      fusionPaths: [],
      promptExports: [
        "Write the drum pattern from a vocal rhythm perspective: what syllable pattern does this groove need? Program it. Then add chords to match the rhythm, not the other way around.",
        "Missy rhythm-first vocal architecture applied to an Afrobeats or K-pop context. What does a Korean-language Missy-style vocal pattern sound like over a contemporary production?"
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 9,
      longevity: 8,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000019",
    batchId: "001",
    name: "Metro Boomin",
    realName: "Leland Tyler Wayne",
    aliases: ["Young Metro"],
    country: "United States",
    region: "St. Louis, Missouri / Atlanta, Georgia",
    activeYearsStart: 2009,

    primaryScenes: ["Atlanta trap", "dark trap", "rap"],
    genres: ["trap", "hip-hop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Dark cinematic trap, negative space, 808 mood architecture",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Cinematic minor-key synth melodies over precisely programmed 808s. The 808 slide is used as an expressive melodic instrument. Sparse percussion that makes each hit feel massive.",
    artisticDna: "Metro productions create emotional environments. His dark, atmospheric trap beats are designed to frame the artist energy rather than compete with it. The cinematic quality comes from film score sensibility applied to trap.",
    technicalDna: "FL Studio (confirmed), 808 programming precision, synth melody composition (minor pentatonic and chromatic runs), minimal hi-hat, low reverb tail on snares.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Start with an 808 melody: slide and pitch the 808 as if it were a bass guitar solo. Build the melody first. Program the drums to serve the 808 movement.",
      originalityTwist: "Metro cinematic darkness applied to a different genre: what does a reggaeton track sound like with Metro-style 808 slides and sparse percussion? What about an Afrobeats record?",
      warnings: ["Do not copy specific sample melodies from Future or 21 Savage collaborations", "The Young Metro tag is his property: use original producer tags"],
      fusionPaths: [],
      promptExports: [
        "Start with an 808 melody: slide and pitch the 808 as if it were a bass guitar solo. Build the melody first. Program the drums to serve the 808 movement.",
        "Metro cinematic darkness applied to a different genre: what does a reggaeton track sound like with Metro-style 808 slides and sparse percussion? What about an Afrobeats record?"
      ]
    },
    scores: {
      innovation: 7,
      influence: 8,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 9,
      undergroundImpact: 9,
      longevity: 7,
      adaptability: 7,
      originality: 8
    }
  },
  {
    id: "PDNA-000020",
    batchId: "001",
    name: "Mike WiLL Made-It",
    realName: "Michael Len Williams II",
    aliases: ["Mike Will"],
    country: "United States",
    region: "Atlanta, Georgia",
    activeYearsStart: 2008,

    primaryScenes: ["Atlanta trap", "pop rap", "rap"],
    genres: ["trap", "hip-hop", "pop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Elastic 808s, hard minimal loops, hook-forward trap design",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Trap beats with an elastic quality: 808s that stretch and breathe, melodic loops that feel slightly pitched, hard snares that cut through.",
    artisticDna: "Mike WiLL creates trap that serves the hook. His beats are built to frame a rap or pop vocal, not to be the star themselves. The elasticity of his 808 programming is distinctive.",
    technicalDna: "FL Studio (confirmed), 808 with subtle pitch modulation, minimal loop construction, hard-tuned snare, crossover pop production capability.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program a trap beat with only three elements: 808, snare, and a two-bar melodic loop. Make the loop feel like it is breathing by subtle pitch automation.",
      originalityTwist: "Mike WiLL minimalism applied to a different pop context: what does a trap-pop fusion with UK pop vocal melody sound like using his bare-bones structure?",
      warnings: ["Do not use his producer tag", "Do not copy his work with Miley Cyrus or Kendrick Lamar: too widely recognized"],
      fusionPaths: [],
      promptExports: [
        "Program a trap beat with only three elements: 808, snare, and a two-bar melodic loop. Make the loop feel like it is breathing by subtle pitch automation.",
        "Mike WiLL minimalism applied to a different pop context: what does a trap-pop fusion with UK pop vocal melody sound like using his bare-bones structure?"
      ]
    },
    scores: {
      innovation: 7,
      influence: 7,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 6,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 7,
      commercialImpact: 8,
      undergroundImpact: 8,
      longevity: 6,
      adaptability: 7,
      originality: 7
    }
  },
  {
    id: "PDNA-000021",
    batchId: "001",
    name: "Zaytoven",
    realName: "Xavier Lamar Dotson",
    aliases: [],
    country: "United States",
    region: "San Francisco / Atlanta, Georgia",
    activeYearsStart: 2002,

    primaryScenes: ["Atlanta trap", "gospel trap"],
    genres: ["trap", "hip-hop", "gospel"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Church chords, loose piano, trap bounce, human touch",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Gospel-inflected piano lines played loosely over trap drums. The human feel of live keyboard performance inside a programmed trap context. Chromatic gospel runs over minor chord progressions.",
    artisticDna: "Zaytoven is the intersection of the church and the trap: gospel piano vocabulary encoded into rap production. His looseness is intentional and carries spiritual weight.",
    technicalDna: "Yamaha Motif keyboard (confirmed), live piano performance recorded into DAW, gospel chord vocabulary, trap drum programming.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Play a gospel-inflected piano line over a trap beat. Do not quantize the performance fully: preserve the human timing. Use church runs and chromatic passing tones.",
      originalityTwist: "Zaytoven piano logic applied to Afrobeats or Caribbean music: what does a Trinidad-flavored gospel trap beat sound like? Or a Nigerian church-meets-trap fusion?",
      warnings: ["Do not copy specific Gucci Mane collaboration arrangements", "The gospel element requires harmonic knowledge: surface imitation sounds hollow"],
      fusionPaths: [],
      promptExports: [
        "Play a gospel-inflected piano line over a trap beat. Do not quantize the performance fully: preserve the human timing. Use church runs and chromatic passing tones.",
        "Zaytoven piano logic applied to Afrobeats or Caribbean music: what does a Trinidad-flavored gospel trap beat sound like? Or a Nigerian church-meets-trap fusion?"
      ]
    },
    scores: {
      innovation: 7,
      influence: 8,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 8,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 8,
      commercialImpact: 7,
      undergroundImpact: 9,
      longevity: 7,
      adaptability: 6,
      originality: 8
    }
  },
  {
    id: "PDNA-000022",
    batchId: "001",
    name: "Lex Luger",
    realName: "Lexus Lewis",
    aliases: [],
    country: "United States",
    region: "Roanoke, Virginia",
    activeYearsStart: 2010,

    primaryScenes: ["Southern trap", "Atlanta rap"],
    genres: ["trap", "hip-hop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker"] as ProducerRecord["roles"],
    coreAngle: "Maximal brass/synth aggression, hard snare energy",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Brass-forward synth stabs over hard trap drums. The sonic template that defined the 2010-2013 trap era: loud, aggressive, maximum attack, BMF/Ross-era grandeur.",
    artisticDna: "Lex Luger productions feel like a victory lap before it has been earned. The bombast is the emotional statement. His work with Rick Ross defined a specific mode of hip-hop cinematic maximalism.",
    technicalDna: "FL Studio (confirmed), brass synth patches with heavy attack, hard-tuned snares, standard trap hi-hat patterns, loud mix with limited dynamic range.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Load a brass patch, program staccato stabs on the downbeat. Add hard snare. Program 808. Do not add melody: the stab is the melody.",
      originalityTwist: "Luger brass aggression applied to a drill context: slower BPM, darker key, same maximal brass philosophy.",
      warnings: ["This sound is era-specific: using it unmodified in 2020s context sounds dated", "Do not copy specific Ross or Waka collaborations"],
      fusionPaths: [],
      promptExports: [
        "Load a brass patch, program staccato stabs on the downbeat. Add hard snare. Program 808. Do not add melody: the stab is the melody.",
        "Luger brass aggression applied to a drill context: slower BPM, darker key, same maximal brass philosophy."
      ]
    },
    scores: {
      innovation: 7,
      influence: 7,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 6,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 5,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 7,
      commercialImpact: 7,
      undergroundImpact: 8,
      longevity: 5,
      adaptability: 5,
      originality: 7
    }
  },
  {
    id: "PDNA-000023",
    batchId: "001",
    name: "Southside",
    realName: "Joshua Howard Luellen",
    aliases: ["808 Mafia"],
    country: "United States",
    region: "Atlanta, Georgia",
    activeYearsStart: 2009,

    primaryScenes: ["Atlanta trap", "808 Mafia collective"],
    genres: ["trap", "hip-hop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker"] as ProducerRecord["roles"],
    coreAngle: "Dark drum programming, high-energy 808 pressure",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Dense, aggressive trap drum programming with layered 808s and high-energy atmospheric synth pads. Part of the 808 Mafia collective that defined dark trap aesthetics.",
    artisticDna: "Southside energy is kinetic. His productions are built for physical response: the 808 pressure is felt before it is heard. Part of the Atlanta ecosystem that built the sonic language Future and Young Thug would inhabit.",
    technicalDna: "FL Studio (confirmed), layered 808s with different pitch tunings for depth, trap hi-hat rolls, dark atmospheric synth pads.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Layer two 808s: one for sub punch, one for mid-range growl. Tune them a semitone apart for controlled dissonance. Add dark pad. Program dense hi-hat roll.",
      originalityTwist: "808 Mafia pressure applied to UK drill: slower, darker, different percussion grid: same layered 808 depth philosophy.",
      warnings: ["808 Mafia is a production collective: give specific credit", "Do not copy Future-era production arrangements directly"],
      fusionPaths: [],
      promptExports: [
        "Layer two 808s: one for sub punch, one for mid-range growl. Tune them a semitone apart for controlled dissonance. Add dark pad. Program dense hi-hat roll.",
        "808 Mafia pressure applied to UK drill: slower, darker, different percussion grid: same layered 808 depth philosophy."
      ]
    },
    scores: {
      innovation: 6,
      influence: 7,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 5,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 7,
      commercialImpact: 7,
      undergroundImpact: 9,
      longevity: 6,
      adaptability: 6,
      originality: 7
    }
  },
  {
    id: "PDNA-000024",
    batchId: "001",
    name: "Madlib",
    realName: "Otis Jackson Jr.",
    aliases: ["Quasimoto", "Beat Konducta", "Yesterday's New Quintet"],
    country: "United States",
    region: "Oxnard, California",
    activeYearsStart: 1991,

    primaryScenes: ["underground hip-hop", "jazz-damaged beat culture", "Stones Throw Records"],
    genres: ["hip-hop", "jazz", "boom-bap", "neo-soul"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "sampling-architect", "dj-producer"] as ProducerRecord["roles"],
    coreAngle: "Crate-digging collage, raw loops, jazz-damaged texture",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Heavily time-stretched and filtered samples from jazz, soul, and world music. Raw, low-fidelity processing applied to deeply obscure source material. Compositions that feel found rather than made.",
    artisticDna: "Madlib treats the world record crates as his instrument. His beatmaking is curatorial: finding the five bars in an obscure Brazilian LP that contain a universe, then presenting them in a new light.",
    technicalDna: "Akai MPC (various, confirmed), SP-1200 (reported), extensive vinyl crate digging, pitch-shifting and time-stretching, lo-fi processing chains, filter sweeps, chopped jazz.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Source a sample from a non-American record (Brazilian, Nigerian, Turkish, Indian). Find the four most unusual bars. Chop and rearrange them. Do not clean it up: preserve the texture.",
      originalityTwist: "Madlib collage logic applied to a different source tradition: Bollywood crate, Ghanaian highlife, Soviet-era library music. Same raw-loop philosophy, new geography.",
      warnings: ["Do not copy specific sample sources from Madvillainy or Pinata", "Lo-fi texture alone is not Madlib: the harmonic choice and source material are the substance"],
      fusionPaths: [],
      promptExports: [
        "Source a sample from a non-American record (Brazilian, Nigerian, Turkish, Indian). Find the four most unusual bars. Chop and rearrange them. Do not clean it up: preserve the texture.",
        "Madlib collage logic applied to a different source tradition: Bollywood crate, Ghanaian highlife, Soviet-era library music. Same raw-loop philosophy, new geography."
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 5,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000025",
    batchId: "001",
    name: "Pete Rock",
    realName: "Peter Alan Phillips",
    aliases: ["The Soul Brother"],
    country: "United States",
    region: "Mount Vernon, New York",
    activeYearsStart: 1988,

    primaryScenes: ["New York hip-hop", "boom bap", "soul jazz sampling"],
    genres: ["hip-hop", "boom-bap", "jazz", "soul"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["beatmaker", "sampling-architect", "dj-producer"] as ProducerRecord["roles"],
    coreAngle: "Warm horn loops, soul-jazz chops, head-nod elegance",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Jazz and soul samples with warm horn loops and a groove that demands physical response. Samples from Blue Note and soul labels chopped and pitched into rhythmically irresistible loops.",
    artisticDna: "Pete Rock production is defined by groove intelligence. His samples feel like they were always meant to be looped. The head-nod feel is not programmed: it is selected.",
    technicalDna: "Akai MPC (confirmed), extensive jazz vinyl sampling (Blue Note, Prestige, CTI), horn and saxophone loop selection, boom bap drum programming.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Find a jazz record with a horn section playing a rhythmic figure (not a ballad). Sample four bars. Build a boom bap drum pattern underneath. Let the horn carry the melody.",
      originalityTwist: "Pete Rock horn-loop logic applied to Afrobeats: sample highlife horn sections, build an Afrobeats rhythm underneath. Or apply to UK jazz-rap: British jazz records from the 1970s.",
      warnings: ["Do not replicate specific samples from classic Pete Rock instrumentals", "Head-nod groove is about selection and timing: it cannot be manufactured from inappropriate source material"],
      fusionPaths: [],
      promptExports: [
        "Find a jazz record with a horn section playing a rhythmic figure (not a ballad). Sample four bars. Build a boom bap drum pattern underneath. Let the horn carry the melody.",
        "Pete Rock horn-loop logic applied to Afrobeats: sample highlife horn sections, build an Afrobeats rhythm underneath. Or apply to UK jazz-rap: British jazz records from the 1970s."
      ]
    },
    scores: {
      innovation: 8,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 6,
      originality: 9
    }
  },
  {
    id: "PDNA-000026",
    batchId: "001",
    name: "Marley Marl",
    realName: "Marlon Williams",
    aliases: [],
    country: "United States",
    region: "Queensbridge, New York",
    activeYearsStart: 1983,

    primaryScenes: ["Queensbridge hip-hop", "Cold Chillin Records", "early sampling"],
    genres: ["hip-hop", "boom-bap"] as ProducerRecord["genres"],
    eras: ["early-hip-hop-sampling", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["beatmaker", "sampling-architect", "engineer-producer"] as ProducerRecord["roles"],
    coreAngle: "Sampling architecture, drum reconstruction, early beat science",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "One of the first producers to understand that individual drum sounds could be sampled and reconstructed into new patterns: separating the drum hit from the drum loop. This was technically groundbreaking.",
    artisticDna: "Marl contribution is architectural: he discovered how to use sampling as a compositional tool rather than just a reproduction device. His Queensbridge productions are among the first examples of hip-hop as studio art.",
    technicalDna: "Akai MPC60 (early, confirmed), Emu SP-1200, individual drum sample isolation and reconstruction, early sampling methodology.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Sample a single drum hit (snare, kick) from a record and program it as a new pattern: not the original loop. This is Marl fundamental contribution. Build the beat from isolated hits, not loops.",
      originalityTwist: "Marl drum-reconstruction methodology applied to non-hip-hop source material: sample individual drum hits from a reggae, jazz, or funk record and build a new contemporary pattern.",
      warnings: ["This is historically important: understand the technical context before borrowing aesthetically", "Do not reduce to old New York hip-hop sound without understanding the architectural innovation"],
      fusionPaths: [],
      promptExports: [
        "Sample a single drum hit (snare, kick) from a record and program it as a new pattern: not the original loop. This is Marl fundamental contribution. Build the beat from isolated hits, not loops.",
        "Marl drum-reconstruction methodology applied to non-hip-hop source material: sample individual drum hits from a reggae, jazz, or funk record and build a new contemporary pattern."
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 8,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 6,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 9,
      longevity: 7,
      adaptability: 5,
      originality: 8
    }
  },
  {
    id: "PDNA-000027",
    batchId: "001",
    name: "DJ Screw",
    realName: "Robert Earl Davis Jr.",
    aliases: ["Screwed Up Click"],
    country: "United States",
    region: "Houston, Texas",
    activeYearsStart: 1990,
    activeYearsEnd: 2000,
    primaryScenes: ["Houston rap", "screwed-and-chopped", "chopped-not-slopped"],
    genres: ["hip-hop"] as ProducerRecord["genres"],
    eras: ["midi-sampler"] as ProducerRecord["eras"],
    roles: ["dj-producer", "remixer"] as ProducerRecord["roles"],
    coreAngle: "Slowed time, syrup atmosphere, remix-as-worldbuilding",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Slowing down and pitch-shifting existing rap recordings creates a completely new emotional and sensory experience. The screw technique transformed regional mixtape culture into a recognized aesthetic tradition.",
    artisticDna: "DJ Screw innovation was understanding that tempo and pitch are emotional variables, not fixed properties. The slowed-down music matched the physical and emotional experience of the Houston scene.",
    technicalDna: "Technics 1200 turntables (or equivalent), pitch control manipulation, chopped freestyle DJ mixing, cassette tape distribution.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Take any existing record and pitch it down 15-20 percent. Chop the DJ transitions between sections. The act of slowing down reveals new harmonic and rhythmic content.",
      originalityTwist: "Screw pitch-slowing philosophy applied to non-rap music: slowed Afrobeats, slowed amapiano, slowed reggaeton: what new emotional space emerges?",
      warnings: ["The screw technique must be understood as culturally specific: it emerged from a specific Houston experience", "Do not appropriate the aesthetic without understanding its origin and context"],
      fusionPaths: [],
      promptExports: [
        "Take any existing record and pitch it down 15-20 percent. Chop the DJ transitions between sections. The act of slowing down reveals new harmonic and rhythmic content.",
        "Screw pitch-slowing philosophy applied to non-rap music: slowed Afrobeats, slowed amapiano, slowed reggaeton: what new emotional space emerges?"
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 6,
      sonicIdentity: 9,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 5,
      soundDesign: 7,
      mixingAesthetics: 6,
      culturalImportance: 10,
      commercialImpact: 5,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 4,
      originality: 9
    }
  },
  {
    id: "PDNA-000028",
    batchId: "001",
    name: "SOPHIE",
    realName: "Sophie Xeon",
    aliases: [],
    country: "United Kingdom / Scotland",
    region: "Glasgow / London",
    activeYearsStart: 2013,
    activeYearsEnd: 2021,
    primaryScenes: ["hyperpop", "experimental electronic", "PC Music"],
    genres: ["hyperpop", "electronic", "experimental", "pop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Plastic-metal sound design, extreme synthetic physicality",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Sound design that pushes synthetic textures to physical extremes: hyper-compressed, hyper-bright, gleaming plastic surfaces and metallic textures that feel material. Production where the sound itself carries bodily meaning.",
    artisticDna: "SOPHIE productions reject the organic-synthetic hierarchy. Synthetic sounds are not pretending to be acoustic: they are their own thing, with physical and emotional qualities unique to synthesis.",
    technicalDna: "Advanced synthesis programming (confirmed), extreme compression and limiting, hyper-bright high-end textures, physical metaphor through audio design (rubber, plastic, metal sounds), Ableton reported.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Design a synth patch that sounds like a physical material: rubber, plastic, glass, metal. Build a production around its texture rather than a traditional harmonic or rhythmic idea.",
      originalityTwist: "SOPHIE synthetic-material philosophy applied to a different genre: what does Afrobeats sound like with plastic-texture sound design? What does reggaeton sound like with metallic synthesis?",
      warnings: ["SOPHIE work carries specific personal and cultural context: treat it with care", "Do not reduce hyperpop to simply bright and compressed: the emotional depth is non-trivial"],
      fusionPaths: [],
      promptExports: [
        "Design a synth patch that sounds like a physical material: rubber, plastic, glass, metal. Build a production around its texture rather than a traditional harmonic or rhythmic idea.",
        "SOPHIE synthetic-material philosophy applied to a different genre: what does Afrobeats sound like with plastic-texture sound design? What does reggaeton sound like with metallic synthesis?"
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 9,
      longevity: 6,
      adaptability: 9,
      originality: 10
    }
  },
  {
    id: "PDNA-000029",
    batchId: "001",
    name: "Arca",
    realName: "Alejandro Ghersi",
    aliases: [],
    country: "Venezuela / Global",
    region: "Caracas, Venezuela / London / Barcelona",
    activeYearsStart: 2008,

    primaryScenes: ["experimental electronic", "avant-pop", "UK underground"],
    genres: ["experimental", "electronic", "hyperpop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Mutant sound design, body-horror beauty, fractured rhythm",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Sound design that references biological and bodily processes: textures that feel wet, skeletal, visceral. Rhythms that fracture and reassemble. Productions that feel alive in an uncanny, uncomfortable way.",
    artisticDna: "Arca work is about the politics of the body, particularly trans and queer embodiment expressed through sound design and rhythm. The fractured nature of her music is not random; it reflects specific experiences of self and fragmentation.",
    technicalDna: "Extreme synthesis and processing, Ableton (confirmed), collaboration with FKA Twigs and Bjork, biological-texture sound design, rhythm programming that deliberately breaks grid expectations.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Design a percussion element that sounds biological rather than mechanical. Build a rhythm that has a sense of breath: irregular but intentional. Remove resolution; let tension remain.",
      originalityTwist: "Arca fractured-body sound logic applied to a specific cultural context: what does Venezuelan folk music sound like processed through her synthesis philosophy? Or Arabic maqam scales through her rhythmic architecture?",
      warnings: ["Arca personal and identity context is integral to the work: surface imitation without understanding misses everything", "Do not reduce to glitch aesthetics"],
      fusionPaths: [],
      promptExports: [
        "Design a percussion element that sounds biological rather than mechanical. Build a rhythm that has a sense of breath: irregular but intentional. Remove resolution; let tension remain.",
        "Arca fractured-body sound logic applied to a specific cultural context: what does Venezuelan folk music sound like processed through her synthesis philosophy? Or Arabic maqam scales through her rhythmic architecture?"
      ]
    },
    scores: {
      innovation: 10,
      influence: 8,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 5,
      undergroundImpact: 9,
      longevity: 6,
      adaptability: 9,
      originality: 10
    }
  },
  {
    id: "PDNA-000030",
    batchId: "001",
    name: "Burial",
    realName: "William Emanuel Bevan",
    aliases: [],
    country: "United Kingdom",
    region: "South London, England",
    activeYearsStart: 2003,

    primaryScenes: ["UK garage", "dubstep", "ambient", "grime"],
    genres: ["dubstep", "uk-garage", "ambient", "electronic"] as ProducerRecord["genres"],
    eras: ["daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer"] as ProducerRecord["roles"],
    coreAngle: "Ghostly urban ambience, shuffled drums, emotional decay",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Shuffled drum patterns where the hi-hat is placed on unusual subdivisions, creating a perpetually-off-balance groove. Heavily processed and pitch-shifted vocal samples as melodic and emotional texture. South London night-city atmosphere.",
    artisticDna: "Burial music sounds like the feeling of being alone in a city at 3am: waiting at a bus stop in the rain, half-drunk, thinking about something that happened two years ago. The sonic grammar is melancholy and specifically urban.",
    technicalDna: "Adobe Audition (confirmed, not Ableton, notable), vinyl crackle and noise as texture, hi-hat shuffle at non-standard subdivisions, vocal sample chopping and pitch manipulation.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Take a vocal sample and pitch it up or down until it sounds like a ghost. Shuffle the hi-hat to a non-standard subdivision (between eighth and sixteenth). Add rain or static as atmosphere. Let chords decay without resolution.",
      originalityTwist: "Burial urban-melancholy logic applied to a different city geography: What does Lagos night sound like through Burial processing? What does Tokyo 3am sound like in this grammar?",
      warnings: ["Do not copy the specific shuffled hi-hat patterns from Untrue or self-titled", "The vocal sample treatment is distinctive enough to be recognizable: find your own source material"],
      fusionPaths: [],
      promptExports: [
        "Take a vocal sample and pitch it up or down until it sounds like a ghost. Shuffle the hi-hat to a non-standard subdivision (between eighth and sixteenth). Add rain or static as atmosphere. Let chords decay without resolution.",
        "Burial urban-melancholy logic applied to a different city geography: What does Lagos night sound like through Burial processing? What does Tokyo 3am sound like in this grammar?"
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 8,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 5,
      undergroundImpact: 9,
      longevity: 7,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000031",
    batchId: "001",
    name: "Aphex Twin",
    realName: "Richard David James",
    aliases: ["AFX", "Polygon Window", "Bradley Strider"],
    country: "United Kingdom / Ireland",
    region: "Cornwall / London",
    activeYearsStart: 1987,

    primaryScenes: ["IDM", "ambient", "acid techno", "experimental electronic"],
    genres: ["idm", "ambient", "techno", "electronic", "experimental"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Algorithmic rhythm, alien melody, playful technical extremity",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Rhythms that appear chaotic but are mathematically constructed: polyrhythm, odd time signatures, breakcore-influenced drum programming. Melodies that sound like they are from a dream or a machine that learned emotions incorrectly.",
    artisticDna: "Aphex Twin plays simultaneously in multiple registers: technically demanding IDM, gentle ambient, sardonic pop parody. The humor and technical mastery coexist without contradiction.",
    technicalDna: "Custom synthesizer builds (confirmed), Korg Wavestation, Roland gear, Moog, self-built circuitry, algorithmic composition tools.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program a drum pattern in 7/8 or 5/4. Write a melody that resolves on the wrong beat. Add an ambient counterpart that runs in a different time signature simultaneously.",
      originalityTwist: "Aphex Twin mathematical-rhythm logic applied to a different melodic tradition: what does a West African kora melody sound like inside an Aphex-style polyrhythmic drum structure?",
      warnings: ["Do not imitate the specific textures from Selected Ambient Works Vol II or Come to Daddy", "Technical complexity without emotional content misses the point: his work has strong emotional logic"],
      fusionPaths: [],
      promptExports: [
        "Program a drum pattern in 7/8 or 5/4. Write a melody that resolves on the wrong beat. Add an ambient counterpart that runs in a different time signature simultaneously.",
        "Aphex Twin mathematical-rhythm logic applied to a different melodic tradition: what does a West African kora melody sound like inside an Aphex-style polyrhythmic drum structure?"
      ]
    },
    scores: {
      innovation: 10,
      influence: 9,
      technicalCraft: 10,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 10,
      melodicHarmonicIdentity: 9,
      soundDesign: 10,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 5,
      undergroundImpact: 10,
      longevity: 8,
      adaptability: 9,
      originality: 10
    }
  },
  {
    id: "PDNA-000032",
    batchId: "001",
    name: "Daft Punk",
    realName: "Thomas Bangalter and Guy-Manuel de Homem-Christo",
    aliases: [],
    country: "France",
    region: "Paris, France",
    activeYearsStart: 1993,
    activeYearsEnd: 2021,
    primaryScenes: ["French house", "electronic pop", "filter house"],
    genres: ["house", "electronic", "disco", "pop", "funk"] as ProducerRecord["genres"],
    eras: ["daw", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "sound-designer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Robotic funk, filter-house memory, vocoder mythology",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "A",
    signatureSoundSummary: "Auto-filter sweeps on house samples, vocoder vocal processing, disco sample manipulation, robotic production identity combined with deep emotional warmth. The human inside the machine.",
    artisticDna: "Daft Punk most radical act was presenting themselves as robots to make the music feel more human: the contrast between the machine persona and the warmth of the music creates an emotional paradox.",
    technicalDna: "Roland TB-303, filter synthesizers, vocoder, extensive live musician sessions for Random Access Memories, sample manipulation (homework era), Nile Rodgers collaboration.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Take a disco or funk sample. Run it through an auto-filter sweep. Build a four-on-the-floor kick over it. Add a vocoder vocal melody. The mechanical precision should produce something emotionally warm.",
      originalityTwist: "Daft Punk filter-house logic applied to a different sample tradition: Brazilian baile funk samples through French house filter sweeps. Or Nigerian disco through their production architecture.",
      warnings: ["Do not copy specific Discovery or Homework samples", "The robot persona is specific to their artistic identity: do not wholesale imitate it"],
      fusionPaths: [],
      promptExports: [
        "Take a disco or funk sample. Run it through an auto-filter sweep. Build a four-on-the-floor kick over it. Add a vocoder vocal melody. The mechanical precision should produce something emotionally warm.",
        "Daft Punk filter-house logic applied to a different sample tradition: Brazilian baile funk samples through French house filter sweeps. Or Nigerian disco through their production architecture."
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 10,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 10
    }
  },
  {
    id: "PDNA-000033",
    batchId: "001",
    name: "Kraftwerk",
    realName: "Ralf Hutter and Florian Schneider et al.",
    aliases: [],
    country: "Germany",
    region: "Dusseldorf, Germany",
    activeYearsStart: 1969,
    activeYearsEnd: 2022,
    primaryScenes: ["Krautrock", "electronic pop", "synthpop"],
    genres: ["electronic", "synthpop", "experimental", "pop"] as ProducerRecord["genres"],
    eras: ["disco-electronic-studio", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "composer-producer", "sound-designer"] as ProducerRecord["roles"],
    coreAngle: "Machine minimalism, sequencer logic, electronic-pop foundation",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "A",
    signatureSoundSummary: "Synthesizer and sequencer as primary instruments. Melodic minimalism with precise mechanical rhythm. Human themes (travel, communication, technology) expressed through machine music.",
    artisticDna: "Kraftwerk invented the vocabulary that virtually all subsequent electronic music speaks. The sequenced bassline, the drum machine pattern, the vocoder vocal: all were codified by Kraftwerk before being adopted universally.",
    technicalDna: "Custom synthesizer builds, Synthanorma Sequenzer, ARP sequencers, custom drum machines, Kling Klang Studio Dusseldorf, entirely self-contained production system.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Build a melodic sequence using only three or four notes. Program a drum machine pattern with the same precision. Do not add embellishment. The restraint is the art.",
      originalityTwist: "Kraftwerk minimalism applied to a different cultural identity: what does African minimalist electronic music sound like using Kraftwerk sequencer logic? Or Japanese minimalism through their machine philosophy?",
      warnings: ["Nearly every Kraftwerk element has been copied so extensively it is now generic: originality requires understanding what they were doing conceptually, not just sonically", "Do not use Trans-Europe Express or Autobahn drum patterns without recontextualization"],
      fusionPaths: [],
      promptExports: [
        "Build a melodic sequence using only three or four notes. Program a drum machine pattern with the same precision. Do not add embellishment. The restraint is the art.",
        "Kraftwerk minimalism applied to a different cultural identity: what does African minimalist electronic music sound like using Kraftwerk sequencer logic? Or Japanese minimalism through their machine philosophy?"
      ]
    },
    scores: {
      innovation: 10,
      influence: 10,
      technicalCraft: 8,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 7,
      undergroundImpact: 8,
      longevity: 10,
      adaptability: 6,
      originality: 10
    }
  },
  {
    id: "PDNA-000034",
    batchId: "001",
    name: "Wendy Carlos",
    realName: "Wendy Carlos",
    aliases: [],
    country: "United States",
    region: "Pawtucket, Rhode Island",
    activeYearsStart: 1964,

    primaryScenes: ["electronic classical", "film score", "synthesis"],
    genres: ["electronic", "classical", "film-score", "experimental"] as ProducerRecord["genres"],
    eras: ["disco-electronic-studio"] as ProducerRecord["eras"],
    roles: ["composer-producer", "sound-designer"] as ProducerRecord["roles"],
    coreAngle: "Synth translation, timbre discipline, electronic orchestration",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Switched-On Bach (1968) demonstrated that the synthesizer could produce nuanced, expressive music equivalent to orchestral performance. Carlos brought classical discipline to synthesis: understanding timbre as a compositional parameter.",
    artisticDna: "Carlos approached the synthesizer as an orchestral instrument: each patch required the same careful attention as an oboe or violin selection. The Moog was tuned with precision. The art was in the timbre.",
    technicalDna: "Moog modular synthesizer (confirmed), meticulous tuning and timbre programming, multi-track overdubbing of synthesizer parts, collaboration with Robert Moog.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Choose a timbre for each element of the arrangement as carefully as you would choose an instrument. Ask: what quality does this sound need to convey its role? Engineer the patch for that quality before programming the notes.",
      originalityTwist: "Carlos timbre-discipline philosophy applied to synthesis for contemporary music: approach each synth patch as a classical instrument with a specific role in the ensemble.",
      warnings: ["Carlos work has specific historical and biographical context that should be understood before reference", "Do not replicate Switched-On Bach directly: the timbral approach is the lesson, not the repertoire"],
      fusionPaths: [],
      promptExports: [
        "Choose a timbre for each element of the arrangement as carefully as you would choose an instrument. Ask: what quality does this sound need to convey its role? Engineer the patch for that quality before programming the notes.",
        "Carlos timbre-discipline philosophy applied to synthesis for contemporary music: approach each synth patch as a classical instrument with a specific role in the ensemble."
      ]
    },
    scores: {
      innovation: 10,
      influence: 8,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 7,
      rhythmDesign: 5,
      melodicHarmonicIdentity: 8,
      soundDesign: 10,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 7,
      longevity: 8,
      adaptability: 6,
      originality: 9
    }
  },
  {
    id: "PDNA-000035",
    batchId: "001",
    name: "Ryuichi Sakamoto",
    realName: "Ryuichi Sakamoto",
    aliases: [],
    country: "Japan",
    region: "Tokyo, Japan",
    activeYearsStart: 1967,
    activeYearsEnd: 2023,
    primaryScenes: ["Yellow Magic Orchestra", "ambient", "film score", "electronic classical"],
    genres: ["electronic", "ambient", "film-score", "classical", "j-pop", "experimental"] as ProducerRecord["genres"],
    eras: ["disco-electronic-studio", "midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["composer-producer", "sound-designer", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Elegant harmony, electronic-acoustic fusion, cinematic restraint",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "A composer who moved fluidly between electronic pop (YMO), film score (Merry Christmas Mr. Lawrence, The Last Emperor), and solo ambient experimentation. Elegant harmonic language that bridges Western classical and Japanese aesthetic sensibility.",
    artisticDna: "Sakamoto productions are defined by restraint and harmonic richness. A single piano note is given space to decay. Electronic textures are chosen for emotional specificity.",
    technicalDna: "Classical piano training, synthesizer programming (YMO era: Roland, Korg, Moog), Arp Odyssey (confirmed YMO), film scoring for full orchestra, Max/MSP for later experimental work.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Write a chord progression with an unusual passing chord from a different harmonic tradition (modal jazz, Japanese court music, or spectral harmony). Build an ambient electronic production around one piano performance.",
      originalityTwist: "Sakamoto harmonic elegance applied to contemporary R&B: jazz-influenced chord voicings under a modern production. Or his film-score restraint applied to trap: sparse piano with an orchestral hit only on the drop.",
      warnings: ["Do not copy the Merry Christmas Mr Lawrence piano theme: it is immediately recognizable", "The restraint is the point: adding elements is often wrong"],
      fusionPaths: [],
      promptExports: [
        "Write a chord progression with an unusual passing chord from a different harmonic tradition (modal jazz, Japanese court music, or spectral harmony). Build an ambient electronic production around one piano performance.",
        "Sakamoto harmonic elegance applied to contemporary R&B: jazz-influenced chord voicings under a modern production. Or his film-score restraint applied to trap: sparse piano with an orchestral hit only on the drop."
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 9,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 10,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 6,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000036",
    batchId: "001",
    name: "Yasutaka Nakata",
    realName: "Yasutaka Nakata",
    aliases: ["capsule producer", "Perfume producer"],
    country: "Japan",
    region: "Kanazawa / Tokyo, Japan",
    activeYearsStart: 1999,

    primaryScenes: ["J-pop", "electropop"],
    genres: ["j-pop", "electronic", "pop", "synthpop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "composer-producer", "vocal-producer"] as ProducerRecord["roles"],
    coreAngle: "Glossy synthetic pop, vocal processing, kawaii-futurist precision",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Hyper-polished synthesizer pop with extreme vocal processing (vocoder, Auto-Tune as aesthetic choice). Melodic hooks engineered with mathematical precision. Perfume and Kyary Pamyu Pamyu productions as pop architecture.",
    artisticDna: "Nakata builds pop hooks the way an engineer builds a mechanism: every element serves a function, nothing is decorative without earning its place.",
    technicalDna: "Ableton Live (confirmed), extensive synthesis programming, vocoder and Auto-Tune as production elements (not correction), J-pop production standards with electronic production.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Write a melody first, then process the vocal to make it part of the texture rather than above it. Program synthesizers to support the vocal melody rather than compete with it.",
      originalityTwist: "Nakata precision-pop methodology applied to a different cultural language: what does a Korean-language production built with his hyper-precision J-pop logic sound like?",
      warnings: ["The kawaii aesthetic is culturally specific: cross-cultural adoption requires care", "Do not imitate Perfume vocal arrangements directly"],
      fusionPaths: [],
      promptExports: [
        "Write a melody first, then process the vocal to make it part of the texture rather than above it. Program synthesizers to support the vocal melody rather than compete with it.",
        "Nakata precision-pop methodology applied to a different cultural language: what does a Korean-language production built with his hyper-precision J-pop logic sound like?"
      ]
    },
    scores: {
      innovation: 8,
      influence: 7,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 8,
      commercialImpact: 7,
      undergroundImpact: 7,
      longevity: 7,
      adaptability: 7,
      originality: 8
    }
  },
  {
    id: "PDNA-000037",
    batchId: "001",
    name: "A. R. Rahman",
    realName: "Allah Rakha Rahman",
    aliases: ["Mozart of Madras"],
    country: "India",
    region: "Chennai (Madras), Tamil Nadu, India",
    activeYearsStart: 1988,

    primaryScenes: ["Bollywood film music", "Tamil film music", "world fusion"],
    genres: ["bollywood", "pop", "electronic", "film-score", "classical"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["composer-producer", "producer-auteur", "arranger"] as ProducerRecord["roles"],
    coreAngle: "Orchestral-electronic fusion, spiritual melody, cinematic scale",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "A complete compositional language that fuses Indian classical melody (Carnatic and Hindustani), Western orchestral arrangement, electronic production, and global pop. Every production is a cinematic event.",
    artisticDna: "Rahman operates at full orchestral and cinematic scale while understanding the intimacy a song needs. His spiritual dimension is not decorative: it informs melodic choices, key selection, and emotional arc.",
    technicalDna: "AM Studios Chennai (confirmed), full orchestral recording, extensive MIDI programming, Carnatic classical knowledge, Western harmony, vocalists from across India and internationally.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Start with a raga or scale that carries a specific emotional quality (Bhairavi for pathos, Desh for nostalgia). Build an electronic production around the modal logic of that raga without restricting it to traditional instrumentation.",
      originalityTwist: "Rahman fusion architecture applied creatively: Indian classical raga logic under contemporary trap rhythms. Or Carnatic rhythmic cycles (tala) applied to an electronic music context.",
      warnings: ["Indian classical melody is not background texture: it carries specific emotional and cultural meaning", "Do not sample Slumdog Millionaire songs without clearance"],
      fusionPaths: [],
      promptExports: [
        "Start with a raga or scale that carries a specific emotional quality (Bhairavi for pathos, Desh for nostalgia). Build an electronic production around the modal logic of that raga without restricting it to traditional instrumentation.",
        "Rahman fusion architecture applied creatively: Indian classical raga logic under contemporary trap rhythms. Or Carnatic rhythmic cycles (tala) applied to an electronic music context."
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 9,
      sonicIdentity: 10,
      arrangementSkill: 10,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 10,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 10,
      commercialImpact: 8,
      undergroundImpact: 8,
      longevity: 9,
      adaptability: 9,
      originality: 9
    }
  },
  {
    id: "PDNA-000038",
    batchId: "001",
    name: "Max Martin",
    realName: "Martin Karl Sandberg",
    aliases: [],
    country: "Sweden",
    region: "Stockholm, Sweden",
    activeYearsStart: 1989,

    primaryScenes: ["Cheiron Studios", "global pop", "boy bands", "pop production"],
    genres: ["pop", "rnb", "rock", "electronic"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "composer-producer", "vocal-producer"] as ProducerRecord["roles"],
    coreAngle: "Hook architecture, melodic math, chorus engineering",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "The most commercially successful pop producer in history. Max Martin productions are optimized for emotional payoff: the pre-chorus builds tension, the chorus delivers maximum release.",
    artisticDna: "Martin approaches melody the way a mathematician approaches an equation: finding the most efficient path from verse tension to chorus release. His vocal melodies are built for mass physical and emotional response.",
    technicalDna: "Extensive chord/melody composition, Cheiron Studios system, vocal production with precise pitch and rhythm correction, later collaboration with Shellback, Abel Tesfaye, Taylor Swift.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Write a chorus melody that has a peak note: the highest pitch of the entire chorus. Build the pre-chorus to approach that peak but not quite arrive. Hit the peak at the chorus downbeat.",
      originalityTwist: "Max Martin chorus-engineering logic applied to a non-pop genre: build a boom bap verse that has a Max Martin-style emotional peak and release structure. Or apply his melodic math to an Afrobeats hook.",
      warnings: ["Do not copy specific Backstreet Boys, Britney Spears, or Taylor Swift vocal arrangements", "His system is teachable but not copyable: the emotional function must be understood, not the sound"],
      fusionPaths: [],
      promptExports: [
        "Write a chorus melody that has a peak note: the highest pitch of the entire chorus. Build the pre-chorus to approach that peak but not quite arrive. Hit the peak at the chorus downbeat.",
        "Max Martin chorus-engineering logic applied to a non-pop genre: build a boom bap verse that has a Max Martin-style emotional peak and release structure. Or apply his melodic math to an Afrobeats hook."
      ]
    },
    scores: {
      innovation: 8,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 9,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 9,
      commercialImpact: 10,
      undergroundImpact: 5,
      longevity: 10,
      adaptability: 9,
      originality: 8
    }
  },
  {
    id: "PDNA-000039",
    batchId: "001",
    name: "Shellback",
    realName: "Karl Johan Schuster",
    aliases: [],
    country: "Sweden",
    region: "Stockholm, Sweden",
    activeYearsStart: 2007,

    primaryScenes: ["global pop", "Max Martin collaborator"],
    genres: ["pop", "rnb", "rock"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Modern pop punch, guitar/synth hybrid hooks",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Co-producer of Taylor Swift 1989 and pop/rock-crossover productions. Shellback signature is a hybrid production aesthetic: live guitar energy inside a polished digital production framework.",
    artisticDna: "Shellback brings a rock-band energy to pop production: the guitars feel live, the arrangement has physical impact, but the overall production is polished to streaming standards.",
    technicalDna: "Ableton or Logic (unconfirmed), live guitar recording, vocal production (with Taylor Swift team), hybrid synth/guitar arrangements.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Record a distorted guitar riff. Process it to sit in a pop production mix: compress, EQ, place in stereo field. Let it feel live but controlled.",
      originalityTwist: "Shellback guitar/synth hybrid logic applied to non-pop genres: live guitar inside an Afrobeats production. Or rock guitar in an amapiano framework.",
      warnings: ["Do not copy specific Taylor Swift 1989 production elements: they are widely recognized", "The hybrid approach requires authentic guitar performance: poor guitar playing does not benefit from this framework"],
      fusionPaths: [],
      promptExports: [
        "Record a distorted guitar riff. Process it to sit in a pop production mix: compress, EQ, place in stereo field. Let it feel live but controlled.",
        "Shellback guitar/synth hybrid logic applied to non-pop genres: live guitar inside an Afrobeats production. Or rock guitar in an amapiano framework."
      ]
    },
    scores: {
      innovation: 7,
      influence: 7,
      technicalCraft: 8,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 7,
      commercialImpact: 9,
      undergroundImpact: 5,
      longevity: 7,
      adaptability: 7,
      originality: 7
    }
  },
  {
    id: "PDNA-000040",
    batchId: "001",
    name: "Nile Rodgers",
    realName: "Nile Gregory Rodgers",
    aliases: [],
    country: "United States",
    region: "New York City",
    activeYearsStart: 1970,

    primaryScenes: ["disco", "funk", "pop", "Chic", "Bowie Daft Punk collaborator"],
    genres: ["disco", "funk", "pop", "rnb"] as ProducerRecord["genres"],
    eras: ["disco-electronic-studio", "midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "arranger", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Guitar groove architecture, live-dance precision, elegant repetition",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "A",
    signatureSoundSummary: "The chucka rhythm guitar: a precise, muted, syncopated guitar pattern that functions as both rhythm and melodic element. Arrangements that are lean, functional, and irresistibly groove-forward.",
    artisticDna: "Rodgers understands groove at a cellular level. Every element in a Chic production has a function; nothing is decorative. The guitar is the backbone, but it is the space between notes that makes the groove work.",
    technicalDna: "Fender Hitmaker (specific guitar, confirmed), precise rhythm guitar technique (muted chucka pattern), studio work with Chic, David Bowie, Madonna, Daft Punk, live session recording.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Learn the Nile Rodgers guitar chucking technique (or synthesize it): short, muted, syncopated rhythm guitar on the upbeat. Build a disco or funk arrangement around it.",
      originalityTwist: "Rodgers groove architecture applied to Afrobeats: what does an Afrobeats track sound like when the primary rhythmic element is a Rodgers-style chucka guitar instead of the standard Afrobeats guitar pattern?",
      warnings: ["The chucka pattern has been sampled and imitated so many times it is a cliche without context", "Do not copy Chic sample clearances: they are notoriously contentious"],
      fusionPaths: [],
      promptExports: [
        "Learn the Nile Rodgers guitar chucking technique (or synthesize it): short, muted, syncopated rhythm guitar on the upbeat. Build a disco or funk arrangement around it.",
        "Rodgers groove architecture applied to Afrobeats: what does an Afrobeats track sound like when the primary rhythmic element is a Rodgers-style chucka guitar instead of the standard Afrobeats guitar pattern?"
      ]
    },
    scores: {
      innovation: 9,
      influence: 10,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 9,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 8,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 8,
      undergroundImpact: 7,
      longevity: 9,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000041",
    batchId: "001",
    name: "Trevor Horn",
    realName: "Trevor Charles Horn",
    aliases: [],
    country: "United Kingdom",
    region: "London, England",
    activeYearsStart: 1976,

    primaryScenes: ["UK synthpop", "new wave", "ZTT Records", "ABC", "Frankie Goes to Hollywood"],
    genres: ["pop", "new-wave", "synthpop", "electronic"] as ProducerRecord["genres"],
    eras: ["tape-console", "midi-sampler"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "engineer-producer", "studio-producer"] as ProducerRecord["roles"],
    coreAngle: "Hyper-detailed pop production, studio maximalism, digital sheen",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Relentless production detail. Every bar of a Trevor Horn production contains more production information than most records contain in total. ZTT Records was a laboratory for maximalist pop.",
    artisticDna: "Horn treats a pop record as a total audio environment. His productions are designed to be listened to with headphones for years and still reveal new elements.",
    technicalDna: "Fairlight CMI (confirmed, iconic use with Video Killed the Radio Star), Mitsubishi 32-track digital recorder, SSL G Series console, Sarm Studios London, extensive overdubbing.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Add a detail to every bar that the listener will only notice after many listens. A counter-melody, a percussion element, a spatial movement. The production should reward long-term listening.",
      originalityTwist: "Horn maximalist-detail philosophy applied to a minimal aesthetic: what does a minimal trap record sound like when it contains Horn-level production detail hidden in the arrangement?",
      warnings: ["Relentless maximalism without quality control sounds cluttered: Horn productions work because every element is excellent", "Do not copy Relax or Owner of a Lonely Heart arrangements"],
      fusionPaths: [],
      promptExports: [
        "Add a detail to every bar that the listener will only notice after many listens. A counter-melody, a percussion element, a spatial movement. The production should reward long-term listening.",
        "Horn maximalist-detail philosophy applied to a minimal aesthetic: what does a minimal trap record sound like when it contains Horn-level production detail hidden in the arrangement?"
      ]
    },
    scores: {
      innovation: 9,
      influence: 8,
      technicalCraft: 10,
      sonicIdentity: 9,
      arrangementSkill: 9,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 8,
      soundDesign: 9,
      mixingAesthetics: 9,
      culturalImportance: 8,
      commercialImpact: 8,
      undergroundImpact: 7,
      longevity: 8,
      adaptability: 7,
      originality: 8
    }
  },
  {
    id: "PDNA-000042",
    batchId: "001",
    name: "Flood",
    realName: "Mark Ellis",
    aliases: [],
    country: "United Kingdom",
    region: "London, England",
    activeYearsStart: 1983,

    primaryScenes: ["industrial", "electronic rock", "alternative", "shoegaze"],
    genres: ["rock", "alternative", "electronic", "metal", "shoegaze"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["engineer-producer", "studio-producer"] as ProducerRecord["roles"],
    coreAngle: "Industrial space, texture-forward rock, atmospheric mixing",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Dense, layered rock productions with industrial texture: distorted guitars treated as atmospheric elements, space managed through density rather than reverb. Nine Inch Nails and U2 productions.",
    artisticDna: "Flood understands how to make a loud production feel spacious. His mixing creates the illusion of room and space through careful frequency management rather than reverb.",
    technicalDna: "Extensive analog and digital hybrid work, Nine Inch Nails collaboration (The Downward Spiral), U2 production work, Depeche Mode.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Layer three guitars playing the same part but with different distortion characters (clean, medium, heavy). Mix them so they feel like one instrument with texture depth.",
      originalityTwist: "Flood industrial texture philosophy applied to electronic dance music: what does a techno record sound like with Flood layered distortion approach on all the synths?",
      warnings: ["Industrial density requires very precise frequency management: without it, the mix becomes mud", "Do not use NIN productions as references without understanding the mixing architecture"],
      fusionPaths: [],
      promptExports: [
        "Layer three guitars playing the same part but with different distortion characters (clean, medium, heavy). Mix them so they feel like one instrument with texture depth.",
        "Flood industrial texture philosophy applied to electronic dance music: what does a techno record sound like with Flood layered distortion approach on all the synths?"
      ]
    },
    scores: {
      innovation: 8,
      influence: 7,
      technicalCraft: 9,
      sonicIdentity: 8,
      arrangementSkill: 8,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 7,
      commercialImpact: 6,
      undergroundImpact: 7,
      longevity: 7,
      adaptability: 7,
      originality: 7
    }
  },
  {
    id: "PDNA-000043",
    batchId: "001",
    name: "Nigel Godrich",
    realName: "Nigel Godrich",
    aliases: ["The Sixth Member of Radiohead"],
    country: "United Kingdom",
    region: "London, England",
    activeYearsStart: 1993,

    primaryScenes: ["Radiohead", "alternative rock", "experimental pop"],
    genres: ["alternative", "experimental", "rock", "electronic", "ambient"] as ProducerRecord["genres"],
    eras: ["daw"] as ProducerRecord["eras"],
    roles: ["engineer-producer", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Intimate abstraction, band texture, emotional digital-era space",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Productions that feel simultaneously intimate and vast. Radiohead records have a specific spatial quality: voices appear to be in the room with the listener while the instrumentation exists in a much larger, stranger space.",
    artisticDna: "Godrich understands how to make an experimental production feel emotionally accessible. Kid A and Amnesiac are deeply strange records that are also deeply moving.",
    technicalDna: "Pro Tools (confirmed), Neve and SSL consoles, collaboration with Radiohead experimental live approach, signal processing and pitch manipulation, tape and digital hybrid.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Place the vocal extremely close in the mix (minimal reverb, intimate). Create a completely separate acoustic environment for everything else: reverb, space, and distance that differs from the vocal.",
      originalityTwist: "Godrich intimate/vast spatial contrast applied to R&B: close vocal, vast electronic landscape behind it. Or apply to hip-hop: the rapper sounds like they are in your ear while the beat exists in a cathedral.",
      warnings: ["Do not replicate specific Radiohead production elements: the emotional architecture is specific to those songs", "The abstraction requires emotional intelligence to work: random experimentation does not produce it"],
      fusionPaths: [],
      promptExports: [
        "Place the vocal extremely close in the mix (minimal reverb, intimate). Create a completely separate acoustic environment for everything else: reverb, space, and distance that differs from the vocal.",
        "Godrich intimate/vast spatial contrast applied to R&B: close vocal, vast electronic landscape behind it. Or apply to hip-hop: the rapper sounds like they are in your ear while the beat exists in a cathedral."
      ]
    },
    scores: {
      innovation: 9,
      influence: 8,
      technicalCraft: 9,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 8,
      soundDesign: 8,
      mixingAesthetics: 9,
      culturalImportance: 8,
      commercialImpact: 6,
      undergroundImpact: 8,
      longevity: 7,
      adaptability: 8,
      originality: 9
    }
  },
  {
    id: "PDNA-000044",
    batchId: "001",
    name: "Steve Albini",
    realName: "Steve Albini",
    aliases: ["Electrical Audio"],
    country: "United States",
    region: "Chicago, Illinois",
    activeYearsStart: 1981,
    activeYearsEnd: 2024,
    primaryScenes: ["indie rock", "alternative", "post-punk", "noise rock"],
    genres: ["rock", "punk", "alternative", "noise", "indie"] as ProducerRecord["genres"],
    eras: ["midi-sampler", "daw"] as ProducerRecord["eras"],
    roles: ["engineer-producer", "studio-producer"] as ProducerRecord["roles"],
    coreAngle: "Raw room sound, anti-gloss recording, performance realism",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "A",
    signatureSoundSummary: "Albini refused the title producer: he was a recording engineer. His approach: capture the band playing in a room with minimal processing. The room sound IS the production. Pixies, PJ Harvey, Nirvana (In Utero).",
    artisticDna: "Albini philosophy was ethical as much as aesthetic: bands deserve to sound like themselves, not like a producer vision. His recordings prioritize the actual sound of the musicians in a real acoustic space.",
    technicalDna: "Electrical Audio Studios (built to his specifications), Neve consoles, minimal compression, close-miked drums with room microphones, analog tape (confirmed preference).",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Record the drum kit with a room microphone as the primary sound. The close mics support; the room defines. Do not compress the room microphone: let it breathe.",
      originalityTwist: "Albini raw-room recording philosophy applied to hip-hop: record a drum kit in a real room for a rap production. Combine the raw room sound with programmed elements.",
      warnings: ["Anti-gloss recording requires actually good musicians playing in a good acoustic space: digital imitation misses the point", "Do not copy specific Pixies, Nirvana, or PJ Harvey production sounds: they are defined by the actual room"],
      fusionPaths: [],
      promptExports: [
        "Record the drum kit with a room microphone as the primary sound. The close mics support; the room defines. Do not compress the room microphone: let it breathe.",
        "Albini raw-room recording philosophy applied to hip-hop: record a drum kit in a real room for a rap production. Combine the raw room sound with programmed elements."
      ]
    },
    scores: {
      innovation: 8,
      influence: 8,
      technicalCraft: 10,
      sonicIdentity: 7,
      arrangementSkill: 6,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 5,
      soundDesign: 7,
      mixingAesthetics: 9,
      culturalImportance: 8,
      commercialImpact: 4,
      undergroundImpact: 8,
      longevity: 8,
      adaptability: 5,
      originality: 7
    }
  },
  {
    id: "PDNA-000045",
    batchId: "001",
    name: "Linda Perry",
    realName: "Linda Joy Perry",
    aliases: [],
    country: "United States",
    region: "San Francisco / Los Angeles, California",
    activeYearsStart: 1988,

    primaryScenes: ["pop", "rock", "singer-songwriter production"],
    genres: ["pop", "rock", "rnb", "alternative"] as ProducerRecord["genres"],
    eras: ["daw"] as ProducerRecord["eras"],
    roles: ["producer-auteur", "vocal-producer", "composer-producer"] as ProducerRecord["roles"],
    coreAngle: "Song-first emotional production, vocal-centered arrangements",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Arranges and produces to serve the emotional content of the lyric. Productions are built around vocal performance rather than sonic concept. Beautiful (Christina Aguilera), Get the Party Started (Pink).",
    artisticDna: "Perry primary instrument is the song. Her productions are designed so that the arrangement supports and amplifies what the lyric says emotionally. Hooks are cathartic rather than merely catchy.",
    technicalDna: "Guitar-based songwriting approach, vocal coaching and performance direction, studio production with live instruments.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Write the lyric first. Ask: what does this lyric need sonically to feel true? Build the arrangement to answer that question.",
      originalityTwist: "Perry lyric-first production philosophy applied to a different genre: apply her emotional directness to a grime or drill track: where does the lyric take you emotionally and how does the production serve that?",
      warnings: ["Do not copy her specific chord progressions from Christina Aguilera or Pink productions", "Emotional directness without authentic lyrical content sounds manipulative"],
      fusionPaths: [],
      promptExports: [
        "Write the lyric first. Ask: what does this lyric need sonically to feel true? Build the arrangement to answer that question.",
        "Perry lyric-first production philosophy applied to a different genre: apply her emotional directness to a grime or drill track: where does the lyric take you emotionally and how does the production serve that?"
      ]
    },
    scores: {
      innovation: 7,
      influence: 7,
      technicalCraft: 7,
      sonicIdentity: 7,
      arrangementSkill: 7,
      rhythmDesign: 6,
      melodicHarmonicIdentity: 8,
      soundDesign: 6,
      mixingAesthetics: 7,
      culturalImportance: 7,
      commercialImpact: 7,
      undergroundImpact: 6,
      longevity: 7,
      adaptability: 7,
      originality: 7
    }
  },
  {
    id: "PDNA-000046",
    batchId: "001",
    name: "Tainy",
    realName: "Josue Ramon Figueroa Agosto",
    aliases: [],
    country: "Puerto Rico",
    region: "Puerto Rico",
    activeYearsStart: 2007,

    primaryScenes: ["reggaeton", "Latin pop", "Latin trap"],
    genres: ["reggaeton", "latin-pop", "pop", "dembow"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Futuristic reggaeton, sleek dembow evolution, melodic atmosphere",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Contemporary reggaeton with an electronic and melodic pop sophistication. The dembow rhythm is preserved but the surrounding texture is cinematic, moody, and future-facing. J Balvin and Bad Bunny collaborations.",
    artisticDna: "Tainy represents the evolution of reggaeton beyond its regional origins toward a global pop production standard. His productions work both as club records and as headphone listening experiences.",
    technicalDna: "FL Studio (reported), dembow rhythm programming, melodic synthesizer design, trap-pop hybrid arrangements, vocal production with Latin artists.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program a dembow rhythm pattern. Add an atmospheric synth pad in a minor key. The contrast between the rhythmic aggression and the melodic atmosphere is the tension.",
      originalityTwist: "Tainy melodic dembow logic applied to a different cultural context: what does an Afrobeats record sound like with a dembow rhythm grid? Or an Arabic-language pop record with dembow infrastructure?",
      warnings: ["The dembow rhythm is culturally specific: understand its origin before applying it", "Do not copy specific Bad Bunny or J Balvin production arrangements"],
      fusionPaths: [],
      promptExports: [
        "Program a dembow rhythm pattern. Add an atmospheric synth pad in a minor key. The contrast between the rhythmic aggression and the melodic atmosphere is the tension.",
        "Tainy melodic dembow logic applied to a different cultural context: what does an Afrobeats record sound like with a dembow rhythm grid? Or an Arabic-language pop record with dembow infrastructure?"
      ]
    },
    scores: {
      innovation: 7,
      influence: 8,
      technicalCraft: 8,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 7,
      commercialImpact: 8,
      undergroundImpact: 8,
      longevity: 6,
      adaptability: 8,
      originality: 7
    }
  },
  {
    id: "PDNA-000047",
    batchId: "001",
    name: "Luny Tunes",
    realName: "Juan Luis Morera Luna and Francisco Saldana",
    aliases: [],
    country: "Puerto Rico / Dominican Republic",
    region: "Puerto Rico",
    activeYearsStart: 1999,

    primaryScenes: ["reggaeton", "Puerto Rican club music"],
    genres: ["reggaeton", "dembow", "latin-pop"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Classic dembow architecture, club-reggaeton foundations",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "The foundational reggaeton production team behind the classic era (2002-2008). Their dembow patterns, synth stabs, and production architecture defined what reggaeton sounded like as it became a global phenomenon.",
    artisticDna: "Luny Tunes built the sonic infrastructure that made reggaeton exportable. Their productions balanced street credibility with radio accessibility. Daddy Yankee Gasolina, Tego Calderon: core catalog.",
    technicalDna: "FL Studio (reported), classic dembow pattern programming, synth stab programming, reggaeton production workflow.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program the dembow pattern correctly (two-bar cycle, kick on downbeat, rim or snare on specific offbeat positions). Add a synth stab on the upbeat. This is the reggaeton skeleton.",
      originalityTwist: "Classic Luny Tunes dembow architecture applied to a different melodic tradition: what does the classic reggaeton production structure sound like with cumbia melodies, or Nigerian afropop melodic content?",
      warnings: ["The dembow rhythm has specific historical context (rooted in Jamaican dancehall, evolved in Puerto Rico)", "Do not copy Gasolina instrumentation"],
      fusionPaths: [],
      promptExports: [
        "Program the dembow pattern correctly (two-bar cycle, kick on downbeat, rim or snare on specific offbeat positions). Add a synth stab on the upbeat. This is the reggaeton skeleton.",
        "Classic Luny Tunes dembow architecture applied to a different melodic tradition: what does the classic reggaeton production structure sound like with cumbia melodies, or Nigerian afropop melodic content?"
      ]
    },
    scores: {
      innovation: 8,
      influence: 8,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 7,
      melodicHarmonicIdentity: 6,
      soundDesign: 7,
      mixingAesthetics: 7,
      culturalImportance: 8,
      commercialImpact: 7,
      undergroundImpact: 8,
      longevity: 6,
      adaptability: 6,
      originality: 7
    }
  },
  {
    id: "PDNA-000048",
    batchId: "001",
    name: "Sarz",
    realName: "Osabuohien Osaretin",
    aliases: [],
    country: "Nigeria",
    region: "Lagos, Nigeria",
    activeYearsStart: 2008,

    primaryScenes: ["Afrobeats", "Nigerian pop", "Afropop"],
    genres: ["afrobeats", "pop", "rnb"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Clean rhythmic bounce, melodic restraint, Afropop polish",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "Polished Afrobeats productions with a clean, open rhythm section and careful melodic restraint. Where some Afrobeats producers maximize energy, Sarz creates space. Wizkid, Skepta, and WurlD collaborations.",
    artisticDna: "Sarz Afrobeats productions are defined by what they leave out. The groove is clear and open, the melody is purposeful rather than ornamental. His crossover appeal comes from this pop-accessible spaciousness.",
    technicalDna: "FL Studio (reported), Afrobeats rhythm programming, clean mixing approach, melodic restraint philosophy, Nigerian pop production standards.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program an Afrobeats rhythm with space. Leave the mid-range open for vocal melody. Add a single melodic element rather than filling the arrangement.",
      originalityTwist: "Sarz Afrobeats clarity applied to R&B: an Afrobeats-structured rhythm section under a contemporary R&B vocal production. The open space serves both genres.",
      warnings: ["Afrobeats rhythm is more complex than it appears: the percussion conversation requires understanding", "Do not reduce to Afrobeats template plus English vocals"],
      fusionPaths: [],
      promptExports: [
        "Program an Afrobeats rhythm with space. Leave the mid-range open for vocal melody. Add a single melodic element rather than filling the arrangement.",
        "Sarz Afrobeats clarity applied to R&B: an Afrobeats-structured rhythm section under a contemporary R&B vocal production. The open space serves both genres."
      ]
    },
    scores: {
      innovation: 7,
      influence: 7,
      technicalCraft: 7,
      sonicIdentity: 8,
      arrangementSkill: 7,
      rhythmDesign: 8,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 7,
      undergroundImpact: 8,
      longevity: 6,
      adaptability: 7,
      originality: 7
    }
  },
  {
    id: "PDNA-000049",
    batchId: "001",
    name: "Kabza De Small",
    realName: "Kabelo Motha",
    aliases: ["King of Amapiano"],
    country: "South Africa",
    region: "Mpumalanga / Pretoria, South Africa",
    activeYearsStart: 2016,

    primaryScenes: ["amapiano", "South African club music"],
    genres: ["amapiano", "house", "electronic"] as ProducerRecord["genres"],
    eras: ["daw", "streaming-social"] as ProducerRecord["eras"],
    roles: ["beatmaker", "dj-producer", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Log-drum language, hypnotic piano loops, long-form groove",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "C",
    signatureSoundSummary: "The log-drum (a specific synthesized percussion sound) as the rhythmic spine of amapiano. Long-form piano loops that evolve slowly over 6-8 minutes. The music rewards patience: energy builds incrementally.",
    artisticDna: "Kabza productions are meditative while being dancefloor-ready. The amapiano form requires trust in repetition: the DJ and producer both understand that the groove develops through time, not through accumulation of elements.",
    technicalDna: "FL Studio (confirmed), log-drum synthesis and programming, piano loop construction, long-form arrangement for DJ context, South African amapiano production standards.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Program a log-drum pattern. Add a piano loop that is eight bars long and evolves with subtle variation. Resist adding elements: let the loop breathe for longer than feels comfortable.",
      originalityTwist: "Kabza amapiano long-form logic applied to other contexts: amapiano production with Bollywood melodic content. Or amapiano rhythm structure with jazz piano vocabulary.",
      warnings: ["Amapiano emerged from specific South African township culture: understand the context before borrowing the form", "The log-drum sound has become widely imitated: understand the full genre before using the signature sound"],
      fusionPaths: [],
      promptExports: [
        "Program a log-drum pattern. Add a piano loop that is eight bars long and evolves with subtle variation. Resist adding elements: let the loop breathe for longer than feels comfortable.",
        "Kabza amapiano long-form logic applied to other contexts: amapiano production with Bollywood melodic content. Or amapiano rhythm structure with jazz piano vocabulary."
      ]
    },
    scores: {
      innovation: 8,
      influence: 8,
      technicalCraft: 7,
      sonicIdentity: 9,
      arrangementSkill: 7,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 7,
      mixingAesthetics: 8,
      culturalImportance: 8,
      commercialImpact: 6,
      undergroundImpact: 9,
      longevity: 6,
      adaptability: 7,
      originality: 8
    }
  },
  {
    id: "PDNA-000050",
    batchId: "001",
    name: "DJ Rashad",
    realName: "Rashad Dobbins",
    aliases: [],
    country: "United States",
    region: "Chicago, Illinois",
    activeYearsStart: 2000,
    activeYearsEnd: 2014,
    primaryScenes: ["footwork", "juke", "Chicago club music"],
    genres: ["footwork", "house", "electronic"] as ProducerRecord["genres"],
    eras: ["daw"] as ProducerRecord["eras"],
    roles: ["dj-producer", "beatmaker", "producer-auteur"] as ProducerRecord["roles"],
    coreAngle: "Hyperkinetic sampling, battle rhythm, emotional repetition at high speed",
    keyWorks: [],
    gearClaims: [],
    influencedBy: [],
    influenced: [],
    keyCollaborators: [],
    sourceNotes: ["Research pending. Verify against MusicBrainz, Discogs, Wikidata, official discographies."],
    overallConfidence: "B",
    signatureSoundSummary: "Footwork operates at 160 BPM with an unusual rhythmic grid derived from Chicago house and battle-DJ culture. Sample loops are chopped and repeated with a speed and intensity that creates trance-like states.",
    artisticDna: "DJ Rashad productions are simultaneously minimal and overwhelming. The tempo and density create a physical effect; the emotional content of the samples (often R&B and soul) creates a melancholic counterpoint to the kinetic energy.",
    technicalDna: "Ableton Live (confirmed), high BPM drum programming (160+ BPM), aggressive sample chopping and looping, juke/footwork rhythmic grid, DJ-battle-derived composition.",
    sonicDna: {
      atmosphere: "Tier D: audible analysis required",
      warmth: "Tier D: audible analysis required",
      grit: "Tier D: audible analysis required",
      polish: "Tier D: audible analysis required",
      darkness: "Tier D: audible analysis required",
      brightness: "Tier D: audible analysis required",
      density: "Tier D: audible analysis required",
      spaceUse: "Tier D: audible analysis required",
      syntheticOrganicBalance: "Tier D: audible analysis required"
    },
    rhythmicDna: {
      grooveFamily: "Tier D: audible analysis required",
      swingAmount: "variable",
      drumDensity: "variable",
      kickSnareProfile: "Tier D: audible analysis required",
      hiHatLanguage: "Tier D: audible analysis required",
      tempoRange: "Research pending",
      notes: "Full rhythmic DNA profile pending."
    },
    melodicHarmonicDna: {
      chordMood: "Tier D: audible analysis required",
      tonality: "Tier D: audible analysis required",
      keyInfluences: [],
      motifs: "Tier D: audible analysis required",
      dissonanceLevel: "variable",
      notes: "Full melodic/harmonic DNA profile pending."
    },
    arrangementDna: {
      introStyle: "Tier D: audible analysis required",
      loopEvolution: "Tier D: audible analysis required",
      momentDesign: "Tier D: audible analysis required",
      notes: "Full arrangement DNA profile pending."
    },
    mixingDna: {
      lowEnd: "Tier D: audible analysis required",
      stereoField: "Tier D: audible analysis required",
      vocalPlacement: "Tier D: audible analysis required",
      dynamicsApproach: "Tier D: audible analysis required",
      reverbDelay: "Tier D: audible analysis required",
      notes: "Full mixing DNA profile pending."
    },
    styleNuance: {
      casualListenersHear: "Analysis pending",
      producersHear: "Analysis pending",
      engineersHear: "Analysis pending",
      artistsFeel: "Analysis pending",
      beginnersMisunderstand: "Analysis pending"
    },
    creativeDirection: {
      typeBeatDirection: "Set BPM to 160. Sample an R&B vocal phrase. Chop it to a single syllable. Repeat it with different timing every two bars. Program a footwork-derived hi-hat and kick pattern underneath.",
      originalityTwist: "Rashad footwork energy applied to a different sample source: African music samples at footwork speed. Or UK garage vocal samples in the footwork grid.",
      warnings: ["Footwork is a Chicago-specific cultural form: understand its origin in house music and battle culture", "The emotional depth comes from the sample content: random samples produce empty energy"],
      fusionPaths: [],
      promptExports: [
        "Set BPM to 160. Sample an R&B vocal phrase. Chop it to a single syllable. Repeat it with different timing every two bars. Program a footwork-derived hi-hat and kick pattern underneath.",
        "Rashad footwork energy applied to a different sample source: African music samples at footwork speed. Or UK garage vocal samples in the footwork grid."
      ]
    },
    scores: {
      innovation: 9,
      influence: 9,
      technicalCraft: 8,
      sonicIdentity: 9,
      arrangementSkill: 8,
      rhythmDesign: 9,
      melodicHarmonicIdentity: 7,
      soundDesign: 8,
      mixingAesthetics: 8,
      culturalImportance: 9,
      commercialImpact: 5,
      undergroundImpact: 10,
      longevity: 7,
      adaptability: 7,
      originality: 9
    }
  }
];

// Store
interface ProducerStoreState {
  producers: Map<string, ProducerRecord>;
}

const globalStore = globalThis as typeof globalThis & {
  __producerStore?: ProducerStoreState;
};

const buildStore = (): ProducerStoreState => {
  const producers = new Map<string, ProducerRecord>();
  for (const p of BATCH_001) {
    producers.set(p.id, p);
  }
  return { producers };
};

const state: ProducerStoreState =
  globalStore.__producerStore ?? buildStore();
globalStore.__producerStore = state;

// Query helpers

const toSummary = (p: ProducerRecord): ProducerSummary => ({
  id: p.id,
  batchId: p.batchId,
  name: p.name,
  country: p.country,
  region: p.region,
  genres: p.genres,
  eras: p.eras,
  coreAngle: p.coreAngle,
  signatureSoundSummary: p.signatureSoundSummary,
  overallConfidence: p.overallConfidence,
  scores: p.scores
});

export const listProducers = (params?: ProducerSearchParams): ProducerSummary[] => {
  let results = [...state.producers.values()];

  if (params?.q) {
    const q = params.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.coreAngle.toLowerCase().includes(q) ||
        p.signatureSoundSummary.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)) ||
        p.primaryScenes.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (params?.genre) {
    results = results.filter((p) => p.genres.includes(params.genre!));
  }

  if (params?.era) {
    results = results.filter((p) => p.eras.includes(params.era!));
  }

  if (params?.region) {
    const r = params.region.toLowerCase();
    results = results.filter(
      (p) =>
        p.region.toLowerCase().includes(r) ||
        p.country.toLowerCase().includes(r)
    );
  }

  if (params?.batchId) {
    results = results.filter((p) => p.batchId === params.batchId);
  }

  if (params?.role) {
    results = results.filter((p) => p.roles.includes(params.role!));
  }

  return results.map(toSummary);
};

export const getProducer = (id: string): ProducerRecord | undefined =>
  state.producers.get(id);

export const getBatchStats = (): Record<string, number> => {
  const stats: Record<string, number> = {};
  for (const p of state.producers.values()) {
    stats[p.batchId] = (stats[p.batchId] ?? 0) + 1;
  }
  return stats;
};

export const SCORE_DIMENSIONS = [
  { key: "innovation", label: "Innovation" },
  { key: "influence", label: "Influence" },
  { key: "technicalCraft", label: "Technical Craft" },
  { key: "sonicIdentity", label: "Sonic Identity" },
  { key: "arrangementSkill", label: "Arrangement" },
  { key: "rhythmDesign", label: "Rhythm Design" },
  { key: "melodicHarmonicIdentity", label: "Melodic / Harmonic" },
  { key: "soundDesign", label: "Sound Design" },
  { key: "mixingAesthetics", label: "Mixing Aesthetics" },
  { key: "culturalImportance", label: "Cultural Importance" },
  { key: "commercialImpact", label: "Commercial Impact" },
  { key: "undergroundImpact", label: "Underground Impact" },
  { key: "longevity", label: "Longevity" },
  { key: "adaptability", label: "Adaptability" },
  { key: "originality", label: "Originality" }
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSIONS)[number]["key"];
