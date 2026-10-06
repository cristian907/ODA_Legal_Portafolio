import type { VideoManifest, VideoTrackUpload, VideoUploadPayload } from '@/types/video'

const VIDEOS_ENDPOINT = '/api/videos'
const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor de archivos. Ejecuta `pnpm dev`.'
const UNEXPECTED_ERROR_MESSAGE = 'El servidor respondió con un error inesperado.'

export type VideoApiErrorKind = 'network' | 'validation' | 'server'

export class VideoApiError extends Error {
  readonly kind: VideoApiErrorKind
  readonly errors: string[]

  constructor(kind: VideoApiErrorKind, errors: string[]) {
    super(errors.join(' '))
    this.name = 'VideoApiError'
    this.kind = kind
    this.errors = errors
  }
}

export type UploadProgressListener = (percent: number) => void

function trackMetadata(tracks: VideoTrackUpload[]): string {
  return JSON.stringify(tracks.map(({ label, language }) => ({ label, language })))
}

export function buildUploadFormData(payload: VideoUploadPayload): FormData {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('video', payload.video)
  payload.subtitles.forEach((track) => formData.append('subtitles', track.file))
  payload.audioTracks.forEach((track) => formData.append('audioTracks', track.file))
  formData.append('subtitleMeta', trackMetadata(payload.subtitles))
  formData.append('audioMeta', trackMetadata(payload.audioTracks))
  return formData
}

function backendErrors(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors
  return Array.isArray(errors) ? errors.filter((item) => typeof item === 'string') : []
}

/**
 * Maps a failed response to a typed error. A 5xx without the backend's
 * `{ errors: string[] }` body comes from the dev proxy when the file server
 * is down, so it is reported as a network failure.
 */
export function classifyFailure(status: number, body: unknown): VideoApiError {
  const errors = backendErrors(body)
  const isProxyFailure = status >= 500 && errors.length === 0
  if (status === 0 || isProxyFailure) return new VideoApiError('network', [NETWORK_ERROR_MESSAGE])
  const kind: VideoApiErrorKind = status >= 400 && status < 500 ? 'validation' : 'server'
  return new VideoApiError(kind, errors.length > 0 ? errors : [UNEXPECTED_ERROR_MESSAGE])
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300
}

export function uploadVideoPackage(
  payload: VideoUploadPayload,
  onProgress?: UploadProgressListener,
): Promise<VideoManifest> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', VIDEOS_ENDPOINT)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      const body = parseJson(request.responseText)
      if (isSuccess(request.status) && body) resolve(body as VideoManifest)
      else reject(classifyFailure(request.status, body))
    })
    request.addEventListener('error', () => reject(classifyFailure(0, null)))
    request.send(buildUploadFormData(payload))
  })
}

export async function deleteVideoPackage(id: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${VIDEOS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    throw classifyFailure(0, null)
  }
  if (!response.ok) throw classifyFailure(response.status, await response.json().catch(() => null))
}
