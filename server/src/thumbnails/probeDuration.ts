import { ProcessingError } from '../domain/errors'
import { FFPROBE_PATH } from './binaries'
import { runBinary } from './runBinary'

const PROBE_ERROR_MESSAGE = 'No se pudo leer la duración del video.'

function durationArgs(videoPath: string): string[] {
  return [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ]
}

export async function probeDuration(videoPath: string): Promise<number> {
  let output: string
  try {
    output = await runBinary(FFPROBE_PATH, durationArgs(videoPath))
  } catch (error) {
    throw new ProcessingError(PROBE_ERROR_MESSAGE, { cause: error })
  }
  const durationSeconds = Number.parseFloat(output.trim())
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new ProcessingError(PROBE_ERROR_MESSAGE)
  }
  return durationSeconds
}
