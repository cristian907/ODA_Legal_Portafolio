<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { MAX_VIDEO_BYTES, VIDEO_EXTENSIONS } from '@/schemas/video'
import { formatTime } from '@/features/portfolio/player/utils/formatTime'
import { formatFileSize } from './formatFileSize'
import { splitByExtension } from './splitByExtension'

const props = defineProps<{ file: File | null; disabled?: boolean }>()
const emit = defineEmits<{ select: [file: File]; remove: [] }>()

const { show } = useToast()
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const durationSeconds = ref<number | null>(null)

const accept = VIDEO_EXTENSIONS.join(',')

/** Reads the duration locally through a detached video element; the file never leaves the browser. */
function readDuration(file: File, onDone: (seconds: number | null) => void): () => void {
  const url = URL.createObjectURL(file)
  const probe = document.createElement('video')
  probe.preload = 'metadata'
  const finish = (seconds: number | null) => {
    URL.revokeObjectURL(url)
    probe.removeAttribute('src')
    onDone(seconds)
  }
  probe.onloadedmetadata = () => finish(Number.isFinite(probe.duration) ? probe.duration : null)
  probe.onerror = () => finish(null)
  probe.src = url
  return () => {
    probe.onloadedmetadata = null
    probe.onerror = null
    URL.revokeObjectURL(url)
  }
}

watch(
  () => props.file,
  (file, _previous, onCleanup) => {
    durationSeconds.value = null
    if (!file) return
    onCleanup(readDuration(file, (seconds) => (durationSeconds.value = seconds)))
  },
  { immediate: true },
)

function pick(files: File[]): void {
  if (files.length === 0) return
  const { accepted } = splitByExtension(files, VIDEO_EXTENSIONS)
  if (accepted.length === 0) {
    show('El video debe ser .mp4 o .webm', 'error')
    return
  }
  if (accepted[0].size > MAX_VIDEO_BYTES) {
    show(`El video puede pesar como máximo ${MAX_VIDEO_BYTES / (1024 * 1024)} MB`, 'error')
    return
  }
  emit('select', accepted[0])
}

function openPicker(): void {
  if (!props.disabled) inputRef.value?.click()
}

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  pick(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(event: DragEvent): void {
  isDragging.value = false
  if (!props.disabled) pick(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <div>
    <input
      id="videoFileInput"
      ref="inputRef"
      type="file"
      :accept="accept"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="onChange"
    />

    <button
      v-if="!file"
      type="button"
      class="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-60"
      :class="isDragging ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#1e293b] hover:border-[#c5a059]/60'"
      :disabled="disabled"
      aria-describedby="videoDropzoneHint"
      @click="openPicker"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <i class="fas fa-film text-xl text-[#c5a059]" aria-hidden="true"></i>
      <span class="text-sm text-slate-300">Elegir video</span>
      <span id="videoDropzoneHint" class="text-xs text-slate-500">
        o arrástralo aquí · .mp4 o .webm
      </span>
    </button>

    <div
      v-else
      class="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#111827] px-3 py-2.5"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#c5a059]/15 text-[#e5be48]"
        aria-hidden="true"
      >
        <i class="fas fa-film"></i>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-slate-200" :title="file.name">{{ file.name }}</p>
        <p class="font-mono text-xs text-slate-500 tabular-nums">
          {{ formatFileSize(file.size) }}
          <template v-if="durationSeconds !== null"> · {{ formatTime(durationSeconds) }}</template>
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 transition outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:opacity-50"
        :disabled="disabled"
        @click="openPicker"
      >
        Cambiar
      </button>
      <button
        type="button"
        class="shrink-0 rounded-md px-2 py-1 text-slate-400 transition outline-none hover:text-red-400 focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:opacity-50"
        :disabled="disabled"
        :aria-label="`Quitar ${file.name}`"
        @click="emit('remove')"
      >
        <i class="fas fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>
