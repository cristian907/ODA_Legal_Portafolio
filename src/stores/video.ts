import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { readJSON, removeKey, writeJSON } from '@/composables/useLocalStorage'
import { videoUploadSchema } from '@/schemas/video'
import { deleteVideoPackage, uploadVideoPackage, VideoApiError } from '@/services/videoApi'
import type { VideoManifest, VideoUploadDraft } from '@/types/video'

const UNEXPECTED_PUBLISH_ERROR = 'No se pudo publicar el video. Inténtalo de nuevo.'

function errorMessages(error: unknown): string[] {
  return error instanceof VideoApiError ? error.errors : [UNEXPECTED_PUBLISH_ERROR]
}

/** Removing the old package is cleanup only; a failure must not undo a publish. */
async function deletePackageQuietly(id: string): Promise<void> {
  try {
    await deleteVideoPackage(id)
  } catch {
    // The orphaned folder only wastes local disk space.
  }
}

export const useVideoStore = defineStore('video', () => {
  const manifest = ref<VideoManifest | null>(
    readJSON<VideoManifest | null>(STORAGE_KEYS.VIDEO_MANIFEST, null),
  )
  const uploadProgress = ref(0)
  const isPublishing = ref(false)
  const errors = ref<string[]>([])

  function setManifest(next: VideoManifest | null): void {
    manifest.value = next
    if (next) writeJSON(STORAGE_KEYS.VIDEO_MANIFEST, next)
    else removeKey(STORAGE_KEYS.VIDEO_MANIFEST)
  }

  /** Validates, uploads and activates a package. Returns the new manifest, or null on failure. */
  async function publish(draft: VideoUploadDraft): Promise<VideoManifest | null> {
    errors.value = []
    const validation = videoUploadSchema.safeParse(draft)
    if (!validation.success) {
      errors.value = [...new Set(validation.error.issues.map((issue) => issue.message))]
      return null
    }

    const previousId = manifest.value?.id ?? null
    isPublishing.value = true
    uploadProgress.value = 0
    try {
      const published = await uploadVideoPackage(validation.data, (percent) => {
        uploadProgress.value = percent
      })
      setManifest(published)
      if (previousId && previousId !== published.id) await deletePackageQuietly(previousId)
      return published
    } catch (error) {
      errors.value = errorMessages(error)
      return null
    } finally {
      isPublishing.value = false
    }
  }

  /** Forgets the active video and best-effort removes its files from the server. */
  async function clear(): Promise<void> {
    const currentId = manifest.value?.id ?? null
    setManifest(null)
    errors.value = []
    uploadProgress.value = 0
    if (currentId) await deletePackageQuietly(currentId)
  }

  return {
    manifest,
    uploadProgress,
    isPublishing,
    errors,
    publish,
    clear,
  }
})
