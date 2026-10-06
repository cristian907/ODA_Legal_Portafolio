<script setup lang="ts">
const props = defineProps<{
  pageCount: number
  activePage: number
  canPrev: boolean
  canNext: boolean
  /** Show the pause/play toggle (autoplay configured and motion allowed). */
  autoplayAvailable: boolean
  autoplayPaused: boolean
  /** Rotation is actually ticking right now (drives the countdown ring). */
  autoplayRunning: boolean
  autoplayIntervalMs: number
  /** Changes on every fresh interval so the countdown restarts. */
  autoplayCycle: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  page: [page: number]
  toggleAutoplay: []
}>()

const RING_RADIUS = 20
const RING_LENGTH = 2 * Math.PI * RING_RADIUS
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex min-w-0 items-center gap-4">
      <button
        v-if="props.autoplayAvailable"
        type="button"
        class="control-btn relative"
        :aria-label="props.autoplayPaused ? 'Reanudar presentación' : 'Pausar presentación'"
        @click="emit('toggleAutoplay')"
      >
        <svg
          v-if="props.autoplayRunning"
          :key="props.autoplayCycle"
          class="countdown pointer-events-none absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 44 44"
          aria-hidden="true"
        >
          <circle
            cx="22"
            cy="22"
            :r="RING_RADIUS"
            fill="none"
            class="countdown-arc"
            :style="{
              strokeDasharray: RING_LENGTH,
              '--ring-length': RING_LENGTH,
              animationDuration: `${props.autoplayIntervalMs}ms`,
            }"
          />
        </svg>
        <i class="fas text-xs" :class="props.autoplayPaused ? 'fa-play translate-x-px' : 'fa-pause'" aria-hidden="true"></i>
      </button>

      <div v-if="props.pageCount > 1" class="flex flex-wrap items-center gap-1" role="group" aria-label="Páginas de fotos">
        <button
          v-for="page in props.pageCount"
          :key="page"
          type="button"
          class="dot-hit"
          :aria-label="`Ir a la página ${page} de ${props.pageCount}`"
          :aria-current="page - 1 === props.activePage ? 'true' : undefined"
          @click="emit('page', page - 1)"
        >
          <span class="dot" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button type="button" class="control-btn" aria-label="Foto anterior" :disabled="!props.canPrev" @click="emit('prev')">
        <i class="fas fa-chevron-left text-sm" aria-hidden="true"></i>
      </button>
      <button type="button" class="control-btn" aria-label="Foto siguiente" :disabled="!props.canNext" @click="emit('next')">
        <i class="fas fa-chevron-right text-sm" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.control-btn {
  display: inline-flex;
  height: 44px;
  width: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--svc-color-3) 18%, transparent);
  background: var(--svc-color-2);
  color: var(--svc-color-3);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    opacity var(--transition-fast);
}
.control-btn:hover:not(:disabled) {
  background: var(--svc-color-4);
  border-color: var(--svc-color-4);
  color: var(--svc-color-2);
}
.control-btn:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.control-btn:focus-visible,
.dot-hit:focus-visible {
  outline: 2px solid var(--svc-color-4);
  outline-offset: 3px;
}

.countdown-arc {
  stroke: var(--svc-color-4);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dashoffset: calc(var(--ring-length) * 1px);
  animation-name: countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes countdown {
  to {
    stroke-dashoffset: 0;
  }
}

/* 24px hit area around a small visual dot. */
.dot-hit {
  display: inline-flex;
  height: 24px;
  min-width: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
}
.dot {
  display: block;
  height: 8px;
  width: 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--svc-color-3) 28%, transparent);
  transition:
    width var(--transition-normal),
    background-color var(--transition-normal);
}
.dot-hit:hover .dot {
  background: color-mix(in srgb, var(--svc-color-3) 55%, transparent);
}
.dot-hit[aria-current='true'] .dot {
  width: 24px;
  background: var(--svc-color-4);
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    transition: none;
  }
}
</style>
