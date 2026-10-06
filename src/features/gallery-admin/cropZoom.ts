import { centeredCrop } from '@/features/gallery/centeredCrop'
import type { AspectRatio } from '@/types/gallery'

interface Size {
  width: number
  height: number
}

/** How far the editor lets the person zoom in, relative to the largest crop. */
export const MAX_ZOOM = 5

function largestCrop(imageSize: Size, ratio: AspectRatio): Size {
  const { width, height } = centeredCrop(imageSize.width, imageSize.height, ratio, 0)
  return { width, height }
}

/** Magnification of `crop` against the largest crop with `ratio` that fits the (rotated) image. */
export function zoomLevel(crop: Size, imageSize: Size, ratio: AspectRatio): number {
  const level = largestCrop(imageSize, ratio).width / crop.width
  return Math.min(MAX_ZOOM, Math.max(1, level))
}

/** Smallest crop the cropper should allow, so wheel and slider share the same limit. */
export function minimumCropSize(imageSize: Size, ratio: AspectRatio): Size {
  const largest = largestCrop(imageSize, ratio)
  return { width: largest.width / MAX_ZOOM, height: largest.height / MAX_ZOOM }
}
