import { describe, expect, it } from 'vitest'
import { buildThumbnailVtt, formatVttTimestamp } from './buildThumbnailVtt'

const options = {
  intervalSeconds: 5,
  width: 160,
  height: 90,
  columns: 3,
  spriteUrl: '/uploads/abc/thumbnails.jpg',
}

function cueBlocks(vtt: string): string[] {
  return vtt.trim().split('\n\n').slice(1)
}

describe('formatVttTimestamp', () => {
  it('formats seconds as HH:MM:SS.mmm', () => {
    expect(formatVttTimestamp(0)).toBe('00:00:00.000')
    expect(formatVttTimestamp(5)).toBe('00:00:05.000')
    expect(formatVttTimestamp(3725.5)).toBe('01:02:05.500')
  })

  it('rounds to whole milliseconds', () => {
    expect(formatVttTimestamp(12.3456)).toBe('00:00:12.346')
  })
})

describe('buildThumbnailVtt', () => {
  it('starts with the WEBVTT header', () => {
    expect(buildThumbnailVtt(12, options).startsWith('WEBVTT\n\n')).toBe(true)
  })

  it('creates one cue per interval, rounding up', () => {
    expect(cueBlocks(buildThumbnailVtt(12, options))).toHaveLength(3)
    expect(cueBlocks(buildThumbnailVtt(15, options))).toHaveLength(3)
    expect(cueBlocks(buildThumbnailVtt(4, options))).toHaveLength(1)
  })

  it('writes consecutive cue ranges with sprite fragment coordinates', () => {
    const [first, second] = cueBlocks(buildThumbnailVtt(12, options))
    expect(first).toBe(
      '00:00:00.000 --> 00:00:05.000\n/uploads/abc/thumbnails.jpg#xywh=0,0,160,90',
    )
    expect(second).toBe(
      '00:00:05.000 --> 00:00:10.000\n/uploads/abc/thumbnails.jpg#xywh=160,0,160,90',
    )
  })

  it('wraps to the next row after the configured columns', () => {
    const cues = cueBlocks(buildThumbnailVtt(22, options))
    expect(cues[2]).toContain('#xywh=320,0,160,90')
    expect(cues[3]).toContain('#xywh=0,90,160,90')
    expect(cues[4]).toContain('#xywh=160,90,160,90')
  })

  it('ends the last cue at the video duration', () => {
    const cues = cueBlocks(buildThumbnailVtt(12.4, options))
    expect(cues[cues.length - 1].split('\n')[0]).toBe('00:00:10.000 --> 00:00:12.400')
  })

  it('returns only the header when the duration is not positive', () => {
    expect(buildThumbnailVtt(0, options)).toBe('WEBVTT\n')
  })
})
