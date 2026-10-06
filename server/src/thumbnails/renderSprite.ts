import { ProcessingError } from '../domain/errors'
import { FFMPEG_PATH } from './binaries'
import { runBinary } from './runBinary'
import type { SpriteLayout } from './spriteLayout'

export interface ThumbnailFrame {
  intervalSeconds: number
  width: number
  height: number
}

export function buildSpriteFilter(layout: SpriteLayout, frame: ThumbnailFrame): string {
  const { width, height, intervalSeconds } = frame
  return [
    // round=up keeps, for tile i, the frame on screen at i * interval; the
    // default rounding samples the middle of each interval instead.
    `fps=1/${intervalSeconds}:round=up`,
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    `tile=${layout.columns}x${layout.rows}`,
  ].join(',')
}

export async function renderSprite(
  videoPath: string,
  spritePath: string,
  layout: SpriteLayout,
  frame: ThumbnailFrame,
): Promise<void> {
  const args = [
    '-v', 'error',
    '-y',
    '-i', videoPath,
    '-vf', buildSpriteFilter(layout, frame),
    '-frames:v', '1',
    '-q:v', '4',
    spritePath,
  ]
  try {
    await runBinary(FFMPEG_PATH, args)
  } catch (error) {
    throw new ProcessingError('No se pudieron generar las miniaturas del video.', { cause: error })
  }
}
