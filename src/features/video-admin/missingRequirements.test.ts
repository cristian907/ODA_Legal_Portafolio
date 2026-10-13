import { describe, expect, it } from 'vitest'
import type { VideoTrackDraft, VideoUploadDraft } from '@/types/video'
import { missingRequirements } from './missingRequirements'

const file = (name: string) => new File(['x'], name)
const track = (name: string, label = 'Español', language = 'es'): VideoTrackDraft => ({
  file: file(name),
  label,
  language,
})

function completeDraft(): VideoUploadDraft {
  return {
    title: 'Presentación',
    video: file('demo.mp4'),
    subtitles: [track('es.vtt'), track('en.vtt', 'English', 'en')],
    audioTracks: [track('es.mp3'), track('en.mp3', 'English', 'en')],
  }
}

describe('missingRequirements', () => {
  it('returns nothing for a complete draft', () => {
    expect(missingRequirements(completeDraft())).toEqual([])
  })

  it('lists every requirement of an empty draft in form order', () => {
    expect(
      missingRequirements({ title: '', video: null, subtitles: [], audioTracks: [] }),
    ).toEqual(['Falta el título', 'Falta el video', 'Faltan 2 subtítulos', 'Faltan 2 pistas de audio'])
  })

  it('treats a whitespace-only title as missing', () => {
    expect(missingRequirements({ ...completeDraft(), title: '   ' })).toEqual(['Falta el título'])
  })

  it('reports a title over the length limit', () => {
    expect(missingRequirements({ ...completeDraft(), title: 'a'.repeat(121) })).toEqual([
      'El título supera los 120 caracteres',
    ])
  })

  it('reports a subtitle over the length limit', () => {
    expect(missingRequirements({ ...completeDraft(), subtitle: 'a'.repeat(121) })).toEqual([
      'El subtítulo supera los 120 caracteres',
    ])
  })

  it('reports a video over the size limit', () => {
    const draft = completeDraft()
    const bigVideo = file('big.mp4')
    Object.defineProperty(bigVideo, 'size', { value: 400 * 1024 * 1024 + 1 })
    draft.video = bigVideo
    expect(missingRequirements(draft)).toEqual(['El video supera los 400 MB'])
  })

  it('uses the singular when one track is missing', () => {
    const draft = completeDraft()
    draft.subtitles.pop()
    draft.audioTracks.pop()
    expect(missingRequirements(draft)).toEqual(['Falta 1 subtítulo', 'Falta 1 pista de audio'])
  })

  it('reports tracks without label or language', () => {
    const draft = completeDraft()
    draft.subtitles[0].label = ' '
    draft.audioTracks[0].language = ''
    draft.audioTracks[1].label = ''
    expect(missingRequirements(draft)).toEqual([
      'Completa la etiqueta y el idioma de 1 subtítulo',
      'Completa la etiqueta y el idioma de 2 pistas de audio',
    ])
  })

  it('does not count rows without a file', () => {
    const draft = completeDraft()
    draft.subtitles[1].file = null
    expect(missingRequirements(draft)).toEqual(['Falta 1 subtítulo'])
  })
})
