---
phase: 28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-
plan: 02
subsystem: deal-outcomes-database-foundation
tags: [supabase, migration, rls, postgres, jsonb, xor-check, audit-log, onderwijsvisie, types-handmaintained]

# Dependency graph
requires:
  - phase: 28
    plan: 01
    provides: DealOutcome / DealDiscount / DealAuditEntry / ComparisonSnapshot TypeScript types + Zod enums (saqi as canonical 4th provider, dealCompetitorProviderEnum {dia,jij,saqi,overig}, dealDiscountProviderEnum {cito,dia,jij,saqi})
  - phase: 8
    provides: get_user_team_id() helper + team-scoped RLS pattern (migration 002)
  - phase: 7
    provides: contacts table for contact_id FK on deal_outcomes
provides:
  - migration 017_school_onderwijsvisie.sql (nullable TEXT column + CHECK enum)
  - migration 018_deal_outcomes.sql (3 tables + RLS + indices + audit-log)
  - update_updated_at_column() trigger function (one-time install, used by deal_outcomes + reusable for future tables)
  - deal_status_enum Postgres ENUM type
  - DB CHECK defense-in-depth for XOR (% xor €), discount ranges, action enum, entity_type enum, reason_category enum, competitor_provider enum
  - Hand-maintained Supabase TS types for the 3 new tables + onderwijsvisie column on schools (6 new DB-side string-union types)
  - 6 row-shape mappers (mapDealOutcomeRow, mapDealOutcomeInsert, mapDealDiscountRow, mapDealDiscountInsert, mapDealAuditRow, mapDealAuditInsert)
affects:
  - 28-03 (Dexie mirror — needs the DB shape so Dexie schema can mirror it)
  - 28-04 (price-comparison engine extension — dealDiscounts overlay)
  - 28-05 (Uitkomst/Deal tab UI — reads/writes deal_outcomes via operations layer)
  - 28-06 (DiscountEditor — writes deal_discounts via operations layer)
  - 28-07 (Dashboard hooks — read deal_outcomes rows)
  - 28-08 (CohortPredictionCard — reads onderwijsvisie + materialized view)
  - 28-09 (deal_cohort_stats materialized view — will JOIN schools.onderwijsvisie added here)

# Tech tracking
tech-stack:
  added: []  # No new libraries — Supabase + Postgres + TS
  patterns:
    - "Partial UNIQUE index pattern (WHERE status IN (...)) for one-active-per-school enforcement — first use in this codebase, replicable for any 'singleton-among-many' constraint"
    - "XOR CHECK constraint via boolean-XOR ((a IS NOT NULL) <> (b IS NOT NULL)) — defense in depth with Zod .refine()"
    - "RLS via EXISTS-subquery on parent table (deal_discounts + deal_audit_log) — when child has no team_id, scope through the FK"
    - "Append-only audit table: no UPDATE policy + Update row shape = Record<string, never> on TS side — type-level write-prevention"
    - "Hand-maintained Supabase types (no codegen pipeline in this app) — extends Database['public']['Tables'] inline; carried forward from Phase 27-02 decision"

key-files:
  created:
    - "apps/concurrentoolVO/supabase/migrations/017_school_onderwijsvisie.sql (35 LOC)"
    - "apps/concurrentoolVO/supabase/migrations/018_deal_outcomes.sql (242 LOC)"
  modified:
    - "apps/concurrentoolVO/src/lib/supabase/types.ts (+6 DB enum unions, +onderwijsvisie on schools Row/Insert/Update, +3 new tables Row/Insert/Update — ~135 LOC added)"
    - "apps/concurrentoolVO/src/db/types.ts (+6 mappers, +imports — ~120 LOC added)"

