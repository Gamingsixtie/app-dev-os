-- 009_publication_prices.sql
-- Publication prices table: team-wide pricing data per module per provider
-- Source of truth for pricing intelligence (replaces TS-based DEFAULT_PRICES at runtime)

CREATE TABLE publication_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  amount_per_student NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'manual', 'proposal', 'ai-lookup')),
  source_label TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, module_id, provider)
);

ALTER TABLE publication_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view publication prices"
  ON publication_prices FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can insert publication prices"
  ON publication_prices FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE POLICY "Managers can update publication prices"
  ON publication_prices FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');
