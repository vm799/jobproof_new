import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  createJobSchema,
  sendJobSchema,
  updateJobSchema,
  evidenceSchema,
  subscribeSchema,
  sendReportSchema,
  redeemCodeSchema,
  stripeCheckoutSchema,
} from '@/lib/validation'

describe('loginSchema', () => {
  it('accepts valid email', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-email' }).success).toBe(false)
  })
  it('rejects empty email', () => {
    expect(loginSchema.safeParse({ email: '' }).success).toBe(false)
  })
  it('rejects missing email', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
  })
})

describe('createJobSchema', () => {
  it('accepts valid job with all fields', () => {
    const result = createJobSchema.safeParse({
      title: 'Fix roof',
      address: '123 Main St',
      instructions: 'Replace shingles',
    })
    expect(result.success).toBe(true)
  })
  it('accepts job with only title (optional fields default)', () => {
    const result = createJobSchema.safeParse({ title: 'Fix roof' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.address).toBe('')
      expect(result.data.instructions).toBe('')
    }
  })
  it('rejects empty title', () => {
    expect(createJobSchema.safeParse({ title: '' }).success).toBe(false)
  })
  it('rejects missing title', () => {
    expect(createJobSchema.safeParse({}).success).toBe(false)
  })
  it('rejects title over 200 chars', () => {
    expect(createJobSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false)
  })
  it('rejects address over 500 chars', () => {
    expect(
      createJobSchema.safeParse({ title: 'Fix roof', address: 'x'.repeat(501) }).success
    ).toBe(false)
  })
  it('rejects instructions over 2000 chars', () => {
    expect(
      createJobSchema.safeParse({ title: 'Fix roof', instructions: 'x'.repeat(2001) }).success
    ).toBe(false)
  })
})

describe('sendJobSchema', () => {
  it('accepts valid crew name and email', () => {
    expect(
      sendJobSchema.safeParse({ crewName: 'John', crewEmail: 'john@example.com' }).success
    ).toBe(true)
  })
  it('rejects empty crew name', () => {
    expect(
      sendJobSchema.safeParse({ crewName: '', crewEmail: 'john@example.com' }).success
    ).toBe(false)
  })
  it('rejects invalid crew email', () => {
    expect(sendJobSchema.safeParse({ crewName: 'John', crewEmail: 'bad' }).success).toBe(false)
  })
  it('rejects crew name over 100 chars', () => {
    expect(
      sendJobSchema.safeParse({ crewName: 'x'.repeat(101), crewEmail: 'a@b.com' }).success
    ).toBe(false)
  })
})

describe('updateJobSchema', () => {
  it('accepts valid status', () => {
    expect(updateJobSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })
  it('rejects invalid status', () => {
    expect(updateJobSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })
  it('accepts empty object (all fields optional)', () => {
    expect(updateJobSchema.safeParse({}).success).toBe(true)
  })
  it('accepts valid title update', () => {
    expect(updateJobSchema.safeParse({ title: 'New title' }).success).toBe(true)
  })
  it('rejects empty title', () => {
    expect(updateJobSchema.safeParse({ title: '' }).success).toBe(false)
  })
})

describe('evidenceSchema', () => {
  it('accepts valid evidence with notes', () => {
    expect(evidenceSchema.safeParse({ notes: 'Work completed' }).success).toBe(true)
  })
  it('accepts valid coordinates', () => {
    const result = evidenceSchema.safeParse({ latitude: 40.7128, longitude: -74.006 })
    expect(result.success).toBe(true)
  })
  it('rejects latitude out of range', () => {
    expect(evidenceSchema.safeParse({ latitude: 91 }).success).toBe(false)
    expect(evidenceSchema.safeParse({ latitude: -91 }).success).toBe(false)
  })
  it('rejects longitude out of range', () => {
    expect(evidenceSchema.safeParse({ longitude: 181 }).success).toBe(false)
    expect(evidenceSchema.safeParse({ longitude: -181 }).success).toBe(false)
  })
  it('accepts empty object (all fields optional)', () => {
    expect(evidenceSchema.safeParse({}).success).toBe(true)
  })
  it('rejects notes over 5000 chars', () => {
    expect(evidenceSchema.safeParse({ notes: 'x'.repeat(5001) }).success).toBe(false)
  })
})

describe('subscribeSchema', () => {
  it('accepts valid email', () => {
    expect(subscribeSchema.safeParse({ email: 'user@test.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(subscribeSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('sendReportSchema', () => {
  it('accepts valid report', () => {
    const result = sendReportSchema.safeParse({
      to: 'boss@company.com',
      subject: 'Daily Report',
      html: '<h1>Report</h1>',
    })
    expect(result.success).toBe(true)
  })
  it('rejects missing subject', () => {
    expect(
      sendReportSchema.safeParse({ to: 'boss@company.com', html: '<h1>Report</h1>' }).success
    ).toBe(false)
  })
  it('rejects empty subject', () => {
    expect(
      sendReportSchema.safeParse({ to: 'a@b.com', subject: '', html: '<h1>R</h1>' }).success
    ).toBe(false)
  })
  it('rejects subject over 200 chars', () => {
    expect(
      sendReportSchema.safeParse({ to: 'a@b.com', subject: 'x'.repeat(201), html: '<h1/>' })
        .success
    ).toBe(false)
  })
  it('rejects invalid to email', () => {
    expect(
      sendReportSchema.safeParse({ to: 'bad', subject: 'Hi', html: '<h1/>' }).success
    ).toBe(false)
  })
})

describe('redeemCodeSchema', () => {
  it('accepts valid code and uppercases it', () => {
    const result = redeemCodeSchema.safeParse({ code: 'jobproof-abc123' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.code).toBe('JOBPROOF-ABC123')
  })
  it('trims whitespace before uppercasing', () => {
    const result = redeemCodeSchema.safeParse({ code: '  abc-123  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.code).toBe('ABC-123')
  })
  it('rejects empty code', () => {
    expect(redeemCodeSchema.safeParse({ code: '' }).success).toBe(false)
  })
  it('rejects missing code', () => {
    expect(redeemCodeSchema.safeParse({}).success).toBe(false)
  })
  it('rejects code over 100 chars', () => {
    expect(redeemCodeSchema.safeParse({ code: 'x'.repeat(101) }).success).toBe(false)
  })
})

describe('stripeCheckoutSchema', () => {
  it('accepts tier1', () => {
    expect(stripeCheckoutSchema.safeParse({ tier: 'tier1' }).success).toBe(true)
  })
  it('accepts tier2', () => {
    expect(stripeCheckoutSchema.safeParse({ tier: 'tier2' }).success).toBe(true)
  })
  it('accepts tier3', () => {
    expect(stripeCheckoutSchema.safeParse({ tier: 'tier3' }).success).toBe(true)
  })
  it('rejects invalid tier', () => {
    expect(stripeCheckoutSchema.safeParse({ tier: 'tier4' }).success).toBe(false)
  })
  it('rejects missing tier', () => {
    expect(stripeCheckoutSchema.safeParse({}).success).toBe(false)
  })
})