key-decisions:
  - "Pre-flight migration-number deviation: PLAN.md expected 016+017. Migrations 015 (Phase 27-03) and 016 (Phase 27-05) had already landed; bumped both files to 017 + 018. Documented inline in each migration header AND in the commit body."
  - "Provider enum deviation vs. PLAN.md interfaces block: the plan listed competitor_provider IN ('dia','jij','overig') and discount_provider as free TEXT. Phase 28 Plan 01 had ALREADY locked the 4-provider catalog (saqi included) in the Zod schemas. DB CHECK constraints were aligned with the schemas — competitor_provider IN ('dia','jij','saqi','overig') and deal_discounts.provider IN ('cito','dia','jij','saqi'). The plan's escape clause + Plan 01's deviation #1 explicitly authorized this."
  - "update_updated_at_column() trigger function did NOT exist in prior migrations (grep returned 0 matches). One-time installed at the top of migration 018 using the Phase 8 idiom. Reusable for any future table needing updated_at maintenance."
  - "deal_discounts.provider DB CHECK is narrower than the discount-side TS union (4-provider catalog only, no 'overig'). Reflected at the mapper level with `Exclude<DealCompetitorProvider, 'overig'>` on the Insert mapper — DB rejection becomes a TS compile error before the round-trip."
  - "Append-only audit log enforced both via missing UPDATE/DELETE RLS policies AND via TS type `Update: Record<string, never>`. Defense-in-depth: SQL CHECK + RLS at DB layer, exhaustive narrow at type layer."
  - "Hand-maintained types.ts continued per Phase 27-02 decision (no Supabase codegen pipeline in this app yet). Future Plan TBD can wire `supabase gen types typescript --linked` once a workflow lock prevents drift."

patterns-established:
  - "Migration pre-flight number-check: every Wave-1 plan in a multi-phase pipeline must `ls supabase/migrations/` before declaring its target number — phase-counter drift is the rule, not the exception, when phases land out of sequence"
  - "Defense-in-depth XOR: Zod .refine() at form layer + DB CHECK at storage layer. The schema layer maps the validation error to a UX path; the DB layer is the safety net"
  - "RLS via FK-EXISTS: child tables without their own team_id can be team-scoped through the FK to a team-scoped parent. Works for deal_discounts → deal_outcomes and deal_audit_log → deal_outcomes"

requirements-completed: [R1, R2, R3]

# Metrics
duration: ~6.5min
completed: 2026-05-15
---

# Phase 28 Plan 02: Deal-Outcome Database Foundation Summary

**Phase 28 Wave 1 — 2 Supabase migrations (017 + 018) and hand-maintained TS-type mirrors shipped; the 3 new tables (deal_outcomes / deal_discounts / deal_audit_log), the onderwijsvisie cohort-feature column on schools, and 6 row-shape mappers give every Wave 2+ plan a typed contract to read/write the deal lifecycle.**

## Performance

- **Duration:** ~6.5 min
- **Started:** 2026-05-15T09:40:23Z
- **Completed:** 2026-05-15T09:46:46Z
- **Tasks:** 3 atomic commits
- **Files created:** 2 (`017_school_onderwijsvisie.sql`, `018_deal_outcomes.sql`)
- **Files modified:** 2 (`src/lib/supabase/types.ts`, `src/db/types.ts`)
- **LOC added:** ~530 (~35 migration 017 + ~242 migration 018 + ~135 supabase/types.ts + ~120 db/types.ts)

## Accomplishments

- **Onderwijsvisie cohort feature locked at DB-layer** with CHECK enum constraint (`dalton/montessori/regulier/lyceum`). Nullable per Plan-08 fallback UX. Coexists with Phase 27's `school_type` (decision A1 honored — separate columns, no view-aliasing).
- **deal_outcomes lifecycle persisted** with `deal_status_enum` Postgres ENUM (`open/in_negotiation/won/lost/archived`), 4-provider competitor catalog + `'overig'` free-text, audit fields (`created_by` defaulting to `auth.uid()`, updated_at trigger), frozen `comparison_snapshot JSONB`, and 4 indices including the partial-unique 1-active-per-school enforcer.
- **deal_discounts XOR-locked** with DB CHECK `(percentage IS NOT NULL) <> (amount IS NOT NULL)` + range guards (`percentage ∈ (0, 100]`, `amount ≥ 0`) + UNIQUE per `(deal_outcome_id, module_id, provider)`. Provider catalog narrowed to 4 (no `'overig'` — reflects that we can only recompute totals for catalog providers).
- **deal_audit_log append-only** at three layers: no UPDATE/DELETE RLS policies; INSERT requires `user_id = auth.uid()`; TS `Update: Record<string, never>` makes any update call a compile error.
- **RLS team-scoped on all 3 tables** — deal_outcomes via `team_id = get_user_team_id()`; deal_discounts + deal_audit_log via EXISTS-subquery on parent `deal_outcomes.team_id`. Mitigates T-28-04, T-28-06, T-28-09 from the threat register.
- **TypeScript types regenerated by hand** — 3 new tables in `Database['public']['Tables']` + 6 new DB-side string-union types + `onderwijsvisie` on `schools.Row/Insert/Update`.
- **6 row-shape mappers in `src/db/types.ts`** (`mapDealOutcome{Row,Insert}`, `mapDealDiscount{Row,Insert}`, `mapDealAudit{Row,Insert}`) bridge snake_case DB rows ↔ camelCase domain types. Insert mappers narrow the discount provider via `Exclude<…, 'overig'>` so a DB-rejected value can't reach the wire.

