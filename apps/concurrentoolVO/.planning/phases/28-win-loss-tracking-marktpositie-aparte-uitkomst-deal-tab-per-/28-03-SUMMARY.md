---
phase: 28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-
plan: 03
subsystem: cohort-ai-server-side-matview
tags: [supabase, postgres, materialized-view, trigger, security-definer, pg-cron, cohort-aggregation, refresh-concurrently, matview-rls-gap, types-handmaintained]

# Dependency graph
requires:
  - phase: 28
    plan: 02
    provides: deal_outcomes (team_id, status, school_id, reason_category) + schools.onderwijsvisie nullable enum + schools.levels TEXT[] (pre-existing)
  - phase: 28
    plan: 01
    provides: CohortStats domain type stub (winRate, topLostReason fields) + Onderwijsvisie / ReasonCategory string unions
provides:
  - migration 019_deal_cohort_stats_view.sql (matview + UNIQUE index + refresh trigger + pg_cron fallback + RPC)
  - SECURITY DEFINER refresh function `refresh_deal_cohort_stats()` (trigger) + `refresh_deal_cohort_stats_rpc()` (manual RPC for tests/ops)
  - Statement-level AFTER INSERT/UPDATE/DELETE trigger on deal_outcomes — refreshes the matview CONCURRENTLY post-write
  - Hand-maintained Supabase TS Views['deal_cohort_stats'] with Insert/Update = never (read-only enforcement at type layer)
  - mapCohortStatsRow() in src/db/types.ts — snake_case matview row → camelCase CohortStats
  - Harmonized CohortStats domain type (winRate now optional 0-100 percent, primaryLevel narrowed to SchoolLevel union, openDeals added)
affects:
  - 28-08 (CohortPredictionCard — uses mapCohortStatsRow + DB view shape via useCohortPrediction hook)
  - 28-09 (e2e cohort prediction tests — uses refresh_deal_cohort_stats_rpc() to force-refresh between INSERT and query)
  - Plan 09 e2e + ops: manual refresh path via the RPC

# Tech tracking
tech-stack:
  added: []  # No new libraries — Postgres matview + pg_cron (already in Supabase)
  patterns:
    - "PostgreSQL materialized view with UNIQUE INDEX pre-condition for `REFRESH … CONCURRENTLY` — first matview in this codebase"
    - "SECURITY DEFINER trigger function for matview-owner-only refresh privilege (Supabase issue #13779) — `SET search_path = public` defends against search-path injection"
    - "Statement-level trigger (FOR EACH STATEMENT, not FOR EACH ROW) on multi-row mutations — 1 refresh per transaction, cheaper than per-row"
    - "Defense-in-depth refresh-failure handling: trigger function catches OTHERS and RAISE WARNING (visible in Supabase logs), pg_cron nightly safety-net (T-28-14)"
    - "Graceful pg_cron unavailability: DO-block + EXCEPTION handler around `cron.schedule()` so the migration succeeds on plans without pg_cron"
    - "Matviews bypass RLS in Postgres — team-scoping is app-side via .eq('team_id', currentTeamId). The team_id column is therefore part of the cohort key, not just a filter target"
    - "Type-layer read-only enforcement on Views: Insert: never; Update: never — TypeScript surfaces accidental writes as compile errors (matview can't be written anyway)"
    - "CROSS JOIN LATERAL UNNEST(s.levels) → one cohort bin per (onderwijsvisie, level) for multi-level schools — prevents data loss on schools with levels=['vmbo-b','havo']"

key-files:
  created:
    - "apps/concurrentoolVO/supabase/migrations/019_deal_cohort_stats_view.sql (203 LOC)"
  modified:
    - "apps/concurrentoolVO/src/lib/supabase/types.ts (+27 LOC — Views block populated with deal_cohort_stats Row shape)"
    - "apps/concurrentoolVO/src/db/types.ts (+38 LOC — CohortStats import + DealCohortStatsRow alias + mapCohortStatsRow mapper)"
    - "apps/concurrentoolVO/src/features/deal-outcomes/types.ts (+15/-5 LOC — CohortStats harmonization: winRate now optional 0-100 percent, primaryLevel narrowed, openDeals added)"

