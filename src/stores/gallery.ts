import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readJSON, readRaw, writeJSON, writeRaw } from '@/composables/useLocalStorage'
import { reorder } from '@/features/gallery/galleryList'
import { restoreGallerySettings } from '@/features/gallery/gallerySettings'
import { isSameTransform, recenteredTransform } from '@/features/gallery/photoTransform'
import { gallerySettingsSchema, photoFileSchema, photoMetadataSchema } from '@/schemas/gallery'
import { FileServerError } from '@/services/fileServerClient'
import { deletePhoto, recropPhoto, uploadPhoto } from '@/services/photoApi'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type {
  AspectRatio,
  GalleryPhoto,
  GallerySettings,
  PhotoChanges,
  PhotoMetadata,
  PhotoRecord,
  PhotoTransform,
} from '@/types/gallery'
import type { z } from 'zod'

const UNEXPECTED_SAVE_ERROR = 'No se pudo guardar la foto. Inténtalo de nuevo.'
const PHOTO_NOT_FOUND_ERROR = 'La foto no existe.'
const RECROP_IN_PROGRESS_ERROR = 'Espera a que terminen de ajustarse las fotos.'

function errorMessages(error: unknown): string[] {
  return error instanceof FileServerError ? error.errors : [UNEXPECTED_SAVE_ERROR]
}

function issueMessages(...results: z.ZodSafeParseResult<unknown>[]): string[] {
  const messages = results.flatMap((result) => (result.success ? [] : result.error.issues.map((issue) => issue.message)))
  return [...new Set(messages)]
}

function recropFailureSummary(failedCount: number): string {
  const subject = failedCount === 1 ? '1 foto' : `${failedCount} fotos`
  return `No se pudo ajustar ${subject} a la nueva proporción.`
}

function restorePhotos(stored: unknown): GalleryPhoto[] {
  return Array.isArray(stored) ? (stored as GalleryPhoto[]) : []
}

