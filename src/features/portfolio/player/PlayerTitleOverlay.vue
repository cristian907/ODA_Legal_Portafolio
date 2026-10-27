<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  visible: boolean
}>()
</script>

<template>
  <div
    class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300"
    :class="visible ? 'opacity-100' : 'opacity-0'"
  >
    <div>
      <h3 class="video-overlay-title font-semibold drop-shadow-md">
        {{ title }}
      </h3>
      <span class="video-overlay-subtitle drop-shadow-sm">
        {{ subtitle || 'Reproductor Personalizado ODA' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.video-overlay-title {
  font-size: var(--size-subtitles);
  color: var(--text-on-dark);
  line-height: 1.25;
}

.video-overlay-subtitle {
  font-size: var(--size-body);
  color: var(--text-on-dark);
  opacity: 0.8;
  line-height: 1.35;
  display: block;
}
</style>
