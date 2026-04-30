---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 02
subsystem: pricing-data-layer
tags: [zustand, supabase, offline-fallback, config-injection, react-query, vitest]

requires:
  - phase: 25-prijsintelligentie-stakeholder-feedback-loop
    plan: 01
    provides: pricing-operations.ts CRUD functions, pricing-types.ts interfaces
  - phase: 10.1-data-model-refactor
    provides: Provider configs (PROVIDER_CONFIGS), PricingStrategy types
provides:
  - usePricingDataStore Zustand store with Supabase-first loading and 3-layer offline fallback
  - providerConfigs injection in calculateComparison (D-03 config parameter pattern)
  - usePublicationPrices and usePricingConfigs React Query hooks
  - OfflinePriceBanner component for offline/stale data indication
affects: [25-03, 25-04, 25-05, 25-06, 25-07, 25-08]

tech-stack:
  added: []
  patterns: [providerConfigs injection via ComparisonOptions, 3-layer fallback (DB -> cache -> static), store-to-store getState() pattern]

key-files:
  created:
    - src/stores/pricing-data-store.ts
    - src/hooks/usePublicationPrices.ts
    - src/hooks/usePricingConfigs.ts
    - src/components/ui/OfflinePriceBanner.tsx
    - src/stores/__tests__/pricing-data-store.test.ts
    - src/engine/__tests__/price-comparison-config-injection.test.ts
  modified:
    - src/engine/price-comparison.ts
    - src/features/price-comparison/store.ts

key-decisions:
  - "providerConfigs as optional ComparisonOptions field preserves backward compatibility"
  - "3-layer fallback: Supabase DB -> localStorage cache -> static TS imports (D-04)"
  - "usePricingDataStore.getState() pattern for store-to-store reads (existing convention)"
  - "persist middleware partialize excludes isLoading and isOffline (session-scoped state)"

requirements-completed: [PI-02, PI-03, PI-08]

duration: 7min
completed: 2026-03-30
---

# Phase 25 Plan 02: Pricing Data Store & Config Injection Summary

**Zustand pricing data store with Supabase-first loading, 3-layer offline fallback, engine config injection via ComparisonOptions, React Query hooks, and offline banner component**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T20:57:00Z
- **Completed:** 2026-03-30T21:04:00Z
- **Tasks:** 2 (both TDD)
- **Files created:** 6
- **Files modified:** 2

## Accomplishments

- Zustand `usePricingDataStore` with persist middleware and 3-layer offline fallback (DB -> localStorage cache -> static TS imports)
- `calculateComparison` now accepts optional `providerConfigs` parameter -- backward compatible, falls back to static `PROVIDER_CONFIGS`
- All three store methods (`initialize`, `applyWizardConfig`, `recalculate`) wired to pass `providerConfigs` from `usePricingDataStore.getState()`
- React Query hooks for publication prices and pricing configs with 5-minute stale time
- `OfflinePriceBanner` component with Dutch text and date formatting
- `getStalePrices()` method filters by 6-month verification threshold using existing `getPriceStatus()` logic
- 9 new tests (5 store + 4 config injection), all 188 engine tests still passing

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1: Pricing data store with Supabase-first loading and offline fallback**
   - RED: `84a1dc5` (test) - 5 failing tests for store behavior
   - GREEN: `2fc85d5` (feat) - Store, hooks, banner, passing tests

2. **Task 2: Engine calculators accept injected configs as parameters**
   - RED: `38ec469` (test) - 4 failing tests for config injection
   - GREEN: `1388995` (feat) - ComparisonOptions.providerConfigs, store wiring

## Files Created/Modified

- `src/stores/pricing-data-store.ts` - Central Zustand store with persist + offline fallback
- `src/hooks/usePublicationPrices.ts` - React Query wrapper for publication prices
- `src/hooks/usePricingConfigs.ts` - React Query wrapper for pricing configs
- `src/components/ui/OfflinePriceBanner.tsx` - Yellow banner for offline/stale pricing data
- `src/stores/__tests__/pricing-data-store.test.ts` - 5 store behavior tests
- `src/engine/__tests__/price-comparison-config-injection.test.ts` - 4 config injection tests
- `src/engine/price-comparison.ts` - Added providerConfigs to ComparisonOptions, uses injected configs
- `src/features/price-comparison/store.ts` - Wired usePricingDataStore.getState() in all 3 calculation methods

## Decisions Made

- providerConfigs as optional ComparisonOptions field preserves backward compatibility
- 3-layer fallback: Supabase DB -> localStorage cache -> static TS imports (D-04)
- usePricingDataStore.getState() pattern for store-to-store reads (existing convention)
- persist middleware partialize excludes isLoading and isOffline (session-scoped state)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows are fully wired. The store's `loadFromSupabase` currently keeps static PROVIDER_CONFIGS as providerConfigs (TODO comment notes future PricingConfig -> ProviderConfig transformation). This is intentional: the static configs are correct defaults, and the transformation will be built when the pricing config editor (Plan 25-05) creates configs that differ from static.

## Self-Check: PASSED
