import { describe, expect, it } from 'vitest'
import { videoUploadSchema } from './video'
import type { VideoUploadDraft } from '@/types/video'

function fileNamed(name: string): File {
  return new File(['content'], name)
}

function validDraft(): VideoUploadDraft {
  return {
    title: '  Presentación  ',
    video: fileNamed('intro.mp4'),
    subtitles: [
      { file: fileNamed('es.vtt'), label: 'Español', language: 'es' },
      { file: fileNamed('en.VTT'), label: 'English', language: 'en' },
    ],
    audioTracks: [
      { file: fileNamed('es.mp3'), label: 'Español', language: 'es' },
      { file: fileNamed('en.ogg'), label: 'English', language: 'en' },
    ],
  }
}

function messagesFor(draft: VideoUploadDraft): string[] {
  const result = videoUploadSchema.safeParse(draft)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('videoUploadSchema', () => {
  it('accepts a complete draft and trims text fields', () => {
    const result = videoUploadSchema.safeParse(validDraft())
    expect(result.success).toBe(true)
    expect(result.data?.title).toBe('Presentación')
  })

  it('requires a title', () => {
    expect(messagesFor({ ...validDraft(), title: '  ' })).toEqual(['El título es obligatorio.'])
  })

  it('limits the title to 120 characters', () => {
    expect(messagesFor({ ...validDraft(), title: 'a'.repeat(121) })).toEqual([
      'El título no puede superar los 120 caracteres.',
    ])
  })

  it('accepts an optional subtitle and trims it', () => {
    const result = videoUploadSchema.safeParse({ ...validDraft(), subtitle: '  Subtítulo opcional  ' })
    expect(result.success).toBe(true)
    expect(result.data?.subtitle).toBe('Subtítulo opcional')
  })

  it('limits the subtitle to 120 characters', () => {
    expect(messagesFor({ ...validDraft(), subtitle: 'a'.repeat(121) })).toEqual([
      'El subtítulo no puede superar los 120 caracteres.',
    ])
  })

  it('requires a video file', () => {
    expect(messagesFor({ ...validDraft(), video: null })).toEqual(['Selecciona un archivo de video.'])
  })

  it('rejects unsupported video formats', () => {
    expect(messagesFor({ ...validDraft(), video: fileNamed('clip.avi') })).toEqual([
      'El video debe ser .mp4 o .webm.',
    ])
  })

  it('rejects videos exceeding 400 MB', () => {
    const bigVideo = fileNamed('big.mp4')
    Object.defineProperty(bigVideo, 'size', { value: 400 * 1024 * 1024 + 1 })
    expect(messagesFor({ ...validDraft(), video: bigVideo })).toEqual([
      'El video puede pesar como máximo 400 MB.',
    ])
  })

  it('requires at least two subtitles and two audio tracks', () => {
    const draft = validDraft()
    expect(messagesFor({ ...draft, subtitles: draft.subtitles.slice(1), audioTracks: [] })).toEqual([
      'Agrega al menos 2 subtítulos.',
      'Agrega al menos 2 pistas de audio.',
    ])
  })

  it('requires .vtt subtitle files', () => {
    const draft = validDraft()
    draft.subtitles[0] = { ...draft.subtitles[0], file: fileNamed('es.srt') }
    expect(messagesFor(draft)).toEqual(['El subtítulo debe ser un archivo .vtt.'])
  })

  it('rejects unsupported audio formats', () => {
    const draft = validDraft()
    draft.audioTracks[1] = { ...draft.audioTracks[1], file: fileNamed('en.flac') }
    expect(messagesFor(draft)).toEqual(['La pista de audio debe ser .mp3, .m4a, .ogg, .wav o .aac.'])
  })

  it('accepts .aac audio files', () => {
    const draft = validDraft()
    draft.audioTracks[1] = { ...draft.audioTracks[1], file: fileNamed('en.aac') }
    expect(videoUploadSchema.safeParse(draft).success).toBe(true)
  })

  it('requires file, label and language on every track', () => {
    const draft = validDraft()
    draft.audioTracks[0] = { file: null, label: ' ', language: '' }
    expect(messagesFor(draft)).toEqual([
      'Selecciona un archivo.',
      'La etiqueta es obligatoria.',
      'El idioma es obligatorio.',
    ])
  })

  it('accepts an optional poster image', () => {
    const result = videoUploadSchema.safeParse({ ...validDraft(), poster: fileNamed('thumb.jpg') })
    expect(result.success).toBe(true)
  })

  it('rejects unsupported poster formats', () => {
    expect(messagesFor({ ...validDraft(), poster: fileNamed('thumb.gif') })).toEqual([
      'La miniatura debe ser .jpg, .jpeg, .png o .webp.',
    ])
  })

  it('rejects poster exceeding 10 MB', () => {
    const bigPoster = fileNamed('big.png')
    Object.defineProperty(bigPoster, 'size', { value: 10 * 1024 * 1024 + 1 })
    expect(messagesFor({ ...validDraft(), poster: bigPoster })).toEqual([
      'La miniatura puede pesar como máximo 10 MB.',
    ])
  })
})
