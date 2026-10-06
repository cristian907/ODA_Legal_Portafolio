import type { PhotoRecord, PhotoTransform } from '@/types/gallery'
import { requestJson } from './fileServerClient'

const PHOTOS_ENDPOINT = '/api/photos'

function photoUrl(id: string): string {
  return `${PHOTOS_ENDPOINT}/${encodeURIComponent(id)}`
}

export function buildPhotoFormData(file: File, transform: PhotoTransform): FormData {
  const formData = new FormData()
  formData.append('photo', file)
  formData.append('transform', JSON.stringify(transform))
  return formData
}

export async function uploadPhoto(file: File, transform: PhotoTransform): Promise<PhotoRecord> {
  const body = await requestJson(PHOTOS_ENDPOINT, { method: 'POST', body: buildPhotoFormData(file, transform) })
  return body as PhotoRecord
}

/** Re-renders the cropped version from the stored original; the record comes back with a new version. */
export async function recropPhoto(id: string, transform: PhotoTransform): Promise<PhotoRecord> {
  const body = await requestJson(`${photoUrl(id)}/crop`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transform }),
  })
  return body as PhotoRecord
}

export async function deletePhoto(id: string): Promise<void> {
  await requestJson(photoUrl(id), { method: 'DELETE' })
}
