import type { Track } from './tracks'

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const LOOKAHEAD_S = 0.15
const TICK_MS = 25

/**
 * A small Web Audio synthesizer that plays {@link Track}s by scheduling
 * oscillators just ahead of the playhead. Supports play/pause/seek, volume,
 * an analyser node for visualisation, and an end-of-track callback.
 */
export class SynthEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null

  private track: Track | null = null
  private timer: number | null = null

  /** ctx.currentTime that corresponds to playhead position 0. */
  private startCtxTime = 0
  /** playhead position (seconds) captured when paused. */
  private pausedAt = 0
  private scheduledUntil = 0
  private playing = false
  private volume = 0.8

  onEnded: (() => void) | null = null

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = this.volume
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      master.connect(analyser)
      analyser.connect(ctx.destination)
      this.ctx = ctx
      this.master = master
      this.analyser = analyser
    }
    return this.ctx
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  load(track: Track) {
    this.stopTimer()
    this.track = track
    this.pausedAt = 0
    this.scheduledUntil = 0
    this.playing = false
  }

  get isPlaying(): boolean {
    return this.playing
  }

  get duration(): number {
    return this.track?.duration ?? 0
  }

  get position(): number {
    if (!this.track) return 0
    if (!this.playing || !this.ctx) return this.pausedAt
    return Math.min(this.ctx.currentTime - this.startCtxTime, this.track.duration)
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master) this.master.gain.value = v
  }

  getVolume(): number {
    return this.volume
  }

  async play() {
    if (!this.track) return
    const ctx = this.ensureCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    this.startCtxTime = ctx.currentTime - this.pausedAt
    this.scheduledUntil = this.pausedAt
    this.playing = true
    this.startTimer()
  }

  pause() {
    if (!this.playing) return
    this.pausedAt = this.position
    this.playing = false
    this.stopTimer()
  }

  toggle() {
    if (this.playing) this.pause()
    else void this.play()
  }

  seek(seconds: number) {
    if (!this.track) return
    const clamped = Math.max(0, Math.min(seconds, this.track.duration))
    this.pausedAt = clamped
    if (this.playing && this.ctx) {
      this.startCtxTime = this.ctx.currentTime - clamped
      this.scheduledUntil = clamped
    }
  }

  private startTimer() {
    if (this.timer != null) return
    this.timer = window.setInterval(() => this.tick(), TICK_MS)
  }

  private stopTimer() {
    if (this.timer != null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  private tick() {
    if (!this.ctx || !this.track || !this.playing) return
    const pos = this.position

    if (pos >= this.track.duration) {
      this.pause()
      this.pausedAt = 0
      this.onEnded?.()
      return
    }

    const windowEnd = pos + LOOKAHEAD_S
    for (const note of this.track.notes) {
      if (note.time >= this.scheduledUntil && note.time < windowEnd) {
        this.scheduleNote(note)
      }
    }
    this.scheduledUntil = windowEnd
  }

  private scheduleNote(note: { time: number; dur: number; midi: number; gain?: number; type?: OscillatorType }) {
    if (!this.ctx || !this.master) return
    const when = Math.max(this.ctx.currentTime, this.startCtxTime + note.time)
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    const peak = note.gain ?? 0.3

    osc.type = note.type ?? 'sine'
    osc.frequency.value = midiToFreq(note.midi)

    // Simple attack/decay envelope to avoid clicks.
    env.gain.setValueAtTime(0.0001, when)
    env.gain.exponentialRampToValueAtTime(peak, when + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, when + note.dur)

    osc.connect(env)
    env.connect(this.master)
    osc.start(when)
    osc.stop(when + note.dur + 0.02)
  }
}
