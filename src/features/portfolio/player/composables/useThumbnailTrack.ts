import { ref, watch, type Ref, type WatchSource } from 'vue'
import { parseThumbnailVtt, type ThumbnailCue } from '../utils/thumbnailVtt'

async function fetchThumbnailCues(url: string, signal: AbortSignal): Promise<ThumbnailCue[]> {
  const response = await fetch(url, { signal })
  if (!response.ok) return []
  const cues = parseThumbnailVtt(await response.text())
  return cues.map((cue) => ({ ...cue, url: new URL(cue.url, response.url).href }))
}

/** Loads the hover-preview cues of a thumbnail VTT; a failed load simply means no previews. */
export function useThumbnailTrack(vttUrl: WatchSource<string | null>): { cues: Ref<ThumbnailCue[]> } {
  const cues = ref<ThumbnailCue[]>([])

  watch(
    vttUrl,
    (url, _previousUrl, onCleanup) => {
      cues.value = []
      if (!url) return
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      fetchThumbnailCues(url, controller.signal)
        .then((loadedCues) => {
          cues.value = loadedCues
        })
        .catch(() => {})
    },
    { immediate: true },
  )

  return { cues }
}
