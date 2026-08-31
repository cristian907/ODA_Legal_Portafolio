<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

// Apply persisted theme + design tokens on app boot so the very first
// paint already reflects the visitor's saved configuration.
const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initFromStorage()
})
</script>

<template>
  <RouterView />
</template>
