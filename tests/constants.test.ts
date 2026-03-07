import { describe, it, expect } from 'vitest'
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_DAYS,
  COOKIE_MAX_AGE_SECONDS,
  SEAL_LENGTH,
  ONE_YEAR_SECONDS,
  LOGIN_RATE_LIMIT,
  SUBSCRIBE_RATE_LIMIT,
  REPORT_RATE_LIMIT,
  SEND_JOB_RATE_LIMIT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  JOB_STATUSES,
} from '@/lib/constants'

describe('Auth constants', () => {
  it('COOKIE_NAME is jp_session', () => {
    expect(COOKIE_NAME).toBe('jp_session')
  })

  it('COOKIE_MAX_AGE_SECONDS equals 30 days in seconds', () => {
    expect(COOKIE_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60)
  })

  it('COOKIE_MAX_AGE_SECONDS is derived from COOKIE_MAX_AGE_DAYS', () => {
    expect(COOKIE_MAX_AGE_SECONDS).toBe(COOKIE_MAX_AGE_DAYS * 24 * 60 * 60)
  })
})

describe('JOB_STATUSES', () => {
  it('contains all expected statuses', () => {
    expect(JOB_STATUSES).toContain('created')
    expect(JOB_STATUSES).toContain('sent')
    expect(JOB_STATUSES).toContain('accepted')
    expect(JOB_STATUSES).toContain('in_progress')
    expect(JOB_STATUSES).toContain('submitted')
    expect(JOB_STATUSES).toContain('completed')
  })

  it('has exactly 6 statuses', () => {
    expect(JOB_STATUSES).toHaveLength(6)
  })
})

describe('Rate limit constants', () => {
  it('LOGIN_RATE_LIMIT has expected shape', () => {
    expect(LOGIN_RATE_LIMIT).toEqual({ maxRequests: 5, windowMs: 60_000 })
  })

  it('SUBSCRIBE_RATE_LIMIT has expected shape', () => {
    expect(SUBSCRIBE_RATE_LIMIT).toEqual({ maxRequests: 3, windowMs: 60_000 })
  })

  it('REPORT_RATE_LIMIT has expected shape', () => {
    expect(REPORT_RATE_LIMIT).toEqual({ maxRequests: 5, windowMs: 60_000 })
  })

  it('SEND_JOB_RATE_LIMIT has expected shape', () => {
    expect(SEND_JOB_RATE_LIMIT).toEqual({ maxRequests: 10, windowMs: 60_000 })
  })
})

describe('Other constants', () => {
  it('SEAL_LENGTH is 32', () => {
    expect(SEAL_LENGTH).toBe(32)
  })

  it('ONE_YEAR_SECONDS is correct', () => {
    expect(ONE_YEAR_SECONDS).toBe(365 * 24 * 60 * 60)
  })

  it('DEFAULT_PAGE_SIZE is 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20)
  })

  it('MAX_PAGE_SIZE is 100', () => {
    expect(MAX_PAGE_SIZE).toBe(100)
  })
})
