import { describe, expect, it } from 'vitest'
import { buildUploadFormData, classifyFailure } from './videoApi'
import type { VideoUploadPayload } from '@/types/video'

function fileNamed(name: string): File {
  return new File(['content'], name)
}

const payload: VideoUploadPayload = {
  title: 'Presentación',
  video: fileNamed('intro.mp4'),
  subtitles: [
    { file: fileNamed('es.vtt'), label: 'Español', language: 'es' },
    { file: fileNamed('en.vtt'), label: 'English', language: 'en' },
  ],
  audioTracks: [
    { file: fileNamed('es.mp3'), label: 'Español', language: 'es' },
    { file: fileNamed('en.ogg'), label: 'English', language: 'en' },
  ],
}

function fileNames(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((entry) => (entry as File).name)
}

describe('buildUploadFormData', () => {
  it('includes the title and the video file', () => {
    const formData = buildUploadFormData(payload)
    expect(formData.get('title')).toBe('Presentación')
    expect(fileNames(formData, 'video')).toEqual(['intro.mp4'])
  })

  it('appends tracks in order', () => {
    const formData = buildUploadFormData(payload)
    expect(fileNames(formData, 'subtitles')).toEqual(['es.vtt', 'en.vtt'])
    expect(fileNames(formData, 'audioTracks')).toEqual(['es.mp3', 'en.ogg'])
  })

  it('serializes track metadata aligned with the file order', () => {
    const formData = buildUploadFormData(payload)
    expect(JSON.parse(formData.get('subtitleMeta') as string)).toEqual([
      { label: 'Español', language: 'es' },
      { label: 'English', language: 'en' },
    ])
    expect(JSON.parse(formData.get('audioMeta') as string)).toEqual([
      { label: 'Español', language: 'es' },
      { label: 'English', language: 'en' },
    ])
  })
})

describe('classifyFailure', () => {
  it('reports a missing response as a network error', () => {
    const error = classifyFailure(0, null)
    expect(error.kind).toBe('network')
    expect(error.errors[0]).toContain('pnpm dev')
  })

  it('reports a dev proxy failure without the backend error shape as a network error', () => {
    const error = classifyFailure(500, null)
    expect(error.kind).toBe('network')
    expect(error.errors[0]).toContain('pnpm dev')
  })

  it('reports a backend 5xx with its error list as a server error', () => {
    const error = classifyFailure(500, { errors: ['No se pudo guardar el video.'] })
    expect(error).toMatchObject({ kind: 'server', errors: ['No se pudo guardar el video.'] })
  })

  it('reports a 4xx with its error list as a validation error', () => {
    const error = classifyFailure(400, { errors: ['El título es obligatorio.'] })
    expect(error).toMatchObject({ kind: 'validation', errors: ['El título es obligatorio.'] })
  })

  it('falls back to a generic message for a 4xx without an error list', () => {
    const error = classifyFailure(404, null)
    expect(error).toMatchObject({
      kind: 'validation',
      errors: ['El servidor respondió con un error inesperado.'],
    })
  })
})
