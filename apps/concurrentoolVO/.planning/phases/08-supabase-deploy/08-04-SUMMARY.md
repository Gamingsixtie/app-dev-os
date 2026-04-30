---
phase: 08-supabase-deploy
plan: 04
subsystem: ui
tags: [migration, indexeddb, supabase, role-based-ui, dexie, react]

requires:
  - phase: 08-supabase-deploy (plan 01)
    provides: Supabase client and types
  - phase: 08-supabase-deploy (plan 02)
    provides: AuthProvider, useAuth hook, UserProfile interface
provides:
  - IndexedDB-to-Supabase cloud migration logic (migrateIndexedDBToSupabase)
  - CloudMigrationWizard UI with 5 states and progress tracking
  - ReadOnlyBanner for manager/viewer read-only indication
  - OwnerBadge for school card owner display
  - AuditMeta for Dutch relative time audit trail
  - SchoolOwnerFilter for Mijn scholen / Alle scholen toggle
affects: [08-supabase-deploy, school-overview, school-profile]

tech-stack:
  added: []
  patterns: [inline-type-for-parallel-safety, per-entity-migration-with-progress, dutch-relative-time]

key-files:
  created:
    - src/features/migration/CloudMigrationWizard.tsx
    - src/components/ui/ReadOnlyBanner.tsx
    - src/components/ui/OwnerBadge.tsx
    - src/components/ui/AuditMeta.tsx
    - src/features/school-overview/SchoolOwnerFilter.tsx
  modified:
    - src/db/migrations.ts

key-decisions:
  - "DexieSchoolRecord inline type used for parallel safety with Plan 08-03 (avoids SchoolRecord.id type conflict)"
  - "Contact ID mapping by insertion order for conversation/action foreign key resolution during migration"

patterns-established:
  - "Inline type for parallel-safe Dexie reads: define DexieSchoolRecord locally instead of importing SchoolRecord"
  - "Dutch relative time helper: formatRelativeTime with zojuist/min geleden/uur geleden/gisteren/date format"

requirements-completed: [ARCH-02, AUTH-02, AUTH-03, ARCH-04]

duration: 3min
completed: 2026-03-22
---

# Phase 08 Plan 04: Cloud Migration & Role-Based UI Summary

**IndexedDB-to-Supabase migration wizard with per-school progress tracking and 4 role-based UI components (ReadOnlyBanner, OwnerBadge, AuditMeta, SchoolOwnerFilter)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T11:09:58Z
- **Completed:** 2026-03-22T11:13:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Cloud migration logic reads all IndexedDB schools and pushes to 6 Supabase tables (schools, contacts, conversations, actions, system_events, school_prices) with contact/conversation ID mapping
- appliedOverrides migrated to school_prices with source="Gemigreerd uit v1" per D-05
- CloudMigrationWizard renders all 5 states (ready, migrating, success, partial-failure, failure) with Dutch copy per UI-SPEC Surface 2
- ReadOnlyBanner, OwnerBadge, AuditMeta, SchoolOwnerFilter components built per UI-SPEC Surfaces 4-7

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cloud migration logic and CloudMigrationWizard UI** - `aefc13f` (feat)
2. **Task 2: Create role-based UI components** - `c3879c7` (feat)

## Files Created/Modified
- `src/db/migrations.ts` - Cloud migration logic: migrateIndexedDBToSupabase, hasLocalData, isMigrationComplete + existing V1 migration preserved
- `src/features/migration/CloudMigrationWizard.tsx` - One-time migration wizard UI with progress bar and skip confirmation
- `src/components/ui/ReadOnlyBanner.tsx` - Info banner for non-owner users (manager/viewer)
- `src/components/ui/OwnerBadge.tsx` - Owner initial circle on school cards
- `src/components/ui/AuditMeta.tsx` - "Bijgewerkt door" metadata with Dutch relative time
- `src/features/school-overview/SchoolOwnerFilter.tsx` - Mijn scholen / Alle scholen toggle

## Decisions Made
- Used DexieSchoolRecord inline type instead of importing SchoolRecord to avoid parallel conflict with Plan 08-03 which changes SchoolRecord.id from number to string
- Contact ID mapping done by insertion order (insert contacts, read back IDs, map old->new for conversation/action foreign keys)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Migration wizard ready to integrate into auth flow (show after first login when IndexedDB has data)
- Role-based UI components ready for integration into school profile and overview pages
- SchoolOwnerFilter ready for FilterBar integration

## Self-Check: PASSED

All 7 files verified present. Both task commits (aefc13f, c3879c7) verified in git log.

---
*Phase: 08-supabase-deploy*
*Completed: 2026-03-22*
