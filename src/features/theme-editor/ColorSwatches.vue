<script setup lang="ts">
import type { Palette, PaletteKey } from '@/types/theme'

defineProps<{ palette: Palette }>()
const keys: PaletteKey[] = ['c1', 'c2', 'c3', 'c4', 'c5']
</script>

<template>
  <div class="flex gap-1.5">
    <span
      v-for="k in keys"
      :key="k"
      class="h-5 w-5 rounded border border-black/20"
      :style="{ background: palette[k] }"
    ></span>
  </div>
</template>
