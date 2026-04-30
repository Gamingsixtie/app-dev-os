---
phase: 18-contactbeheer-upgrade-klantreis-inzicht
plan: "01"
subsystem: ui, database
tags: [dmu, contacts, timeline, zustand, react-query, supabase]

requires:
  - phase: 15-dmu-klantreis-registratie
    provides: engagement status, DMU matrix, contact management
  - phase: 07-school-intelligence
    provides: CRM-lite data layer, contacts, conversations
provides:
  - 6-role DMU position model (beslisser, inkoper, adviseur, gebruiker, beinvloeder, overig)
  - Customer journey timeline view in ContactsTab
  - CustomerJourneySummary dashboard card
  - DmuMatrix Nr. column for contact order
  - Blokkade registration via system events
  - useSystemEvents React Query hook
  - DMU data migration function
affects: [19-gesprekken-tab-acties-upgrade, 20-vergelijking-waarde-optimalisatie, 21-dmu-export-upgrade]

tech-stack:
  added: []
  patterns: [DMU role hierarchy ordering, view toggle with localStorage, timeline aggregation from multiple data sources, system event blokkade pattern]

key-files:
  created:
    - src/hooks/useSystemEvents.ts
    - src/features/school-profile/components/CustomerJourneyTimeline.tsx
    - src/features/school-profile/components/CustomerJourneySummary.tsx
    - src/features/school-profile/components/ContactGroupHeader.tsx
    - src/features/school-profile/components/BlockadeForm.tsx
  modified:
    - src/models/school.ts
    - src/components/ui/DMUBadge.tsx
    - src/db/types.ts
    - src/db/operations.ts
    - src/features/school-profile/tabs/ContactsTab.tsx
    - src/features/school-profile/tabs/DashboardTab.tsx
    - src/features/school-profile/components/DmuMatrix.tsx
    - src/features/school-profile/components/ContactForm.tsx

key-decisions:
  - "DMU_POSITION_ORDER as constant for hierarchy display sorting"
  - "DMU_MIGRATION_MAP for one-time migration with localStorage guard"
  - "Blokkades stored as system_events with blokkade_registered event type"
  - "Contact order derived from earliest conversation date per contact"
  - "View toggle persisted via localStorage (not Zustand) following existing pattern"

patterns-established:
  - "DMU hierarchy ordering: use DMU_POSITIONS array order for display sorting"
  - "System event type extension: add new event types to SystemEvent union without DB changes"
  - "Timeline aggregation: merge conversations + system events into chronological entries"

requirements-completed: []

duration: 9min
completed: 2026-03-25
---

# Phase 18 Plan 01: DMU Role Model Upgrade, Klantreis Timeline & Dashboard Integration Summary

**6-role DMU position model with migration, customer journey timeline in ContactsTab, and klantreis summary dashboard card with contact order tracking**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-25T20:37:35Z
- **Completed:** 2026-03-25T20:47:00Z
- **Tasks:** 4
- **Files modified:** 17

## Accomplishments

- Upgraded DMU positions from 4 (coordinator/mt/finance/overig) to 6 (beslisser/inkoper/adviseur/gebruiker/beinvloeder/overig) with hierarchy ordering and migration mapping
- Built customer journey timeline aggregating conversations and system events chronologically, with blokkade registration and first-contact marking
- Added ContactsTab view toggle between DMU-overzicht (grouped by role) and Klantreis (timeline) views
- Created CustomerJourneySummary dashboard card showing eerste aanspreekpunt, beslisser, DMU-bereik progress, and active blokkade
- Added Nr. column to DmuMatrix showing contact order based on earliest conversation date

## Task Commits

1. **Task 1: DMU data model upgrade + migration** - `45cbef7` (feat)
2. **Task 2: ContactsTab view toggle + timeline components** - `e8bb0f1` (feat)
3. **Task 3: Dashboard integration + DmuMatrix upgrade** - `6fc01ec` (feat)
4. **Task 4: Test updates + build verification** - `766aaaf` (test)

## Files Created/Modified

### Created
- `src/hooks/useSystemEvents.ts` - React Query hook for system events (fetch + create)
- `src/features/school-profile/components/CustomerJourneyTimeline.tsx` - Chronological timeline from conversations + events with blokkade registration
- `src/features/school-profile/components/CustomerJourneySummary.tsx` - Dashboard card: eerste aanspreekpunt, beslisser, DMU-bereik, huidige blokkade
- `src/features/school-profile/components/ContactGroupHeader.tsx` - Collapsible DMU role group header with badge and count
- `src/features/school-profile/components/BlockadeForm.tsx` - Inline form for registering blokkades with optional contact reference

### Modified
- `src/models/school.ts` - New DMU_POSITIONS (6 roles), DMU_POSITION_ORDER, DMU_MIGRATION_MAP
- `src/components/ui/DMUBadge.tsx` - New colors per UI-SPEC, added size prop
- `src/db/types.ts` - Added blokkade_registered to SystemEvent eventType union
- `src/db/operations.ts` - Added migrateDmuPositions() one-time migration function
- `src/db/migrations.ts` - Updated default dmuPosition from 'coordinator' to 'gebruiker'
- `src/features/school-profile/tabs/ContactsTab.tsx` - View toggle, DMU grouping, timeline integration
- `src/features/school-profile/tabs/DashboardTab.tsx` - CustomerJourneySummary + conversations passed to DmuMatrix
- `src/features/school-profile/components/DmuMatrix.tsx` - Nr. column with contact order, conversations prop
- `src/features/school-profile/components/ContactForm.tsx` - Default dmuPosition updated to 'gebruiker'
- `src/features/school-profile/components/ConversationForm.tsx` - mapDmuPosition updated for new roles
- `src/features/intake/IntakePanel.tsx` - mapDmuPosition updated for new roles
- `src/components/wizard/DMUContextPanel.tsx` - Scenario-DMU mapping updated to new roles

## Decisions Made

- DMU_POSITION_ORDER as separate constant (not derived from array index) for explicit hierarchy control
- Blokkades stored in existing system_events table with `blokkade_registered` event type and metadata including resolved flag
- Contact order computed in DmuMatrix via useMemo with conversations dependency for reactivity
- View toggle uses localStorage directly (not Zustand) following existing viewPreference pattern from Phase 7
- Export system DmuTarget type (coordinator/mt/finance) intentionally NOT changed -- separate concept from DMU position, deferred to Phase 21

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all components are wired to live data sources.

## Next Phase Readiness

- DMU positions upgraded and all consuming components updated
- Timeline infrastructure ready for Phase 19 (gesprekken-tab) enhancements
- Export system still uses old DmuTarget names (coordinator/mt/finance) -- intentional, Phase 21 scope
- migrateDmuPositions() needs to be called at app startup (e.g., in a useEffect in RootLayout or SchoolLayout)

## Self-Check: PASSED

- All 5 created files exist on disk
- All 4 task commits verified in git log (45cbef7, e8bb0f1, 6fc01ec, 766aaaf)
- 564 tests pass, build succeeds

---
*Phase: 18-contactbeheer-upgrade-klantreis-inzicht*
*Completed: 2026-03-25*
