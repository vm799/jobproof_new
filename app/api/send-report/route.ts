import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendReportSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = rateLimit(`report:${ip}`, { maxRequests: 5, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = sendReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { to: email, subject, html } = parsed.data
    const jobId = (body as Record<string, unknown>).jobId

    if (!process.env.RESEND_API_KEY) {
      console.log('Demo mode: Report email requested (Resend not configured):', email)
      return NextResponse.json(
        { success: true, message: 'Email sent (demo mode)' },
        { status: 200 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>',
      to: email,
      subject,
      html
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Report sent' }, { status: 200 })
  } catch (error) {
    console.error('Send report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
