import { execFile } from 'node:child_process'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FFMPEG_PATH, FFPROBE_PATH } from './binaries'
import { probeDuration } from './probeDuration'
import { renderSprite } from './renderSprite'
import { planSpriteLayout } from './spriteLayout'

const run = promisify(execFile)
const frame = { intervalSeconds: 5, width: 160, height: 90 }

let workDir: string
let videoPath: string
let rampVideoPath: string

// Luma rises linearly with time (limited range 16 + 10/s), so a tile's
// brightness tells which instant of the video it was sampled from.
const RAMP_LUMA_PER_SECOND = 10
const RAMP_SECONDS = 21
const RAMP_FRAME_SECONDS = 0.1
const FULL_TO_LIMITED_RANGE = 219 / 255

async function probeImageSize(imagePath: string): Promise<string> {
  const { stdout } = await run(FFPROBE_PATH, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0:s=x',
    imagePath,
  ])
  return stdout.trim()
}

async function readCenterLuma(imagePath: string, x: number, y: number): Promise<number> {
  const { stdout } = await run(
    FFMPEG_PATH,
    ['-v', 'error', '-i', imagePath, '-vf', `format=gray,crop=1:1:${x}:${y}`, '-f', 'rawvideo', '-'],
    { encoding: 'buffer' },
  )
  return stdout[0]
}

async function sampledSecondsPerTile(spritePath: string, frameCount: number): Promise<number[]> {
  const seconds: number[] = []
  for (let index = 0; index < frameCount; index += 1) {
    const x = index * frame.width + frame.width / 2
    const luma = await readCenterLuma(spritePath, x, frame.height / 2)
    seconds.push((luma * FULL_TO_LIMITED_RANGE) / RAMP_LUMA_PER_SECOND)
  }
  return seconds
}

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'thumbnails-test-'))
  videoPath = join(workDir, 'sample.mp4')
  await run(FFMPEG_PATH, [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', 'testsrc=duration=12:size=320x180:rate=10',
    '-pix_fmt', 'yuv420p',
    videoPath,
  ])
  rampVideoPath = join(workDir, 'ramp.mp4')
  await run(FFMPEG_PATH, [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', `color=c=black:s=64x36:r=${1 / RAMP_FRAME_SECONDS}:d=${RAMP_SECONDS},` +
      `geq=lum='16+T*${RAMP_LUMA_PER_SECOND}':cb=128:cr=128`,
    '-pix_fmt', 'yuv420p',
    rampVideoPath,
  ])
}, 30_000)

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true })
})

describe('thumbnail generation', () => {
  it('probes the video duration in seconds', async () => {
    const duration = await probeDuration(videoPath)
    expect(duration).toBeCloseTo(12, 0)
  })

  it('renders a sprite sized to the planned layout', async () => {
    const layout = planSpriteLayout(await probeDuration(videoPath), frame.intervalSeconds, 2)
    const spritePath = join(workDir, 'thumbnails.jpg')

    await renderSprite(videoPath, spritePath, layout, frame)

    expect((await stat(spritePath)).size).toBeGreaterThan(0)
    expect(layout).toEqual({ frameCount: 3, columns: 2, rows: 2 })
    expect(await probeImageSize(spritePath)).toBe('320x180')
  }, 30_000)

  it('samples each tile at the start of its interval', async () => {
    const layout = planSpriteLayout(RAMP_SECONDS, frame.intervalSeconds, 5)
    const spritePath = join(workDir, 'ramp.jpg')

    await renderSprite(rampVideoPath, spritePath, layout, frame)

    const seconds = await sampledSecondsPerTile(spritePath, layout.frameCount)
    seconds.forEach((sampled, index) => {
      expect(Math.abs(sampled - index * frame.intervalSeconds)).toBeLessThanOrEqual(
        2 * RAMP_FRAME_SECONDS,
      )
    })
  }, 30_000)

  it('fails with a processing error for a file that is not a video', async () => {
    await expect(probeDuration(join(workDir, 'missing.mp4'))).rejects.toThrow(
      'No se pudo leer la duración del video.',
    )
  })
})
