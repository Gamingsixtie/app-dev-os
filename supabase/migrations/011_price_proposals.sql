-- 011_price_proposals.sql
-- Price proposals: team members can flag incorrect prices and propose corrections
-- Managers approve or reject; approved proposals update publication_prices directly (D-08)

CREATE TABLE price_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  module_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  current_price NUMERIC NOT NULL,
  proposed_price NUMERIC NOT NULL,
  source TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence_path TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view proposals"
  ON price_proposals FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can create proposals"
  ON price_proposals FOR INSERT
  WITH CHECK (team_id = get_user_team_id() AND submitted_by = auth.uid());

CREATE POLICY "Managers can update proposals"
  ON price_proposals FOR UPDATE
  USING (team_id = get_user_team_id() AND get_user_role() = 'manager');

CREATE INDEX idx_price_proposals_status ON price_proposals(team_id, status);
