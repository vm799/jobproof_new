import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { evidenceSchema } from '@/lib/validation'
import { escapeHtml } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { jobCompleteEmail } from '@/lib/email'

const STORAGE_BUCKET = 'job-photos'

async function uploadBase64ToStorage(
  supabase: ReturnType<typeof getServiceClient>,
  base64Data: string,
  filePath: string
): Promise<string | null> {
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
    return base64Data
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * Combined evidence upload + submit endpoint.
 * Atomic: either all evidence is saved AND status is updated, or nothing happens.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`crew-submit-evidence:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const supabase = getServiceClient()

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*, managers!inner(email, name)')
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

    // Upload photos to storage
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

    // Atomically set status to submitted + save all evidence in one update
    updates.status = 'submitted'
    updates.submitted_at = new Date().toISOString()

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', job.id)

    if (error) {
      console.error('Evidence+submit error:', error)
      return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 })
    }

    // Notify manager via email (non-blocking — submission already succeeded)
    const managerEmail = job.managers?.email
    if (managerEmail && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.pro'
        const jobUrl = `${appUrl}/dashboard/job/${job.id}`

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>',
          to: managerEmail,
          subject: `Job Complete: ${job.title}`,
          html: jobCompleteEmail(
            escapeHtml(job.title || ''),
            escapeHtml(job.address || ''),
            escapeHtml(job.crew_name || ''),
            jobUrl
          )
        })
      } catch (emailErr) {
        console.error('Manager notification error:', emailErr)
      }
    }

    return NextResponse.json({ success: true, message: 'Evidence saved and job submitted' })
  } catch (error) {
    console.error('Submit evidence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
