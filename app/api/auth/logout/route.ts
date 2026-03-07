import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`auth-logout:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  clearAuthCookie()
  return NextResponse.json({ success: true })
}
