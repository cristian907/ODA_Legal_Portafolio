import type { AspectRatio, PhotoRecord, PhotoTransform } from '@/types/gallery'
import { centeredCrop } from './centeredCrop'

type CroppablePhoto = Pick<PhotoRecord, 'originalWidth' | 'originalHeight' | 'transform'>

export function isSameTransform(a: PhotoTransform, b: PhotoTransform): boolean {
  return (
    a.rotation === b.rotation &&
    a.flipHorizontal === b.flipHorizontal &&
    a.flipVertical === b.flipVertical &&
    a.crop.left === b.crop.left &&
    a.crop.top === b.crop.top &&
    a.crop.width === b.crop.width &&
    a.crop.height === b.crop.height
  )
}

/** Same rotation and flips, with the crop re-centered for a new aspect ratio. */
export function recenteredTransform(photo: CroppablePhoto, aspectRatio: AspectRatio): PhotoTransform {
  const { originalWidth, originalHeight, transform } = photo
  return { ...transform, crop: centeredCrop(originalWidth, originalHeight, aspectRatio, transform.rotation) }
}
