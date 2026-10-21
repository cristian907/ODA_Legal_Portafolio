import type { AspectRatio, PhotoRotation, TransformedImageCrop } from '@/types/gallery'

interface Size {
  width: number
  height: number
}

export function aspectRatioValue(ratio: AspectRatio): number {
  const [width, height] = ratio.split(':').map(Number)
  return width / height
}

function rotatedSize(width: number, height: number, rotation: PhotoRotation): Size {
  const isQuarterTurn = rotation === 90 || rotation === 270
  return isQuarterTurn ? { width: height, height: width } : { width, height }
}

function clampLength(length: number, maximum: number): number {
  return Math.min(maximum, Math.max(1, Math.round(length)))
}

function largestSizeWithRatio(bounds: Size, ratio: number): Size {
  if (bounds.width / bounds.height > ratio) {
    return { width: clampLength(bounds.height * ratio, bounds.width), height: bounds.height }
  }
  return { width: bounds.width, height: clampLength(bounds.width / ratio, bounds.height) }
}

/**
 * Largest crop with the given ratio, centered in the image once rotated.
 * `width`/`height` are the auto-oriented original dimensions.
 */
export function centeredCrop(
  width: number,
  height: number,
  aspectRatio: AspectRatio,
  rotation: PhotoRotation,
): TransformedImageCrop {
  const bounds = rotatedSize(width, height, rotation)
  const size = largestSizeWithRatio(bounds, aspectRatioValue(aspectRatio))
  return {
    left: Math.floor((bounds.width - size.width) / 2),
    top: Math.floor((bounds.height - size.height) / 2),
    ...size,
  }
}
