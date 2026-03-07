-- Managers table
CREATE TABLE managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days')
);

-- Auth tokens for magic link login
CREATE TABLE auth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '15 minutes'),
  used BOOLEAN DEFAULT false
);

-- Jobs table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES managers(id) NOT NULL,

  -- Job details (manager sets these)
  title TEXT NOT NULL,
  address TEXT,
  instructions TEXT,
  crew_name TEXT,
  crew_email TEXT,

  -- Status tracking
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created',
    'sent',
    'accepted',
    'in_progress',
    'submitted',
    'completed'
  )),

  -- Crew access token (link-based, no auth needed)
  crew_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Evidence (crew fills these)
  before_photo_url TEXT,
  after_photo_url TEXT,
  latitude FLOAT,
  longitude FLOAT,
  w3w TEXT,
  notes TEXT,
  signature_url TEXT,
  seal TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_jobs_manager_id ON jobs(manager_id);
CREATE INDEX idx_jobs_crew_token ON jobs(crew_token);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);

-- Enable Row Level Security
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role bypasses these)
-- For now, all access goes through service role key in API routes
-- so we create permissive policies for the service role
CREATE POLICY "Service role full access managers" ON managers FOR ALL USING (true);
CREATE POLICY "Service role full access jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Service role full access auth_tokens" ON auth_tokens FOR ALL USING (true);
