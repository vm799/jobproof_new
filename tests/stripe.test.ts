import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCookies = { get: vi.fn() }
vi.mock('next/headers', () => ({ cookies: () => mockCookies }))

const mockCreateSession = vi.fn()
const mockConstructEvent = vi.fn()
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCreateSession } },
    webhooks: { constructEvent: mockConstructEvent },
  })),
}))

const mockSupabaseUpsert = vi.fn()
vi.mock('@/lib/supabase', () => ({
  getServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
      upsert: mockSupabaseUpsert,
    }),
  }),
}))

import { POST as checkoutPOST } from '@/app/api/stripe/checkout/route'
import { POST as webhookPOST } from '@/app/api/stripe/webhook/route'
import { NextRequest } from 'next/server'

function makeCheckoutRequest(body: unknown) {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    process.env.NEXT_PUBLIC_APP_URL = 'https://jobproof.pro'
    process.env.STRIPE_PRICE_ID_TIER1 = 'price_tier1_fake'
    process.env.STRIPE_PRICE_ID_TIER2 = 'price_tier2_fake'
    process.env.STRIPE_PRICE_ID_TIER3 = 'price_tier3_fake'
  })

  it('returns 401 when no session cookie', async () => {
    mockCookies.get.mockReturnValue(undefined)
    const res = await checkoutPOST(makeCheckoutRequest({ tier: 'tier1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid tier', async () => {
    mockCookies.get.mockReturnValue({ value: '550e8400-e29b-41d4-a716-446655440000' })
    const res = await checkoutPOST(makeCheckoutRequest({ tier: 'tier9' }))
    expect(res.status).toBe(400)
  })

  it('creates Stripe session with correct metadata and returns url', async () => {
    mockCookies.get.mockReturnValue({ value: '550e8400-e29b-41d4-a716-446655440000' })
    mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test_123' })

    const res = await checkoutPOST(makeCheckoutRequest({ tier: 'tier2' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: expect.objectContaining({
          manager_id: '550e8400-e29b-41d4-a716-446655440000',
          tier: 'tier2',
        }),
      })
    )
  })
})

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake'
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
    })
    const res = await webhookPOST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Bad signature') })
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'bad-sig' },
      body: 'raw-body',
    })
    const res = await webhookPOST(req)
    expect(res.status).toBe(400)
  })

  it('writes subscription on checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { manager_id: 'mgr-abc', tier: 'tier1' },
        },
      },
    })
    mockSupabaseUpsert.mockResolvedValue({ error: null })

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-sig' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    })
    const res = await webhookPOST(req)
    expect(res.status).toBe(200)
    expect(mockSupabaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ manager_id: 'mgr-abc', tier: 'tier1', source: 'stripe' }),
      { onConflict: 'manager_id' }
    )
  })

  it('returns 200 for unknown event types without writing subscription', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    })
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-sig' },
      body: '{}',
    })
    const res = await webhookPOST(req)
    expect(res.status).toBe(200)
    expect(mockSupabaseUpsert).not.toHaveBeenCalled()
  })
})
