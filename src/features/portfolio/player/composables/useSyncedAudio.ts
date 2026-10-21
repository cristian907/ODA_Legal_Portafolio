import { onBeforeUnmount, watch, watchEffect, type Ref } from 'vue'
import { needsAudioResync } from '../utils/audioDrift'

function isPastAudioEnd(audio: HTMLAudioElement, time: number): boolean {
  return Number.isFinite(audio.duration) && time >= audio.duration
}

function playQuietly(audio: HTMLAudioElement): void {
  audio.play().catch(() => {})
}

/**
 * Plays the selected side-loaded audio track in lockstep with a muted `<video>`:
 * play/pause/seek/rate/buffering follow the video and drift beyond tolerance is corrected.
 */
export function useSyncedAudio(
  videoRef: Ref<HTMLVideoElement | null>,
  audioElements: Ref<HTMLAudioElement[]>,
  selectedIndex: Ref<number>,
  volume: Ref<number>,
  muted: Ref<boolean>,
) {
  function audioAt(index: number): HTMLAudioElement | null {
    return audioElements.value[index] ?? null
  }

  function activeAudio(): HTMLAudioElement | null {
    return audioAt(selectedIndex.value)
  }

  function alignWithVideo(audio: HTMLAudioElement, video: HTMLVideoElement): void {
    audio.currentTime = video.currentTime
  }

  function resyncIfDrifted(audio: HTMLAudioElement, video: HTMLVideoElement): void {
    if (needsAudioResync(audio.currentTime, video.currentTime)) alignWithVideo(audio, video)
  }

  function startActiveAudio(): void {
    const audio = activeAudio()
    const video = videoRef.value
    if (!audio || !video) return
    audio.playbackRate = video.playbackRate
    if (isPastAudioEnd(audio, video.currentTime)) {
      audio.pause()
      return
    }
    resyncIfDrifted(audio, video)
    playQuietly(audio)
  }

  function pauseActiveAudio(): void {
    activeAudio()?.pause()
  }

  function onVideoSeeking(): void {
    const audio = activeAudio()
    if (audio && videoRef.value) alignWithVideo(audio, videoRef.value)
  }

  function onVideoRateChange(): void {
    const rate = videoRef.value?.playbackRate ?? 1
    audioElements.value.forEach((audio) => {
      audio.playbackRate = rate
    })
  }

  function onVideoTimeUpdate(): void {
    const audio = activeAudio()
    const video = videoRef.value
    if (!audio || !video || video.paused || audio.seeking || audio.ended) return
    if (!isPastAudioEnd(audio, video.currentTime)) resyncIfDrifted(audio, video)
  }

  const videoListeners: Record<string, () => void> = {
    play: startActiveAudio,
    playing: startActiveAudio,
    pause: pauseActiveAudio,
    waiting: pauseActiveAudio,
    ended: pauseActiveAudio,
    seeking: onVideoSeeking,
    seeked: onVideoSeeking,
    ratechange: onVideoRateChange,
    timeupdate: onVideoTimeUpdate,
  }

  function listenTo(video: HTMLVideoElement): () => void {
    Object.entries(videoListeners).forEach(([event, listener]) => video.addEventListener(event, listener))
    return () => {
      Object.entries(videoListeners).forEach(([event, listener]) => video.removeEventListener(event, listener))
    }
  }

  watch(
    videoRef,
    (video, _previous, onCleanup) => {
      if (video) onCleanup(listenTo(video))
    },
    { immediate: true },
  )

  watch(selectedIndex, (nextIndex, previousIndex) => {
    audioAt(previousIndex)?.pause()
    const video = videoRef.value
    const nextAudio = audioAt(nextIndex)
    if (!video || !nextAudio) return
    alignWithVideo(nextAudio, video)
    if (!video.paused) startActiveAudio()
  })

  watchEffect(() => {
    audioElements.value.forEach((audio) => {
      audio.volume = volume.value
      audio.muted = muted.value
    })
  })

  onBeforeUnmount(() => audioElements.value.forEach((audio) => audio.pause()))
}
