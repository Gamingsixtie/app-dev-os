---
phase: 13-architectuur-review-go-live
plan: 02
subsystem: database
tags: [typescript, supabase, offline-queue, type-safety]

# Dependency graph
requires:
  - phase: 12-dmu-export-offline
    provides: offline-queue.ts with queueIfOffline pattern
provides:
  - Type-safe OfflineQueueTable union for offline mutation queue
  - Green production build (tsc + vite)
affects: [offline-sync, operations]

# Tech tracking
tech-stack:
  added: []
  patterns: [type assertion for dynamic supabase.from() calls in sync functions]

key-files:
  created: []
  modified:
    - src/lib/offline-queue.ts
    - src/db/operations.ts

key-decisions:
  - "OfflineQueueTable union type at entry point; type assertion (as any) for dynamic sync calls"
  - "Include all 7 DB tables in OfflineQueueTable for forward compatibility"

patterns-established:
  - "Dynamic supabase.from() in sync functions use 'as any' with eslint-disable comment"

requirements-completed: [REVIEW-01]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 13 Plan 02: Build Fix Summary

**Type-safe OfflineQueueTable union replacing string type on PendingMutation.table, fixing build-blocking TypeScript error**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T22:14:53Z
- **Completed:** 2026-03-24T22:19:10Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed build-blocking TypeScript error in offline-queue.ts where supabase.from() rejected string-typed table name
- Added OfflineQueueTable type union covering all 7 database tables used in the application
- Updated PendingMutation.table and queueIfOffline parameter to use OfflineQueueTable instead of string
- Verified production build succeeds (tsc + vite) with zero TypeScript errors
- Verified client bundle does not contain mammoth or pdf-parse serverless-only libraries

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix offline-queue.ts TypeScript error and verify build** - `4e45993` (fix)

## Files Created/Modified
- `src/lib/offline-queue.ts` - Added OfflineQueueTable type union, changed PendingMutation.table type, added type assertions for dynamic supabase.from() calls
- `src/db/operations.ts` - Imported OfflineQueueTable type, updated queueIfOffline parameter type

## Decisions Made
- Used OfflineQueueTable type union at entry points (PendingMutation interface, queueIfOffline function) for compile-time safety
- Used `as any` type assertion for dynamic supabase.from() calls in the sync function, since the table name comes from the queue at runtime and the Supabase generic creates complex union types that reject Record<string, unknown> payloads
- Included all 7 database tables in the union (schools, contacts, conversations, actions, school_prices, system_events, schoolplan_analyses) for forward compatibility even though only 4 are currently used with queueIfOffline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures in price-comparison feature (ComparisonTable.test.tsx, ModuleDetailPanel.test.tsx) caused by parallel agent worktree changes to visibleProviders. Not related to this plan's changes. All other 437 tests pass.
- The xlsx library appears in the client bundle as a separate chunk, but this is intentional (used for client-side Excel import in SchoolListImportDialog), not a serverless-only library.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Production build is green and deployable to Vercel
- Client bundle verified clean of serverless-only dependencies
- Ready for remaining Phase 13 plans (13-03)

---
*Phase: 13-architectuur-review-go-live*
*Completed: 2026-03-24*

## Self-Check: PASSED
