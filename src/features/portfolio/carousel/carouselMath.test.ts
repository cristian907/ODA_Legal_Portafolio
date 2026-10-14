import { describe, expect, it } from 'vitest'
import {
  canGoNext,
  canGoPrev,
  carouselLayout,
  dragOffset,
  indexOfPage,
  indexOfPosition,
  isClonePosition,
  pageCount,
  pageOfIndex,
  positionOfIndex,
  resolveSwipe,
  slideSourceIndexes,
  slidesPerView,
  stepIndex,
} from './carouselMath'

describe('slidesPerView', () => {
  it.each([
    [0, 1],
    [375, 1],
    [639, 1],
    [640, 3],
    [1024, 3],
    [1536, 3],
    [2400, 3],
  ])('shows the right count at %ipx', (width, expected) => {
    expect(slidesPerView(width)).toBe(expected)
  })

  it('supports custom desktop counts (4, 5)', () => {
    expect(slidesPerView(1024, 4)).toBe(4)
    expect(slidesPerView(1024, 5)).toBe(5)
    expect(slidesPerView(375, 5)).toBe(1)
  })
})

describe('carouselLayout', () => {
  it('clones one view of slides at each end when looping with more photos than fit', () => {
    expect(carouselLayout(8, 3, true)).toEqual({ total: 8, perView: 3, looping: true, clones: 3, maxIndex: 7, scrollable: true })
  })

  it('clones double the view of slides when looping and stepping by group', () => {
    expect(carouselLayout(8, 3, true, 3)).toEqual({ total: 8, perView: 3, looping: true, clones: 6, maxIndex: 7, scrollable: true })
  })

  it('does not clone when loop is off and stops at the last full view', () => {
    expect(carouselLayout(8, 3, false)).toEqual({ total: 8, perView: 3, looping: false, clones: 0, maxIndex: 5, scrollable: true })
  })

  it('is static when every photo fits in one view', () => {
    expect(carouselLayout(3, 3, true)).toEqual({ total: 3, perView: 3, looping: false, clones: 0, maxIndex: 0, scrollable: false })
    expect(carouselLayout(2, 5, false)).toMatchObject({ looping: false, clones: 0, maxIndex: 0, scrollable: false })
  })

  it('handles an empty gallery', () => {
    expect(carouselLayout(0, 1, true)).toMatchObject({ looping: false, clones: 0, maxIndex: 0, scrollable: false })
  })
})

describe('pageCount', () => {
  it('rounds partial views up', () => {
    expect(pageCount(carouselLayout(8, 3, true))).toBe(3)
    expect(pageCount(carouselLayout(8, 4, false))).toBe(2)
    expect(pageCount(carouselLayout(7, 1, true))).toBe(7)
  })

  it('is a single page when nothing scrolls', () => {
    expect(pageCount(carouselLayout(3, 5, true))).toBe(1)
    expect(pageCount(carouselLayout(0, 1, true))).toBe(1)
  })
})

describe('stepIndex', () => {
  it('wraps around both ends when looping', () => {
    const layout = carouselLayout(8, 3, true)
    expect(stepIndex(7, 1, layout)).toBe(0)
    expect(stepIndex(0, -1, layout)).toBe(7)
    expect(stepIndex(6, 3, layout)).toBe(1)
  })

  it('clamps to the first and last full view without loop', () => {
    const layout = carouselLayout(8, 3, false)
    expect(stepIndex(5, 1, layout)).toBe(5)
    expect(stepIndex(0, -1, layout)).toBe(0)
    expect(stepIndex(3, 4, layout)).toBe(5)
    expect(stepIndex(2, 1, layout)).toBe(3)
  })

  it('stays at 0 when nothing scrolls', () => {
    expect(stepIndex(0, 1, carouselLayout(2, 3, true))).toBe(0)
  })
})

describe('canGoPrev / canGoNext', () => {
  it('are always available while looping', () => {
    const layout = carouselLayout(8, 3, true)
    expect(canGoPrev(0, layout)).toBe(true)
    expect(canGoNext(7, layout)).toBe(true)
  })

  it('disable the arrow at each edge without loop', () => {
    const layout = carouselLayout(8, 3, false)
    expect(canGoPrev(0, layout)).toBe(false)
    expect(canGoNext(0, layout)).toBe(true)
    expect(canGoPrev(5, layout)).toBe(true)
    expect(canGoNext(5, layout)).toBe(false)
  })

  it('are unavailable when nothing scrolls', () => {
    const layout = carouselLayout(3, 3, true)
    expect(canGoPrev(0, layout)).toBe(false)
    expect(canGoNext(0, layout)).toBe(false)
  })
})

