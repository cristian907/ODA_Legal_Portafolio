<script setup lang="ts">
import { computed } from 'vue'
import type { VideoManifest } from '@/types/video'
import { useThumbnailTrack } from '@/features/portfolio/player/composables/useThumbnailTrack'
import { formatTime } from '@/features/portfolio/player/utils/formatTime'
import { measureSprite, spriteCellStyle } from './contactSheet'

/** Every frame of the thumbnail track as a clickable grid; `pending` shows placeholders while it is generated. */
const props = defineProps<{
  manifest: VideoManifest | null
  pending?: boolean
  currentTime?: number
}>()
const emit = defineEmits<{ seek: [seconds: number] }>()

const PLACEHOLDER_COUNT = 12

const { cues } = useThumbnailTrack(() => (props.pending ? null : (props.manifest?.thumbnails.vttPath ?? null)))
const sprite = computed(() => measureSprite(cues.value))
const cells = computed(() =>
  cues.value.map((cue) => ({ cue, style: spriteCellStyle(cue, sprite.value) })),
)

const activeIndex = computed(() => {
  const time = props.currentTime
  if (time === undefined) return -1
  return cues.value.findIndex((cue) => time >= cue.start && time < cue.end)
})

const summary = computed(() => {
  const interval = props.manifest?.thumbnails.intervalSeconds
  if (props.pending || cues.value.length === 0) return null
  return { count: cues.value.length, interval }
})
</script>

<template>
  <section aria-labelledby="contactSheetHeading" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3
        id="contactSheetHeading"
        class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
      >
        Hoja de contactos
      </h3>
      <p v-if="pending" class="text-xs text-slate-500">Generando miniaturas…</p>
      <p v-else-if="summary" class="text-xs text-slate-500">
        <span class="font-mono tabular-nums">{{ summary.count }}</span>
        {{ summary.count === 1 ? 'miniatura' : 'miniaturas' }}
        <template v-if="summary.interval">
          · cada <span class="font-mono tabular-nums">{{ summary.interval }}</span> s
        </template>
      </p>
    </div>

    <ul v-if="pending" class="contact-grid" aria-hidden="true">
      <li v-for="n in PLACEHOLDER_COUNT" :key="n" class="flex flex-col gap-1.5">
        <div class="shimmer aspect-video rounded-md bg-[#1e293b]"></div>
        <div class="shimmer h-3 w-8 rounded bg-[#1e293b]"></div>
      </li>
    </ul>

    <ul v-else-if="cells.length > 0" class="contact-grid">
      <li v-for="({ cue, style }, index) in cells" :key="cue.start">
        <button
          type="button"
          class="group flex w-full flex-col gap-1.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]"
          :aria-label="`Ir a ${formatTime(cue.start)}`"
          :aria-current="index === activeIndex ? 'true' : undefined"
          @click="emit('seek', cue.start)"
        >
          <span
            class="block aspect-video w-full rounded-md border bg-[#0b0f17] bg-no-repeat transition"
            :class="
              index === activeIndex
                ? 'border-[#c5a059]'
                : 'border-[#1e293b] group-hover:border-[#c5a059]/60'
            "
            :style="style"
          ></span>
          <span
            class="font-mono text-[0.7rem] tabular-nums transition"
            :class="index === activeIndex ? 'text-[#e5be48]' : 'text-slate-500 group-hover:text-slate-300'"
          >
            {{ formatTime(cue.start) }}
          </span>
        </button>
      </li>
    </ul>

    <p v-else class="text-xs text-slate-500">No hay miniaturas disponibles para este video.</p>
  </section>
</template>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 0.875rem 0.75rem;
}

.shimmer {
  background-image: linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.05) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -50% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
    background-image: none;
  }
}
</style>
