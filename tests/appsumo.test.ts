import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

import { POST, GET } from '@/app/api/appsumo/redeem/route'
import { createSignedCookieValue } from '@/lib/auth'

const VALID_MANAGER_UUID = '550e8400-e29b-41d4-a716-446655440000'
const SIGNED_MANAGER_COOKIE = createSignedCookieValue(VALID_MANAGER_UUID)

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/appsumo/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/appsumo/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockCookies.get.mockReturnValue(undefined)
    const res = await POST(makeRequest({ code: 'TESTCODE123' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when code is missing', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when code is empty string', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    const res = await POST(makeRequest({ code: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when code does not exist', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    })
    const res = await POST(makeRequest({ code: 'BADCODE' }))
    expect(res.status).toBe(404)
  })

  it('returns 409 when code already redeemed', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { code: 'USED123', tier: 'tier1', redeemed_by: 'other-manager-id' },
              error: null,
            }),
        }),
      }),
    })
    const res = await POST(makeRequest({ code: 'USED123' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already redeemed/i)
  })

  it('returns 409 when manager already has a code for this tier (stacking prevention)', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'appsumo_codes') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { code: 'NEW123', tier: 'tier1', redeemed_by: null },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: { code: '23505', message: 'unique violation' } }),
          }),
        }
      }
      return {
        upsert: () => Promise.resolve({ error: null }),
      }
    })
    const res = await POST(makeRequest({ code: 'NEW123' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already have a code for this tier/i)
  })

  it('redeems code and creates subscription on success', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'appsumo_codes') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { code: 'VALID123', tier: 'tier2', redeemed_by: null },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }
      }
      // subscriptions table
      return {
        upsert: () => Promise.resolve({ error: null }),
      }
    })
    const res = await POST(makeRequest({ code: 'VALID123' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tier).toBe('tier2')
  })
})

describe('GET /api/appsumo/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockCookies.get.mockReturnValue(undefined)
    const req = new NextRequest('http://localhost/api/appsumo/redeem', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns redeemed codes list for authenticated manager', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [{ code: 'CODE1', tier: 'tier1', redeemed_at: '2026-04-26T00:00:00Z' }],
            error: null,
          }),
      }),
    })
    const req = new NextRequest('http://localhost/api/appsumo/redeem', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.codes).toHaveLength(1)
    expect(body.codes[0].code).toBe('CODE1')
  })

  it('returns empty array when no codes redeemed', async () => {
    mockCookies.get.mockReturnValue({ value: SIGNED_MANAGER_COOKIE })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    })
    const req = new NextRequest('http://localhost/api/appsumo/redeem', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.codes).toEqual([])
  })
})
