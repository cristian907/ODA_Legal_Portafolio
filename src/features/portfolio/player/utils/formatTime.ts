const SECONDS_PER_HOUR = 3600
const SECONDS_PER_MINUTE = 60

function padTwo(value: number): string {
  return value.toString().padStart(2, '0')
}

/** Formats seconds as `m:ss`, or `h:mm:ss` from one hour on. */
export function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) return '0:00'
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const remainingSeconds = Math.floor(seconds % SECONDS_PER_MINUTE)
  if (hours > 0) return `${hours}:${padTwo(minutes)}:${padTwo(remainingSeconds)}`
  return `${minutes}:${padTwo(remainingSeconds)}`
}
