import { readAudioDuration, titleFromFileName, type TrackMetadata } from './library'
import { IMPORT_ACCENTS, type Track } from './tracks'

const SESSION_KEY = 'music-os-supabase-session-v2'
const LEGACY_SESSION_KEY = 'music-os-supabase-session-v1'
const BUCKET = 'music-assets'
const MAX_AUDIO_BYTES = 500 * 1024 * 1024

type CloudUser = { id: string; email?: string }
type CloudSession = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: CloudUser
}

type CloudProject = {
  id: string
  user_id: string
  title: string
  status: string
  bpm: number | null
  song_key: string | null
  artwork_path: string | null
  created_at: string
  updated_at: string
}

type CloudVersion = {
  id: string
  project_id: string
  user_id: string
  version_number: number
  label: string
  storage_path: string | null
  original_name: string | null
  mime_type: string | null
  byte_size: number | null
  duration_sec: number | null
  bpm: number | null
  song_key: string | null
  is_favorite: boolean
  created_at: string
}

type CloudRelease = {
  project_id: string
  artist_name: string | null
}

export type CloudProjectOption = {
  id: string
  title: string
  bpm?: number
  songKey?: string
}

export type CloudLibrary = {
  tracks: Track[]
  projects: CloudProjectOption[]
  user: CloudUser | null
  configured: boolean
}

export type CloudUploadInput = TrackMetadata & {
  file: File
  artworkFile?: File
  projectId?: string
}

type CloudConfig = { url: string; key: string }
let runtimeConfig: CloudConfig | null = null

export function setCloudConfig(config?: Partial<CloudConfig>): void {
  const url = config?.url?.trim().replace(/\/$/, '') ?? ''
  const key = config?.key?.trim() ?? ''
  runtimeConfig = url && key ? { url, key } : null
}

function metaContent(name: string): string {
  if (typeof document === 'undefined') return ''
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() ?? ''
}

function getConfig(): CloudConfig | null {
  if (runtimeConfig) return runtimeConfig
  const url = metaContent('music-os-supabase-url').replace(/\/$/, '')
  const key = metaContent('music-os-supabase-key')
  return url && key ? { url, key } : null
}

function readSession(): CloudSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as CloudSession
    if (!session.access_token || !session.refresh_token || !session.user?.id) return null
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.removeItem(LEGACY_SESSION_KEY)
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
    return null
  }
}

async function parseError(response: Response): Promise<Error> {
  const raw = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>
    const message = payload.message ?? payload.error_description ?? payload.error ?? payload.msg
    if (typeof message === 'string' && message) return new Error(message)
  } catch {
    // Preserve the response text below when it was not JSON.
  }
  return new Error(raw || `Cloud request failed (${response.status}).`)
}

async function validSession(config: CloudConfig): Promise<CloudSession | null> {
  const session = readSession()
  if (!session) return null
  if (session.expires_at > Date.now() + 15_000) return session

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  if (!response.ok) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  const payload = (await response.json()) as {
    access_token: string
    refresh_token: string
    expires_in?: number
    user: CloudUser
  }
  const refreshed: CloudSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + Math.max((payload.expires_in ?? 3600) - 30, 30) * 1000,
    user: payload.user,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed))
  return refreshed
}

async function cloudFetch(
  config: CloudConfig,
  session: CloudSession,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${session.access_token}`,
      ...(init.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  })
  if (!response.ok) throw await parseError(response)
  return response
}

async function rest<T>(
  config: CloudConfig,
  session: CloudSession,
  table: string,
  query = '',
  init: RequestInit = {},
  prefer = '',
): Promise<T> {
  const response = await cloudFetch(config, session, `/rest/v1/${table}${query ? `?${query}` : ''}`, {
    ...init,
    headers: {
      ...(prefer ? { Prefer: prefer } : {}),
      ...init.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function safeStorageName(name: string): string {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'file'
}

function storageContentType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'm4a') return 'audio/mp4'
  if (extension === 'mp3') return 'audio/mpeg'
  if (extension === 'wav') return 'audio/wav'
  if (extension === 'flac') return 'audio/flac'
  if (extension === 'aif' || extension === 'aiff') return 'audio/aiff'
  return file.type || 'application/octet-stream'
}

function uploadObject(
  config: CloudConfig,
  session: CloudSession,
  path: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${config.url}/storage/v1/object/${BUCKET}/${path}`)
    request.setRequestHeader('apikey', config.key)
    request.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    request.setRequestHeader('Content-Type', storageContentType(file))
    request.setRequestHeader('x-upsert', 'false')
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error('The upload lost its connection. Your local file was not changed.'))
    request.onabort = () => reject(new Error('Upload cancelled.'))
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else {
        let message = request.responseText || `Upload failed (${request.status}).`
        try {
          const payload = JSON.parse(request.responseText) as { message?: string; error?: string }
          message = payload.message || payload.error || message
        } catch {
          // Use the raw storage error.
        }
        reject(new Error(message))
      }
    }
    request.send(file)
  })
}

async function downloadObject(config: CloudConfig, session: CloudSession, path: string): Promise<Blob> {
  const response = await cloudFetch(config, session, `/storage/v1/object/authenticated/${BUCKET}/${path}`)
  return response.blob()
}

