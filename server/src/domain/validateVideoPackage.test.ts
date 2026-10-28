import { describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import { validateVideoPackage, type VideoPackageCandidate } from './validateVideoPackage'

function validCandidate(): VideoPackageCandidate {
  return {
    title: '  Presentación del despacho  ',
    videos: [{ fileName: 'intro.mp4' }],
    subtitles: [
      { fileName: 'es.vtt', label: 'Español', language: 'es', contentStart: 'WEBVTT\n\n' },
      { fileName: 'en.vtt', label: 'English', language: 'en', contentStart: 'WEBVTT' },
    ],
    audioTracks: [
      { fileName: 'es.mp3', label: 'Español', language: 'es' },
      { fileName: 'en.m4a', label: 'English', language: 'en' },
    ],
  }
}

function errorsFor(candidate: VideoPackageCandidate): string[] {
  try {
    validateVideoPackage(candidate)
  } catch (error) {
    if (error instanceof ValidationError) return error.errors
    throw error
  }
  return []
}

describe('validateVideoPackage', () => {
  it('accepts a valid package and trims the title', () => {
    expect(validateVideoPackage(validCandidate()).title).toBe('Presentación del despacho')
  })

  it('rejects an empty title', () => {
    expect(errorsFor({ ...validCandidate(), title: '   ' })).toEqual(['El título es obligatorio.'])
  })

  it('rejects a title longer than 120 characters', () => {
    expect(errorsFor({ ...validCandidate(), title: 'a'.repeat(121) })).toEqual([
      'El título no puede superar los 120 caracteres.',
    ])
  })

  it('accepts and trims an optional subtitle', () => {
    expect(
      validateVideoPackage({ ...validCandidate(), subtitle: '  Subtítulo válido  ' }).subtitle,
    ).toBe('Subtítulo válido')
  })

  it('rejects a subtitle longer than 120 characters', () => {
    expect(errorsFor({ ...validCandidate(), subtitle: 'a'.repeat(121) })).toEqual([
      'El subtítulo no puede superar los 120 caracteres.',
    ])
  })

  it('requires exactly one video', () => {
    expect(errorsFor({ ...validCandidate(), videos: [] })).toEqual(['Debes adjuntar un archivo de video.'])
    const twoVideos = [{ fileName: 'a.mp4' }, { fileName: 'b.mp4' }]
    expect(errorsFor({ ...validCandidate(), videos: twoVideos })).toEqual([
      'Solo se permite un archivo de video.',
    ])
  })

  it('rejects a video with an unsupported extension', () => {
    expect(errorsFor({ ...validCandidate(), videos: [{ fileName: 'clip.avi' }] })).toEqual([
      'El video "clip.avi" debe tener formato .mp4 o .webm.',
    ])
  })

  it('accepts an optional poster image', () => {
    expect(validateVideoPackage({ ...validCandidate(), poster: { fileName: 'cover.jpg' } }).poster).toEqual({
      fileName: 'cover.jpg',
    })
  })

  it('rejects a poster with an unsupported extension', () => {
    expect(errorsFor({ ...validCandidate(), poster: { fileName: 'cover.gif' } })).toEqual([
      'La miniatura "cover.gif" debe tener formato .jpg, .jpeg, .png o .webp.',
    ])
  })

  it('requires at least two subtitles', () => {
    const candidate = validCandidate()
    expect(errorsFor({ ...candidate, subtitles: candidate.subtitles.slice(0, 1) })).toEqual([
      'Debes adjuntar al menos 2 subtítulos.',
    ])
  })

  it('requires at least two audio tracks', () => {
    const candidate = validCandidate()
    expect(errorsFor({ ...candidate, audioTracks: [] })).toEqual([
      'Debes adjuntar al menos 2 pistas de audio.',
    ])
  })

  it('requires label and language for every track', () => {
    const candidate = validCandidate()
    candidate.subtitles[0] = { ...candidate.subtitles[0], label: ' ', language: '' }
    candidate.audioTracks[1] = { ...candidate.audioTracks[1], label: '' }
    expect(errorsFor(candidate)).toEqual([
      'El subtítulo 1 necesita una etiqueta.',
      'El subtítulo 1 necesita un idioma.',
      'La pista de audio 2 necesita una etiqueta.',
    ])
  })

  it('rejects subtitles that are not .vtt files', () => {
    const candidate = validCandidate()
    candidate.subtitles[1] = { ...candidate.subtitles[1], fileName: 'en.srt' }
    expect(errorsFor(candidate)).toEqual(['El subtítulo 2 ("en.srt") debe tener formato .vtt.'])
  })

  it('rejects subtitles whose content does not start with WEBVTT', () => {
    const candidate = validCandidate()
    candidate.subtitles[0] = { ...candidate.subtitles[0], contentStart: '1\n00:00:01,000' }
    expect(errorsFor(candidate)).toEqual([
      'El subtítulo 1 ("es.vtt") no es un archivo WebVTT válido.',
    ])
  })

  it('accepts subtitles that start with a byte order mark', () => {
    const candidate = validCandidate()
    candidate.subtitles[0] = { ...candidate.subtitles[0], contentStart: '﻿WEBVTT\n' }
    expect(errorsFor(candidate)).toEqual([])
  })

  it('rejects audio tracks with an unsupported extension', () => {
    const candidate = validCandidate()
    candidate.audioTracks[0] = { ...candidate.audioTracks[0], fileName: 'es.flac' }
    expect(errorsFor(candidate)).toEqual([
      'La pista de audio 1 ("es.flac") debe tener formato .mp3, .m4a, .ogg, .wav o .aac.',
    ])
  })

  it('accepts .aac audio tracks', () => {
    const candidate = validCandidate()
    candidate.audioTracks[0] = { ...candidate.audioTracks[0], fileName: 'es.aac' }
    expect(errorsFor(candidate)).toEqual([])
  })

  it('collects every error at once', () => {
    const errors = errorsFor({ title: '', videos: [], subtitles: [], audioTracks: [] })
    expect(errors).toHaveLength(4)
  })
})
