<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { MAX_POSTER_BYTES, POSTER_EXTENSIONS } from '@/schemas/video'
import { formatFileSize } from './formatFileSize'
import { splitByExtension } from './splitByExtension'

const props = defineProps<{ file?: File | null; disabled?: boolean }>()
const emit = defineEmits<{ select: [file: File]; remove: [] }>()

const { show } = useToast()
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref<string | null>(null)

const accept = POSTER_EXTENSIONS.join(',')

watch(
  () => props.file,
  (file, _previous, onCleanup) => {
    if (!file) {
      previewUrl.value = null
      return
    }
    const url = URL.createObjectURL(file)
    previewUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
  },
  { immediate: true },
)

function pick(files: File[]): void {
  if (files.length === 0) return
  const { accepted } = splitByExtension(files, POSTER_EXTENSIONS)
  if (accepted.length === 0) {
    show('La miniatura debe ser .jpg, .jpeg, .png o .webp', 'error')
    return
  }
  if (accepted[0].size > MAX_POSTER_BYTES) {
    show(`La miniatura puede pesar como máximo ${MAX_POSTER_BYTES / (1024 * 1024)} MB`, 'error')
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
      id="posterFileInput"
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
      class="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-60"
      :class="isDragging ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#1e293b] hover:border-[#c5a059]/60'"
      :disabled="disabled"
      aria-describedby="posterDropzoneHint"
      @click="openPicker"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <i class="fas fa-image text-xl text-[#c5a059]" aria-hidden="true"></i>
      <span class="text-sm text-slate-300">Elegir miniatura</span>
      <span id="posterDropzoneHint" class="text-xs text-slate-500">
        o arrástrala aquí · .jpg, .jpeg, .png o .webp
      </span>
    </button>

    <div
      v-else
      class="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#111827] px-3 py-2.5"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Vista previa de miniatura"
        class="h-12 w-20 shrink-0 rounded-md border border-[#1e293b] object-cover"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-slate-200" :title="file.name">{{ file.name }}</p>
        <p class="font-mono text-xs text-slate-500 tabular-nums">
          {{ formatFileSize(file.size) }}
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
