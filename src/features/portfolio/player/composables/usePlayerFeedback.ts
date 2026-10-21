import { onBeforeUnmount, ref } from 'vue'

export type FeedbackSide = 'left' | 'right'

export interface CenterFeedback {
  show: boolean
  icon: string
  key: number
}

export interface SideFeedback {
  show: boolean
  text: string
  side: FeedbackSide
  key: number
}

const CENTER_FEEDBACK_MS = 600
const SIDE_FEEDBACK_MS = 650

/** Short-lived ripples shown after play/pause and skip actions. */
export function usePlayerFeedback() {
  const centerFeedback = ref<CenterFeedback>({ show: false, icon: 'fa-play', key: 0 })
  const sideFeedback = ref<SideFeedback>({ show: false, text: '', side: 'left', key: 0 })
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function after(delayMs: number, callback: () => void): void {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delayMs)
    timers.add(timer)
  }

  function showCenterFeedback(icon: string): void {
    centerFeedback.value = { show: true, icon, key: Date.now() }
    after(CENTER_FEEDBACK_MS, () => {
      centerFeedback.value.show = false
    })
  }

  function showSideFeedback(text: string, side: FeedbackSide): void {
    sideFeedback.value = { show: true, text, side, key: Date.now() }
    after(SIDE_FEEDBACK_MS, () => {
      sideFeedback.value.show = false
    })
  }

  onBeforeUnmount(() => timers.forEach(clearTimeout))

  return { centerFeedback, sideFeedback, showCenterFeedback, showSideFeedback }
}
