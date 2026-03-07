import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`w3w:${ip}`, { maxRequests: 30, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  const apiKey = process.env.W3W_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'W3W not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${apiKey}&language=en`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('W3W API error:', err)
      return NextResponse.json({ error: 'W3W lookup failed' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      words: data.words,
      nearestPlace: data.nearestPlace,
      country: data.country,
      map: data.map,
    })
  } catch (error) {
    console.error('W3W fetch error:', error)
    return NextResponse.json({ error: 'W3W request failed' }, { status: 500 })
  }
}
