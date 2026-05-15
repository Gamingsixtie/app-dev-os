-- =============================================================================
-- 018_deal_outcomes.sql — Phase 28 Plan 02 (R1 / R3 — DB foundation)
-- Three tables for the per-school deal-outcome lifecycle + per-deal discounts
-- + append-only audit log. RLS team-scoped per Phase 8 pattern.
--
-- Pre-flight migration-number deviation (vs. PLAN.md):
--   Plan 28-02 §pre-flight expected `017_deal_outcomes.sql`. By the time this
--   plan executes, migrations 015 (Phase 27-03 sales-context), 016 (Phase
--   27-05 current-tool-usage) and 017 (Phase 28-02 onderwijsvisie column,
--   companion to this file) are in place. Bumped to 018.
--
-- Provider enum deviation (vs. PLAN.md):
--   PLAN.md interfaces block listed competitor_provider IN ('dia','jij','overig')
--   and deal_discounts.provider as free TEXT. Phase 28 Plan 01 ALREADY shipped
--   a 4-provider catalog ('cito'/'dia'/'jij'/'saqi') in the Zod schemas (see
--   28-01-SUMMARY.md deviation 1). DB CHECK constraints must mirror the schemas
--   for defense-in-depth, so:
--     competitor_provider IN ('dia','jij','saqi','overig')   [4 + free-text]
--     deal_discounts.provider IN ('cito','dia','jij','saqi') [4 catalog only,
--                                                              no 'overig'
--                                                              because we can
--                                                              only recompute
--                                                              for catalog
--                                                              providers]
--
-- Sources of truth carried forward:
--   - get_user_team_id() helper from 002_rls_policies.sql
--   - team-scoped RLS pattern from 011_price_proposals.sql + 012_price_audit_log.sql
--   - TIMESTAMPTZ + JSONB conventions throughout
-- =============================================================================

-- =============================================================================
-- Pre-req: updated_at trigger function (one-time install — no prior migration
-- created this helper). Standard Phase 8 idiom.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- Enum type — deal lifecycle status (D-01)
-- =============================================================================
CREATE TYPE deal_status_enum AS ENUM (
  'open',
  'in_negotiation',
  'won',
  'lost',
  'archived'
);

-- =============================================================================
-- 1. deal_outcomes — per-school deal lifecycle (D-01 + D-02)
-- =============================================================================
CREATE TABLE deal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  status deal_status_enum NOT NULL DEFAULT 'open',
  -- Competitor catalog: 4 providers + 'overig' free-text (matches
  -- dealCompetitorProviderEnum in deal-outcome.schema.ts).
  competitor_provider TEXT NOT NULL CHECK (
    competitor_provider IN ('dia', 'jij', 'saqi', 'overig')
  ),
  competitor_name TEXT,
  reason TEXT,
  reason_category TEXT CHECK (
    reason_category IS NULL
    OR reason_category IN ('prijs', 'functionaliteit', 'voorkeur', 'anders')
  ),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  comparison_snapshot JSONB NOT NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  updated_by UUID
);

-- One active deal per school (D-01 + T-28-08 mitigation)
CREATE UNIQUE INDEX one_active_per_school
  ON deal_outcomes(school_id)
  WHERE status IN ('open', 'in_negotiation');

CREATE INDEX idx_deal_outcomes_school_id ON deal_outcomes(school_id);
CREATE INDEX idx_deal_outcomes_team_id_status ON deal_outcomes(team_id, status);
CREATE INDEX idx_deal_outcomes_decided_at
  ON deal_outcomes(decided_at)
  WHERE decided_at IS NOT NULL;

CREATE TRIGGER deal_outcomes_updated_at
  BEFORE UPDATE ON deal_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE deal_outcomes IS
  'Phase 28: per-school deal-outcome lifecycle (open/in_negotiation/won/lost/archived) with frozen comparison snapshot.';

