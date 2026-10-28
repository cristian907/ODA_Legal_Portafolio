import sharp, { type Sharp } from 'sharp'
import { CROPPED_PHOTO_MAX_WIDTH, CROPPED_PHOTO_WEBP_QUALITY } from '../config'
import { ProcessingError } from '../domain/errors'
import { isQuarterTurn, type PhotoTransform } from './domain/photoTransform'

interface SharpMirror {
  flip: boolean
  flop: boolean
}

/**
 * Sharp mirrors before rotating, while the transform mirrors the rotated image.
 * A quarter turn swaps the axes: mirroring after it equals mirroring the other
 * axis before it.
 */
function mirrorBeforeRotation(transform: PhotoTransform): SharpMirror {
  if (isQuarterTurn(transform.rotation)) {
    return { flip: transform.flipHorizontal, flop: transform.flipVertical }
  }
  return { flip: transform.flipVertical, flop: transform.flipHorizontal }
}

/** Sharp extracts before mirroring in one pipeline, so the oriented pixels are materialized first. */
async function orientedPixels(sourcePath: string, transform: PhotoTransform): Promise<Sharp> {
  const mirror = mirrorBeforeRotation(transform)
  const { data, info } = await sharp(sourcePath)
    .autoOrient()
    .rotate(transform.rotation)
    .flip(mirror.flip)
    .flop(mirror.flop)
    .raw()
    .toBuffer({ resolveWithObject: true })
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
}

/**
 * Renders the published version of a photo: auto-orient → rotate clockwise →
 * mirror → extract the crop → shrink to the maximum width → WebP.
 */
export async function renderCroppedPhoto(
  sourcePath: string,
  destinationPath: string,
  transform: PhotoTransform,
): Promise<void> {
  try {
    const oriented = await orientedPixels(sourcePath, transform)
    await oriented
      .extract(transform.crop)
      .resize({ width: CROPPED_PHOTO_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: CROPPED_PHOTO_WEBP_QUALITY })
      .toFile(destinationPath)
  } catch (error) {
    throw new ProcessingError('No se pudo recortar la foto.', { cause: error })
  }
}
