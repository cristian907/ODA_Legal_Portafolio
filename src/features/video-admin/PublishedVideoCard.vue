<script setup lang="ts">
import { computed } from 'vue'
import type { VideoManifest } from '@/types/video'
import { formatTime } from '@/features/portfolio/player/utils/formatTime'

const props = defineProps<{ manifest: VideoManifest; disabled?: boolean }>()
const emit = defineEmits<{ retire: [] }>()

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

const createdLabel = computed(() => {
  const date = new Date(props.manifest.createdAt)
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
})

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-lg border border-[#c5a059]/30 bg-[#111827] p-4"
    aria-labelledby="publishedVideoHeading"
  >
    <div class="flex items-center justify-between gap-3">
      <h3
        id="publishedVideoHeading"
        class="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-[#e5be48]"
      >
        <i class="fas fa-circle text-[0.45rem]" aria-hidden="true"></i> Video publicado
      </h3>
      <span v-if="createdLabel" class="text-xs text-slate-500">{{ createdLabel }}</span>
    </div>

    <div class="flex items-start gap-3.5">
      <img
        v-if="manifest.poster?.path"
        :src="manifest.poster.path"
        alt="Miniatura del video"
        class="h-14 w-24 shrink-0 rounded-md border border-[#1e293b] object-cover"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-white" :title="manifest.title">{{ manifest.title }}</p>
        <p v-if="manifest.subtitle" class="truncate text-xs text-[#c5a059]" :title="manifest.subtitle">
          {{ manifest.subtitle }}
        </p>
        <p class="mt-0.5 text-xs text-slate-400">
          <span class="font-mono tabular-nums">{{ formatTime(manifest.durationSeconds) }}</span>
          · {{ plural(manifest.subtitles.length, 'subtítulo', 'subtítulos') }}
          · {{ plural(manifest.audioTracks.length, 'audio', 'audios') }}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="self-start rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-semibold text-red-400 transition outline-none hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="emit('retire')"
    >
      <i class="fas fa-trash-can" aria-hidden="true"></i> Retirar video
    </button>
  </section>
</template>
