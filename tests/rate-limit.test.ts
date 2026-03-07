import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

vi.useFakeTimers()

describe('rateLimit', () => {
  beforeEach(() => {
    // Advance time far enough to expire any previous entries
    vi.advanceTimersByTime(120_000)
  })

  it('allows requests within limit', () => {
    const result = rateLimit('test-allow', { maxRequests: 3, windowMs: 60_000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('tracks remaining requests correctly', () => {
    const key = 'test-remaining'
    const opts = { maxRequests: 3, windowMs: 60_000 }

    const r1 = rateLimit(key, opts)
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit(key, opts)
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = rateLimit(key, opts)
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding limit', () => {
    const key = 'test-block'
    const opts = { maxRequests: 2, windowMs: 60_000 }

    rateLimit(key, opts)
    rateLimit(key, opts)
    const result = rateLimit(key, opts)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('treats different keys independently', () => {
    const opts = { maxRequests: 1, windowMs: 60_000 }

    const r1 = rateLimit('key-a', opts)
    expect(r1.success).toBe(true)

    const r2 = rateLimit('key-b', opts)
    expect(r2.success).toBe(true)

    // key-a is now exhausted
    const r3 = rateLimit('key-a', opts)
    expect(r3.success).toBe(false)

    // key-b is also exhausted
    const r4 = rateLimit('key-b', opts)
    expect(r4.success).toBe(false)
  })

  it('resets after window expires', () => {
    const key = 'test-reset'
    const opts = { maxRequests: 1, windowMs: 10_000 }

    rateLimit(key, opts)
    const blocked = rateLimit(key, opts)
    expect(blocked.success).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(11_000)

    const allowed = rateLimit(key, opts)
    expect(allowed.success).toBe(true)
  })
})
