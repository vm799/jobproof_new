-- Add missing index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Add updated_at column for audit trail
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