describe('track positions', () => {
  const layout = carouselLayout(8, 3, true)

  it('offsets real indexes by the leading clones', () => {
    expect(positionOfIndex(0, layout)).toBe(3)
    expect(positionOfIndex(7, layout)).toBe(10)
    expect(positionOfIndex(2, carouselLayout(8, 3, false))).toBe(2)
  })

  it('maps clone positions back to their real photo', () => {
    expect(indexOfPosition(2, layout)).toBe(7)
    expect(indexOfPosition(0, layout)).toBe(5)
    expect(indexOfPosition(11, layout)).toBe(0)
    expect(indexOfPosition(13, layout)).toBe(2)
    expect(indexOfPosition(5, layout)).toBe(2)
  })

  it('flags only clone positions', () => {
    expect(isClonePosition(2, layout)).toBe(true)
    expect(isClonePosition(3, layout)).toBe(false)
    expect(isClonePosition(10, layout)).toBe(false)
    expect(isClonePosition(11, layout)).toBe(true)
  })

  it('lists which photo each rendered slide shows, clones included', () => {
    expect(slideSourceIndexes(carouselLayout(4, 2, true))).toEqual([2, 3, 0, 1, 2, 3, 0, 1])
    expect(slideSourceIndexes(carouselLayout(3, 3, true))).toEqual([0, 1, 2])
    expect(slideSourceIndexes(carouselLayout(0, 1, true))).toEqual([])
  })
})

describe('pages', () => {
  it('maps a page to its first photo, clamped to the last full view without loop', () => {
    const layout = carouselLayout(8, 3, false)
    expect(indexOfPage(0, layout)).toBe(0)
    expect(indexOfPage(1, layout)).toBe(3)
    expect(indexOfPage(2, layout)).toBe(5)
  })

  it('keeps the page start while looping', () => {
    expect(indexOfPage(2, carouselLayout(8, 3, true))).toBe(6)
  })

  it('maps an index to the page that contains it', () => {
    const looping = carouselLayout(8, 3, true)
    expect(pageOfIndex(0, looping)).toBe(0)
    expect(pageOfIndex(4, looping)).toBe(1)
    expect(pageOfIndex(7, looping)).toBe(2)
  })

  it('marks the last page once the last full view is reached without loop', () => {
    const clamped = carouselLayout(8, 3, false)
    expect(pageOfIndex(4, clamped)).toBe(1)
    expect(pageOfIndex(5, clamped)).toBe(2)
  })

  it('round-trips every page', () => {
    for (const layout of [carouselLayout(8, 3, false), carouselLayout(8, 3, true), carouselLayout(7, 4, false)]) {
      for (let page = 0; page < pageCount(layout); page++) {
        expect(pageOfIndex(indexOfPage(page, layout), layout)).toBe(page)
      }
    }
  })
})

describe('resolveSwipe', () => {
  const slideWidth = 300

  it('treats small movements as a tap', () => {
    expect(resolveSwipe(4, 2, slideWidth)).toBe(0)
    expect(resolveSwipe(-8, 0.1, slideWidth)).toBe(0)
  })

  it('ignores a slow, short drag', () => {
    expect(resolveSwipe(-40, 0.1, slideWidth)).toBe(0)
  })

  it('advances on a quick flick even if short', () => {
    expect(resolveSwipe(-40, -0.8, slideWidth)).toBe(1)
    expect(resolveSwipe(40, 0.8, slideWidth)).toBe(-1)
  })

  it('advances once the drag passes a fifth of a slide', () => {
    expect(resolveSwipe(-70, 0, slideWidth)).toBe(1)
    expect(resolveSwipe(70, 0, slideWidth)).toBe(-1)
  })

  it('moves as many slides as were dragged', () => {
    expect(resolveSwipe(-640, 0, slideWidth)).toBe(2)
    expect(resolveSwipe(950, 0, slideWidth)).toBe(-3)
  })

  it('does not move against a flick in the opposite direction', () => {
    expect(resolveSwipe(-40, 0.8, slideWidth)).toBe(0)
  })

  it('never moves for a zero-width slide', () => {
    expect(resolveSwipe(-200, 0, 0)).toBe(0)
  })
})

describe('dragOffset', () => {
  it('follows the pointer in the middle of the strip', () => {
    expect(dragOffset(-120, false, false)).toBe(-120)
    expect(dragOffset(120, false, false)).toBe(120)
  })

  it('resists pulling past the first or last view', () => {
    expect(dragOffset(100, true, false)).toBeCloseTo(35)
    expect(dragOffset(-100, false, true)).toBeCloseTo(-35)
    expect(dragOffset(-100, true, false)).toBe(-100)
  })
})
