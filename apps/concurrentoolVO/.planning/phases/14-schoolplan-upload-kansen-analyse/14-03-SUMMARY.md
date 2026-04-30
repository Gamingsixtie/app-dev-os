---
phase: 14-schoolplan-upload-kansen-analyse
plan: 03
subsystem: ui
tags: [react, tailwind, tanstack-router, schoolplan, kans-kaarten, streaming-progress]

# Dependency graph
requires:
  - phase: 14-01
    provides: "Supabase schema, hooks (useSchoolplanAnalysis), lib (schoolplan-analyzer), schema types"
provides:
  - "SchoolplanTab (7th tab) with 4 visual states: empty, analyzing, results, error"
  - "KansCard component with full D-03 fields and annotation controls"
  - "KansCardList with relevance sorting and 'Mogelijk ook relevant' section"
  - "SchoolplanUpload metadata bar with replace functionality"
  - "SchoolplanSummary AI summary card"
  - "SchoolplanStreamingProgress two-step progress indicator"
  - "Route /scholen/$slug/schoolplan registered in TanStack Router"
affects: [schoolplan-upload-kansen-analyse, school-profile]

# Tech tracking
tech-stack:
  added: []
  patterns: [streaming-progress-indicator, kans-card-annotation-pattern, replace-confirmation-dialog]

key-files:
  created:
    - src/features/school-profile/tabs/SchoolplanTab.tsx
    - src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx
    - src/features/school-profile/components/SchoolplanUpload.tsx
    - src/features/school-profile/components/SchoolplanSummary.tsx
    - src/features/school-profile/components/KansCard.tsx
    - src/features/school-profile/components/KansCardList.tsx
    - src/features/school-profile/components/SchoolplanStreamingProgress.tsx
  modified:
    - src/router/routes.ts
    - src/features/school-profile/components/TabNavigation.tsx

key-decisions:
  - "KansCard compact variant maps AlsoRelevantItem fields to SchoolplanOpportunity shape for component reuse"
  - "Relevance sorting uses numeric order map (hoog=0, midden=1, laag=2) for stable sort"
  - "Non-schoolplan detection checks if summary is empty AND opportunities array is empty"

patterns-established:
  - "KansCard annotation pattern: toggle status buttons + note input with save-on-change"
  - "Replace confirmation dialog pattern: fixed overlay with cancel/confirm buttons"
  - "SchoolplanStreamingProgress: two-step progress with SVG icons matching StreamingExtraction pattern"

requirements-completed: [SC-01, SC-02, SC-03, SC-04, SC-05]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 14 Plan 03: Schoolplan Tab UI Summary

**Complete Schoolplan tab with upload dropzone, two-step streaming progress, KansCards with relevance badges and annotation controls, replace confirmation dialog, and 7th tab in school profile navigation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T18:17:12Z
- **Completed:** 2026-03-23T18:22:08Z
- **Tasks:** 2 of 3 (Task 3 is visual checkpoint -- pending human verification)
- **Files modified:** 9

## Accomplishments
- Registered /schoolplan route and added 7th "Schoolplan" tab to school profile navigation
- Built 5 new UI components: SchoolplanUpload, SchoolplanSummary, KansCard, KansCardList, SchoolplanStreamingProgress
- Created SchoolplanTab container handling 4 states (empty, analyzing, results, error) with all hooks wired
- KansCard displays all D-03 fields with relevance badges (hoog/midden/laag), annotation toggles, note input
- Test stub passes for SchoolplanTab component

## Task Commits

Each task was committed atomically:

1. **Task 1: Route registration, TabNavigation update, and all UI components** - `a872f25` (feat)
2. **Task 2: SchoolplanTab container with state management and test stub** - `1923a1c` (feat)
3. **Task 3: Visual verification** - PENDING (checkpoint:human-verify)

## Files Created/Modified
- `src/router/routes.ts` - Added schoolplanRoute with /schoolplan path
- `src/features/school-profile/components/TabNavigation.tsx` - Added 7th Schoolplan tab entry
- `src/features/school-profile/components/SchoolplanUpload.tsx` - Document metadata bar with filename, date, page count, replace button
- `src/features/school-profile/components/SchoolplanSummary.tsx` - AI summary card with italic text
- `src/features/school-profile/components/KansCard.tsx` - Full opportunity card with D-03 fields, relevance badges, competitor section, annotation controls
- `src/features/school-profile/components/KansCardList.tsx` - Sorted card list with main and "Mogelijk ook relevant" sections
- `src/features/school-profile/components/SchoolplanStreamingProgress.tsx` - Two-step progress indicator with SVG icons
- `src/features/school-profile/tabs/SchoolplanTab.tsx` - Main tab container with 4 states and all hook wiring
- `src/features/school-profile/tabs/__tests__/SchoolplanTab.test.tsx` - Test stub verifying component exports

## Decisions Made
- KansCard compact variant maps AlsoRelevantItem fields to SchoolplanOpportunity shape for component reuse rather than creating a separate component
- Non-schoolplan detection checks both empty summary AND empty opportunities array
- Relevance sorting uses numeric order map for stable sort behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused variable in KansCardList**
- **Found during:** Task 1
- **Issue:** TypeScript error: `i` declared but never read in sorted.map callback
- **Fix:** Removed unused `i` parameter from map callback
- **Files modified:** src/features/school-profile/components/KansCardList.tsx
- **Verification:** Build passes
- **Committed in:** a872f25 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial TypeScript strictness fix. No scope creep.

## Issues Encountered
None

## Known Stubs
None -- all components are fully wired to hooks and data sources from Plan 01.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task 3 (visual verification checkpoint) pending human review
- All UI components built and build-verified
- Ready for end-to-end visual testing once server is running

---
*Phase: 14-schoolplan-upload-kansen-analyse*
*Completed: 2026-03-23 (Tasks 1-2; Task 3 pending)*
