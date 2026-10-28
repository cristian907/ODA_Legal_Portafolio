/** One hover-preview frame: a time range and the sprite rectangle that shows it. */
export interface ThumbnailCue {
  start: number
  end: number
  url: string
  x: number
  y: number
  w: number
  h: number
}

const TIMESTAMP_PATTERN = /^(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})$/
const XYWH_FRAGMENT = '#xywh='

function parseTimestamp(value: string): number | null {
  const match = TIMESTAMP_PATTERN.exec(value)
  if (!match) return null
  const [, hours = '0', minutes, seconds, milliseconds] = match
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000
}

function parseTimingLine(line: string): { start: number; end: number } | null {
  const [startPart, endPart = ''] = line.split('-->')
  const start = parseTimestamp(startPart.trim())
  const end = parseTimestamp(endPart.trim().split(/\s+/)[0])
  return start === null || end === null ? null : { start, end }
}

function parseSpriteReference(line: string): Pick<ThumbnailCue, 'url' | 'x' | 'y' | 'w' | 'h'> | null {
  const fragmentIndex = line.indexOf(XYWH_FRAGMENT)
  if (fragmentIndex <= 0) return null
  const parts = line.slice(fragmentIndex + XYWH_FRAGMENT.length).split(',')
  if (parts.length !== 4 || !parts.every((part) => /^\d+$/.test(part.trim()))) return null
  const [x, y, w, h] = parts.map(Number)
  return { url: line.slice(0, fragmentIndex), x, y, w, h }
}

function parseCueBlock(block: string): ThumbnailCue | null {
  const lines = block.split('\n').map((line) => line.trim())
  const timingIndex = lines.findIndex((line) => line.includes('-->'))
  if (timingIndex === -1) return null
  const timing = parseTimingLine(lines[timingIndex])
  const sprite = parseSpriteReference(lines[timingIndex + 1] ?? '')
  return timing && sprite ? { ...timing, ...sprite } : null
}

/** Parses a WebVTT thumbnail track (`<sprite url>#xywh=x,y,w,h` payloads); malformed cues are skipped. */
export function parseThumbnailVtt(text: string): ThumbnailCue[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(parseCueBlock)
    .filter((cue): cue is ThumbnailCue => cue !== null)
}

/** Returns the thumbnail for a time; times past the end keep showing the last frame. */
export function findThumbnail(cues: ThumbnailCue[], time: number): ThumbnailCue | null {
  if (cues.length === 0 || time < 0) return null
  const match = cues.find((cue) => time >= cue.start && time < cue.end)
  if (match) return match
  const lastCue = cues[cues.length - 1]
  return time >= lastCue.end ? lastCue : null
}
