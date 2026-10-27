<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  volume: number
  muted: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-mute'): void
  (e: 'change', volume: number): void
}>()

const volumeIcon = computed(() => {
  if (props.muted || props.volume === 0) return 'fa-volume-xmark'
  if (props.volume < 0.5) return 'fa-volume-low'
  return 'fa-volume-high'
})

function onSliderInput(event: Event): void {
  emit('change', Number.parseFloat((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="group/volume flex items-center">
    <button
      class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-base transition-transform hover:scale-110 hover:text-[var(--svc-color-4)] active:scale-95"
      :title="muted ? 'Desactivar silencio (m)' : 'Silenciar (m)'"
      @click="$emit('toggle-mute')"
    >
      <i class="fas" :class="volumeIcon"></i>
    </button>

    <div
      class="flex w-0 items-center overflow-hidden transition-all duration-300 ease-out group-hover/volume:w-20 group-hover/volume:px-1"
    >
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="muted ? 0 : volume"
        class="yt-volume-slider h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-[var(--svc-color-4)]"
        @input="onSliderInput"
      />
    </div>
  </div>
</template>

<style scoped>
.yt-volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--svc-color-4);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.yt-volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--svc-color-4);
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
</style>
