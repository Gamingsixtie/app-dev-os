# Phase 22: Architectuur, Testen & Productie-readiness - Research

**Researched:** 2026-03-27
**Domain:** Testing infrastructure, CI/CD, error tracking, security hardening
**Confidence:** HIGH

## Summary

This phase transforms a feature-complete React SPA (Vite + TypeScript + Tailwind v4) into a production-grade application. The codebase has 79 test files with 2232 passing tests, but also 8 failing test files (11 failing tests), 42 skipped test suites (caused by stale worktree copies in `.claude/worktrees/`), and 158 todo/placeholder tests. Component-level test coverage is thin: 149 React components across features have only 39 test files. No E2E framework, no CI pipeline, no error tracking, and no structured logging exist yet.

The primary work areas are: (1) fix failing tests and clean up worktree pollution, (2) triage 158 todo tests, (3) add component tests for untested interactive UI, (4) set up Playwright for E2E testing of all user flows, (5) create GitHub Actions CI pipeline, (6) integrate Sentry for error tracking, (7) security audit, and (8) performance profiling.

**Primary recommendation:** Start by cleaning the test environment (worktree exclusion, fix 11 failing tests), then expand coverage bottom-up (utils/hooks -> stores -> components -> E2E), and layer production infrastructure (CI -> Sentry -> security) in parallel.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Priority is coverage gaps -- components that lack tests (stores, hooks, utils). Engine tests are strong; expand to integration tests between store -> engine -> UI.
- **D-02:** Triage the 158 todo tests: implement critical paths (engine calculations, wizard flow, store actions), delete the rest. Clean test suite without dead todos.
- **D-03:** Broad UI coverage with React Testing Library -- all interactive components: forms, modals, tabs, navigation.
- **D-04:** Playwright as E2E framework. Fits Vite, fast, cross-browser, headless in CI.
- **D-05:** All user flows and tabs E2E tested: school creation + wizard, price comparison, DMU export, AI intake, all other tabs/views.
- **D-06:** E2E tests run locally and in CI (GitHub Actions).
- **D-07:** Fix all 10 failing tests in 7 files (actual: 11 failing in 8 files). Production project may not have failing tests.
- **D-08:** Review all 42 skipped test suites and activate where possible. Assess why they skip -- activate what's valid, delete what's obsolete.
- **D-09:** No specific known bugs -- Claude scans codebase for tech debt and issues.
- **D-10:** Full production level: error tracking (Sentry), performance monitoring, structured logging, health checks. Treat as SaaS product.
- **D-11:** Broad security audit: XSS, CSRF, input sanitization, dependency vulnerabilities (npm audit), CSP headers. Full OWASP-style check.
- **D-12:** Performance profiling -- systematic profiling and optimization.
- **D-13:** CI pipeline with GitHub Actions: lint -> typecheck -> unit tests -> build -> E2E tests. Automatic on every push.

### Claude's Discretion
- Architecture review: separation of concerns, code quality patterns, dependency analysis
- Sentry vs alternatives for error tracking
- Performance benchmark thresholds and optimization priorities
- CI pipeline configuration details (matrix, caching, artifact upload)
- Which OWASP checks are relevant for this client-side app with Supabase backend

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Testing)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.x (installed) | Unit + integration test runner | Already configured, native Vite integration |
| @vitest/coverage-v8 | 4.1.2 | Code coverage reporting | Istanbul alternative for Vitest, v8-based (fast) |
| @testing-library/react | 16.3.x (installed) | Component testing | Already installed, React 19 compatible |
| @testing-library/user-event | 14.6.x (installed) | User interaction simulation | Already installed |
| @playwright/test | 1.58.2 | E2E browser testing | Decision D-04: locked choice. Cross-browser, Vite webServer support |

### Core (Production Infrastructure)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/react | 10.46.0 | Error tracking + performance | Industry standard for React SPAs, free tier sufficient |
| @sentry/vite-plugin | 5.1.1 | Source map upload to Sentry | Enables readable stack traces in production |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/ui | 4.1.x | Visual test runner UI | Development only, optional |
| msw | 2.x | API mocking for integration tests | Mock Supabase and AI API calls in tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sentry | LogRocket, Bugsnag | Sentry has best React integration, free tier is generous (5K events/mo) |
| @vitest/coverage-v8 | @vitest/coverage-istanbul | v8 is faster, istanbul more widely supported -- v8 preferred for Vite |
| msw | vi.mock() | msw provides more realistic network-level mocking, but vi.mock is simpler for pure functions |

