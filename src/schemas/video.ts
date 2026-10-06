import { z } from 'zod'

export const VIDEO_TITLE_MAX_LENGTH = 120
export const MIN_SUBTITLES = 2
export const MIN_AUDIO_TRACKS = 2

export const VIDEO_EXTENSIONS = ['.mp4', '.webm'] as const
export const SUBTITLE_EXTENSIONS = ['.vtt'] as const
export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.ogg', '.wav'] as const

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
  video: fileSchema('Selecciona un archivo de video.', VIDEO_EXTENSIONS, 'El video debe ser .mp4 o .webm.'),
  subtitles: z
    .array(trackSchema(SUBTITLE_EXTENSIONS, 'El subtítulo debe ser un archivo .vtt.'))
    .min(MIN_SUBTITLES, `Agrega al menos ${MIN_SUBTITLES} subtítulos.`),
  audioTracks: z
    .array(trackSchema(AUDIO_EXTENSIONS, 'La pista de audio debe ser .mp3, .m4a, .ogg o .wav.'))
    .min(MIN_AUDIO_TRACKS, `Agrega al menos ${MIN_AUDIO_TRACKS} pistas de audio.`),
})
