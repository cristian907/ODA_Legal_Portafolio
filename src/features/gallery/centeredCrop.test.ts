import { describe, expect, it } from 'vitest'
import { aspectRatioValue, centeredCrop } from './centeredCrop'
import type { AspectRatio, PhotoRotation } from '@/types/gallery'

describe('aspectRatioValue', () => {
  it('divides width by height', () => {
    expect(aspectRatioValue('4:3')).toBeCloseTo(4 / 3)
    expect(aspectRatioValue('1:1')).toBe(1)
    expect(aspectRatioValue('3:4')).toBe(0.75)
    expect(aspectRatioValue('16:9')).toBeCloseTo(16 / 9)
  })
})

describe('centeredCrop', () => {
  it('keeps the full height of a landscape source and centers horizontally', () => {
    expect(centeredCrop(400, 200, '1:1', 0)).toEqual({ left: 100, top: 0, width: 200, height: 200 })
  })

  it('keeps the full width of a portrait source and centers vertically', () => {
    expect(centeredCrop(300, 600, '4:3', 0)).toEqual({ left: 0, top: 187, width: 300, height: 225 })
  })

  it('uses the whole image when it already has the ratio', () => {
    expect(centeredCrop(1600, 900, '16:9', 180)).toEqual({ left: 0, top: 0, width: 1600, height: 900 })
  })

  it('swaps the source dimensions for quarter turns', () => {
    expect(centeredCrop(400, 200, '4:3', 90)).toEqual({ left: 0, top: 125, width: 200, height: 150 })
    expect(centeredCrop(400, 200, '4:3', 270)).toEqual(centeredCrop(200, 400, '4:3', 0))
  })

  it('rounds to the nearest integer size', () => {
    expect(centeredCrop(1000, 1000, '16:9', 0)).toEqual({ left: 0, top: 218, width: 1000, height: 563 })
  })

  it('never exceeds the rotated bounds for awkward sizes', () => {
    const ratios: AspectRatio[] = ['4:3', '1:1', '3:4', '16:9']
    const rotations: PhotoRotation[] = [0, 90, 180, 270]
    const sizes = [[1, 1], [3, 1], [1, 7], [17, 13], [999, 1001], [4031, 3023], [5, 1234]]
    for (const [width, height] of sizes) {
      for (const ratio of ratios) {
        for (const rotation of rotations) {
          const crop = centeredCrop(width, height, ratio, rotation)
          const quarter = rotation === 90 || rotation === 270
          const bounds = quarter ? { width: height, height: width } : { width, height }
          for (const value of Object.values(crop)) expect(Number.isInteger(value)).toBe(true)
          expect(crop.width).toBeGreaterThanOrEqual(1)
          expect(crop.height).toBeGreaterThanOrEqual(1)
          expect(crop.left).toBeGreaterThanOrEqual(0)
          expect(crop.top).toBeGreaterThanOrEqual(0)
          expect(crop.left + crop.width).toBeLessThanOrEqual(bounds.width)
          expect(crop.top + crop.height).toBeLessThanOrEqual(bounds.height)
        }
      }
    }
  })
})
