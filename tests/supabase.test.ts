import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() })

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

describe('getServiceClient', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is not set', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { getServiceClient } = await import('@/lib/supabase')
    expect(() => getServiceClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY not set')
  })

  it('returns a client when SUPABASE_SERVICE_ROLE_KEY is set', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    const { getServiceClient } = await import('@/lib/supabase')
    const client = getServiceClient()
    expect(client).toBeDefined()
    expect(mockCreateClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-service-key')
  })
})
