import { describe, it, expect, beforeEach } from 'vitest'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] },
    length: 0,
    key: () => null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('shouldShowOnboarding', () => {
  beforeEach(() => localStorageMock.clear())

  it('returns true when key not set', async () => {
    const { shouldShowOnboarding } = await import('../app/dashboard/OnboardingFlow')
    expect(shouldShowOnboarding()).toBe(true)
  })

  it('returns false when key is set', async () => {
    localStorageMock.setItem('jobproof_onboarded', '1')
    // Re-import to pick up the new state — actually shouldShowOnboarding reads at call time
    const { shouldShowOnboarding } = await import('../app/dashboard/OnboardingFlow')
    expect(shouldShowOnboarding()).toBe(false)
  })
})
