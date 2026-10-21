export interface SpriteLayout {
  frameCount: number
  columns: number
  rows: number
}

export function planSpriteLayout(
  durationSeconds: number,
  intervalSeconds: number,
  maxColumns: number,
): SpriteLayout {
  const frameCount = Math.max(1, Math.ceil(durationSeconds / intervalSeconds))
  const columns = Math.min(maxColumns, frameCount)
  return { frameCount, columns, rows: Math.ceil(frameCount / columns) }
}
