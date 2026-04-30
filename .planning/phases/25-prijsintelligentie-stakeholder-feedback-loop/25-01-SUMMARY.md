---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 01
subsystem: database
tags: [supabase, rls, pricing, crud, seed, vitest, typescript]

requires:
  - phase: 08-auth-supabase-migratie
    provides: Supabase schema, RLS helpers (get_user_team_id, get_user_role), auth patterns
  - phase: 10.1-data-model-refactor
    provides: Provider configs (CITO_CONFIG, DIA_CONFIG, JIJ_CONFIG, SAQI_CONFIG), PricingStrategy types
provides:
  - publication_prices, pricing_configs, price_proposals, price_audit_log Supabase tables
  - CRUD operations module (pricing-operations.ts) with 10 exported functions
  - TypeScript interfaces for all 4 pricing tables (pricing-types.ts)
  - Seed script for initial data migration from TS to DB (seed-pricing-data.ts)
  - Supabase Database type definitions for all new tables
  - Wave 0 test stubs for 10 downstream test files
affects: [25-02, 25-03, 25-04, 25-05, 25-06, 25-07, 25-08]

tech-stack:
  added: []
  patterns: [pricing-operations CRUD with audit trail, proposal workflow (open/approved/rejected), upsert-on-approve pattern]

key-files:
  created:
    - supabase/migrations/009_publication_prices.sql
    - supabase/migrations/010_pricing_configs.sql
    - supabase/migrations/011_price_proposals.sql
    - supabase/migrations/012_price_audit_log.sql
    - src/db/pricing-types.ts
    - src/db/pricing-operations.ts
    - supabase/seed-pricing-data.ts
  modified:
    - src/lib/supabase/types.ts
    - src/db/__tests__/publication-prices.test.ts

key-decisions:
  - "Pricing operations use typed AuditEntityType/AuditAction from Supabase types for strict DB typing"
  - "Seed script uses relative imports (not @/) for standalone execution via npx tsx"
  - "Proposal approval directly upserts publication_prices via onConflict (D-08 direct activation)"

patterns-established:
  - "Pricing audit trail: every write to publication_prices/pricing_configs creates price_audit_log entry"
  - "Proposal workflow: open -> approved/rejected, with RLS enforcing manager-only approval"

requirements-completed: [PI-01, PI-06]

duration: 10min
completed: 2026-03-30
---

# Phase 25 Plan 01: Data Foundation Summary

**Supabase pricing schema (4 tables with RLS), CRUD operations with audit trail, seed script, and 10 Wave 0 test stubs for downstream Nyquist compliance**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-30T20:44:05Z
- **Completed:** 2026-03-30T20:54:19Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments
- 4 Supabase migration files with tables, RLS policies, and indexes for pricing intelligence
- Complete CRUD operations module with 10 functions following established patterns
- Seed script that converts existing TS provider configs and DEFAULT_PRICES to DB records
- 10 Wave 0 test stub files (47 todo tests) enabling Nyquist compliance for all downstream plans
- Supabase Database type updated with all 4 new table definitions

## Task Commits

Each task was committed atomically:

1. **Task 0: Create Wave 0 test stubs** - `0135769` (test)
2. **Task 1: Create Supabase migration files** - `c3ed46c` (feat)
3. **Task 2: Create TypeScript types, CRUD operations, and seed script** (TDD)
   - RED: `1917df3` (test) - failing tests for 5 CRUD operations
   - GREEN: `2f216e3` (feat) - types, operations, seed script, passing tests
   - REFACTOR: `48fc305` (fix) - Supabase Database type + strict type assertions

## Files Created/Modified
- `supabase/migrations/009_publication_prices.sql` - Publication prices table with RLS
- `supabase/migrations/010_pricing_configs.sql` - Pricing config table with JSONB strategy
- `supabase/migrations/011_price_proposals.sql` - Price proposals with status workflow
- `supabase/migrations/012_price_audit_log.sql` - Audit log for all pricing changes
- `src/db/pricing-types.ts` - TypeScript interfaces for all 4 tables
- `src/db/pricing-operations.ts` - 10 CRUD functions with audit trail
- `supabase/seed-pricing-data.ts` - TS-to-DB data conversion script
- `src/lib/supabase/types.ts` - Added 4 new table types to Database interface
- `src/db/__tests__/publication-prices.test.ts` - 5 passing CRUD tests
- 9 test stub files across db, engine, features, hooks directories

## Decisions Made
- Pricing operations use typed AuditEntityType/AuditAction from Supabase types for strict DB typing
- Seed script uses relative imports (not @/) for standalone execution via npx tsx
- Proposal approval directly upserts publication_prices via onConflict (D-08 direct activation)
- getAuthHeaders function removed from pricing-operations (not yet needed, pattern documented)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pricing tables to Supabase Database type**
- **Found during:** Task 2 (build verification)
- **Issue:** npm run build failed because supabase.from() could not accept new table names without Database type definitions
- **Fix:** Added PublicationPrice, PricingConfig, PriceProposal, PriceAuditLog Row/Insert/Update types to src/lib/supabase/types.ts
- **Files modified:** src/lib/supabase/types.ts
- **Verification:** npm run build passes with zero errors
- **Committed in:** 48fc305

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for build to pass. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Seed script usage documented in file header.

## Next Phase Readiness
- All 4 pricing tables defined with RLS policies
- CRUD operations ready for downstream plans (price provider, flagging UI, review queue)
- Wave 0 test stubs available for plans 02-08
- Build and tests pass

## Self-Check: PASSED

All 17 files found. All 5 commits verified.

---
*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Completed: 2026-03-30*
