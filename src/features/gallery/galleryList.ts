function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1)
}

/** Returns a copy of `list` with the item at `fromIndex` moved to `toIndex` (clamped). */
export function reorder<T>(list: readonly T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...list]
  if (fromIndex < 0 || fromIndex >= copy.length) return copy
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(clampIndex(toIndex, list.length), 0, moved)
  return copy
}
