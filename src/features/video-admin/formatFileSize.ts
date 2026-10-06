const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const STEP = 1024

const decimalFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

/** Formats a byte count with binary units and a Spanish decimal comma (`12,4 MB`). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  let value = bytes
  let unitIndex = 0
  while (value >= STEP && unitIndex < UNITS.length - 1) {
    value /= STEP
    unitIndex += 1
  }
  const rounded = unitIndex === 0 ? Math.round(value).toString() : decimalFormat.format(value)
  return `${rounded} ${UNITS[unitIndex]}`
}
