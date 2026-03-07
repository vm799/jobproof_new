import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

// Browser client (lazy initialization)
let _supabase: SupabaseClient | null = null
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _supabase
}

// Server client (used in API routes that need admin access)
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return createClient(getSupabaseUrl(), serviceKey)
}
