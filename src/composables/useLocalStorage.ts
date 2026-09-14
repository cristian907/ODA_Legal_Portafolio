// Small, safe wrappers around Web Storage. Every read/write is guarded so a
// private-mode browser, cleared storage, or malformed JSON never crashes the app.

export function readJSON<T>(key: string, fallback: T, storage: Storage = localStorage): T {
  try {
    const raw = storage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function readRaw(
  key: string,
  fallback: string | null = null,
  storage: Storage = localStorage,
): string | null {
  try {
    const raw = storage.getItem(key)
    return raw === null ? fallback : raw
  } catch {
    return fallback
  }
}

export function writeRaw(key: string, value: string, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string, storage: Storage = localStorage): boolean {
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}
