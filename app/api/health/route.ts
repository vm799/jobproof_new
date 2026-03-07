import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not configured',
    resend: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
  }

  return NextResponse.json(checks)
}
