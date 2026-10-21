import { describe, expect, it } from 'vitest'
import { MAX_ZOOM, minimumCropSize, zoomLevel } from './cropZoom'

describe('zoomLevel', () => {
  it('is 1 when the crop is as large as the ratio allows', () => {
    expect(zoomLevel({ width: 400, height: 300 }, { width: 400, height: 300 }, '4:3')).toBe(1)
    expect(zoomLevel({ width: 300, height: 300 }, { width: 400, height: 300 }, '1:1')).toBe(1)
  })

  it('grows as the crop shrinks, measured on the rotated image', () => {
    expect(zoomLevel({ width: 150, height: 200 }, { width: 300, height: 400 }, '3:4')).toBe(2)
    expect(zoomLevel({ width: 75, height: 75 }, { width: 300, height: 400 }, '1:1')).toBe(4)
  })

  it('stays within 1 and MAX_ZOOM', () => {
    expect(zoomLevel({ width: 1, height: 1 }, { width: 400, height: 300 }, '1:1')).toBe(MAX_ZOOM)
    expect(zoomLevel({ width: 900, height: 900 }, { width: 400, height: 300 }, '1:1')).toBe(1)
  })
})

describe('minimumCropSize', () => {
  it('is the largest crop divided by MAX_ZOOM', () => {
    expect(minimumCropSize({ width: 1000, height: 500 }, '1:1')).toEqual({
      width: 500 / MAX_ZOOM,
      height: 500 / MAX_ZOOM,
    })
  })
})
