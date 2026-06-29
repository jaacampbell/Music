export type Note = {
  /** start time in seconds from the beginning of the track */
  time: number
  /** duration in seconds */
  dur: number
  /** MIDI note number */
  midi: number
  /** relative loudness (0..1) */
  gain?: number
  type?: OscillatorType
}

export type Track = {
  id: string
  title: string
  artist: string
  bpm: number
  /** two-stop gradient used for the artwork */
  gradient: [string, string]
  notes: Note[]
  duration: number
}

const SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11]

type ChordSpec = { root: number; quality: 'maj' | 'min' }

function chordNotes({ root, quality }: ChordSpec): number[] {
  const third = quality === 'maj' ? 4 : 3
  return [root, root + third, root + 7]
}

type BuildConfig = {
  id: string
  title: string
  artist: string
  bpm: number
  gradient: [string, string]
  /** chord roots (MIDI) and qualities, one per bar */
  progression: ChordSpec[]
  /** how many times to repeat the progression */
  repeats: number
  /** scale root used for the melody (MIDI) */
  melodyRoot: number
  type?: OscillatorType
}

/**
 * Programmatically composes a short, pleasant looping track from a chord
 * progression. Each bar gets a bass note, an arpeggiated chord pad, and a
 * melody line drawn from the major scale. This keeps the app fully
 * self-contained (no audio assets) while producing genuinely musical output.
 */
function buildTrack(cfg: BuildConfig): Track {
  const beat = 60 / cfg.bpm
  const beatsPerBar = 4
  const notes: Note[] = []
  let t = 0

  for (let r = 0; r < cfg.repeats; r++) {
    for (const chord of cfg.progression) {
      const barStart = t
      const tones = chordNotes(chord)

      // Bass: root, one octave down, on beats 1 and 3.
      notes.push({ time: barStart, dur: beat * 1.8, midi: chord.root - 12, gain: 0.5, type: 'triangle' })
      notes.push({ time: barStart + beat * 2, dur: beat * 1.8, midi: chord.root - 12, gain: 0.45, type: 'triangle' })

      // Pad: arpeggiate the chord across the bar.
      for (let i = 0; i < beatsPerBar; i++) {
        const tone = tones[i % tones.length]
        notes.push({
          time: barStart + i * beat,
          dur: beat * 0.9,
          midi: tone,
          gain: 0.22,
          type: 'sine',
        })
      }

      // Melody: two notes per beat from the scale, gently rising/falling.
      for (let i = 0; i < beatsPerBar * 2; i++) {
        const step = (r * 3 + i) % SCALE_MAJOR.length
        const octave = i % 4 === 3 ? 12 : 0
        notes.push({
          time: barStart + i * (beat / 2),
          dur: beat * 0.4,
          midi: cfg.melodyRoot + SCALE_MAJOR[step] + octave,
          gain: 0.3,
          type: cfg.type ?? 'square',
        })
      }

      t += beat * beatsPerBar
    }
  }

  return {
    id: cfg.id,
    title: cfg.title,
    artist: cfg.artist,
    bpm: cfg.bpm,
    gradient: cfg.gradient,
    notes,
    duration: t,
  }
}

export const TRACKS: Track[] = [
  buildTrack({
    id: 'neon-sunrise',
    title: 'Neon Sunrise',
    artist: 'Aurora Synth',
    bpm: 110,
    gradient: ['#ff7e5f', '#feb47b'],
    melodyRoot: 72,
    progression: [
      { root: 60, quality: 'maj' },
      { root: 67, quality: 'maj' },
      { root: 69, quality: 'min' },
      { root: 65, quality: 'maj' },
    ],
    repeats: 2,
    type: 'square',
  }),
  buildTrack({
    id: 'midnight-drive',
    title: 'Midnight Drive',
    artist: 'The Nightowls',
    bpm: 96,
    gradient: ['#654ea3', '#43c6ac'],
    melodyRoot: 69,
    progression: [
      { root: 57, quality: 'min' },
      { root: 64, quality: 'min' },
      { root: 62, quality: 'maj' },
      { root: 59, quality: 'min' },
    ],
    repeats: 2,
    type: 'sawtooth',
  }),
  buildTrack({
    id: 'ocean-bloom',
    title: 'Ocean Bloom',
    artist: 'Tidal Keys',
    bpm: 84,
    gradient: ['#2193b0', '#6dd5ed'],
    melodyRoot: 74,
    progression: [
      { root: 62, quality: 'maj' },
      { root: 69, quality: 'min' },
      { root: 67, quality: 'maj' },
      { root: 64, quality: 'min' },
    ],
    repeats: 2,
    type: 'triangle',
  }),
  buildTrack({
    id: 'pixel-parade',
    title: 'Pixel Parade',
    artist: 'Chip Theory',
    bpm: 128,
    gradient: ['#ee0979', '#ff6a00'],
    melodyRoot: 76,
    progression: [
      { root: 64, quality: 'maj' },
      { root: 60, quality: 'maj' },
      { root: 67, quality: 'maj' },
      { root: 62, quality: 'min' },
    ],
    repeats: 2,
    type: 'square',
  }),
]
