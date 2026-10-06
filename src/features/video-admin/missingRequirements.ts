import { MIN_AUDIO_TRACKS, MIN_SUBTITLES, VIDEO_TITLE_MAX_LENGTH } from '@/schemas/video'
import type { VideoTrackDraft, VideoUploadDraft } from '@/types/video'

interface TrackNoun {
  singular: string
  plural: string
}

const SUBTITLE_NOUN: TrackNoun = { singular: 'subtítulo', plural: 'subtítulos' }
const AUDIO_NOUN: TrackNoun = { singular: 'pista de audio', plural: 'pistas de audio' }

function countNoun(count: number, noun: TrackNoun): string {
  return `${count} ${count === 1 ? noun.singular : noun.plural}`
}

function isIncomplete(track: VideoTrackDraft): boolean {
  return track.label.trim() === '' || track.language.trim() === ''
}

function trackRequirements(tracks: VideoTrackDraft[], minimum: number, noun: TrackNoun): string[] {
  const withFile = tracks.filter((track) => track.file !== null)
  const messages: string[] = []
  const missing = minimum - withFile.length
  if (missing > 0) messages.push(`${missing === 1 ? 'Falta' : 'Faltan'} ${countNoun(missing, noun)}`)
  const incomplete = withFile.filter(isIncomplete).length
  if (incomplete > 0) messages.push(`Completa la etiqueta y el idioma de ${countNoun(incomplete, noun)}`)
  return messages
}

/** Human-readable list of what still blocks publishing, in form order. Empty when ready. */
export function missingRequirements(draft: VideoUploadDraft): string[] {
  const messages: string[] = []
  const title = draft.title.trim()
  if (title === '') messages.push('Falta el título')
  else if (title.length > VIDEO_TITLE_MAX_LENGTH)
    messages.push(`El título supera los ${VIDEO_TITLE_MAX_LENGTH} caracteres`)
  if (!draft.video) messages.push('Falta el video')
  messages.push(...trackRequirements(draft.subtitles, MIN_SUBTITLES, SUBTITLE_NOUN))
  messages.push(...trackRequirements(draft.audioTracks, MIN_AUDIO_TRACKS, AUDIO_NOUN))
  return messages
}
