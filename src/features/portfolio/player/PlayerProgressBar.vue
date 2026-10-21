<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { formatTime } from './utils/formatTime'
import { findThumbnail, type ThumbnailCue } from './utils/thumbnailVtt'
import { clampTooltipCenter } from './utils/tooltipPosition'

const props = withDefaults(
  defineProps<{
    currentTime: number
    duration: number
    bufferedEnd: number
    scrubbing: boolean
    thumbnails?: ThumbnailCue[]
  }>(),
  { thumbnails: () => [] },
)

const emit = defineEmits<{
  (e: 'seek', seconds: number): void
  (e: 'update:scrubbing', scrubbing: boolean): void
}>()

const barRef = ref<HTMLDivElement | null>(null)
const hoverTime = ref<number | null>(null)
const hoverPercent = ref(0)
const hoverOffsetPx = ref(0)
const barWidthPx = ref(0)

function toPercent(seconds: number): number {
  if (!props.duration) return 0
  return Math.min(100, Math.max(0, (seconds / props.duration) * 100))
}

const playedPercent = computed(() => toPercent(props.currentTime))
const bufferedPercent = computed(() => toPercent(props.bufferedEnd))
const formattedHoverTime = computed(() => formatTime(hoverTime.value ?? 0))

const hoverThumbnail = computed(() =>
  hoverTime.value === null ? null : findThumbnail(props.thumbnails, hoverTime.value),
)

const previewLeftPx = computed(() =>
  clampTooltipCenter(hoverOffsetPx.value, barWidthPx.value, hoverThumbnail.value?.w ?? 0),
)

const thumbnailStyle = computed(() => {
  const thumbnail = hoverThumbnail.value
  if (!thumbnail) return {}
  return {
    width: `${thumbnail.w}px`,
    height: `${thumbnail.h}px`,
    backgroundImage: `url(${JSON.stringify(thumbnail.url)})`,
    backgroundPosition: `-${thumbnail.x}px -${thumbnail.y}px`,
  }
})

/** Horizontal pointer position as a 0..1 ratio of the bar width. */
function pointerRatio(event: MouseEvent): number {
  if (!barRef.value) return 0
  const rect = barRef.value.getBoundingClientRect()
  const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  return rect.width ? offsetX / rect.width : 0
}

function onMouseMove(event: MouseEvent): void {
  if (!props.duration || !barRef.value) return
  const ratio = pointerRatio(event)
  barWidthPx.value = barRef.value.getBoundingClientRect().width
  hoverOffsetPx.value = ratio * barWidthPx.value
  hoverPercent.value = ratio * 100
  hoverTime.value = ratio * props.duration
}

function onMouseLeave(): void {
  if (!props.scrubbing) hoverTime.value = null
}

function seekToPointer(event: PointerEvent): void {
  if (props.duration) emit('seek', pointerRatio(event) * props.duration)
}

function stopScrubbing(): void {
  emit('update:scrubbing', false)
  hoverTime.value = null
  window.removeEventListener('pointermove', seekToPointer)
  window.removeEventListener('pointerup', stopScrubbing)
}

function onPointerDown(event: PointerEvent): void {
  if (!props.duration) return
  emit('update:scrubbing', true)
  seekToPointer(event)
  window.addEventListener('pointermove', seekToPointer)
  window.addEventListener('pointerup', stopScrubbing)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', seekToPointer)
  window.removeEventListener('pointerup', stopScrubbing)
})
</script>

<template>
  <div
    ref="barRef"
    class="group/scrubber relative mb-2 flex h-4 cursor-pointer items-center"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @pointerdown="onPointerDown"
  >
    <div
      v-if="hoverThumbnail"
      class="pointer-events-none absolute bottom-full mb-2 flex -translate-x-1/2 flex-col items-center gap-1"
      :style="{ left: `${previewLeftPx}px` }"
    >
      <div
        class="overflow-hidden rounded-md border border-white/20 bg-black bg-no-repeat shadow-lg"
        :style="thumbnailStyle"
      ></div>
      <span class="rounded bg-black/85 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs">
        {{ formattedHoverTime }}
      </span>
    </div>

    <div
      v-else-if="hoverTime !== null"
      class="pointer-events-none absolute -top-8 -translate-x-1/2 rounded bg-black/85 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs"
      :style="{ left: `${hoverPercent}%` }"
    >
      {{ formattedHoverTime }}
    </div>

    <div class="relative h-1 w-full rounded-full bg-white/20 transition-all duration-150 group-hover/scrubber:h-1.5">
      <div
        class="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-all duration-200"
        :style="{ width: `${bufferedPercent}%` }"
      ></div>
      <div class="absolute inset-y-0 left-0 rounded-full bg-red-600" :style="{ width: `${playedPercent}%` }"></div>
      <div
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 shadow-md transition-all duration-150"
        :class="scrubbing ? 'h-4 w-4 scale-125' : 'h-3.5 w-3.5 scale-0 group-hover/scrubber:scale-100'"
        :style="{ left: `${playedPercent}%` }"
      ></div>
    </div>
  </div>
</template>
