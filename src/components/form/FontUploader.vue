<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

defineProps<{ fontName?: string | null }>()
const emit = defineEmits<{
  load: [payload: { dataUrl: string; name: string }]
  reset: []
}>()

const { show } = useToast()
const dragover = ref(false)

function readFile(file: File | undefined) {
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.ttf')) {
    show('Selecciona un archivo de fuente válido (.ttf)', 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => emit('load', { dataUrl: String(evt.target?.result ?? ''), name: file.name })
  reader.readAsDataURL(file)
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  readFile(input.files?.[0])
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragover.value = false
  readFile(e.dataTransfer?.files?.[0])
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <input id="fontFileInput" type="file" accept=".ttf" class="hidden" @change="onChange" />
    <label
      for="fontFileInput"
      class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-5 text-center transition"
      :class="dragover ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#1e293b] hover:border-[#c5a059]/60'"
      @dragenter.prevent="dragover = true"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
    >
      <i class="fas fa-cloud-arrow-up text-xl text-[#c5a059]"></i>
      <span class="text-sm text-slate-300">Elegir archivo <strong>.ttf</strong></span>
      <span class="text-xs text-slate-500">o arrástralo aquí</span>
    </label>

    <div class="flex items-center justify-between rounded-lg bg-[#0b0f17] px-3 py-2">
      <span class="truncate text-xs text-slate-400">
        <i class="fas fa-font mr-1"></i>
        {{ fontName || 'Plus Jakarta Sans (por defecto)' }}
      </span>
      <button
        type="button"
        class="shrink-0 text-slate-400 transition hover:text-white"
        title="Usar fuente por defecto"
        @click="emit('reset')"
      >
        <i class="fas fa-undo"></i>
      </button>
    </div>
  </div>
</template>
