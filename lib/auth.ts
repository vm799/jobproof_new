import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getServiceClient } from './supabase'
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/constants'

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'

/** Sign a value with HMAC-SHA256 */
function sign(value: string): string {
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(value)
    .digest('base64url')
  return `${value}.${signature}`
}

/** Verify and extract a signed value. Returns null if tampered. */
function unsign(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  // Timing-safe comparison
  if (expected.length !== signed.length) return null
  const a = Buffer.from(expected)
  const b = Buffer.from(signed)
  if (!crypto.timingSafeEqual(a, b)) return null
  return value
}

export async function setAuthCookie(managerId: string) {
  const signedValue = sign(managerId)
  cookies().set(COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

/** Create a signed cookie value without setting it (for use on redirect responses) */
export function createSignedCookieValue(managerId: string): string {
  return sign(managerId)
}

export function getAuthCookie(): string | undefined {
  const raw = cookies().get(COOKIE_NAME)?.value
  if (!raw) return undefined
  const unsigned = unsign(raw)
  if (unsigned) return unsigned
  return undefined
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

  // Active subscription bypasses trial entirely
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('manager_id', managerId)
    .single()

  if (sub) return { expired: false, daysLeft: Infinity, trialEndsAt: null }

  // No subscription — check trial expiry
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
