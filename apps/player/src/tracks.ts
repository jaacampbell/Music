export type Note = {
  /** Start time in seconds from the beginning of the track. */
  time: number
  /** Duration in seconds. */
  dur: number
  /** MIDI note number. */
  midi: number
  /** Relative loudness (0..1). */
  gain?: number
  type?: OscillatorType
}

export type TrackKind = 'synth' | 'local' | 'cloud'

export type Track = {
  id: string
  title: string
  artist: string
  bpm?: number
  accent: [string, string]
  duration: number
  kind: TrackKind
  notes: Note[]
  sourceUrl?: string
  fileName?: string
  createdAt?: number
  songKey?: string
  versionLabel?: string
  artworkUrl?: string
  projectId?: string
  versionId?: string
  storagePath?: string
  cloudFavorite?: boolean
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
  accent: [string, string]
  progression: ChordSpec[]
  repeats: number
  melodyRoot: number
  type?: OscillatorType
}

function buildTrack(config: BuildConfig): Track {
  const beat = 60 / config.bpm
  const notes: Note[] = []
  let time = 0

  for (let repeat = 0; repeat < config.repeats; repeat += 1) {
    for (const chord of config.progression) {
      const barStart = time
      const tones = chordNotes(chord)

      notes.push({ time: barStart, dur: beat * 1.8, midi: chord.root - 12, gain: 0.5, type: 'triangle' })
      notes.push({ time: barStart + beat * 2, dur: beat * 1.8, midi: chord.root - 12, gain: 0.45, type: 'triangle' })

      for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
        notes.push({
          time: barStart + beatIndex * beat,
          dur: beat * 0.9,
          midi: tones[beatIndex % tones.length],
          gain: 0.22,
          type: 'sine',
        })
      }

      for (let noteIndex = 0; noteIndex < 8; noteIndex += 1) {
        const step = (repeat * 3 + noteIndex) % SCALE_MAJOR.length
        notes.push({
          time: barStart + noteIndex * (beat / 2),
          dur: beat * 0.4,
          midi: config.melodyRoot + SCALE_MAJOR[step] + (noteIndex % 4 === 3 ? 12 : 0),
          gain: 0.3,
          type: config.type ?? 'square',
        })
      }

      time += beat * 4
    }
  }

  return {
    id: config.id,
    title: config.title,
    artist: config.artist,
    bpm: config.bpm,
    accent: config.accent,
    notes,
    duration: time,
    kind: 'synth',
  }
}

/** Built-in demos keep the player immediately testable before real audio is imported. */
export const DEMO_TRACKS: Track[] = [
  buildTrack({
    id: 'demo-night-transit',
    title: 'Night Transit',
    artist: 'JOCYN LABS',
    bpm: 110,
    accent: ['#b7d52b', '#28330a'],
    melodyRoot: 72,
    progression: [
      { root: 60, quality: 'maj' },
      { root: 67, quality: 'maj' },
      { root: 69, quality: 'min' },
      { root: 65, quality: 'maj' },
    ],
    repeats: 2,
  }),
  buildTrack({
    id: 'demo-after-hours',
    title: 'After Hours Draft',
    artist: 'JOCYN LABS',
    bpm: 96,
    accent: ['#c56036', '#34170d'],
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
    id: 'demo-distant-water',
    title: 'Distant Water',
    artist: 'JOCYN LABS',
    bpm: 84,
    accent: ['#4f8da8', '#102c39'],
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
]

export const IMPORT_ACCENTS: Array<[string, string]> = [
  ['#b7d52b', '#28330a'],
  ['#d1794b', '#3d1b10'],
  ['#7e75d6', '#211d4b'],
  ['#4fa0a6', '#102e31'],
  ['#d3b56b', '#382e12'],
]
