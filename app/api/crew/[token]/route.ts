import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
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
