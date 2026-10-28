import { ref, watch, type Ref } from 'vue'
import { SUBTITLES_OFF } from '../types'
import { cueToPlainText } from '../utils/cueText'

function activeCueText(track: TextTrack): string {
  return Array.from(track.activeCues ?? [])
    .map((cue) => cueToPlainText((cue as VTTCue).text ?? ''))
    .filter(Boolean)
    .join('\n')
}

/**
 * Keeps every `<track>` of the video in `hidden` mode (loaded, never rendered natively)
 * and exposes the active cue text of the selected one for the custom overlay.
 */
export function useSubtitles(videoRef: Ref<HTMLVideoElement | null>, trackCount: () => number) {
  const selectedSubtitle = ref(SUBTITLES_OFF)
  const activeText = ref('')
  let lastSelectedSubtitle = 0

  function selectSubtitle(index: number): void {
    selectedSubtitle.value = index
    if (index !== SUBTITLES_OFF) lastSelectedSubtitle = index
  }

  function toggleSubtitles(): void {
    if (selectedSubtitle.value !== SUBTITLES_OFF) selectSubtitle(SUBTITLES_OFF)
    else if (trackCount() > 0) selectSubtitle(Math.min(lastSelectedSubtitle, trackCount() - 1))
  }

  function listenToSelectedTrack(video: HTMLVideoElement, index: number): (() => void) | undefined {
    const tracks = Array.from(video.textTracks)
    tracks.forEach((track) => {
      track.mode = 'hidden'
    })
    const selectedTrack = tracks[index]
    if (!selectedTrack) return undefined
    const renderActiveCues = () => {
      activeText.value = activeCueText(selectedTrack)
    }
    selectedTrack.addEventListener('cuechange', renderActiveCues)
    renderActiveCues()
    return () => selectedTrack.removeEventListener('cuechange', renderActiveCues)
  }

  watch(
    [videoRef, selectedSubtitle, trackCount],
    ([video, index], _previous, onCleanup) => {
      activeText.value = ''
      if (!video) return
      const stopListening = listenToSelectedTrack(video, index)
      if (stopListening) onCleanup(stopListening)
    },
    { immediate: true, flush: 'post' },
  )

  return { selectedSubtitle, activeText, selectSubtitle, toggleSubtitles }
}
