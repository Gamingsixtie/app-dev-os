---
phase: 07-school-intelligence
plan: 02
subsystem: ui
tags: [react, tanstack-router, zustand, tabs, pipeline, crm, profile]

# Dependency graph
requires:
  - phase: 07-school-intelligence
    provides: CRM-lite types, Dexie v2 schema, CRUD operations, pipeline validation
provides:
  - Tabbed school profile shell with ProfileHeader + TabNavigation
  - PipelineBadge color-coded status component
  - LostDealDialog and PipelineReasonDialog for pipeline transitions
  - DashboardTab with summary block, context-smart actions, inline-editable school data
  - ComparisonTab wrapping existing comparison pages by scenario
  - ProductsTab with module usage and school-specific vs publication price distinction
  - Nested tab routes under /scholen/$slug/
affects: [07-03, 07-04, 08-ai-intake, 11-dmu-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [tabbed-profile-layout, context-smart-actions, pipeline-status-ui, inline-editing]

key-files:
  created:
    - src/components/ui/PipelineBadge.tsx
    - src/features/school-profile/components/ProfileHeader.tsx
    - src/features/school-profile/components/TabNavigation.tsx
    - src/features/school-profile/components/LostDealDialog.tsx
    - src/features/school-profile/components/PipelineReasonDialog.tsx
    - src/features/school-profile/tabs/DashboardTab.tsx
    - src/features/school-profile/tabs/ComparisonTab.tsx
    - src/features/school-profile/tabs/ProductsTab.tsx
  modified:
    - src/router/routes.ts
    - src/components/routing/SchoolLayout.tsx
    - src/features/school-profile/store.ts
    - src/components/ui/DMUBadge.tsx

key-decisions:
  - "ComparisonTab wraps existing page components without duplicating logic -- scenario routing determines which page renders"
  - "Context-smart actions map pipeline status to recommended next step and target tab"
  - "ProfileHeader hides on wizard paths via useRouterState pathname check"

patterns-established:
  - "Tab routing: nested routes under schoolRoute with dedicated tab components"
  - "Context-smart CTA: pipeline-status-driven primary action button in header and dashboard"
  - "Inline editing pattern: toggle between display and edit mode in DashboardTab"
  - "School-specific vs publication price distinction via override detection in ProductsTab"

requirements-completed: [SCHOOL-01, SCHOOL-02, SCHOOL-05, PRIJS-07]

# Metrics
duration: 10min
completed: 2026-03-21
---

# Phase 7 Plan 2: School Profile Shell Summary

**Tabbed school profile with dashboard, pipeline management, context-smart actions, comparison integration and products overview with price source distinction**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-21T23:26:36Z
- **Completed:** 2026-03-21T23:36:54Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Built ProfileHeader with school name, pipeline dropdown (guarded by LostDealDialog/PipelineReasonDialog), and context-smart CTA that adapts label per pipeline status
- Created TabNavigation with 5 tabs (Overzicht/Vergelijking/Producten/Contacten/Gesprekken) as nested routes
- DashboardTab shows summary block (pipeline badge, module count, contact count, last contact date), pipeline-smart action buttons, and inline-editable school data
- ComparisonTab routes to PriceComparisonPage, CurrentVsProposedPage, or MigrationPage based on scenario and module setups
- ProductsTab shows per-module cards with provider info and clear school-specific vs publication price distinction (PRIJS-07)
- Extended school-profile Zustand store with all CRM-lite fields from Plan 01
- Tab navigation hidden on wizard paths to preserve wizard UX

## Task Commits

Each task was committed atomically:

1. **Task 1: Router tab routes, PipelineBadge, DMUBadge and profile shell components** - `8a50a35` (feat) - Note: committed alongside Plan 03 parallel agent
2. **Task 2: DashboardTab, ComparisonTab and ProductsTab** - `e288a9c` (feat)

## Files Created/Modified
- `src/components/ui/PipelineBadge.tsx` - Color-coded pipeline status badge with 6 status styles
- `src/components/ui/DMUBadge.tsx` - Adjusted padding to match UI spec
- `src/features/school-profile/components/ProfileHeader.tsx` - School name, pipeline dropdown, context-smart CTA, dialog guards
- `src/features/school-profile/components/TabNavigation.tsx` - 5-tab horizontal navigation with active state detection
- `src/features/school-profile/components/LostDealDialog.tsx` - Modal for competitor selection when status set to verloren
- `src/features/school-profile/components/PipelineReasonDialog.tsx` - Modal for reason when pipeline moves backward
- `src/features/school-profile/tabs/DashboardTab.tsx` - Summary block, context-smart actions, inline-editable school data
- `src/features/school-profile/tabs/ComparisonTab.tsx` - Scenario-based routing to existing comparison pages
- `src/features/school-profile/tabs/ProductsTab.tsx` - Module usage with price source distinction
- `src/router/routes.ts` - Added schoolDashboardRoute, schoolProductsRoute, schoolContactsRoute, schoolConversationsRoute
- `src/components/routing/SchoolLayout.tsx` - Added ProfileHeader + TabNavigation, hidden on wizard paths
- `src/features/school-profile/store.ts` - Extended with pipelineStatus, contacts, conversations, actions, systemEvents, region, tags, viewPreference

## Decisions Made
- ComparisonTab wraps existing page components (PriceComparisonPage, CurrentVsProposedPage, MigrationPage) without duplicating logic -- the scenario and moduleSetups determine which page renders
- Context-smart actions table maps each pipeline status to a primary and secondary action set, each pointing to the relevant tab
- ProfileHeader detects wizard path via useRouterState pathname check rather than route matching, keeping it simple

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused import errors in parallel agent files**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan 03/04 parallel agents created Timeline.tsx with unused `buildTimeline` import, ActionKanban.tsx with unused `onAddAction` destructured param, and ConversationsTab.tsx with type mismatch on handleCreateAction
- **Fix:** Removed unused import, prefixed unused param with underscore, fixed parameter optionality
- **Files modified:** src/features/school-profile/components/Timeline.tsx, src/features/school-profile/components/ActionKanban.tsx, src/features/school-profile/tabs/ConversationsTab.tsx
- **Verification:** `npm run build` exits 0
- **Committed in:** 8a50a35 (committed by parallel agent alongside Task 1 files)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary to unblock build. No scope creep.

## Issues Encountered
- Parallel Plan 03 agent committed Task 1 files along with its own work in a single commit (8a50a35), since both agents shared the working directory. Task 1 code was verified correct in that commit.

## Known Stubs
None - all tabs render real data from the store with proper fallbacks for empty states.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile shell is ready for Plan 03 (Contacts tab) and Plan 04 (Conversations tab) to fill in their full implementations
- Pipeline management UI is complete and connected to Plan 01's CRUD operations
- Tab routing established for all 5 tabs with proper URL structure

## Self-Check: PASSED

All 11 key files verified present. Both commit hashes (8a50a35, e288a9c) verified in git log.

---
*Phase: 07-school-intelligence*
*Completed: 2026-03-21*
