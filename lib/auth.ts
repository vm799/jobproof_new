import { cookies } from 'next/headers'
import { getServiceClient } from './supabase'
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/constants'

export async function setAuthCookie(managerId: string) {
  cookies().set(COOKIE_NAME, managerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

export function getAuthCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME)
}

export async function getAuthenticatedManager() {
  const managerId = getAuthCookie()
  if (!managerId) return null

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('managers')
    .select('*')
    .eq('id', managerId)
    .single()

  return data
}

/** Check if the manager's trial has expired. Returns { expired, daysLeft, trialEndsAt } */
export async function checkTrialStatus(managerId: string): Promise<{ expired: boolean; daysLeft: number; trialEndsAt: string | null }> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('managers')
    .select('trial_ends_at')
    .eq('id', managerId)
    .single()

  if (!data?.trial_ends_at) return { expired: false, daysLeft: 14, trialEndsAt: null }

  const endsAt = new Date(data.trial_ends_at)
  const now = new Date()
  const msLeft = endsAt.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

  return { expired: msLeft <= 0, daysLeft, trialEndsAt: data.trial_ends_at }
}
