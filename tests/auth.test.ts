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

vi.mock('@/lib/supabase', () => ({
  getServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'mgr-1', email: 'test@test.com' } }),
        }),
      }),
    }),
  }),
}))

import { getAuthCookie, setAuthCookie, clearAuthCookie, getAuthenticatedManager } from '@/lib/auth'

describe('getAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cookie value when present', () => {
    mockCookies.get.mockReturnValue({ value: 'mgr-123' })
    const result = getAuthCookie()
    expect(result).toBe('mgr-123')
    expect(mockCookies.get).toHaveBeenCalledWith(COOKIE_NAME)
  })

  it('returns undefined when cookie is missing', () => {
    mockCookies.get.mockReturnValue(undefined)
    const result = getAuthCookie()
    expect(result).toBeUndefined()
    expect(mockCookies.get).toHaveBeenCalledWith(COOKIE_NAME)
  })
})

describe('setAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets cookie with correct options', async () => {
    await setAuthCookie('mgr-456')
    expect(mockCookies.set).toHaveBeenCalledWith(COOKIE_NAME, 'mgr-456', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })
  })

  it('sets httpOnly to true', async () => {
    await setAuthCookie('mgr-789')
    const options = mockCookies.set.mock.calls[0][2]
    expect(options.httpOnly).toBe(true)
  })

  it('sets sameSite to lax', async () => {
    await setAuthCookie('mgr-789')
    const options = mockCookies.set.mock.calls[0][2]
    expect(options.sameSite).toBe('lax')
  })

  it('sets maxAge from constants', async () => {
    await setAuthCookie('mgr-789')
    const options = mockCookies.set.mock.calls[0][2]
    expect(options.maxAge).toBe(COOKIE_MAX_AGE_SECONDS)
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

  it('returns manager data when cookie is set', async () => {
    mockCookies.get.mockReturnValue({ value: 'mgr-1' })
    const result = await getAuthenticatedManager()
    expect(result).toEqual({ id: 'mgr-1', email: 'test@test.com' })
  })
})
