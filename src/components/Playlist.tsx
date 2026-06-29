import type { Track } from '../data/tracks'
import { formatTime } from '../utils/formatTime'

interface PlaylistProps {
  tracks: Track[]
  currentIndex: number
  isPlaying: boolean
  onSelect: (index: number) => void
}

export function Playlist({ tracks, currentIndex, isPlaying, onSelect }: PlaylistProps) {
  return (
    <section className="playlist" aria-label="Playlist">
      <header className="playlist__header">
        <h2>Up Next</h2>
        <span className="playlist__count">{tracks.length} tracks</span>
      </header>
      <ol className="playlist__list">
        {tracks.map((track, index) => {
          const active = index === currentIndex
          return (
            <li key={track.id}>
              <button
                type="button"
                className={`track${active ? ' track--active' : ''}`}
                onClick={() => onSelect(index)}
                aria-current={active ? 'true' : undefined}
              >
                <span
                  className="track__art"
                  style={{
                    background: `linear-gradient(135deg, ${track.gradient[0]}, ${track.gradient[1]})`,
                  }}
                >
                  {active && isPlaying ? (
                    <span className="track__eq" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <span className="track__index">{index + 1}</span>
                  )}
                </span>
                <span className="track__meta">
                  <span className="track__title">{track.title}</span>
                  <span className="track__artist">{track.artist}</span>
                </span>
                <span className="track__duration">{formatTime(track.duration)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
