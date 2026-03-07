import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { loginSchema } from '@/lib/validation'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'
import { loginEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = rateLimit(`login:${ip}`, { maxRequests: 5, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { email } = parsed.data

    const supabase = getServiceClient()
    const token = crypto.randomBytes(32).toString('hex')

    // Store the token
    const { error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({ email: email.toLowerCase().trim(), token })

    if (tokenError) {
      console.error('Token insert error:', tokenError)
      return NextResponse.json({ error: 'Failed to create login link' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.pro'
    const loginUrl = `${appUrl}/auth/verify?token=${token}`

    // Send magic link email
    if (!process.env.RESEND_API_KEY) {
      console.log('Demo mode: Magic link:', loginUrl)
      return NextResponse.json({ success: true, message: 'Login link sent (demo mode)', demoUrl: loginUrl })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'JobProof <onboarding@resend.dev>',
      to: email,
      subject: 'Your JobProof Login Link',
      html: loginEmail(loginUrl)
    })

    if (emailError) {
      console.error('Email error:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Login link sent' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
