-- Migration: Lock down RLS policies
-- The current USING (true) policies allow any client with the anon key to read/write all data.
-- Since all API routes use the service_role key (which bypasses RLS), we can replace the
-- permissive policies with deny-all policies for the anon/authenticated roles.
-- The service_role key will continue to work because it bypasses RLS entirely.

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Service role full access managers" ON managers;
DROP POLICY IF EXISTS "Service role full access jobs" ON jobs;
DROP POLICY IF EXISTS "Service role full access auth_tokens" ON auth_tokens;

-- Managers: no direct client access
-- (service_role bypasses RLS, so API routes still work)
CREATE POLICY "Deny anon access to managers"
  ON managers FOR ALL
  USING (false);

-- Jobs: no direct client access
CREATE POLICY "Deny anon access to jobs"
  ON jobs FOR ALL
  USING (false);

-- Auth tokens: no direct client access
CREATE POLICY "Deny anon access to auth_tokens"
  ON auth_tokens FOR ALL
  USING (false);
