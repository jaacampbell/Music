import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { TRACKS, type Track } from './tracks'
import { SynthEngine } from './synth'

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function Artwork({ track, size }: { track: Track; size: number }) {
  return (
    <div
      className="artwork"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${track.gradient[0]}, ${track.gradient[1]})`,
      }}
      aria-hidden
    >
      <span className="artwork__note">♪</span>
    </div>
  )
}

function Visualizer({ analyser, playing }: { analyser: AnalyserNode | null; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      if (!analyser || !data || !playing) return
      analyser.getByteFrequencyData(data)
      const bars = data.length
      const gap = 2
      const barWidth = (width - gap * (bars - 1)) / bars
      for (let i = 0; i < bars; i++) {
        const v = data[i] / 255
        const h = Math.max(2, v * height)
        const x = i * (barWidth + gap)
        const grad = ctx.createLinearGradient(0, height, 0, height - h)
        grad.addColorStop(0, '#6d5dfc')
        grad.addColorStop(1, '#42c6ff')
        ctx.fillStyle = grad
        ctx.fillRect(x, height - h, barWidth, h)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [analyser, playing])

  return <canvas ref={canvasRef} className="visualizer" width={520} height={96} />
}

export default function App() {
  const engineRef = useRef<SynthEngine | null>(null)
  if (!engineRef.current) engineRef.current = new SynthEngine()
  const engine = engineRef.current

  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  // Mirrors `currentIndex` so navigation/auto-advance always read the latest
  // value synchronously, even across rapid clicks before React re-renders.
  const currentIndexRef = useRef(0)

  const current = TRACKS[currentIndex]

  // Load the initial track once. Subsequent track changes are handled
  // imperatively in `playIndex` to avoid racing with playback start.
  useEffect(() => {
    engine.load(TRACKS[0])
  }, [engine])

  const playIndex = useCallback(
    async (index: number) => {
      const next = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length
      if (next !== currentIndexRef.current) {
        currentIndexRef.current = next
        setCurrentIndex(next)
        engine.load(TRACKS[next])
        setPosition(0)
      }
      await engine.play()
      setAnalyser(engine.getAnalyser())
      setPlaying(true)
    },
    [engine],
  )

  useEffect(() => {
    engine.onEnded = () => {
      void playIndex(currentIndexRef.current + 1)
    }
    return () => {
      engine.onEnded = null
    }
  }, [engine, playIndex])

  // Poll the engine for playhead position while it renders audio.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      setPosition(engine.position)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [engine, playing])

  const togglePlay = useCallback(async () => {
    if (engine.isPlaying) {
      engine.pause()
      setPlaying(false)
    } else {
      await engine.play()
      setAnalyser(engine.getAnalyser())
      setPlaying(true)
    }
  }, [engine])

  const onSeek = (value: number) => {
    engine.seek(value)
    setPosition(value)
  }

  const onVolume = (value: number) => {
    engine.setVolume(value)
    setVolume(value)
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="logo">♫</div>
        <div>
          <h1>Music</h1>
          <p className="tagline">A tiny synth-powered player</p>
        </div>
      </header>

      <main className="content">
        <section className="playlist" aria-label="Tracks">
          {TRACKS.map((track, i) => {
            const isCurrent = i === currentIndex
            return (
              <button
                key={track.id}
                className={`track ${isCurrent ? 'track--active' : ''}`}
                onClick={() => void playIndex(i)}
              >
                <Artwork track={track} size={56} />
                <span className="track__meta">
                  <span className="track__title">{track.title}</span>
                  <span className="track__artist">{track.artist}</span>
                </span>
                <span className="track__bpm">{track.bpm} BPM</span>
                <span className="track__state">
                  {isCurrent && playing ? '▶' : isCurrent ? '❚❚' : ''}
                </span>
              </button>
            )
          })}
        </section>

        <section className="stage">
          <Artwork track={current} size={220} />
          <h2 className="stage__title">{current.title}</h2>
          <p className="stage__artist">{current.artist}</p>
          <Visualizer analyser={analyser} playing={playing} />
        </section>
      </main>

      <footer className="player">
        <div className="player__info">
          <Artwork track={current} size={48} />
          <div className="player__text">
            <span className="player__title">{current.title}</span>
            <span className="player__artist">{current.artist}</span>
          </div>
        </div>

        <div className="player__center">
          <div className="player__buttons">
            <button className="ctrl" aria-label="Previous" onClick={() => void playIndex(currentIndexRef.current - 1)}>
              ⏮
            </button>
            <button className="ctrl ctrl--primary" aria-label={playing ? 'Pause' : 'Play'} onClick={() => void togglePlay()}>
              {playing ? '❚❚' : '▶'}
            </button>
            <button className="ctrl" aria-label="Next" onClick={() => void playIndex(currentIndexRef.current + 1)}>
              ⏭
            </button>
          </div>
          <div className="seek">
            <span className="seek__time">{formatTime(position)}</span>
            <input
              className="seek__bar"
              type="range"
              min={0}
              max={current.duration}
              step={0.05}
              value={position}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
            />
            <span className="seek__time">{formatTime(current.duration)}</span>
          </div>
        </div>

        <div className="player__volume">
          <span aria-hidden>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </footer>
    </div>
  )
}
