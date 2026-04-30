-- 012_price_audit_log.sql
-- Audit log for all pricing changes: tracks who changed what, when, and why
-- Links to proposals when changes originate from the proposal workflow

CREATE TABLE price_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('publication_price', 'pricing_config', 'price_proposal')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'seeded')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  proposal_id UUID REFERENCES price_proposals(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view audit log"
  ON price_audit_log FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can insert audit log"
  ON price_audit_log FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE INDEX idx_audit_log_entity ON price_audit_log(entity_type, entity_id);
