import { NextResponse } from 'next/server'
import { getOrCreateCsrfToken } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = getOrCreateCsrfToken()
  return NextResponse.json({ token })
}
