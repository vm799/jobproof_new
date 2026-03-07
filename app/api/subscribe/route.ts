import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { subscribeSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

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
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafaf9; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); padding: 32px 28px; text-align: center; }
  .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #fbbf24; font-size: 13px; margin: 0; font-weight: 600; }
  .body { padding: 28px; }
  .body p { color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #f59e0b; color: #141422; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 15px; }
  .features { margin: 20px 0; padding: 0; list-style: none; }
  .features li { padding: 6px 0; font-size: 14px; color: #57534e; }
  .features li::before { content: "\\2713"; color: #059669; margin-right: 8px; font-weight: 700; }
  .footer { text-align: center; padding: 20px 28px; font-size: 12px; color: #a8a29e; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <h1>Welcome to JobProof</h1>
      <p>Your 14-Day Free Trial</p>
    </div>
    <div class="body">
      <p>You're in. Your free trial starts today and runs for 14 days — no credit card needed.</p>
      <p>JobProof gives your crew tamper-proof documentation that holds up in court:</p>
      <ul class="features">
        <li>Before &amp; after photos with GPS timestamps</li>
        <li>Client digital signatures on-site</li>
        <li>Cryptographic sealing — nobody can alter evidence</li>
        <li>Works 100% offline, syncs when you're back online</li>
        <li>what3words precision location</li>
      </ul>
      <p style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.com'}/demo" class="cta">Start Documenting Jobs</a>
      </p>
      <p style="font-size:13px;color:#78716c;margin-top:24px;">Questions? Just reply to this email — we read every message.</p>
    </div>
    <div class="footer">
      JobProof &mdash; Protecting construction crews and securing lien claims.<br>
      &copy; ${new Date().getFullYear()} JobProof
    </div>
  </div>
</div>
</body>
</html>`
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
