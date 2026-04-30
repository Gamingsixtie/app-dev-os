# Phase 13: Architectuur Review & Go-Live - Research

**Researched:** 2026-03-24
**Domain:** Architecture review, performance audit, security hardening, production readiness
**Confidence:** HIGH

## Summary

Phase 13 is a review-and-fix phase, not a feature-building phase. The codebase is a React 19 SPA on Vite 8 with Supabase backend (auth, Postgres, storage), deployed to Vercel with 6 serverless API functions. The architecture is well-structured with clear separation (pure engine functions, Zustand stores, React Query for server state, RLS policies for access control). However, the codebase audit reveals several concrete issues that must be addressed before go-live:

1. **Security**: All 6 API serverless functions contain a `SKIP_AUTH` environment variable bypass -- if this is set to `'true'` in Vercel production, auth is completely skipped. This MUST NOT be set in production. Additionally, `VITE_ANTHROPIC_API_KEY` is still referenced in `IntakePanel.tsx` (line 385), which is a client-side exposed env var pattern from v1 that should be dead code now that intake goes through serverless functions.

2. **Build health**: The current build fails with a TypeScript error in `src/lib/offline-queue.ts` line 91 -- `supabase.from(mutation.table)` fails because `mutation.table` is typed as `string` but Supabase client expects a specific table union type. This must be fixed before deployment.

3. **RLS policy gap**: The `schoolplan_analyses` table (migration 004) uses permissive `TO authenticated USING (true)` policies for INSERT/UPDATE/DELETE, meaning any authenticated user can modify any school's analysis regardless of team or ownership. This deviates from the team-based RLS pattern used on all other tables.

**Primary recommendation:** Structure this phase as three plans: (1) Security audit and fixes, (2) Performance audit and optimization, (3) Production readiness checklist and go-live verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- infrastructure phase, all implementation choices at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None -- infrastructure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REVIEW-01 | Architectuur-check, performance audit, security review en productie-readiness voordat de app live gaat | Full codebase audit performed: security issues identified (SKIP_AUTH bypass, RLS gaps, VITE_ key reference), build error found, performance patterns documented, Supabase schema/RLS reviewed, Vercel config analyzed |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (labels, tooltips, error messages)
- Code comments and variable names in English
- NEVER modify price data in `src/data/default-prices.ts` without user approval
- Forms: always react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes (`src/engine/__tests__/`)
- Path alias `@` = `/src`
- After every approved change: automatically commit AND push to remote
- Run `npm run build` before completion -- must succeed without errors
- Never change prices, assumptions, or differentiators in `src/data/` without permission

## Architecture Patterns

### Current Project Structure
```
api/                     # Vercel serverless functions (6 endpoints)
  ai-intake.ts           # AI conversation structuring (SSE streaming)
  ai-analysis.ts         # AI analysis endpoint
  ai-advice.ts           # AI advice endpoint
  ai-value.ts            # AI value calculation
  analyze-schoolplan.ts  # Schoolplan analysis (SSE streaming)
  extract-document.ts    # Document price extraction
src/
  components/            # Shared UI components
  data/                  # Static data (prices, modules, providers)
  db/                    # Database layer (operations.ts, migrations.ts, types.ts)
  engine/                # Pure calculation functions (price-comparison, migration, etc.)
  features/              # Feature modules (auth, intake, export, school-profile, etc.)
  hooks/                 # React Query hooks
  lib/                   # Client-side API callers, utilities
  models/                # TypeScript types and Zod schemas
  router/                # TanStack Router config
supabase/
  migrations/            # 5 SQL migrations (schema, RLS, storage, schoolplan, engagement)
vercel.json              # Vercel config (rewrites, functions, region: fra1)
```

### Pattern: Serverless API with Auth Verification
**What:** All AI operations go through Vercel serverless functions that verify the Supabase JWT
**Current implementation:** Each API endpoint independently extracts Bearer token and verifies via `supabaseAdmin.auth.getUser(token)`, with a `SKIP_AUTH` bypass for development
**Security concern:** The `SKIP_AUTH` pattern is duplicated across all 6 endpoints

