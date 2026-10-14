/** Clockwise rotation in degrees, applied after EXIF auto-orientation. */
export type PhotoRotation = 0 | 90 | 180 | 270

/**
 * Integer pixel rectangle in the transformed image space: the original after
 * EXIF auto-orientation, then rotated clockwise by `rotation`, then mirrored.
 * Its bounds are the original size, with width/height swapped for 90/270.
 */
export interface TransformedImageCrop {
  left: number
  top: number
  width: number
  height: number
}

export interface PhotoTransform {
  crop: TransformedImageCrop
  rotation: PhotoRotation
  flipHorizontal: boolean
  flipVertical: boolean
}

/** Mirror of the record returned by the local file server (server/src/photos/domain/photoRecord.ts). */
export interface PhotoRecord {
  id: string
  originalPath: string
  /** Versioned per re-crop, so the URL itself busts caches. */
  croppedPath: string
  /** Dimensions after EXIF auto-orientation, before `transform.rotation`. */
  originalWidth: number
  originalHeight: number
  transform: PhotoTransform
  version: number
}

export interface PhotoMetadata {
  title: string
  alt: string
}

export interface GalleryPhoto extends PhotoRecord, PhotoMetadata {}

export interface PhotoChanges {
  transform?: PhotoTransform
  title?: string
  alt?: string
}

export type AspectRatio = '4:3' | '1:1' | '3:4' | '16:9'
export type DesktopPhotosPerView = 3 | 4 | 5
export type SlideStep = 'single' | 'group'

export interface GallerySettings {
  aspectRatio: AspectRatio
  autoplay: boolean
  autoplayIntervalSeconds: number
  loop: boolean
  itemsPerView: DesktopPhotosPerView
  slideStep: SlideStep
}