export async function loadCloudLibrary(): Promise<CloudLibrary> {
  const config = getConfig()
  if (!config) return { tracks: [], projects: [], user: null, configured: false }
  const session = await validSession(config)
  if (!session) return { tracks: [], projects: [], user: null, configured: true }

  const [projects, versions, releases] = await Promise.all([
    rest<CloudProject[]>(config, session, 'music_projects', 'select=id,user_id,title,status,bpm,song_key,artwork_path,created_at,updated_at&order=updated_at.desc'),
    rest<CloudVersion[]>(config, session, 'music_versions', 'select=id,project_id,user_id,version_number,label,storage_path,original_name,mime_type,byte_size,duration_sec,bpm,song_key,is_favorite,created_at&storage_path=not.is.null&order=created_at.desc'),
    rest<CloudRelease[]>(config, session, 'music_releases', 'select=project_id,artist_name'),
  ])
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const artistByProject = new Map(releases.map((release) => [release.project_id, release.artist_name || 'JOCYN']))
  const artworkByProject = new Map<string, string>()

  await Promise.all(projects.map(async (project) => {
    if (!project.artwork_path) return
    try {
      const artwork = await downloadObject(config, session, project.artwork_path)
      artworkByProject.set(project.id, URL.createObjectURL(artwork))
    } catch {
      // Artwork failure must not hide playable versions.
    }
  }))

  const tracks = versions.flatMap((version, index): Track[] => {
    const project = projectById.get(version.project_id)
    if (!project || !version.storage_path) return []
    return [{
      id: `cloud-${version.id}`,
      title: project.title,
      artist: artistByProject.get(project.id) ?? 'JOCYN',
      bpm: version.bpm ?? project.bpm ?? undefined,
      songKey: version.song_key ?? project.song_key ?? undefined,
      versionLabel: version.label,
      accent: IMPORT_ACCENTS[index % IMPORT_ACCENTS.length],
      duration: Number(version.duration_sec ?? 0),
      kind: 'cloud',
      notes: [],
      fileName: version.original_name ?? undefined,
      createdAt: new Date(version.created_at).getTime(),
      artworkUrl: artworkByProject.get(project.id),
      projectId: project.id,
      versionId: version.id,
      storagePath: version.storage_path,
      cloudFavorite: version.is_favorite,
    }]
  })

  return {
    tracks,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      bpm: project.bpm ?? undefined,
      songKey: project.song_key ?? undefined,
    })),
    user: session.user,
    configured: true,
  }
}

export async function downloadCloudTrack(track: Track): Promise<string> {
  if (track.kind !== 'cloud' || !track.storagePath) throw new Error('This cloud track does not have a playable file.')
  const config = getConfig()
  if (!config) throw new Error('Cloud storage is not configured.')
  const session = await validSession(config)
  if (!session) throw new Error('Sign in again to play this cloud track.')
  const blob = await downloadObject(config, session, track.storagePath)
  return URL.createObjectURL(blob)
}

