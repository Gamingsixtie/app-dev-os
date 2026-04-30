-- 013_proposal_scope.sql
-- Add scope distinction to price proposals: 'global' (new price list, affects all)
-- vs 'school' (specific discount for one school, no global price change)

ALTER TABLE price_proposals
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'school')),
  ADD COLUMN school_id UUID REFERENCES schools(id),
  ADD COLUMN school_name TEXT;

-- Index for filtering proposals by school
CREATE INDEX idx_price_proposals_school ON price_proposals(school_id) WHERE school_id IS NOT NULL;
