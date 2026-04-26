import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address').max(255)

export const loginSchema = z.object({
  email: emailSchema,
})

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  address: z.string().max(500).optional().default(''),
  instructions: z.string().max(2000).optional().default(''),
  crewName: z.string().max(100).optional().default(''),
  crewEmail: z.string().email().max(255).optional().or(z.literal('')).default(''),
})

export const sendJobSchema = z.object({
  crewName: z.string().min(1).max(100),
  crewEmail: emailSchema,
})

export const updateJobSchema = z.object({
  status: z.enum(['created', 'sent', 'accepted', 'in_progress', 'submitted', 'completed']).optional(),
  title: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
  instructions: z.string().max(2000).optional(),
  crewName: z.string().max(100).optional(),
  crewEmail: z.string().email().max(255).optional(),
})

export const evidenceSchema = z.object({
  beforePhoto: z.string().max(10_000_000).optional(),  // ~7.5MB base64
  afterPhoto: z.string().max(10_000_000).optional(),
  notes: z.string().max(5000).optional(),
  signature: z.string().max(1_000_000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  w3w: z.string().max(100).optional(),
  seal: z.string().max(100).optional(),
})

export const subscribeSchema = z.object({
  email: emailSchema,
})

export const sendReportSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1).max(200),
  html: z.string().max(500_000),
})

export const redeemCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100, 'Code too long')
    .transform(s => s.trim().toUpperCase()),
})

export const stripeCheckoutSchema = z.object({
  tier: z.enum(['tier1', 'tier2', 'tier3']),
})
