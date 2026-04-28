import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/constants'

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: () => mockCookies,
}))

const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getServiceClient: () => ({
    from: mockSupabaseFrom,
  }),
}))

import { getAuthCookie, setAuthCookie, clearAuthCookie, getAuthenticatedManager, checkTrialStatus } from '@/lib/auth'

describe('getAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined when cookie is missing', () => {
    mockCookies.get.mockReturnValue(undefined)
    const result = getAuthCookie()
    expect(result).toBeUndefined()
    expect(mockCookies.get).toHaveBeenCalledWith(COOKIE_NAME)
  })

  it('rejects unsigned raw UUID (no backward compat)', () => {
    mockCookies.get.mockReturnValue({ value: '550e8400-e29b-41d4-a716-446655440000' })
    const result = getAuthCookie()
    expect(result).toBeUndefined()
  })

  it('rejects garbage values', () => {
    mockCookies.get.mockReturnValue({ value: 'not-a-uuid-or-signed' })
    const result = getAuthCookie()
    expect(result).toBeUndefined()
  })
})

describe('setAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets a signed cookie value', async () => {
    await setAuthCookie('mgr-456')
    expect(mockCookies.set).toHaveBeenCalledTimes(1)
    const [name, value, options] = mockCookies.set.mock.calls[0]
    expect(name).toBe(COOKIE_NAME)
    // Value should be signed: "mgr-456.<signature>"
    expect(value).toMatch(/^mgr-456\..+$/)
    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe('lax')
    expect(options.maxAge).toBe(COOKIE_MAX_AGE_SECONDS)
    expect(options.path).toBe('/')
  })

  it('round-trips: setAuthCookie value can be read by getAuthCookie', async () => {
    await setAuthCookie('test-id-123')
    const signedValue = mockCookies.set.mock.calls[0][1]
    mockCookies.get.mockReturnValue({ value: signedValue })
    const result = getAuthCookie()
    expect(result).toBe('test-id-123')
  })
})

describe('clearAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the cookie', () => {
    clearAuthCookie()
    expect(mockCookies.delete).toHaveBeenCalledWith(COOKIE_NAME)
  })
})

describe('getAuthenticatedManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no cookie is set', async () => {
    mockCookies.get.mockReturnValue(undefined)
    const result = await getAuthenticatedManager()
    expect(result).toBeNull()
  })

  it('returns manager data when cookie is valid signed UUID', async () => {
    await setAuthCookie('550e8400-e29b-41d4-a716-446655440000')
    const signedValue = mockCookies.set.mock.calls[0][1]
    mockCookies.get.mockReturnValue({ value: signedValue })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'mgr-1', email: 'test@test.com' } }),
        }),
      }),
    })
    const result = await getAuthenticatedManager()
    expect(result).toEqual({ id: 'mgr-1', email: 'test@test.com' })
  })
})

describe('checkTrialStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns expired:false with daysLeft:Infinity when subscription exists', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'sub-1' }, error: null }) }) }),
        }
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }
    })

    const result = await checkTrialStatus('mgr-1')
    expect(result.expired).toBe(false)
    expect(result.daysLeft).toBe(Infinity)
    expect(result.trialEndsAt).toBeNull()
  })

  it('returns expired:true when no subscription and trial ended', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }) }) }),
        }
      }
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: { trial_ends_at: past }, error: null }) }),
        }),
      }
    })

    const result = await checkTrialStatus('mgr-1')
    expect(result.expired).toBe(true)
    expect(result.daysLeft).toBe(0)
  })

  it('returns expired:false when no subscription and trial is active', async () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }) }) }),
        }
      }
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: { trial_ends_at: future }, error: null }) }),
        }),
      }
    })

    const result = await checkTrialStatus('mgr-1')
    expect(result.expired).toBe(false)
    expect(result.daysLeft).toBeGreaterThan(0)
  })
})
