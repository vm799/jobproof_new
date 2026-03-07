import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { evidenceSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

const STORAGE_BUCKET = 'job-photos'

async function uploadBase64ToStorage(
  supabase: ReturnType<typeof getServiceClient>,
  base64Data: string,
  filePath: string
): Promise<string | null> {
  // Extract the actual base64 content from data URL
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null

  const contentType = match[1]
  const base64Content = match[2]
  const buffer = Buffer.from(base64Content, 'base64')

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Storage upload error:', error)
    // Fallback: store base64 directly if storage not configured
    return base64Data
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`crew-evidence:${ip}`, { maxRequests: 10, windowMs: 60_000 })
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

    // Upload photos to Supabase Storage (falls back to base64 if storage not configured)
    if (evidence.beforePhoto) {
      const url = await uploadBase64ToStorage(supabase, evidence.beforePhoto, `${job.id}/before.jpg`)
      if (url) updates.before_photo_url = url
    }
    if (evidence.afterPhoto) {
      const url = await uploadBase64ToStorage(supabase, evidence.afterPhoto, `${job.id}/after.jpg`)
      if (url) updates.after_photo_url = url
    }
    if (evidence.signature) {
      const url = await uploadBase64ToStorage(supabase, evidence.signature, `${job.id}/signature.png`)
      if (url) updates.signature_url = url
    }

    if (evidence.latitude !== undefined) updates.latitude = evidence.latitude
    if (evidence.longitude !== undefined) updates.longitude = evidence.longitude
    if (evidence.w3w) updates.w3w = evidence.w3w
    if (evidence.notes !== undefined) updates.notes = evidence.notes
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