## Task Commits

Each task committed atomically:

1. **Task 1: Migration 017 — schools.onderwijsvisie column** — `52dbc3a` (feat)
2. **Task 2: Migration 018 — deal_outcomes + deal_discounts + deal_audit_log tables with RLS** — `b315ceb` (feat)
3. **Task 3: Supabase types + db row-shape mappers** — `ce6852a` (feat)

## Files Created/Modified

### Created (Tasks 1 + 2)

- `apps/concurrentoolVO/supabase/migrations/017_school_onderwijsvisie.sql` — `ALTER TABLE schools ADD COLUMN onderwijsvisie TEXT` + CHECK enum (`dalton/montessori/regulier/lyceum`) + `COMMENT ON COLUMN`. 35 LOC.
- `apps/concurrentoolVO/supabase/migrations/018_deal_outcomes.sql` — 1 trigger function (`update_updated_at_column`) + 1 enum (`deal_status_enum`) + 3 tables (`deal_outcomes`, `deal_discounts`, `deal_audit_log`) + 1 trigger (`deal_outcomes_updated_at`) + 6 indices + 3 RLS-enables + 6 policies + 3 GRANTs + 3 COMMENTs. 242 LOC.

### Modified (Task 3)

- `apps/concurrentoolVO/src/lib/supabase/types.ts` — added 6 DB-side string-union enums (`DealStatusEnum`, `DealCompetitorProviderDb`, `DealDiscountProviderDb`, `DealReasonCategoryDb`, `DealAuditActionDb`, `DealAuditEntityTypeDb`, `OnderwijsvisieDb`), extended `schools.{Row,Insert,Update}` with `onderwijsvisie`, appended 3 new tables (`deal_outcomes`, `deal_discounts`, `deal_audit_log`) with full Row/Insert/Update shapes.
- `apps/concurrentoolVO/src/db/types.ts` — imported domain types from `@/features/deal-outcomes/types` and `Database` from `@/lib/supabase/types`; appended 6 mappers (`mapDealOutcomeRow`, `mapDealOutcomeInsert`, `mapDealDiscountRow`, `mapDealDiscountInsert`, `mapDealAuditRow`, `mapDealAuditInsert`).

## Verification

- **Plan grep gates (017):**
  - `grep -v '^--' 017_school_onderwijsvisie.sql | grep -c "ALTER TABLE schools"` → 1 ✓
  - CHECK constraint includes exactly the 4 locked enum values ✓
- **Plan grep gates (018):**
  - `grep -v '^--' 018_deal_outcomes.sql | grep -c "CREATE TABLE"` → 3 ✓
  - `grep -v '^--' 018_deal_outcomes.sql | grep -c "ENABLE ROW LEVEL SECURITY"` → 3 ✓
  - `grep -v '^--' 018_deal_outcomes.sql | grep -c "CREATE POLICY"` → 6 ✓ (≥6 required)
  - `grep -v '^--' 018_deal_outcomes.sql | grep -c "REFERENCES"` → 4 ✓ (≥4 required: schools, contacts, deal_outcomes x2)
- **Plan must-haves:**
  - schools.onderwijsvisie nullable + CHECK enum ✓
  - deal_outcomes with partial-unique-active index ✓
  - deal_discounts XOR CHECK ✓
  - deal_audit_log FK → deal_outcomes ON DELETE CASCADE ✓
  - RLS on all three tables, team_id scoped ✓
  - types.ts regenerated with new tables + onderwijsvisie ✓
