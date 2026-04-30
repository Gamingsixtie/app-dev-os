---
phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready
plan: 01
subsystem: ui
tags: [react, tailwind, price-comparison, section-bands, details-summary, popover]

requires:
  - phase: 10.3-comparison-page-integration
    provides: PriceComparisonPage with ProviderSelector, PricingModelCards, ComparisonSummary
provides:
  - SectionBand full-bleed layout component with alternating backgrounds
  - ProviderToolbar merged provider selector with PricingInfoPopover
  - PricingInfoPopover click-to-show pricing model description
  - Restructured PriceComparisonPage with D-05 section order
  - Cleaned ComparisonSummary (totals only, no differentiators)
  - Cleaned MeerwaardePanel (time savings only, no DifferentiatorsSection)
  - Behavioral tests for page structure and toolbar
affects: [24-02-plan, 24-03-plan, price-comparison-page]

tech-stack:
  added: []
  patterns: [SectionBand full-bleed wrapper, details/summary for collapsible sections, PricingInfoPopover with Escape-close]

key-files:
  created:
    - src/features/price-comparison/components/SectionBand.tsx
    - src/features/price-comparison/components/ProviderToolbar.tsx
    - src/features/price-comparison/components/PricingInfoPopover.tsx
    - src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx
    - src/features/price-comparison/__tests__/ProviderToolbar.test.tsx
  modified:
    - src/features/price-comparison/PriceComparisonPage.tsx
    - src/features/price-comparison/MeerwaardePanel.tsx

key-decisions:
  - "SectionBand as simple section wrapper with bg prop — no testId prop needed, tests query by content"
  - "PROVIDER_COLORS and PRICING_STRATEGY_DESCRIPTIONS extracted to ProviderToolbar and PricingInfoPopover respectively"
  - "Native details/summary for collapsed chart and meerwaarde — no JS state needed"
  - "D-14 tooltips via title attributes on span wrappers around bundle/period controls"

patterns-established:
  - "SectionBand pattern: full-bleed section with py-8 and max-w-[960px] mx-auto inner container"
  - "PricingInfoPopover pattern: click-to-show with backdrop close + Escape key"

requirements-completed: [D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-12, D-13, D-14, D-15, D-16, D-17]

duration: 5min
completed: 2026-03-29
---

# Phase 24 Plan 01: Layout & Structure Refactor Summary

**SectionBand layout system, ProviderToolbar with pricing popovers, D-05 section reorder, differentiators removal, and collapsible chart/meerwaarde with 15 behavioral tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T23:19:37Z
- **Completed:** 2026-03-28T23:25:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created SectionBand, ProviderToolbar, and PricingInfoPopover reusable components
- Restructured PriceComparisonPage with correct D-05 section order and alternating color bands
- Removed duplicate differentiators from ComparisonSummary (D-06) and MeerwaardePanel (D-07)
- Chart and MeerwaardePanel collapsed by default via native details/summary (D-10, D-11)
- Added self-explanatory tooltips on bundel and contractperiode controls (D-14)
- 15 behavioral tests covering section order, color bands, collapse defaults, tooltips, and toolbar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SectionBand, ProviderToolbar, and PricingInfoPopover** - `00cda2d` (feat)
2. **Task 2: Restructure PriceComparisonPage, clean panels, add tooltips** - `bef2250` (feat)
3. **Task 3: Behavioral tests for page and toolbar** - `d2d3491` (test)

## Files Created/Modified
- `src/features/price-comparison/components/SectionBand.tsx` - Full-bleed section wrapper with alternating bg
- `src/features/price-comparison/components/ProviderToolbar.tsx` - Merged provider selector with checkboxes, color dots, module counts
- `src/features/price-comparison/components/PricingInfoPopover.tsx` - Click-to-show pricing model popover
- `src/features/price-comparison/PriceComparisonPage.tsx` - Restructured with D-05 section order, SectionBands, details/summary
- `src/features/price-comparison/MeerwaardePanel.tsx` - Removed DifferentiatorsSection, kept time savings only
- `src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx` - 7 behavioral tests for page structure
- `src/features/price-comparison/__tests__/ProviderToolbar.test.tsx` - 8 behavioral tests for toolbar

## Decisions Made
- SectionBand uses simple bg prop without testId — tests query sections by content using within()
- Native details/summary for D-10/D-11 collapsing — zero JS state, progressive enhancement
- D-14 tooltips via title attributes on span wrappers — lightweight, browser-native
- PROVIDER_COLORS exported from ProviderToolbar for reuse by other components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components fully wired with real data sources.

## Next Phase Readiness
- SectionBand and ProviderToolbar ready for use by Plan 02 (progressive disclosure)
- Page structure matches D-05 spec, ready for visual verification
- SchoolplanBanner removed from page render — Plan 02 will integrate it into AiAdviesSection

---
*Phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready*
*Completed: 2026-03-29*
