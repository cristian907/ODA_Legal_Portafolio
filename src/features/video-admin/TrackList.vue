<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type { VideoTrackDraft } from '@/types/video'
import { splitByExtension } from './splitByExtension'
import type { TrackField } from './useVideoDraft'

const props = defineProps<{
  idPrefix: string
  heading: string
  icon: string
  addLabel: string
  tracks: VideoTrackDraft[]
  minimum: number
  extensions: readonly string[]
  formatMessage: string
  labelPlaceholder: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  add: [files: File[]]
  update: [index: number, field: TrackField, value: string]
  remove: [index: number]
}>()

const { show } = useToast()
const inputRef = ref<HTMLInputElement | null>(null)

const count = computed(() => props.tracks.filter((track) => track.file !== null).length)
const isSatisfied = computed(() => count.value >= props.minimum)
const accept = computed(() => props.extensions.join(','))

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const { accepted, rejected } = splitByExtension(Array.from(input.files ?? []), props.extensions)
  input.value = ''
  if (rejected.length > 0) show(props.formatMessage, 'error')
  if (accepted.length > 0) emit('add', accepted)
}

function onInput(index: number, field: TrackField, event: Event): void {
  emit('update', index, field, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <section class="flex flex-col gap-2.5" :aria-labelledby="`${idPrefix}-heading`">
    <div class="flex items-baseline justify-between gap-3">
      <h3
        :id="`${idPrefix}-heading`"
        class="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500"
      >
        {{ heading }}
      </h3>
      <span
        class="text-xs transition-colors"
        :class="isSatisfied ? 'text-[#e5be48]' : 'text-slate-500'"
      >
        <span class="font-mono tabular-nums">{{ count }}</span> de
        <span class="font-mono tabular-nums">{{ minimum }}</span> mínimo
      </span>
    </div>

    <ul v-if="tracks.length > 0" class="flex flex-col gap-2">
      <li
        v-for="(track, index) in tracks"
        :key="`${index}-${track.file?.name}`"
        class="rounded-lg border border-[#1e293b] bg-[#111827] p-3"
      >
        <div class="mb-2.5 flex items-center gap-2">
          <i class="fas shrink-0 text-xs text-[#c5a059]" :class="icon" aria-hidden="true"></i>
          <span class="min-w-0 flex-1 truncate text-sm text-slate-200" :title="track.file?.name">
            {{ track.file?.name }}
          </span>
          <button
            type="button"
            class="shrink-0 rounded-md px-1.5 py-0.5 text-slate-400 transition outline-none hover:text-red-400 focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:opacity-50"
            :disabled="disabled"
            :aria-label="`Quitar ${track.file?.name ?? 'pista'}`"
            @click="emit('remove', index)"
          >
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="grid grid-cols-[1fr_5.5rem] gap-2">
          <div class="flex min-w-0 flex-col gap-1">
            <label :for="`${idPrefix}-label-${index}`" class="text-xs text-slate-500">Etiqueta</label>
            <input
              :id="`${idPrefix}-label-${index}`"
              :value="track.label"
              type="text"
              :placeholder="labelPlaceholder"
              :disabled="disabled"
              class="w-full rounded-lg border bg-[#0b0f17] px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#c5a059]"
              :class="track.label.trim() ? 'border-[#1e293b]' : 'border-[#c5a059]/40'"
              @input="onInput(index, 'label', $event)"
            />
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <label :for="`${idPrefix}-lang-${index}`" class="text-xs text-slate-500">Idioma</label>
            <input
              :id="`${idPrefix}-lang-${index}`"
              :value="track.language"
              type="text"
              placeholder="es"
              maxlength="12"
              autocapitalize="off"
              spellcheck="false"
              :disabled="disabled"
              class="w-full rounded-lg border bg-[#0b0f17] px-3 py-1.5 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#c5a059]"
              :class="track.language.trim() ? 'border-[#1e293b]' : 'border-[#c5a059]/40'"
              @input="onInput(index, 'language', $event)"
            />
          </div>
        </div>
      </li>
    </ul>

    <input
      ref="inputRef"
      type="file"
      multiple
      :accept="accept"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="onChange"
    />
    <button
      type="button"
      class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#1e293b] px-3 py-2.5 text-sm font-semibold text-slate-300 transition outline-none hover:border-[#c5a059]/60 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="inputRef?.click()"
    >
      <i class="fas fa-plus text-xs text-[#c5a059]" aria-hidden="true"></i> {{ addLabel }}
    </button>
  </section>
</template>
