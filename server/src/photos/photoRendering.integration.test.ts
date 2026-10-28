import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp, { type Sharp } from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ValidationError } from '../domain/errors'
import type { PhotoTransform, TransformedImageCrop } from './domain/photoTransform'
import { readImageDimensions } from './readImageDimensions'
import { renderCroppedPhoto } from './renderCroppedPhoto'

type Rgb = [number, number, number]

const RED: Rgb = [255, 0, 0]
const GREEN: Rgb = [0, 255, 0]
const BLUE: Rgb = [0, 0, 255]
const YELLOW: Rgb = [255, 255, 0]
const COLOR_TOLERANCE = 40

const QUADRANT_WIDTH = 200
const QUADRANT_HEIGHT = 100

let workDir: string
let quadrantsPath: string
let exifRotatedPath: string
let largePath: string

/** 400×200 image: red top-left, green top-right, blue bottom-left, yellow bottom-right. */
function quadrantPixels(): Buffer {
  const width = QUADRANT_WIDTH * 2
  const height = QUADRANT_HEIGHT * 2
  const pixels = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isRight = x >= QUADRANT_WIDTH
      const isBottom = y >= QUADRANT_HEIGHT
      const color = isBottom ? (isRight ? YELLOW : BLUE) : isRight ? GREEN : RED
      pixels.set(color, (y * width + x) * 3)
    }
  }
  return pixels
}

function quadrantImage(): Sharp {
  return sharp(quadrantPixels(), { raw: { width: QUADRANT_WIDTH * 2, height: QUADRANT_HEIGHT * 2, channels: 3 } })
}

function transformWith(crop: TransformedImageCrop, overrides: Partial<PhotoTransform> = {}): PhotoTransform {
  return { crop, rotation: 0, flipHorizontal: false, flipVertical: false, ...overrides }
}

async function renderAndSampleCenter(sourcePath: string, transform: PhotoTransform): Promise<Rgb> {
  const outputPath = join(workDir, `out-${Math.random().toString(36).slice(2)}.webp`)
  await renderCroppedPhoto(sourcePath, outputPath, transform)
  const { data, info } = await sharp(outputPath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels
  return [data[center], data[center + 1], data[center + 2]]
}

function expectColor(actual: Rgb, expected: Rgb): void {
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(COLOR_TOLERANCE)
  })
}

const topLeftHalfWidthQuadrant = { left: 0, top: 0, width: QUADRANT_WIDTH, height: QUADRANT_HEIGHT }
const rotatedTopLeftQuadrant = { left: 0, top: 0, width: QUADRANT_HEIGHT, height: QUADRANT_WIDTH }

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'photos-test-'))
  quadrantsPath = join(workDir, 'quadrants.png')
  await quadrantImage().png().toFile(quadrantsPath)
  exifRotatedPath = join(workDir, 'exif-rotated.jpg')
  await quadrantImage().jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toFile(exifRotatedPath)
  largePath = join(workDir, 'large.png')
  await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#336699' } })
    .png()
    .toFile(largePath)
})

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true })
})

describe('readImageDimensions', () => {
  it('reads the stored size of an image without orientation metadata', async () => {
    expect(await readImageDimensions(quadrantsPath)).toEqual({ width: 400, height: 200 })
  })

  it('reports the auto-oriented size of an image with EXIF orientation', async () => {
    expect(await readImageDimensions(exifRotatedPath)).toEqual({ width: 200, height: 400 })
  })

  it('rejects a file that is not an image', async () => {
    await expect(readImageDimensions(join(workDir, 'missing.png'))).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('renderCroppedPhoto', () => {
  it('extracts the requested region without transforms', async () => {
    expectColor(await renderAndSampleCenter(quadrantsPath, transformWith(topLeftHalfWidthQuadrant)), RED)
  })

  it('rotates clockwise before cropping', async () => {
    const transform = transformWith(rotatedTopLeftQuadrant, { rotation: 90 })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), BLUE)
  })

  it('rotates half a turn before cropping', async () => {
    const transform = transformWith(topLeftHalfWidthQuadrant, { rotation: 180 })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), YELLOW)
  })

  it('mirrors sides with flipHorizontal', async () => {
    const transform = transformWith(topLeftHalfWidthQuadrant, { flipHorizontal: true })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), GREEN)
  })

  it('mirrors top and bottom with flipVertical', async () => {
    const transform = transformWith(topLeftHalfWidthQuadrant, { flipVertical: true })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), BLUE)
  })

  it('flips the already rotated image', async () => {
    const transform = transformWith(rotatedTopLeftQuadrant, { rotation: 90, flipHorizontal: true })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), RED)
  })

  it('flips vertically after a quarter turn', async () => {
    const transform = transformWith(rotatedTopLeftQuadrant, { rotation: 270, flipVertical: true })
    expectColor(await renderAndSampleCenter(quadrantsPath, transform), RED)
  })

  it('applies EXIF orientation before the transform', async () => {
    const upright = transformWith(rotatedTopLeftQuadrant)
    expectColor(await renderAndSampleCenter(exifRotatedPath, upright), BLUE)
    const turned = transformWith(topLeftHalfWidthQuadrant, { rotation: 90 })
    expectColor(await renderAndSampleCenter(exifRotatedPath, turned), YELLOW)
    const mirrored = transformWith(rotatedTopLeftQuadrant, { flipHorizontal: true })
    expectColor(await renderAndSampleCenter(exifRotatedPath, mirrored), RED)
  })

  it('writes a webp no wider than 1200 px', async () => {
    const outputPath = join(workDir, 'large.webp')
    await renderCroppedPhoto(largePath, outputPath, transformWith({ left: 0, top: 0, width: 2400, height: 1200 }))
    const metadata = await sharp(outputPath).metadata()
    expect(metadata).toMatchObject({ format: 'webp', width: 1200, height: 600 })
  })

  it('never enlarges a small crop', async () => {
    const outputPath = join(workDir, 'small.webp')
    await renderCroppedPhoto(largePath, outputPath, transformWith({ left: 10, top: 20, width: 300, height: 150 }))
    expect(await sharp(outputPath).metadata()).toMatchObject({ format: 'webp', width: 300, height: 150 })
  })
})