/** Best-effort cleanup: a leftover folder on the server only wastes local disk space. */
async function deletePhotoQuietly(id: string): Promise<void> {
  try {
    await deletePhoto(id)
  } catch {
    // Ignored on purpose.
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  const photos = ref<GalleryPhoto[]>(restorePhotos(readJSON<unknown>(STORAGE_KEYS.GALLERY_PHOTOS, [])))
  const settings = ref<GallerySettings>(restoreGallerySettings(readJSON<unknown>(STORAGE_KEYS.GALLERY_SETTINGS, null)))
  const isGalleryEnabled = ref<boolean>(readRaw(STORAGE_KEYS.GALLERY_ENABLED, 'true') !== 'false')
  const isSaving = ref(false)
  const isRecropping = ref(false)
  const errors = ref<string[]>([])
  const recropFailures = ref<Record<string, string[]>>({})

  function setGalleryEnabled(enabled: boolean): void {
    isGalleryEnabled.value = enabled
    writeRaw(STORAGE_KEYS.GALLERY_ENABLED, String(enabled))
  }

  function setPhotos(next: GalleryPhoto[]): void {
    photos.value = next
    writeJSON(STORAGE_KEYS.GALLERY_PHOTOS, next)
  }

  function setSettings(next: GallerySettings): void {
    settings.value = next
    writeJSON(STORAGE_KEYS.GALLERY_SETTINGS, next)
  }

  function findPhoto(id: string): GalleryPhoto | undefined {
    return photos.value.find((photo) => photo.id === id)
  }

  function replacePhoto(updated: GalleryPhoto): void {
    setPhotos(photos.value.map((photo) => (photo.id === updated.id ? updated : photo)))
  }

  function mergeRecord(photo: GalleryPhoto, record: PhotoRecord): GalleryPhoto {
    return { ...record, title: photo.title, alt: photo.alt }
  }

  /** Uploads a photo with its crop and appends it. Returns the new photo, or null on failure. */
  async function addPhoto(file: File, transform: PhotoTransform, meta: PhotoMetadata): Promise<GalleryPhoto | null> {
    errors.value = []
    const fileResult = photoFileSchema.safeParse(file)
    const metaResult = photoMetadataSchema.safeParse(meta)
    if (!fileResult.success || !metaResult.success) {
      errors.value = issueMessages(fileResult, metaResult)
      return null
    }
    isSaving.value = true
    try {
      const added = { ...(await uploadPhoto(file, transform)), ...metaResult.data }
      setPhotos([...photos.value, added])
      return added
    } catch (error) {
      errors.value = errorMessages(error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function recordWithTransform(photo: GalleryPhoto, transform?: PhotoTransform): Promise<PhotoRecord> {
    if (!transform || isSameTransform(transform, photo.transform)) return photo
    return recropPhoto(photo.id, transform)
  }

  /** Updates metadata and, only when the transform changed, re-renders the crop. Returns null on failure. */
  async function updatePhoto(id: string, changes: PhotoChanges): Promise<GalleryPhoto | null> {
    errors.value = []
    const current = findPhoto(id)
    if (!current) {
      errors.value = [PHOTO_NOT_FOUND_ERROR]
      return null
    }
    const metaResult = photoMetadataSchema.safeParse({
      title: changes.title ?? current.title,
      alt: changes.alt ?? current.alt,
    })
    if (!metaResult.success) {
      errors.value = issueMessages(metaResult)
      return null
    }
    isSaving.value = true
    try {
      const updated = { ...(await recordWithTransform(current, changes.transform)), ...metaResult.data }
      replacePhoto(updated)
      return updated
    } catch (error) {
      errors.value = errorMessages(error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  /** Forgets the photo and best-effort removes its files from the server. */
  async function removePhoto(id: string): Promise<void> {
    setPhotos(photos.value.filter((photo) => photo.id !== id))
    const { [id]: _removed, ...remainingFailures } = recropFailures.value
    recropFailures.value = remainingFailures
    await deletePhotoQuietly(id)
  }

  function movePhoto(id: string, toIndex: number): void {
    const fromIndex = photos.value.findIndex((photo) => photo.id === id)
    setPhotos(reorder(photos.value, fromIndex, toIndex))
  }

  async function recropCentered(photo: GalleryPhoto, aspectRatio: AspectRatio): Promise<void> {
    try {
      const record = await recropPhoto(photo.id, recenteredTransform(photo, aspectRatio))
      const latest = findPhoto(photo.id)
      if (latest) replacePhoto(mergeRecord(latest, record))
    } catch (error) {
      recropFailures.value = { ...recropFailures.value, [photo.id]: errorMessages(error) }
    }
  }

  /** Re-crops every photo centered for the new ratio, sequentially; failed photos keep their old record. */
  async function recropAll(aspectRatio: AspectRatio): Promise<void> {
    isRecropping.value = true
    recropFailures.value = {}
    try {
      for (const photo of [...photos.value]) {
        if (findPhoto(photo.id)) await recropCentered(photo, aspectRatio)
      }
    } finally {
      isRecropping.value = false
    }
    const failedCount = Object.keys(recropFailures.value).length
    if (failedCount > 0) errors.value = [recropFailureSummary(failedCount)]
  }

  /** Validates and saves settings; a new aspect ratio re-crops every photo. Returns false when rejected. */
  async function updateSettings(changes: Partial<GallerySettings>): Promise<boolean> {
    errors.value = []
    const result = gallerySettingsSchema.safeParse({ ...settings.value, ...changes })
    if (!result.success) {
      errors.value = issueMessages(result)
      return false
    }
    const ratioChanged = result.data.aspectRatio !== settings.value.aspectRatio
    if (ratioChanged && isRecropping.value) {
      errors.value = [RECROP_IN_PROGRESS_ERROR]
      return false
    }
    setSettings(result.data)
    if (ratioChanged) await recropAll(result.data.aspectRatio)
    return true
  }

  return {
    photos,
    settings,
    isGalleryEnabled,
    setGalleryEnabled,
    isSaving,
    isRecropping,
    errors,
    recropFailures,
    addPhoto,
    updatePhoto,
    removePhoto,
    movePhoto,
    updateSettings,
  }
})
