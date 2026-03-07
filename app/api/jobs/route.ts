import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'
import { createJobSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { validateCsrf } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`jobs-list:${ip}`, { maxRequests: 30, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

  const supabase = getServiceClient()
  const { data: jobs, error, count } = await supabase
    .from('jobs')
    .select('id, title, address, crew_name, crew_email, status, created_at, sent_at, accepted_at, submitted_at, completed_at', { count: 'exact' })
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error('List jobs error:', error)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }

  return NextResponse.json({ jobs, page, limit, total: count ?? 0 })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`jobs-create:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { title, address, instructions, crewName, crewEmail } = parsed.data

    const supabase = getServiceClient()
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        manager_id: managerId,
        title: title.trim(),
        address: address?.trim() || null,
        instructions: instructions?.trim() || null,
        crew_name: crewName?.trim() || null,
        crew_email: crewEmail?.trim()?.toLowerCase() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create job error:', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Create job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
