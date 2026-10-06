<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import type { GalleryPhoto, GallerySettings } from '@/types/gallery'
import {
  canGoNext,
  canGoPrev,
  carouselLayout,
  dragOffset,
  indexOfPage,
  isClonePosition,
  pageCount,
  pageOfIndex,
  resolveSwipe,
  slideSourceIndexes,
} from './carouselMath'
import CarouselControls from './CarouselControls.vue'
import { useAutoplay } from './composables/useAutoplay'
import { SLIDE_TRANSITION_MS, useCarouselTrack } from './composables/useCarouselTrack'
import { usePrefersReducedMotion } from './composables/usePrefersReducedMotion'
import { useSlidesPerView } from './composables/useSlidesPerView'
import { useSwipe } from './composables/useSwipe'

const props = withDefaults(
  defineProps<{
    photos: GalleryPhoto[]
    settings: GallerySettings
    /** Accessible name of the carousel region. */
    label?: string
  }>(),
  { label: 'Galería de fotos' },
)

const emit = defineEmits<{
  /** Index of the first visible photo after it changes. */
  change: [index: number]
}>()

const root = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

const { reducedMotion } = usePrefersReducedMotion()
const { perView } = useSlidesPerView(root)
const layout = computed(() => carouselLayout(props.photos.length, perView.value, props.settings.loop))

const { position, index, animate, dragPx, step, goTo, onTransitionEnd, startDrag, updateDrag, endDrag } =
  useCarouselTrack({ layout, track, reducedMotion })

const slides = computed(() =>
  slideSourceIndexes(layout.value).map((source, slot) => {
    const photo = props.photos[source]
    const clone = isClonePosition(slot, layout.value)
    return { photo, source, clone, key: clone ? `${photo.id}-clone-${slot}` : photo.id }
  }),
)

const hasPrev = computed(() => canGoPrev(index.value, layout.value))
const hasNext = computed(() => canGoNext(index.value, layout.value))
const pages = computed(() => pageCount(layout.value))
const activePage = computed(() => pageOfIndex(index.value, layout.value))
const aspectRatio = computed(() => props.settings.aspectRatio.replace(':', ' / '))

const { isDragging, swipeListeners } = useSwipe(viewport, {
  enabled: () => layout.value.scrollable,
  onStart: startDrag,
  onMove: (deltaX) => updateDrag(dragOffset(deltaX, !hasPrev.value, !hasNext.value)),
  onEnd: (deltaX, velocity) => {
    const slideWidth = (viewport.value?.clientWidth ?? 0) / layout.value.perView
    const steps = resolveSwipe(deltaX, velocity, slideWidth)
    const limit = layout.value.perView
    void endDrag(Math.max(-limit, Math.min(limit, steps)))
    autoplay.restart()
  },
})

const autoplay = useAutoplay({
  enabled: computed(() => props.settings.autoplay && layout.value.scrollable),
  intervalMs: computed(() => props.settings.autoplayIntervalSeconds * 1000),
  reducedMotion,
  container: root,
  isDragging,
  onTick: () => {
    // Without loop, rotation rewinds to the first photo after the last view.
    if (hasNext.value) void step(1)
    else void goTo(0)
  },
})

function navigate(move: () => Promise<void>): void {
  void move()
  autoplay.restart()
}

function onKeydown(event: KeyboardEvent): void {
  if (!layout.value.scrollable) return
  if (event.key === 'ArrowLeft' && hasPrev.value) navigate(() => step(-1))
  else if (event.key === 'ArrowRight' && hasNext.value) navigate(() => step(1))
  else return
  event.preventDefault()
}

const announcement = computed(() => {
  const photo = props.photos[index.value]
  if (!photo) return ''
  const position = `Foto ${index.value + 1} de ${props.photos.length}`
  return photo.title ? `${position}: ${photo.title}` : position
})

const trackStyle = computed(() => ({
  '--per-view': layout.value.perView,
  '--position': position.value,
  '--drag-px': dragPx.value,
  '--slide-duration': `${SLIDE_TRANSITION_MS}ms`,
}))

watch(index, (current) => emit('change', current))
</script>

