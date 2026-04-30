---
phase: 22-architectuur-testen-productie-readiness
plan: 05
subsystem: testing
tags: [playwright, e2e, chromium, vite-webserver]

# Dependency graph
requires:
  - phase: 22-01
    provides: Clean vitest baseline
  - phase: 22-02
    provides: CI pipeline with E2E job
provides:
  - Playwright E2E testing setup with Vite webServer integration
  - 18 E2E tests across 5 spec files covering routing, auth, wizard UI, comparison, export
  - npm scripts for local and UI-mode E2E testing
affects: [ci-pipeline]

# Tech tracking
tech-stack:
  added: ["@playwright/test"]
  patterns: ["Vite webServer with strictPort for E2E isolation", "VITE_SKIP_AUTH env var for auth bypass in tests"]

key-files:
  created:
    - playwright.config.ts
    - e2e/helpers/auth.ts
    - e2e/helpers/school.ts
    - e2e/school-wizard.spec.ts
    - e2e/price-comparison.spec.ts
    - e2e/navigation.spec.ts
    - e2e/dmu-export.spec.ts
    - e2e/ai-intake.spec.ts
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Port 4173 with strictPort for E2E to avoid conflicts with dev server on 3000"
  - "VITE_SKIP_AUTH (not SKIP_AUTH) as env var name -- Vite requires VITE_ prefix for client-side env vars"
  - "E2E tests focus on routing, auth bypass, and UI interactions -- full CRUD flows require Supabase backend"

patterns-established:
  - "E2E test isolation: dedicated port via strictPort to avoid parallel port conflicts"
  - "School creation helper with SchoolNameDialog interaction pattern"

requirements-completed: [SC-03, SC-06]

# Metrics
duration: 12min
completed: 2026-03-28
---

# Phase 22 Plan 05: E2E Testing with Playwright Summary

**Playwright E2E setup with 18 passing tests across 5 spec files covering routing, auth bypass, wizard dialog, comparison routing, and export navigation**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-28T21:00:16Z
- **Completed:** 2026-03-28T21:12:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Playwright configured with Vite webServer on port 4173 and VITE_SKIP_AUTH bypass
- 18 E2E tests in 5 spec files: wizard (5), comparison (3), navigation (6), export (2), intake (2)
- Helper utilities for auth verification and school creation
- All tests pass consistently in ~22s

## Task Commits

Each task was committed atomically:

1. **Task 1: Playwright setup + helper utilities** - `7e3ff65` (chore)
2. **Task 2: E2E tests for all user flows and tabs** - `89df793` (feat)

## Files Created/Modified
- `playwright.config.ts` - Playwright config with Vite webServer on port 4173
- `e2e/helpers/auth.ts` - Auth bypass verification helper
- `e2e/helpers/school.ts` - School creation and wizard completion helpers
- `e2e/school-wizard.spec.ts` - 5 tests for school creation dialog and wizard UI
- `e2e/price-comparison.spec.ts` - 3 tests for comparison routing and rendering
- `e2e/navigation.spec.ts` - 6 tests for routing, auth bypass, and app structure
- `e2e/dmu-export.spec.ts` - 2 tests for export route and empty state
- `e2e/ai-intake.spec.ts` - 2 tests for wizard/intake accessibility
- `package.json` - Added @playwright/test, test:e2e and test:e2e:ui scripts
- `.gitignore` - Added playwright-report/ and test-results/

## Decisions Made
- Used port 4173 with strictPort instead of 5173 (plan default) -- Vite config sets server.port to 3000, and dev server was already running on 3000 during tests
- Fixed env var from SKIP_AUTH to VITE_SKIP_AUTH -- Vite requires VITE_ prefix for client-side env vars to be accessible via import.meta.env
- E2E tests cover routing, auth bypass, dialog interactions, and form validation rather than full CRUD flows -- all database operations require Supabase backend which is not available in test environment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong env var name for auth bypass**
- **Found during:** Task 1
- **Issue:** Plan specified `SKIP_AUTH: 'true'` in webServer env, but app reads `VITE_SKIP_AUTH`
- **Fix:** Changed to `VITE_SKIP_AUTH: 'true'` in playwright.config.ts
- **Files modified:** playwright.config.ts
- **Committed in:** 7e3ff65

**2. [Rule 1 - Bug] Wrong port in Playwright config**
- **Found during:** Task 2 verification
- **Issue:** Plan specified port 5173 but vite.config.ts uses server.port 3000. Dev server was also occupying 3000, causing port cascade.
- **Fix:** Used port 4173 with strictPort via `npx vite --port 4173 --strictPort` command
- **Files modified:** playwright.config.ts
- **Committed in:** 89df793

**3. [Rule 3 - Blocking] E2E tests scope reduced due to Supabase dependency**
- **Found during:** Task 2 (first test run)
- **Issue:** All school CRUD operations go through Supabase. Without backend, createSchool fails silently and wizard navigation never completes.
- **Fix:** Restructured tests to focus on routing, auth bypass, dialog UI, and form validation -- verifiable without database
- **Files modified:** All e2e/*.spec.ts files
- **Committed in:** 89df793

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** Tests cover UI interactions and routing rather than full CRUD flows. Full flow tests would need Supabase test environment.

## Issues Encountered
- First E2E run had 12 failures due to Playwright's parallel workers (12) all hitting the same dev server simultaneously, causing timeouts. Subsequent runs passed consistently.

## User Setup Required
None - Playwright and Chromium installed as dev dependencies.

## Known Stubs
None -- no placeholder code introduced.

## Next Phase Readiness
- E2E infrastructure ready for CI pipeline (Plan 02 CI workflow has e2e job)
- For full CRUD flow testing, a Supabase test environment would be needed
- 18 passing tests establish baseline for regression detection

---
*Phase: 22-architectuur-testen-productie-readiness*
*Completed: 2026-03-28*
