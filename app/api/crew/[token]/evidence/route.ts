import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const supabase = getServiceClient()

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('crew_token', params.token)
    .single()

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Accept base64 photos directly (store as data URLs for now)
    // In production, these would upload to Supabase Storage
    if (body.before_photo) updates.before_photo_url = body.before_photo
    if (body.after_photo) updates.after_photo_url = body.after_photo
    if (body.latitude !== undefined) updates.latitude = body.latitude
    if (body.longitude !== undefined) updates.longitude = body.longitude
    if (body.w3w) updates.w3w = body.w3w
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.signature) updates.signature_url = body.signature
    if (body.seal) updates.seal = body.seal

    // Update status to in_progress if currently accepted
    if (job.status === 'accepted' || job.status === 'sent' || job.status === 'created') {
      updates.status = 'in_progress'
    }

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', job.id)

    if (error) {
      console.error('Evidence update error:', error)
      return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Evidence saved' })
  } catch (error) {
    console.error('Evidence upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
