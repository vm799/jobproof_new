import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { setAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`auth-verify:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  const supabase = getServiceClient()

  // Find and validate token
  const { data: tokenData, error: tokenError } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
  }

  // Check expiry
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired_token', request.url))
  }

  // Mark token as used
  await supabase
    .from('auth_tokens')
    .update({ used: true })
    .eq('id', tokenData.id)

  // Find or create manager
  const email = tokenData.email.toLowerCase().trim()
  let { data: manager } = await supabase
    .from('managers')
    .select('*')
    .eq('email', email)
    .single()

  if (!manager) {
    const { data: newManager, error: createError } = await supabase
      .from('managers')
      .insert({ email })
      .select()
      .single()

    if (createError || !newManager) {
      return NextResponse.redirect(new URL('/login?error=create_failed', request.url))
    }
    manager = newManager
  }

  // Set auth cookie
  await setAuthCookie(manager.id)

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
