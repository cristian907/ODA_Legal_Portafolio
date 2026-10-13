import type { VideoManifest, VideoTrackUpload, VideoUploadPayload } from '@/types/video'
import { classifyFailure, isSuccess, parseJson, requestJson } from './fileServerClient'

const VIDEOS_ENDPOINT = '/api/videos'

export type UploadProgressListener = (percent: number) => void

function trackMetadata(tracks: VideoTrackUpload[]): string {
  return JSON.stringify(tracks.map(({ label, language }) => ({ label, language })))
}

export function buildUploadFormData(payload: VideoUploadPayload): FormData {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.subtitle?.trim()) {
    formData.append('subtitle', payload.subtitle.trim())
  }
  formData.append('video', payload.video)
  if (payload.poster) {
    formData.append('poster', payload.poster)
  }
  payload.subtitles.forEach((track) => formData.append('subtitles', track.file))
  payload.audioTracks.forEach((track) => formData.append('audioTracks', track.file))
  formData.append('subtitleMeta', trackMetadata(payload.subtitles))
  formData.append('audioMeta', trackMetadata(payload.audioTracks))
  return formData
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
  await requestJson(`${VIDEOS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
