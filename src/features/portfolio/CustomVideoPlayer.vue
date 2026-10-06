<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import PlayerControlsBar from './player/PlayerControlsBar.vue'
import PlayerEndScreen from './player/PlayerEndScreen.vue'
import PlayerFeedbackLayer from './player/PlayerFeedbackLayer.vue'
import PlayerProgressBar from './player/PlayerProgressBar.vue'
import PlayerSettingsMenu from './player/PlayerSettingsMenu.vue'
import PlayerSubtitleOverlay from './player/PlayerSubtitleOverlay.vue'
import PlayerTitleOverlay from './player/PlayerTitleOverlay.vue'
import { useControlsVisibility } from './player/composables/useControlsVisibility'
import { useFullscreen } from './player/composables/useFullscreen'
import { usePictureInPicture } from './player/composables/usePictureInPicture'
import { usePlayback } from './player/composables/usePlayback'
import { usePlayerFeedback } from './player/composables/usePlayerFeedback'
import { usePlayerKeyboard } from './player/composables/usePlayerKeyboard'
import { useVideoAreaClicks } from './player/composables/useVideoAreaClicks'
import { useVolume } from './player/composables/useVolume'
import { SUBTITLES_OFF, type PlayerMenuOption } from './player/types'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    theaterMode?: boolean
    startTime?: number
  }>(),
  {
    title: 'Volcano Smoke, Fire & Heat Flame',
    theaterMode: false,
    startTime: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:theaterMode', value: boolean): void
  (e: 'duration-loaded', duration: number): void
  (e: 'time-update', currentTime: number): void
  (e: 'update:startTime', value: number): void
}>()

const DOUBLE_CLICK_REWIND_ZONE = 0.35
const DOUBLE_CLICK_FORWARD_ZONE = 0.65
const DOUBLE_CLICK_SKIP_SECONDS = 10

const containerRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

const startSecond = ref(props.startTime || 0)
const isScrubbing = ref(false)
const isSettingsOpen = ref(false)

const playback = usePlayback(videoRef, {
  startSecond,
  isScrubbing,
  onTimeUpdate: (seconds) => emit('time-update', seconds),
  onDurationLoaded: (seconds) => emit('duration-loaded', seconds),
})
const { isPlaying, currentTime, duration, bufferedEnd, isBuffering, isEnded, playbackRate, maxStartSecond } =
  playback
const { volume, isMuted, setVolume, toggleMute, changeVolumeBy } = useVolume()
const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)
const { isPiPSupported, togglePiP } = usePictureInPicture(videoRef)
const { centerFeedback, sideFeedback, showCenterFeedback, showSideFeedback } = usePlayerFeedback()
const { showControls, revealControls, hideControlsIfIdle } = useControlsVisibility({
  isPlaying,
  isPinned: () => isSettingsOpen.value || isScrubbing.value,
})

const subtitleOptions: PlayerMenuOption[] = [
  { value: SUBTITLES_OFF, label: 'Desactivados' },
  { value: 0, label: 'Español (generados automáticamente)' },
  { value: 1, label: 'Inglés' },
]
const simulatedSubtitleTexts = ['[Fuego volcánico crepitante y nubes de ceniza]', '[Crackle of volcano flames and ash clouds]']
const selectedSubtitle = ref(SUBTITLES_OFF)
const subtitleText = computed(() => simulatedSubtitleTexts[selectedSubtitle.value] ?? '')

const audioOptions: PlayerMenuOption[] = [
  { value: 0, label: 'Original (Estéreo)', hint: 'Predeterminado' },
  { value: 1, label: 'Español (Doblaje)' },
  { value: 2, label: 'Sonido ambiental' },
]
const selectedAudio = ref(0)

function toggleSubtitles(): void {
  selectedSubtitle.value = selectedSubtitle.value === SUBTITLES_OFF ? 0 : SUBTITLES_OFF
}

async function togglePlay(): Promise<void> {
  const result = await playback.togglePlay()
  if (result) showCenterFeedback(result === 'played' ? 'fa-play' : 'fa-pause')
  revealControls()
}

function skip(seconds: number): void {
  playback.skip(seconds)
  revealControls()
}

function skipWithFeedback(seconds: number): void {
  skip(seconds)
  showSideFeedback(`${seconds > 0 ? '+' : ''}${seconds}s`, seconds < 0 ? 'left' : 'right')
}

function seekToPercent(percent: number): void {
  playback.seekTo((percent / 100) * duration.value)
}

function onDoubleClick(event: MouseEvent): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const widthRatio = (event.clientX - rect.left) / rect.width
  if (widthRatio < DOUBLE_CLICK_REWIND_ZONE) skipWithFeedback(-DOUBLE_CLICK_SKIP_SECONDS)
  else if (widthRatio > DOUBLE_CLICK_FORWARD_ZONE) skipWithFeedback(DOUBLE_CLICK_SKIP_SECONDS)
  else toggleFullscreen()
}