<template>
  <div
    ref="root"
    class="photo-carousel"
    role="region"
    aria-roledescription="carrusel"
    :aria-label="props.label"
    @keydown="onKeydown"
  >
    <div
      ref="viewport"
      class="viewport overflow-hidden rounded-xl outline-none"
      :class="{ 'is-dragging': isDragging, 'cursor-grab': layout.scrollable }"
      :tabindex="layout.scrollable ? 0 : undefined"
      v-on="swipeListeners"
    >
      <div
        ref="track"
        class="track flex"
        :class="{ 'is-animated': animate, 'justify-center': !layout.scrollable }"
        :style="trackStyle"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="slide in slides"
          :key="slide.key"
          class="slide"
          role="group"
          aria-roledescription="foto"
          :aria-label="`${slide.source + 1} de ${props.photos.length}`"
          :aria-hidden="slide.clone ? 'true' : undefined"
        >
          <figure class="slide-frame relative m-0 overflow-hidden rounded-xl" :style="{ aspectRatio }">
            <img
              :src="slide.photo.croppedPath"
              :alt="slide.photo.alt"
              loading="lazy"
              draggable="false"
              class="slide-image block h-full w-full object-cover select-none"
            />
            <figcaption v-if="slide.photo.title" class="slide-caption absolute inset-x-0 bottom-0">
              <span class="line-clamp-2">{{ slide.photo.title }}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>

    <CarouselControls
      v-if="layout.scrollable"
      class="mt-6"
      :page-count="pages"
      :active-page="activePage"
      :can-prev="hasPrev"
      :can-next="hasNext"
      :autoplay-available="autoplay.available.value"
      :autoplay-paused="autoplay.userPaused.value"
      :autoplay-running="autoplay.running.value"
      :autoplay-interval-ms="props.settings.autoplayIntervalSeconds * 1000"
      :autoplay-cycle="autoplay.cycle.value"
      @prev="navigate(() => step(-1))"
      @next="navigate(() => step(1))"
      @page="(page) => navigate(() => goTo(indexOfPage(page, layout)))"
      @toggle-autoplay="autoplay.toggle"
    />

    <p class="sr-only" :aria-live="autoplay.running.value ? 'off' : 'polite'" aria-atomic="true">
      {{ announcement }}
    </p>
  </div>
</template>

<style scoped>
.viewport {
  touch-action: pan-y;
}
.viewport:focus-visible {
  outline: 2px solid var(--svc-color-4);
  outline-offset: 4px;
}
.viewport.is-dragging {
  cursor: grabbing;
  user-select: none;
}

.track {
  --gap: 1rem;
  gap: var(--gap);
  transform: translateX(
    calc((100% + var(--gap)) / var(--per-view) * var(--position) * -1 + var(--drag-px) * 1px)
  );
  will-change: transform;
}
.track.is-animated {
  transition: transform var(--slide-duration) cubic-bezier(0.22, 0.61, 0.36, 1);
}
@media (min-width: 640px) {
  .track {
    --gap: 1.25rem;
  }
}

.slide {
  flex: 0 0 calc((100% - (var(--per-view) - 1) * var(--gap)) / var(--per-view));
  min-width: 0;
}

.slide-frame {
  background: var(--svc-color-1);
}

.slide-image {
  transition: transform 0.6s ease;
}
@media (hover: hover) {
  .slide-frame:hover .slide-image {
    transform: scale(1.03);
  }
}

/* Scrim + text use the footer pair: a dark-on-light-text combo in every theme. */
.slide-caption {
  padding: 2.5rem 1rem 0.875rem;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--footer-bg) 88%, transparent),
    color-mix(in srgb, var(--footer-bg) 55%, transparent) 55%,
    transparent
  );
  color: var(--footer-text);
  font-size: calc(var(--size-subtitles) * 0.8);
  font-weight: 600;
  line-height: 1.3;
}

@media (prefers-reduced-motion: reduce) {
  .track.is-animated {
    transition: none;
  }
  .slide-image {
    transition: none;
  }
  .slide-frame:hover .slide-image {
    transform: none;
  }
}
</style>
