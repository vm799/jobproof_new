import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { escapeHtml } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'

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
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; background: #fafaf9; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); padding: 28px; text-align: center; }
  .header h1 { color: #fff; font-size: 20px; margin: 0 0 4px; }
  .header p { color: #10b981; font-size: 13px; margin: 0; font-weight: 600; }
  .body { padding: 28px; text-align: center; }
  .body p { color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #f59e0b; color: #141422; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px; }
  .detail { background: #f5f5f4; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: left; }
  .detail-label { font-size: 11px; color: #78716c; text-transform: uppercase; font-weight: 600; }
  .detail-value { font-size: 15px; color: #18181b; font-weight: 500; margin-top: 2px; }
  .footer { text-align: center; padding: 16px; font-size: 12px; color: #a8a29e; }
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <h1>Job Complete</h1>
    <p>Evidence submitted by crew</p>
  </div>
  <div class="body">
    <div class="detail">
      <div class="detail-label">Job</div>
      <div class="detail-value">${escapeHtml(job.title || '')}</div>
    </div>
    ${job.address ? `<div class="detail"><div class="detail-label">Address</div><div class="detail-value">${escapeHtml(job.address || '')}</div></div>` : ''}
    ${job.crew_name ? `<div class="detail"><div class="detail-label">Crew</div><div class="detail-value">${escapeHtml(job.crew_name || '')}</div></div>` : ''}
    <p>Your crew has submitted their work evidence including photos, GPS location, and client signature.</p>
    <a href="${jobUrl}" class="cta">View Evidence</a>
  </div>
  <div class="footer">JobProof &mdash; Tamper-proof work documentation</div>
</div></div>
</body></html>`
      })
    } catch (emailErr) {
      console.error('Manager notification error:', emailErr)
      // Don't fail the submission if email fails
    }
  }

  return NextResponse.json({ success: true, message: 'Job submitted' })
}
