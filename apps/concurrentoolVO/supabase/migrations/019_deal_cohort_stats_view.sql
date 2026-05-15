-- =============================================================================
-- 019_deal_cohort_stats_view.sql — Phase 28 Plan 03 (R5 — cohort-AI matview)
--
-- Server-side pre-aggregation for R5 (cohort-AI win-kans-voorspelling).
-- Aggregates `deal_outcomes` (joined with `schools` for `onderwijsvisie` +
-- per-level `UNNEST(levels)`) into a cohort key (`team_id`, `onderwijsvisie`,
-- `primary_level`). Refresh path:
--   1) AFTER INSERT/UPDATE/DELETE statement-trigger on `deal_outcomes` (primary,
--      synchronous, SECURITY DEFINER → matview-owner refresh privilege).
--   2) Nightly pg_cron fallback `03:00 UTC` — graceful-skip when pg_cron is not
--      installed (raise NOTICE, continue).
-- RLS does NOT apply to materialized views in Postgres — team-scoping happens
-- app-side via `.eq('team_id', currentTeamId)` in the Plan 08 hook. The
-- `team_id` column is therefore an integral part of the cohort key, not just
-- a filter target.
--
-- Pre-flight migration-number deviation (vs. PLAN.md):
--   Plan 28-03 §frontmatter expected `018_deal_cohort_stats_view.sql`.
--   Migration 018 is already taken by Phase 28 Plan 02 (deal_outcomes + RLS).
--   The whole 28-phase migration block was bumped by +1 because 016 was
--   already consumed by Phase 27-05. Bumped to 019. This is a Rule-1
--   (mechanical / auto-fix) deviation per the executor preamble.
--
-- Critical pitfalls (from RESEARCH §Pattern 2 / Pitfalls 3-4):
--   - UNIQUE INDEX is REQUIRED for `REFRESH … CONCURRENTLY` — without it the
--     refresh errors out on the first write (Postgres docs § matview-refresh).
--   - The refresh trigger function MUST run with `SECURITY DEFINER` so the
--     refresh inherits the matview-owner privilege regardless of which role
--     called the deal_outcomes write (Supabase issue #13779).
--   - Materialized views do NOT honour RLS — `GRANT SELECT TO authenticated`
--     hands every team's rows to every authed user unless the app filters by
--     `team_id`. Plan 08's hook must always include `.eq('team_id', …)`.
--   - vmbo sub-type granulariteit per user-confirmed decision: cohort key uses
--     the EXACT level (`vmbo-b` separate from `vmbo-k`). No rollup to "vmbo".
--
-- Sources of truth carried forward:
--   - Phase 28 Plan 02 (018) `deal_outcomes.team_id` / `status` / `school_id`
--   - Phase 28 Plan 02 (017) `schools.onderwijsvisie` (nullable, CHECK enum)
--   - Pre-existing `schools.levels TEXT[]` populated in Phase 6+ wizard
-- =============================================================================

-- =============================================================================
-- 1. Materialized view — deal_cohort_stats
--
-- Design notes:
--   - CROSS JOIN LATERAL UNNEST(s.levels) → one row per (onderwijsvisie, level)
--     for multi-level schools (e.g. levels=['vmbo-b','havo'] → 2 cohort bins).
--     Prevents data loss on multi-level schools (RESEARCH §Pattern 2).
--   - NULL-onderwijsvisie skip → schools without onderwijsvisie don't count
--     (CONTEXT D-10 fallback: "Onvoldoende schoolgegevens voor voorspelling").
--   - Empty-levels skip → schools with `levels = '{}'` skipped (no cohort).
--   - `archived` status excluded → archived deals are historical noise.
--   - MODE() WITHIN GROUP → most-common reason_category in the lost-deals
--     subset (Postgres-specific aggregate, perfect for top_lost_reason).
--   - NULLIF on denominator → defends against division-by-zero when a cohort
--     has only `open` / `in_negotiation` deals.
--   - win_rate ROUND(..., 1) * 100 → returns 0-100 percent with one decimal
--     (matches UI badge "X%" format directly).
-- =============================================================================
CREATE MATERIALIZED VIEW deal_cohort_stats AS
SELECT
  d.team_id,
  s.onderwijsvisie,
  level_unnest AS primary_level,
  COUNT(d.id) AS total_deals,
  COUNT(*) FILTER (WHERE d.status = 'won') AS won_deals,
  COUNT(*) FILTER (WHERE d.status = 'lost') AS lost_deals,
  COUNT(*) FILTER (WHERE d.status IN ('open', 'in_negotiation')) AS open_deals,
  CASE
    WHEN COUNT(*) FILTER (WHERE d.status IN ('won', 'lost')) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE d.status = 'won')::numeric /
      NULLIF(COUNT(*) FILTER (WHERE d.status IN ('won', 'lost')), 0)::numeric
      * 100,
      1
    )
    ELSE NULL
  END AS win_rate,
  MODE() WITHIN GROUP (ORDER BY d.reason_category)
    FILTER (WHERE d.status = 'lost' AND d.reason_category IS NOT NULL)
    AS top_lost_reason
