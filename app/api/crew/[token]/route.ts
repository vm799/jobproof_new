import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`crew-get:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const supabase = getServiceClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, title, address, instructions, crew_name, status, crew_token, before_photo_url, after_photo_url, latitude, longitude, w3w, notes, signature_url, seal, created_at, accepted_at, submitted_at')
    .eq('crew_token', params.token)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
}
