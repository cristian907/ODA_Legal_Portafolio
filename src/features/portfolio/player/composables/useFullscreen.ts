import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useFullscreen(targetRef: Ref<HTMLElement | null>) {
  const isFullscreen = ref(false)

  function toggleFullscreen(): void {
    if (!targetRef.value) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    } else {
      targetRef.value.requestFullscreen?.().catch(() => {})
    }
  }

  function syncFullscreenState(): void {
    isFullscreen.value = Boolean(document.fullscreenElement)
  }

  onMounted(() => document.addEventListener('fullscreenchange', syncFullscreenState))
  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreenState))

  return { isFullscreen, toggleFullscreen }
}
