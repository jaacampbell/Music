import { useCallback, useEffect, useRef, useState } from 'react'
import { tracks, type Track } from '../data/tracks'

export interface AudioEngine {
  tracks: Track[]
  currentIndex: number
  currentTrack: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  analyser: AnalyserNode | null
  toggle: () => void
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  select: (index: number) => void
  seek: (seconds: number) => void
  setVolume: (value: number) => void
}

interface Voices {
  oscillators: OscillatorNode[]
  lfo: OscillatorNode
  filter: BiquadFilterNode
  gain: GainNode
}

/**
 * A tiny in-browser synth + transport. Each track is rendered as a slowly
 * evolving chord using the Web Audio API, so playback is fully self-contained
 * (no audio files or network needed) while still producing real sound and
 * real analyser data for the visualizer.
 */
export function useAudioEngine(): AudioEngine {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const voicesRef = useRef<Voices | null>(null)

  // Transport clock. `offset` is elapsed time captured at the last pause/seek;
  // `startedAt` is the AudioContext time when the current play segment began.
  const offsetRef = useRef(0)
  const startedAtRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const volumeRef = useRef(volume)
  const indexRef = useRef(currentIndex)

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    indexRef.current = currentIndex
  }, [currentIndex])

  const currentTrack = tracks[currentIndex]

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0
    const an = ctx.createAnalyser()
    an.fftSize = 256
    an.smoothingTimeConstant = 0.8
    master.connect(an)
    an.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master
    analyserRef.current = an
    setAnalyser(an)
    return ctx
  }, [])

  const teardownVoices = useCallback(() => {
    const voices = voicesRef.current
    if (!voices) return
    try {
      voices.oscillators.forEach((osc) => osc.stop())
      voices.lfo.stop()
    } catch {
      // already stopped
    }
    voices.oscillators.forEach((osc) => osc.disconnect())
    voices.lfo.disconnect()
    voices.filter.disconnect()
    voices.gain.disconnect()
    voicesRef.current = null
  }, [])

  const buildVoices = useCallback((track: Track) => {
    const ctx = ctxRef.current!
    const master = masterRef.current!

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 6

    const gain = ctx.createGain()
    gain.gain.value = 0.18

    filter.connect(gain)
    gain.connect(master)

    // Slow filter sweep so the texture keeps moving.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 500
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    const oscillators = track.notes.map((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'sawtooth' : 'sine'
      osc.frequency.value = freq
      osc.detune.value = (i - 1) * 4
      osc.connect(filter)
      osc.start()
      return osc
    })

    voicesRef.current = { oscillators, lfo, filter, gain }
  }, [])

  const applyMasterGain = useCallback((playing: boolean) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    const target = playing ? volumeRef.current : 0
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.05)
  }, [])

  const stopClock = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    const ctx = ensureContext()
    void ctx.resume()
    if (!voicesRef.current) buildVoices(currentTrack)
    startedAtRef.current = ctx.currentTime
    applyMasterGain(true)
    setIsPlaying(true)
  }, [applyMasterGain, buildVoices, currentTrack, ensureContext])

  const pause = useCallback(() => {
    const ctx = ctxRef.current
    if (ctx) offsetRef.current += ctx.currentTime - startedAtRef.current
    applyMasterGain(false)
    setIsPlaying(false)
  }, [applyMasterGain])

  const changeTrack = useCallback(
    (index: number, autoplay: boolean) => {
      teardownVoices()
      offsetRef.current = 0
      setCurrentTime(0)
      setCurrentIndex(index)
      if (autoplay) {
        const ctx = ensureContext()
        void ctx.resume()
        buildVoices(tracks[index])
        startedAtRef.current = ctx.currentTime
        applyMasterGain(true)
        setIsPlaying(true)
      } else {
        applyMasterGain(false)
        setIsPlaying(false)
      }
    },
    [applyMasterGain, buildVoices, ensureContext, teardownVoices],
  )

  const next = useCallback(() => {
    changeTrack((indexRef.current + 1) % tracks.length, true)
  }, [changeTrack])

  const prev = useCallback(() => {
    changeTrack((indexRef.current - 1 + tracks.length) % tracks.length, true)
  }, [changeTrack])

  const select = useCallback(
    (index: number) => {
      if (index === indexRef.current) {
        if (isPlaying) pause()
        else play()
        return
      }
      changeTrack(index, true)
    },
    [changeTrack, isPlaying, pause, play],
  )

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, currentTrack.duration))
      offsetRef.current = clamped
      setCurrentTime(clamped)
      const ctx = ctxRef.current
      if (ctx) startedAtRef.current = ctx.currentTime
    },
    [currentTrack.duration],
  )

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(value, 1))
      setVolumeState(clamped)
      const ctx = ctxRef.current
      const master = masterRef.current
      if (ctx && master && isPlaying) {
        master.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05)
      }
    },
    [isPlaying],
  )

  // Transport clock: advance currentTime while playing and auto-advance tracks.
  useEffect(() => {
    if (!isPlaying) {
      stopClock()
      return
    }
    const tick = () => {
      const ctx = ctxRef.current
      if (ctx) {
        const elapsed = offsetRef.current + (ctx.currentTime - startedAtRef.current)
        if (elapsed >= currentTrack.duration) {
          next()
          return
        }
        setCurrentTime(elapsed)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return stopClock
  }, [isPlaying, currentTrack.duration, next, stopClock])

  // Close the audio context on unmount.
  useEffect(() => {
    return () => {
      stopClock()
      teardownVoices()
      void ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [stopClock, teardownVoices])

  return {
    tracks,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration: currentTrack.duration,
    volume,
    analyser,
    toggle,
    play,
    pause,
    next,
    prev,
    select,
    seek,
    setVolume,
  }
}
