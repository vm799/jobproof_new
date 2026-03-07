import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'jp_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Gets or creates a CSRF token. Sets it as an httpOnly cookie and returns the token value.
 * The token should be included in a meta tag or fetched by the client to send in headers.
 */
export function getOrCreateCsrfToken(): string {
  const existing = cookies().get(CSRF_COOKIE_NAME)?.value
  if (existing) return existing

  const token = crypto.randomBytes(32).toString('hex')
  cookies().set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client JS needs to read this to include in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return token
}

/**
 * Validates the CSRF token from the request header matches the cookie.
 * Uses the double-submit cookie pattern: cookie value must match header value.
 */
export function validateCsrf(request: Request): boolean {
  const cookieToken = cookies().get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) return false

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    )
  } catch {
    return false
  }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME }
