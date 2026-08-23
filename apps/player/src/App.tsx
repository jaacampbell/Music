import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, DragEvent, FormEvent } from 'react'
import './App.css'
import { downloadCloudTrack, loadCloudLibrary, setCloudConfig, setCloudFavorite, updateCloudTrack, uploadCloudTrack, type CloudProjectOption } from './cloud'
import { deleteImportedTrack, importAudioFile, loadImportedTracks, titleFromFileName, updateImportedTrack, type TrackMetadata } from './library'
import { PlaybackEngine } from './synth'
import { DEMO_TRACKS, type Track } from './tracks'

type LibraryScope = 'all' | 'local' | 'cloud' | 'favorites'
type RepeatMode = 'off' | 'all' | 'one'
type Destination = 'cloud' | 'local'
type DraftFields = { title: string; artist: string; bpm: string; songKey: string; versionLabel: string; artworkFile?: File; artworkPreview?: string }
type UploadDraft = DraftFields & { file: File; destination: Destination; projectId: string }
type EditDraft = DraftFields & { track: Track }

const FAVORITES_KEY = 'jocyn-player-favorites'
const VOLUME_KEY = 'jocyn-player-volume'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const total = Math.max(0, Math.floor(seconds))
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`
}

function parseOptionalNumber(value: string): number | undefined {
  const parsed = Number(value)
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch { return [] }
}

function readVolume(): number {
  if (typeof window === 'undefined') return 0.8
  const value = Number(localStorage.getItem(VOLUME_KEY))
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.8
}

function Artwork({ track, size = 'large' }: { track: Track; size?: 'small' | 'large' }) {
  const style = { '--accent': track.accent[0], '--accent-deep': track.accent[1] } as CSSProperties
  const edition = track.kind === 'cloud' ? 'CLOUD' : track.kind === 'local' ? 'DEVICE' : 'LAB'
  return <div className={`artwork artwork--${size}`} style={style} aria-label={`${track.title} artwork`}>
    {track.artworkUrl ? <img className="artwork__image" src={track.artworkUrl} alt="" /> : null}
    <span className="artwork__edition">{edition}</span>
    {!track.artworkUrl ? <span className="artwork__mark">J₵</span> : null}
    <span className="artwork__rule" /><span className="artwork__name">{track.title}</span>
  </div>
}

function Visualizer({ analyser, playing }: { analyser: AnalyserNode | null; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analyserRef = useRef(analyser)
  const playingRef = useRef(playing)
  useEffect(() => { analyserRef.current = analyser }, [analyser])
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    let frame = 0
    let data: Uint8Array<ArrayBuffer> | null = null
    const draw = () => {
      frame = requestAnimationFrame(draw)
      const active = analyserRef.current
      if (active && (!data || data.length !== active.frequencyBinCount)) data = new Uint8Array(active.frequencyBinCount)
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (active && data && playingRef.current) active.getByteFrequencyData(data)
      const bars = 32, gap = 5, width = (canvas.width - gap * (bars - 1)) / bars
      for (let index = 0; index < bars; index += 1) {
        const sampled = data ? Math.floor((index / bars) * data.length) : index
        const frequency = playingRef.current && data ? data[sampled] / 255 : 0
        const resting = 5 + 8 * Math.abs(Math.sin(index * 0.72))
        const height = playingRef.current ? Math.max(4, frequency * canvas.height * 0.92) : resting
        context.fillStyle = index % 5 === 0 ? '#b7d52b' : 'rgba(238, 235, 224, 0.52)'
        context.fillRect(index * (width + gap), canvas.height - height, width, height)
      }
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} className="visualizer" width={640} height={92} aria-label="Live audio visualizer" />
}

function metadataFromDraft(draft: DraftFields): TrackMetadata {
  return { title: draft.title.trim(), artist: draft.artist.trim(), bpm: parseOptionalNumber(draft.bpm), songKey: draft.songKey.trim() || undefined, versionLabel: draft.versionLabel.trim() || undefined }
}

export default function App({ cloudConfig }: { cloudConfig?: { url?: string; key?: string } }) {
  setCloudConfig(cloudConfig)
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
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState('')
  const [cloudUser, setCloudUser] = useState<{ id: string; email?: string } | null>(null)
  const [cloudConfigured, setCloudConfigured] = useState(false)
  const [cloudProjects, setCloudProjects] = useState<CloudProjectOption[]>([])
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadLabel, setUploadLabel] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastAudibleVolume = useRef(volume || 0.8)
  const tracksRef = useRef(tracks)
  const currentIdRef = useRef(currentId)
  const repeatRef = useRef(repeat)
  const shuffleRef = useRef(shuffle)

  const current = tracks.find((track) => track.id === currentId) ?? tracks[0] ?? DEMO_TRACKS[0]
  const localCount = tracks.filter((track) => track.kind === 'local').length
  const cloudCount = tracks.filter((track) => track.kind === 'cloud').length
  const isFavorite = useCallback((track: Track) => track.kind === 'cloud' ? Boolean(track.cloudFavorite) : favorites.includes(track.id), [favorites])
  const favoriteCount = tracks.filter(isFavorite).length

  useEffect(() => { tracksRef.current = tracks }, [tracks])
  useEffect(() => { currentIdRef.current = currentId }, [currentId])
  useEffect(() => { repeatRef.current = repeat }, [repeat])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])

  const refreshCloud = useCallback(async () => {
    const library = await loadCloudLibrary()
    setCloudConfigured(library.configured); setCloudUser(library.user); setCloudProjects(library.projects)
    setTracks((existing) => {
      const previous = new Map(existing.filter((track) => track.kind === 'cloud').map((track) => [track.id, track]))
      const cloud = library.tracks.map((track) => previous.get(track.id)?.sourceUrl ? { ...track, sourceUrl: previous.get(track.id)?.sourceUrl } : track)
      const next = [...cloud, ...existing.filter((track) => track.kind !== 'cloud')]
      tracksRef.current = next
      return next
    })
    return library
  }, [])

  useEffect(() => {
    engine.load(DEMO_TRACKS[0])
    let cancelled = false
    Promise.allSettled([loadImportedTracks(), loadCloudLibrary()]).then(([localResult, cloudResult]) => {
      if (cancelled) return
      const local = localResult.status === 'fulfilled' ? localResult.value : []
      const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : { tracks: [], projects: [], user: null, configured: false }
      const next = [...cloud.tracks, ...local, ...DEMO_TRACKS]
      tracksRef.current = next; setTracks(next); setCloudConfigured(cloud.configured); setCloudUser(cloud.user); setCloudProjects(cloud.projects)
      if (localResult.status === 'rejected') setMessage('Device storage is unavailable. Cloud and demo playback still work.')
      else if (cloudResult.status === 'rejected') setMessage('The Cloud Library could not be reached. Device playback still works.')
      setLibraryLoading(false)
    })
    return () => {
      cancelled = true; engine.destroy()
      for (const track of tracksRef.current) { if (track.sourceUrl) URL.revokeObjectURL(track.sourceUrl); if (track.artworkUrl) URL.revokeObjectURL(track.artworkUrl) }
    }
  }, [engine])

  useEffect(() => { engine.setVolume(volume) }, [engine, volume])
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem(VOLUME_KEY, String(volume)) }, [volume])

  const playTrack = useCallback(async (trackId: string, autoplay = true) => {
    let selected = tracksRef.current.find((track) => track.id === trackId)
    if (!selected) return
    if (selected.kind === 'cloud' && !selected.sourceUrl) {
      setMessage(`Loading “${selected.title}” securely from your Cloud Library…`)
      try {
        selected = { ...selected, sourceUrl: await downloadCloudTrack(selected) }
        const loaded = selected
        setTracks((items) => items.map((track) => track.id === loaded.id ? loaded : track))
        tracksRef.current = tracksRef.current.map((track) => track.id === loaded.id ? loaded : track)
      } catch (error) { setMessage(error instanceof Error ? error.message : 'This cloud track could not be loaded.'); return }
    }
    if (trackId !== currentIdRef.current || selected.kind !== 'synth') {
      engine.load(selected); currentIdRef.current = trackId; setCurrentId(trackId); setPosition(0); setPlaying(false)
    }
    if (!autoplay) return
    try { await engine.play(); setAnalyser(engine.getAnalyser()); setPlaying(true); setMessage('') }
    catch { setPlaying(false); setMessage('This file could not start. Try a browser-supported audio format.') }
  }, [engine])

  const moveTrack = useCallback((direction: 1 | -1, autoAdvance = false) => {
    const library = tracksRef.current
    if (!library.length) return
    const currentIndex = Math.max(0, library.findIndex((track) => track.id === currentIdRef.current))
    if (autoAdvance && repeatRef.current === 'one') { engine.seek(0); void engine.play().then(() => setPlaying(true)); return }
    let nextIndex = currentIndex + direction
    if (shuffleRef.current && library.length > 1) { do nextIndex = Math.floor(Math.random() * library.length); while (nextIndex === currentIndex) }
    else if (nextIndex < 0 || nextIndex >= library.length) {
      if (autoAdvance && repeatRef.current === 'off') { setPlaying(false); setPosition(0); return }
      nextIndex = (nextIndex + library.length) % library.length
    }
    void playTrack(library[nextIndex].id)
  }, [engine, playTrack])

  useEffect(() => { engine.setEndedHandler(() => moveTrack(1, true)); return () => engine.setEndedHandler(null) }, [engine, moveTrack])
  useEffect(() => { if (!playing) return; let frame = 0; const tick = () => { frame = requestAnimationFrame(tick); setPosition(engine.position) }; tick(); return () => cancelAnimationFrame(frame) }, [engine, playing])

  const togglePlay = useCallback(async () => {
    if (engine.isPlaying) { engine.pause(); setPlaying(false); return }
    if (current.kind === 'cloud' && !current.sourceUrl) { await playTrack(current.id); return }
    try { await engine.play(); setAnalyser(engine.getAnalyser()); setPlaying(true); setMessage('') }
    catch { setMessage('Playback was blocked or this audio format is not supported.') }
  }, [current, engine, playTrack])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, button') || target?.isContentEditable) return
      if (event.code === 'Space') { event.preventDefault(); void togglePlay() }
      else if (event.code === 'ArrowRight') { engine.seek(Math.min(current.duration, engine.position + 10)); setPosition(engine.position) }
      else if (event.code === 'ArrowLeft') { engine.seek(Math.max(0, engine.position - 10)); setPosition(engine.position) }
      else if (event.key.toLowerCase() === 'm') setVolumeState((value) => { const next = value > 0 ? 0 : lastAudibleVolume.current; if (value > 0) lastAudibleVolume.current = value; engine.setVolume(next); return next })
    }
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown)
  }, [current.duration, engine, togglePlay])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artist, album: 'JO₵YN Music Workspace' })
    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => { try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* Unsupported action. */ } }
    setHandler('play', () => { if (!engine.isPlaying) void togglePlay() }); setHandler('pause', () => { if (engine.isPlaying) void togglePlay() }); setHandler('previoustrack', () => moveTrack(-1)); setHandler('nexttrack', () => moveTrack(1))
    return () => { setHandler('play', null); setHandler('pause', null); setHandler('previoustrack', null); setHandler('nexttrack', null) }
  }, [current.artist, current.title, engine, moveTrack, togglePlay])

  const prepareUpload = (file: File) => {
    if (!(file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|aif|aiff|webm)$/i.test(file.name))) { setMessage('Choose an MP3, WAV, M4A, AAC, OGG, FLAC, AIFF, or audio WebM file.'); return }
    setUploadProgress(0); setUploadLabel('')
    setUploadDraft({ file, title: titleFromFileName(file.name) || 'Untitled song', artist: 'JOCYN', bpm: '', songKey: '', versionLabel: 'Master', destination: cloudUser ? 'cloud' : 'local', projectId: '' })
  }
  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) prepareUpload(file); event.target.value = '' }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|aif|aiff|webm)$/i.test(item.name)); if (file) prepareUpload(file); else setMessage('Drop one supported audio file here.') }

  const submitUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!uploadDraft || busy) return
    if (!uploadDraft.title.trim()) { setMessage('Add a track title before saving.'); return }
    setBusy(true); setMessage('')
    try {
      const metadata = metadataFromDraft(uploadDraft)
      if (uploadDraft.destination === 'cloud') {
        await uploadCloudTrack({ ...metadata, file: uploadDraft.file, artworkFile: uploadDraft.artworkFile, projectId: uploadDraft.projectId || undefined }, (percent, label) => { setUploadProgress(percent); setUploadLabel(label) })
        await refreshCloud(); setScope('cloud'); setMessage(`“${metadata.title}” is saved to your private Cloud Library and available across devices.`)
      } else {
        const imported = await importAudioFile(uploadDraft.file, tracksRef.current.length, metadata, uploadDraft.artworkFile)
        const next = [imported, ...tracksRef.current]; tracksRef.current = next; setTracks(next); engine.load(imported); currentIdRef.current = imported.id; setCurrentId(imported.id); setPosition(0); setPlaying(false); setScope('local'); setMessage(`“${metadata.title}” is saved on this device. Sign in anytime to add it to the cloud.`)
      }
      if (uploadDraft.artworkPreview) URL.revokeObjectURL(uploadDraft.artworkPreview)
      setUploadDraft(null)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The track could not be saved.') }
    finally { setBusy(false) }
  }

  const openEditor = (track: Track) => { if (track.kind !== 'synth') setEditDraft({ track, title: track.title, artist: track.artist, bpm: track.bpm ? String(track.bpm) : '', songKey: track.songKey ?? '', versionLabel: track.versionLabel ?? 'Master' }) }
  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editDraft || busy) return
    setBusy(true); setMessage('')
    try {
      const metadata = metadataFromDraft(editDraft)
      if (!metadata.title) throw new Error('Track title cannot be blank.')
      if (editDraft.track.kind === 'cloud') { await updateCloudTrack(editDraft.track, metadata, editDraft.artworkFile); await refreshCloud(); setMessage('Cloud track details updated across devices.') }
      else {
        const updated = await updateImportedTrack(editDraft.track.id, metadata, editDraft.artworkFile)
        const next = tracksRef.current.map((track) => track.id === updated.id ? updated : track); tracksRef.current = next; setTracks(next)
        if (currentIdRef.current === updated.id) { engine.load(updated); setPosition(0); setPlaying(false) }
        setMessage('Track details updated on this device.')
      }
      if (editDraft.artworkPreview) URL.revokeObjectURL(editDraft.artworkPreview)
      setEditDraft(null)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Track details could not be updated.') }
    finally { setBusy(false) }
  }

  const removeTrack = async (track: Track) => {
    if (track.kind !== 'local' || !window.confirm(`Remove “${track.title}” from this device?`)) return
    try {
      await deleteImportedTrack(track.id)
      const remaining = tracksRef.current.filter((item) => item.id !== track.id); tracksRef.current = remaining; setTracks(remaining); setFavorites((items) => items.filter((id) => id !== track.id))
      if (currentIdRef.current === track.id) { const replacement = remaining[0] ?? DEMO_TRACKS[0]; engine.load(replacement); currentIdRef.current = replacement.id; setCurrentId(replacement.id); setPosition(0); setPlaying(false) }
      if (track.sourceUrl) URL.revokeObjectURL(track.sourceUrl); if (track.artworkUrl) URL.revokeObjectURL(track.artworkUrl); setMessage('Track removed from this device.')
    } catch { setMessage('The track could not be removed. Your audio was left untouched.') }
  }

  const toggleFavorite = (track: Track) => {
    const favorite = !isFavorite(track)
    if (track.kind === 'cloud') {
      setTracks((items) => items.map((item) => item.id === track.id ? { ...item, cloudFavorite: favorite } : item)); tracksRef.current = tracksRef.current.map((item) => item.id === track.id ? { ...item, cloudFavorite: favorite } : item)
      void setCloudFavorite(track, favorite).catch(() => setMessage('Favorite could not be synced to the cloud.'))
    } else setFavorites((items) => favorite ? [...items, track.id] : items.filter((id) => id !== track.id))
  }
  const setVolume = (value: number) => { if (value > 0) lastAudibleVolume.current = value; engine.setVolume(value); setVolumeState(value) }
  const cycleRepeat = () => setRepeat((mode) => mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off')
  const filteredTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return tracks.filter((track) => !(scope === 'local' && track.kind !== 'local') && !(scope === 'cloud' && track.kind !== 'cloud') && !(scope === 'favorites' && !isFavorite(track)) && (!normalized || `${track.title} ${track.artist} ${track.fileName ?? ''} ${track.versionLabel ?? ''}`.toLowerCase().includes(normalized)))
  }, [isFavorite, query, scope, tracks])
  const cloudStatus = cloudUser ? `CLOUD SYNC · ${cloudUser.email ?? 'SIGNED IN'}` : cloudConfigured ? 'DEVICE MODE · SIGN IN TO SYNC' : 'DEVICE MODE'

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand__word">JO₵YN</span><span className="brand__descriptor">MUSIC WORKSPACE</span></a>
      <div className="topbar__status"><span className={cloudUser ? 'status-dot status-dot--cloud' : 'status-dot'} />{cloudStatus}</div>
      <div className="topbar__actions"><a className="button button--secondary" href={cloudUser ? '/dashboard' : '/login?next=/player'}>{cloudUser ? 'OPEN DASHBOARD' : 'SIGN IN'}</a><button className="button button--primary" type="button" onClick={() => fileInputRef.current?.click()}>+ ADD AUDIO</button></div>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="audio/*,.flac,.aif,.aiff" onChange={onFileInput} />
    </header>

    <main id="top" className="workspace">
      <section className="intro"><p className="eyebrow">PRIVATE LISTENING ROOM / V3</p><h1>Your music.<br />Everywhere.</h1><p className="intro__copy">Upload masters, demos, and references once. Keep them private, edit the details, add artwork, and continue listening across devices—or stay completely local when you need to.</p><div className="metrics metrics--four"><div><strong>{tracks.length}</strong><span>TOTAL</span></div><div><strong>{cloudCount}</strong><span>CLOUD</span></div><div><strong>{localCount}</strong><span>DEVICE</span></div><div><strong>{favoriteCount}</strong><span>FAVORITES</span></div></div></section>

      <section className="player-stage" aria-label="Now playing">
        <div className="stage__topline"><span>{playing ? 'NOW PLAYING' : 'READY TO PLAY'}</span><span>{current.kind === 'cloud' ? 'PRIVATE CLOUD' : current.kind === 'local' ? 'THIS DEVICE' : 'SYNTH DEMO'}</span></div>
        <div className="stage__content"><Artwork track={current} /><div className="stage__details"><p className="stage__kicker">CURRENT SELECTION</p><h2>{current.title}</h2><p className="stage__artist">{current.artist}</p><div className="stage__meta"><span>{formatTime(current.duration)}</span><span>{current.bpm ? `${current.bpm} BPM` : 'AUDIO FILE'}</span>{current.songKey ? <span>KEY {current.songKey}</span> : null}<span>{current.versionLabel ?? (current.kind === 'synth' ? 'BUILT-IN' : 'MASTER')}</span></div><div className="stage__actions"><button className="text-button" type="button" onClick={() => toggleFavorite(current)}>{isFavorite(current) ? '★ FAVORITED' : '☆ FAVORITE'}</button>{current.kind !== 'synth' ? <button className="text-button" type="button" onClick={() => openEditor(current)}>EDIT DETAILS</button> : null}{current.kind === 'local' ? <button className="text-button text-button--danger" type="button" onClick={() => void removeTrack(current)}>REMOVE</button> : null}</div></div></div>
        <Visualizer analyser={analyser} playing={playing} /><div className="stage__progress"><span>{formatTime(position)}</span><input type="range" min={0} max={Math.max(current.duration, 0.1)} step={0.05} value={Math.min(position, current.duration)} onChange={(event) => { const next = Number(event.target.value); engine.seek(next); setPosition(next) }} /><span>{formatTime(current.duration)}</span></div>
      </section>

      <section className="sync-banner"><div><span className="sync-banner__label">{cloudUser ? 'PRIVATE CLOUD ACTIVE' : 'LOCAL MODE'}</span><strong>{cloudUser ? 'New uploads sync across your signed-in devices.' : 'Your files stay on this device until you choose cloud sync.'}</strong></div><a href={cloudUser ? '/dashboard' : '/login?next=/player'}>{cloudUser ? 'MANAGE PROJECTS →' : 'SIGN IN TO SYNC →'}</a></section>

      <section className="library-panel">
        <div className="library-panel__heading"><div><p className="eyebrow">UNIFIED LIBRARY</p><h2>Playback queue</h2></div><label className="search"><span className="visually-hidden">Search tracks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, artist, or version" /></label></div>
        <div className="filters">{(['all', 'cloud', 'local', 'favorites'] as LibraryScope[]).map((item) => <button key={item} className={scope === item ? 'filter filter--active' : 'filter'} type="button" onClick={() => setScope(item)}>{item === 'all' ? 'ALL TRACKS' : item === 'cloud' ? 'CLOUD' : item === 'local' ? 'THIS DEVICE' : 'FAVORITES'}</button>)}</div>
        <div className={dragging ? 'drop-zone drop-zone--active' : 'drop-zone'} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}><strong>Drop one audio file here</strong><span>{cloudUser ? 'Cloud is the default. You can choose device-only before saving.' : 'It will stay on this device. Sign in to unlock cloud sync.'}</span></div>
        {message ? <p className="notice" role="status">{message}</p> : null}
        <div className="track-list" aria-busy={libraryLoading || busy}>{libraryLoading ? <p className="empty-state">Loading your private library…</p> : null}{!libraryLoading && !filteredTracks.length ? <p className="empty-state">No tracks match this view.</p> : null}{filteredTracks.map((track, index) => { const active = track.id === current.id; return <article key={track.id} className={active ? 'track-row track-row--active' : 'track-row'}><button className="track-row__select" type="button" onClick={() => void playTrack(track.id)}><span className="track-row__number">{active && playing ? '▶' : String(index + 1).padStart(2, '0')}</span><Artwork track={track} size="small" /><span className="track-row__copy"><strong>{track.title}</strong><span>{track.artist} · {track.kind === 'cloud' ? 'CLOUD' : track.kind === 'local' ? 'DEVICE' : 'DEMO'}{track.versionLabel ? ` · ${track.versionLabel}` : ''}</span></span><span className="track-row__duration">{formatTime(track.duration)}</span></button><button className="track-row__favorite" type="button" onClick={() => toggleFavorite(track)}>{isFavorite(track) ? '★' : '☆'}</button></article> })}</div>
      </section>
    </main>

    <footer className="transport"><div className="transport__track"><Artwork track={current} size="small" /><span><strong>{current.title}</strong><small>{current.artist}</small></span></div><div className="transport__center"><div className="transport__buttons"><button className={shuffle ? 'icon-button icon-button--active' : 'icon-button'} type="button" onClick={() => setShuffle((value) => !value)}>⌘</button><button className="icon-button" type="button" onClick={() => moveTrack(-1)}>◀</button><button className="play-button" type="button" onClick={() => void togglePlay()}>{playing ? 'Ⅱ' : '▶'}</button><button className="icon-button" type="button" onClick={() => moveTrack(1)}>▶</button><button className={repeat !== 'off' ? 'icon-button icon-button--active' : 'icon-button'} type="button" onClick={cycleRepeat}>↻{repeat === 'one' ? '¹' : ''}</button></div><div className="transport__progress"><span>{formatTime(position)}</span><input type="range" min={0} max={Math.max(current.duration, 0.1)} step={0.05} value={Math.min(position, current.duration)} onChange={(event) => { const next = Number(event.target.value); engine.seek(next); setPosition(next) }} /><span>{formatTime(current.duration)}</span></div></div><div className="transport__volume"><button className="icon-button" type="button" onClick={() => setVolume(volume > 0 ? 0 : lastAudibleVolume.current)}>{volume > 0 ? 'VOL' : 'MUTE'}</button><input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div></footer>

    {uploadDraft ? <UploadModal draft={uploadDraft} setDraft={setUploadDraft} busy={busy} cloudUser={Boolean(cloudUser)} projects={cloudProjects} progress={uploadProgress} progressLabel={uploadLabel} onSubmit={submitUpload} /> : null}
    {editDraft ? <EditModal draft={editDraft} setDraft={setEditDraft} busy={busy} onSubmit={submitEdit} /> : null}
  </div>
}

function UploadModal({ draft, setDraft, busy, cloudUser, projects, progress, progressLabel, onSubmit }: { draft: UploadDraft; setDraft: (draft: UploadDraft | null) => void; busy: boolean; cloudUser: boolean; projects: CloudProjectOption[]; progress: number; progressLabel: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDraft(null) }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-card__head"><div><p className="eyebrow">ADD TO LIBRARY</p><h2 id="upload-title">Confirm your track</h2></div><button className="modal-close" type="button" onClick={() => setDraft(null)} disabled={busy}>×</button></div><div className="file-summary"><span>AUDIO FILE</span><strong>{draft.file.name}</strong><small>{formatBytes(draft.file.size)}</small></div><form className="metadata-form" onSubmit={onSubmit}>
    <div className="destination-grid"><button className={draft.destination === 'cloud' ? 'destination-card destination-card--active' : 'destination-card'} type="button" disabled={!cloudUser || busy} onClick={() => setDraft({ ...draft, destination: 'cloud' })}><strong>Cloud Library</strong><span>{cloudUser ? 'Private · available across devices' : 'Sign in to enable'}</span></button><button className={draft.destination === 'local' ? 'destination-card destination-card--active' : 'destination-card'} type="button" disabled={busy} onClick={() => setDraft({ ...draft, destination: 'local', projectId: '' })}><strong>This device</strong><span>Private · available in this browser</span></button></div>
    {draft.destination === 'cloud' && projects.length ? <label className="field field--wide"><span>Song project</span><select value={draft.projectId} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); setDraft({ ...draft, projectId: event.target.value, title: project?.title ?? draft.title, bpm: project?.bpm ? String(project.bpm) : draft.bpm, songKey: project?.songKey ?? draft.songKey }) }} disabled={busy}><option value="">Create a new song project</option>{projects.map((project) => <option key={project.id} value={project.id}>Add version to: {project.title}</option>)}</select></label> : null}
    <MetadataFields draft={draft} setDraft={setDraft} busy={busy} />
    <ArtworkPicker preview={draft.artworkPreview} busy={busy} onFile={(file, preview) => setDraft({ ...draft, artworkFile: file, artworkPreview: preview })} />
    {busy && draft.destination === 'cloud' ? <div className="upload-progress"><div><span>{progressLabel}</span><strong>{progress}%</strong></div><progress value={progress} max="100" /></div> : null}
    <div className="modal-actions"><button className="button button--secondary" type="button" onClick={() => setDraft(null)} disabled={busy}>CANCEL</button><button className="button button--primary" type="submit" disabled={busy}>{busy ? draft.destination === 'cloud' ? 'UPLOADING…' : 'SAVING…' : draft.destination === 'cloud' ? 'UPLOAD TO CLOUD' : 'SAVE ON DEVICE'}</button></div>
  </form></section></div>
}

function EditModal({ draft, setDraft, busy, onSubmit }: { draft: EditDraft; setDraft: (draft: EditDraft | null) => void; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDraft(null) }}><section className="modal-card modal-card--compact" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-card__head"><div><p className="eyebrow">TRACK DETAILS</p><h2 id="edit-title">Edit metadata</h2></div><button className="modal-close" type="button" onClick={() => setDraft(null)} disabled={busy}>×</button></div><form className="metadata-form" onSubmit={onSubmit}><MetadataFields draft={draft} setDraft={setDraft} busy={busy} /><ArtworkPicker preview={draft.artworkPreview ?? draft.track.artworkUrl} busy={busy} onFile={(file, preview) => setDraft({ ...draft, artworkFile: file, artworkPreview: preview })} /><div className="modal-actions"><button className="button button--secondary" type="button" onClick={() => setDraft(null)} disabled={busy}>CANCEL</button><button className="button button--primary" type="submit" disabled={busy}>{busy ? 'SAVING…' : draft.track.kind === 'cloud' ? 'SAVE TO CLOUD' : 'SAVE DETAILS'}</button></div></form></section></div>
}

function MetadataFields<T extends DraftFields>({ draft, setDraft, busy }: { draft: T; setDraft: (draft: T) => void; busy: boolean }) {
  return <div className="field-grid"><label className="field field--wide"><span>Track title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required disabled={busy} /></label><label className="field"><span>Artist</span><input value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} disabled={busy} /></label><label className="field"><span>Version</span><input value={draft.versionLabel} onChange={(event) => setDraft({ ...draft, versionLabel: event.target.value })} placeholder="Master, Mix 3, Demo" disabled={busy} /></label><label className="field"><span>BPM</span><input type="number" min="1" max="400" step="0.01" value={draft.bpm} onChange={(event) => setDraft({ ...draft, bpm: event.target.value })} placeholder="Optional" disabled={busy} /></label><label className="field"><span>Key</span><input value={draft.songKey} onChange={(event) => setDraft({ ...draft, songKey: event.target.value })} placeholder="C minor" disabled={busy} /></label></div>
}

function ArtworkPicker({ preview, busy, onFile }: { preview?: string; busy: boolean; onFile: (file: File, preview: string) => void }) {
  return <label className="artwork-picker"><span className="artwork-picker__preview">{preview ? <img src={preview} alt="Artwork preview" /> : 'J₵'}</span><span><strong>{preview ? 'Replace artwork' : 'Add artwork'}</strong><small>JPG, PNG, or WebP · optional</small></span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file, URL.createObjectURL(file)) }} /></label>
}
