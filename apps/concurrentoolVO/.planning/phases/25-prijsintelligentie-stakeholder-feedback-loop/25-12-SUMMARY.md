---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 12
subsystem: testing
tags: [vitest, zustand, offline-fallback, pricing-data-store, tdd]

# Dependency graph
requires:
  - phase: 25-09
    provides: "Fixed pricing data store 3-layer fallback (Supabase -> cache -> static TS)"
provides:
  - "9 real test implementations covering offline pricing fallback and async price provider behavior"
  - "Test coverage for pricing data store's loadFromSupabase, isOffline flag, getStalePrices"
affects: [pricing-intelligence, test-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns: ["vi.mock for Supabase DB operations in store tests", "usePricingDataStore.setState for test setup", "usePricingDataStore.getState() for assertion reads"]

key-files:
  created: []
  modified:
    - "src/hooks/__tests__/offline-pricing.test.ts"
    - "src/engine/__tests__/price-provider.test.ts"

key-decisions:
  - "Allow amountPerStudent >= 0 in shape test (some providers have zero-price modules)"

patterns-established:
  - "Zustand store testing: setState for setup, getState() for assertions, vi.mock for DB layer"

requirements-completed: [PI-02, PI-03]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 25 Plan 12: Gap Closure - Test Stub Implementation Summary

**9 todo-only test stubs replaced with real Vitest implementations covering pricing data store offline fallback, Supabase sync, and stale price detection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T13:34:14Z
- **Completed:** 2026-03-31T13:36:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced all 5 `it.todo` stubs in offline-pricing.test.ts with real assertions testing cached data preservation, DEFAULT_PRICES fallback, isOffline flag, and lastSyncedAt updates
- Replaced all 4 `it.todo` stubs in price-provider.test.ts with real assertions testing Supabase data loading, TS fallback, PriceRecord shape compatibility, and getStalePrices stale detection
- All 9 tests pass, zero todo stubs remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement offline-pricing.test.ts with real assertions** - `8568426` (test)
2. **Task 2: Implement price-provider.test.ts with real assertions** - `c0e199c` (test)

## Files Created/Modified
- `src/hooks/__tests__/offline-pricing.test.ts` - 5 real tests for offline pricing fallback behavior (cached data, DEFAULT_PRICES fallback, isOffline flag, lastSyncedAt)
- `src/engine/__tests__/price-provider.test.ts` - 4 real tests for async price provider (Supabase success, TS fallback, PriceRecord shape, stale detection via getStalePrices)

## Decisions Made
- Allow `amountPerStudent >= 0` in shape validation test: some providers (JIJ/SAQI) have zero-price placeholder modules in DEFAULT_PRICES, so strict `> 0` assertion was incorrect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed amountPerStudent assertion from > 0 to >= 0**
- **Found during:** Task 2 (price-provider.test.ts - merges school-specific overrides test)
- **Issue:** Plan suggested asserting `amountPerStudent > 0`, but some DEFAULT_PRICES entries have 0 for providers with offerte-based pricing
- **Fix:** Changed assertion to `toBeGreaterThanOrEqual(0)` instead of `toBeGreaterThan(0)`
- **Files modified:** src/engine/__tests__/price-provider.test.ts
- **Verification:** All 4 tests pass after fix
- **Committed in:** c0e199c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor assertion adjustment for data accuracy. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all test implementations contain real assertions.

## Next Phase Readiness
- All 9 pricing test stubs are now real tests with assertions
- Pricing data store offline fallback behavior is fully tested
- Test coverage gap from Phase 25 verification is closed

---
*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Completed: 2026-03-31*
