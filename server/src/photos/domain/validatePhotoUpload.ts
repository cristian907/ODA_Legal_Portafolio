import { ALLOWED_PHOTO_EXTENSIONS } from '../../config'
import { ValidationError } from '../../domain/errors'
import { describeExtensions, hasAllowedExtension } from '../../domain/fileExtension'
import {
  PHOTO_ROTATIONS,
  transformedImageSize,
  type ImageSize,
  type PhotoRotation,
  type PhotoTransform,
  type TransformedImageCrop,
} from './photoTransform'

export interface PhotoUploadCandidate {
  fileName: string
  transform: unknown
  originalSize: ImageSize
}

type UnknownRecord = Record<string, unknown>

const INVALID_TRANSFORM_MESSAGE = 'La transformación de la foto no tiene un formato válido.'
const INVALID_CROP_MESSAGE =
  'El recorte debe tener left y top enteros desde 0, y width y height enteros mayores que 0.'

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPhotoRotation(value: unknown): value is PhotoRotation {
  return PHOTO_ROTATIONS.includes(value as PhotoRotation)
}

function isIntegerAtLeast(value: unknown, minimum: number): value is number {
  return Number.isInteger(value) && (value as number) >= minimum
}

function toCrop(value: unknown): TransformedImageCrop | null {
  if (!isRecord(value)) return null
  const { left, top, width, height } = value
  const isValid =
    isIntegerAtLeast(left, 0) && isIntegerAtLeast(top, 0) && isIntegerAtLeast(width, 1) && isIntegerAtLeast(height, 1)
  return isValid ? { left, top, width, height } : null
}

function fitsWithin(crop: TransformedImageCrop, bounds: ImageSize): boolean {
  return crop.left + crop.width <= bounds.width && crop.top + crop.height <= bounds.height
}

function cropErrors(crop: TransformedImageCrop | null, rotation: unknown, originalSize: ImageSize): string[] {
  if (!crop) return [INVALID_CROP_MESSAGE]
  if (!isPhotoRotation(rotation)) return []
  const bounds = transformedImageSize(originalSize, rotation)
  if (fitsWithin(crop, bounds)) return []
  return [`El recorte se sale de los límites de la imagen (${bounds.width}×${bounds.height} px).`]
}

function flipErrors(transform: UnknownRecord): string[] {
  const errors: string[] = []
  if (typeof transform.flipHorizontal !== 'boolean') {
    errors.push('El volteo horizontal debe ser verdadero o falso.')
  }
  if (typeof transform.flipVertical !== 'boolean') errors.push('El volteo vertical debe ser verdadero o falso.')
  return errors
}

function transformErrors(transform: unknown, originalSize: ImageSize): string[] {
  if (!isRecord(transform)) return [INVALID_TRANSFORM_MESSAGE]
  const rotationErrors = isPhotoRotation(transform.rotation) ? [] : ['La rotación debe ser 0, 90, 180 o 270 grados.']
  return [
    ...cropErrors(toCrop(transform.crop), transform.rotation, originalSize),
    ...rotationErrors,
    ...flipErrors(transform),
  ]
}

function toPhotoTransform(transform: UnknownRecord): PhotoTransform {
  return {
    crop: toCrop(transform.crop) as TransformedImageCrop,
    rotation: transform.rotation as PhotoRotation,
    flipHorizontal: transform.flipHorizontal as boolean,
    flipVertical: transform.flipVertical as boolean,
  }
}

function fileNameErrors(fileName: string): string[] {
  if (hasAllowedExtension(fileName, ALLOWED_PHOTO_EXTENSIONS)) return []
  return [`La foto "${fileName}" debe tener formato ${describeExtensions(ALLOWED_PHOTO_EXTENSIONS)}.`]
}

function throwIfAny(errors: string[]): void {
  if (errors.length > 0) throw new ValidationError(errors)
}

/** Validates a crop transform against the auto-oriented size of the original photo. */
export function validatePhotoTransform(transform: unknown, originalSize: ImageSize): PhotoTransform {
  throwIfAny(transformErrors(transform, originalSize))
  return toPhotoTransform(transform as UnknownRecord)
}

export function validatePhotoUpload(candidate: PhotoUploadCandidate): PhotoTransform {
  throwIfAny([
    ...fileNameErrors(candidate.fileName),
    ...transformErrors(candidate.transform, candidate.originalSize),
  ])
  return toPhotoTransform(candidate.transform as UnknownRecord)
}
