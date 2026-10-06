<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '@/stores/gallery'
import SectionHeader from '../SectionHeader.vue'
import PhotoCarousel from './PhotoCarousel.vue'

const { photos, settings } = storeToRefs(useGalleryStore())
</script>

<template>
  <section id="galeria" class="border-b border-svc-3/10 bg-svc-1 py-20 transition-colors">
    <div class="app-container">
      <SectionHeader
        tag="Instalaciones &amp; Despacho"
        title="Galería Profesional"
        subtitle="Conoce mis instalaciones de primer nivel y la atención profesional a tu servicio."
      />
    </div>

    <div class="mx-auto w-full max-w-[1800px] px-4 sm:px-6">
      <PhotoCarousel v-if="photos.length > 0" :photos="photos" :settings="settings" />

      <div
        v-else
        class="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-svc-3/20 px-6 py-12 text-center"
      >
        <span class="flex h-12 w-12 items-center justify-center rounded-full bg-svc-1 text-svc-4">
          <i class="fas fa-images" aria-hidden="true"></i>
        </span>
        <p class="font-semibold text-svc-3">Aún no hay fotos en la galería.</p>
        <p class="text-sm text-svc-3 opacity-70">Agrega fotos desde el panel de administración.</p>
      </div>
    </div>
  </section>
</template>