- **TypeScript:** `npx tsc --noEmit -p .` → 0 errors.
- **Vitest full suite:** 1050 pass + 84 todo + 11 fail (identical to Plan 28-01 baseline — the 11 fails are exactly the RED Nyquist anchors for Plans 28-04..08). **No new regressions.**
- **Atomic commits:** 3 commits, one per task ✓
- **Threat-model coverage:** T-28-04 (RLS team-scope), T-28-05 (XOR CHECK), T-28-06 (no UPDATE/DELETE on audit log + Update: Record<string,never>), T-28-07 (range CHECKs), T-28-08 (partial unique index), T-28-09 (RLS via FK-EXISTS) — all mitigated at the DB layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Migration-number bump 016+017 → 017+018**
- **Found during:** Task 1 pre-flight `ls supabase/migrations/`
- **Issue:** PLAN.md §pre-flight assumed migrations 016 and 017 were free. By the time this plan executed, 015 was taken by Phase 27-03 (`015_school_sales_context.sql`) AND 016 was taken by Phase 27-05 (`016_current_tool_usage.sql`). Both lower numbers exhausted.
- **Fix:** Bumped the onderwijsvisie file to **017** and the deal-outcomes file to **018**. The plan's pre-flight clause explicitly anticipated this scenario ("Phase 27 plan 03 reserveert 015. Verwachte vrije nummer = 016. Als 015 nog vrij is, log warning en gebruik 015"). Documented inline in each migration header AND in both commit bodies.
- **Files modified:** Both migration filenames + headers.
- **Commits:** 52dbc3a + b315ceb

