import { cookies } from 'next/headers'
import { getServiceClient } from './supabase'

const COOKIE_NAME = 'jobproof_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function setAuthCookie(managerId: string) {
  cookies().set(COOKIE_NAME, managerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
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