-- =============================================================================
-- 2. deal_discounts — per-(deal, module, provider) discounts (D-04)
-- XOR: exactly one of discount_percentage / discount_amount must be set.
-- =============================================================================
CREATE TABLE deal_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_outcome_id UUID NOT NULL REFERENCES deal_outcomes(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  -- 4-provider catalog only (matches dealDiscountProviderEnum). 'overig' is
  -- intentionally NOT allowed: we can only recompute totals for catalog
  -- providers.
  provider TEXT NOT NULL CHECK (provider IN ('cito', 'dia', 'jij', 'saqi')),
  discount_percentage NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- XOR (T-28-05 mitigation)
  CONSTRAINT deal_discounts_xor
    CHECK ((discount_percentage IS NOT NULL) <> (discount_amount IS NOT NULL)),
  -- Range guards (T-28-07 mitigation)
  CONSTRAINT deal_discounts_percentage_range
    CHECK (
      discount_percentage IS NULL
      OR (discount_percentage > 0 AND discount_percentage <= 100)
    ),
  CONSTRAINT deal_discounts_amount_nonnegative
    CHECK (discount_amount IS NULL OR discount_amount >= 0)
);

CREATE UNIQUE INDEX one_discount_per_module_provider
  ON deal_discounts(deal_outcome_id, module_id, provider);

COMMENT ON TABLE deal_discounts IS
  'Phase 28: per-deal per-(module,provider) discounts (% XOR €) — recalculates the comparison for this deal only.';

-- =============================================================================
-- 3. deal_audit_log — append-only audit trail (D-03)
-- =============================================================================
CREATE TABLE deal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_outcome_id UUID NOT NULL REFERENCES deal_outcomes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  action TEXT NOT NULL CHECK (
    action IN (
      'outcome_created',
      'outcome_updated',
      'status_changed',
      'discount_added',
      'discount_updated',
      'discount_deleted'
    )
  ),
  entity_type TEXT CHECK (
    entity_type IS NULL
    OR entity_type IN ('deal_outcome', 'deal_discount')
  ),
  entity_id UUID,
  before_value JSONB,
  after_value JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_deal_outcome_id ON deal_audit_log(deal_outcome_id);
CREATE INDEX idx_audit_log_timestamp ON deal_audit_log(timestamp DESC);

COMMENT ON TABLE deal_audit_log IS
  'Phase 28: append-only audit trail for deal_outcomes + deal_discounts mutations (user_id, timestamp, before/after).';

-- =============================================================================
-- 4. RLS — team-scoped on all three tables (T-28-04 / T-28-06 / T-28-09)
-- =============================================================================
ALTER TABLE deal_outcomes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_audit_log ENABLE ROW LEVEL SECURITY;

-- deal_outcomes: full CRUD within team. No DELETE policy on purpose — deals
-- archive via status='archived', never delete (audit integrity).
CREATE POLICY deal_outcomes_team_select ON deal_outcomes
  FOR SELECT TO authenticated
  USING (team_id = get_user_team_id());

CREATE POLICY deal_outcomes_team_insert ON deal_outcomes
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = get_user_team_id()
    AND created_by = auth.uid()
  );

CREATE POLICY deal_outcomes_team_update ON deal_outcomes
  FOR UPDATE TO authenticated
  USING (team_id = get_user_team_id())
  WITH CHECK (team_id = get_user_team_id());

-- deal_discounts: inherit team-scope via FK to deal_outcomes (T-28-09).
CREATE POLICY deal_discounts_team_all ON deal_discounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deal_outcomes do_parent
      WHERE do_parent.id = deal_discounts.deal_outcome_id
        AND do_parent.team_id = get_user_team_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deal_outcomes do_parent
      WHERE do_parent.id = deal_discounts.deal_outcome_id
        AND do_parent.team_id = get_user_team_id()
    )
  );

-- deal_audit_log: read-only for team members, INSERT only by self.
-- No UPDATE/DELETE policy — append-only (T-28-06 mitigation).
CREATE POLICY deal_audit_log_team_select ON deal_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deal_outcomes do_parent
      WHERE do_parent.id = deal_audit_log.deal_outcome_id
        AND do_parent.team_id = get_user_team_id()
    )
  );

CREATE POLICY deal_audit_log_self_insert ON deal_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deal_outcomes do_parent
      WHERE do_parent.id = deal_audit_log.deal_outcome_id
        AND do_parent.team_id = get_user_team_id()
    )
  );

-- =============================================================================
-- 5. Grants — authenticated role
-- =============================================================================
GRANT SELECT, INSERT, UPDATE         ON deal_outcomes  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deal_discounts TO authenticated;
GRANT SELECT, INSERT                 ON deal_audit_log TO authenticated;
