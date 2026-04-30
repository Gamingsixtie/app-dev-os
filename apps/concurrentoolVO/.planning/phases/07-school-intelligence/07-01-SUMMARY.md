---
phase: 07-school-intelligence
plan: 01
subsystem: database
tags: [dexie, indexeddb, zod, crm, types, migration, crud]

# Dependency graph
requires:
  - phase: 06-multi-school-data-layer
    provides: Dexie v1 SchoolRecord, database.ts, operations.ts
provides:
  - Contact, Conversation, SystemEvent, ActionItem, LostDealInfo types
  - PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel enums with label maps
  - Dexie v2 schema with pipelineStatus index and upgrade migration
  - CRUD operations for contacts, conversations, actions, pipeline status
  - Zod validation schemas for contact, conversation, action forms
  - buildTimeline utility for merging conversations and system events
affects: [07-02, 07-03, 07-04, 08-ai-intake, 11-dmu-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [embedded-arrays-in-dexie, crm-crud-on-school-record, zod-input-vs-output-types]

key-files:
  created:
    - src/models/timeline.ts
    - src/features/school-profile/schemas/contact.schema.ts
    - src/features/school-profile/schemas/conversation.schema.ts
    - src/features/school-profile/schemas/action.schema.ts
    - src/models/__tests__/school-crm.test.ts
    - src/models/__tests__/timeline.test.ts
    - src/features/school-profile/schemas/__tests__/crm-schemas.test.ts
  modified:
    - src/models/school.ts
    - src/db/types.ts
    - src/db/database.ts
    - src/db/operations.ts
    - src/db/migrations.ts
    - src/db/__tests__/database.test.ts
    - src/db/__tests__/operations.test.ts
    - src/features/school-profile/__tests__/wizard-navigation.test.tsx
    - src/router/__tests__/guards.test.ts

key-decisions:
  - "Use z.input<typeof schema> for operation function params to allow optional fields with defaults"
  - "Embedded arrays in SchoolRecord for contacts/conversations/actions (sufficient for 50-200 schools scale)"

patterns-established:
  - "CRM CRUD pattern: getSchoolOrThrow -> modify array -> updateSchoolData"
  - "System event logging on state changes (pipeline, school creation)"
  - "isPrimary contact enforcement: setting one unsets all others"

requirements-completed: [SCHOOL-01, SCHOOL-02, SCHOOL-03, SCHOOL-04, SCHOOL-05, PRIJS-07]

# Metrics
duration: 8min
completed: 2026-03-21
---

# Phase 7 Plan 1: CRM-lite Data Model Summary

**Extended SchoolRecord with CRM-lite types, Dexie v2 migration, CRUD operations for contacts/conversations/actions/pipeline, Zod validation schemas, and timeline utility**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T23:14:28Z
- **Completed:** 2026-03-21T23:22:34Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Extended SchoolRecord with 9 new CRM-lite fields (contacts, conversations, actions, systemEvents, pipelineStatus, lostDealInfo, region, tags, viewPreference)
- Created 6 new type/enum definitions with Dutch label maps (PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel)
- Implemented 12 CRUD operations with isPrimary contact enforcement, delete protection, and lastContactDate auto-update
- Added Dexie v2 schema migration with pipelineStatus index and safe upgrade from v1 records
- Created 3 Zod validation schemas for forms (contact, conversation, action)
- Built timeline utility that merges conversations and system events sorted newest-first
- All 201 tests pass, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Define types, enums and Zod schemas** - `30a1eed` (feat)
2. **Task 2: Dexie v2 migration and CRUD operations** - `7f96332` (feat)

## Files Created/Modified
- `src/models/school.ts` - Added PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel types with const arrays and label maps
- `src/models/timeline.ts` - TimelineEvent union type and buildTimeline merge+sort utility
- `src/db/types.ts` - Contact, Conversation, SystemEvent, ActionItem, LostDealInfo interfaces; extended SchoolRecord
- `src/db/database.ts` - Dexie version(2) with pipelineStatus index and upgrade migration
- `src/db/operations.ts` - 12 new CRUD operations (addContact, updateContact, deleteContact, canDeleteContact, addConversation, updateConversation, addAction, updateAction, deleteAction, setPipelineStatus, addSystemEvent, validatePipelineTransition)
- `src/db/migrations.ts` - Updated v1-to-school migration to include CRM-lite defaults
- `src/features/school-profile/schemas/contact.schema.ts` - Zod v4 schema for contact form
- `src/features/school-profile/schemas/conversation.schema.ts` - Zod v4 schema for conversation form
- `src/features/school-profile/schemas/action.schema.ts` - Zod v4 schema for action form
- `src/models/__tests__/school-crm.test.ts` - Tests for CRM enums and types
- `src/models/__tests__/timeline.test.ts` - Tests for buildTimeline utility
- `src/features/school-profile/schemas/__tests__/crm-schemas.test.ts` - Tests for all 3 Zod schemas
- `src/db/__tests__/operations.test.ts` - Extended with 19 new CRM operation tests
- `src/db/__tests__/database.test.ts` - Added v2 schema and migration tests

## Decisions Made
- Used `z.input<typeof schema>` for CRUD operation function parameters to allow callers to omit fields that have Zod defaults (e.g., tags, status, preferredChannel)
- Embedded arrays in SchoolRecord rather than separate Dexie tables -- sufficient for the expected scale of 50-200 schools per user

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated existing test and source files for SchoolRecord type compatibility**
- **Found during:** Task 1 (after extending SchoolRecord interface)
- **Issue:** 5 existing files created SchoolRecord objects without new CRM fields, causing TypeScript build errors
- **Fix:** Added CRM-lite default values to all SchoolRecord object literals in migrations.ts, database.test.ts, wizard-navigation.test.tsx, guards.test.ts
- **Files modified:** src/db/migrations.ts, src/db/__tests__/database.test.ts, src/features/school-profile/__tests__/wizard-navigation.test.tsx, src/router/__tests__/guards.test.ts
- **Verification:** `npm run build` exits 0, all 201 tests pass
- **Committed in:** 30a1eed (Task 1 commit)

**2. [Rule 3 - Blocking] Used z.input types for operation parameters**
- **Found during:** Task 2 (TypeScript build errors with optional Zod fields)
- **Issue:** `z.infer` produces output types (all fields required after defaults), but CRUD callers pass partial input
- **Fix:** Changed from `ContactFormData` (z.infer) to `ContactFormInput` (z.input) for operation function params
- **Files modified:** src/db/operations.ts
- **Verification:** `npm run build` exits 0
- **Committed in:** 7f96332 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for type-safe compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## Known Stubs
None - all types, operations, and schemas are fully implemented with real logic.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All CRM-lite types and operations ready for UI consumption in plans 07-02, 07-03, 07-04
- Zod schemas ready for react-hook-form integration in profile tab forms
- buildTimeline ready for conversation/system event timeline rendering
- validatePipelineTransition ready for pipeline UI interactions

---
*Phase: 07-school-intelligence*
*Completed: 2026-03-21*
