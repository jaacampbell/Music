import { useAudioEngine } from './audio/useAudioEngine'
import { Player } from './components/Player'
import { Playlist } from './components/Playlist'
import './App.css'

function App() {
  const engine = useAudioEngine()

  return (
    <div className="app">
      <header className="app__brand">
        <span className="app__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M9 17a3 3 0 1 1-2-2.83V5l11-2v9.17A3 3 0 1 1 16 14V7.18L9 8.6z" />
          </svg>
        </span>
        <span className="app__name">Music</span>
      </header>

      <main className="app__main">
        <Player engine={engine} />
        <Playlist
          tracks={engine.tracks}
          currentIndex={engine.currentIndex}
          isPlaying={engine.isPlaying}
          onSelect={engine.select}
        />
      </main>

      <footer className="app__footer">
        Audio is synthesized live in your browser with the Web Audio API.
      </footer>
    </div>
  )
}

export default App
