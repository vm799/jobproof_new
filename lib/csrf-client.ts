const CSRF_COOKIE_NAME = 'jp_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Reads the CSRF token from the cookie (not httpOnly, readable by client JS).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

/**
 * Ensures the CSRF token exists by fetching it from the server if needed.
 * The server sets the cookie; subsequent calls read from the cookie.
 */
export async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfToken()
  if (token) return token

  try {
    const res = await fetch('/api/csrf')
    if (res.ok) {
      const data = await res.json()
      token = data.token || null
    }
  } catch {
    // Network error — will fail gracefully on next API call
  }
  return token || getCsrfToken()
}

/**
 * Returns headers with the CSRF token included.
 */
export function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getCsrfToken()
  const headers: Record<string, string> = { ...extra }
  if (token) {
    headers[CSRF_HEADER_NAME] = token
  }
  return headers
}
