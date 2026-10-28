<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '@/stores/gallery'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import PhotoCarousel from '@/features/portfolio/carousel/PhotoCarousel.vue'

type PreviewWidth = 'desktop' | 'mobile'

const MOBILE_WIDTH_PX = 375

const { photos, settings } = storeToRefs(useGalleryStore())

const width = ref<PreviewWidth>('desktop')
const widthOptions = [
  { value: 'desktop', label: 'Escritorio', icon: 'fa-desktop' },
  { value: 'mobile', label: 'Móvil', icon: 'fa-mobile-screen' },
]
// The frame's 1px borders sit outside the simulated screen width.
const frameStyle = computed(() => (width.value === 'mobile' ? { width: `${MOBILE_WIDTH_PX + 2}px` } : undefined))
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-5 py-2.5">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <i class="fas fa-eye" aria-hidden="true"></i> Vista previa
      </h3>
      <SegmentedControl
        v-model="width"
        :options="widthOptions"
        size="sm"
        role="group"
        aria-label="Ancho de la vista previa"
      />
    </div>

    <div
      v-if="photos.length > 0"
      class="flex flex-col items-center gap-3 p-5 [color-scheme:dark] min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto"
    >
      <div
        class="w-full max-w-full rounded-2xl border border-[#1e293b] bg-svc-1 py-8 transition-[width] duration-300 ease-out"
        :class="width === 'mobile' ? 'px-4' : 'px-6'"
        :style="frameStyle"
      >
        <PhotoCarousel :photos="photos" :settings="settings" label="Vista previa de la galería" />
      </div>
      <p v-if="width === 'mobile'" class="font-mono text-xs text-slate-500 tabular-nums">
        {{ MOBILE_WIDTH_PX }} px
      </p>
    </div>

    <div v-else class="flex flex-1 flex-col items-center justify-center gap-1 p-10 text-center">
      <p class="text-sm text-slate-300">Aún no hay fotos en el carrusel.</p>
      <p class="text-sm text-slate-500">Agrega fotos para ver cómo se mostrarán en el sitio.</p>
    </div>
  </div>
</template>
