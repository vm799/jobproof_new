import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { email, html, jobId } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (!html) {
      return NextResponse.json({ error: 'Missing report content' }, { status: 400 })
    }

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
      subject: `JobProof Report - ${jobId || 'Job Documentation'}`,
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
