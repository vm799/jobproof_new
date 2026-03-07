import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await request.json()
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
    if (updates.crew_name !== undefined) allowed.crew_name = updates.crew_name
    if (updates.crew_email !== undefined) allowed.crew_email = updates.crew_email

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
