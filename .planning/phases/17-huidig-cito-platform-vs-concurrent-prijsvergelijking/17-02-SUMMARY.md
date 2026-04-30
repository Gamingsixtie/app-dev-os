---
phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking
plan: 02
subsystem: ui
tags: [react, zustand, wizard, scenario-routing, tailwind]

requires:
  - phase: 17-01
    provides: WizardScenario type with alles-oud-cito-concurrent, Scenario C type, ComparisonOptions with scenarioType

provides:
  - ScenarioDetector two-card choice UI for alles-oud-cito scenario
  - Wizard store Scenario C support (applyToTable writes scenario C to school profile)
  - ComparisonTab routing for Scenario C to PriceComparisonPage
  - ComparisonWizard callback wiring for competitor/migration choices

affects: [17-03, price-comparison, school-profile]

tech-stack:
  added: []
  patterns:
    - "Choice UI pattern: two-card selection with confirm button for branching wizard flows"
    - "Cross-store write in applyToTable: wizard store writes scenario to school profile store"

key-files:
  created: []
  modified:
    - src/features/price-comparison/wizard/ScenarioDetector.tsx
    - src/features/price-comparison/wizard/wizard-store.ts
    - src/features/price-comparison/wizard/ComparisonWizard.tsx
    - src/features/school-profile/tabs/ComparisonTab.tsx

key-decisions:
  - "Migration callback sets school scenario to B directly (ComparisonTab picks up change and renders MigrationPage)"
  - "Scenario C routing placed before B/A checks in ComparisonTab for correct priority"

patterns-established:
  - "Choice UI: card selection with local state + confirm button pattern for branching decisions"

requirements-completed: [SC17-01, SC17-04, SC17-05]

duration: 4min
completed: 2026-03-25
---

# Phase 17 Plan 02: Scenario C User Flow Summary

**Two-card choice UI in ScenarioDetector for alles-oud-cito with wizard store Scenario C support and ComparisonTab routing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T16:07:37Z
- **Completed:** 2026-03-25T16:11:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ScenarioDetector shows two-card choice UI (Migratie bekijken / Vergelijk met concurrent) when scenario is alles-oud-cito
- Wizard store applyToTable() writes Scenario C to school profile store when scenario is alles-oud-cito-concurrent
- ComparisonTab routes Scenario C to PriceComparisonPage and accepts all three scenario types (A/B/C)
- ComparisonWizard wires onChooseCompetitor (sets scenario + advances step) and onChooseMigration (sets school scenario B)

## Task Commits

Each task was committed atomically:

1. **Task 1: ScenarioDetector keuze-UI and wizard store Scenario C support** - `c56dfff` (feat)
2. **Task 2: ComparisonTab Scenario C routing** - `4c08cd9` (feat)

## Files Created/Modified
- `src/features/price-comparison/wizard/ScenarioDetector.tsx` - Two-card choice UI replacing info banner for alles-oud-cito scenario
- `src/features/price-comparison/wizard/wizard-store.ts` - Scenario C handling in applyToTable, useSchoolProfileStore import
- `src/features/price-comparison/wizard/ComparisonWizard.tsx` - Callback handlers for competitor/migration choices wired to ScenarioDetector
- `src/features/school-profile/tabs/ComparisonTab.tsx` - Scenario C routing to PriceComparisonPage, Scenario type in handleApplyScenario

## Decisions Made
- Migration callback sets school scenario to 'B' directly via useSchoolProfileStore.setScenario -- ComparisonTab reactively renders MigrationPage without explicit navigation
- Scenario C routing placed before B and A checks in ComparisonTab to ensure correct priority matching
- Choice UI uses local state for card selection with confirm button (no auto-advance on click) per UI spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Scenario C user flow complete: detection -> choice UI -> wizard continuation or migration
- Ready for Plan 03: AI retentie-advies, ComparisonTable label override, and integration testing

## Self-Check: PASSED

All 4 modified files verified on disk. Both task commits (c56dfff, 4c08cd9) found in git log. Build passes, 1069 tests pass.

---
*Phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking*
*Completed: 2026-03-25*
