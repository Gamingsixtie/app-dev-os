-- =============================================================================
-- 014_stichtingen.sql — Phase 27 Plan 02 (R1)
-- Stichting (bestuur) as a first-class entity. Single nullable FK on schools.
-- Strict scope: ONLY the Stichting table + the stichting_id link. The other
-- school columns (customer_type / school_type / current_tool_usage / ...)
-- belong to Plans 27-03 / 27-05 / 27-08 / 27-09 and are deliberately left out.
-- =============================================================================

-- =============================================================================
-- 1. Stichtingen table
-- =============================================================================
CREATE TABLE stichtingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Schools FK column (cascade-guard handled in application layer per D-04)
-- =============================================================================
ALTER TABLE schools
  ADD COLUMN stichting_id UUID REFERENCES stichtingen(id) ON DELETE SET NULL;

-- =============================================================================
-- 3. Indexes
-- =============================================================================
CREATE INDEX idx_stichtingen_team_id ON stichtingen(team_id);
CREATE INDEX idx_schools_stichting_id ON schools(stichting_id) WHERE stichting_id IS NOT NULL;

-- =============================================================================
-- 4. RLS — team-scoped, identical pattern to 002_rls_policies.sql
-- =============================================================================
ALTER TABLE stichtingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view stichtingen"
  ON stichtingen FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team members can create stichtingen"
  ON stichtingen FOR INSERT
  WITH CHECK (team_id = get_user_team_id());

CREATE POLICY "Team members can update stichtingen"
  ON stichtingen FOR UPDATE
  USING (team_id = get_user_team_id())
  WITH CHECK (team_id = get_user_team_id());

CREATE POLICY "Team members can delete stichtingen"
  ON stichtingen FOR DELETE
  USING (team_id = get_user_team_id());

-- =============================================================================
-- 5. updated_at trigger — reuse existing trigger_set_updated_at() from 001
-- =============================================================================
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stichtingen
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
