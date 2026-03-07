import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/sanitize'
import { newJobEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`send-job:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Get the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, managers!inner(email, name, company)')
    .eq('id', params.id)
    .eq('manager_id', managerId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (!job.crew_email) {
    return NextResponse.json({ error: 'No crew email set for this job' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const jobUrl = `${appUrl}/job/${job.crew_token}`
  const managerName = job.managers?.name || job.managers?.company || job.managers?.email || 'Your manager'

  // Send email to crew
  if (!process.env.RESEND_API_KEY) {
    console.log('Demo mode: Job link for crew:', jobUrl)
    // Still update status
    await supabase
      .from('jobs')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', params.id)
    return NextResponse.json({ success: true, message: 'Job sent (demo mode)', jobUrl })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>',
    to: job.crew_email,
    subject: `New Job: ${job.title}`,
    html: newJobEmail(
      escapeHtml(managerName),
      escapeHtml(job.title || ''),
      escapeHtml(job.address || ''),
      escapeHtml(job.instructions || ''),
      jobUrl
    )
  })

  if (emailError) {
    console.error('Send job email error:', emailError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Update job status
  await supabase
    .from('jobs')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ success: true, message: 'Job sent to crew' })
}
