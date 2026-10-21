<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-4 transition-all">
    <span
      class="whitespace-pre-line rounded bg-black/80 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-md backdrop-blur-xs sm:text-sm"
    >
      {{ text }}
    </span>
  </div>
</template>
