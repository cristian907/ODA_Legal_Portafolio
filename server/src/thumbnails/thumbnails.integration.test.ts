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

  it('fails with a processing error for a file that is not a video', async () => {
    await expect(probeDuration(join(workDir, 'missing.mp4'))).rejects.toThrow(
      'No se pudo leer la duración del video.',
    )
  })
})
