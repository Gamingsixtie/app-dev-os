---
phase: 18-contactbeheer-upgrade-klantreis-inzicht
plan: "02"
subsystem: ui
tags: [contacts-tab, dmu-grouping, timeline, blokkade]

requires:
  - phase: 18-01
    provides: 6-role DMU model, useSystemEvents hook, DMU_POSITIONS ordering
provides:
  - ContactsTab view toggle (DMU-overzicht / Klantreis)
  - DMU-grouped contact view with collapsible headers
  - Customer journey timeline with chronological entries
  - TimelineEntry component with type-specific styling
  - BlockadeForm for registering blokkades as system events
affects: [19-gesprekken-tab-acties-upgrade]

tech-stack:
  added: []
  patterns: [localStorage view toggle, DMU hierarchy grouping, timeline aggregation, system event blokkade pattern]

key-files:
  created:
    - src/features/school-profile/components/CustomerJourneyTimeline.tsx
    - src/features/school-profile/components/TimelineEntry.tsx
    - src/features/school-profile/components/ContactGroupHeader.tsx
    - src/features/school-profile/components/BlockadeForm.tsx
  modified:
    - src/features/school-profile/tabs/ContactsTab.tsx

key-decisions:
  - "View toggle persisted via localStorage (contacts-view-mode key)"
  - "DMU groups ordered by DMU_POSITIONS array index (beslisser first)"
  - "Empty DMU groups hidden entirely"
  - "Timeline entries sorted newest first"
  - "Blokkades stored as system events with blokkade_registered eventType"

patterns-established:
  - "View toggle pattern: useState with localStorage init + onChange sync"
  - "DMU grouping: filter by DMU_POSITIONS order, skip empty groups"

requirements-completed:
  - SC-18-02
  - SC-18-03

duration: 0min
completed: 2026-03-25
note: "Implemented by 18-01 executor agent in same execution pass"
---

# Phase 18 Plan 02: ContactsTab Upgrade — DMU Grouping & Klantreis Timeline

**View toggle between DMU-grouped contacts and chronological klantreis timeline with blokkade registration**

## Performance

- **Duration:** 0 min (implemented within Plan 01 execution)
- **Tasks:** 2/2 (completed as part of 18-01)

## Accomplishments

- ContactsTab has two-button toggle between DMU-overzicht and Klantreis views
- DMU-overzicht groups contacts by role in hierarchical order with collapsible ContactGroupHeader sections
- Klantreis view shows CustomerJourneyTimeline with chronological entries from conversations and system events
- TimelineEntry renders with type-specific left borders (blue=conversation, red=blokkade, green=first contact)
- BlockadeForm registers blokkades as system events with optional contact reference
- View toggle persists via localStorage

## Deviations from Plan

- All work completed within 18-01 execution rather than as separate Wave 2 plan

## Self-Check: PASSED

- All 4 created files exist on disk
- ContactsTab contains view toggle with localStorage persistence
- Build succeeds

---
*Phase: 18-contactbeheer-upgrade-klantreis-inzicht*
*Completed: 2026-03-25*
