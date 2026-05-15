-- =============================================================================
-- 017_school_onderwijsvisie.sql — Phase 28 Plan 02 (R5 cohort-feature foundation)
-- Adds the `onderwijsvisie` cohort-feature column to the `schools` table.
--
-- Per user-confirmed decision A1 (and Phase 28 Plan 01 type-level lock):
-- onderwijsvisie is a SEPARATE column from `school_type` (Phase 27 migration
-- 015). school_type tracks the structural variant of the school (regulier /
-- dakpanklas / dalton / montessori / vrije-school / overig). onderwijsvisie
-- tracks the educational vision used for the Phase 28 win-rate cohort
-- prediction (dalton / montessori / regulier / lyceum).
--
-- Pre-flight migration-number deviation (vs. PLAN.md):
--   Plan 28-02 §pre-flight expected `016_school_onderwijsvisie.sql`. By the
--   time this plan executes, migrations 015 (Phase 27-03 sales-context) and
--   016 (Phase 27-05 current-tool-usage) are already in place. Bumped to 017.
--   Companion migration in this plan moves to 018.
--
-- Nullable TEXT + CHECK constraint:
--   - Existing schools default to NULL — UI (Plan 28-08) shows fallback text
--     and CTA "Naar schoolprofiel" so the user can fill it in.
--   - No data backfill.
--   - CHECK rejects values outside the locked 4-value enum.
--
-- No RLS change needed — schools RLS (migration 002) covers this column.
-- =============================================================================

ALTER TABLE schools
  ADD COLUMN onderwijsvisie TEXT
    CHECK (
      onderwijsvisie IS NULL
      OR onderwijsvisie IN ('dalton', 'montessori', 'regulier', 'lyceum')
    );

COMMENT ON COLUMN schools.onderwijsvisie IS
  'Phase 28 cohort feature: educational vision/profile. Separate from school_type (which tracks regulier/dakpanklas/dalton/montessori/vrije-school/overig). Onderwijsvisie groups schools for win-rate cohort prediction (deal_cohort_stats view).';
