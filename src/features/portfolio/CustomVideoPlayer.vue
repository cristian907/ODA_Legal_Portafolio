<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    title?: string
    originalUrl?: string
    theaterMode?: boolean
    startTime?: number
  }>(),
  {
    title: 'Volcano Smoke, Fire & Heat Flame',
    originalUrl: 'https://pixabay.com/videos/volcano-smoke-fire-heat-flame-152174/',
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

// DOM References
const containerRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const progressBarRef = ref<HTMLDivElement | null>(null)

// Playback State
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const previousVolume = ref(1)
const playbackRate = ref(1)
const bufferedEnd = ref(0)
const isBuffering = ref(false)
const isEnded = ref(false)
const isFullscreen = ref(false)
const isPiPActive = ref(false)
const isPiPSupported = ref(false)

// Start Second State
const localStartSecond = ref(props.startTime || 0)
const maxAllowedSeconds = computed(() => Math.floor(duration.value))

// YouTube Options / Settings State
const showSettingsMenu = ref(false)
const currentSettingsTab = ref<'main' | 'audio' | 'subtitles' | 'speed' | 'quality'>('main')

// Subtitles options
const selectedSubtitle = ref<'off' | 'es' | 'en'>('off')
const subtitleOptions = [
  { id: 'off', label: 'Desactivados' },
  { id: 'es', label: 'Español (generados automáticamente)' },
  { id: 'en', label: 'Inglés' },
]

const currentSubtitleLabel = computed(() => {
  if (selectedSubtitle.value === 'off') return 'Desactivados'
  if (selectedSubtitle.value === 'es') return 'Español'
  return 'Inglés'
})

function toggleQuickSubtitles() {
  selectedSubtitle.value = selectedSubtitle.value === 'off' ? 'es' : 'off'
}

// Audio Tracks options
const selectedAudioTrack = ref<'original' | 'es_dub' | 'ambient'>('original')
const audioTrackOptions = [
  { id: 'original', label: 'Original (Estéreo)', badge: 'Predeterminado' },
  { id: 'es_dub', label: 'Español (Doblaje)', badge: '' },
  { id: 'ambient', label: 'Sonido ambiental', badge: '' },
]

const currentAudioTrackLabel = computed(() => {
  return audioTrackOptions.find((o) => o.id === selectedAudioTrack.value)?.label.split(' ')[0] || 'Original'
})

// Quality options
const selectedQuality = ref<'1080p' | '720p' | '480p' | 'auto'>('1080p')
const qualityOptions = [
  { id: '1080p', label: '1080p HD' },
  { id: '720p', label: '720p' },
  { id: '480p', label: '480p' },
  { id: 'auto', label: 'Automática' },
]

// Speed options
const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

// UI State
const showControls = ref(true)
const isScrubbing = ref(false)
const hoverTime = ref<number | null>(null)
const hoverPositionPercent = ref(0)
const centerFeedback = ref<{ show: boolean; icon: string; key: number }>({
  show: false,
  icon: 'fa-play',
  key: 0,
})
const sideFeedback = ref<{ show: boolean; text: string; side: 'left' | 'right'; key: number }>({
  show: false,
  text: '',
  side: 'left',
  key: 0,
})

let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null
let clickTimeout: ReturnType<typeof setTimeout> | null = null

// Formatted Time Helper
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`
  }
  return `${m}:${pad(s)}`
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))
const playedPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})
const bufferedPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, Math.max(0, (bufferedEnd.value / duration.value) * 100))
})
const formattedHoverTime = computed(() => (hoverTime.value !== null ? formatTime(hoverTime.value) : '0:00'))

// Volume icon helper
const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'fa-volume-xmark'
  if (volume.value < 0.5) return 'fa-volume-low'
  return 'fa-volume-high'
})

// Trigger feedback animations in center
function triggerCenterFeedback(icon: string) {
  centerFeedback.value = {
    show: true,
    icon,
    key: Date.now(),
  }
  setTimeout(() => {
    centerFeedback.value.show = false
  }, 600)
}

function triggerSideFeedback(text: string, side: 'left' | 'right') {
  sideFeedback.value = {
    show: true,
    text,
    side,
    key: Date.now(),
  }
  setTimeout(() => {
    sideFeedback.value.show = false
  }, 650)
}

// Controls visibility management
function resetControlsTimeout() {
  showControls.value = true
  if (hideControlsTimeout) {
    clearTimeout(hideControlsTimeout)
  }
  if (isPlaying.value && !showSettingsMenu.value && !isScrubbing.value) {
    hideControlsTimeout = setTimeout(() => {
      showControls.value = false
    }, 2800)
  }
}

function onMouseMove() {
  resetControlsTimeout()
}

function onMouseLeave() {
  if (isPlaying.value && !showSettingsMenu.value && !isScrubbing.value) {
    showControls.value = false
  }
}

// Play / Pause toggling
async function togglePlay() {
  const video = videoRef.value
  if (!video) return

  if (video.paused || video.ended) {
    try {
      if ((isEnded.value || video.currentTime === 0) && localStartSecond.value > 0 && localStartSecond.value < duration.value) {
        video.currentTime = localStartSecond.value
        currentTime.value = localStartSecond.value
      }
      await video.play()
      isPlaying.value = true
      isEnded.value = false
      triggerCenterFeedback('fa-play')
    } catch {
      // Browser autoplay policy or abort
    }
  } else {
    video.pause()
    isPlaying.value = false
    triggerCenterFeedback('fa-pause')
  }
  resetControlsTimeout()
}

// Video click / double click handling
function onVideoAreaClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.player-controls')) return

  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
    handleDoubleClick(e)
  } else {
    clickTimeout = setTimeout(() => {
      clickTimeout = null
      togglePlay()
    }, 250)
  }
}

function handleDoubleClick(e: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const widthRatio = clickX / rect.width

  if (widthRatio < 0.35) {
    skip(-10)
    triggerSideFeedback('-10s', 'left')
  } else if (widthRatio > 0.65) {
    skip(10)
    triggerSideFeedback('+10s', 'right')
  } else {
    toggleFullscreen()
  }
}

// Skip forward/back
function skip(seconds: number) {
  const video = videoRef.value
  if (!video) return
  video.currentTime = Math.min(duration.value, Math.max(0, video.currentTime + seconds))
  resetControlsTimeout()
}

// Volume & Mute
function toggleMute() {
  const video = videoRef.value
  if (!video) return

  if (isMuted.value || volume.value === 0) {
    const restore = previousVolume.value > 0 ? previousVolume.value : 0.8
    video.volume = restore
    volume.value = restore
    isMuted.value = false
    video.muted = false
  } else {
    previousVolume.value = volume.value
    video.volume = 0
    volume.value = 0
    isMuted.value = true
    video.muted = true
  }
}

function onVolumeInput(e: Event) {
  const video = videoRef.value
  if (!video) return
  const val = parseFloat((e.target as HTMLInputElement).value)
  volume.value = val
  video.volume = val
  if (val === 0) {
    isMuted.value = true
    video.muted = true
  } else {
    isMuted.value = false
    video.muted = false
    previousVolume.value = val
  }
}

// Start second input in action bar
function onStartSecondInput(e: Event) {
  const input = e.target as HTMLInputElement
  const raw = input.value.trim()
  if (raw === '') return
  let val = parseInt(raw, 10)
  if (isNaN(val) || val < 0) {
    val = 0
  } else if (duration.value > 0 && val > maxAllowedSeconds.value) {
    val = maxAllowedSeconds.value
  }
  localStartSecond.value = val
  input.value = String(val)
  seekTo(val)
  emit('update:startTime', val)
}

// Playback speed
function setPlaybackRate(rate: number) {
  playbackRate.value = rate
  if (videoRef.value) {
    videoRef.value.playbackRate = rate
  }
}

// Settings navigation
function openSettingsTab(tab: 'main' | 'audio' | 'subtitles' | 'speed' | 'quality') {
  currentSettingsTab.value = tab
}

// Fullscreen
function toggleFullscreen() {
  if (!containerRef.value) return

  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen?.().catch(() => {})
  } else {
    document.exitFullscreen?.().catch(() => {})
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Picture-in-Picture
async function togglePiP() {
  const video = videoRef.value
  if (!video) return

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  } catch (err) {
    console.warn('PiP error', err)
  }
}

// Theater mode
function toggleTheaterMode() {
  emit('update:theaterMode', !props.theaterMode)
}

// Progress bar seeking & scrubbing
function calculateProgressTime(e: MouseEvent): number {
  if (!progressBarRef.value || !duration.value) return 0
  const rect = progressBarRef.value.getBoundingClientRect()
  const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const ratio = offsetX / rect.width
  return ratio * duration.value
}

function onProgressMouseMove(e: MouseEvent) {
  if (!progressBarRef.value || !duration.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  hoverPositionPercent.value = (offsetX / rect.width) * 100
  hoverTime.value = (offsetX / rect.width) * duration.value
}

function onProgressMouseLeave() {
  if (!isScrubbing.value) {
    hoverTime.value = null
  }
}

function onProgressPointerDown(e: PointerEvent) {
  if (!videoRef.value || !duration.value) return
  isScrubbing.value = true
  const seekToTime = calculateProgressTime(e)
  currentTime.value = seekToTime
  videoRef.value.currentTime = seekToTime

  const onPointerMove = (ev: PointerEvent) => {
    if (!videoRef.value || !duration.value) return
    const newSeek = calculateProgressTime(ev)
    currentTime.value = newSeek
    videoRef.value.currentTime = newSeek
  }

  const onPointerUp = () => {
    isScrubbing.value = false
    hoverTime.value = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

// Keyboard shortcuts (YouTube standard)
function onKeyDown(e: KeyboardEvent) {
  const activeEl = document.activeElement
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
    return
  }

  const key = e.key.toLowerCase()

  if (key === ' ' || key === 'k') {
    e.preventDefault()
    togglePlay()
  } else if (key === 'f') {
    e.preventDefault()
    toggleFullscreen()
  } else if (key === 'm') {
    e.preventDefault()
    toggleMute()
  } else if (key === 'c') {
    e.preventDefault()
    toggleQuickSubtitles()
  } else if (key === 'arrowleft' || key === 'j') {
    e.preventDefault()
    skip(key === 'j' ? -10 : -5)
    triggerSideFeedback(key === 'j' ? '-10s' : '-5s', 'left')
  } else if (key === 'arrowright' || key === 'l') {
    e.preventDefault()
    skip(key === 'l' ? 10 : 5)
    triggerSideFeedback(key === 'l' ? '+10s' : '+5s', 'right')
  } else if (key === 'arrowup') {
    e.preventDefault()
    const newVol = Math.min(1, volume.value + 0.1)
    if (videoRef.value) videoRef.value.volume = newVol
    volume.value = newVol
    isMuted.value = false
  } else if (key === 'arrowdown') {
    e.preventDefault()
    const newVol = Math.max(0, volume.value - 0.1)
    if (videoRef.value) videoRef.value.volume = newVol
    volume.value = newVol
    if (newVol === 0) isMuted.value = true
  } else if (/^[0-9]$/.test(key) && duration.value > 0) {
    e.preventDefault()
    const percent = parseInt(key, 10) * 10
    const targetTime = (percent / 100) * duration.value
    if (videoRef.value) videoRef.value.currentTime = targetTime
    currentTime.value = targetTime
  }
}

// HTML5 Video Event Listeners
function onTimeUpdate() {
  if (!videoRef.value || isScrubbing.value) return
  currentTime.value = videoRef.value.currentTime
  emit('time-update', currentTime.value)

  const ranges = videoRef.value.buffered
  if (ranges.length > 0) {
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (ranges.start(i) <= currentTime.value && ranges.end(i) >= currentTime.value) {
        bufferedEnd.value = ranges.end(i)
        break
      }
    }
  }
}

function onLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
  volume.value = videoRef.value.volume
  isMuted.value = videoRef.value.muted
  emit('duration-loaded', duration.value)

  if (localStartSecond.value > 0 && localStartSecond.value < duration.value) {
    videoRef.value.currentTime = localStartSecond.value
    currentTime.value = localStartSecond.value
  }
}

function onWaiting() {
  isBuffering.value = true
}

function onPlaying() {
  isBuffering.value = false
  isPlaying.value = true
  isEnded.value = false
}

function onPause() {
  isPlaying.value = false
  showControls.value = true
}

function onEnded() {
  isPlaying.value = false
  isEnded.value = true
  showControls.value = true
}

// Lifecycle
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if (typeof document !== 'undefined') {
    isPiPSupported.value = 'pictureInPictureEnabled' in document
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
  if (clickTimeout) clearTimeout(clickTimeout)
})

// Watch source change
watch(
  () => props.src,
  () => {
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    bufferedEnd.value = 0
    isEnded.value = false
    if (videoRef.value) {
      videoRef.value.load()
    }
  },
)

// Watch props.startTime
watch(
  () => props.startTime,
  (newStart) => {
    localStartSecond.value = newStart || 0
    if (!videoRef.value || duration.value === 0) return
    const valid = Math.max(0, Math.min(Math.floor(duration.value), Math.floor(newStart || 0)))
    if (!isPlaying.value) {
      videoRef.value.currentTime = valid
      currentTime.value = valid
    }
  },
)

function seekTo(targetSeconds: number) {
  if (!videoRef.value || duration.value === 0) return
  const valid = Math.max(0, Math.min(duration.value, Math.max(0, targetSeconds)))
  videoRef.value.currentTime = valid
  currentTime.value = valid
}

function getCurrentTime(): number {
  return currentTime.value
}

defineExpose({
  seekTo,
  getCurrentTime,
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
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @keydown="onKeyDown"
  >
    <!-- HTML5 Video Element -->
    <video
      ref="videoRef"
      :src="src"
      class="h-full w-full object-contain"
      playsinline
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @waiting="onWaiting"
      @playing="onPlaying"
      @pause="onPause"
      @ended="onEnded"
      @click="onVideoAreaClick"
    ></video>

    <!-- Top Overlay: Video Title & Badges -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300"
      :class="showControls ? 'opacity-100' : 'opacity-0'"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md"
        >
          <i class="fas fa-play text-xs"></i>
        </span>
        <div>
          <h3 class="text-sm font-semibold text-white drop-shadow-md sm:text-base">
            {{ title }}
          </h3>
          <span class="text-xs text-white/70">Reproductor Personalizado ODA</span>
        </div>
      </div>

      <div class="pointer-events-auto flex items-center gap-2">
        <span
          class="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
        >
          4K HD
        </span>
      </div>
    </div>

    <!-- Simulated Subtitles Overlay (YouTube style) -->
    <div
      v-if="selectedSubtitle !== 'off'"
      class="pointer-events-none absolute bottom-16 inset-x-0 flex justify-center px-4 transition-all"
    >
      <span
        class="rounded bg-black/80 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-md backdrop-blur-xs sm:text-sm"
      >
        {{
          selectedSubtitle === 'es'
            ? '[Fuego volcánico crepitante y nubes de ceniza]'
            : '[Crackle of volcano flames and ash clouds]'
        }}
      </span>
    </div>

    <!-- Center Buffering Spinner -->
    <div
      v-if="isBuffering"
      class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
    >
      <div
        class="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-red-600"
      ></div>
    </div>

    <!-- Center Play/Pause Animated Feedback Ripple -->
    <div
      v-if="centerFeedback.show"
      :key="centerFeedback.key"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        class="animate-center-pulse flex h-20 w-20 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
      >
        <i class="fas text-3xl" :class="centerFeedback.icon"></i>
      </div>
    </div>

    <!-- Double Tap Side Ripple (+10s / -10s) -->
    <div
      v-if="sideFeedback.show"
      :key="sideFeedback.key"
      class="pointer-events-none absolute inset-y-0 flex w-1/3 items-center justify-center"
      :class="sideFeedback.side === 'left' ? 'left-0' : 'right-0'"
    >
      <div
        class="animate-side-fade flex flex-col items-center justify-center gap-1 rounded-full bg-white/10 px-5 py-4 text-white backdrop-blur-md"
      >
        <i
          class="fas text-xl"
          :class="sideFeedback.side === 'left' ? 'fa-rotate-left' : 'fa-rotate-right'"
        ></i>
        <span class="text-xs font-bold">{{ sideFeedback.text }}</span>
      </div>
    </div>

    <!-- Big Center Replay / Play on End -->
    <div
      v-if="isEnded"
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs"
    >
      <button
        class="group/btn flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
        title="Volver a reproducir"
        @click="togglePlay"
      >
        <i class="fas fa-rotate-right text-3xl"></i>
      </button>
      <span class="mt-4 text-sm font-semibold tracking-wide text-white/90">
        Reproducir nuevamente
      </span>
    </div>

    <!-- Bottom Controls & Gradient Overlay (YouTube Style) -->
    <div
      class="player-controls absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300"
      :class="showControls ? 'opacity-100' : 'pointer-events-none opacity-0'"
      @click.stop
    >
      <!-- YouTube Scrubber / Progress Bar -->
      <div
        ref="progressBarRef"
        class="group/scrubber relative mb-2 flex h-4 cursor-pointer items-center"
        @mousemove="onProgressMouseMove"
        @mouseleave="onProgressMouseLeave"
        @pointerdown="onProgressPointerDown"
      >
        <!-- Time Hover Tooltip -->
        <div
          v-if="hoverTime !== null"
          class="pointer-events-none absolute -top-8 -translate-x-1/2 rounded bg-black/85 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs"
          :style="{ left: `${hoverPositionPercent}%` }"
        >
          {{ formattedHoverTime }}
        </div>

        <!-- Track Background -->
        <div
          class="relative h-1 w-full rounded-full bg-white/20 transition-all duration-150 group-hover/scrubber:h-1.5"
        >
          <!-- Buffer bar -->
          <div
            class="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-all duration-200"
            :style="{ width: `${bufferedPercent}%` }"
          ></div>

          <!-- Played bar -->
          <div
            class="absolute inset-y-0 left-0 rounded-full bg-red-600"
            :style="{ width: `${playedPercent}%` }"
          ></div>

          <!-- Scrubber Thumb Knob -->
          <div
            class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 shadow-md transition-all duration-150"
            :class="
              isScrubbing
                ? 'h-4 w-4 scale-125'
                : 'h-3.5 w-3.5 scale-0 group-hover/scrubber:scale-100'
            "
            :style="{ left: `${playedPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Controls Row (Action Bar) -->
      <div class="flex items-center justify-between text-white">
        <!-- Left Controls -->
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- Play / Pause Button -->
          <button
            class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg transition-transform hover:scale-110 hover:text-red-500 active:scale-95"
            :title="isPlaying ? 'Pausar (k / espacio)' : 'Reproducir (k / espacio)'"
            @click="togglePlay"
          >
            <i class="fas" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
          </button>

          <!-- Rewind 10s -->
          <button
            class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm text-white/80 transition-colors hover:text-white sm:flex"
            title="Retroceder 10 segundos (j)"
            @click="skip(-10)"
          >
            <i class="fas fa-rotate-left"></i>
          </button>

          <!-- Fast Forward 10s -->
          <button
            class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm text-white/80 transition-colors hover:text-white sm:flex"
            title="Adelantar 10 segundos (l)"
            @click="skip(10)"
          >
            <i class="fas fa-rotate-right"></i>
          </button>

          <!-- Volume Controls with Expanding Slider -->
          <div class="group/volume flex items-center">
            <button
              class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base transition-transform hover:scale-110 active:scale-95"
              :title="isMuted ? 'Desactivar silencio (m)' : 'Silenciar (m)'"
              @click="toggleMute"
            >
              <i class="fas" :class="volumeIcon"></i>
            </button>

            <!-- YouTube Expanding Slider -->
            <div
              class="flex w-0 items-center overflow-hidden transition-all duration-300 ease-out group-hover/volume:w-20 group-hover/volume:px-1"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="isMuted ? 0 : volume"
                class="yt-volume-slider h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-white"
                @input="onVolumeInput"
              />
            </div>
          </div>

          <!-- Time Display -->
          <div class="ml-1 text-xs font-medium text-white/90 sm:text-sm">
            <span>{{ formattedCurrentTime }}</span>
            <span class="mx-1 text-white/40">/</span>
            <span class="text-white/70">{{ formattedDuration }}</span>
          </div>

          <!-- Integrated Start Second Field inside Action Bar -->
          <div
            class="ml-1 sm:ml-2 flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm border border-white/10 transition-colors hover:bg-white/15"
            title="Indica el segundo exacto desde el que arrancará la reproducción"
          >
            <i class="fas fa-stopwatch text-red-500 text-[11px]"></i>
            <span class="hidden md:inline text-[11px] font-medium text-white/80">Inicio:</span>
            <input
              type="number"
              min="0"
              :max="maxAllowedSeconds"
              :value="localStartSecond"
              class="w-12 rounded bg-black/50 px-1 py-0.5 text-center font-mono text-xs font-bold text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-red-500"
              title="Escribe el segundo de inicio"
              @input="onStartSecondInput"
              @keydown.stop
            />
            <span class="text-[10px] text-white/60">s</span>
          </div>
        </div>

        <!-- Right Controls -->
        <div class="relative flex items-center gap-1 sm:gap-2">
          <!-- Quick Subtitles (CC) Button -->
          <button
            class="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/10"
            :class="selectedSubtitle !== 'off' ? 'text-white' : 'text-white/65 hover:text-white'"
            title="Subtítulos (c)"
            @click="toggleQuickSubtitles"
          >
            <span class="border border-current px-1 py-0.2 rounded font-bold text-[10px] tracking-tight">CC</span>
            <span
              v-if="selectedSubtitle !== 'off'"
              class="absolute bottom-1.5 left-2 right-2 h-0.5 rounded-full bg-red-600"
            ></span>
          </button>

          <!-- YouTube Settings Menu (Gear Icon) -->
          <div class="relative">
            <button
              class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-base text-white/85 transition-all duration-200 hover:bg-white/10 hover:text-white"
              :class="{ 'text-white rotate-45': showSettingsMenu }"
              title="Configuración"
              @click="showSettingsMenu = !showSettingsMenu; currentSettingsTab = 'main'"
            >
              <i class="fas fa-gear"></i>
            </button>

            <!-- YouTube-style Popup Menu -->
            <div
              v-if="showSettingsMenu"
              class="absolute bottom-12 right-0 z-50 w-64 overflow-hidden rounded-xl border border-white/15 bg-black/95 text-white shadow-2xl backdrop-blur-xl transition-all"
              @click.stop
            >
              <!-- MAIN SETTINGS TAB -->
              <div v-if="currentSettingsTab === 'main'" class="py-1 text-xs">
                <!-- Pista de audio -->
                <button
                  class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/15 text-left"
                  @click="openSettingsTab('audio')"
                >
                  <div class="flex items-center gap-3">
                    <i class="fas fa-language text-white/70 text-sm"></i>
                    <span>Pista de audio</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-white/60">
                    <span class="max-w-[85px] truncate text-[11px]">{{ currentAudioTrackLabel }}</span>
                    <i class="fas fa-chevron-right text-[10px]"></i>
                  </div>
                </button>

                <!-- Subtítulos -->
                <button
                  class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/15 text-left"
                  @click="openSettingsTab('subtitles')"
                >
                  <div class="flex items-center gap-3">
                    <i class="fas fa-closed-captioning text-white/70 text-sm"></i>
                    <span>Subtítulos</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-white/60">
                    <span class="text-[11px]">{{ currentSubtitleLabel }}</span>
                    <i class="fas fa-chevron-right text-[10px]"></i>
                  </div>
                </button>

                <!-- Velocidad de reproducción -->
                <button
                  class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/15 text-left"
                  @click="openSettingsTab('speed')"
                >
                  <div class="flex items-center gap-3">
                    <i class="fas fa-gauge-high text-white/70 text-sm"></i>
                    <span>Velocidad</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-white/60">
                    <span class="text-[11px]">{{ playbackRate === 1 ? 'Normal' : `${playbackRate}x` }}</span>
                    <i class="fas fa-chevron-right text-[10px]"></i>
                  </div>
                </button>

                <!-- Calidad -->
                <button
                  class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/15 text-left"
                  @click="openSettingsTab('quality')"
                >
                  <div class="flex items-center gap-3">
                    <i class="fas fa-sliders text-white/70 text-sm"></i>
                    <span>Calidad</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-white/60">
                    <span class="text-[11px]">{{ selectedQuality === '1080p' ? '1080p HD' : selectedQuality }}</span>
                    <i class="fas fa-chevron-right text-[10px]"></i>
                  </div>
                </button>
              </div>

              <!-- SUBMENU: PISTA DE AUDIO -->
              <div v-else-if="currentSettingsTab === 'audio'" class="py-1 text-xs">
                <button
                  class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 font-semibold text-white/80 hover:bg-white/10 text-left"
                  @click="openSettingsTab('main')"
                >
                  <i class="fas fa-chevron-left text-[11px]"></i>
                  <span>Pista de audio</span>
                </button>
                <div class="max-h-56 overflow-y-auto py-1">
                  <button
                    v-for="track in audioTrackOptions"
                    :key="track.id"
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left hover:bg-white/15"
                    :class="selectedAudioTrack === track.id ? 'font-semibold text-red-500' : 'text-white/85'"
                    @click="selectedAudioTrack = track.id as any; openSettingsTab('main')"
                  >
                    <div>
                      <div>{{ track.label }}</div>
                      <div v-if="track.badge" class="text-[10px] text-white/50">{{ track.badge }}</div>
                    </div>
                    <i v-if="selectedAudioTrack === track.id" class="fas fa-check text-[11px]"></i>
                  </button>
                </div>
              </div>

              <!-- SUBMENU: SUBTITULOS -->
              <div v-else-if="currentSettingsTab === 'subtitles'" class="py-1 text-xs">
                <button
                  class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 font-semibold text-white/80 hover:bg-white/10 text-left"
                  @click="openSettingsTab('main')"
                >
                  <i class="fas fa-chevron-left text-[11px]"></i>
                  <span>Subtítulos</span>
                </button>
                <div class="max-h-56 overflow-y-auto py-1">
                  <button
                    v-for="sub in subtitleOptions"
                    :key="sub.id"
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left hover:bg-white/15"
                    :class="selectedSubtitle === sub.id ? 'font-semibold text-red-500' : 'text-white/85'"
                    @click="selectedSubtitle = sub.id as any; openSettingsTab('main')"
                  >
                    <span>{{ sub.label }}</span>
                    <i v-if="selectedSubtitle === sub.id" class="fas fa-check text-[11px]"></i>
                  </button>
                </div>
              </div>

              <!-- SUBMENU: VELOCIDAD -->
              <div v-else-if="currentSettingsTab === 'speed'" class="py-1 text-xs">
                <button
                  class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 font-semibold text-white/80 hover:bg-white/10 text-left"
                  @click="openSettingsTab('main')"
                >
                  <i class="fas fa-chevron-left text-[11px]"></i>
                  <span>Velocidad de reproducción</span>
                </button>
                <div class="max-h-56 overflow-y-auto py-1">
                  <button
                    v-for="rate in speedOptions"
                    :key="rate"
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left hover:bg-white/15"
                    :class="playbackRate === rate ? 'font-semibold text-red-500' : 'text-white/85'"
                    @click="setPlaybackRate(rate); openSettingsTab('main')"
                  >
                    <span>{{ rate === 1 ? '1x (Normal)' : `${rate}x` }}</span>
                    <i v-if="playbackRate === rate" class="fas fa-check text-[11px]"></i>
                  </button>
                </div>
              </div>

              <!-- SUBMENU: CALIDAD -->
              <div v-else-if="currentSettingsTab === 'quality'" class="py-1 text-xs">
                <button
                  class="flex w-full cursor-pointer items-center gap-2 border-b border-white/10 px-3 py-2 font-semibold text-white/80 hover:bg-white/10 text-left"
                  @click="openSettingsTab('main')"
                >
                  <i class="fas fa-chevron-left text-[11px]"></i>
                  <span>Calidad</span>
                </button>
                <div class="max-h-56 overflow-y-auto py-1">
                  <button
                    v-for="q in qualityOptions"
                    :key="q.id"
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left hover:bg-white/15"
                    :class="selectedQuality === q.id ? 'font-semibold text-red-500' : 'text-white/85'"
                    @click="selectedQuality = q.id as any; openSettingsTab('main')"
                  >
                    <span>{{ q.label }}</span>
                    <i v-if="selectedQuality === q.id" class="fas fa-check text-[11px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Picture in Picture -->
          <button
            v-if="isPiPSupported"
            class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:flex"
            title="Pantalla en pantalla (PiP)"
            @click="togglePiP"
          >
            <i class="fas fa-clone"></i>
          </button>

          <!-- Theater Mode Toggle -->
          <button
            class="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white md:flex"
            :title="theaterMode ? 'Modo normal' : 'Modo cine (teatro)'"
            @click="toggleTheaterMode"
          >
            <i class="fas" :class="theaterMode ? 'fa-compress' : 'fa-film'"></i>
          </button>

          <!-- Fullscreen Toggle -->
          <button
            class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-base text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            :title="isFullscreen ? 'Salir de pantalla completa (f)' : 'Pantalla completa (f)'"
            @click="toggleFullscreen"
          >
            <i class="fas" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
          </button>
        </div>
      </div>
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

/* Range input styling for volume */
.yt-volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.yt-volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Animations for click ripples */
@keyframes centerPulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.animate-center-pulse {
  animation: centerPulse 0.55s ease-out forwards;
}

@keyframes sideFade {
  0% {
    transform: scale(0.85);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.animate-side-fade {
  animation: sideFade 0.6s ease-out forwards;
}
</style>
