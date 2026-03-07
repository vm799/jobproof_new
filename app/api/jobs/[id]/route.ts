import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'
import { updateJobSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`job-get:${ip}`, { maxRequests: 30, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('manager_id', managerId)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`job-patch:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = updateJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const updates = parsed.data
    const supabase = getServiceClient()

    // Only allow certain fields to be updated by manager
    const allowed: Record<string, unknown> = {}
    if (updates.status === 'completed') {
      allowed.status = 'completed'
      allowed.completed_at = new Date().toISOString()
    }
    if (updates.title) allowed.title = updates.title
    if (updates.address !== undefined) allowed.address = updates.address
    if (updates.instructions !== undefined) allowed.instructions = updates.instructions
    if (updates.crewName !== undefined) allowed.crew_name = updates.crewName
    if (updates.crewEmail !== undefined) allowed.crew_email = updates.crewEmail

    const { data: job, error } = await supabase
      .from('jobs')
      .update(allowed)
      .eq('id', params.id)
      .eq('manager_id', managerId)
      .select()
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(`job-delete:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Fetch the job to verify ownership and status
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', params.id)
    .eq('manager_id', managerId)
    .single()

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'created') {
    return NextResponse.json(
      { error: 'Only jobs in "created" status can be deleted' },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)
    .eq('manager_id', managerId)

  if (deleteError) {
    console.error('Delete job error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
