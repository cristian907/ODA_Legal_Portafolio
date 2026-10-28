import { computed, nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import {
  indexOfPosition,
  isClonePosition,
  positionOfIndex,
  stepIndex,
  type CarouselLayout,
} from '../carouselMath'

/** Must match the track's CSS transition duration. */
export const SLIDE_TRANSITION_MS = 450
/** Extra wait before assuming `transitionend` will never come (hidden tab, interrupted transition). */
const SETTLE_FALLBACK_MARGIN_MS = 120

interface CarouselTrackOptions {
  layout: Ref<CarouselLayout>
  track: Ref<HTMLElement | null>
  reducedMotion: Ref<boolean>
}

/**
 * Owns the track position. While looping, moves may land on a clone; once the
 * transition ends the track jumps, without animating, to the real counterpart
 * so the wrap is seamless.
 */
export function useCarouselTrack({ layout, track, reducedMotion }: CarouselTrackOptions) {
  const position = ref(positionOfIndex(0, layout.value))
  /** False while dragging or during the silent clone → real jump. */
  const animate = ref(true)
  /** Live pointer offset (px) applied on top of the position while dragging. */
  const dragPx = ref(0)

  const index = computed(() => indexOfPosition(position.value, layout.value))
  const lastPosition = computed(() => layout.value.total + layout.value.clones * 2 - 1)

  let fallbackTimer: ReturnType<typeof setTimeout> | null = null

  function clearFallback(): void {
    if (fallbackTimer) clearTimeout(fallbackTimer)
    fallbackTimer = null
  }

  /** Re-renders the track at `target` with transitions off, then turns them back on. */
  async function jumpWithoutTransition(target: number): Promise<void> {
    animate.value = false
    position.value = target
    await nextTick()
    void track.value?.offsetWidth // Commit the un-animated transform before re-enabling transitions.
    animate.value = true
  }

  /** Leaves a clone slot for the real slide showing the same photo. */
  async function settle(): Promise<void> {
    clearFallback()
    if (!isClonePosition(position.value, layout.value)) return
    await jumpWithoutTransition(positionOfIndex(index.value, layout.value))
  }

  function moveTo(target: number): void {
    const next = Math.min(Math.max(target, 0), Math.max(lastPosition.value, 0))
    if (next === position.value) return
    position.value = next
    clearFallback()
    if (reducedMotion.value) {
      void nextTick(settle)
      return
    }
    fallbackTimer = setTimeout(settle, SLIDE_TRANSITION_MS + SETTLE_FALLBACK_MARGIN_MS)
  }

  /** Moves `delta` slides from the current one, wrapping or clamping as the layout allows. */
  async function step(delta: number): Promise<void> {
    if (delta === 0 || !layout.value.scrollable) return
    if (isClonePosition(position.value, layout.value)) await settle()
    const target = layout.value.looping
      ? position.value + delta
      : positionOfIndex(stepIndex(index.value, delta, layout.value), layout.value)
    moveTo(target)
  }

  async function goTo(targetIndex: number): Promise<void> {
    if (isClonePosition(position.value, layout.value)) await settle()
    moveTo(positionOfIndex(targetIndex, layout.value))
  }

  function onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== track.value || event.propertyName !== 'transform') return
    void settle()
  }

  function startDrag(): void {
    animate.value = false
    dragPx.value = 0
  }

  function updateDrag(offset: number): void {
    dragPx.value = offset
  }

  /** Releases the drag and animates by `delta` slides (0 snaps back). */
  async function endDrag(delta: number): Promise<void> {
    animate.value = true
    dragPx.value = 0
    await step(delta)
  }

  // Photos, slides per view or loop changed: keep the same first photo, clamped, without animating.
  watch(layout, (current, previous) => {
    const previousIndex = indexOfPosition(position.value, previous)
    const target = positionOfIndex(Math.min(previousIndex, current.maxIndex), current)
    clearFallback()
    if (target !== position.value) void jumpWithoutTransition(target)
  })

  onBeforeUnmount(clearFallback)

  return { position, index, animate, dragPx, step, goTo, onTransitionEnd, startDrag, updateDrag, endDrag }
}
