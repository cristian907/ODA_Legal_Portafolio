<script setup lang="ts">
import type { CenterFeedback, SideFeedback } from './composables/usePlayerFeedback'

defineProps<{
  isBuffering: boolean
  centerFeedback: CenterFeedback
  sideFeedback: SideFeedback
}>()
</script>

<template>
  <div v-if="isBuffering" class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
    <div class="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-red-600"></div>
  </div>

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

  <div
    v-if="sideFeedback.show"
    :key="sideFeedback.key"
    class="pointer-events-none absolute inset-y-0 flex w-1/3 items-center justify-center"
    :class="sideFeedback.side === 'left' ? 'left-0' : 'right-0'"
  >
    <div
      class="animate-side-fade flex flex-col items-center justify-center gap-1 rounded-full bg-white/10 px-5 py-4 text-white backdrop-blur-md"
    >
      <i class="fas text-xl" :class="sideFeedback.side === 'left' ? 'fa-rotate-left' : 'fa-rotate-right'"></i>
      <span class="text-xs font-bold">{{ sideFeedback.text }}</span>
    </div>
  </div>
</template>

<style scoped>
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