const { onVideoAreaClick } = useVideoAreaClicks(togglePlay, onDoubleClick)

const { onKeyDown } = usePlayerKeyboard({
  togglePlay,
  toggleFullscreen,
  toggleMute,
  toggleSubtitles,
  skip: skipWithFeedback,
  changeVolumeBy,
  seekToPercent,
})

function onStartSecondChange(seconds: number): void {
  startSecond.value = seconds
  playback.seekTo(seconds)
  emit('update:startTime', seconds)
}

function toggleTheaterMode(): void {
  emit('update:theaterMode', !props.theaterMode)
}

watchEffect(() => {
  const video = videoRef.value
  if (!video) return
  video.volume = volume.value
  video.muted = isMuted.value
})

watch(
  () => props.startTime,
  (nextStart) => {
    startSecond.value = nextStart || 0
    if (duration.value === 0 || isPlaying.value) return
    playback.seekTo(Math.min(Math.floor(duration.value), Math.floor(nextStart || 0)))
  },
)

defineExpose({
  seekTo: playback.seekTo,
  getCurrentTime: () => currentTime.value,
  duration,
  currentTime,
  isPlaying,
})
</script>

<template>
  <div
    ref="containerRef"
    tabindex="0"
    class="yt-player-container group relative mx-auto w-full select-none overflow-hidden rounded-2xl bg-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] outline-none transition-all duration-300"
    :class="{
      'cursor-none': !showControls && isPlaying,
      'is-fullscreen': isFullscreen,
    }"
    @mousemove="revealControls"
    @mouseleave="hideControlsIfIdle"
    @keydown="onKeyDown"
  >
    <video
      ref="videoRef"
      :src="src"
      class="h-full w-full object-contain"
      playsinline
      preload="metadata"
      @timeupdate="playback.mediaListeners.onTimeUpdate"
      @loadedmetadata="playback.mediaListeners.onLoadedMetadata"
      @waiting="playback.mediaListeners.onWaiting"
      @playing="playback.mediaListeners.onPlaying"
      @pause="playback.mediaListeners.onPause"
      @ended="playback.mediaListeners.onEnded"
      @click="onVideoAreaClick"
    ></video>

    <PlayerTitleOverlay :title="title" :visible="showControls" />

    <PlayerSubtitleOverlay v-if="subtitleText" :text="subtitleText" />

    <PlayerFeedbackLayer :is-buffering="isBuffering" :center-feedback="centerFeedback" :side-feedback="sideFeedback" />

    <PlayerEndScreen v-if="isEnded" @replay="togglePlay" />

    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300"
      :class="showControls ? 'opacity-100' : 'pointer-events-none opacity-0'"
      @click.stop
    >
      <PlayerProgressBar
        v-model:scrubbing="isScrubbing"
        :current-time="currentTime"
        :duration="duration"
        :buffered-end="bufferedEnd"
        @seek="playback.seekTo"
      />

      <PlayerControlsBar
        :is-playing="isPlaying"
        :current-time="currentTime"
        :duration="duration"
        :volume="volume"
        :muted="isMuted"
        :start-second="startSecond"
        :max-start-second="maxStartSecond"
        :subtitles-active="selectedSubtitle !== SUBTITLES_OFF"
        :pip-supported="isPiPSupported"
        :is-fullscreen="isFullscreen"
        :theater-mode="theaterMode"
        @toggle-play="togglePlay"
        @skip="skip"
        @toggle-mute="toggleMute"
        @change-volume="setVolume"
        @update:start-second="onStartSecondChange"
        @toggle-subtitles="toggleSubtitles"
        @toggle-pip="togglePiP"
        @toggle-theater="toggleTheaterMode"
        @toggle-fullscreen="toggleFullscreen"
      >
        <template #settings>
          <PlayerSettingsMenu
            v-model:open="isSettingsOpen"
            :audio-options="audioOptions"
            :selected-audio="selectedAudio"
            :subtitle-options="subtitleOptions"
            :selected-subtitle="selectedSubtitle"
            :playback-rate="playbackRate"
            @select-audio="selectedAudio = $event"
            @select-subtitle="selectedSubtitle = $event"
            @select-rate="playback.setPlaybackRate"
          />
        </template>
      </PlayerControlsBar>
    </div>
  </div>
</template>

<style scoped>
.yt-player-container {
  aspect-ratio: 16 / 9;
}

.yt-player-container.is-fullscreen {
  aspect-ratio: auto;
  border-radius: 0;
  max-width: 100vw !important;
  height: 100vh !important;
}
</style>
