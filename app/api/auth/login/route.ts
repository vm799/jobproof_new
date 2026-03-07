import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServiceClient } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; background: #fafaf9; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); padding: 28px; text-align: center; }
  .header h1 { color: #fff; font-size: 20px; margin: 0; }
  .body { padding: 28px; text-align: center; }
  .body p { color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
  .cta { display: inline-block; background: #f59e0b; color: #141422; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px; }
  .footer { text-align: center; padding: 16px; font-size: 12px; color: #a8a29e; }
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header"><h1>JobProof Login</h1></div>
  <div class="body">
    <p>Click below to log in to your dashboard:</p>
    <a href="${loginUrl}" class="cta">Log In to JobProof</a>
    <p style="margin-top:24px;font-size:13px;color:#78716c;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
  </div>
  <div class="footer">JobProof &mdash; Tamper-proof work documentation</div>
</div></div>
</body></html>`
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
