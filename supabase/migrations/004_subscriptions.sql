-- Active subscription per manager (Stripe or AppSumo)
-- One row = paid. No row = trial or expired.
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES managers(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('tier1','tier2','tier3')),
  source text NOT NULL CHECK (source IN ('stripe','appsumo')),
  appsumo_code text,
  stripe_session_id text,
  activated_at timestamptz DEFAULT now(),
  UNIQUE(manager_id)
);

CREATE INDEX idx_subscriptions_manager_id ON subscriptions(manager_id);

-- AppSumo deal codes inventory + redemption log
CREATE TABLE appsumo_codes (
  code text PRIMARY KEY,
  tier text NOT NULL CHECK (tier IN ('tier1','tier2','tier3')),
  redeemed_by uuid REFERENCES managers(id),
  redeemed_at timestamptz
);

-- Code stacking: one tier per manager. Two tier1 codes = blocked.
-- Two different tiers = allowed (upgrade path).
CREATE UNIQUE INDEX idx_appsumo_codes_manager_tier
  ON appsumo_codes(redeemed_by, tier)
  WHERE redeemed_by IS NOT NULL;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appsumo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to subscriptions"
  ON subscriptions FOR ALL USING (false);
CREATE POLICY "Deny anon access to appsumo_codes"
  ON appsumo_codes FOR ALL USING (false);
