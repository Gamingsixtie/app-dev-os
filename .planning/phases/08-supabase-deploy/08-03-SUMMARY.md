---
phase: 08-supabase-deploy
plan: 03
subsystem: database
tags: [supabase, react-query, crud, uuid, audit-trail, tanstack-query]

# Dependency graph
requires:
  - phase: 08-01
    provides: Supabase client, Database types, environment config
  - phase: 08-02
    provides: AuthProvider, useAuth hook, user session management
provides:
  - All CRUD operations rewritten for Supabase (schools, contacts, conversations, actions, system_events)
  - React Query hooks for data fetching (useSchools, useContacts, useConversations, useActions)
  - QueryClientProvider wired at app root with AuthProvider
  - Snake_case/camelCase mapping layer between Supabase and TypeScript
  - ownerName populated via users table join
affects: [08-04, 08-05, ui-components, school-profile, school-overview]

# Tech tracking
tech-stack:
  added: [@tanstack/react-query]
  patterns: [supabase-crud-with-mapping, react-query-hooks, audit-trail-on-mutations]

key-files:
  created:
    - src/hooks/useSchools.ts
    - src/hooks/useContacts.ts
    - src/hooks/useConversations.ts
    - src/hooks/useActions.ts
  modified:
    - src/db/types.ts
    - src/db/operations.ts
    - src/lib/slugify.ts
    - src/main.tsx

key-decisions:
  - "SchoolRecord.id changed from optional number to required string (UUID) for Supabase compatibility"
  - "CRM data (contacts, conversations, actions) moved from embedded arrays to separate tables with own hooks"
  - "mapSchoolRow returns empty arrays for contacts/conversations/actions since they are loaded separately via hooks"
  - "canDeleteContact changed from pure function to async Supabase query"

patterns-established:
  - "Snake_case mapping: All Supabase rows mapped via mapXxxRow() helpers to camelCase TypeScript interfaces"
  - "Audit trail: Every mutation sets created_by/updated_by with getCurrentUser().id"
  - "React Query invalidation: Mutations invalidate related query keys for automatic refetch"
  - "Owner join: getAllSchools and getSchoolBySlug use select('*, owner:users!owner_id(name)') for ownerName"

requirements-completed: [ARCH-01, ARCH-03, AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 08 Plan 03: Data Layer Migration Summary

**All CRUD operations rewritten from Dexie/IndexedDB to Supabase with React Query hooks, UUID ids, audit trail, and ownerName join**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T11:09:57Z
- **Completed:** 2026-03-22T11:12:45Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Rewrote 15+ CRUD functions in operations.ts from Dexie to Supabase with snake_case/camelCase mapping
- Changed SchoolRecord.id from number to string (UUID) with audit fields on all entity types
- Created 4 React Query hook files providing useQuery/useMutation for schools, contacts, conversations, and actions
- Wired QueryClientProvider with 1-minute staleTime and AuthProvider at app root in main.tsx
- Added ownerName via users table join in getAllSchools and getSchoolBySlug

## Task Commits

Each task was committed atomically:

1. **Task 1: Update types and rewrite operations.ts for Supabase** - `716fa71` (feat)
2. **Task 2: Create React Query hooks, wire QueryClientProvider** - `8e30f16` (feat)

## Files Created/Modified
- `src/db/types.ts` - Updated SchoolRecord.id to string, added audit fields, ownerName, SchoolPriceEntry interface
- `src/db/operations.ts` - Complete rewrite from Dexie to Supabase with mapping helpers and auth integration
- `src/lib/slugify.ts` - Changed slug uniqueness check from Dexie to Supabase query
- `src/hooks/useSchools.ts` - React Query hooks for school CRUD (useSchools, useSchool, useCreateSchool, useUpdateSchool, useDeleteSchool)
- `src/hooks/useContacts.ts` - React Query hooks for contact CRUD with direct Supabase query
- `src/hooks/useConversations.ts` - React Query hooks for conversations, invalidates contacts on create
- `src/hooks/useActions.ts` - React Query hooks for action CRUD
- `src/main.tsx` - Added QueryClientProvider and AuthProvider wrapping the app

## Decisions Made
- SchoolRecord.id changed from optional number to required string UUID -- all downstream consumers must update
- CRM data (contacts, conversations, actions) now lives in separate Supabase tables instead of embedded arrays in SchoolRecord -- mapSchoolRow returns empty arrays for these fields since they are loaded via dedicated hooks
- canDeleteContact changed from a synchronous pure function (operating on SchoolRecord) to an async function querying the conversations table
- addSystemEvent signature updated: dropped id/timestamp/schoolId from the event parameter since Supabase handles those

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] canDeleteContact signature change**
- **Found during:** Task 1
- **Issue:** Plan showed canDeleteContact taking `(school, contactId)` with school as SchoolRecord object, but with separate tables this function should query Supabase directly
- **Fix:** Changed to `canDeleteContact(schoolId: string, contactId: string)` with a Supabase count query on conversations
- **Files modified:** src/db/operations.ts
- **Verification:** Function correctly queries conversations table for linked records

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary adaptation for separate table architecture. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer fully migrated to Supabase -- ready for Plan 04 (RLS policies) and Plan 05 (UI component updates)
- Components still use old Dexie-based useLiveQuery -- Plan 05 will replace with the new React Query hooks
- SchoolRecord.id type change (number to string) will require updates in all components that reference school IDs

## Self-Check: PASSED

All 8 files verified present on disk. Both task commits (716fa71, 8e30f16) verified in git log.

---
*Phase: 08-supabase-deploy*
*Completed: 2026-03-22*
