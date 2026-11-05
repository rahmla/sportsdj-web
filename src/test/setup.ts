import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Newer Node versions ship their own (non-functional without a file) localStorage that can shadow jsdom's.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store = new Map<string, string>()
  const shim: Storage = {
    get length() { return store.size },
    clear: () => store.clear(),
    getItem: k => store.get(k) ?? null,
    key: i => [...store.keys()][i] ?? null,
    removeItem: k => { store.delete(k) },
    setItem: (k, v) => { store.set(k, String(v)) },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