export async function uploadCloudTrack(
  input: CloudUploadInput,
  onProgress: (percent: number, label: string) => void,
): Promise<void> {
  if (!input.file.size) throw new Error('The selected audio file is empty.')
  if (input.file.size > MAX_AUDIO_BYTES) throw new Error('Audio uploads must be smaller than 500 MB.')
  const config = getConfig()
  if (!config) throw new Error('Cloud storage is not configured.')
  const session = await validSession(config)
  if (!session) throw new Error('Sign in before uploading to the Cloud Library.')

  onProgress(2, 'Reading audio details')
  const duration = await readAudioDuration(input.file)
  let project: CloudProject
  if (input.projectId) {
    const matches = await rest<CloudProject[]>(config, session, 'music_projects', `select=id,user_id,title,status,bpm,song_key,artwork_path,created_at,updated_at&id=eq.${encodeURIComponent(input.projectId)}&limit=1`)
    if (!matches[0]) throw new Error('The selected song project could not be found.')
    project = matches[0]
    await rest(config, session, 'music_projects', `id=eq.${project.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: input.title.trim(), bpm: input.bpm ?? null, song_key: input.songKey?.trim() || null, last_opened_at: new Date().toISOString() }),
    }, 'return=minimal')
  } else {
    const created = await rest<CloudProject[]>(config, session, 'music_projects', '', {
      method: 'POST',
      body: JSON.stringify({
        user_id: session.user.id,
        title: input.title.trim() || titleFromFileName(input.file.name) || 'Untitled song',
        brief: 'Created from the JO₵YN Player.',
        status: 'in-progress',
        bpm: input.bpm ?? null,
        song_key: input.songKey?.trim() || null,
        readiness: 10,
        active_section: 'versions',
      }),
    }, 'return=representation')
    if (!created[0]) throw new Error('The cloud project could not be created.')
    project = created[0]
  }

  const recentVersions = await rest<Pick<CloudVersion, 'version_number'>[]>(config, session, 'music_versions', `select=version_number&project_id=eq.${project.id}&order=version_number.desc&limit=1`)
  const versionNumber = (recentVersions[0]?.version_number ?? 0) + 1
  const audioPath = `${session.user.id}/${project.id}/versions/${Date.now()}-${crypto.randomUUID()}-${safeStorageName(input.file.name)}`
  onProgress(5, 'Uploading audio')
  await uploadObject(config, session, audioPath, input.file, (value) => onProgress(5 + Math.round(value * 0.8), 'Uploading audio'))

  try {
    await rest(config, session, 'music_versions', '', {
      method: 'POST',
      body: JSON.stringify({
        project_id: project.id,
        user_id: session.user.id,
        version_number: versionNumber,
        label: input.versionLabel?.trim() || `Version ${versionNumber}`,
        notes: 'Uploaded from the JO₵YN Player.',
        storage_path: audioPath,
        original_name: input.file.name,
        mime_type: storageContentType(input.file),
        byte_size: input.file.size,
        duration_sec: duration,
        bpm: input.bpm ?? null,
        song_key: input.songKey?.trim() || null,
      }),
    }, 'return=minimal')
  } catch (error) {
    await cloudFetch(config, session, `/storage/v1/object/${BUCKET}/${audioPath}`, { method: 'DELETE' }).catch(() => undefined)
    throw error
  }

  onProgress(88, 'Saving track details')
  await rest(config, session, 'music_releases', 'on_conflict=project_id', {
    method: 'POST',
    body: JSON.stringify({
      project_id: project.id,
      user_id: session.user.id,
      release_title: input.title.trim(),
      artist_name: input.artist.trim() || 'JOCYN',
    }),
  }, 'resolution=merge-duplicates,return=minimal')

  if (input.artworkFile) {
    const artworkPath = `${session.user.id}/${project.id}/artwork/${Date.now()}-${crypto.randomUUID()}-${safeStorageName(input.artworkFile.name)}`
    await uploadObject(config, session, artworkPath, input.artworkFile, (value) => onProgress(90 + Math.round(value * 0.07), 'Uploading artwork'))
    await Promise.all([
      rest(config, session, 'music_assets', '', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          user_id: session.user.id,
          kind: 'artwork',
          label: 'Project artwork',
          storage_path: artworkPath,
          original_name: input.artworkFile.name,
          mime_type: input.artworkFile.type || 'image/jpeg',
          byte_size: input.artworkFile.size,
        }),
      }, 'return=minimal'),
      rest(config, session, 'music_projects', `id=eq.${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ artwork_path: artworkPath }),
      }, 'return=minimal'),
    ])
  }
  onProgress(100, 'Saved to Cloud Library')
}

export async function updateCloudTrack(
  track: Track,
  metadata: TrackMetadata,
  artworkFile?: File,
): Promise<void> {
  if (track.kind !== 'cloud' || !track.projectId || !track.versionId) throw new Error('This is not a cloud track.')
  const config = getConfig()
  if (!config) throw new Error('Cloud storage is not configured.')
  const session = await validSession(config)
  if (!session) throw new Error('Sign in again to update this track.')
  await Promise.all([
    rest(config, session, 'music_projects', `id=eq.${track.projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: metadata.title.trim(), bpm: metadata.bpm ?? null, song_key: metadata.songKey?.trim() || null }),
    }, 'return=minimal'),
    rest(config, session, 'music_versions', `id=eq.${track.versionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ label: metadata.versionLabel?.trim() || 'Master', bpm: metadata.bpm ?? null, song_key: metadata.songKey?.trim() || null }),
    }, 'return=minimal'),
    rest(config, session, 'music_releases', 'on_conflict=project_id', {
      method: 'POST',
      body: JSON.stringify({ project_id: track.projectId, user_id: session.user.id, release_title: metadata.title.trim(), artist_name: metadata.artist.trim() || 'JOCYN' }),
    }, 'resolution=merge-duplicates,return=minimal'),
  ])
  if (!artworkFile) return
  const artworkPath = `${session.user.id}/${track.projectId}/artwork/${Date.now()}-${crypto.randomUUID()}-${safeStorageName(artworkFile.name)}`
  await uploadObject(config, session, artworkPath, artworkFile, () => undefined)
  await Promise.all([
    rest(config, session, 'music_assets', '', {
      method: 'POST',
      body: JSON.stringify({ project_id: track.projectId, user_id: session.user.id, kind: 'artwork', label: 'Project artwork', storage_path: artworkPath, original_name: artworkFile.name, mime_type: artworkFile.type || 'image/jpeg', byte_size: artworkFile.size }),
    }, 'return=minimal'),
    rest(config, session, 'music_projects', `id=eq.${track.projectId}`, { method: 'PATCH', body: JSON.stringify({ artwork_path: artworkPath }) }, 'return=minimal'),
  ])
}

export async function setCloudFavorite(track: Track, favorite: boolean): Promise<void> {
  if (track.kind !== 'cloud' || !track.versionId) return
  const config = getConfig()
  if (!config) return
  const session = await validSession(config)
  if (!session) return
  await rest(config, session, 'music_versions', `id=eq.${track.versionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_favorite: favorite }),
  }, 'return=minimal')
}
