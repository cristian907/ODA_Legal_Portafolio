import { z } from 'zod'

export const VIDEO_TITLE_MAX_LENGTH = 120
export const VIDEO_SUBTITLE_MAX_LENGTH = 120
export const MIN_SUBTITLES = 2
export const MIN_AUDIO_TRACKS = 2
export const MAX_VIDEO_BYTES = 400 * 1024 * 1024

export const VIDEO_EXTENSIONS = ['.mp4', '.webm'] as const
export const POSTER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
export const SUBTITLE_EXTENSIONS = ['.vtt'] as const
export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.ogg', '.wav', '.aac'] as const
export const MAX_POSTER_BYTES = 10 * 1024 * 1024

function hasExtension(file: File, extensions: readonly string[]): boolean {
  const name = file.name.toLowerCase()
  return extensions.some((extension) => name.endsWith(extension))
}

/**
 * A picked file with an allowed extension. The extension refine skips non-files
 * so a missing file reports only the "required" message.
 */
function fileSchema(requiredMessage: string, extensions: readonly string[], formatMessage: string) {
  return z
    .custom<File>((value) => value instanceof File, requiredMessage)
    .refine((file) => !(file instanceof File) || hasExtension(file, extensions), formatMessage)
}

function trackSchema(extensions: readonly string[], formatMessage: string) {
  return z.object({
    file: fileSchema('Selecciona un archivo.', extensions, formatMessage),
    label: z.string().trim().min(1, 'La etiqueta es obligatoria.'),
    language: z.string().trim().min(1, 'El idioma es obligatorio.'),
  })
}

export const videoUploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(VIDEO_TITLE_MAX_LENGTH, `El título no puede superar los ${VIDEO_TITLE_MAX_LENGTH} caracteres.`),
  subtitle: z
    .string()
    .trim()
    .max(VIDEO_SUBTITLE_MAX_LENGTH, `El subtítulo no puede superar los ${VIDEO_SUBTITLE_MAX_LENGTH} caracteres.`)
    .optional(),
  video: fileSchema('Selecciona un archivo de video.', VIDEO_EXTENSIONS, 'El video debe ser .mp4 o .webm.')
    .refine(
      (file) => !(file instanceof File) || file.size <= MAX_VIDEO_BYTES,
      `El video puede pesar como máximo ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`,
    ),
  poster: fileSchema(
    'Selecciona una imagen de miniatura.',
    POSTER_EXTENSIONS,
    'La miniatura debe ser .jpg, .jpeg, .png o .webp.',
  )
    .refine(
      (file) => !(file instanceof File) || file.size <= MAX_POSTER_BYTES,
      `La miniatura puede pesar como máximo ${MAX_POSTER_BYTES / (1024 * 1024)} MB.`,
    )
    .optional()
    .nullable(),
  subtitles: z
    .array(trackSchema(SUBTITLE_EXTENSIONS, 'El subtítulo debe ser un archivo .vtt.'))
    .min(MIN_SUBTITLES, `Agrega al menos ${MIN_SUBTITLES} subtítulos.`),
  audioTracks: z
    .array(trackSchema(AUDIO_EXTENSIONS, 'La pista de audio debe ser .mp3, .m4a, .ogg, .wav o .aac.'))
    .min(MIN_AUDIO_TRACKS, `Agrega al menos ${MIN_AUDIO_TRACKS} pistas de audio.`),
})
