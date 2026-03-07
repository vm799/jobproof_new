import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthCookie } from '@/lib/auth'

export async function GET() {
  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, address, crew_name, crew_email, status, created_at, sent_at, accepted_at, submitted_at, completed_at')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('List jobs error:', error)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }

  return NextResponse.json({ jobs })
}

export async function POST(request: NextRequest) {
  const managerId = getAuthCookie()
  if (!managerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, address, instructions, crew_name, crew_email } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        manager_id: managerId,
        title: title.trim(),
        address: address?.trim() || null,
        instructions: instructions?.trim() || null,
        crew_name: crew_name?.trim() || null,
        crew_email: crew_email?.trim()?.toLowerCase() || null,
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
