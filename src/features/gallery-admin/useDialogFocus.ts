import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  )
}

/**
 * Modal focus handling: moves focus into the dialog on mount, keeps Tab inside
 * it, routes Escape to `onEscape`, and gives focus back to the element that
 * opened it on unmount.
 */
export function useDialogFocus(
  container: Ref<HTMLElement | null>,
  options: { initialFocus?: Ref<HTMLElement | null>; onEscape: () => void },
) {
  let returnTo: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent): void {
    const element = container.value
    if (!element) return
    if (event.key === 'Escape') {
      event.preventDefault()
      options.onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = focusableIn(element)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !element.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !element.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(() => {
    returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKeydown)
    nextTick(() => {
      const target = options.initialFocus?.value ?? (container.value && focusableIn(container.value)[0])
      target?.focus()
    })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    if (returnTo?.isConnected) returnTo.focus()
  })
}
