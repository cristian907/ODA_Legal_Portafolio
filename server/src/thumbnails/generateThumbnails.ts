import { join } from 'node:path'
import {
  SPRITE_COLUMNS,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_INTERVAL_SECONDS,
  THUMBNAIL_WIDTH,
} from '../config'
import type { ThumbnailSet } from '../domain/videoPackage'
import { packageDirectory, publicFileUrl, writePackageFile } from '../storage/localFileStorage'
import { buildThumbnailVtt } from './buildThumbnailVtt'
import { probeDuration } from './probeDuration'
import { renderSprite } from './renderSprite'
import { planSpriteLayout } from './spriteLayout'

const SPRITE_FILE_NAME = 'thumbnails.jpg'
const THUMBNAIL_VTT_FILE_NAME = 'thumbnails.vtt'

const THUMBNAIL_FRAME = {
  intervalSeconds: THUMBNAIL_INTERVAL_SECONDS,
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
}

export interface GeneratedThumbnails {
  durationSeconds: number
  thumbnails: ThumbnailSet
}

export async function generateThumbnails(
  packageId: string,
  videoFilePath: string,
): Promise<GeneratedThumbnails> {
  const durationSeconds = await probeDuration(videoFilePath)
  const layout = planSpriteLayout(durationSeconds, THUMBNAIL_FRAME.intervalSeconds, SPRITE_COLUMNS)
  const spriteUrl = publicFileUrl(packageId, SPRITE_FILE_NAME)

  await renderSprite(videoFilePath, join(packageDirectory(packageId), SPRITE_FILE_NAME), layout, THUMBNAIL_FRAME)
  const vtt = buildThumbnailVtt(durationSeconds, { ...THUMBNAIL_FRAME, columns: layout.columns, spriteUrl })
  await writePackageFile(packageId, THUMBNAIL_VTT_FILE_NAME, vtt)

  return {
    durationSeconds,
    thumbnails: {
      spritePath: spriteUrl,
      vttPath: publicFileUrl(packageId, THUMBNAIL_VTT_FILE_NAME),
      ...THUMBNAIL_FRAME,
    },
  }
}
