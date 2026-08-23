import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, DragEvent } from 'react'
import './App.css'
import { deleteImportedTrack, importAudioFile, loadImportedTracks } from './library'
import { PlaybackEngine } from './synth'
import { DEMO_TRACKS, type Track } from './tracks'

type LibraryScope = 'all' | 'local' | 'favorites'
type RepeatMode = 'off' | 'all' | 'one'

const FAVORITES_KEY = 'jocyn-player-favorites'
const VOLUME_KEY = 'jocyn-player-volume'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${(total % 60).toString().padStart(2, '0')}`
}

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function readVolume(): number {
  if (typeof window === 'undefined') return 0.8
  const stored = Number(localStorage.getItem(VOLUME_KEY))
  return Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 0.8
}

function Artwork({ track, size = 'large' }: { track: Track; size?: 'small' | 'large' }) {
  const style = {
    '--accent': track.accent[0],
    '--accent-deep': track.accent[1],
  } as CSSProperties

  return (
    <div className={`artwork artwork--${size}`} style={style} aria-hidden="true">
      <span className="artwork__edition">{track.kind === 'local' ? 'MASTER' : 'LAB'}</span>
      <span className="artwork__mark">J₵</span>
      <span className="artwork__rule" />
      <span className="artwork__name">{track.title}</span>
    </div>
  )
}

function Visualizer({ analyser, playing }: { analyser: AnalyserNode | null; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyserRef = useRef(analyser)
  const playingRef = useRef(playing)

  useEffect(() => {
    analyserRef.current = analyser
  }, [analyser])

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let animationFrame = 0
    let frequencyData: Uint8Array<ArrayBuffer> | null = null

    const draw = () => {
      animationFrame = requestAnimationFrame(draw)
      const activeAnalyser = analyserRef.current
      if (activeAnalyser && (!frequencyData || frequencyData.length !== activeAnalyser.frequencyBinCount)) {
        frequencyData = new Uint8Array(activeAnalyser.frequencyBinCount)
      }

      context.clearRect(0, 0, canvas.width, canvas.height)
      if (activeAnalyser && frequencyData && playingRef.current) activeAnalyser.getByteFrequencyData(frequencyData)

      const bars = 32
      const gap = 5
      const barWidth = (canvas.width - gap * (bars - 1)) / bars
      for (let index = 0; index < bars; index += 1) {
        const sampledIndex = frequencyData ? Math.floor((index / bars) * frequencyData.length) : index
        const frequency = playingRef.current && frequencyData ? frequencyData[sampledIndex] / 255 : 0
        const restingHeight = 5 + 8 * Math.abs(Math.sin(index * 0.72))
        const height = playingRef.current ? Math.max(4, frequency * canvas.height * 0.92) : restingHeight
        context.fillStyle = index % 5 === 0 ? '#b7d52b' : 'rgba(238, 235, 224, 0.52)'
        context.fillRect(index * (barWidth + gap), canvas.height - height, barWidth, height)
      }
    }

    draw()
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return <canvas ref={canvasRef} className="visualizer" width={640} height={92} aria-label="Live audio visualizer" />
}

export default function App() {
  const [engine] = useState(() => new PlaybackEngine())
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS)
  const [currentId, setCurrentId] = useState(DEMO_TRACKS[0].id)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [volume, setVolumeState] = useState(readVolume)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [favorites, setFavorites] = useState<string[]>(readFavorites)
  const [scope, setScope] = useState<LibraryScope>('all')
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [shuffle, setShuffle] = useState(false)
  const [query, setQuery] = useState('')
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastAudibleVolume = useRef(volume || 0.8)
  const tracksRef = useRef(tracks)
  const currentIdRef = useRef(currentId)
  const repeatRef = useRef(repeat)
  const shuffleRef = useRef(shuffle)

  const current = tracks.find((track) => track.id === currentId) ?? tracks[0] ?? DEMO_TRACKS[0]
  const localTrackCount = tracks.filter((track) => track.kind === 'local').length

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    currentIdRef.current = currentId
  }, [currentId])

  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  useEffect(() => {
    shuffleRef.current = shuffle
  }, [shuffle])

  useEffect(() => {
    engine.load(DEMO_TRACKS[0])
    return () => engine.destroy()
  }, [engine])

  useEffect(() => {
    engine.setVolume(volume)
  }, [engine, volume])

  useEffect(() => {
    let cancelled = false
    void loadImportedTracks()
      .then((imported) => {
        if (!cancelled) setTracks([...imported, ...DEMO_TRACKS])
      })
      .catch(() => {
        if (!cancelled) setMessage('Local storage is unavailable. Demo playback still works.')
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false)
      })

    return () => {
      cancelled = true
      for (const track of tracksRef.current) {
        if (track.kind === 'local' && track.sourceUrl) URL.revokeObjectURL(track.sourceUrl)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume])

  const playTrack = useCallback(
    async (trackId: string, autoplay = true) => {
      const selected = tracksRef.current.find((track) => track.id === trackId)
      if (!selected) return

      if (trackId !== currentIdRef.current) {
        engine.load(selected)
        currentIdRef.current = trackId
        setCurrentId(trackId)
        setPosition(0)
        setPlaying(false)
      }

      if (!autoplay) return
      try {
        await engine.play()
        setAnalyser(engine.getAnalyser())
        setPlaying(true)
        setMessage('')
      } catch {
        setPlaying(false)
        setMessage('This file could not start. Try another browser-supported audio format.')
      }
    },
    [engine],
  )

  const moveTrack = useCallback(
    (direction: 1 | -1, autoAdvance = false) => {
      const library = tracksRef.current
      if (library.length === 0) return
      const currentIndex = Math.max(0, library.findIndex((track) => track.id === currentIdRef.current))

      if (autoAdvance && repeatRef.current === 'one') {
        engine.seek(0)
        void engine.play().then(() => setPlaying(true))
        return
      }

      let nextIndex = currentIndex + direction
      if (shuffleRef.current && library.length > 1) {
        do nextIndex = Math.floor(Math.random() * library.length)
        while (nextIndex === currentIndex)
      } else if (nextIndex < 0 || nextIndex >= library.length) {
        if (autoAdvance && repeatRef.current === 'off') {
          setPlaying(false)
          setPosition(0)
          return
        }
        nextIndex = (nextIndex + library.length) % library.length
      }

      void playTrack(library[nextIndex].id)
    },
    [engine, playTrack],
  )

  useEffect(() => {
    engine.setEndedHandler(() => moveTrack(1, true))
    return () => engine.setEndedHandler(null)
  }, [engine, moveTrack])

  useEffect(() => {
    if (!playing) return
    let animationFrame = 0
    const tick = () => {
      animationFrame = requestAnimationFrame(tick)
      setPosition(engine.position)
    }
    tick()
    return () => cancelAnimationFrame(animationFrame)
  }, [engine, playing])

  const togglePlay = useCallback(async () => {
    if (engine.isPlaying) {
      engine.pause()
      setPlaying(false)
      return
    }

    try {
      await engine.play()
      setAnalyser(engine.getAnalyser())
      setPlaying(true)
      setMessage('')
    } catch {
      setMessage('Playback was blocked or this audio format is not supported.')
    }
  }, [engine])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, button') || target?.isContentEditable) return
      if (event.code === 'Space') {
        event.preventDefault()
        void togglePlay()
      } else if (event.code === 'ArrowRight') {
        engine.seek(Math.min(current.duration, engine.position + 10))
        setPosition(engine.position)
      } else if (event.code === 'ArrowLeft') {
        engine.seek(Math.max(0, engine.position - 10))
        setPosition(engine.position)
      } else if (event.key.toLowerCase() === 'm') {
        setVolumeState((value) => {
          const next = value > 0 ? 0 : lastAudibleVolume.current
          if (value > 0) lastAudibleVolume.current = value
          engine.setVolume(next)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [current.duration, engine, togglePlay])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: 'JO₵YN Music Workspace',
    })
    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Some browsers expose Media Session but omit individual actions.
      }
    }
    setHandler('play', () => { if (!engine.isPlaying) void togglePlay() })
    setHandler('pause', () => { if (engine.isPlaying) void togglePlay() })
    setHandler('previoustrack', () => moveTrack(-1))
    setHandler('nexttrack', () => moveTrack(1))
    return () => {
      setHandler('play', null)
      setHandler('pause', null)
      setHandler('previoustrack', null)
      setHandler('nexttrack', null)
    }
  }, [current.artist, current.title, engine, moveTrack, togglePlay])

  const handleFiles = useCallback(async (files: File[]) => {
    const audioFiles = files.filter(
      (file) => file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(file.name),
    )
    if (audioFiles.length === 0) {
      setMessage('Choose an MP3, WAV, M4A, AAC, OGG, FLAC, or audio WebM file.')
      return
    }

    setImporting(true)
    const imported: Track[] = []
    const failures: string[] = []
    for (const [index, file] of audioFiles.entries()) {
      try {
        imported.push(await importAudioFile(file, tracksRef.current.length + index))
      } catch {
        failures.push(file.name)
      }
    }

    if (imported.length > 0) {
      setTracks((existing) => [...imported, ...existing])
      tracksRef.current = [...imported, ...tracksRef.current]
      const first = imported[0]
      engine.load(first)
      currentIdRef.current = first.id
      setCurrentId(first.id)
      setPosition(0)
      setPlaying(false)
      setScope('all')
    }
    setMessage(
      failures.length > 0
        ? `${imported.length} added. ${failures.length} file${failures.length === 1 ? '' : 's'} could not be decoded.`
        : `${imported.length} track${imported.length === 1 ? '' : 's'} added to this browser.`,
    )
    setImporting(false)
  }, [engine])

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    void handleFiles(Array.from(event.dataTransfer.files))
  }

  const removeTrack = async (track: Track) => {
    if (track.kind !== 'local') return
    if (!window.confirm(`Remove “${track.title}” from this browser?`)) return

    try {
      await deleteImportedTrack(track.id)
      const remaining = tracksRef.current.filter((item) => item.id !== track.id)
      tracksRef.current = remaining
      setTracks(remaining)
      setFavorites((items) => items.filter((id) => id !== track.id))

      if (currentIdRef.current === track.id) {
        const replacement = remaining[0] ?? DEMO_TRACKS[0]
        engine.load(replacement)
        currentIdRef.current = replacement.id
        setCurrentId(replacement.id)
        setPosition(0)
        setPlaying(false)
      }
      if (track.sourceUrl) URL.revokeObjectURL(track.sourceUrl)
      setMessage('Track removed from this browser.')
    } catch {
      setMessage('The track could not be removed. Your audio was left untouched.')
    }
  }

  const toggleFavorite = (trackId: string) => {
    setFavorites((items) => (items.includes(trackId) ? items.filter((id) => id !== trackId) : [...items, trackId]))
  }

  const setVolume = (value: number) => {
    if (value > 0) lastAudibleVolume.current = value
    engine.setVolume(value)
    setVolumeState(value)
  }

  const cycleRepeat = () => setRepeat((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'))

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return tracks.filter((track) => {
      if (scope === 'local' && track.kind !== 'local') return false
      if (scope === 'favorites' && !favorites.includes(track.id)) return false
      return !normalizedQuery || `${track.title} ${track.artist} ${track.fileName ?? ''}`.toLowerCase().includes(normalizedQuery)
    })
  }, [favorites, query, scope, tracks])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="JO₵YN music workspace home">
          <span className="brand__word">JO₵YN</span>
          <span className="brand__descriptor">MUSIC WORKSPACE</span>
        </a>
        <div className="topbar__status">
          <span className="status-dot" />
          LOCAL-FIRST PLAYER
        </div>
        <div className="topbar__actions">
          <a className="button button--secondary" href="/dashboard">CLOUD LIBRARY</a>
          <button className="button button--primary" type="button" onClick={() => fileInputRef.current?.click()}>
            {importing ? 'IMPORTING…' : '+ IMPORT AUDIO'}
          </button>
        </div>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="audio/*,.flac" multiple onChange={onFileInput} />
      </header>

      <main id="top" className="workspace">
        <section className="intro">
          <p className="eyebrow">PRIVATE LISTENING ROOM / V2</p>
          <h1>Your music.<br />In one working library.</h1>
          <p className="intro__copy">Import masters, demos, and references. Preview them instantly, keep your library in this browser, and move through decisions without leaving the session.</p>
          <div className="metrics" aria-label="Library summary">
            <div><strong>{tracks.length}</strong><span>TOTAL TRACKS</span></div>
            <div><strong>{localTrackCount}</strong><span>YOUR FILES</span></div>
            <div><strong>{favorites.length}</strong><span>FAVORITES</span></div>
          </div>
        </section>

        <section className="player-stage" aria-label="Now playing">
          <div className="stage__topline">
            <span>{playing ? 'NOW PLAYING' : 'READY TO PLAY'}</span>
            <span>{current.kind === 'local' ? 'LOCAL MASTER' : 'SYNTH DEMO'}</span>
          </div>
          <div className="stage__content">
            <Artwork track={current} />
            <div className="stage__details">
              <p className="stage__kicker">CURRENT SELECTION</p>
              <h2>{current.title}</h2>
              <p className="stage__artist">{current.artist}</p>
              <div className="stage__meta">
                <span>{formatTime(current.duration)}</span>
                {current.bpm ? <span>{current.bpm} BPM</span> : <span>AUDIO FILE</span>}
                <span>{current.kind === 'local' ? 'PERSISTED' : 'BUILT-IN'}</span>
              </div>
              <div className="stage__actions">
                <button className="text-button" type="button" onClick={() => toggleFavorite(current.id)}>
                  {favorites.includes(current.id) ? '★ FAVORITED' : '☆ FAVORITE'}
                </button>
                {current.kind === 'local' ? (
                  <button className="text-button text-button--danger" type="button" onClick={() => void removeTrack(current)}>
                    REMOVE
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <Visualizer analyser={analyser} playing={playing} />
          <div className="stage__progress">
            <span>{formatTime(position)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(current.duration, 0.1)}
              step={0.05}
              value={Math.min(position, current.duration)}
              onChange={(event) => {
                const next = Number(event.target.value)
                engine.seek(next)
                setPosition(next)
              }}
              aria-label="Seek through track"
            />
            <span>{formatTime(current.duration)}</span>
          </div>
        </section>

        <section className="library-panel">
          <div className="library-panel__heading">
            <div>
              <p className="eyebrow">LIBRARY</p>
              <h2>Playback queue</h2>
            </div>
            <label className="search">
              <span className="visually-hidden">Search tracks</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or artist" />
            </label>
          </div>

          <div className="filters" aria-label="Filter music library">
            {(['all', 'local', 'favorites'] as LibraryScope[]).map((item) => (
              <button key={item} className={scope === item ? 'filter filter--active' : 'filter'} type="button" onClick={() => setScope(item)}>
                {item === 'all' ? 'ALL TRACKS' : item === 'local' ? 'MY FILES' : 'FAVORITES'}
              </button>
            ))}
          </div>

          <div
            className={dragging ? 'drop-zone drop-zone--active' : 'drop-zone'}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <strong>{importing ? 'Adding audio to your library…' : 'Drop audio here'}</strong>
            <span>Files remain inside this browser until you remove them.</span>
          </div>

          {message ? <p className="notice" role="status">{message}</p> : null}

          <div className="track-list" aria-busy={libraryLoading || importing}>
            {libraryLoading ? <p className="empty-state">Loading your saved library…</p> : null}
            {!libraryLoading && filteredTracks.length === 0 ? <p className="empty-state">No tracks match this view.</p> : null}
            {filteredTracks.map((track, index) => {
              const active = track.id === current.id
              const favorite = favorites.includes(track.id)
              return (
                <article key={track.id} className={active ? 'track-row track-row--active' : 'track-row'}>
                  <button className="track-row__select" type="button" onClick={() => void playTrack(track.id)} aria-label={`Play ${track.title}`}>
                    <span className="track-row__number">{active && playing ? '▶' : String(index + 1).padStart(2, '0')}</span>
                    <Artwork track={track} size="small" />
                    <span className="track-row__copy">
                      <strong>{track.title}</strong>
                      <span>{track.artist} · {track.kind === 'local' ? 'YOUR FILE' : 'DEMO'}</span>
                    </span>
                    <span className="track-row__duration">{formatTime(track.duration)}</span>
                  </button>
                  <button className="track-row__favorite" type="button" onClick={() => toggleFavorite(track.id)} aria-label={favorite ? `Remove ${track.title} from favorites` : `Favorite ${track.title}`}>
                    {favorite ? '★' : '☆'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="transport" aria-label="Music player controls">
        <div className="transport__track">
          <Artwork track={current} size="small" />
          <span><strong>{current.title}</strong><small>{current.artist}</small></span>
        </div>
        <div className="transport__center">
          <div className="transport__buttons">
            <button className={shuffle ? 'icon-button icon-button--active' : 'icon-button'} type="button" onClick={() => setShuffle((value) => !value)} aria-label="Toggle shuffle">⌘</button>
            <button className="icon-button" type="button" onClick={() => moveTrack(-1)} aria-label="Previous track">◀</button>
            <button className="play-button" type="button" onClick={() => void togglePlay()} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Ⅱ' : '▶'}</button>
            <button className="icon-button" type="button" onClick={() => moveTrack(1)} aria-label="Next track">▶</button>
            <button className={repeat !== 'off' ? 'icon-button icon-button--active' : 'icon-button'} type="button" onClick={cycleRepeat} aria-label={`Repeat ${repeat}`}>↻{repeat === 'one' ? '¹' : ''}</button>
          </div>
          <div className="transport__progress">
            <span>{formatTime(position)}</span>
            <input type="range" min={0} max={Math.max(current.duration, 0.1)} step={0.05} value={Math.min(position, current.duration)} onChange={(event) => { const next = Number(event.target.value); engine.seek(next); setPosition(next) }} aria-label="Playback position" />
            <span>{formatTime(current.duration)}</span>
          </div>
        </div>
        <div className="transport__volume">
          <button className="icon-button" type="button" onClick={() => setVolume(volume > 0 ? 0 : lastAudibleVolume.current)} aria-label={volume > 0 ? 'Mute' : 'Unmute'}>{volume > 0 ? 'VOL' : 'MUTE'}</button>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" />
        </div>
      </footer>
    </div>
  )
}
