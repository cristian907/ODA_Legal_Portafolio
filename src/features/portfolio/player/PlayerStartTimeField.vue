<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  max: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', seconds: number): void
}>()

function clampToVideo(seconds: number): number {
  if (Number.isNaN(seconds) || seconds < 0) return 0
  if (props.max > 0 && seconds > props.max) return props.max
  return seconds
}

function onInput(event: Event): void {
  const input = event.target as HTMLInputElement
  const raw = input.value.trim()
  if (raw === '') return
  const seconds = clampToVideo(Number.parseInt(raw, 10))
  input.value = String(seconds)
  emit('update:modelValue', seconds)
}
</script>

<template>
  <div
    class="ml-1 flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-white/15 sm:ml-2"
    title="Indica el segundo exacto desde el que arrancará la reproducción"
  >
    <i class="fas fa-stopwatch text-[11px] text-red-500"></i>
    <span class="hidden text-[11px] font-medium text-white/80 md:inline">Inicio:</span>
    <input
      type="number"
      min="0"
      :max="max"
      :value="modelValue"
      class="w-12 rounded bg-black/50 px-1 py-0.5 text-center font-mono text-xs font-bold text-white focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-red-500"
      title="Escribe el segundo de inicio"
      @input="onInput"
      @keydown.stop
    />
    <span class="text-[10px] text-white/60">s</span>
  </div>
</template>
