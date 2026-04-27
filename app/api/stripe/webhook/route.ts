import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const body = await request.text()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const managerId = session.metadata?.manager_id
    const tier = session.metadata?.tier

    if (!managerId || !tier) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        { manager_id: managerId, tier, source: 'stripe', stripe_session_id: session.id },
        { onConflict: 'manager_id' }
      )

    if (error) {
      console.error('Webhook subscription upsert error:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
