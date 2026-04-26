import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  W3W_API_KEY: z.string().min(1).optional(),
  MAILCHIMP_API_KEY: z.string().min(1).optional(),
  MAILCHIMP_AUDIENCE_ID: z.string().min(1).optional(),
  MAILCHIMP_SERVER_PREFIX: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_ID_TIER1: z.string().min(1).optional(),
  STRIPE_PRICE_ID_TIER2: z.string().min(1).optional(),
  STRIPE_PRICE_ID_TIER3: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env)
  }
  return _env
}
