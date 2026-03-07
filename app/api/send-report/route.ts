import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const reportSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  html: z.string().min(1).max(500_000),
  jobId: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = rateLimit(`report:${ip}`, { maxRequests: 5, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { email, html, jobId } = parsed.data

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: true, message: 'Email sent (demo mode)' },
        { status: 200 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>',
      to: email,
      subject: `JobProof Report${jobId ? ` - ${jobId}` : ''}`,
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
