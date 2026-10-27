<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-4 transition-all">
    <span
      class="player-caption whitespace-pre-line rounded bg-black/80 px-3 py-1.5 text-center font-semibold shadow-md backdrop-blur-xs"
    >
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
.player-caption {
  font-size: var(--size-body);
  color: var(--text-on-dark);
}
</style>