FROM deal_outcomes d
JOIN schools s ON s.id = d.school_id
CROSS JOIN LATERAL UNNEST(s.levels) AS level_unnest
WHERE s.onderwijsvisie IS NOT NULL
  AND array_length(s.levels, 1) > 0
  AND d.status != 'archived'
GROUP BY d.team_id, s.onderwijsvisie, level_unnest;

-- =============================================================================
-- 2. UNIQUE INDEX — required for `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
--    The cohort key is exactly the GROUP BY tuple — one row per
--    (team_id, onderwijsvisie, primary_level).
-- =============================================================================
CREATE UNIQUE INDEX deal_cohort_stats_pk
  ON deal_cohort_stats (team_id, onderwijsvisie, primary_level);

-- =============================================================================
-- 3. Refresh trigger function — SECURITY DEFINER per RESEARCH Pitfall 3
--    (matview-owner-only refresh privilege; trigger runs as the table mutator
--    but needs the owner's privilege to refresh).
--    `SET search_path = public` defends against search-path injection
--    (Supabase RPC-hardening guidance).
--    Exception handler ensures a refresh failure does NOT roll back the
--    original deal_outcomes write — stale stats are acceptable, lost writes
--    are not (T-28-14 mitigation).
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_deal_cohort_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CONCURRENTLY allows concurrent SELECTs during the refresh.
  REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats;
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the original write if the refresh trips — log via WARNING
    -- (visible in Supabase log explorer). The nightly pg_cron fallback (§7)
    -- will reconverge stats by morning.
    RAISE WARNING 'deal_cohort_stats refresh failed: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- =============================================================================
-- 4. Statement-level trigger on deal_outcomes mutations.
--    FOR EACH STATEMENT (not FOR EACH ROW) = 1 refresh per transaction,
--    regardless of how many rows the transaction touches (RESEARCH note:
--    cheaper, and a matview refresh is whole-set anyway).
-- =============================================================================
CREATE TRIGGER deal_outcomes_refresh_cohort
  AFTER INSERT OR UPDATE OR DELETE ON deal_outcomes
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_deal_cohort_stats();

-- =============================================================================
-- 5. Initial population — matview starts empty after CREATE. Refresh once
--    NOT-CONCURRENTLY (it has no rows yet, so the CONCURRENTLY pre-condition
--    of "at least one row" is moot, and the non-CONCURRENT path is simpler).
-- =============================================================================
REFRESH MATERIALIZED VIEW deal_cohort_stats;

-- =============================================================================
-- 6. Grants — authenticated role can SELECT. RLS does NOT apply to matviews
--    (Postgres limitation, ack'd by Supabase) — team-scoping is app-side via
--    `.eq('team_id', currentTeamId)` filter in the Plan 08 hook. The matview
--    intentionally exposes `team_id` so the hook can filter.
-- =============================================================================
GRANT SELECT ON deal_cohort_stats TO authenticated;

-- =============================================================================
-- 7. pg_cron nightly fallback — graceful-skip when extension is missing.
--    Wrapped in a DO-block with EXCEPTION handling so the migration succeeds
--    even on Supabase plans that don't ship pg_cron pre-installed.
--    Trigger-based refresh (§4) is the primary path; cron is a safety net
--    that converges stats after any silent trigger failure (T-28-14).
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'deal-cohort-stats-nightly',
      '0 3 * * *',  -- 03:00 UTC daily — off-peak for EU customers
      $cron$ REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed — skipping nightly cohort refresh schedule. Trigger-based refresh remains primary.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the migration if cron.schedule() itself errors (e.g.,
    -- permissions, duplicate job name on re-run). Trigger refresh is enough.
    RAISE NOTICE 'Failed to schedule pg_cron job (%) — trigger-based refresh remains primary', SQLERRM;
END $$;

-- =============================================================================
-- 8. RPC for tests to force-refresh — used by Plan 09 e2e tests.
--    Same SECURITY DEFINER + search_path hardening as the trigger function.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.refresh_deal_cohort_stats_rpc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY deal_cohort_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_deal_cohort_stats_rpc() TO authenticated;

COMMENT ON MATERIALIZED VIEW deal_cohort_stats IS
  'Phase 28 R5: pre-aggregated win-rate per cohort = (team_id, onderwijsvisie, primary_level). Refresh via trigger on deal_outcomes mutations + nightly pg_cron fallback. RLS handled app-side via team_id filter (matviews do not support RLS).';

COMMENT ON FUNCTION refresh_deal_cohort_stats() IS
  'Phase 28 R5: SECURITY DEFINER refresh function — runs as matview owner regardless of which role triggered the deal_outcomes write. Exception handler ensures failed refresh does not roll back the original write (stale stats acceptable, lost writes not).';

COMMENT ON FUNCTION public.refresh_deal_cohort_stats_rpc() IS
  'Phase 28 R5: manual-refresh RPC for tests (Plan 09 e2e) and ops. Same SECURITY DEFINER guarantees as the trigger function.';
