import type { PhotoTransform } from './photoTransform'

export interface PhotoRecord {
  id: string
  originalPath: string
  /** Versioned file name (`cropped-<version>.webp`), so every re-crop busts caches. */
  croppedPath: string
  /** Dimensions after EXIF auto-orientation, before `transform.rotation`. */
  originalWidth: number
  originalHeight: number
  transform: PhotoTransform
  version: number
}
