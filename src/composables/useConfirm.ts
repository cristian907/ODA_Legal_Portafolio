import { reactive } from 'vue'

export type ConfirmVariant = 'default' | 'danger'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean
}

// Promise-based confirmation dialog (replaces window.confirm and the legacy
// custom modal). A single <ConfirmModal> host reads this state.
const state = reactive<ConfirmState>({
  open: false,
  title: 'Confirmar',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'default',
})

let resolver: ((result: boolean) => void) | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions = {}): Promise<boolean> {
    state.title = options.title ?? 'Confirmar'
    state.message = options.message ?? ''
    state.confirmLabel = options.confirmLabel ?? 'Confirmar'
    state.cancelLabel = options.cancelLabel ?? 'Cancelar'
    state.variant = options.variant ?? 'default'
    state.open = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function resolve(result: boolean): void {
    state.open = false
    if (resolver) {
      resolver(result)
      resolver = null
    }
  }

  return { state, confirm, resolve }
}
