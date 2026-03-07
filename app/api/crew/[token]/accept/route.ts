import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`crew-accept:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const supabase = getServiceClient()

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('crew_token', params.token)
    .single()

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'sent' && job.status !== 'created') {
    return NextResponse.json({ error: 'Job already accepted' }, { status: 400 })
  }

  const { error } = await supabase
    .from('jobs')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', job.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Job accepted' })
}
