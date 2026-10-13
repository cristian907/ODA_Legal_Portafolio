import { describe, expect, it } from 'vitest'
import { gallerySettingsSchema, photoFileSchema, photoMetadataSchema } from './gallery'

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }): string[] {
  return result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message)
}

describe('photoMetadataSchema', () => {
  it('trims title and alt', () => {
    expect(photoMetadataSchema.parse({ title: '  Oficina  ', alt: '  Sala de reuniones  ' })).toEqual({
      title: 'Oficina',
      alt: 'Sala de reuniones',
    })
  })

  it('allows an empty title', () => {
    expect(messages(photoMetadataSchema.safeParse({ title: '', alt: 'Recepción' }))).toEqual([])
  })

  it('limits the title to 80 characters', () => {
    expect(messages(photoMetadataSchema.safeParse({ title: 'a'.repeat(81), alt: 'Recepción' }))).toEqual([
      'El título no puede superar los 80 caracteres.',
    ])
  })

  it('allows an empty alt text and caps it at 150 characters', () => {
    expect(photoMetadataSchema.parse({ title: '', alt: '   ' })).toEqual({ title: '', alt: '' })
    expect(messages(photoMetadataSchema.safeParse({ title: '', alt: 'a'.repeat(151) }))).toEqual([
      'El texto alternativo no puede superar los 150 caracteres.',
    ])
  })
})

describe('photoFileSchema', () => {
  it('accepts jpg, jpeg, png and webp images', () => {
    for (const name of ['a.jpg', 'b.JPEG', 'c.png', 'd.webp']) {
      expect(messages(photoFileSchema.safeParse(new File(['x'], name)))).toEqual([])
    }
  })

  it('rejects other formats and missing files', () => {
    expect(messages(photoFileSchema.safeParse(new File(['x'], 'scan.gif')))).toEqual([
      'La foto debe ser .jpg, .jpeg, .png o .webp.',
    ])
    expect(messages(photoFileSchema.safeParse(null))).toEqual(['Selecciona una foto.'])
  })

  it('rejects files over 10 MB', () => {
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg')
    expect(messages(photoFileSchema.safeParse(tooLarge))).toEqual(['La foto puede pesar como máximo 10 MB.'])
  })
})

describe('gallerySettingsSchema', () => {
  const valid = { aspectRatio: '4:3', autoplay: true, autoplayIntervalSeconds: 5, loop: true }

  it('accepts valid settings', () => {
    expect(gallerySettingsSchema.parse(valid)).toEqual(valid)
  })

  it('rejects unknown aspect ratios', () => {
    expect(messages(gallerySettingsSchema.safeParse({ ...valid, aspectRatio: '2:1' }))).toEqual([
      'La proporción debe ser 4:3, 1:1, 3:4 o 16:9.',
    ])
  })

  it('keeps the autoplay interval between 2 and 10 whole seconds', () => {
    const intervalMessage = 'El intervalo debe ser un número entero entre 2 y 10 segundos.'
    for (const autoplayIntervalSeconds of [1, 11, 2.5]) {
      expect(messages(gallerySettingsSchema.safeParse({ ...valid, autoplayIntervalSeconds }))).toEqual([
        intervalMessage,
      ])
    }
    expect(messages(gallerySettingsSchema.safeParse({ ...valid, autoplayIntervalSeconds: 10 }))).toEqual([])
  })
})