key-decisions:
  - "Pre-flight migration-number deviation: PLAN.md frontmatter expected `018_deal_cohort_stats_view.sql`. Migration 018 was already taken by Phase 28 Plan 02 (deal_outcomes). The whole 28-phase migration block was bumped by +1 vs. plan-text because 016 was consumed by Phase 27-05. Bumped to 019 per the executor critical-deviation note (Rule-1, mechanical). Same drift pattern that hit Plan 28-02 — migration-number drift is the rule, not the exception, in multi-phase parallel pipelines."
  - "CohortStats harmonization vs. Plan 01: Plan 01 typed `winRate: number` with comment 'Fraction in [0, 1]'. The matview SQL multiplies `won/(won+lost) * 100` and rounds to one decimal, so DB returns 0-100 percent. Type was updated to `winRate?: number` (optional because DB returns NULL when cohort has no won/lost denominator). primaryLevel narrowed from `string` to `'vmbo-b' | 'vmbo-k' | 'vmbo-gt' | 'havo' | 'vwo'` to match the matview's UNNEST(levels) output and prevent silent string drift. `openDeals` added so the UI can show 'X open + Y decided' breakdowns."
  - "Read-only matview enforcement via TypeScript: `Insert: never; Update: never` on `Database['public']['Views']['deal_cohort_stats']`. Views are never indexed by InsertTables/UpdateTables helpers (which walk Tables only), so `never` is safe — no downstream lookup breaks. Different from Plan 28-02 deal_audit_log which used `Record<string, never>` because the audit Update IS indexed by the UpdateTables helper. Per-table choice based on helper usage."
  - "Vmbo sub-type granulariteit confirmed: cohort key uses EXACT level (vmbo-b separate from vmbo-k) — no rollup to a generic 'vmbo'. UNNEST(s.levels) produces one cohort bin per (onderwijsvisie, level), so a school with levels=['vmbo-b','havo'] contributes to TWO cohorts. Documented inline in the matview SQL comment block."
  - "Statement-level trigger (FOR EACH STATEMENT) chosen over row-level (FOR EACH ROW). Rationale: a single transaction may insert/update multiple deal_outcomes (e.g., archive + create on cycle-rollover); per-statement gives 1 refresh per transaction regardless of row count. Plan-09 e2e tests use `refresh_deal_cohort_stats_rpc()` to force-refresh between INSERT and query because the trigger fires on COMMIT, not statement-end."
  - "pg_cron graceful-skip: `cron.schedule()` wrapped in DO-block with `IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')` pre-check + EXCEPTION OTHERS handler. Trigger refresh remains primary; cron is a safety net for T-28-14 (silent trigger failure → stale predictions). Migration still succeeds on Supabase plans without pg_cron pre-installed."
  - "Refresh-failure isolation: the SECURITY DEFINER trigger function wraps `REFRESH MATERIALIZED VIEW CONCURRENTLY` in EXCEPTION WHEN OTHERS that RAISE WARNINGs and returns NULL. Critical property: a failed refresh MUST NOT roll back the original deal_outcomes write. Stale stats are acceptable; lost writes are not (T-28-14 mitigation)."

patterns-established:
  - "First materialized view in this codebase — UNIQUE INDEX pre-condition for CONCURRENTLY refresh + SECURITY DEFINER trigger function is the canonical pattern for any future matview-with-trigger"
  - "Matview RLS gap mitigation via cohort-key column + app-side filter — the parent table's team_id MUST be included in the matview's GROUP BY so Plan-08 hooks can filter. Reusable for any future team-scoped matview"
  - "Type-layer read-only matview: `Insert: never; Update: never` on Views — works because Views are never indexed by Insert/UpdateTables helpers"
  - "Defense-in-depth refresh: trigger (synchronous, post-write) + pg_cron (nightly, safety net) + RPC (manual, tests/ops) — three independent paths converge to the same matview state"

