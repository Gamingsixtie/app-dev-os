---
phase: 11-waarde-engine-migratie
plan: 01
subsystem: engine
tags: [migration, upsell, break-even, switching-costs, data-layer]
dependency_graph:
  requires: []
  provides: [calculateMigration-switchingCosts, calculateUpsell, SchoolRecord-switchingCosts]
  affects: [MigrationPage, store.ts, school-profile-hooks]
tech_stack:
  added: []
  patterns: [pure-function-engine, TDD-red-green-refactor, provider-mapping]
key_files:
  created:
    - src/engine/upsell.ts
    - src/engine/__tests__/upsell.test.ts
  modified:
    - src/engine/migration.ts
    - src/engine/__tests__/migration.test.ts
    - src/db/types.ts
    - src/db/operations.ts
    - src/lib/supabase/types.ts
    - src/db/migrations.ts
    - src/db/__tests__/database.test.ts
    - src/features/school-profile/__tests__/diff-view-logic.test.ts
    - src/features/school-profile/__tests__/intake-merge.test.ts
    - src/features/school-profile/__tests__/wizard-navigation.test.tsx
    - src/features/school-overview/__tests__/filter.test.ts
decisions:
  - computeBreakEvenMonth as module-private function (not exported) for clean encapsulation
  - UpsellSignalStrength limited to green/yellow (red signals excluded from results entirely)
  - overig provider excluded from upsell (no comparison data available for custom providers)
metrics:
  duration: 7m
  completed: "2026-03-22T23:59:00Z"
  tasks_completed: 2
  tasks_total: 2
  test_count: 42 (engine tests) / 1030 (full suite)
---

# Phase 11 Plan 01: Waarde Engine & Data Layer Summary

Extended migration engine with switching costs and break-even month calculation, created upsell detection engine with signal strength classification, and added switchingCosts field to the full data layer (SchoolRecord, Supabase types, mapper functions).

## One-liner

Break-even month calculation via computeBreakEvenMonth + upsell detection engine filtering competitor modules by price and differentiator signals.

## What Was Built

### Task 1: Migration Engine Extension (TDD)

**RED:** Added 7 test cases in `describe('breakEvenMonth')` block covering:
- Positive annual value with switching costs (calculates ceil month)
- Zero switching costs (immediate payback = 0)
- Zero annual value (null - never breaks even)
- Negative annual value (null - never breaks even)
- switchingCosts field in result
- multiYearProjection backward compatibility
- Default parameter backward compatibility

**GREEN:** Extended `calculateMigration` with:
- 6th parameter `switchingCosts: number = 0` (backward compatible default)
- `switchingCosts` and `breakEvenMonth` fields on `MigrationResult` interface
- Private `computeBreakEvenMonth(totalAnnualValue, switchingCosts)` function

### Task 2: Upsell Detection Engine (TDD) + Data Layer

**RED:** Created 11 test cases for `calculateUpsell` covering signal strength classification, provider exclusions, savingsPerStudent calculation.

**GREEN:** Created `src/engine/upsell.ts`:
- Filters out `geen`, `cito-oud`, `cito-nieuw`, `overig` providers
- Maps `CurrentProvider` to `ProviderKey` for price comparison lookup
- Checks Cito differentiators from `MODULE_DIFFERENTIATORS`
- Signal: `green` (cheaper + differentiators), `yellow` (one of the two), red excluded entirely
- Calculates `savingsPerStudent = competitorCost - citoCost`

**Data Layer:**
- `SchoolRecord.switchingCosts: number` added to `src/db/types.ts`
- `mapSchoolRow`: reads `switching_costs` with default 0
- `mapSchoolUpdateToSnakeCase`: maps `switchingCosts` to `switching_costs`
- Supabase types: `switching_costs` added to Row, Insert, Update
- Migration function: defaults `switchingCosts: 0` for v1 data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ModuleCategory type in upsell tests**
- **Found during:** Task 2 build verification
- **Issue:** Used `'kernvakken'` which is not a valid `ModuleCategory` (only `'leerlingvolgsysteem' | 'overige-instrumenten'`)
- **Fix:** Changed to `'leerlingvolgsysteem'` in all test mock objects
- **Files modified:** `src/engine/__tests__/upsell.test.ts`

**2. [Rule 3 - Blocking] Added switchingCosts to all SchoolRecord test mocks**
- **Found during:** Task 2 build verification
- **Issue:** Adding required `switchingCosts` field to `SchoolRecord` broke 4 existing test files that create SchoolRecord mock objects
- **Fix:** Added `switchingCosts: 0` to all affected test mocks
- **Files modified:** `src/features/school-profile/__tests__/diff-view-logic.test.ts`, `src/features/school-profile/__tests__/intake-merge.test.ts`, `src/features/school-profile/__tests__/wizard-navigation.test.tsx`, `src/features/school-overview/__tests__/filter.test.ts`, `src/db/__tests__/database.test.ts`, `src/db/migrations.ts`

**3. [Rule 1 - Bug] Fixed PriceRecord mock in upsell tests**
- **Found during:** Task 2 build verification
- **Issue:** PriceRecord requires `sourceLabel` and `isPublicationPrice` fields; test helper omitted them
- **Fix:** Added missing fields to `makePriceRecord` helper
- **Files modified:** `src/engine/__tests__/upsell.test.ts`

**4. [Rule 1 - Bug] Removed unused variable in migration test**
- **Found during:** Task 2 build verification
- **Issue:** `expensiveMigrationPrices` declared but never used (TS6133)
- **Fix:** Removed the unused declaration
- **Files modified:** `src/engine/__tests__/migration.test.ts`

## Verification

- `npx vitest run src/engine/__tests__/migration.test.ts` -- 15 tests pass
- `npx vitest run src/engine/__tests__/upsell.test.ts` -- 11 tests pass
- `npx vitest run` -- 1030 tests pass, 0 failures
- `npm run build` -- succeeds with no errors

## Known Stubs

None -- all functionality is fully wired with real data sources and computation logic.

## Self-Check: PASSED

- All 7 key files verified present on disk
- Commit 7f28e60: Task 1 (migration engine extension)
- Commit c30a9b5: Task 2 (upsell engine + data layer)
