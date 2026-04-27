import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/auth'
import { getServiceClient } from '@/lib/supabase'
import { redeemCodeSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const managerId = getAuthCookie()
  if (!managerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = redeemCodeSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid input'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const code = parsed.data.code
  const supabase = getServiceClient()

  // Fetch code record
  const { data: codeRow, error: fetchError } = await supabase
    .from('appsumo_codes')
    .select('code, tier, redeemed_by')
    .eq('code', code)
    .single()

  if (fetchError || !codeRow) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  }

  if (codeRow.redeemed_by) {
    return NextResponse.json({ error: 'Code already redeemed' }, { status: 409 })
  }

  // Mark code as redeemed (unique index on (redeemed_by, tier) prevents stacking same tier)
  const { error: updateError } = await supabase
    .from('appsumo_codes')
    .update({ redeemed_by: managerId, redeemed_at: new Date().toISOString() })
    .eq('code', code)

  if (updateError) {
    if (updateError.code === '23505') {
      return NextResponse.json(
        { error: 'You already have a code for this tier' },
        { status: 409 }
      )
    }
    console.error('AppSumo redeem update error:', updateError)
    return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 })
  }

  // Upsert subscription — AppSumo source; higher tier wins on conflict
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert(
      { manager_id: managerId, tier: codeRow.tier, source: 'appsumo', appsumo_code: code },
      { onConflict: 'manager_id' }
    )

  if (subError) {
    console.error('AppSumo subscription upsert error:', subError)
    return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, tier: codeRow.tier })
}

export async function GET(request: NextRequest) {
  const managerId = getAuthCookie()
  if (!managerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('appsumo_codes')
    .select('code, tier, redeemed_at')
    .eq('redeemed_by', managerId)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }

  return NextResponse.json({ codes: data ?? [] })
}
