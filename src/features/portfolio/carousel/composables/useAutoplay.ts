import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface AutoplayOptions {
  /** Autoplay is configured on and there is something to rotate. */
  enabled: Ref<boolean>
  intervalMs: Ref<number>
  reducedMotion: Ref<boolean>
  /** Hover and keyboard focus inside this element suspend rotation. */
  container: Ref<HTMLElement | null>
  /** True while the user is dragging the strip. */
  isDragging: Ref<boolean>
  onTick: () => void
}

/**
 * Timed rotation that yields to the user: it is off under reduced motion and is
 * suspended on hover, keyboard focus, drag and hidden tabs. Every (re)start
 * begins a fresh full interval.
 */
export function useAutoplay(options: AutoplayOptions) {
  const { enabled, intervalMs, reducedMotion, container, isDragging, onTick } = options
  const hovered = ref(false)
  const keyboardFocused = ref(false)
  const pageVisible = ref(typeof document === 'undefined' || document.visibilityState === 'visible')

  const running = computed(
    () =>
      enabled.value &&
      !reducedMotion.value &&
      !hovered.value &&
      !keyboardFocused.value &&
      !isDragging.value &&
      pageVisible.value,
  )

  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer(): void {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function schedule(): void {
    clearTimer()
    if (!running.value) return
    timer = setTimeout(() => {
      onTick()
      schedule()
    }, intervalMs.value)
  }

  /** Call after manual navigation so the next slide waits a full interval. */
  function restart(): void {
    if (running.value) schedule()
  }

  watch([running, intervalMs], schedule)

  function onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') hovered.value = true
  }
  function onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') hovered.value = false
  }
  function onFocusIn(event: FocusEvent): void {
    const target = event.target as Element | null
    keyboardFocused.value = target?.matches?.(':focus-visible') ?? false
  }
  function onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null
    if (!next || !container.value?.contains(next)) keyboardFocused.value = false
  }
  function onVisibilityChange(): void {
    pageVisible.value = document.visibilityState === 'visible'
  }

  onMounted(() => {
    const element = container.value
    element?.addEventListener('pointerenter', onPointerEnter)
    element?.addEventListener('pointerleave', onPointerLeave)
    element?.addEventListener('focusin', onFocusIn)
    element?.addEventListener('focusout', onFocusOut)
    document.addEventListener('visibilitychange', onVisibilityChange)
    schedule()
  })

  onBeforeUnmount(() => {
    clearTimer()
    const element = container.value
    element?.removeEventListener('pointerenter', onPointerEnter)
    element?.removeEventListener('pointerleave', onPointerLeave)
    element?.removeEventListener('focusin', onFocusIn)
    element?.removeEventListener('focusout', onFocusOut)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return { running, restart }
}
