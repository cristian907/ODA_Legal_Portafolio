import { z } from 'zod'
import type { AspectRatio } from '@/types/gallery'

export const ASPECT_RATIOS = ['4:3', '1:1', '3:4', '16:9'] as const satisfies readonly AspectRatio[]
export const PHOTO_TITLE_MAX_LENGTH = 80
export const PHOTO_ALT_MAX_LENGTH = 150
export const MIN_AUTOPLAY_INTERVAL_SECONDS = 2
export const MAX_AUTOPLAY_INTERVAL_SECONDS = 10
export const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

const INTERVAL_MESSAGE =
  `El intervalo debe ser un número entero entre ${MIN_AUTOPLAY_INTERVAL_SECONDS} y ` +
  `${MAX_AUTOPLAY_INTERVAL_SECONDS} segundos.`

function hasPhotoExtension(file: File): boolean {
  const name = file.name.toLowerCase()
  return PHOTO_EXTENSIONS.some((extension) => name.endsWith(extension))
}

/** Format and size refines skip non-files so a missing file reports only the "required" message. */
export const photoFileSchema = z
  .custom<File>((value) => value instanceof File, 'Selecciona una foto.')
  .refine((file) => !(file instanceof File) || hasPhotoExtension(file), 'La foto debe ser .jpg, .jpeg, .png o .webp.')
  .refine(
    (file) => !(file instanceof File) || file.size <= MAX_PHOTO_BYTES,
    `La foto puede pesar como máximo ${MAX_PHOTO_BYTES / (1024 * 1024)} MB.`,
  )

export const photoMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .max(PHOTO_TITLE_MAX_LENGTH, `El título no puede superar los ${PHOTO_TITLE_MAX_LENGTH} caracteres.`),
  alt: z
    .string()
    .trim()
    .max(PHOTO_ALT_MAX_LENGTH, `El texto alternativo no puede superar los ${PHOTO_ALT_MAX_LENGTH} caracteres.`),
})

export const gallerySettingsSchema = z.object({
  aspectRatio: z.enum(ASPECT_RATIOS, { message: 'La proporción debe ser 4:3, 1:1, 3:4 o 16:9.' }),
  autoplay: z.boolean(),
  autoplayIntervalSeconds: z
    .number()
    .int(INTERVAL_MESSAGE)
    .min(MIN_AUTOPLAY_INTERVAL_SECONDS, INTERVAL_MESSAGE)
    .max(MAX_AUTOPLAY_INTERVAL_SECONDS, INTERVAL_MESSAGE),
  loop: z.boolean(),
})
