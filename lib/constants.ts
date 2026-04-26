// Auth
export const COOKIE_NAME = 'jp_session'
export const COOKIE_MAX_AGE_DAYS = 30
export const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60

// Seal
export const SEAL_LENGTH = 32

// Cache
export const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

// Rate limits
export const LOGIN_RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 }
export const SUBSCRIBE_RATE_LIMIT = { maxRequests: 3, windowMs: 60_000 }
export const REPORT_RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 }
export const SEND_JOB_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 }

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Status
export const JOB_STATUSES = ['created', 'sent', 'accepted', 'in_progress', 'submitted', 'completed'] as const
export type JobStatus = typeof JOB_STATUSES[number]

// Stripe LTD price IDs — populated via env vars set in Vercel after creating products in Stripe dashboard
export const STRIPE_PRICE_IDS: Record<string, string> = {
  tier1: process.env.STRIPE_PRICE_ID_TIER1 || '',
  tier2: process.env.STRIPE_PRICE_ID_TIER2 || '',
  tier3: process.env.STRIPE_PRICE_ID_TIER3 || '',
}

// Per-tier job/manager limits (undefined = unlimited)
export const TIER_LIMITS: Record<string, { jobs?: number; managers?: number }> = {
  tier1: { jobs: 50, managers: 1 },
  tier2: { jobs: undefined, managers: 5 },
  tier3: { jobs: undefined, managers: undefined },
}

export const APPSUMO_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 } // 5 attempts per hour
