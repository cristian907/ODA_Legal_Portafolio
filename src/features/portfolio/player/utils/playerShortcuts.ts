export type PlayerShortcut =
  | { type: 'toggle-play' }
  | { type: 'toggle-fullscreen' }
  | { type: 'toggle-mute' }
  | { type: 'toggle-subtitles' }
  | { type: 'skip'; seconds: number }
  | { type: 'change-volume'; delta: number }
  | { type: 'seek-percent'; percent: number }

const VOLUME_STEP = 0.1
const SHORT_SKIP_SECONDS = 5
const LONG_SKIP_SECONDS = 10

const FIXED_SHORTCUTS: Record<string, PlayerShortcut> = {
  ' ': { type: 'toggle-play' },
  k: { type: 'toggle-play' },
  f: { type: 'toggle-fullscreen' },
  m: { type: 'toggle-mute' },
  c: { type: 'toggle-subtitles' },
  arrowleft: { type: 'skip', seconds: -SHORT_SKIP_SECONDS },
  arrowright: { type: 'skip', seconds: SHORT_SKIP_SECONDS },
  j: { type: 'skip', seconds: -LONG_SKIP_SECONDS },
  l: { type: 'skip', seconds: LONG_SKIP_SECONDS },
  arrowup: { type: 'change-volume', delta: VOLUME_STEP },
  arrowdown: { type: 'change-volume', delta: -VOLUME_STEP },
}

/** Maps a `KeyboardEvent.key` to the YouTube-style player shortcut it triggers. */
export function resolvePlayerShortcut(key: string): PlayerShortcut | null {
  const normalizedKey = key.toLowerCase()
  if (/^[0-9]$/.test(normalizedKey)) {
    return { type: 'seek-percent', percent: Number(normalizedKey) * 10 }
  }
  return FIXED_SHORTCUTS[normalizedKey] ?? null
}
