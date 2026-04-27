import '@testing-library/jest-dom/vitest'

// jsdom's localStorage is unreliable in this project's setup — provide a stable mock
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const store: Record<string, string> = {}
  const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { for (const k in store) delete store[k] },
    removeItem: (key: string) => { delete store[key] },
    length: 0,
    key: () => null,
  }
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true })
}
