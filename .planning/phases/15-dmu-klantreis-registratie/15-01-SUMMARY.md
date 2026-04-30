---
phase: "15"
plan: "01"
subsystem: school-profile, school-overview
tags: [dmu, engagement-status, klantreis, dashboard, filtering]
dependency_graph:
  requires: [phase-07-contacts, phase-08-supabase]
  provides: [engagement-status-tracking, dmu-matrix, dmu-filtering]
  affects: [school-overview, school-profile-dashboard, kanban-view]
tech_stack:
  added: []
  patterns: [engagement-status-badge, stagnation-detection, mismatch-banner, dmu-filter]
key_files:
  created:
    - src/components/ui/EngagementBadge.tsx
    - src/features/school-profile/components/DropOffReasonDialog.tsx
    - src/features/school-profile/components/EngagementStatusSelect.tsx
    - src/features/school-profile/components/WaitingForSelect.tsx
    - src/features/school-profile/components/DmuMatrix.tsx
    - src/features/school-profile/components/DmuMismatchBanner.tsx
    - src/features/school-overview/DmuProgressIndicator.tsx
    - src/features/school-overview/DmuStatusFilter.tsx
    - supabase/migrations/005_engagement_status.sql
  modified:
    - src/models/school.ts
    - src/db/types.ts
    - src/db/operations.ts
    - src/hooks/useContacts.ts
    - src/features/school-profile/tabs/DashboardTab.tsx
    - src/features/school-overview/SchoolCard.tsx
    - src/features/school-overview/PipelineKanbanView.tsx
    - src/features/school-overview/SchoolOverviewPage.tsx
    - src/features/school-overview/__tests__/filter.test.ts
    - src/features/school-profile/__tests__/diff-view-logic.test.ts
    - src/features/school-profile/__tests__/intake-merge.test.ts
decisions:
  - "6 engagement statuses with free transitions (no validation restrictions)"
  - "Stagnation threshold at 30 days in same status with orange badge"
  - "Mismatch detection compares majority DMU status against pipeline status"
  - "DmuProgressIndicator placed in existing component flat directory (not subdirectory)"
  - "Select('*') with Record cast for Supabase columns not yet in generated types"
metrics:
  duration: "8m 27s"
  completed: "2026-03-23"
  tasks: 6
  files_created: 9
  files_modified: 11
---

# Phase 15 Plan 01: DMU Klantreis Registratie Summary

Engagement status tracking per DMU contact with decision matrix, stagnation detection, mismatch banner, progress indicators, and school overview filtering.

## What Was Built

### Data Layer
- **ENGAGEMENT_STATUSES** const and **EngagementStatus** type: 6 statuses (nog-niet-benaderd, in-gesprek, positief, wacht-op-intern, akkoord, afgehaakt)
- Extended **Contact** interface with `engagementStatus`, `engagementStatusChangedAt`, `waitingForContactId`, `dropOffReason`
- **Migration 005**: adds 4 columns to contacts table with indexes for filtering
- **setEngagementStatus** operation: updates contact, clears/sets waiting-for and drop-off fields, logs system event with `engagement_changed` type
- **useSetEngagementStatus** React Query mutation hook with cache invalidation

### UI Components
- **EngagementBadge**: 6 color variants following PipelineBadge pattern (sm/md sizes)
- **EngagementStatusSelect**: native select for inline status changes
- **DropOffReasonDialog**: required reason textarea when contact drops off (follows LostDealDialog pattern)
- **WaitingForSelect**: dropdown of other school contacts for "wacht-op-intern" state

### DMU Matrix on Dashboard
- **DmuMatrix**: full-width table with 5 columns (Naam, DMU-rol, Bevoegdheid, Status, Wacht op)
- Inline status changes via EngagementStatusSelect
- Stagnation badge (orange, showing "Nd") for contacts >30 days in same phase
- Responsive: table on desktop, card stack on mobile
- Empty state directing user to Contacten tab
- **DmuMismatchBanner**: detects when DMU engagement statuses don't align with school pipeline status, shows amber banner with actionable link

### Progress Indicators
- **DmuProgressIndicator**: compact "DMU X/Y" indicator with orange stagnation dot
- Added to SchoolCard header badge row (after UpsellBadge)
- Added to DraggableSchoolCard in PipelineKanbanView

### School Overview Filtering
- **DmuStatusFilter**: chip buttons matching FilterBar pattern with counts
- AND logic with pipeline filter for combinable filtering
- "Alle" chip clears DMU filter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase generated types don't include new columns**
- **Found during:** Task 6
- **Issue:** Supabase TypeScript types are generated from the DB schema and don't know about the new engagement_status column yet (migration not applied)
- **Fix:** Used `select('*')` with `Record<string, unknown>` cast in setEngagementStatus instead of selecting specific new columns
- **Files modified:** src/db/operations.ts
- **Commit:** 612466c

**2. [Rule 1 - Bug] Test fixtures missing new Contact fields**
- **Found during:** Task 6
- **Issue:** Three test files had Contact object literals missing the 4 new required fields
- **Fix:** Added engagementStatus, engagementStatusChangedAt, waitingForContactId, dropOffReason to all Contact fixtures
- **Files modified:** filter.test.ts, diff-view-logic.test.ts, intake-merge.test.ts
- **Commit:** 612466c

**3. [Rule 1 - Bug] Unused import in DmuMatrix**
- **Found during:** Task 6
- **Issue:** DMU_POSITION_LABELS imported but never used (DMUBadge handles labels internally)
- **Fix:** Removed unused import
- **Files modified:** src/features/school-profile/components/DmuMatrix.tsx
- **Commit:** 612466c

## Pre-existing Issues (Out of Scope)

- wizard-navigation.test.tsx: 8 failing tests due to missing QueryClientProvider in test setup. Pre-existing, not caused by Phase 15 changes.

## Known Stubs

None. All components render real data from Supabase via React Query hooks.

## Self-Check: PASSED
