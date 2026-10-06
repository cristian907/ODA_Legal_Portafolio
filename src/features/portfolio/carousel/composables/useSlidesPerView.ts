import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { slidesPerView } from '../carouselMath'

/**
 * Slides visible at once, derived from the carousel's own width (not the window)
 * so it also adapts inside narrower hosts such as the admin preview pane.
 */
export function useSlidesPerView(container: Ref<HTMLElement | null>) {
  const perView = ref(1)
  let observer: ResizeObserver | null = null

  function update(width: number): void {
    perView.value = slidesPerView(width)
  }

  onMounted(() => {
    const element = container.value
    if (!element) return
    update(element.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(([entry]) => {
      const borderBox = entry.borderBoxSize?.[0]
      update(borderBox ? borderBox.inlineSize : entry.target.getBoundingClientRect().width)
    })
    observer.observe(element)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { perView }
}
