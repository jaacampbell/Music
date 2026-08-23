import { IMPORT_ACCENTS, type Track } from './tracks'

const DATABASE_NAME = 'jocyn-music-player'
const DATABASE_VERSION = 2
const TRACK_STORE = 'local-tracks'

type StoredTrack = Omit<Track, 'kind' | 'notes' | 'sourceUrl'> & {
  blob: Blob
  artworkBlob?: Blob
}

export type TrackMetadata = {
  title: string
  artist: string
  bpm?: number
  songKey?: string
  versionLabel?: string
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error ?? new Error('Could not open the local music library.'))
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(TRACK_STORE)) {
        database.createObjectStore(TRACK_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function runTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(TRACK_STORE, mode)
        const request = action(transaction.objectStore(TRACK_STORE))
        let result!: T
        request.onsuccess = () => {
          result = request.result
        }
        request.onerror = () => reject(request.error ?? new Error('The local music library could not be updated.'))
        transaction.oncomplete = () => {
          database.close()
          resolve(result)
        }
        transaction.onerror = () => {
          database.close()
          reject(transaction.error ?? new Error('The local music library transaction failed.'))
        }
      }),
  )
}

export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file)
    const audio = new Audio()
    const cleanUp = () => {
      audio.onloadedmetadata = null
      audio.onerror = null
      audio.removeAttribute('src')
      audio.load()
      URL.revokeObjectURL(sourceUrl)
    }

    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      cleanUp()
      resolve(duration)
    }
    audio.onerror = () => {
      cleanUp()
      reject(new Error(`${file.name} could not be decoded by this browser.`))
    }
    audio.src = sourceUrl
  })
}

export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function importAudioFile(
  file: File,
  sequence: number,
  metadata?: Partial<TrackMetadata>,
  artworkFile?: File,
): Promise<Track> {
  const duration = await readAudioDuration(file)
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `local-${Date.now()}-${sequence}`
  const track: Track = {
    id,
    title: metadata?.title?.trim() || titleFromFileName(file.name) || 'Untitled recording',
    artist: metadata?.artist?.trim() || 'JOCYN',
    accent: IMPORT_ACCENTS[sequence % IMPORT_ACCENTS.length],
    duration,
    kind: 'local',
    notes: [],
    fileName: file.name,
    createdAt: Date.now(),
    bpm: metadata?.bpm,
    songKey: metadata?.songKey?.trim() || undefined,
    versionLabel: metadata?.versionLabel?.trim() || 'Imported master',
    artworkUrl: artworkFile ? URL.createObjectURL(artworkFile) : undefined,
  }

  const stored: StoredTrack = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    accent: track.accent,
    duration: track.duration,
    fileName: track.fileName,
    createdAt: track.createdAt,
    bpm: track.bpm,
    songKey: track.songKey,
    versionLabel: track.versionLabel,
    blob: file,
    artworkBlob: artworkFile,
  }
  await runTransaction('readwrite', (store) => store.put(stored))
  return { ...track, sourceUrl: URL.createObjectURL(file) }
}

export async function loadImportedTracks(): Promise<Track[]> {
  const stored = await runTransaction<StoredTrack[]>('readonly', (store) => store.getAll())
  return stored
    .sort((first, second) => (second.createdAt ?? 0) - (first.createdAt ?? 0))
    .map(({ blob, artworkBlob, ...track }) => ({
      ...track,
      kind: 'local' as const,
      notes: [],
      sourceUrl: URL.createObjectURL(blob),
      artworkUrl: artworkBlob ? URL.createObjectURL(artworkBlob) : undefined,
    }))
}

export async function updateImportedTrack(
  id: string,
  metadata: TrackMetadata,
  artworkFile?: File,
): Promise<Track> {
  const stored = await runTransaction<StoredTrack | undefined>('readonly', (store) => store.get(id))
  if (!stored) throw new Error('This track is no longer in the local library.')
  const next: StoredTrack = {
    ...stored,
    title: metadata.title.trim() || stored.title,
    artist: metadata.artist.trim() || stored.artist,
    bpm: metadata.bpm,
    songKey: metadata.songKey?.trim() || undefined,
    versionLabel: metadata.versionLabel?.trim() || 'Imported master',
    artworkBlob: artworkFile ?? stored.artworkBlob,
  }
  await runTransaction('readwrite', (store) => store.put(next))
  const { blob, artworkBlob, ...track } = next
  return {
    ...track,
    kind: 'local',
    notes: [],
    sourceUrl: URL.createObjectURL(blob),
    artworkUrl: artworkBlob ? URL.createObjectURL(artworkBlob) : undefined,
  }
}

export async function deleteImportedTrack(id: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(id))
}
