<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useVideoStore } from '@/stores/video'
import CustomVideoPlayer from '@/features/portfolio/CustomVideoPlayer.vue'
import ContactSheet from './ContactSheet.vue'

const { manifest, isPublishing, uploadProgress } = storeToRefs(useVideoStore())

const player = ref<InstanceType<typeof CustomVideoPlayer> | null>(null)
const currentTime = ref(0)

watch(
  () => manifest.value?.id,
  () => (currentTime.value = 0),
)

const status = computed(() => {
  if (isPublishing.value) {
    return uploadProgress.value >= 100
      ? { label: 'Generando miniaturas', tone: 'text-[#e5be48]' }
      : { label: 'Publicando', tone: 'text-[#e5be48]' }
  }
  return manifest.value
    ? { label: 'Publicado', tone: 'text-emerald-400' }
    : { label: 'Sin video', tone: 'text-slate-500' }
})

function seek(seconds: number): void {
  player.value?.seekTo(seconds)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex shrink-0 items-center justify-between border-b border-[#1e293b] px-5 py-3">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <i class="fas fa-eye" aria-hidden="true"></i> Vista previa
      </h3>
      <span class="flex items-center gap-1.5 text-xs" :class="status.tone" aria-live="polite">
        <i class="fas fa-circle text-[0.5rem]" aria-hidden="true"></i> {{ status.label }}
      </span>
    </div>

    <div
      v-if="isPublishing || manifest"
      class="flex flex-col gap-8 p-5 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto [color-scheme:dark]"
    >
      <div
        v-if="isPublishing"
        class="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-[#1e293b] bg-[#0b0f17] text-center"
      >
        <i class="fas fa-circle-notch fa-spin text-lg text-[#c5a059]" aria-hidden="true"></i>
        <p class="text-sm text-slate-300">
          {{ uploadProgress >= 100 ? 'Generando miniaturas…' : 'Subiendo archivos…' }}
        </p>
        <p class="font-mono text-xs text-slate-500 tabular-nums">{{ uploadProgress }}%</p>
      </div>
      <CustomVideoPlayer
        v-else-if="manifest"
        ref="player"
        :key="manifest.id"
        :manifest="manifest"
        @time-update="currentTime = $event"
      />

      <ContactSheet
        :manifest="manifest"
        :pending="isPublishing"
        :current-time="currentTime"
        @seek="seek"
      />
    </div>

    <div v-else class="flex flex-1 flex-col items-center justify-center gap-1 p-10 text-center">
      <p class="text-sm text-slate-300">Aún no hay un video publicado.</p>
      <p class="text-sm text-slate-500">Completa el formulario para publicarlo.</p>
    </div>
  </div>
</template>
