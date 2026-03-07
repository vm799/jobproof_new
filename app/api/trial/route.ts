import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie, checkTrialStatus } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`trial:${ip}`, { maxRequests: 30, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const trial = await checkTrialStatus(managerId)
  return NextResponse.json(trial)
}
