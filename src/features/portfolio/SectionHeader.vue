<script setup lang="ts">
defineProps({
  tag: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="mx-auto mb-16 max-w-[750px] text-center">
    <span class="section-tag mb-3 inline-block font-bold uppercase tracking-[2px] text-svc-4">{{ tag }}</span>
    <h2 class="section-title mb-4 font-bold text-svc-3">{{ title }}</h2>
    <p v-if="subtitle" class="section-subtitle text-svc-3 opacity-85">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
.section-title {
  font-size: var(--size-titles);
  line-height: 1.2;
}

/* Tag + subtitle follow the themeable subtitle token. */
.section-tag,
.section-subtitle {
  font-size: var(--size-subtitles);
}
</style>
