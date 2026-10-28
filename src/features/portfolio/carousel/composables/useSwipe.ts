import { onBeforeUnmount, ref, type Ref } from 'vue'

/** Pointer travel (px) before a press becomes a horizontal drag. */
const DRAG_START_PX = 8
/** Only the most recent samples (ms) count towards the release velocity. */
const VELOCITY_WINDOW_MS = 100

interface SwipeHandlers {
  enabled: () => boolean
  onStart: () => void
  /** Pointer travel since the drag started (px, negative = left). */
  onMove: (deltaX: number) => void
  /** Release with total travel (px) and release velocity (px/ms). */
  onEnd: (deltaX: number, velocity: number) => void
}

interface Sample {
  x: number
  time: number
}

/**
 * Horizontal drag/swipe with pointer events. Vertical page scrolling stays native
 * (the surface uses `touch-action: pan-y`), and a click right after a drag is swallowed.
 */
export function useSwipe(surface: Ref<HTMLElement | null>, handlers: SwipeHandlers) {
  const isDragging = ref(false)
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let samples: Sample[] = []

  function reset(): void {
    pointerId = null
    samples = []
    isDragging.value = false
  }

  function releaseVelocity(): number {
    const latest = samples[samples.length - 1]
    const earliest = samples.find((sample) => latest.time - sample.time <= VELOCITY_WINDOW_MS) ?? latest
    const elapsed = latest.time - earliest.time
    return elapsed > 0 ? (latest.x - earliest.x) / elapsed : 0
  }

  function swallowNextClick(): void {
    const element = surface.value
    if (!element) return
    const swallow = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    element.addEventListener('click', swallow, { capture: true, once: true })
    // If no click follows (e.g. touch), drop the listener on the next task.
    setTimeout(() => element.removeEventListener('click', swallow, { capture: true }), 0)
  }

  function onPointerDown(event: PointerEvent): void {
    if (!handlers.enabled() || pointerId !== null || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    samples = [{ x: event.clientX, time: event.timeStamp }]
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return
    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY
    samples.push({ x: event.clientX, time: event.timeStamp })
    if (samples.length > 20) samples.shift()

    if (!isDragging.value) {
      if (Math.abs(deltaY) > DRAG_START_PX && Math.abs(deltaY) > Math.abs(deltaX)) {
        reset() // Mostly vertical: not ours.
        return
      }
      if (Math.abs(deltaX) < DRAG_START_PX) return
      isDragging.value = true
      surface.value?.setPointerCapture?.(event.pointerId)
      handlers.onStart()
    }
    event.preventDefault()
    handlers.onMove(deltaX)
  }

  function onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return
    if (isDragging.value) {
      handlers.onEnd(event.clientX - startX, releaseVelocity())
      swallowNextClick()
    }
    reset()
  }

  function onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return
    if (isDragging.value) handlers.onEnd(0, 0)
    reset()
  }

  onBeforeUnmount(reset)

  return {
    isDragging,
    swipeListeners: {
      pointerdown: onPointerDown,
      pointermove: onPointerMove,
      pointerup: onPointerUp,
      pointercancel: onPointerCancel,
    },
  }
}
