---
phase: 09-ai-intake-prijsbeheer
plan: 03
subsystem: ui
tags: [react, price-management, school-prices, react-hook-form, zod]

requires:
  - phase: 09-ai-intake-prijsbeheer
    plan: 01
    provides: "useSchoolPrices hooks, priceEntrySchema, SchoolPriceEntry type, PriceBadge, PriceDeviationWarning"

provides:
  - "PriceEditModal component for adding/editing school-specific prices"
  - "PriceHistoryList component with radio-based active price selection"
  - "PriceManager collapsible section per module with full price lifecycle"
  - "Extended ProductsTab with school price display and price management"

affects: [09-ai-intake-prijsbeheer, price-comparison, school-profile]

tech-stack:
  added: []
  patterns:
    - "Radio-button activation with required reason text for audit trail"
    - "Collapsible section pattern for per-module price management"
    - "School price vs publication price display priority logic"

key-files:
  created:
    - src/features/school-profile/components/PriceEditModal.tsx
    - src/features/school-profile/components/PriceHistoryList.tsx
    - src/features/school-profile/components/PriceManager.tsx
  modified:
    - src/features/school-profile/tabs/ProductsTab.tsx

key-decisions:
  - "Replaced usePriceComparisonStore appliedOverrides with useSchoolPrices for price display in ProductsTab"
  - "Radio activation uses inline reason input with confirm button per D-08 spec"
  - "Reset-to-publication deactivates all school prices via direct Supabase update in PriceManager"

patterns-established:
  - "Collapsible PriceManager per module: chevron toggle, expand to show history + add/edit"
  - "Price display priority: active school price > publication price > 'Geen prijs bekend'"

requirements-completed: [PRIJSMGT-01, PRIJSMGT-02, INTAKE-04]

duration: 4min
completed: 2026-03-22
---

# Phase 09 Plan 03: Price Management UI Summary

**Per-module price management with history list, modal entry form, active price selection with audit reason, publication reference, deviation warnings, and staleness badges**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T20:59:08Z
- **Completed:** 2026-03-22T21:03:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- PriceEditModal with react-hook-form + zod validation, bruto/netto toggle with conditional discount field, inline deviation warning
- PriceHistoryList with chronological entries, radio-button active selection, required activation reason, publication price reference row
- PriceManager collapsible section with add/edit modals, reset-to-publication with confirmation dialog
- ProductsTab extended to display active school price or publication fallback per module, with PriceManager sections

## Task Commits

Each task was committed atomically:

1. **Task 1: PriceEditModal and PriceHistoryList components** - `b7ae0e4` (feat)
2. **Task 2: PriceManager and ProductsTab extension** - `8c9b727` (feat)

## Files Created/Modified
- `src/features/school-profile/components/PriceEditModal.tsx` - Modal form for adding/editing SchoolPriceEntry with all price fields
- `src/features/school-profile/components/PriceHistoryList.tsx` - Chronological price list with radio selection and activation reason
- `src/features/school-profile/components/PriceManager.tsx` - Collapsible per-module price management section
- `src/features/school-profile/tabs/ProductsTab.tsx` - Extended with school price display and PriceManager per module

## Decisions Made
- Replaced usePriceComparisonStore appliedOverrides with useSchoolPrices hook for price display -- school_prices table is now the source of truth for school-specific prices
- Radio activation uses inline reason input with confirm button (per D-08 spec) rather than a separate dialog
- Reset-to-publication uses direct Supabase update in PriceManager to deactivate all school prices for a module/provider

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing build errors in test files (unused `expect` imports) and ai-intake.ts (missing function reference) were present before this plan. They are not caused by this plan's changes and are out of scope.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components are fully wired to data sources via useSchoolPrices hooks and DEFAULT_PRICES.

## Next Phase Readiness
- Price management UI complete, ready for document upload integration (Plan 04/05)
- ProductsTab now uses school_prices as primary price source
- All price lifecycle operations (create, edit, activate, reset) functional

---
*Phase: 09-ai-intake-prijsbeheer*
*Completed: 2026-03-22*
