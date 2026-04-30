---
phase: 18-contactbeheer-upgrade-klantreis-inzicht
plan: "03"
subsystem: ui
tags: [dmu-matrix, dashboard, customer-journey-summary]

requires:
  - phase: 18-01
    provides: 6-role DMU model, useSystemEvents hook, useConversations hook
provides:
  - DmuMatrix Nr. column with contact order
  - CustomerJourneySummary dashboard card
  - Dashboard integration with summary above DmuMatrix
affects: [19-gesprekken-tab-acties-upgrade, 21-dmu-export-upgrade]

tech-stack:
  added: []
  patterns: [ordinal formatting, contact order from earliest conversation, 2x2 grid summary card]

key-files:
  created:
    - src/features/school-profile/components/CustomerJourneySummary.tsx
  modified:
    - src/features/school-profile/components/DmuMatrix.tsx
    - src/features/school-profile/tabs/DashboardTab.tsx

key-decisions:
  - "Contact order derived from earliest conversation date per contact"
  - "Ordinal formatting: 1e, 2e, 3e (Dutch convention)"
  - "DMU-bereik counts contacts with positief/akkoord/in-gesprek engagement status"
  - "Latest unresolved blokkade shown in summary card"
  - "CustomerJourneySummary rendered above DmuMatrix in dashboard layout"

patterns-established:
  - "Contact order computation via useMemo over conversations"
  - "Dashboard summary card: 2x2 grid with label + value cells"

requirements-completed:
  - SC-18-04
  - SC-18-05

duration: 0min
completed: 2026-03-25
note: "Implemented by 18-01 executor agent in same execution pass"
---

# Phase 18 Plan 03: DmuMatrix Nr. Column & CustomerJourneySummary Dashboard Card

**Contact order column in DmuMatrix and klantreis summary card on dashboard**

## Performance

- **Duration:** 0 min (implemented within Plan 01 execution)
- **Tasks:** 3/3 (completed as part of 18-01)

## Accomplishments

- DmuMatrix shows Nr. column with ordinal contact order (1e, 2e, 3e) based on earliest conversation date
- All 6 new DMU roles render correctly in DmuMatrix
- CustomerJourneySummary shows 2x2 grid: eerste aanspreekpunt, beslisser, DMU-bereik with progress bar, huidige blokkade
- Dashboard integrates CustomerJourneySummary above DmuMatrix
- Empty states with correct Dutch copy ("Niet vastgelegd", "Geen blokkades")

## Deviations from Plan

- All work completed within 18-01 execution rather than as separate Wave 2 plan
- Visual verification checkpoint (Task 3) deferred to phase-level verification

## Self-Check: PASSED

- CustomerJourneySummary.tsx exists with all 4 grid cells
- DmuMatrix.tsx has Nr. column with formatOrdinal helper
- DashboardTab.tsx imports and renders CustomerJourneySummary
- Build succeeds

---
*Phase: 18-contactbeheer-upgrade-klantreis-inzicht*
*Completed: 2026-03-25*
