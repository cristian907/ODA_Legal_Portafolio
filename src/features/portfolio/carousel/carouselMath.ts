// Pure carousel geometry. "Index" is a real photo (0..total-1); "position" is a
// slot in the rendered track, which may hold leading/trailing loop clones.

/** Container-width breakpoints (px) → photos visible at once. */
const BREAKPOINTS: ReadonlyArray<readonly [maxWidth: number, perView: number]> = [
  [640, 1],
  [1024, 3],
  [1536, 4],
]
const WIDEST_PER_VIEW = 5

/** Below this travel (px) a pointer gesture is a tap, not a drag. */
const TAP_TOLERANCE_PX = 10
/** Fraction of a slide that a slow drag must travel to change slide. */
const DRAG_DISTANCE_RATIO = 0.2
/** Release speed (px/ms) that counts as a flick regardless of distance. */
const FLICK_VELOCITY = 0.5
/** How much of the pointer travel is applied when pulling past an edge. */
const EDGE_RESISTANCE = 0.35

export interface CarouselLayout {
  total: number
  perView: number
  /** True when the track wraps around with clones at both ends. */
  looping: boolean
  /** Clone slides rendered before the first and after the last real slide. */
  clones: number
  /** Highest index that can be the first visible slide. */
  maxIndex: number
  /** False when every photo fits in a single view. */
  scrollable: boolean
}

export function slidesPerView(containerWidth: number): number {
  const match = BREAKPOINTS.find(([maxWidth]) => containerWidth < maxWidth)
  return match ? match[1] : WIDEST_PER_VIEW
}

export function carouselLayout(total: number, perView: number, loop: boolean): CarouselLayout {
  const scrollable = total > perView
  const looping = loop && scrollable
  return {
    total,
    perView,
    looping,
    clones: looping ? perView : 0,
    maxIndex: !scrollable ? 0 : looping ? total - 1 : total - perView,
    scrollable,
  }
}

export function pageCount(layout: CarouselLayout): number {
  return layout.scrollable ? Math.ceil(layout.total / layout.perView) : 1
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Index reached after moving `delta` slides: wraps while looping, clamps otherwise. */
export function stepIndex(index: number, delta: number, layout: CarouselLayout): number {
  if (!layout.scrollable) return 0
  return layout.looping ? modulo(index + delta, layout.total) : clamp(index + delta, 0, layout.maxIndex)
}

export function canGoPrev(index: number, layout: CarouselLayout): boolean {
  return layout.scrollable && (layout.looping || index > 0)
}

export function canGoNext(index: number, layout: CarouselLayout): boolean {
  return layout.scrollable && (layout.looping || index < layout.maxIndex)
}

export function positionOfIndex(index: number, layout: CarouselLayout): number {
  return index + layout.clones
}

/** The real photo shown at a track position, resolving clones to their source. */
export function indexOfPosition(position: number, layout: CarouselLayout): number {
  if (layout.total === 0) return 0
  return modulo(position - layout.clones, layout.total)
}

export function isClonePosition(position: number, layout: CarouselLayout): boolean {
  return position < layout.clones || position >= layout.clones + layout.total
}

/** For every rendered slot (clones included), the index of the photo it shows. */
export function slideSourceIndexes(layout: CarouselLayout): number[] {
  const slots = layout.total + layout.clones * 2
  return Array.from({ length: slots }, (_, position) => indexOfPosition(position, layout))
}

export function indexOfPage(page: number, layout: CarouselLayout): number {
  const start = page * layout.perView
  return layout.looping ? start : clamp(start, 0, layout.maxIndex)
}

export function pageOfIndex(index: number, layout: CarouselLayout): number {
  const lastPage = pageCount(layout) - 1
  if (!layout.looping && index >= layout.maxIndex) return lastPage
  return clamp(Math.floor(index / layout.perView), 0, lastPage)
}

/**
 * Slides to move after a drag ends: positive = next, negative = previous, 0 = stay.
 * `deltaX` is the pointer travel (negative = dragged left), `velocity` its release speed in px/ms.
 */
export function resolveSwipe(deltaX: number, velocity: number, slideWidth: number): number {
  const distance = Math.abs(deltaX)
  if (slideWidth <= 0 || distance < TAP_TOLERANCE_PX) return 0
  const direction = deltaX < 0 ? 1 : -1
  if (distance >= slideWidth * DRAG_DISTANCE_RATIO) {
    return direction * Math.max(1, Math.round(distance / slideWidth))
  }
  const isFlick = Math.abs(velocity) >= FLICK_VELOCITY && Math.sign(velocity) === Math.sign(deltaX)
  return isFlick ? direction : 0
}

/** Pixel offset the track follows while dragging, rubber-banded past either edge. */
export function dragOffset(deltaX: number, atStart: boolean, atEnd: boolean): number {
  const pullingPastEdge = (atStart && deltaX > 0) || (atEnd && deltaX < 0)
  return pullingPastEdge ? deltaX * EDGE_RESISTANCE : deltaX
}
