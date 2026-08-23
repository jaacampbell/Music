import type { Note, Track } from './tracks'

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const LOOKAHEAD_SECONDS = 0.15
const TICK_MILLISECONDS = 25

/**
 * One playback engine for real browser audio and the built-in synth demos.
 * Both paths share transport, gain, visualizer analysis, and end handling.
 */
export class PlaybackEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private media: HTMLAudioElement | null = null
  private mediaSource: MediaElementAudioSourceNode | null = null
  private activeOscillators = new Set<OscillatorNode>()

  private track: Track | null = null
  private timer: number | null = null
  private startContextTime = 0
  private pausedAt = 0
  private scheduledUntil = 0
  private playing = false
  private volume = 0.8
  private endedHandler: (() => void) | null = null

  private ensureGraph(): AudioContext {
    if (!this.context) {
      const context = new AudioContext()
      const master = context.createGain()
      const analyser = context.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.72
      master.gain.value = this.volume
      master.connect(analyser)
      analyser.connect(context.destination)
      this.context = context
      this.master = master
      this.analyser = analyser
    }
    return this.context
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  setEndedHandler(handler: (() => void) | null) {
    this.endedHandler = handler
  }

  load(track: Track) {
    this.stopCurrentPlayback()
    this.track = track
    this.pausedAt = 0
    this.scheduledUntil = 0

    if (track.kind !== 'synth' && track.sourceUrl) {
      const media = new Audio(track.sourceUrl)
      media.preload = 'metadata'
      media.crossOrigin = 'anonymous'
      media.onended = () => {
        this.playing = false
        this.pausedAt = 0
        this.endedHandler?.()
      }
      this.media = media
    }
  }

  get isPlaying(): boolean {
    return this.playing
  }

  get duration(): number {
    if (this.media && Number.isFinite(this.media.duration)) return this.media.duration
    return this.track?.duration ?? 0
  }

  get position(): number {
    if (this.media) return Number.isFinite(this.media.currentTime) ? this.media.currentTime : 0
    if (!this.track) return 0
    if (!this.playing || !this.context) return this.pausedAt
    return Math.min(this.context.currentTime - this.startContextTime, this.track.duration)
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.master) this.master.gain.value = this.volume
  }

  async play() {
    if (!this.track) return
    const context = this.ensureGraph()
    if (context.state === 'suspended') await context.resume()

    if (this.media) {
      if (!this.mediaSource) {
        this.mediaSource = context.createMediaElementSource(this.media)
        this.mediaSource.connect(this.master!)
      }
      this.media.currentTime = Math.min(this.pausedAt, this.duration || this.pausedAt)
      await this.media.play()
      this.playing = true
      return
    }

    this.startContextTime = context.currentTime - this.pausedAt
    this.scheduledUntil = this.pausedAt
    this.playing = true
    this.startTimer()
  }

  pause() {
    if (!this.playing) return
    if (this.media) {
      this.media.pause()
      this.pausedAt = this.media.currentTime
    } else {
      this.pausedAt = this.position
      this.stopTimer()
      this.stopOscillators()
    }
    this.playing = false
  }

  seek(seconds: number) {
    if (!this.track) return
    const clamped = Math.max(0, Math.min(seconds, this.duration))
    this.pausedAt = clamped

    if (this.media) {
      this.media.currentTime = clamped
      return
    }

    this.stopOscillators()
    if (this.playing && this.context) {
      this.startContextTime = this.context.currentTime - clamped
      this.scheduledUntil = clamped
    }
  }

  destroy() {
    this.stopCurrentPlayback()
    if (this.context) void this.context.close()
    this.context = null
    this.master = null
    this.analyser = null
  }

  private stopCurrentPlayback() {
    this.stopTimer()
    this.stopOscillators()
    if (this.media) {
      this.media.pause()
      this.media.onended = null
      this.media.removeAttribute('src')
      this.media.load()
    }
    if (this.mediaSource) this.mediaSource.disconnect()
    this.media = null
    this.mediaSource = null
    this.playing = false
  }

  private startTimer() {
    if (this.timer !== null) return
    this.timer = window.setInterval(() => this.tick(), TICK_MILLISECONDS)
  }

  private stopTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  private stopOscillators() {
    for (const oscillator of this.activeOscillators) {
      try {
        oscillator.stop()
      } catch {
        // A node may already have completed between the set iteration and stop.
      }
    }
    this.activeOscillators.clear()
  }

  private tick() {
    if (!this.context || !this.track || !this.playing || this.track.kind !== 'synth') return
    const position = this.position

    if (position >= this.track.duration) {
      this.playing = false
      this.pausedAt = 0
      this.stopTimer()
      this.stopOscillators()
      this.endedHandler?.()
      return
    }

    const windowEnd = position + LOOKAHEAD_SECONDS
    for (const note of this.track.notes) {
      if (note.time >= this.scheduledUntil && note.time < windowEnd) this.scheduleNote(note)
    }
    this.scheduledUntil = windowEnd
  }

  private scheduleNote(note: Note) {
    if (!this.context || !this.master) return
    const when = Math.max(this.context.currentTime, this.startContextTime + note.time)
    const oscillator = this.context.createOscillator()
    const envelope = this.context.createGain()
    const peak = note.gain ?? 0.3

    oscillator.type = note.type ?? 'sine'
    oscillator.frequency.value = midiToFrequency(note.midi)
    envelope.gain.setValueAtTime(0.0001, when)
    envelope.gain.exponentialRampToValueAtTime(peak, when + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + note.dur)
    oscillator.connect(envelope)
    envelope.connect(this.master)
    oscillator.onended = () => this.activeOscillators.delete(oscillator)
    this.activeOscillators.add(oscillator)
    oscillator.start(when)
    oscillator.stop(when + note.dur + 0.02)
  }
}
