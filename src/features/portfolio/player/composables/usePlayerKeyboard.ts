import { resolvePlayerShortcut, type PlayerShortcut } from '../utils/playerShortcuts'

export interface PlayerKeyboardActions {
  togglePlay: () => void
  toggleFullscreen: () => void
  toggleMute: () => void
  toggleSubtitles: () => void
  skip: (seconds: number) => void
  changeVolumeBy: (delta: number) => void
  seekToPercent: (percent: number) => void
}

const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA'])

function isTypingInField(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  return Boolean(target && TEXT_ENTRY_TAGS.has(target.tagName))
}

function runShortcut(shortcut: PlayerShortcut, actions: PlayerKeyboardActions): void {
  switch (shortcut.type) {
    case 'toggle-play':
      return actions.togglePlay()
    case 'toggle-fullscreen':
      return actions.toggleFullscreen()
    case 'toggle-mute':
      return actions.toggleMute()
    case 'toggle-subtitles':
      return actions.toggleSubtitles()
    case 'skip':
      return actions.skip(shortcut.seconds)
    case 'change-volume':
      return actions.changeVolumeBy(shortcut.delta)
    case 'seek-percent':
      return actions.seekToPercent(shortcut.percent)
  }
}

/** Keydown handler for the YouTube-style shortcuts; ignores keys typed into form fields. */
export function usePlayerKeyboard(actions: PlayerKeyboardActions) {
  function onKeyDown(event: KeyboardEvent): void {
    if (isTypingInField(event)) return
    const shortcut = resolvePlayerShortcut(event.key)
    if (!shortcut) return
    event.preventDefault()
    runShortcut(shortcut, actions)
  }

  return { onKeyDown }
}
