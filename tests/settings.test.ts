import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase', () => ({
  getServiceClient: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({
  getAuthCookie: vi.fn(),
}))

import { GET } from '../app/api/settings/route'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'

function mockSupabase(managerData: unknown, subData: unknown) {
  const managerSelectMock = vi.fn().mockResolvedValue({ data: managerData, error: null })
  const subSelectMock = vi.fn().mockResolvedValue({ data: subData, error: null })

  ;(getServiceClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from: (table: string) => {
      if (table === 'managers') return { select: () => ({ eq: () => ({ single: managerSelectMock }) }) }
      if (table === 'subscriptions') return { select: () => ({ eq: () => ({ maybeSingle: subSelectMock }) }) }
      throw new Error(`unexpected table: ${table}`)
    },
  })
}

function makeReq(ip = '1.1.1.1') {
  return new NextRequest('http://localhost/api/settings', {
    headers: { 'x-forwarded-for': ip },
  })
}

describe('GET /api/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    ;(getAuthCookie as unknown as ReturnType<typeof vi.fn>).mockReturnValue(undefined)
    const res = await GET(makeReq('test-401'))
    expect(res.status).toBe(401)
  })

  it('returns manager email and no subscription for trial user', async () => {
    ;(getAuthCookie as unknown as ReturnType<typeof vi.fn>).mockReturnValue('manager-uuid')
    mockSupabase(
      { id: 'manager-uuid', email: 'test@test.com', created_at: '2026-01-01', trial_ends_at: '2026-01-15' },
      null
    )
    const res = await GET(makeReq('test-trial'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.email).toBe('test@test.com')
    expect(body.subscription).toBeNull()
  })

  it('returns subscription tier for paid user', async () => {
    ;(getAuthCookie as unknown as ReturnType<typeof vi.fn>).mockReturnValue('manager-uuid')
    mockSupabase(
      { id: 'manager-uuid', email: 'paid@test.com', created_at: '2026-01-01', trial_ends_at: '2026-01-15' },
      { tier: 'tier1', source: 'appsumo', activated_at: '2026-04-27' }
    )
    const res = await GET(makeReq('test-paid'))
    const body = await res.json()
    expect(body.subscription.tier).toBe('tier1')
    expect(body.subscription.tierName).toBe('Solo')
    expect(body.subscription.source).toBe('appsumo')
  })

  it('returns 404 when manager not found', async () => {
    ;(getAuthCookie as unknown as ReturnType<typeof vi.fn>).mockReturnValue('manager-uuid')
    ;(getServiceClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: (table: string) => {
        if (table === 'managers') return { select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) }) }) }
        return { select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) }
      },
    })
    const res = await GET(makeReq('test-404'))
    expect(res.status).toBe(404)
  })
})