### Pattern: Offline-First with Sync Queue
**What:** `queueIfOffline()` helper in operations.ts queues mutations when browser is offline, syncs on reconnect with server-wins conflict resolution
**Current implementation:** PWA via vite-plugin-pwa with StaleWhileRevalidate for Supabase REST, NetworkFirst for auth

### Pattern: Team-Based RLS with SECURITY DEFINER Helpers
**What:** All data access scoped to team via `get_user_team_id()` and `get_user_role()` helper functions
**Implementation:** Correct pattern avoiding circular RLS dependency, but schoolplan_analyses table breaks this pattern

### Anti-Patterns Found
- **Duplicated `getAuthHeaders()` in 6 client-side files:** Each lib file (ai-intake.ts, ai-analysis.ts, ai-advice.ts, ai-value.ts, document-parser.ts, schoolplan-analyzer.ts) has its own inline `getAuthHeaders()`. This is a maintenance risk but not a go-live blocker.
- **VITE_ANTHROPIC_API_KEY still referenced in IntakePanel.tsx:** Line 385 checks `import.meta.env.VITE_ANTHROPIC_API_KEY` -- this is dead code from v1 when AI calls went directly from the browser. Should be removed or replaced with a check for the serverless endpoint availability.

## Security Audit Findings

### CRITICAL: SKIP_AUTH Environment Variable in All API Endpoints
**What goes wrong:** If `SKIP_AUTH=true` is set in Vercel production environment variables, ALL API endpoints skip JWT verification entirely. Any unauthenticated request would succeed.
**Files affected:** `api/ai-intake.ts`, `api/ai-analysis.ts`, `api/ai-advice.ts`, `api/ai-value.ts`, `api/analyze-schoolplan.ts`, `api/extract-document.ts`
**How to fix:** Either (a) remove SKIP_AUTH from all production-deployed API functions entirely, or (b) add a guard that only allows SKIP_AUTH in development (`process.env.VERCEL_ENV !== 'production'`). Option (a) is safer.
**Confidence:** HIGH -- verified by reading all 6 API files

### CRITICAL: Permissive RLS on schoolplan_analyses
**What goes wrong:** Any authenticated user can INSERT/UPDATE/DELETE any school's analysis, regardless of team membership or ownership. The policies use `TO authenticated USING (true)` / `WITH CHECK (true)`.
**Files affected:** `supabase/migrations/004_schoolplan_analyses.sql`
**How to fix:** Add proper team-scoped policies matching the pattern in `002_rls_policies.sql`:
```sql
-- Replace permissive policies with team-scoped ones
CREATE POLICY "schoolplan_analyses_select" ON schoolplan_analyses
  FOR SELECT USING (school_id IN (SELECT id FROM schools WHERE team_id = get_user_team_id()));

CREATE POLICY "schoolplan_analyses_insert" ON schoolplan_analyses
  FOR INSERT WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
    AND get_user_role() = 'accountmanager'
  );
-- (same pattern for UPDATE/DELETE)
```
**Confidence:** HIGH -- verified by comparing migration 004 with migration 002

### MEDIUM: Storage Bucket RLS Too Permissive
**What goes wrong:** The `documents` storage bucket (migration 003) allows any authenticated user to upload and read any document. There is no team scoping.
**How to fix:** Add path-based policies (e.g., require uploads to `{team_id}/{school_id}/` paths) or accept this as a team-shared resource if all team members should see all documents.
**Confidence:** HIGH -- verified by reading migration 003

### LOW: VITE_ANTHROPIC_API_KEY Reference in Frontend
**What:** `IntakePanel.tsx` line 385 checks `import.meta.env.VITE_ANTHROPIC_API_KEY`. If this env var is set in Vercel (as a VITE_ prefixed var), it would be bundled into the client JS and visible in the browser.
**How to fix:** Remove this check or replace with a feature flag that does not expose a key. The `.env.example` only lists server-side `ANTHROPIC_API_KEY` (no VITE_ prefix), so this is likely already unused in production.
**Confidence:** HIGH

