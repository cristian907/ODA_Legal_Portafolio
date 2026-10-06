import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

export const PORT = Number(process.env.PORT ?? 3001)
export const UPLOADS_DIR = join(REPO_ROOT, 'uploads')
export const UPLOADS_TMP_DIR = join(UPLOADS_DIR, '.tmp')
export const UPLOADS_PUBLIC_PATH = '/uploads'

export const THUMBNAIL_INTERVAL_SECONDS = 5
export const THUMBNAIL_WIDTH = 160
export const THUMBNAIL_HEIGHT = 90
export const SPRITE_COLUMNS = 10

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024
export const MAX_TRACK_FILES = 10
export const TITLE_MAX_LENGTH = 120

export const ALLOWED_EXTENSIONS = {
  video: ['.mp4', '.webm'],
  subtitles: ['.vtt'],
  audioTracks: ['.mp3', '.m4a', '.ogg', '.wav'],
} as const

export type UploadField = keyof typeof ALLOWED_EXTENSIONS