requirements-completed: [R5]

# Metrics
duration: ~4min
completed: 2026-05-15
---

# Phase 28 Plan 03: Cohort-AI Server-Side Materialized View Summary

**Phase 28 Wave 3 — Server-side cohort-statistics matview shipped: `deal_cohort_stats` aggregates `deal_outcomes` per `(team_id, onderwijsvisie, primary_level)` with vmbo sub-type granularity, refreshes CONCURRENTLY via a SECURITY DEFINER statement-trigger on every deal_outcomes write, plus a pg_cron nightly safety-net and an RPC for force-refresh in tests. TypeScript Views shape + `mapCohortStatsRow` mapper give Plan 08's useCohortPrediction hook a typed contract to read R5 stats with sub-10ms latency.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-15T10:00:52Z
- **Completed:** 2026-05-15T10:05:00Z (approx)
- **Tasks:** 2 atomic commits
- **Files created:** 1 (`019_deal_cohort_stats_view.sql`)
- **Files modified:** 3 (`src/lib/supabase/types.ts`, `src/db/types.ts`, `src/features/deal-outcomes/types.ts`)
- **LOC added:** ~283 (203 migration + 27 supabase/types.ts + 38 db/types.ts + 15 types harmonization)

## Accomplishments

- **Materialized view `deal_cohort_stats` shipped** — aggregates `deal_outcomes` (joined with `schools.onderwijsvisie` + `UNNEST(schools.levels)`) on the cohort key `(team_id, onderwijsvisie, primary_level)`. Columns: `total_deals`, `won_deals`, `lost_deals`, `open_deals`, `win_rate` (0-100 percent, one decimal, NULL when no won/lost), `top_lost_reason` (MODE() WITHIN GROUP over reason_category of lost deals, NULL when no lost or no reason recorded). NULL-onderwijsvisie and empty-levels schools are excluded per CONTEXT §D-10 fallback.
- **UNIQUE INDEX `deal_cohort_stats_pk` on (team_id, onderwijsvisie, primary_level)** — REQUIRED for `REFRESH … CONCURRENTLY`. Matches the GROUP BY tuple exactly.
- **SECURITY DEFINER refresh trigger** — `refresh_deal_cohort_stats()` runs as matview owner regardless of which authenticated role triggered the deal_outcomes write (Supabase issue #13779 mitigation). `SET search_path = public` defends against search-path injection. Statement-level trigger (`FOR EACH STATEMENT`) on `AFTER INSERT OR UPDATE OR DELETE`. EXCEPTION OTHERS handler ensures a failed refresh does NOT roll back the original write (T-28-14 mitigation).
- **pg_cron nightly fallback (03:00 UTC)** — graceful-skip when extension is missing (DO-block + EXCEPTION handler around `cron.schedule()`). Trigger refresh is primary; cron is a safety net for silent trigger failure.
- **RPC `refresh_deal_cohort_stats_rpc()`** — also SECURITY DEFINER + search_path-hardened; for Plan 09 e2e tests and ops manual refresh. GRANT EXECUTE TO authenticated.
- **Hand-maintained TS Views type** — `Database['public']['Views']['deal_cohort_stats']` with Insert/Update = never (read-only at type layer, complementing Postgres-level read-only on matviews). `primary_level` narrowed to the SchoolLevel union (`'vmbo-b' | 'vmbo-k' | 'vmbo-gt' | 'havo' | 'vwo'`).
- **`mapCohortStatsRow()` mapper in `src/db/types.ts`** — bridges snake_case matview row to camelCase CohortStats domain type. NULL → undefined at the boundary (`?? undefined`) for `winRate` and `topLostReason`.
- **CohortStats harmonized** — Plan-01 stub had `winRate: number` ("Fraction in [0, 1]") which contradicts the matview output (0-100 percent). Updated to optional `winRate?: number` (0-100 percent, one decimal) per the matview SQL. `primaryLevel` narrowed from `string` to SchoolLevel union. `openDeals` added.

## Task Commits

Each task committed atomically:

1. **Task 1: Migration 019 — cohort-stats matview + refresh trigger** — `5040db8` (feat)
2. **Task 2: Supabase Views type + mapper + CohortStats harmonization** — `0c8d0f0` (feat)

## Files Created/Modified

### Created (Task 1)

- `apps/concurrentoolVO/supabase/migrations/019_deal_cohort_stats_view.sql` — 1 matview (`deal_cohort_stats`) + 1 UNIQUE INDEX (`deal_cohort_stats_pk`) + 2 SECURITY DEFINER functions (`refresh_deal_cohort_stats` trigger function + `refresh_deal_cohort_stats_rpc` RPC) + 1 trigger (`deal_outcomes_refresh_cohort` AFTER INSERT/UPDATE/DELETE FOR EACH STATEMENT) + 1 initial REFRESH (seeds the view) + 1 GRANT SELECT TO authenticated + 1 pg_cron DO-block (graceful-skip) + 1 GRANT EXECUTE + 3 COMMENTs. 203 LOC.

### Modified (Task 2)

- `apps/concurrentoolVO/src/lib/supabase/types.ts` — Views block populated with `deal_cohort_stats` Row shape (`team_id`, `onderwijsvisie`, `primary_level` SchoolLevel-narrowed, `total_deals`, `won_deals`, `lost_deals`, `open_deals`, `win_rate: number | null`, `top_lost_reason: DealReasonCategoryDb | null`). Insert/Update intentionally `never` — matviews are read-only.
- `apps/concurrentoolVO/src/db/types.ts` — imported `CohortStats` from `@/features/deal-outcomes/types`; added `DealCohortStatsRow` type alias indexing `Database['public']['Views']`; added `mapCohortStatsRow(row)` mapper that returns the domain CohortStats with NULL → undefined boundary handling for nullable columns.
- `apps/concurrentoolVO/src/features/deal-outcomes/types.ts` — `CohortStats` interface harmonized: `winRate` now optional `number?` (0-100 percent, one decimal, undefined when no won/lost denominator), `primaryLevel` narrowed from `string` to SchoolLevel union, `openDeals: number` added, JSDoc rewritten to reflect matview output reality.

## Verification

- **Plan grep gates (019):**
  - `grep -v '^--' 019_deal_cohort_stats_view.sql | grep -c "CREATE MATERIALIZED VIEW deal_cohort_stats"` → 1 ✓ (exactly 1 required)
  - `grep -v '^--' 019_deal_cohort_stats_view.sql | grep -c "UNIQUE INDEX"` → 1 ✓ (≥1 required)
  - `grep -v '^--' 019_deal_cohort_stats_view.sql | grep -c "SECURITY DEFINER"` → 4 ✓ (≥2 required — refresh trigger function + RPC, each appears twice in declaration + comment)
  - `grep -v '^--' 019_deal_cohort_stats_view.sql | grep -c "REFRESH MATERIALIZED VIEW CONCURRENTLY"` → 3 ✓ (trigger function body + pg_cron schedule body + RPC body)
- **Plan must-haves:**
  - Materialized view `deal_cohort_stats` exists with UNIQUE index for CONCURRENTLY refresh ✓
  - Trigger on `deal_outcomes` INSERT/UPDATE/DELETE refreshes the view with SECURITY DEFINER ✓
  - pg_cron nightly fallback wrapped in DO-block with graceful-skip (`RAISE NOTICE` when extension missing) ✓
  - View groups by `(team_id, onderwijsvisie, primary_level)` with vmbo sub-type granularity (UNNEST(s.levels)) ✓
  - `src/lib/supabase/types.ts` extended with the matview Row shape ✓
- **Done criteria (Task 1):**
  - 1 CREATE MATERIALIZED VIEW ✓
  - 1 CREATE UNIQUE INDEX covering (team_id, onderwijsvisie, primary_level) ✓
  - 1 CREATE TRIGGER (deal_outcomes_refresh_cohort, FOR EACH STATEMENT) ✓
  - 2 SECURITY DEFINER functions (refresh_deal_cohort_stats + refresh_deal_cohort_stats_rpc) ✓
  - pg_cron schedule wrapped in DO-block with EXCEPTION handling ✓
  - Initial REFRESH at migration time ✓
- **Done criteria (Task 2):**
  - `Database['public']['Views']['deal_cohort_stats']` exists with correct Row shape ✓
  - `mapCohortStatsRow()` exported from `src/db/types.ts` ✓
  - `npx tsc --noEmit -p .` passes ✓ (exit 0)
- **TypeScript:** `npx tsc --noEmit -p .` → 0 errors.
- **Vitest full suite:** 1060 pass + 80 todo + 11 fail (identical to Phase 28-04 baseline — the 11 fails are the pre-existing Wave 0 RED SCAFFOLD anchors for Plans 28-05..08, expected). **No new regressions.**
- **Atomic commits:** 2 commits, one per task ✓
- **Threat-model coverage:** T-28-10 (privilege escalation — SECURITY DEFINER scopes refresh privilege to the refresh path only), T-28-12 (cross-team cohort visibility — team_id column included in matview, Plan 08 hook MUST filter), T-28-14 (silent refresh failure — trigger EXCEPTION handler + pg_cron nightly safety-net) — all mitigated. T-28-11 (DoS on refresh) and T-28-13 (small-cohort re-identification) accepted per plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Migration-number bump 018 → 019**
- **Found during:** Pre-flight per executor critical-deviation note
- **Issue:** PLAN.md frontmatter and `<files>` block specified `018_deal_cohort_stats_view.sql`. Migration 018 was already consumed by Phase 28 Plan 02 (`018_deal_outcomes.sql`). The whole 28-phase migration block had been bumped by +1 vs. plan-text because 016 was consumed by Phase 27-05.
- **Fix:** Created the migration as `019_deal_cohort_stats_view.sql`. Documented the renumber inline in the migration header (lines 18-25) AND in the commit body. This is the third migration-number bump in the Phase 27/28 wave — the pattern is now well-established as "migration-number drift is the rule, not the exception in multi-phase parallel pipelines" (per Plan 28-02 deviation #1).
- **Files modified:** Migration filename + header documentation.
- **Commit:** 5040db8

**2. [Rule 1 — Type-layer / DB-layer contract bug] CohortStats type harmonization**
- **Found during:** Task 2 type authoring — the plan explicitly invited this fix ("Verifier dat `CohortStats` type (gemaakt in Plan 01) compatibel is met deze shape. Pas Plan 01 type aan ALS er een mismatch is")
- **Issue:** Plan 01 had typed `winRate: number` (required, comment "Fraction in [0, 1]") on the CohortStats domain interface. But the Plan 03 matview SQL multiplies `won/(won+lost) * 100` and rounds to one decimal, so the DB returns 0-100 percent. Also the DB returns NULL when the cohort has only `open` / `in_negotiation` deals (NULLIF denominator protection). A required `number` would have forced consumers to either lie about the unit or crash on `null` reads. `primaryLevel: string` was too loose given the matview's UNNEST(levels) output is strictly the SchoolLevel union.
- **Fix:** `winRate` now optional (`number?`) with JSDoc clarifying "0-100 percent, one decimal, undefined when no won/lost denominator". `primaryLevel` narrowed to `'vmbo-b' | 'vmbo-k' | 'vmbo-gt' | 'havo' | 'vwo'` — same union as the matview Row type. `openDeals: number` added because the matview exposes it and downstream UX wants the "X open + Y decided" breakdown. The Plan 08 useCohortPrediction hook will branch on `winRate !== undefined` to render the "Eerste in zijn cohort" fallback.
- **Files modified:** `src/features/deal-outcomes/types.ts` (CohortStats interface + JSDoc rewrite).
- **Commit:** 0c8d0f0

**3. [Rule 2 — Auto-add missing column] `open_deals` column in matview**
- **Found during:** Task 1 SQL authoring
- **Issue:** PLAN.md §action SQL listed `open_deals = COUNT(*) FILTER (WHERE d.status IN ('open','in_negotiation'))` in the SELECT clause — the plan author clearly intended it. But the plan's Task 2 type-shape spec omitted `open_deals` from the Row interface (only `total_deals`, `won_deals`, `lost_deals`, `win_rate`, `top_lost_reason` were listed). Inconsistency between plan SQL and plan TS spec.
- **Fix:** Honored the plan SQL (open_deals included in the matview) AND extended the TS Row shape to include `open_deals: number`. Also added `openDeals` to the harmonized CohortStats domain type. The plan-08 UX will use it for "X lopend + Y beslist" breakdown text.
- **Files modified:** `019_deal_cohort_stats_view.sql` (no change vs. plan — already had it) + `src/lib/supabase/types.ts` (added open_deals to Row) + `src/features/deal-outcomes/types.ts` (added openDeals to CohortStats) + `src/db/types.ts` (mapper sets openDeals from row.open_deals).
- **Commit:** 0c8d0f0

### Auth Gates Encountered

None — no remote Supabase or auth service was touched. The migration is a filesystem artifact; the user applies it manually via `supabase db push` in the next session.

### Asked About (Rule 4)

None — all deviations fit within the plan's foundational scope. No architectural changes proposed. Renumber + type harmonization + adding a missing column to the TS shape were all explicitly invited or implied by the plan-text.

## Known Stubs

None — the migration is a complete schema artifact and the types/mappers are fully wired. The Plan 08 `useCohortPrediction` hook + `CohortPredictionCard` are deferred to a later plan (Wave 4) by design — this plan delivers only the DB layer + type layer per its frontmatter scope.

## Deferred Issues

None — Tasks 1-2 both completed without retry. TypeScript clean on first compile. Vitest baseline preserved.

## Threat Flags

None — the plan's existing `<threat_model>` §T-28-10..14 covers all 5 mitigations applied here. No new attack surface introduced beyond what the plan anticipated. T-28-10 (privilege escalation) mitigated via SECURITY DEFINER scoping. T-28-12 (cross-team cohort visibility) mitigated via team_id-in-matview + Plan 08 filter requirement (documented in migration COMMENT). T-28-14 (silent refresh failure) mitigated via trigger EXCEPTION handler + pg_cron nightly safety-net + manual RPC. T-28-11 (refresh DoS) and T-28-13 (small-cohort re-identification) explicitly accepted per plan.

## Self-Check: PASSED

- FOUND: apps/concurrentoolVO/supabase/migrations/019_deal_cohort_stats_view.sql
- FOUND: 5040db8 (Task 1 — migration 019 cohort matview + trigger)
- FOUND: 0c8d0f0 (Task 2 — supabase Views type + mapCohortStatsRow + CohortStats harmonization)
- VERIFIED: src/lib/supabase/types.ts contains `deal_cohort_stats:` under Views with full Row shape
- VERIFIED: src/db/types.ts exports `mapCohortStatsRow` with NULL → undefined boundary handling
- VERIFIED: src/features/deal-outcomes/types.ts CohortStats has `winRate?: number`, `primaryLevel: SchoolLevel union`, `openDeals: number`
- VERIFIED: TypeScript clean (`npx tsc --noEmit -p .` exit 0)
- VERIFIED: Vitest baseline preserved (1060 pass + 80 todo + 11 baseline-fail = identical to 28-04 baseline; the 11 fails are pre-existing Wave 0 RED scaffolds for Plans 05-08, expected)
- VERIFIED: All 4 plan grep gates green (1× CREATE MATERIALIZED VIEW, 1× UNIQUE INDEX, 4× SECURITY DEFINER ≥2, 3× REFRESH … CONCURRENTLY ≥2)
