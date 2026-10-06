import ffmpegStaticPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

function requireBinary(path: string | null, name: string): string {
  if (!path) throw new Error(`${name} binary is not available for this platform.`)
  return path
}

export const FFMPEG_PATH = requireBinary(ffmpegStaticPath, 'ffmpeg')
export const FFPROBE_PATH = requireBinary(ffprobeStatic.path, 'ffprobe')
