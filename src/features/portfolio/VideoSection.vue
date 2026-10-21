<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useVideoStore } from '@/stores/video'
import SectionHeader from './SectionHeader.vue'
import CustomVideoPlayer from './CustomVideoPlayer.vue'

const { manifest } = storeToRefs(useVideoStore())
const theaterMode = ref(false)
const startSecond = ref(0)

watch(
  () => manifest.value?.id,
  () => {
    startSecond.value = 0
  },
)
</script>

<template>
  <section id="video" class="relative bg-surface py-20 transition-colors">
    <div
      class="mx-auto px-4 sm:px-6 transition-all duration-300"
      :class="theaterMode ? 'max-w-[1400px]' : 'max-w-5xl'"
    >
      <SectionHeader
        tag="Experiencia Multimedia"
        title="Presentación y Enfoque Profesional"
      />

      <div class="relative">
        <CustomVideoPlayer
          v-if="manifest"
          :key="manifest.id"
          :manifest="manifest"
          v-model:theater-mode="theaterMode"
          v-model:start-time="startSecond"
        />

        <div
          v-else
          class="mx-auto flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-black px-6 text-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/70">
            <i class="fas fa-film text-xl"></i>
          </span>
          <p class="text-base font-semibold sm:text-lg">Aún no hay un video publicado.</p>
          <p class="text-sm text-white/60">Publica uno desde el panel de administración.</p>
        </div>
      </div>
    </div>
  </section>
</template>
