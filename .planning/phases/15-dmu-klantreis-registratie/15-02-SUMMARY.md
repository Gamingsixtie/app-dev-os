---
phase: "15"
plan: "02"
subsystem: school-profile
tags: [dmu, engagement-badge, dmu-matrix, dashboard, ui]
key_files:
  created:
    - src/components/ui/EngagementBadge.tsx
    - src/features/school-profile/components/EngagementStatusSelect.tsx
    - src/features/school-profile/components/DropOffReasonDialog.tsx
    - src/features/school-profile/components/WaitingForSelect.tsx
    - src/features/school-profile/components/DmuMatrix.tsx
    - src/features/school-profile/components/DmuMismatchBanner.tsx
  modified:
    - src/features/school-profile/tabs/DashboardTab.tsx
decisions:
  - "Executed as part of Plan 01 single-pass execution"
metrics:
  duration: "included in 15-01"
  completed: "2026-03-23"
  tasks: 2
---

# Phase 15 Plan 02: School-profile DMU UI Components

Executed as part of Plan 01's single-pass execution. All components built and integrated.

## What Was Built

- **EngagementBadge**: 6 color variants (sm/md sizes) following PipelineBadge pattern
- **EngagementStatusSelect**: native select for inline status changes
- **DropOffReasonDialog**: mandatory reason textarea for afgehaakt status
- **WaitingForSelect**: contact dropdown for wacht-op-intern state
- **DmuMatrix**: 5-column table on DashboardTab with stagnation badges and responsive card view
- **DmuMismatchBanner**: amber warning when pipeline and DMU statuses don't align

See 15-01-SUMMARY.md for full details.

## Self-Check: PASSED
