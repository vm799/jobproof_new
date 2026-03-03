import { NextRequest, NextResponse } from 'next/server'

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX || 'us1'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }

    // If Mailchimp not configured, just return success (demo mode)
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
      console.log('Demo mode: Email received (Mailchimp not configured):', email)
      return NextResponse.json(
        { success: true, message: 'Email captured (demo mode)' },
        { status: 200 }
      )
    }

    // Send to Mailchimp
    const mailchimpResponse = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`
        },
        body: JSON.stringify({
          email_address: email,
          status: 'pending', // Double opt-in
          tags: ['jobproof-demo'],
          merge_fields: {
            SOURCE: 'landing_page',
            DEMO_DATE: new Date().toISOString()
          }
        })
      }
    )

    if (!mailchimpResponse.ok) {
      const error = await mailchimpResponse.json()
      console.error('Mailchimp error:', error)
      
      // If email already exists, that's ok
      if (error.detail?.includes('already')) {
        return NextResponse.json(
          { success: true, message: 'Email already registered' },
          { status: 200 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Subscribed successfully' },
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