**2. [Rule 1 — Plan-text bug carried forward from research, already fixed in Plan 01] Provider enum mismatch**
- **Found during:** Task 2 writing CHECK constraints
- **Issue:** PLAN.md interfaces block listed `competitor_provider IN ('dia','jij','overig')` (3 values) and `deal_discounts.provider TEXT NOT NULL` (no CHECK). Plan 28-01 had ALREADY shipped a 4-provider catalog in the Zod schemas (`dealCompetitorProviderEnum = ['dia','jij','saqi','overig']`, `dealDiscountProviderEnum = ['cito','dia','jij','saqi']`) because `saqi` IS the canonical 4th provider (Plan 01 deviation #1, source `src/engine/price-comparison.ts:16` + 20+ files).
- **Fix:** DB CHECK constraints aligned with the schemas — `competitor_provider IN ('dia','jij','saqi','overig')` and `deal_discounts.provider IN ('cito','dia','jij','saqi')`. Mismatching the DB CHECK to the schema would have made `saqi` discounts and `saqi` competitor records uninsertable in production while passing client validation — a classic defense-in-depth gap.
- **Files modified:** `018_deal_outcomes.sql` CHECK constraints.
- **Commit:** b315ceb

**3. [Rule 2 — Auto-add missing critical functionality] update_updated_at_column() trigger function**
- **Found during:** Task 2 writing `CREATE TRIGGER deal_outcomes_updated_at`
- **Issue:** PLAN.md §action mentioned "if missing in target DB, add CREATE OR REPLACE FUNCTION update_updated_at_column() ... to top of migration". Grep across all 16 prior migrations returned 0 matches — the function does not exist.
- **Fix:** Added the one-time install at the top of migration 018 using the Phase 8 idiom (`CREATE OR REPLACE FUNCTION ... AS $$ ... $$`). The `CREATE OR REPLACE` keyword keeps the migration idempotent if the function is ever back-filled into an earlier migration.
- **Files modified:** `018_deal_outcomes.sql` (prepended trigger function).
- **Commit:** b315ceb

**4. [Rule 2 — Auto-add missing critical functionality] reason_category CHECK constraint**
- **Found during:** Task 2
- **Issue:** PLAN.md schema for `deal_outcomes` had `reason_category TEXT` with a partial CHECK only on `competitor_provider`. The Zod schema enforces a 4-value enum (`prijs/functionaliteit/voorkeur/anders`); without a DB CHECK an out-of-band INSERT (e.g., via SQL console or a stale client) could write garbage.
- **Fix:** Added `CHECK (reason_category IS NULL OR reason_category IN ('prijs','functionaliteit','voorkeur','anders'))` to `deal_outcomes` and a parallel CHECK on `deal_audit_log.action` + `deal_audit_log.entity_type` for the same defense-in-depth reason.
- **Files modified:** `018_deal_outcomes.sql` CHECK constraints.
- **Commit:** b315ceb

**5. [Rule 2 — Auto-add missing critical functionality] WITH CHECK on deal_discounts ALL policy**
- **Found during:** Task 2 RLS authoring
- **Issue:** PLAN.md showed `CREATE POLICY deal_discounts_team_all ON deal_discounts FOR ALL TO authenticated USING (...)` without a `WITH CHECK` clause. Postgres-RLS treats `FOR ALL` with only USING as covering SELECT/UPDATE/DELETE filtering AND INSERT — but INSERT actually needs WITH CHECK; without it Postgres falls back to permissive default. This would have allowed cross-team discount inserts (T-28-09 surface).
- **Fix:** Added explicit `WITH CHECK (EXISTS …)` mirroring the USING clause so INSERT and UPDATE both verify the parent team_id.
- **Files modified:** `018_deal_outcomes.sql` (RLS policy).
- **Commit:** b315ceb

**6. [Rule 1 — Naming collision in RLS subquery] Alias `do` → `do_parent`**
- **Found during:** Task 2 (SQL author-time mental review)
- **Issue:** Plan listed `EXISTS (SELECT 1 FROM deal_outcomes do WHERE do.id = …)`. `do` is a reserved keyword/identifier in some Postgres contexts (PL/pgSQL DO blocks) and the unquoted lowercase identifier is allowed but flagged by linters. Used `do_parent` for clarity.
- **Fix:** Aliased to `do_parent` in all 3 RLS policies that use the EXISTS-subquery pattern.
- **Files modified:** `018_deal_outcomes.sql` (3 policies).
- **Commit:** b315ceb

**7. [Rule 1 — Append-only enforcement at type layer] deal_audit_log Update shape**
- **Found during:** Task 3 supabase/types.ts authoring
- **Issue:** PLAN.md suggested `Update: never` for the audit-log Insert shape — but `Database['public']['Tables'][_]['Update']` is indexed elsewhere in the codebase (via `UpdateTables<>` helper); a literal `never` causes downstream type lookups to fail. The DB-side enforcement (no UPDATE/DELETE policy) is the actual security gate.
- **Fix:** Used `Update: Record<string, never>` — type-level write-prevention (no writable keys) while keeping the index shape valid. Documented as "Append-only — runtime RLS denies the write" in a JSDoc comment.
- **Files modified:** `src/lib/supabase/types.ts`.
- **Commit:** ce6852a

### Auth Gates Encountered

None — no remote Supabase or auth service was touched. The migrations are file-system artifacts; the user applies them manually via `supabase db push` in the next session.

### Asked About (Rule 4)

None — all deviations fit within the plan's foundational scope. No architectural changes proposed.

## Known Stubs

None — the migrations are complete schema definitions and the types/mappers are full. The materialized view `deal_cohort_stats` referenced in Phase 28 §D-09 is **intentionally deferred** to a later plan (likely 28-07 or 28-09) per the plan's frontmatter — this plan provides the underlying tables that the view will aggregate over.

## Deferred Issues

None — Tasks 1-3 all completed within the 3-attempt auto-fix limit (each task needed at most 1 author-time correction; no retries).

## Threat Flags

None — the plan's existing threat_model §T-28-04..09 covers all 7 mitigations applied here. No new attack surface introduced beyond what the plan anticipated.

## Self-Check: PASSED

- FOUND: apps/concurrentoolVO/supabase/migrations/017_school_onderwijsvisie.sql
- FOUND: apps/concurrentoolVO/supabase/migrations/018_deal_outcomes.sql
- FOUND: 52dbc3a (Task 1 — migration 017 onderwijsvisie)
- FOUND: b315ceb (Task 2 — migration 018 deal_outcomes + RLS)
- FOUND: ce6852a (Task 3 — supabase types + mappers)
- VERIFIED: src/lib/supabase/types.ts contains `deal_outcomes:`, `deal_discounts:`, `deal_audit_log:`, `onderwijsvisie:` strings
- VERIFIED: src/db/types.ts exports `mapDealOutcomeRow`, `mapDealOutcomeInsert`, `mapDealDiscountRow`, `mapDealDiscountInsert`, `mapDealAuditRow`, `mapDealAuditInsert`
- VERIFIED: TypeScript clean (`npx tsc --noEmit -p .` exit 0)
- VERIFIED: Vitest baseline unchanged (1050 pass + 84 todo + 11 fail = exactly the 11 RED Nyquist anchors from Plan 28-01, no regressions)
