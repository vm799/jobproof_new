import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

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
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; background: #fafaf9; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); padding: 28px; }
  .header h1 { color: #fff; font-size: 20px; margin: 0 0 4px; }
  .header p { color: #fbbf24; font-size: 13px; margin: 0; font-weight: 600; }
  .body { padding: 28px; }
  .body p { color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .detail { background: #f5f5f4; border-radius: 6px; padding: 16px; margin: 16px 0; }
  .detail-label { font-size: 11px; color: #78716c; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
  .detail-value { font-size: 15px; color: #18181b; font-weight: 500; margin-top: 2px; }
  .cta { display: inline-block; background: #f59e0b; color: #141422; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px; }
  .footer { text-align: center; padding: 16px; font-size: 12px; color: #a8a29e; }
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <h1>New Job Assigned</h1>
    <p>From ${managerName}</p>
  </div>
  <div class="body">
    <div class="detail">
      <div class="detail-label">Job</div>
      <div class="detail-value">${job.title}</div>
    </div>
    ${job.address ? `<div class="detail"><div class="detail-label">Address</div><div class="detail-value">${job.address}</div></div>` : ''}
    ${job.instructions ? `<div class="detail"><div class="detail-label">Instructions</div><div class="detail-value">${job.instructions}</div></div>` : ''}
    <p style="text-align:center;margin-top:24px;">
      <a href="${jobUrl}" class="cta">Open Job</a>
    </p>
    <p style="font-size:13px;color:#78716c;margin-top:24px;text-align:center;">Open on your phone to document work with photos, GPS, and signatures.</p>
  </div>
  <div class="footer">Sent via JobProof</div>
</div></div>
</body></html>`
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
