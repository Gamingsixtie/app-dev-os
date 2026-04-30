-- =============================================================================
-- Planned Touchpoints — contactmoment-planning per schooljaar
-- =============================================================================

CREATE TABLE planned_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  school_year_start INTEGER NOT NULL,        -- e.g. 2025 for schooljaar 2025-2026
  month_index INTEGER NOT NULL CHECK (month_index BETWEEN 0 AND 11), -- 0=Sep, 11=Aug
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped')),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_planned_touchpoints_school ON planned_touchpoints(school_id);
CREATE INDEX idx_planned_touchpoints_contact ON planned_touchpoints(contact_id);
CREATE INDEX idx_planned_touchpoints_year ON planned_touchpoints(school_id, school_year_start);

-- RLS
ALTER TABLE planned_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view planned touchpoints"
  ON planned_touchpoints FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "Account managers can create planned touchpoints"
  ON planned_touchpoints FOR INSERT
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can update planned touchpoints"
  ON planned_touchpoints FOR UPDATE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );

CREATE POLICY "Account managers can delete planned touchpoints"
  ON planned_touchpoints FOR DELETE
  USING (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );
