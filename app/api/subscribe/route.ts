import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import { subscribeSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { welcomeEmail } from '@/lib/email'
import crypto from 'crypto'

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
    const email = parsed.data.email.toLowerCase().trim()

    const supabase = getServiceClient()

    // Find or create manager account
    let { data: manager } = await supabase
      .from('managers')
      .select('id')
      .eq('email', email)
      .single()

    if (!manager) {
      const { data: newManager, error: createError } = await supabase
        .from('managers')
        .insert({ email })
        .select('id')
        .single()

      if (createError || !newManager) {
        console.error('Manager create error:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      manager = newManager
    }

    // Generate auth token for magic link
    const token = crypto.randomBytes(32).toString('hex')
    const { error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({ email, token })

    if (tokenError) {
      console.error('Token insert error:', tokenError)
      return NextResponse.json({ error: 'Failed to create login link' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.pro'
    const loginUrl = `${appUrl}/auth/verify?token=${token}`

    if (!process.env.RESEND_API_KEY) {
      console.log('Demo mode: Welcome magic link:', loginUrl)
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
      html: welcomeEmail(loginUrl)
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
