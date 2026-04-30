---
phase: 09-ai-intake-prijsbeheer
plan: 01
subsystem: api, ui, database
tags: [zod, react-query, supabase, pricing, ai-intake, sse]

requires:
  - phase: 08-supabase-deploy
    provides: "school_prices table, Supabase client, auth infrastructure"
  - phase: 09-ai-intake-prijsbeheer (plan 00)
    provides: "Wave 0 test stubs, type definitions, SchoolPriceEntry"
provides:
  - "IntakeExtractionSchemaV2 with contactPersonen, actiePunten, pipelineSignaal"
  - "checkPriceDeviation function (>50% threshold detection)"
  - "getSchoolPriceStatus with 4 states (verified, manual, stale, unknown)"
  - "useSchoolPrices React Query hook with full CRUD + activate"
  - "priceEntrySchema Zod v4 form validation schema"
  - "PriceDeviationWarning amber badge component"
  - "SchoolPriceBadge component with unknown status"
  - "Extended serverless function with v2 prompt"
affects: [09-02, 09-03, 09-04]

tech-stack:
  added: []
  patterns:
    - "SchoolPriceStatus type extends PriceStatus with 'unknown' state"
    - "Mutual exclusion activation: deactivate all siblings, then activate target"
    - "V2 extraction schema with .default([]) for backward compatibility"

key-files:
  created:
    - "src/features/school-profile/schemas/intake-extraction.schema.ts"
    - "src/hooks/useSchoolPrices.ts"
    - "src/features/school-profile/schemas/price-entry.schema.ts"
    - "src/components/ui/PriceDeviationWarning.tsx"
    - "src/models/__tests__/price-deviation.test.ts"
  modified:
    - "src/models/pricing.ts"
    - "src/components/ui/PriceBadge.tsx"
    - "api/ai-intake.ts"
    - "src/features/school-profile/schemas/__tests__/intake-extraction.test.ts"

key-decisions:
  - "Use .default([]) on contactPersonen and actiePunten for backward compatibility with v1 extraction"
  - "Zod v4 uses 'error' instead of 'required_error' for custom error messages"
  - "Mutual exclusion activation via two sequential Supabase queries (deactivate all, then activate one)"

patterns-established:
  - "SchoolPriceStatus extends PriceStatus with 'unknown' for entries without source/verifiedAt"
  - "mapPriceRow pattern for snake_case to camelCase DB row mapping in price hooks"
  - "V2 schema shares MODULE_IDS, SCHOOL_LEVELS, PROVIDERS constants from intake-extraction.schema.ts"

requirements-completed: [INTAKE-01, INTAKE-02, INTAKE-04, PRIJSMGT-01, PRIJSMGT-02]

duration: 6min
completed: 2026-03-22
---

# Phase 09 Plan 01: Shared Foundation Summary

**Extended AI extraction schema with contact/action/pipeline fields, price deviation detection (>50% threshold), school price CRUD hooks with mutual exclusion activation, and PriceDeviationWarning component**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T20:49:41Z
- **Completed:** 2026-03-22T20:55:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- IntakeExtractionSchemaV2 with contactPersonen, actiePunten, pipelineSignaal extends v1 schema while maintaining backward compatibility
- Price deviation checker correctly identifies >50% deviations from DEFAULT_PRICES publication prices
- Full school price CRUD via React Query hooks following established useActions pattern with mutual exclusion activation
- PriceDeviationWarning renders amber inline badge with warning triangle and Dutch tooltip text
- SchoolPriceBadge supports all 4 statuses including 'unknown' for prices without source
- Serverless function extended with v2 system prompt for contacts, actions, pipeline signals
- 13 tests passing (8 price deviation + 5 intake extraction V2)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extended extraction schema, price deviation logic, and school price status** - `a7f4aca` (feat)
2. **Task 2: School prices React Query hooks, price entry schema, and updated serverless function** - `2a52e26` (feat)

## Files Created/Modified
- `src/features/school-profile/schemas/intake-extraction.schema.ts` - V2 Zod schema with MODULE_IDS, SCHOOL_LEVELS, PROVIDERS exports
- `src/models/pricing.ts` - Added SchoolPriceStatus, getSchoolPriceStatus, checkPriceDeviation
- `src/models/__tests__/price-deviation.test.ts` - 8 tests for deviation and status detection
- `src/components/ui/PriceBadge.tsx` - Added SchoolPriceBadge with 'unknown' status support
- `src/components/ui/PriceDeviationWarning.tsx` - Amber warning badge for >50% price deviations
- `src/hooks/useSchoolPrices.ts` - React Query hooks for school_prices CRUD + activation
- `src/features/school-profile/schemas/price-entry.schema.ts` - Zod v4 form schema for price entry
- `src/features/school-profile/schemas/__tests__/intake-extraction.test.ts` - 5 V2 schema tests
- `api/ai-intake.ts` - V2 system prompt with contacts, actions, pipeline signals; max_tokens 2048

## Decisions Made
- Used `.default([])` on contactPersonen and actiePunten arrays so V1 data parses without those fields
- Fixed Zod v4 incompatibility: `required_error` replaced with `error` in priceEntrySchema
- Mutual exclusion activation uses two sequential Supabase queries (deactivate all siblings, then activate target)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 required_error incompatibility**
- **Found during:** Task 2 (price entry schema creation)
- **Issue:** Zod v4 does not support `required_error` in z.number() options (only `error` or `message`)
- **Fix:** Changed `{ required_error: 'Bedrag is verplicht' }` to `{ error: 'Bedrag is verplicht' }`
- **Files modified:** src/features/school-profile/schemas/price-entry.schema.ts
- **Verification:** npm run build succeeds (Vite build passes)
- **Committed in:** 2a52e26 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for Zod v4 compatibility. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in Wave 0 test stubs (unused `expect` imports in 5 files from plan 09-00) cause `tsc -b` to fail. These are out of scope for this plan. Vite production build succeeds.

## Known Stubs
None - all artifacts are fully wired and functional.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All shared types, hooks, and utilities ready for consumption by plans 09-02 (AI intake UI), 09-03 (price management UI), and 09-04 (document upload)
- IntakeExtractionSchemaV2 ready to replace v1 schema in ai-intake.ts
- useSchoolPrices hook ready for PriceManagement tab integration

## Self-Check: PASSED

- All 9 files verified present on disk
- Commit a7f4aca verified in git log
- Commit 2a52e26 verified in git log
- 13 tests passing (8 price deviation + 5 intake extraction)
- Vite production build succeeds

---
*Phase: 09-ai-intake-prijsbeheer*
*Completed: 2026-03-22*
