import { describe, expect, it } from 'vitest'
import { buildUploadFormData } from './videoApi'
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
    expect(formData.get('subtitle')).toBeNull()
    expect(fileNames(formData, 'video')).toEqual(['intro.mp4'])
  })

  it('includes the subtitle when provided', () => {
    const formData = buildUploadFormData({ ...payload, subtitle: 'Conferencia legal' })
    expect(formData.get('subtitle')).toBe('Conferencia legal')
  })

  it('includes the poster when provided', () => {
    const formData = buildUploadFormData({ ...payload, poster: fileNamed('cover.jpg') })
    expect(fileNames(formData, 'poster')).toEqual(['cover.jpg'])
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
