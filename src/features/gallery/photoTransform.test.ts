import { describe, expect, it } from 'vitest'
import { isSameTransform, recenteredTransform } from './photoTransform'
import type { PhotoTransform } from '@/types/gallery'

const transform: PhotoTransform = {
  crop: { left: 0, top: 0, width: 400, height: 300 },
  rotation: 90,
  flipHorizontal: true,
  flipVertical: false,
}

describe('isSameTransform', () => {
  it('compares crop, rotation and flips by value', () => {
    expect(isSameTransform(transform, structuredClone(transform))).toBe(true)
    expect(isSameTransform(transform, { ...transform, rotation: 180 })).toBe(false)
    expect(isSameTransform(transform, { ...transform, flipVertical: true })).toBe(false)
    expect(isSameTransform(transform, { ...transform, crop: { ...transform.crop, left: 1 } })).toBe(false)
  })
})

describe('recenteredTransform', () => {
  it('centers a new crop for the ratio while keeping rotation and flips', () => {
    const photo = { originalWidth: 400, originalHeight: 200, transform }
    expect(recenteredTransform(photo, '4:3')).toEqual({
      crop: { left: 0, top: 125, width: 200, height: 150 },
      rotation: 90,
      flipHorizontal: true,
      flipVertical: false,
    })
  })
})
