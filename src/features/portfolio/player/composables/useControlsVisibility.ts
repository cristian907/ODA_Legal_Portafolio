import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const HIDE_CONTROLS_DELAY_MS = 2800

interface ControlsVisibilityOptions {
  isPlaying: Ref<boolean>
  /** While true (e.g. a menu is open) the controls never auto-hide. */
  isPinned: () => boolean
}

/** Shows the controls on activity and hides them after a pause in mouse movement while playing. */
export function useControlsVisibility({ isPlaying, isPinned }: ControlsVisibilityOptions) {
  const showControls = ref(true)
  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  function canAutoHide(): boolean {
    return isPlaying.value && !isPinned()
  }

  function clearHideTimeout(): void {
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = null
  }

  function revealControls(): void {
    showControls.value = true
    clearHideTimeout()
    if (!canAutoHide()) return
    hideTimeout = setTimeout(() => {
      showControls.value = false
    }, HIDE_CONTROLS_DELAY_MS)
  }

  function hideControlsIfIdle(): void {
    if (canAutoHide()) showControls.value = false
  }

  watch(isPlaying, (playing) => {
    if (!playing) showControls.value = true
  })

  onBeforeUnmount(clearHideTimeout)

  return { showControls, revealControls, hideControlsIfIdle }
}
