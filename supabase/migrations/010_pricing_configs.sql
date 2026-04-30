-- 010_pricing_configs.sql
-- Pricing configuration per provider: stores full PricingStrategy as JSONB
-- Versioned for audit trail, unique active config per provider per team

CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  config_type TEXT NOT NULL CHECK (config_type IN ('platform+module', 'package-bundle', 'tiered-license', 'flat')),
  config_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

-- Only one active config per provider per team
CREATE UNIQUE INDEX pricing_configs_active_provider ON pricing_configs (team_id, provider) WHERE (is_active = true);

CREATE POLICY "Team members can view pricing configs"
  ON pricing_configs FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Managers can insert pricing configs"
  ON pricing_configs FOR INSERT
  WITH CHECK (team_id = get_user_team_id() AND get_user_role() = 'manager');

CREATE POLICY "Managers can update pricing configs"
  ON pricing_configs FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');
