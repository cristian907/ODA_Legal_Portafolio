import { describe, expect, it } from 'vitest'
import { planSpriteLayout } from './spriteLayout'

describe('planSpriteLayout', () => {
  it('uses one frame per interval, rounding up', () => {
    expect(planSpriteLayout(12, 5, 10).frameCount).toBe(3)
    expect(planSpriteLayout(10, 5, 10).frameCount).toBe(2)
  })

  it('never uses more columns than frames', () => {
    expect(planSpriteLayout(12, 5, 10)).toEqual({ frameCount: 3, columns: 3, rows: 1 })
  })

  it('adds rows when frames exceed the maximum columns', () => {
    expect(planSpriteLayout(101, 5, 10)).toEqual({ frameCount: 21, columns: 10, rows: 3 })
  })

  it('keeps at least one frame for very short videos', () => {
    expect(planSpriteLayout(0.4, 5, 10)).toEqual({ frameCount: 1, columns: 1, rows: 1 })
  })
})
