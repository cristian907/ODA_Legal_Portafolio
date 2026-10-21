import { onBeforeUnmount, ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Live `prefers-reduced-motion: reduce` flag. */
export function usePrefersReducedMotion() {
  const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null
  const reducedMotion = ref(media?.matches ?? false)

  function onChange(event: MediaQueryListEvent): void {
    reducedMotion.value = event.matches
  }

  media?.addEventListener('change', onChange)
  onBeforeUnmount(() => media?.removeEventListener('change', onChange))

  return { reducedMotion }
}
