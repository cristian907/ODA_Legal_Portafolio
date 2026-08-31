import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SESSION_KEYS } from '@/shared/constants/storageKeys'
import { readRaw, writeRaw, removeKey } from '@/composables/useLocalStorage'

/**
 * Simulated admin auth (no backend, matches the legacy behavior). The login
 * form performs no credential check — clicking "Iniciar sesión" sets a
 * sessionStorage flag that lasts until the tab closes.
 */
export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(
    readRaw(SESSION_KEYS.ADMIN_LOGGED_IN, null, sessionStorage) === 'true',
  )

  function login(): void {
    isLoggedIn.value = true
    writeRaw(SESSION_KEYS.ADMIN_LOGGED_IN, 'true', sessionStorage)
  }

  function logout(): void {
    isLoggedIn.value = false
    removeKey(SESSION_KEYS.ADMIN_LOGGED_IN, sessionStorage)
  }

  return { isLoggedIn, login, logout }
})
