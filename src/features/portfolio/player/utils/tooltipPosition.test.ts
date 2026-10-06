import { describe, expect, it } from 'vitest'
import { clampTooltipCenter } from './tooltipPosition'

describe('clampTooltipCenter', () => {
  it('centers the tooltip on the pointer when it fits', () => {
    expect(clampTooltipCenter(300, 600, 160)).toBe(300)
  })

  it('keeps the tooltip inside the left edge', () => {
    expect(clampTooltipCenter(10, 600, 160)).toBe(80)
  })

  it('keeps the tooltip inside the right edge', () => {
    expect(clampTooltipCenter(590, 600, 160)).toBe(520)
  })

  it('centers the tooltip in the container when it is wider than the container', () => {
    expect(clampTooltipCenter(10, 100, 160)).toBe(50)
  })
})
