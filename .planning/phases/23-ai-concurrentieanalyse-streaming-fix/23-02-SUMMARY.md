---
phase: 23-ai-concurrentieanalyse-streaming-fix
plan: 02
subsystem: ai-analysis-client
tags: [retry-logic, progress-indicator, error-classification, dual-model, opus-deep-mode]
dependency_graph:
  requires:
    - phase: 23-01
      provides: server-side-json-assembly, sonnet-primary-cascade, opus-deep-mode, health-check-endpoint
  provides:
    - client-retry-logic
    - progress-indicator-ui
    - typed-error-classification
    - dual-analysis-buttons
  affects: [ai-analysis-ux, vercel-deployment]
tech_stack:
  added: []
  patterns: [fetchWithRetry-with-backoff, typed-error-class, progress-callback-pattern]
key_files:
  created: []
  modified:
    - src/lib/ai-analysis.ts
    - src/features/price-comparison/AnalysisPanel.tsx
key_decisions:
  - "AnalysisError class with explicit type/retryable properties instead of constructor parameter properties (erasableSyntaxOnly TS constraint)"
  - "errorType exposed as data-error-type attribute on error div for future conditional styling"
  - "PROGRESS_LABELS defined inside component for Dutch labels (Verbinding maken, Analyse genereren, Resultaat verwerken, Opnieuw proberen)"
patterns_established:
  - "fetchWithRetry pattern: max 2 retries, 1s then 3s backoff, typed error classification"
  - "AnalysisError class for typed error handling across AI analysis flow"
  - "Progress callback pattern for async operations with UI feedback"
requirements_completed: [D-03, D-04, D-05, D-09]
metrics:
  duration: ~4min
  completed: 2026-03-28
  tasks_completed: 2
  tasks_total: 3
  files_changed: 2
---

# Phase 23 Plan 02: Client Retry, Progress & Deep Analysis Summary

**Client-side retry logic with 1s/3s backoff, Dutch progress indicator (4 states), typed error classification with conditional retry button, and dual standard/deep analysis buttons**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-28T21:22:31Z
- **Completed:** 2026-03-28T21:26:24Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Client automatically retries 1-2 times on timeout or server error with 1s/3s exponential backoff
- Users see real-time progress steps during analysis (Verbinding maken, Analyse genereren, Resultaat verwerken, Opnieuw proberen)
- After all retries fail, typed error messages guide the user with a manual retry button for retryable errors
- Two analysis buttons: standard (Sonnet) and Diepgaand (Opus) for key accounts

## Task Commits

Each task was committed atomically:

1. **Task 1: Client retry logic and generateAnalysis update** - `f6c79a1` (feat)
2. **Task 2: Progress indicator, dual buttons, and error UI in AnalysisPanel** - `359b6bf` (feat)
3. **Task 3: Production verification** - checkpoint (human-verify, pending)

## Files Created/Modified
- `src/lib/ai-analysis.ts` - Added AnalysisProgress/AnalysisError types, fetchWithRetry helper, options parameter on generateAnalysis
- `src/features/price-comparison/AnalysisPanel.tsx` - Progress indicator, dual buttons (standard/deep), typed error display with retry

## Decisions Made
- Used explicit property assignments in AnalysisError class instead of TypeScript parameter properties, because the project's tsconfig has `erasableSyntaxOnly` enabled
- errorType exposed via data-error-type attribute on error div for future conditional styling/testing hooks
- Progress labels defined as a const inside the component for easy maintenance of Dutch translations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AnalysisError class parameter properties not allowed**
- **Found during:** Task 1
- **Issue:** TypeScript `erasableSyntaxOnly` mode does not allow `public readonly` parameter properties in constructor
- **Fix:** Changed to explicit property declarations with assignments in constructor body
- **Files modified:** src/lib/ai-analysis.ts
- **Verification:** Build passes without TS1294 errors
- **Committed in:** f6c79a1

**2. [Rule 1 - Bug] Unused errorType variable**
- **Found during:** Task 2
- **Issue:** TS6133 error for unused `errorType` state variable
- **Fix:** Used errorType as data-error-type attribute on the error container div
- **Files modified:** src/features/price-comparison/AnalysisPanel.tsx
- **Verification:** Build passes without TS6133 error
- **Committed in:** 359b6bf

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for build to pass. No scope creep.

## Known Stubs

None -- all functionality is fully wired.

## Issues Encountered
- Pre-existing untracked test files in `src/hooks/__tests__/` cause TS errors during build but are unrelated to this plan (same as Plan 01)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Task 3 (production verification) pending as human-verify checkpoint
- After verification: push to Vercel, confirm no 504 timeouts, both standard and deep analysis work
- Fluid Compute should be enabled in Vercel dashboard if not already

---
*Phase: 23-ai-concurrentieanalyse-streaming-fix*
*Completed: 2026-03-28*
