import { computed, ref, type Ref } from 'vue'

export type PlaybackToggleResult = 'played' | 'paused' | null

interface PlaybackOptions {
  startSecond: Ref<number>
  isScrubbing: Ref<boolean>
  onTimeUpdate?: (seconds: number) => void
  onDurationLoaded?: (seconds: number) => void
}

function bufferedEndAround(ranges: TimeRanges, time: number): number | null {
  for (let index = ranges.length - 1; index >= 0; index--) {
    if (ranges.start(index) <= time && ranges.end(index) >= time) return ranges.end(index)
  }
  return null
}

/** Mirrors the `<video>` playback state and exposes the commands that drive it. */
export function usePlayback(videoRef: Ref<HTMLVideoElement | null>, options: PlaybackOptions) {
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const bufferedEnd = ref(0)
  const isBuffering = ref(false)
  const isEnded = ref(false)
  const playbackRate = ref(1)

  const maxStartSecond = computed(() => Math.floor(duration.value))

  function hasPlayableStartSecond(): boolean {
    return options.startSecond.value > 0 && options.startSecond.value < duration.value
  }

  function seekTo(seconds: number): void {
    const video = videoRef.value
    if (!video || duration.value === 0) return
    const target = Math.max(0, Math.min(duration.value, seconds))
    video.currentTime = target
    currentTime.value = target
  }

  function rewindToStartSecondIfFresh(video: HTMLVideoElement): void {
    const isFreshStart = isEnded.value || video.currentTime === 0
    if (isFreshStart && hasPlayableStartSecond()) seekTo(options.startSecond.value)
  }

  async function play(): Promise<boolean> {
    const video = videoRef.value
    if (!video) return false
    rewindToStartSecondIfFresh(video)
    try {
      await video.play()
    } catch {
      return false
    }
    isPlaying.value = true
    isEnded.value = false
    return true
  }

  function pause(): void {
    videoRef.value?.pause()
    isPlaying.value = false
  }

  async function togglePlay(): Promise<PlaybackToggleResult> {
    const video = videoRef.value
    if (!video) return null
    if (video.paused || video.ended) return (await play()) ? 'played' : null
    pause()
    return 'paused'
  }

  function skip(seconds: number): void {
    const video = videoRef.value
    if (!video) return
    video.currentTime = Math.min(duration.value, Math.max(0, video.currentTime + seconds))
  }

  function setPlaybackRate(rate: number): void {
    playbackRate.value = rate
    if (videoRef.value) videoRef.value.playbackRate = rate
  }

  function onTimeUpdate(): void {
    const video = videoRef.value
    if (!video || options.isScrubbing.value) return
    currentTime.value = video.currentTime
    options.onTimeUpdate?.(video.currentTime)
    const end = bufferedEndAround(video.buffered, video.currentTime)
    if (end !== null) bufferedEnd.value = end
  }

  function onLoadedMetadata(): void {
    const video = videoRef.value
    if (!video) return
    duration.value = video.duration
    options.onDurationLoaded?.(video.duration)
    if (hasPlayableStartSecond()) seekTo(options.startSecond.value)
  }

  function onWaiting(): void {
    isBuffering.value = true
  }

  function onPlaying(): void {
    isBuffering.value = false
    isPlaying.value = true
    isEnded.value = false
  }

  function onPause(): void {
    isPlaying.value = false
  }

  function onEnded(): void {
    isPlaying.value = false
    isEnded.value = true
  }

  return {
    isPlaying,
    currentTime,
    duration,
    bufferedEnd,
    isBuffering,
    isEnded,
    playbackRate,
    maxStartSecond,
    togglePlay,
    skip,
    seekTo,
    setPlaybackRate,
    mediaListeners: { onTimeUpdate, onLoadedMetadata, onWaiting, onPlaying, onPause, onEnded },
  }
}
