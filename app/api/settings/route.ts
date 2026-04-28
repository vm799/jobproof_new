import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

const TIER_NAMES: Record<string, string> = { tier1: 'Solo', tier2: 'Team', tier3: 'Enterprise' }

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`settings:${ip}`, { maxRequests: 30, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const { data: manager, error: managerError } = await supabase
    .from('managers')
    .select('id, email, created_at, trial_ends_at')
    .eq('id', managerId)
    .single()

  if (managerError || !manager) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, source, activated_at')
    .eq('manager_id', managerId)
    .maybeSingle()

  return NextResponse.json({
    email: manager.email,
    createdAt: manager.created_at,
    trialEndsAt: manager.trial_ends_at,
    subscription: subscription
      ? { ...subscription, tierName: TIER_NAMES[subscription.tier] ?? subscription.tier }
      : null,
  })
}
