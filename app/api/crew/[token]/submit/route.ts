import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { escapeHtml } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { jobCompleteEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`crew-submit:${ip}`, { maxRequests: 5, windowMs: 60_000 })
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

  // Update status
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', job.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to submit job' }, { status: 500 })
  }

  // Notify manager via email
  const managerEmail = job.managers?.email
  if (managerEmail && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
      // Don't fail the submission if email fails
    }
  }

  return NextResponse.json({ success: true, message: 'Job submitted' })
}
