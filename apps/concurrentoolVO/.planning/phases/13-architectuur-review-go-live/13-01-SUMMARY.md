---
phase: 13-architectuur-review-go-live
plan: 01
subsystem: security
tags: [rls, auth, supabase, vercel, api-hardening, storage]

# Dependency graph
requires:
  - phase: 08-supabase-migratie
    provides: Supabase auth, RLS policies, storage bucket setup
  - phase: 14-schoolplan-analyse
    provides: schoolplan_analyses table and API endpoint
provides:
  - Production-safe SKIP_AUTH guard on all 6 API endpoints
  - Team-scoped RLS for schoolplan_analyses table
  - Team-scoped path-based storage bucket RLS
  - Removed client-side API key reference
affects: [go-live, deployment, storage-uploads]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "VERCEL_ENV production guard: SKIP_AUTH only works when VERCEL_ENV !== 'production'"
    - "Storage path pattern: {teamId}/{schoolId}/{timestamp}-{filename}"

key-files:
  created:
    - supabase/migrations/006_fix_schoolplan_rls.sql
    - supabase/migrations/007_fix_storage_bucket_rls.sql
  modified:
    - api/ai-intake.ts
    - api/ai-analysis.ts
    - api/ai-advice.ts
    - api/ai-value.ts
    - api/analyze-schoolplan.ts
    - api/extract-document.ts
    - src/features/intake/IntakePanel.tsx
    - src/lib/document-parser.ts
    - src/lib/schoolplan-analyzer.ts
    - src/features/school-profile/tabs/ProductsTab.tsx
    - src/features/school-profile/tabs/SchoolplanTab.tsx
    - api/__tests__/analyze-schoolplan.test.ts

key-decisions:
  - "VERCEL_ENV guard on SKIP_AUTH: preserves local dev convenience while guaranteeing auth in production"
  - "Storage path includes teamId as first segment for RLS path-based enforcement"
  - "Upload functions accept teamId parameter from auth context"

patterns-established:
  - "Production auth guard: process.env.SKIP_AUTH === 'true' && process.env.VERCEL_ENV !== 'production'"
  - "Storage team-scoped path: (storage.foldername(name))[1] = get_user_team_id()::text"

requirements-completed: [REVIEW-01]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 13 Plan 01: Security Hardening Summary

**Production-safe SKIP_AUTH guard on 6 API endpoints, team-scoped RLS for schoolplan_analyses and storage bucket, removed client-side VITE_ANTHROPIC_API_KEY**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T22:14:44Z
- **Completed:** 2026-03-24T22:21:30Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- All 6 API endpoints now enforce auth in production regardless of SKIP_AUTH env var
- schoolplan_analyses table has team-scoped RLS matching the pattern of all other tables (SELECT by team, CUD by owner+accountmanager)
- Storage bucket documents are team-scoped via path-based RLS policies using get_user_team_id()
- Dead VITE_ANTHROPIC_API_KEY reference removed from frontend IntakePanel
- Upload paths updated to include teamId as first segment for RLS compatibility
- Test added verifying SKIP_AUTH is ignored when VERCEL_ENV=production

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden SKIP_AUTH in all 6 API endpoints and remove VITE_ANTHROPIC_API_KEY** - `8be50cf` (fix)
2. **Task 2: Fix schoolplan_analyses RLS policies with team-scoped access** - `7b74073` (fix)
3. **Task 3: Fix storage bucket RLS with team-scoped path policies** - `96d101c` (fix)

## Files Created/Modified
- `api/ai-intake.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `api/ai-analysis.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `api/ai-advice.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `api/ai-value.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `api/analyze-schoolplan.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `api/extract-document.ts` - Added VERCEL_ENV production guard to SKIP_AUTH
- `src/features/intake/IntakePanel.tsx` - Removed VITE_ANTHROPIC_API_KEY reference and hasApiKey logic
- `api/__tests__/analyze-schoolplan.test.ts` - Added VERCEL_ENV=production enforcement test
- `supabase/migrations/006_fix_schoolplan_rls.sql` - Team-scoped RLS for schoolplan_analyses
- `supabase/migrations/007_fix_storage_bucket_rls.sql` - Team-scoped path-based storage RLS
- `src/lib/document-parser.ts` - Upload path includes teamId for storage RLS
- `src/lib/schoolplan-analyzer.ts` - Upload path includes teamId for storage RLS
- `src/features/school-profile/tabs/ProductsTab.tsx` - Passes teamId to upload function
- `src/features/school-profile/tabs/SchoolplanTab.tsx` - Passes teamId to upload function

## Decisions Made
- VERCEL_ENV guard preserves local dev convenience (SKIP_AUTH still works locally) while guaranteeing auth enforcement in production
- Storage paths restructured to {teamId}/{...} pattern so RLS can use storage.foldername for team scoping
- Upload functions accept teamId from auth context rather than trying to resolve it server-side

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript build error with auth context property name**
- **Found during:** Task 3 (storage upload path updates)
- **Issue:** Used `profile` instead of `userProfile` from AuthContextType
- **Fix:** Changed to `userProfile` matching the actual interface definition
- **Files modified:** ProductsTab.tsx, SchoolplanTab.tsx
- **Verification:** `npm run build` passes
- **Committed in:** 96d101c (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor naming correction for TypeScript type safety. No scope creep.

## Issues Encountered
- Pre-existing test failures in ComparisonTable and ModuleDetailPanel tests (6 test files, 54 tests) are unrelated to this plan's changes -- these are from earlier phases

## User Setup Required

**Migrations must be applied manually to Supabase:**
- Run `supabase/migrations/006_fix_schoolplan_rls.sql` via Supabase dashboard SQL editor
- Run `supabase/migrations/007_fix_storage_bucket_rls.sql` via Supabase dashboard SQL editor
- Existing documents uploaded before this change use old path structure ({schoolId}/...) and will need migration or manual re-upload with new paths

## Known Stubs
None -- all code is fully wired.

## Next Phase Readiness
- Security hardening complete for API auth, RLS, and storage
- Ready for remaining go-live review tasks (13-02, 13-03)
- Migrations need to be applied to production Supabase before deployment

## Self-Check: PASSED

All 11 key files verified as present. All 3 task commits verified (8be50cf, 7b74073, 96d101c).

---
*Phase: 13-architectuur-review-go-live*
*Completed: 2026-03-24*
