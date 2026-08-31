import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warn'

interface ToastState {
  visible: boolean
  message: string
  type: ToastType
}

// Module-level singleton so any component can raise a toast and the single
// <ToastHost> renders it. Replaces the legacy showToast().
const state = reactive<ToastState>({
  visible: false,
  message: '',
  type: 'success',
})

let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(message: string, type: ToastType = 'success'): void {
    state.message = message
    state.type = type
    state.visible = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(
      () => {
        state.visible = false
      },
      type === 'error' ? 3500 : 2500,
    )
  }

  return { state, show }
}