### INFO: .env.local Pattern Is Correct
- `.gitignore` contains `*.local` which covers `.env.local`
- `.env.example` correctly separates server-side (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`) from client-side (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Supabase anon key is designed to be public (RLS enforces access control)

### INFO: CORS Not Configured (Expected)
No CORS headers found in serverless functions or vercel.json. This is correct -- Vercel serverless functions on the same domain don't need CORS headers. The SPA and API share the same origin.

## Build Health

### TypeScript Error: offline-queue.ts
**Error:** `src/lib/offline-queue.ts` line 91 -- `supabase.from(mutation.table)` where `mutation.table` is `string` but Supabase client expects union type of table names.
**Fix:** Cast the table name: `supabase.from(mutation.table as 'schools')` or use a type assertion, or type the `table` field in `PendingMutation` as a union of valid table names.
**Impact:** Build fails, cannot deploy to Vercel until fixed.
**Confidence:** HIGH -- reproduced via `npm run build`

## Performance Audit Checklist

### Success Criteria Mapping
| Criterion | Target | How to Verify |
|-----------|--------|---------------|
| Page load time | <2s | Lighthouse audit on production URL, check Vite bundle size |
| AI response | <5s | Test each API endpoint response time; current maxDuration=60s in vercel.json |
| Database queries | <500ms for 200+ schools | Supabase dashboard query performance; check index usage |

### Bundle Size Optimization Opportunities
| Library | Size Concern | Action |
|---------|-------------|--------|
| @anthropic-ai/sdk | Large, but only used in serverless (not bundled in client) | Verify tree-shaking |
| xlsx | Large (~1MB) | Only used in extract-document.ts (serverless), verify not in client bundle |
| mammoth | Medium | Only used in extract-document.ts (serverless), verify not in client bundle |
| pdf-parse | Medium | Only used in serverless, verify not in client bundle |
| @react-pdf/renderer | Large (~500KB) | Used in client for PDF export, lazy-load the export feature |
| recharts | Medium (~200KB) | Used in client for charts, acceptable |
| dexie | Small (~40KB) | Only needed for migration, could be removed post-migration |

### Database Performance
- Indexes exist on all foreign keys and common query patterns (team_id, owner_id, school_id, slug)
- Partial index on `school_prices(school_id, module_id) WHERE is_active = true` is good
- The `get_user_team_id()` SECURITY DEFINER function is called on every RLS check -- should be fast (single row lookup by PK) but verify with EXPLAIN ANALYZE
- For 200+ schools: the RLS subquery `SELECT id FROM schools WHERE team_id = get_user_team_id()` could be slow without optimization. Consider a materialized view or caching if needed.

### PWA / Offline Performance
- Service worker caches all static assets (`**/*.{js,css,html,ico,png,svg,woff2}`)
- Supabase REST API cached with StaleWhileRevalidate (7-day max age, 100 entries)
- Supabase Auth cached with NetworkFirst (1-hour max age)
- Offline mutation queue persisted in Zustand/localStorage

### Vercel Configuration
- Region: `fra1` (Frankfurt) -- good for Dutch users
- Function timeout: 60s -- sufficient for AI operations
- SPA rewrite rule catches all non-API routes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Performance monitoring | Custom timing code | Vercel Analytics or Lighthouse CI | Production-grade metrics without code changes |
| Bundle analysis | Manual checking | `npx vite-bundle-visualizer` | Visual treemap of bundle contents |
| RLS testing | Manual SQL queries | Supabase CLI `supabase test db` or pg_tap | Repeatable, automated RLS verification |
| Load testing | Custom scripts | k6 or Artillery | Standard tools for API endpoint load testing |

## Common Pitfalls

### Pitfall 1: SKIP_AUTH Left Enabled in Production
**What goes wrong:** All API endpoints accept unauthenticated requests, exposing AI functionality and data
**Why it happens:** Developer convenience during local development, forgotten in deployment
**How to avoid:** Remove SKIP_AUTH support from production code or add `VERCEL_ENV` guard
**Warning signs:** API calls succeed without Authorization header

### Pitfall 2: RLS Policies Not Tested End-to-End
**What goes wrong:** Policies look correct in SQL but fail at runtime due to edge cases (null team_id, deleted users, etc.)
**Why it happens:** RLS is only tested when actual Supabase auth is active, not in unit tests
**How to avoid:** Create a test script that creates test users with different roles and verifies access patterns
**Warning signs:** Users seeing data from other teams, or getting unexpected permission errors

### Pitfall 3: Service Worker Caching Stale Data After Deploy
**What goes wrong:** After deploying a new version, users still see old cached data/UI until SW updates
**Why it happens:** StaleWhileRevalidate serves cache first, updates in background
**How to avoid:** vite-plugin-pwa with `registerType: 'autoUpdate'` (already configured) handles this, but verify the update prompt works correctly
**Warning signs:** Users reporting they see old UI after you deployed changes

### Pitfall 4: Bundle Size Bloat from Serverless-Only Dependencies
**What goes wrong:** Libraries like xlsx, mammoth, pdf-parse get bundled into the client-side build
**Why it happens:** Import paths not properly isolated between client and serverless code
**How to avoid:** Verify these imports only exist in `api/` directory files, never in `src/`
**Warning signs:** Client bundle >1MB, slow initial page load

### Pitfall 5: IndexedDB Migration Data Loss
**What goes wrong:** User has local IndexedDB data that fails to migrate, losing school records
**Why it happens:** Schema mismatches between DexieSchoolRecord and Supabase schema, network failures during migration
**How to avoid:** CloudMigrationWizard already handles this with per-school progress tracking and error reporting. Verify it works end-to-end with real data.
**Warning signs:** `MigrationResult.errors` array has entries, `partial-failure` status

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVIEW-01a | Build succeeds without TypeScript errors | build | `npm run build` | N/A (build command) |
| REVIEW-01b | All existing tests pass | unit/integration | `npx vitest run` | Multiple (65+ test files) |
| REVIEW-01c | No API keys exposed in client bundle | smoke | `grep -r "sk-ant" dist/` after build | N/A (CLI check) |
| REVIEW-01d | RLS policies enforce team scoping | integration | Manual: test with different user roles in Supabase | Manual only |
| REVIEW-01e | API endpoints reject unauthenticated requests | integration | `api/__tests__/analyze-schoolplan.test.ts` (partial) | Partial |
| REVIEW-01f | Page loads in <2s | performance | Lighthouse CI or manual | Manual only |
| REVIEW-01g | Database queries <500ms for 200+ schools | performance | Supabase dashboard / EXPLAIN ANALYZE | Manual only |

### Sampling Rate
- **Per task commit:** `npm run build && npx vitest run`
- **Per wave merge:** Full suite + Lighthouse audit on preview deployment
- **Phase gate:** Build green + all tests pass + security checklist verified

### Wave 0 Gaps
- None -- existing test infrastructure covers code-level verification. Performance and security tests are manual/tooling-based and don't require new test files.

## Concrete Issues to Fix (Prioritized)

### P0 -- Must Fix Before Go-Live
1. **Build error in offline-queue.ts** -- TypeScript error blocks deployment
2. **SKIP_AUTH in production API endpoints** -- Verify NOT set in Vercel env, add guard
3. **RLS on schoolplan_analyses** -- Fix permissive policies to match team-scoped pattern

### P1 -- Should Fix Before Go-Live
4. **Remove VITE_ANTHROPIC_API_KEY reference** from IntakePanel.tsx
5. **Verify client bundle does not include serverless-only dependencies** (xlsx, mammoth, pdf-parse)
6. **Storage bucket RLS** -- Consider team-scoping document uploads

### P2 -- Nice to Have
7. **Consolidate duplicated getAuthHeaders()** into shared utility
8. **Remove Dexie dependency** if migration is complete and no longer needed
9. **Add Lighthouse CI** to verify performance targets

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all files in `api/`, `src/`, `supabase/migrations/`
- `vercel.json` configuration review
- `package.json` dependency analysis
- `.env.example` and `.env.local.example` review
- `.gitignore` verification

### Secondary (MEDIUM confidence)
- Supabase RLS documentation patterns (from training data, verified against codebase implementation)
- Vercel serverless function behavior (from training data, verified against vercel.json config)

## Metadata

**Confidence breakdown:**
- Security findings: HIGH -- all verified by direct code reading
- Build issue: HIGH -- reproduced via `npm run build`
- Performance targets: MEDIUM -- targets defined in success criteria, measurement requires production deployment
- RLS analysis: HIGH -- compared all migration files side by side

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no external dependency changes expected)
