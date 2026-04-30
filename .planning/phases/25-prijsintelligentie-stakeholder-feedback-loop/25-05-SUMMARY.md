---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 05
subsystem: pricing-intelligence
tags: [pure-function, react-query, supabase, discount-detection, toggle-ui]

requires:
  - phase: 25-prijsintelligentie-stakeholder-feedback-loop
    plan: 02
    provides: usePricingDataStore, publication prices, pricing config injection
provides:
  - detectDiscountPatterns pure function for cross-school discount pattern detection
  - useDiscountPatterns React Query hook with 10-min stale time
  - MarktKortingToggle component for publication vs market pricing
  - KortingsPatroonAlert component for discount pattern info banners
affects: [25-06, 25-07, 25-08]

tech-stack:
  added: []
  patterns: [inline comparison recalculation for toggle-based price overrides, trusted-source filtering for data quality]

key-files:
  created:
    - src/engine/discount-patterns.ts
    - src/engine/__tests__/discount-patterns.test.ts
    - src/hooks/useDiscountPatterns.ts
    - src/features/price-comparison/MarktKortingToggle.tsx
    - src/features/price-comparison/KortingsPatroonAlert.tsx
  modified:
    - src/features/price-comparison/PriceComparisonPage.tsx

key-decisions:
  - "Inline recalculation via calculateComparison when market toggle active -- avoids store mutation and works with parallel worktree execution"
  - "DEFAULT_PRICES used directly for publication price lookup in hook (fallback until pricing-data-store from plan 02 is merged)"
  - "Only document and verified sources trusted for pattern detection per research pitfall 6"

patterns-established:
  - "Trusted source filtering: only 'document' and 'verified' sources used for aggregate intelligence"
  - "Toggle-driven recalculation: useMemo computes alternative ComparisonResult without mutating store"

requirements-completed: [PI-10]

duration: 5min
completed: 2026-03-30
---

# Phase 25 Plan 05: Discount Pattern Detection & Market Pricing Toggle Summary

**Pure function discount detector with 3+ school threshold, market pricing toggle in comparison view, and yellow info alerts showing detected discount percentages per provider**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T21:07:44Z
- **Completed:** 2026-03-30T21:14:00Z
- **Tasks:** 2 (Task 1 TDD, Task 2 auto)
- **Files created:** 5
- **Files modified:** 1

## Accomplishments

- Pure function `detectDiscountPatterns` detects when 3+ schools report similar discounts for same provider+module
- Source filtering ensures only document/verified prices are used for pattern detection (research pitfall 6)
- Market pricing toggle in comparison view switches between publication prices and detected market prices
- Yellow info alerts show average discount % and school count per provider when toggle active
- 8 tests covering threshold, source filtering, calculation accuracy, multi-group, edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Discount pattern detection engine (TDD)**
   - RED: `7c667af` (test) - 8 failing tests for pattern detection
   - GREEN: `788179e` (feat) - Pure function implementation, all tests passing

2. **Task 2: MarktKortingToggle, KortingsPatroonAlert, and integration** - `b23b585` (feat)

## Files Created/Modified

- `src/engine/discount-patterns.ts` - Pure function pattern detector with SchoolPriceInput/PublicationPriceInput/DiscountPattern types
- `src/engine/__tests__/discount-patterns.test.ts` - 8 tests covering all behaviors
- `src/hooks/useDiscountPatterns.ts` - React Query hook fetching cross-team school prices from Supabase
- `src/features/price-comparison/MarktKortingToggle.tsx` - Two-option toggle: Publicatieprijzen / Inclusief marktkorting
- `src/features/price-comparison/KortingsPatroonAlert.tsx` - Yellow info banner with discount pattern details
- `src/features/price-comparison/PriceComparisonPage.tsx` - Integrated toggle, alert, and market override calculation

## Decisions Made

- Inline recalculation via `calculateComparison` when market toggle active -- avoids store mutation and parallel worktree conflicts
- DEFAULT_PRICES used directly for publication price lookup in hook (clean fallback until pricing-data-store from plan 02 is merged)
- Only 'document' and 'verified' sources trusted for pattern detection per research pitfall 6

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted hook to work without pricing-data-store from plan 02**
- **Found during:** Task 2 (hook implementation)
- **Issue:** Plan references `usePricingDataStore.getState().publicationPrices` but this store doesn't exist in the parallel worktree (created in plan 25-02 in a different worktree)
- **Fix:** Used DEFAULT_PRICES directly for publication price lookup, fetches school prices directly from Supabase. Will integrate with pricing-data-store after merge.
- **Files modified:** src/hooks/useDiscountPatterns.ts
- **Verification:** `npm run build` succeeds, hook exports correct types
- **Committed in:** b23b585

**2. [Rule 1 - Bug] Fixed SectionBand bg prop type error**
- **Found during:** Task 2 (PriceComparisonPage integration)
- **Issue:** Used `bg-yellow-50/50` which is not in the SectionBand allowed values union type
- **Fix:** Changed to `bg-white` which is an allowed value; the KortingsPatroonAlert component itself has yellow styling
- **Files modified:** src/features/price-comparison/PriceComparisonPage.tsx
- **Verification:** `npm run build` passes
- **Committed in:** b23b585

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both necessary for correct execution. No scope creep.

## Issues Encountered

None beyond the documented deviations.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all data flows are fully wired. The hook uses DEFAULT_PRICES directly for publication prices (will use usePricingDataStore after plan 02 merge).

## Next Phase Readiness

- Discount pattern detection engine is ready for use by other plans
- Market pricing toggle is live in the comparison view
- When plan 02 files are merged, the hook can be updated to use usePricingDataStore for publication prices instead of DEFAULT_PRICES

## Self-Check: PASSED

All 5 created files verified on disk. All 3 commits verified in git log. Build passes. 8 tests pass.

---
*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Completed: 2026-03-30*
