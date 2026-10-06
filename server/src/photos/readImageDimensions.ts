import sharp from 'sharp'
import { ValidationError } from '../domain/errors'
import type { ImageSize } from './domain/photoTransform'

/** Size of the image as displayed, i.e. after applying its EXIF orientation. */
export async function readImageDimensions(filePath: string): Promise<ImageSize> {
  try {
    const { autoOrient } = await sharp(filePath).metadata()
    return { width: autoOrient.width, height: autoOrient.height }
  } catch (error) {
    throw new ValidationError(['El archivo enviado no es una imagen válida.'], { cause: error })
  }
}
