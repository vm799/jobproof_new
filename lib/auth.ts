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
