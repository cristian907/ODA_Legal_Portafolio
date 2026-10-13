import { computed, reactive } from 'vue'
import { videoUploadSchema } from '@/schemas/video'
import type { VideoTrackDraft, VideoUploadDraft } from '@/types/video'
import { missingRequirements } from './missingRequirements'
import { guessTrackLanguage } from './trackLanguage'

export type TrackKind = 'subtitles' | 'audioTracks'
export type TrackField = 'label' | 'language'

function emptyDraft(): VideoUploadDraft {
  return { title: '', subtitle: '', video: null, poster: null, subtitles: [], audioTracks: [] }
}

function trackFromFile(file: File): VideoTrackDraft {
  const guess = guessTrackLanguage(file.name)
  return { file, label: guess?.label ?? '', language: guess?.language ?? '' }
}

/** Reactive upload form state plus what still blocks publishing it. */
export function useVideoDraft() {
  const draft = reactive<VideoUploadDraft>(emptyDraft())

  const missing = computed(() => missingRequirements(draft))
  const isReady = computed(
    () => missing.value.length === 0 && videoUploadSchema.safeParse(draft).success,
  )

  function setVideo(file: File | null): void {
    draft.video = file
  }

  function setPoster(file: File | null): void {
    draft.poster = file
  }

  function addTracks(kind: TrackKind, files: File[]): void {
    draft[kind].push(...files.map(trackFromFile))
  }

  function updateTrack(kind: TrackKind, index: number, field: TrackField, value: string): void {
    const track = draft[kind][index]
    if (track) track[field] = value
  }

  function removeTrack(kind: TrackKind, index: number): void {
    draft[kind].splice(index, 1)
  }

  function reset(): void {
    Object.assign(draft, emptyDraft())
  }

  return { draft, missing, isReady, setVideo, setPoster, addTracks, updateTrack, removeTrack, reset }
}
