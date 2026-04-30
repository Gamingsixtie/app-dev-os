---
phase: 11-waarde-engine-migratie
plan: 02
subsystem: ui
tags: [react, recharts, tailwind, inline-editing, tab-navigation, waarde-tab]
dependency_graph:
  requires:
    - phase: 11-01
      provides: calculateMigration with switchingCosts, breakEvenMonth, SchoolRecord.switchingCosts
  provides:
    - WaardeTab as 6th school profile tab at /scholen/:slug/waarde
    - ValueHeroCard combining price diff + time savings + migration effect
    - TimeSavingsSection with inline editable hours and hourly rate
    - MigrationSection with warning banner and placeholder detection
    - MultiYearSection with Recharts bar chart and break-even display
    - EditableField shared component extracted from MigrationPage
    - waardeRoute in router
  affects: [school-profile, price-comparison, tab-navigation, router]
tech_stack:
  added: []
  patterns: [shared-editable-field, section-component-composition, react-query-cached-school-data]
key_files:
  created:
    - src/features/school-profile/components/EditableField.tsx
    - src/features/school-profile/components/ValueHeroCard.tsx
    - src/features/school-profile/components/TimeSavingsSection.tsx
    - src/features/school-profile/components/MigrationSection.tsx
    - src/features/school-profile/components/MultiYearSection.tsx
    - src/features/school-profile/tabs/WaardeTab.tsx
  modified:
    - src/features/price-comparison/MigrationPage.tsx
    - src/features/school-profile/components/TabNavigation.tsx
    - src/router/routes.ts
key_decisions:
  - "switchingCosts loaded from school record via useSchool hook (react-query cached) rather than Zustand store since price comparison store does not hydrate this field"
  - "EditableField extracted as shared component with accessibility enhancements (role=button, tabIndex, keyboard handlers) for reuse across TimeSavingsSection and MultiYearSection"
  - "priceDifference computed as best competitor total minus Cito total for hero card; null when no comparison data available"
patterns_established:
  - "Section component pattern: each Waarde section is self-contained with props-only interface, composed by WaardeTab parent"
  - "Shared EditableField with min-h-[44px] touch targets for tablet usability"
requirements-completed: [WAARDE-01, WAARDE-02, WAARDE-03, WAARDE-04, MIGR-01, MIGR-02, MIGR-03]
metrics:
  duration: 6m
  completed: "2026-03-23T00:09:00Z"
  tasks_completed: 2
  tasks_total: 2
  test_count: 1030
---

# Phase 11 Plan 02: Waarde Tab UI Summary

**Complete Waarde tab with hero summary card, time savings table with inline editing, migration financial table with warning banner, multi-year Recharts bar chart with break-even, and shared EditableField component.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T00:03:07Z
- **Completed:** 2026-03-23T00:09:10Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Extracted EditableField from MigrationPage into shared component with accessibility (role="button", tabIndex, keyboard navigation)
- Built 4 section components: ValueHeroCard, TimeSavingsSection, MigrationSection, MultiYearSection
- Created WaardeTab as 6th tab at /scholen/:slug/waarde wiring all sections to migration engine and Supabase persistence
- Added waardeRoute to router and Waarde entry to TabNavigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract EditableField, build section components, hero card** - `c693a60` (feat)
2. **Task 2: Wire WaardeTab, add route and tab navigation** - `12c6f98` (feat)

## Files Created/Modified

- `src/features/school-profile/components/EditableField.tsx` - Shared inline editable number field with a11y
- `src/features/school-profile/components/ValueHeroCard.tsx` - Hero card showing total annual value with 3 sub-values
- `src/features/school-profile/components/TimeSavingsSection.tsx` - Table of 5 time saving tasks with editable hours
- `src/features/school-profile/components/MigrationSection.tsx` - Migration financial table with amber warning banner
- `src/features/school-profile/components/MultiYearSection.tsx` - Recharts bar chart + table + break-even display
- `src/features/school-profile/tabs/WaardeTab.tsx` - 6th tab shell composing all 4 sections
- `src/features/price-comparison/MigrationPage.tsx` - Replaced inline EditableField with shared import
- `src/features/school-profile/components/TabNavigation.tsx` - Added Waarde as 6th tab entry
- `src/router/routes.ts` - Added waardeRoute at /waarde path

## Decisions Made

- **switchingCosts via useSchool hook:** The price comparison store's hydrate function does not include switchingCosts. Used useSchool hook (react-query cached data from SchoolLayout) to initialize local state, avoiding redundant DB queries.
- **EditableField a11y:** Added role="button", tabIndex={0}, and keyboard event handlers (Enter/Space to edit) per the accessibility contract in the UI spec.
- **priceDifference calculation:** Computed as best competitor total minus Cito total. Returns null when no comparison data is available, showing the "Vul eerst de vergelijking in" placeholder.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Tooltip formatter type error in MultiYearSection**
- **Found during:** Task 1 build verification
- **Issue:** Recharts Tooltip formatter expects `(value: ValueType | undefined)` but was typed as `(v: number)`
- **Fix:** Changed to `(v) => [formatCurrency(Number(v)), 'Cumulatieve waarde']` matching the MigrationPage pattern
- **Files modified:** `src/features/school-profile/components/MultiYearSection.tsx`
- **Committed in:** c693a60

**2. [Rule 3 - Blocking] switchingCosts not in price comparison store**
- **Found during:** Task 2 implementation
- **Issue:** Plan specified reading switchingCosts from price comparison store, but the store's hydrate function does not include it
- **Fix:** Used useSchool hook with useEffect to initialize switchingCosts from cached school record, with local state for reactive updates
- **Files modified:** `src/features/school-profile/tabs/WaardeTab.tsx`
- **Committed in:** 12c6f98

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for build success and correct data flow. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations documented above.

## Known Stubs

None -- all components wire to real engine calculations and Supabase persistence.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WaardeTab fully functional as 6th tab with all sections rendering
- Plan 11-03 (upsell UI) can build on the Waarde tab foundation
- All 1030 tests pass, build succeeds

## Self-Check: PASSED

- All 9 key files verified present on disk
- Commit c693a60: Task 1 (EditableField + section components)
- Commit 12c6f98: Task 2 (WaardeTab + route + navigation)

---
*Phase: 11-waarde-engine-migratie*
*Completed: 2026-03-23*
