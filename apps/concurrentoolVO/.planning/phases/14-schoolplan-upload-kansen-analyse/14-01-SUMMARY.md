---
phase: 14-schoolplan-upload-kansen-analyse
plan: 01
subsystem: database, api, ui
tags: [zod, supabase, react-query, sse, ai-model-config, schoolplan]

# Dependency graph
requires:
  - phase: 08-supabase-auth-migration
    provides: Supabase client, auth, RLS patterns, migration numbering
  - phase: 09-school-prices-document-upload
    provides: Document upload pattern (document-parser.ts), Supabase Storage usage
provides:
  - Zod schemas for AI schoolplan analysis structured output (6 types)
  - Supabase migration 004 for schoolplan_analyses table with UNIQUE school_id constraint
  - AI model config abstraction layer (configurable via env var)
  - React Query hooks for schoolplan CRUD and annotation updates
  - Client-side upload orchestrator with SSE streaming support
  - SchoolplanAnalysisRow database type
affects: [14-02, 14-03, schoolplan-tab-ui, serverless-analyze-endpoint]

# Tech tracking
tech-stack:
  added: []
  patterns: [SSE streaming for multi-step AI analysis, JSONB annotation merging, upsert with onConflict for one-per-school constraint]

key-files:
  created:
    - src/features/school-profile/schemas/schoolplan-analysis.schema.ts
    - src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts
    - src/lib/ai-model-config.ts
    - supabase/migrations/004_schoolplan_analyses.sql
    - src/hooks/useSchoolplanAnalysis.ts
    - src/hooks/__tests__/useSchoolplanAnalysis.test.ts
    - src/lib/schoolplan-analyzer.ts
  modified:
    - src/db/types.ts
    - src/lib/supabase/types.ts

key-decisions:
  - "Inline getAuthHeaders in schoolplan-analyzer.ts to avoid circular imports (same pattern as document-parser.ts)"
  - "SSE event types: step, result, error for streaming analysis progress"
  - "JSONB merge pattern for opportunity_annotations: read current, spread, write back"

patterns-established:
  - "SSE streaming pattern: fetch with ReadableStream reader, parse 'data: ' lines as JSON events"
  - "Upsert with onConflict for one-per-school entities"
  - "AI model abstraction via getModelConfig() with env var override"

requirements-completed: [SC-01, SC-02, SC-05]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 14 Plan 01: Data Foundation Summary

**Zod schemas for AI schoolplan analysis output, Supabase migration with UNIQUE school_id constraint, model config abstraction, React Query hooks with annotation CRUD, and SSE-streaming upload orchestrator**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T18:06:03Z
- **Completed:** 2026-03-23T18:12:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- 6 Zod types (RelevanceScore, CompetitorVulnerability, SchoolplanOpportunity, AlsoRelevantItem, SchoolplanAnalysisResult, OpportunityAnnotation) with full test coverage
- Supabase migration 004 with schoolplan_analyses table, UNIQUE constraint on school_id, RLS policies, and updated_at trigger
- AI model config defaulting to claude-sonnet-4-20250514 with SCHOOLPLAN_AI_MODEL env override
- React Query hooks (useSchoolplanAnalysis, useUpdateAnnotation, useDeleteSchoolplanAnalysis) following established patterns
- Client-side orchestrator with file validation (PDF/DOCX/TXT only), Storage upload, DB upsert, and SSE stream parsing

## Task Commits

Each task was committed atomically:

1. **Task 1: Zod schemas, model config, Supabase migration, and schema test stub** - `84d6a82` (feat)
2. **Task 2: React Query hook, client-side upload orchestrator, and hook test stub** - `a3fadd5` (feat)

## Files Created/Modified
- `src/features/school-profile/schemas/schoolplan-analysis.schema.ts` - Zod schemas for AI structured output (6 types)
- `src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts` - 5 tests for schema validation
- `src/lib/ai-model-config.ts` - AI model abstraction with env var override
- `supabase/migrations/004_schoolplan_analyses.sql` - schoolplan_analyses table with RLS
- `src/hooks/useSchoolplanAnalysis.ts` - React Query hooks for schoolplan CRUD
- `src/hooks/__tests__/useSchoolplanAnalysis.test.ts` - 3 tests for hook exports
- `src/lib/schoolplan-analyzer.ts` - Client-side upload + SSE analysis orchestrator
- `src/db/types.ts` - Added SchoolplanAnalysisRow interface
- `src/lib/supabase/types.ts` - Added schoolplan_analyses to Supabase Database type

## Decisions Made
- Inline getAuthHeaders in schoolplan-analyzer.ts to avoid circular imports (same pattern as document-parser.ts from Phase 09)
- SSE event protocol: `step` (progress), `result` (final data), `error` (failure) -- consumed by client orchestrator
- JSONB merge pattern for opportunity_annotations: read current, merge new annotation by index key, write back

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused imports from schema test file**
- **Found during:** Task 1
- **Issue:** AlsoRelevantItem, RelevanceScore, CompetitorVulnerability imported but unused, causing TS6133 build errors
- **Fix:** Removed unused imports from test file
- **Files modified:** src/features/school-profile/schemas/__tests__/schoolplan-analysis.schema.test.ts
- **Committed in:** 84d6a82 (Task 1 commit)

**2. [Rule 3 - Blocking] Added schoolplan_analyses to Supabase Database types**
- **Found during:** Task 2
- **Issue:** TypeScript build failed because supabase.from('schoolplan_analyses') was not a known table in the generated Database type
- **Fix:** Added schoolplan_analyses Row/Insert/Update types to src/lib/supabase/types.ts
- **Files modified:** src/lib/supabase/types.ts
- **Committed in:** a3fadd5 (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed Json type compatibility in hooks and orchestrator**
- **Found during:** Task 2
- **Issue:** TypeScript errors for JSONB fields: Record<string, unknown> not assignable to Json, unknown[] not assignable to Json[]
- **Fix:** Added explicit Json type imports and casts for JSONB column operations
- **Files modified:** src/hooks/useSchoolplanAnalysis.ts, src/lib/schoolplan-analyzer.ts
- **Committed in:** a3fadd5 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for build correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all files contain production logic, no placeholder data.

## Next Phase Readiness
- Data layer complete: schemas, types, hooks, and orchestrator ready for UI (Plan 02) and serverless function (Plan 03)
- All exports match the must_haves artifact contracts from the plan
- Build passes with zero errors, 8 tests passing

---
*Phase: 14-schoolplan-upload-kansen-analyse*
*Completed: 2026-03-23*
