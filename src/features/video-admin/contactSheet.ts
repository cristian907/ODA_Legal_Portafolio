import type { ThumbnailCue } from '@/features/portfolio/player/utils/thumbnailVtt'

export interface SpriteSize {
  width: number
  height: number
}

/** A type alias (not an interface) so it stays assignable to Vue's StyleValue. */
export type SpriteCellStyle = {
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
}

/** The sprite's pixel size, inferred from the furthest tile edges of its cues. */
export function measureSprite(cues: ThumbnailCue[]): SpriteSize {
  return cues.reduce(
    (size, cue) => ({
      width: Math.max(size.width, cue.x + cue.w),
      height: Math.max(size.height, cue.y + cue.h),
    }),
    { width: 0, height: 0 },
  )
}

function percentPosition(offset: number, tile: number, total: number): string {
  const travel = total - tile
  return `${travel > 0 ? (offset / travel) * 100 : 0}%`
}

/** CSS that shows exactly one sprite tile, scaled to fill a cell of any size. */
export function spriteCellStyle(cue: ThumbnailCue, sprite: SpriteSize): SpriteCellStyle {
  return {
    backgroundImage: `url("${cue.url}")`,
    backgroundSize: `${(sprite.width / cue.w) * 100}% ${(sprite.height / cue.h) * 100}%`,
    backgroundPosition: `${percentPosition(cue.x, cue.w, sprite.width)} ${percentPosition(cue.y, cue.h, sprite.height)}`,
  }
}
