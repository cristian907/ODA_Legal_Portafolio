import { onBeforeUnmount } from 'vue'

const DOUBLE_CLICK_WINDOW_MS = 250

/** Tells single clicks from double clicks on the same element without firing both. */
export function useVideoAreaClicks(
  onSingleClick: () => void,
  onDoubleClick: (event: MouseEvent) => void,
) {
  let pendingSingleClick: ReturnType<typeof setTimeout> | null = null

  function cancelPendingSingleClick(): void {
    if (pendingSingleClick) clearTimeout(pendingSingleClick)
    pendingSingleClick = null
  }

  function onVideoAreaClick(event: MouseEvent): void {
    if (pendingSingleClick) {
      cancelPendingSingleClick()
      onDoubleClick(event)
      return
    }
    pendingSingleClick = setTimeout(() => {
      pendingSingleClick = null
      onSingleClick()
    }, DOUBLE_CLICK_WINDOW_MS)
  }

  onBeforeUnmount(cancelPendingSingleClick)

  return { onVideoAreaClick }
}
