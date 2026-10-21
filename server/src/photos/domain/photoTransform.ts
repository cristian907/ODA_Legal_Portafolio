export const PHOTO_ROTATIONS = [0, 90, 180, 270] as const

/** Clockwise rotation in degrees, applied after EXIF auto-orientation. */
export type PhotoRotation = (typeof PHOTO_ROTATIONS)[number]

export interface ImageSize {
  width: number
  height: number
}

/**
 * Integer pixel rectangle in the transformed image space: the original after
 * EXIF auto-orientation, then rotated clockwise by `rotation`, then mirrored
 * by `flipHorizontal` / `flipVertical`. Its bounds are `transformedImageSize`.
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

export function isQuarterTurn(rotation: PhotoRotation): boolean {
  return rotation === 90 || rotation === 270
}

/** Size of the auto-oriented image once rotated; flips never change it. */
export function transformedImageSize(orientedSize: ImageSize, rotation: PhotoRotation): ImageSize {
  if (!isQuarterTurn(rotation)) return orientedSize
  return { width: orientedSize.height, height: orientedSize.width }
}
