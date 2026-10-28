export interface ThumbnailVttOptions {
  intervalSeconds: number
  width: number
  height: number
  columns: number
  spriteUrl: string
}

const WEBVTT_HEADER = 'WEBVTT\n'

function padNumber(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

export function formatVttTimestamp(totalSeconds: number): string {
  const totalMilliseconds = Math.round(totalSeconds * 1000)
  const hours = Math.floor(totalMilliseconds / 3_600_000)
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000)
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000)
  const milliseconds = totalMilliseconds % 1000
  return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}.${padNumber(milliseconds, 3)}`
}

function buildCue(index: number, durationSeconds: number, options: ThumbnailVttOptions): string {
  const start = index * options.intervalSeconds
  const end = Math.min(start + options.intervalSeconds, durationSeconds)
  const x = (index % options.columns) * options.width
  const y = Math.floor(index / options.columns) * options.height
  const timing = `${formatVttTimestamp(start)} --> ${formatVttTimestamp(end)}`
  return `${timing}\n${options.spriteUrl}#xywh=${x},${y},${options.width},${options.height}`
}

export function buildThumbnailVtt(durationSeconds: number, options: ThumbnailVttOptions): string {
  if (durationSeconds <= 0) return WEBVTT_HEADER
  const cueCount = Math.ceil(durationSeconds / options.intervalSeconds)
  const cues = Array.from({ length: cueCount }, (_, index) => buildCue(index, durationSeconds, options))
  return `${WEBVTT_HEADER}\n${cues.join('\n\n')}\n`
}
