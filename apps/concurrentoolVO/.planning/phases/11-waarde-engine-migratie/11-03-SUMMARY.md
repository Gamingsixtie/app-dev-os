---
phase: 11-waarde-engine-migratie
plan: 03
subsystem: ui
tags: [upsell, badge, dashboard, school-card, signal-strength]

dependency_graph:
  requires:
    - phase: 11-01
      provides: calculateUpsell engine, UpsellOpportunity types, calculateComparison
    - phase: 11-02
      provides: WaardeTab UI, EditableField component, tab routing
  provides:
    - UpsellCard component on school dashboard with per-module opportunity list
    - UpsellBadge pill component on school overview cards
    - Visual verification of all Phase 11 features
  affects: [school-profile, school-overview, phase-12-dmu-export]

tech_stack:
  added: []
  patterns: [signal-color-coding, inline-badge-composition, engine-to-ui-wiring]

key_files:
  created:
    - src/components/ui/UpsellBadge.tsx
    - src/features/school-profile/components/UpsellCard.tsx
  modified:
    - src/features/school-profile/tabs/DashboardTab.tsx
    - src/features/school-overview/SchoolCard.tsx

key-decisions:
  - "Upsell computation done per-card in SchoolCard (acceptable for 50-200 schools with pure functions)"
  - "Signal color green/yellow mapped to Tailwind badge variants matching SalesSignalBadge pattern"

patterns-established:
  - "Engine-to-badge pattern: pure engine function called in component, result drives badge color and count"

requirements-completed: [SCHOOL-07, MIGR-03]

duration: 12min
completed: 2026-03-23
---

# Phase 11 Plan 03: Upsell UI & Verification Summary

**UpsellCard on school dashboard showing per-module upsell opportunities with signal dots, and UpsellBadge on school overview cards with count and color coding**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-23T00:10:00Z
- **Completed:** 2026-03-23T00:22:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- UpsellCard component renders on school dashboard with per-module opportunity rows (signal dot, module name, current provider, savings per student, comparison link)
- UpsellBadge pill component shows "X kansen" on school overview cards with green/yellow color based on signal strength
- Empty states handled: "Vul de huidige situatie in" when no moduleSetups, "Geen upsell-kansen gevonden" when no opportunities
- All Phase 11 features visually verified and approved by user

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UpsellCard, UpsellBadge, integrate into Dashboard and SchoolCard** - `c288b02` (feat)
2. **Task 2: Visual verification of complete Phase 11** - N/A (checkpoint, approved by user)

## Files Created/Modified
- `src/components/ui/UpsellBadge.tsx` - Pill badge component showing upsell count with green/yellow color variants
- `src/features/school-profile/components/UpsellCard.tsx` - Dashboard card listing upsell opportunities per module with signal dots and comparison links
- `src/features/school-profile/tabs/DashboardTab.tsx` - Integrated UpsellCard with upsell computation via calculateUpsell and calculateComparison
- `src/features/school-overview/SchoolCard.tsx` - Integrated UpsellBadge next to PipelineBadge with per-card upsell computation

## Decisions Made
- Upsell computation done per-card in SchoolCard -- acceptable performance for 50-200 schools since calculateComparison and calculateUpsell are pure functions with no I/O
- Signal color green/yellow mapped to Tailwind badge variants following the existing SalesSignalBadge pattern for visual consistency

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 11 complete: waarde engine (11-01), WaardeTab UI (11-02), and upsell UI (11-03) all shipped
- Ready for Phase 12: DMU-Export & Offline -- all value data (price comparison, time savings, migration, multi-year projection, upsell) is available for PDF report generation
- Pending: DiaPackageManager UI deferred from Phase 10 (not blocking Phase 12)

---
## Self-Check: PASSED

- All 4 key files verified present on disk
- Commit c288b02: Task 1 (UpsellCard + UpsellBadge integration)

---
*Phase: 11-waarde-engine-migratie*
*Completed: 2026-03-23*
