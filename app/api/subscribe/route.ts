import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { subscribeSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { welcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = rateLimit(`subscribe:${ip}`, { maxRequests: 3, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const { email } = parsed.data

    if (!process.env.RESEND_API_KEY) {
      console.log('Demo mode: Sign-up received (Resend not configured):', email)
      return NextResponse.json(
        { success: true, message: 'Sign-up captured (demo mode)' },
        { status: 200 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>'

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: 'Welcome to JobProof — Your 14-Day Trial Starts Now',
      html: welcomeEmail()
    })

    if (error) {
      console.error('Resend subscribe error:', error)
      return NextResponse.json(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Welcome email sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
