export interface Track {
  id: string
  title: string
  artist: string
  /** Track length in seconds. */
  duration: number
  /** Two-color gradient used for the album art. */
  gradient: [string, string]
  /** Chord (frequencies in Hz) synthesized while this track plays. */
  notes: number[]
}

// Self-contained demo catalogue. Audio is synthesized in the browser with the
// Web Audio API (see useAudioEngine), so no external audio files are required.
export const tracks: Track[] = [
  {
    id: 'midnight-drive',
    title: 'Midnight Drive',
    artist: 'Neon Coast',
    duration: 41,
    gradient: ['#7c5cff', '#22d3ee'],
    notes: [220.0, 277.18, 329.63],
  },
  {
    id: 'sunrise-circuit',
    title: 'Sunrise Circuit',
    artist: 'Aurora Lin',
    duration: 33,
    gradient: ['#f97316', '#ef4444'],
    notes: [261.63, 329.63, 392.0],
  },
  {
    id: 'deep-current',
    title: 'Deep Current',
    artist: 'Tidal Bloom',
    duration: 47,
    gradient: ['#06b6d4', '#3b82f6'],
    notes: [196.0, 246.94, 293.66],
  },
  {
    id: 'paper-lanterns',
    title: 'Paper Lanterns',
    artist: 'Hana & The Glow',
    duration: 38,
    gradient: ['#ec4899', '#8b5cf6'],
    notes: [293.66, 369.99, 440.0],
  },
  {
    id: 'glass-garden',
    title: 'Glass Garden',
    artist: 'Verdant',
    duration: 52,
    gradient: ['#22c55e', '#14b8a6'],
    notes: [246.94, 311.13, 369.99],
  },
]
