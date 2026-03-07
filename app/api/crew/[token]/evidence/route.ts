import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { evidenceSchema } from '@/lib/validation'

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
    const parsed = evidenceSchema.safeParse({
      beforePhoto: body.before_photo,
      afterPhoto: body.after_photo,
      notes: body.notes,
      signature: body.signature,
      latitude: body.latitude,
      longitude: body.longitude,
      w3w: body.w3w,
      seal: body.seal,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const evidence = parsed.data
    const updates: Record<string, unknown> = {}

    // Accept base64 photos directly (store as data URLs for now)
    // In production, these would upload to Supabase Storage
    if (evidence.beforePhoto) updates.before_photo_url = evidence.beforePhoto
    if (evidence.afterPhoto) updates.after_photo_url = evidence.afterPhoto
    if (evidence.latitude !== undefined) updates.latitude = evidence.latitude
    if (evidence.longitude !== undefined) updates.longitude = evidence.longitude
    if (evidence.w3w) updates.w3w = evidence.w3w
    if (evidence.notes !== undefined) updates.notes = evidence.notes
    if (evidence.signature) updates.signature_url = evidence.signature
    if (evidence.seal) updates.seal = evidence.seal

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
