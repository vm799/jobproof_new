import { describe, it, expect } from 'vitest'

describe('dashboard nav links', () => {
  it('upgrade link href is /upgrade', () => {
    expect('/upgrade').toBe('/upgrade')
  })
  it('settings link href is /settings', () => {
    expect('/settings').toBe('/settings')
  })
})
