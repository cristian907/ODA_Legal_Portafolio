import { describe, expect, it } from 'vitest'
import { toCropperState, toServerTransform, visualFlip, type CropperState } from './cropperTransform'
import type { PhotoRotation, PhotoTransform } from '@/types/gallery'

interface Point {
  x: number
  y: number
}
interface Size {
  width: number
  height: number
}

const IMAGE: Size = { width: 400, height: 300 }
const ROTATIONS: PhotoRotation[] = [0, 90, 180, 270]
const FLIPS = [
  { horizontal: false, vertical: false },
  { horizontal: true, vertical: false },
  { horizontal: false, vertical: true },
  { horizontal: true, vertical: true },
]

/** Clockwise quarter turns of a point inside an image, returning the point and the new image size. */
function rotateClockwise(point: Point, size: Size, degrees: number): { point: Point; size: Size } {
  let current = { point, size }
  for (let turn = 0; turn < (((degrees / 90) % 4) + 4) % 4; turn++) {
    const { point: p, size: s } = current
    current = { point: { x: s.height - p.y, y: p.x }, size: { width: s.height, height: s.width } }
  }
  return current
}

function mirror(point: Point, size: Size, horizontal: boolean, vertical: boolean): Point {
  return {
    x: horizontal ? size.width - point.x : point.x,
    y: vertical ? size.height - point.y : point.y,
  }
}

/** vue-advanced-cropper renders `rotate(r) scaleX(±1) scaleY(±1)`: mirror the source, then rotate clockwise. */
function cropperPixel(point: Point, rotate: number, flip: CropperState['flip']): Point {
  return rotateClockwise(mirror(point, IMAGE, flip.horizontal, flip.vertical), IMAGE, rotate).point
}

/** The server contract: rotate clockwise, then mirror inside the rotated image. */
function serverPixel(point: Point, transform: PhotoTransform): Point {
  const rotated = rotateClockwise(point, IMAGE, transform.rotation)
  return mirror(rotated.point, rotated.size, transform.flipHorizontal, transform.flipVertical)
}

const PROBE: Point = { x: 37, y: 211 }

function state(rotate: number, flip: CropperState['flip'], coordinates = { left: 10, top: 20, width: 120, height: 90 }) {
  return { coordinates, rotate, flip }
}

describe('toServerTransform', () => {
  for (const rotate of ROTATIONS) {
    for (const flip of FLIPS) {
      it(`maps pixels identically for rotate ${rotate} and flip ${JSON.stringify(flip)}`, () => {
        const transform = toServerTransform(state(rotate, flip), IMAGE)
        expect(serverPixel(PROBE, transform)).toEqual(cropperPixel(PROBE, rotate, flip))
      })
    }
  }

  it('normalizes negative and accumulated angles', () => {
    expect(toServerTransform(state(-90, FLIPS[0]), IMAGE).rotation).toBe(270)
    expect(toServerTransform(state(450, FLIPS[0]), IMAGE).rotation).toBe(90)
    expect(toServerTransform(state(-540, FLIPS[0]), IMAGE).rotation).toBe(180)
  })

  it('keeps the crop rectangle, already expressed in the transformed image space', () => {
    const transform = toServerTransform(state(90, FLIPS[1], { left: 15, top: 40, width: 150, height: 200 }), IMAGE)
    expect(transform.crop).toEqual({ left: 15, top: 40, width: 150, height: 200 })
  })

  it('rounds to integer pixels and clamps inside the rotated bounds', () => {
    const rotated = toServerTransform(state(90, FLIPS[0], { left: -0.4, top: 100.6, width: 300.7, height: 300.2 }), IMAGE)
    expect(rotated.crop).toEqual({ left: 0, top: 100, width: 300, height: 300 })

    const upright = toServerTransform(state(0, FLIPS[0], { left: 399.9, top: 0, width: 0.2, height: 10 }), IMAGE)
    expect(upright.crop).toEqual({ left: 399, top: 0, width: 1, height: 10 })
  })
})

describe('toCropperState', () => {
  for (const rotation of ROTATIONS) {
    for (const flip of FLIPS) {
      it(`reopens rotation ${rotation} and flip ${JSON.stringify(flip)} with the same pixels`, () => {
        const saved: PhotoTransform = {
          crop: { left: 5, top: 6, width: 70, height: 80 },
          rotation,
          flipHorizontal: flip.horizontal,
          flipVertical: flip.vertical,
        }
        const reopened = toCropperState(saved)
        expect(cropperPixel(PROBE, reopened.rotate, reopened.flip)).toEqual(serverPixel(PROBE, saved))
        expect(reopened.coordinates).toEqual(saved.crop)
        expect(toServerTransform(reopened, IMAGE)).toEqual(saved)
      })
    }
  }
})

describe('visualFlip', () => {
  it('mirrors the source axis that appears horizontal or vertical on screen', () => {
    expect(visualFlip('horizontal', 0)).toEqual({ horizontal: true, vertical: false })
    expect(visualFlip('horizontal', 180)).toEqual({ horizontal: true, vertical: false })
    expect(visualFlip('horizontal', 90)).toEqual({ horizontal: false, vertical: true })
    expect(visualFlip('vertical', -90)).toEqual({ horizontal: true, vertical: false })
    expect(visualFlip('vertical', 0)).toEqual({ horizontal: false, vertical: true })
  })

  for (const rotate of ROTATIONS) {
    it(`a horizontal flip at ${rotate} mirrors the on-screen image left to right`, () => {
      const before = cropperPixel(PROBE, rotate, FLIPS[0])
      const after = cropperPixel(PROBE, rotate, visualFlip('horizontal', rotate))
      const width = rotate % 180 === 0 ? IMAGE.width : IMAGE.height
      expect(after).toEqual({ x: width - before.x, y: before.y })
    })
  }
})
