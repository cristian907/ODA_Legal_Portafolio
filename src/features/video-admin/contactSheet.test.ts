import { describe, expect, it } from 'vitest'
import type { ThumbnailCue } from '@/features/portfolio/player/utils/thumbnailVtt'
import { measureSprite, spriteCellStyle } from './contactSheet'

const cue = (x: number, y: number, w = 160, h = 90): ThumbnailCue => ({
  start: 0,
  end: 5,
  url: 'http://x/sprite.jpg',
  x,
  y,
  w,
  h,
})

describe('measureSprite', () => {
  it('derives the sprite size from the furthest tile edges', () => {
    expect(measureSprite([cue(0, 0), cue(160, 0), cue(320, 0), cue(0, 90)])).toEqual({
      width: 480,
      height: 180,
    })
  })

  it('returns zero for no cues', () => {
    expect(measureSprite([])).toEqual({ width: 0, height: 0 })
  })
})

describe('spriteCellStyle', () => {
  const sprite = { width: 480, height: 180 }

  it('scales the sprite so one tile fills the cell', () => {
    expect(spriteCellStyle(cue(160, 90), sprite)).toEqual({
      backgroundImage: 'url("http://x/sprite.jpg")',
      backgroundSize: '300% 200%',
      backgroundPosition: '50% 100%',
    })
  })

  it('positions the first tile at the origin', () => {
    expect(spriteCellStyle(cue(0, 0), sprite).backgroundPosition).toBe('0% 0%')
  })

  it('avoids dividing by zero on a single-row or single-column sprite', () => {
    expect(spriteCellStyle(cue(0, 0), { width: 160, height: 90 })).toEqual({
      backgroundImage: 'url("http://x/sprite.jpg")',
      backgroundSize: '100% 100%',
      backgroundPosition: '0% 0%',
    })
  })
})