**Installation:**
```bash
npm install -D @playwright/test @vitest/coverage-v8
npm install @sentry/react @sentry/vite-plugin
npx playwright install --with-deps chromium
```

## Architecture Patterns

### Recommended Test Structure
```
src/
├── engine/__tests__/              # Pure function unit tests (STRONG - 14 files)
├── features/{name}/__tests__/     # Component + integration tests (GAPS)
├── hooks/__tests__/               # Hook tests (PARTIAL - 3/11 hooks)
├── lib/__tests__/                 # Utility tests (PARTIAL - 7/~12 utils)
├── models/__tests__/              # Type/schema tests (GOOD)
├── data/__tests__/                # Static data validation (GOOD)
├── db/__tests__/                  # Database layer tests (3 files)
├── router/__tests__/              # Route/guard tests (2 files)
├── test/
│   └── setup.ts                   # Global test setup
e2e/
├── fixtures/                      # Shared test data
├── helpers/                       # Page object models
├── school-wizard.spec.ts          # Wizard flow
├── price-comparison.spec.ts       # Comparison views
├── dmu-export.spec.ts             # Export flow
├── ai-intake.spec.ts              # AI intake flow
└── navigation.spec.ts             # Tab/view navigation
.github/
└── workflows/
    └── ci.yml                     # CI pipeline
```

### Pattern 1: Vitest Coverage Configuration
**What:** Add coverage reporting to vitest.config.ts
**When to use:** Every test run in CI
**Example:**
```typescript
// vitest.config.ts - add to test config
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary', 'lcov'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.d.ts',
      'src/test/**',
      'src/vite-env.d.ts',
    ],
    thresholds: {
      statements: 80,
      branches: 70,
      functions: 75,
      lines: 80,
    },
  },
},
```

### Pattern 2: Playwright Configuration for Vite
**What:** Playwright config with Vite dev server
**When to use:** E2E test setup
**Example:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Pattern 3: GitHub Actions CI Pipeline
**What:** Full quality gate pipeline
**When to use:** Every push and PR
**Example:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc -b --noEmit
      - run: npx vitest run --coverage
      - run: npm run build
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Pattern 4: Sentry React Integration
**What:** Error boundary + performance monitoring
**When to use:** Production error tracking
**Example:**
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't test internal component state, test user-visible behavior with Testing Library
- **Snapshot overuse:** Don't snapshot entire component trees -- test specific behaviors
- **Mocking too much:** Prefer rendering real component trees with mocked API boundaries (Supabase, AI)
- **E2E for logic:** Don't use Playwright to test calculation logic -- that's vitest's job
- **Coverage gaming:** Don't write meaningless tests to hit 80% -- prioritize critical paths

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage reporting | Custom coverage scripts | @vitest/coverage-v8 | Branch/statement tracking is complex |
| E2E browser automation | Custom Puppeteer scripts | Playwright | Auto-waiting, trace viewer, cross-browser |
| Error tracking | Custom error boundary + logging | Sentry | Session replay, source maps, alerting |
| API mocking in tests | Manual fetch interceptors | msw (if needed) | Request-level interception, type-safe |
| CI pipeline | Shell scripts | GitHub Actions | Matrix builds, caching, artifact upload |
| Security scanning | Manual dependency checks | npm audit + automated | Continuous vulnerability detection |

**Key insight:** This phase is almost entirely about integrating proven tooling, not building custom solutions. Every item above has a mature ecosystem solution.

## Common Pitfalls

### Pitfall 1: Worktree Test Pollution
**What goes wrong:** Vitest discovers test files inside `.claude/worktrees/` directories (223 duplicate test files), causing 42 "skipped" suites and failures from stale code.
**Why it happens:** Vitest's default file discovery walks the entire project tree including worktrees.
**How to avoid:** Add `.claude/worktrees` to vitest.config.ts `exclude` AND to the `test.include` pattern. Example: `exclude: ['**/node_modules/**', '**/.claude/worktrees/**']`
**Warning signs:** Test count suddenly jumps, tests fail with paths containing `.claude/worktrees/`.

### Pitfall 2: Failing Tests from Stale Worktrees
**What goes wrong:** 8 of the 11 failing tests are from worktree paths (crm-schemas, school-crm, contacts, routes). Only 2 genuine failures exist in the main source.
**Why it happens:** Worktree code diverged from main branch but Vitest still discovers it.
**How to avoid:** Fix vitest config exclusion FIRST, then assess actual failures. The real failing tests are: `api/__tests__/analyze-schoolplan.test.ts` (1 test) and `src/features/price-comparison/__tests__/ComparisonChart.test.tsx` (1 test).

