import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth'
import { stripeCheckoutSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

function getStripePriceIds(): Record<string, string> {
  return {
    tier1: process.env.STRIPE_PRICE_ID_TIER1 || '',
    tier2: process.env.STRIPE_PRICE_ID_TIER2 || '',
    tier3: process.env.STRIPE_PRICE_ID_TIER3 || '',
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`stripe-checkout:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = stripeCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { tier } = parsed.data
  const priceId = getStripePriceIds()[tier]

  if (!priceId) {
    return NextResponse.json({ error: `Price not configured for ${tier}` }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.pro'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { manager_id: managerId, tier },
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/upgrade?payment=cancelled`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
