import type { ChangeEvent } from 'react'
import type { AudioEngine } from '../audio/useAudioEngine'
import { Visualizer } from './Visualizer'
import { formatTime } from '../utils/formatTime'

interface PlayerProps {
  engine: AudioEngine
}

export function Player({ engine }: PlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    analyser,
    toggle,
    next,
    prev,
    seek,
    setVolume,
  } = engine

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    seek(Number(event.target.value))
  }

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value))
  }

  return (
    <section className="player" aria-label="Now playing">
      <div
        className="player__art"
        style={{
          background: `linear-gradient(135deg, ${currentTrack.gradient[0]}, ${currentTrack.gradient[1]})`,
        }}
      >
        <Visualizer analyser={analyser} isPlaying={isPlaying} colors={['#ffffff', '#ffffff']} />
      </div>

      <div className="player__info">
        <p className="player__eyebrow">{isPlaying ? 'Now Playing' : 'Paused'}</p>
        <h1 className="player__title">{currentTrack.title}</h1>
        <p className="player__artist">{currentTrack.artist}</p>
      </div>

      <div className="player__progress">
        <span className="player__time">{formatTime(currentTime)}</span>
        <input
          className="player__seek"
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek"
          style={{ ['--progress' as string]: `${progress}%` }}
        />
        <span className="player__time">{formatTime(duration)}</span>
      </div>

      <div className="player__controls">
        <button type="button" className="ctrl" onClick={prev} aria-label="Previous track">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M6 6h2v12H6zM20 6v12L9 12z" />
          </svg>
        </button>
        <button
          type="button"
          className="ctrl ctrl--play"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button type="button" className="ctrl" onClick={next} aria-label="Next track">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M16 6h2v12h-2zM4 6l11 6L4 18z" />
          </svg>
        </button>
      </div>

      <label className="player__volume">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          aria-label="Volume"
          style={{ ['--progress' as string]: `${volume * 100}%` }}
        />
      </label>
    </section>
  )
}