### Pitfall 3: E2E Tests Needing Auth
**What goes wrong:** Playwright tests hit login wall when auth is enabled.
**Why it happens:** Supabase Auth requires valid session for protected routes.
**How to avoid:** Use `SKIP_AUTH=true` environment variable for E2E tests (already exists in codebase), or set up a test auth state via Playwright's `storageState`.

### Pitfall 4: Playwright on Windows CI
**What goes wrong:** Playwright browser install fails or is slow on Windows.
**Why it happens:** Browser binaries are platform-specific.
**How to avoid:** Run CI on `ubuntu-latest` (not Windows). Local dev on Windows works fine with `npx playwright install chromium`.

### Pitfall 5: Sentry in Development
**What goes wrong:** Sentry captures dev errors, fills quota, sends noisy alerts.
**Why it happens:** Missing environment guard.
**How to avoid:** Always set `enabled: import.meta.env.PROD` in Sentry init. Use `VITE_SENTRY_DSN` env var so it's empty in dev.

### Pitfall 6: npm audit False Positives
**What goes wrong:** npm audit reports vulnerabilities in dev dependencies or transitive deps with no real attack vector.
**Why it happens:** npm audit is aggressive, flags theoretical vulnerabilities.
**How to avoid:** Focus on production dependencies only (`npm audit --omit=dev`). Current scan shows 15 vulnerabilities (9 moderate, 6 high) -- triage by actual exploitability in a client-side SPA context.

## Current Test State Inventory

### Summary (from test run 2026-03-27)
| Metric | Value |
|--------|-------|
| Total test files | 305 (including worktree duplicates) |
| Actual test files (src/) | 79 |
| Passing tests | 2232 |
| Failing tests | 11 (8 from worktrees, 2-3 genuine) |
| Todo/placeholder tests | 158 |
| Skipped suites | 42 (worktree duplicates) |
| Test duration | ~41s |

### Coverage Gaps by Area
| Area | Source files | Test files | Gap Assessment |
|------|-------------|------------|----------------|
| Engine (pure functions) | ~15 | 14 | STRONG -- near complete |
| Hooks | 11 | 3 | WEAK -- 8 hooks untested |
| Lib/utils | ~12 | 7 | MODERATE -- key utils covered |
| Stores | 4 | 2 | MODERATE -- 2 stores untested |
| UI components | 28 | 3 | WEAK -- 25 components untested |
| Auth feature | 5 | 1 | WEAK |
| Export feature | 17 | 5 | MODERATE |
| Intake feature | 1 | 0 | MISSING |
| Migration feature | 2 | 1 | MODERATE |
| Price comparison | 27 | 10 | MODERATE |
| School overview | 16 | 3 | WEAK |
| School profile | 53 | 16 | MODERATE -- largest feature |
| API routes | 8 | 3 | MODERATE |
| DB layer | 3 | 3 | GOOD |
| Router | 2 | 2 | GOOD |

### Genuine Failing Tests (after worktree exclusion)
1. `api/__tests__/analyze-schoolplan.test.ts` -- VERCEL_ENV/SKIP_AUTH guard test (1 test) -- likely outdated after Phase 13 fix
2. `src/features/price-comparison/__tests__/ComparisonChart.test.tsx` -- responsive container height assertion (1 test) -- UI change not reflected in test

## Security Audit Scope

For a client-side SPA with Supabase backend, relevant OWASP concerns are:

| Check | Relevance | Notes |
|-------|-----------|-------|
| XSS (Cross-Site Scripting) | HIGH | React auto-escapes JSX, but check `dangerouslySetInnerHTML` usage and URL injection |
| Dependency vulnerabilities | HIGH | 15 npm audit findings to triage |
| Sensitive data exposure | HIGH | Check for API keys in client bundle, ensure VITE_ANTHROPIC_API_KEY not leaked |
| CSP headers | MEDIUM | Vercel headers config in vercel.json |
| CSRF | LOW | SPA with Supabase JWT auth, not cookie-based sessions |
| SQL injection | N/A | Supabase handles parameterized queries |
| Input validation | MEDIUM | Zod schemas on forms, but check AI intake free text |

## Code Examples

### Vitest Exclude Worktrees
```typescript
// vitest.config.ts - fix worktree pollution
export default defineConfig({
  // ...
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/.claude/worktrees/**',
    ],
  },
});
```

