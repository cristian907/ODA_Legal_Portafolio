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

function serverErrors(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors
  const messages = Array.isArray(errors) ? errors.filter((item) => typeof item === 'string') : []
  return messages.length > 0 ? messages : [UNEXPECTED_ERROR_MESSAGE]
}

function errorFromStatus(status: number, body: unknown): VideoApiError {
  if (status === 0) return new VideoApiError('network', [NETWORK_ERROR_MESSAGE])
  const kind: VideoApiErrorKind = status >= 400 && status < 500 ? 'validation' : 'server'
  return new VideoApiError(kind, serverErrors(body))
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
      else reject(errorFromStatus(request.status, body))
    })
    request.addEventListener('error', () => reject(errorFromStatus(0, null)))
    request.send(buildUploadFormData(payload))
  })
}

export async function deleteVideoPackage(id: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${VIDEOS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    throw errorFromStatus(0, null)
  }
  if (!response.ok) throw errorFromStatus(response.status, await response.json().catch(() => null))
}
