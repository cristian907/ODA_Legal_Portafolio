import { describe, expect, it } from 'vitest'
import { findThumbnail, parseThumbnailVtt, type ThumbnailCue } from './thumbnailVtt'

const SPRITE = '/uploads/abc/thumbnails.jpg'

const VTT = [
  'WEBVTT',
  '',
  '00:00:00.000 --> 00:00:05.000',
  `${SPRITE}#xywh=0,0,160,90`,
  '',
  '00:00:05.000 --> 00:00:10.000',
  `${SPRITE}#xywh=160,0,160,90`,
  '',
].join('\n')

describe('parseThumbnailVtt', () => {
  it('parses each cue into its time range and sprite rectangle', () => {
    expect(parseThumbnailVtt(VTT)).toEqual([
      { start: 0, end: 5, url: SPRITE, x: 0, y: 0, w: 160, h: 90 },
      { start: 5, end: 10, url: SPRITE, x: 160, y: 0, w: 160, h: 90 },
    ])
  })

  it('accepts CRLF line endings', () => {
    expect(parseThumbnailVtt(VTT.replace(/\n/g, '\r\n'))).toHaveLength(2)
  })

  it('accepts hour-less timestamps and cue identifiers', () => {
    const vtt = ['WEBVTT', '', 'thumb-1', '01:05.500 --> 01:10.250', `${SPRITE}#xywh=320,90,160,90`].join('\n')
    expect(parseThumbnailVtt(vtt)).toEqual([{ start: 65.5, end: 70.25, url: SPRITE, x: 320, y: 90, w: 160, h: 90 }])
  })

  it('parses hours in long videos', () => {
    const vtt = ['WEBVTT', '', '01:00:00.000 --> 01:00:05.000', `${SPRITE}#xywh=0,0,160,90`].join('\n')
    expect(parseThumbnailVtt(vtt)[0]).toMatchObject({ start: 3600, end: 3605 })
  })

  it('skips cues without a valid xywh fragment', () => {
    const vtt = [
      'WEBVTT',
      '',
      '00:00:00.000 --> 00:00:05.000',
      SPRITE,
      '',
      '00:00:05.000 --> 00:00:10.000',
      `${SPRITE}#xywh=1,2,three,4`,
      '',
      '00:00:10.000 --> 00:00:15.000',
      `${SPRITE}#xywh=0,90,160,90`,
    ].join('\n')
    expect(parseThumbnailVtt(vtt)).toEqual([{ start: 10, end: 15, url: SPRITE, x: 0, y: 90, w: 160, h: 90 }])
  })

  it('returns no cues for empty or non-VTT text', () => {
    expect(parseThumbnailVtt('')).toEqual([])
    expect(parseThumbnailVtt('<html>not found</html>')).toEqual([])
  })
})

describe('findThumbnail', () => {
  const cues: ThumbnailCue[] = parseThumbnailVtt(VTT)

  it('returns the cue whose range contains the time', () => {
    expect(findThumbnail(cues, 2)?.x).toBe(0)
    expect(findThumbnail(cues, 7.5)?.x).toBe(160)
  })

  it('treats the start as inclusive and the end as exclusive', () => {
    expect(findThumbnail(cues, 5)?.x).toBe(160)
  })

  it('clamps times past the last cue to the last thumbnail', () => {
    expect(findThumbnail(cues, 10)?.x).toBe(160)
    expect(findThumbnail(cues, 99)?.x).toBe(160)
  })

  it('returns null when there are no cues or the time is negative', () => {
    expect(findThumbnail([], 3)).toBeNull()
    expect(findThumbnail(cues, -1)).toBeNull()
  })
})
