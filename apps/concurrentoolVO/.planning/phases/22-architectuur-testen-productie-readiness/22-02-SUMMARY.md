---
phase: 22-architectuur-testen-productie-readiness
plan: 02
subsystem: infra
tags: [github-actions, ci, sentry, csp, security-headers, error-tracking]

# Dependency graph
requires: []
provides:
  - GitHub Actions CI pipeline with lint/typecheck/test/build/e2e stages
  - Sentry error tracking integration (env-gated, production-only)
  - Security headers (CSP, X-Frame-Options, etc.) in vercel.json
affects: [22-05-e2e-tests]

# Tech tracking
tech-stack:
  added: ["@sentry/react", "@sentry/vite-plugin"]
  patterns: ["env-gated Sentry init", "conditional Vite plugin loading", "Vercel security headers"]

key-files:
  created:
    - .github/workflows/ci.yml
    - src/lib/sentry.ts
  modified:
    - src/main.tsx
    - vite.config.ts
    - .env.example
    - vercel.json
    - package.json

key-decisions:
  - "Sentry replay enabled with maskAllText: false for internal tool (not public-facing)"
  - "Source map upload conditional on SENTRY_AUTH_TOKEN presence"
  - "CSP allows sentry.io, supabase.co, and anthropic.com connect-src"

patterns-established:
  - "Env-gated initialization: check env var before init, skip silently if absent"
  - "Conditional Vite plugin: spread empty array when auth token missing"

requirements-completed: [PROD-04, PROD-06]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 22 Plan 02: CI Pipeline & Production Monitoring Summary

**GitHub Actions CI with lint/typecheck/test/build/e2e pipeline, Sentry error tracking with env-gated production init, and Vercel security headers including CSP**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T15:38:29Z
- **Completed:** 2026-03-27T15:41:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- CI pipeline with quality gate (lint, typecheck, vitest coverage, build) and separate E2E job
- Sentry integration that initializes only in production when DSN is provided
- Complete security headers in vercel.json: CSP, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub Actions CI pipeline** - `a56c43a` (feat)
2. **Task 2: Integrate Sentry error tracking + security headers** - `1e30cb1` (feat)

## Files Created/Modified
- `.github/workflows/ci.yml` - Full CI pipeline with quality + e2e jobs
- `src/lib/sentry.ts` - Sentry initialization module, env-gated
- `src/main.tsx` - Added initSentry() call before React render
- `vite.config.ts` - Added sentryVitePlugin (conditional) and sourcemap: true
- `.env.example` - Added VITE_SENTRY_DSN and Sentry CI vars
- `vercel.json` - Added security headers array with CSP
- `package.json` - Added @sentry/react and @sentry/vite-plugin dependencies

## Decisions Made
- Sentry replay with maskAllText: false because this is an internal sales tool, not public-facing
- Source map upload only when SENTRY_AUTH_TOKEN is present (CI-only, not local builds)
- CSP connect-src includes supabase.co, sentry.io, and anthropic.com for existing integrations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Optional Sentry configuration:
- Add `VITE_SENTRY_DSN` to `.env.local` for local testing or Vercel env vars for production
- Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to CI secrets for source map upload
- App works without any Sentry configuration

## Known Stubs

None - all integrations are fully wired with graceful degradation when env vars are absent.

## Next Phase Readiness
- CI pipeline ready; E2E job will start passing once Plan 05 creates Playwright config
- Sentry ready for production once DSN is configured in Vercel env vars
- Security headers active on next Vercel deployment

---
*Phase: 22-architectuur-testen-productie-readiness*
*Completed: 2026-03-27*