### Component Test Pattern (React Testing Library)
```typescript
// Following project convention: __tests__/ next to code
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

describe('InteractiveComponent', () => {
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<Component onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /opslaan/i }));
    expect(screen.getByText(/opgeslagen/i)).toBeInTheDocument();
  });
});
```

### E2E Test Pattern (Playwright)
```typescript
// e2e/school-wizard.spec.ts
import { test, expect } from '@playwright/test';

test('complete wizard flow creates school profile', async ({ page }) => {
  await page.goto('/');

  // School creation
  await page.getByRole('button', { name: /school toevoegen/i }).click();
  await page.getByLabel(/schoolnaam/i).fill('Test School');
  await page.getByRole('button', { name: /aanmaken/i }).click();

  // Wizard step 1: Niveaus
  await expect(page.getByText(/niveaus/i)).toBeVisible();
  // ... complete wizard steps

  // Verify comparison view loads
  await expect(page.getByText(/vergelijking/i)).toBeVisible();
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | All engines have unit tests >80% coverage | unit | `npx vitest run --coverage src/engine/` | Partial -- expand |
| SC-02 | Integration tests: wizard -> store -> engine -> UI | integration | `npx vitest run src/features/` | Wave 0 |
| SC-03 | E2E tests: full user flows | e2e | `npx playwright test` | Wave 0 |
| SC-04 | Architecture review: separation of concerns | manual | Code review | N/A |
| SC-05 | Known bugs and tech debt resolved | unit | `npx vitest run` (0 failures) | Partial |
| SC-06 | App is stable, performant, production-ready | e2e + perf | `npx playwright test && npm run build` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (quick, ~41s)
- **Per wave merge:** `npx vitest run --coverage && npm run build`
- **Phase gate:** Full suite green + E2E green + build passes + coverage >80%

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- add worktree exclusion + coverage config
- [ ] `playwright.config.ts` -- create from scratch
- [ ] `e2e/` directory -- create with initial spec files
- [ ] `.github/workflows/ci.yml` -- create CI pipeline
- [ ] `@vitest/coverage-v8` -- install as devDependency
- [ ] `@playwright/test` -- install as devDependency

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | 24.14.0 | -- |
| npm | Package management | Yes | (bundled) | -- |
| Playwright | E2E tests | Yes (npx) | 1.58.2 | -- |
| GitHub Actions | CI pipeline | Yes (remote) | -- | -- |
| Sentry | Error tracking | No (needs account) | -- | Console logging until DSN configured |
| Chromium (Playwright) | E2E browser | Needs install | -- | `npx playwright install chromium` |

**Missing dependencies with no fallback:**
- None blocking

**Missing dependencies with fallback:**
- Sentry DSN: needed for error tracking, but app works fine without it. User creates free Sentry account and adds `VITE_SENTRY_DSN` to env.

## Open Questions

1. **Sentry Account Setup**
   - What we know: Sentry free tier allows 5K events/month, sufficient for internal tool
   - What's unclear: Does the user already have a Sentry account/organization?
   - Recommendation: Code the integration with env-var-gated DSN. Works without it, enables with one env var.

2. **E2E Auth Strategy**
   - What we know: `SKIP_AUTH` env var exists but was recently changed (Phase 13 removed VERCEL_ENV guard)
   - What's unclear: Best approach for E2E -- skip auth entirely or use test credentials?
   - Recommendation: Use `SKIP_AUTH=true` for E2E since this is an internal tool. Simpler and sufficient.

3. **Coverage Threshold Realism**
   - What we know: Engine coverage is likely >90%, component coverage is likely <50%
   - What's unclear: Can 80% overall be reached within phase scope?
   - Recommendation: Set 80% for engines/lib/models, 60% for components, 40% for features with UI-heavy code. Raise incrementally.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `vitest.config.ts`, `package.json`, test run output (2026-03-27)
- Vitest documentation (installed version 4.1.x)
- Playwright documentation (verified version 1.58.2 via npx)

### Secondary (MEDIUM confidence)
- npm registry: @sentry/react 10.46.0, @sentry/vite-plugin 5.1.1, @vitest/coverage-v8 4.1.2
- npm audit output (15 vulnerabilities)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools verified via npm registry and existing project setup
- Architecture: HIGH -- patterns derived from existing codebase conventions
- Pitfalls: HIGH -- discovered through actual test run analysis (worktree pollution confirmed empirically)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable tooling, no fast-moving APIs)
