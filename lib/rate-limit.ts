const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}, 60_000)

export function rateLimit(
  key: string,
  { maxRequests = 10, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: maxRequests - entry.count }
}
