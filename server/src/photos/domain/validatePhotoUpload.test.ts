import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../domain/errors'
import { validatePhotoTransform, validatePhotoUpload } from './validatePhotoUpload'

const landscape = { width: 400, height: 200 }

function validTransform(): Record<string, unknown> {
  return {
    crop: { left: 0, top: 0, width: 200, height: 100 },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  }
}

function errorsOf(action: () => unknown): string[] {
  try {
    action()
  } catch (error) {
    if (error instanceof ValidationError) return error.errors
    throw error
  }
  return []
}

function transformErrors(transform: unknown, size = landscape): string[] {
  return errorsOf(() => validatePhotoTransform(transform, size))
}

describe('validatePhotoTransform', () => {
  it('returns the transform when it is valid', () => {
    expect(validatePhotoTransform(validTransform(), landscape)).toEqual(validTransform())
  })

  it('keeps only the known fields', () => {
    const transform = { ...validTransform(), extra: true, crop: { left: 0, top: 0, width: 1, height: 1, x: 3 } }
    expect(validatePhotoTransform(transform, landscape)).toEqual({
      ...validTransform(),
      crop: { left: 0, top: 0, width: 1, height: 1 },
    })
  })

  it('rejects a value that is not an object', () => {
    expect(transformErrors(null)).toEqual(['La transformación de la foto no tiene un formato válido.'])
    expect(transformErrors([])).toEqual(['La transformación de la foto no tiene un formato válido.'])
  })

  it('rejects a rotation that is not a quarter turn', () => {
    expect(transformErrors({ ...validTransform(), rotation: 45 })).toEqual([
      'La rotación debe ser 0, 90, 180 o 270 grados.',
    ])
  })

  it('rejects flips that are not booleans', () => {
    expect(transformErrors({ ...validTransform(), flipHorizontal: 'true' })).toEqual([
      'El volteo horizontal debe ser verdadero o falso.',
    ])
    expect(transformErrors({ ...validTransform(), flipVertical: 1 })).toEqual([
      'El volteo vertical debe ser verdadero o falso.',
    ])
  })

  it('rejects a crop that is missing or not made of non-negative integers', () => {
    const invalidMessage =
      'El recorte debe tener left y top enteros desde 0, y width y height enteros mayores que 0.'
    expect(transformErrors({ ...validTransform(), crop: undefined })).toEqual([invalidMessage])
    expect(transformErrors({ ...validTransform(), crop: { left: 0.5, top: 0, width: 10, height: 10 } })).toEqual([
      invalidMessage,
    ])
    expect(transformErrors({ ...validTransform(), crop: { left: -1, top: 0, width: 10, height: 10 } })).toEqual([
      invalidMessage,
    ])
    expect(transformErrors({ ...validTransform(), crop: { left: 0, top: 0, width: 0, height: 10 } })).toEqual([
      invalidMessage,
    ])
  })

  it('rejects a crop that leaves the image bounds', () => {
    const crop = { left: 300, top: 0, width: 101, height: 200 }
    expect(transformErrors({ ...validTransform(), crop })).toEqual([
      'El recorte se sale de los límites de la imagen (400×200 px).',
    ])
  })

  it('accepts a crop that touches the image edges exactly', () => {
    const crop = { left: 0, top: 0, width: 400, height: 200 }
    expect(transformErrors({ ...validTransform(), crop })).toEqual([])
  })

  it('checks the crop against the rotated dimensions', () => {
    const tallCrop = { left: 0, top: 0, width: 200, height: 400 }
    expect(transformErrors({ ...validTransform(), rotation: 90, crop: tallCrop })).toEqual([])
    expect(transformErrors({ ...validTransform(), rotation: 180, crop: tallCrop })).toEqual([
      'El recorte se sale de los límites de la imagen (400×200 px).',
    ])
    expect(transformErrors({ ...validTransform(), rotation: 270, crop: { ...tallCrop, width: 201 } })).toEqual([
      'El recorte se sale de los límites de la imagen (200×400 px).',
    ])
  })

  it('collects every error at once', () => {
    const errors = transformErrors({ crop: null, rotation: 1, flipHorizontal: null, flipVertical: null })
    expect(errors).toHaveLength(4)
  })
})

describe('validatePhotoUpload', () => {
  it('accepts jpg, jpeg, png and webp files regardless of case', () => {
    for (const fileName of ['a.jpg', 'b.JPEG', 'c.png', 'd.webp']) {
      expect(validatePhotoUpload({ fileName, transform: validTransform(), originalSize: landscape })).toEqual(
        validTransform(),
      )
    }
  })

  it('rejects other extensions together with transform errors', () => {
    const errors = errorsOf(() =>
      validatePhotoUpload({
        fileName: 'scan.gif',
        transform: { ...validTransform(), rotation: 30 },
        originalSize: landscape,
      }),
    )
    expect(errors).toEqual([
      'La foto "scan.gif" debe tener formato .jpg, .jpeg, .png o .webp.',
      'La rotación debe ser 0, 90, 180 o 270 grados.',
    ])
  })
})
