<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from './SectionHeader.vue'
import CustomVideoPlayer from './CustomVideoPlayer.vue'

const videoSource = '/assets/videos/volcano.mp4'
const theaterMode = ref(false)
const startSecond = ref(0)
</script>

<template>
  <section id="video" class="relative bg-surface py-20 transition-colors">
    <div
      class="mx-auto px-4 sm:px-6 transition-all duration-300"
      :class="theaterMode ? 'max-w-[1400px]' : 'max-w-5xl'"
    >
      <!-- Section Header -->
      <SectionHeader
        tag="Experiencia Multimedia"
        title="Presentación y Enfoque Profesional"
      />

      <!-- Custom Video Player Container -->
      <div class="relative">
        <CustomVideoPlayer
          :src="videoSource"
          title="Volcán en Erupción — Fuego y Humo"
          v-model:theater-mode="theaterMode"
          v-model:start-time="startSecond"
        />
      </div>
    </div>
  </section>
</template>
