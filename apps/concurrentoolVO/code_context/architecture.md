# Architecture — concurrentoolVO

> **Per-app override.** This file replaces (does not extend) the root template `architecture.md` for this app. Reading order: Claude loads this file via the Context Matrix when working in `apps/concurrentoolVO/`.
>
> Authoritative source for: stack, components, data flow, invariants, observability. Last validated: 2026-05-01.

---

## Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Frontend framework | Vite + React | Vite 8 / React 19.2.4 | SPA, NOT Next.js. PWA via `vite-plugin-pwa` |
| Language | TypeScript | ~5.9.3, strict mode | Three configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` |
| Styling | Tailwind CSS | v4 (via `@tailwindcss/vite`) | No PostCSS config needed |
| Routing | TanStack Router | 1.168.x | Code-defined route tree, auth-gated, slug-based school params |
| Server-state | TanStack Query | 5.94.x | — |
| Client-state | Zustand | 5.0.12 | `persist` middleware → localStorage |
| Forms | react-hook-form + Zod | 7.71 / 4.3 | Mandatory pair — never one without the other |
| Backend | Vercel Serverless Functions | — | TypeScript files in `api/`, region `fra1` (Frankfurt) |
| Database — primary | Supabase (Postgres) | `@supabase/supabase-js` 2.99.x | RLS always on |
| Database — offline | Dexie (IndexedDB wrapper) | 4.3.x | For client-side cache + offline read |
| State persistence | localStorage | (browser) | Via Zustand `persist` middleware |
| Auth | Supabase Auth | — | Login route at `/login`, ProtectedRoute pattern |
| Storage | Supabase Storage | — | `documents` bucket (migration 003) |
| AI integration | Anthropic SDK | `@anthropic-ai/sdk` 0.80.x | Model: `claude-haiku-4-5`. Structured output via Zod + `messages.parse()` |
| Document parsing | pdf-parse / mammoth / xlsx | 2.4 / 1.12 / 0.18 | PDF / Word / Excel respectively |
| PDF generation | `@react-pdf/renderer` | 4.3.x | For export tab |
| Charts | Recharts | 3.8.x | Comparison views |
| Drag-and-drop | dnd-kit | 6.3 / 10.0 | Modules ordering |
| Hosting | Vercel | — | Auto-deploy from `main` branch on upstream repo |
| Observability | Sentry + Vercel logs | `@sentry/react` 10.46 | Inherits root [ADR-0004](../../../ADR/0004-sentry-and-vercel-logs-defer-analytics.md) |
| Testing | Vitest + Playwright | 4.1 / 1.58 | Unit in `__tests__/` adjacent; e2e in `e2e/` |
| Lint | ESLint + typescript-eslint | 9.39 / 8.57 | NOT Biome — overrides root [ADR-0002](../../../ADR/0002-biome-over-eslint-prettier.md) for this app |
| Package manager | npm | — | NOT pnpm. Lockfile is `package-lock.json` |

---

## Frontend architecture

### Routing — TanStack Router (code-defined route tree)

Authoritative: `src/router/routes.ts`. Declarative route tree, type-safe, auth-aware via `beforeLoad` guards.

**Top-level routes:**

| Path | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Outside ProtectedRoute |
| `/` | redirect → `/scholen` | Index |
| `/scholen` | `SchoolOverviewPage` | School lijst |
| `/scholen/$slug` | `SchoolLayout` | Parent route, runs `checkSchoolExists` guard |
| `/scholen/$slug/` | `DashboardTab` | School dashboard (default tab) |
| `/scholen/$slug/wizard/$step` | `WizardPage` | 5-step wizard |
| `/scholen/$slug/comparison` | `ComparisonTab` | Cito/DIA/JIJ overview |
| `/scholen/$slug/current-vs-proposed` | `CurrentVsProposedPage` | Current vs Cito |
| `/scholen/$slug/migration` | `MigrationPage` | Business case migration |
| `/scholen/$slug/products` | `ProductsTab` | — |
| `/scholen/$slug/contacts` | `ContactsTab` | — |
| `/scholen/$slug/conversations` | `ConversationsTab` | — |
| `/scholen/$slug/schoolplan` | `SchoolplanTab` | — |
| `/scholen/$slug/export` | `ExportTab` | PDF + Excel export |
| `/review` | `ReviewQueuePage` | Pending price-proposals review |
| `/admin` | `AdminConfigEditor` | Admin-only |

Guards: `src/router/guards.ts` (e.g. `checkSchoolExists`).

> **NOTE — old CLAUDE.md was outdated.** Earlier docs claimed routing was via `useState<View>`. That's no longer true. App.tsx is now `<RouterProvider router={router} />`.

### Features (`src/features/*`)

Each feature owns its own components, schemas, hooks. Confirmed feature folders:

- `auth/` — `LoginPage`, ProtectedRoute, session handling
- `school-overview/` — `SchoolOverviewPage` + school-list logic
- `school-profile/` — `tabs/`, `schemas/` (Zod), `components/` (wizard steps), state for school profile
- `price-comparison/` — `CurrentVsProposedPage`, `MigrationPage`, comparison views
- `export/` — `ExportTab` + PDF/Excel generation
- `review/` — `ReviewQueuePage` for price-proposal review queue
- `admin/` — `AdminConfigEditor` for app-config

### Wizard

5 steps (index 0–4): **Niveaus → Leerlingen → Modules → Situatie → Doel**. `TOTAL_STEPS = 5` constant in `WizardShell`. Adding/removing a step requires updating `TOTAL_STEPS` AND `ProgressBar` labels in lockstep.

---

## Backend architecture

### Vercel Serverless Functions (`api/`)

All TypeScript, deployed to region `fra1` (Frankfurt). Per-endpoint `maxDuration` from `vercel.json`:

| Endpoint | Max duration | Purpose |
|---|---|---|
| `api/ai-analysis.ts` | 300s | Long AI analysis run |
| `api/ai-analysis/health.ts` | 10s | Health check sub-route |
| `api/ai-advice.ts` | 300s | Long AI advice generation |
| `api/ai-wizard-advice.ts` | 300s | Long wizard advice generation |
| `api/ai-intake.ts` | 60s (default) | Intake parsing → wizard fields |
| `api/ai-value.ts` | 60s | Value-case calc |
| `api/ai-wizard-extract.ts` | 60s | Extract wizard fields from free text |
| `api/analyze-schoolplan.ts` | 60s | Analyze uploaded schoolplan |
| `api/extract-document.ts` | 60s | PDF/Word/Excel extraction |
| `api/normalize-price.ts` | 60s | Price normalization helper |

Endpoints with 300s timeout = synchronous AI calls that may run long — be careful adding new code paths there. Endpoints at 60s = cheap-fast operations.

### Local Vercel runtime

`npx vercel dev` runs the full stack (frontend + api functions) locally. Vite alone (`npm run dev`) doesn't serve the api/ functions — there's a `vite-api-plugin.ts` that injects them in dev when `VITE_ANTHROPIC_API_KEY` is set.

---

## State management

### Zustand stores (with `persist` middleware)

| Store | Location | What it holds | Persists to |
|---|---|---|---|
| `usePricingDataStore` | `src/stores/pricing-data-store.ts` | Pricing data + draft/applied overrides + recalculate trigger | localStorage |
| School-profile state | `src/features/school-profile/` (per-feature) | wizard inputs: levels, studentCounts, selectedModules, **moduleSetups**, scenario | localStorage |

> **Cross-store reads via `getState()`.** `usePricingDataStore` reads sibling-store data via `getState()` synchronously, NOT via React hooks. This is deliberate — prevents stale closures. Don't refactor to hook reads.

### Three-layer storage

| Layer | Purpose | Tech |
|---|---|---|
| **Server canonical** | Authoritative pricing, schools, conversations, audit log | Supabase Postgres + RLS |
| **Client cache** | Fast reads, offline support | Dexie / IndexedDB (`src/db/`) |
| **UI state** | Wizard state, draft overrides | localStorage via Zustand persist |

The `src/db/` folder is the IndexedDB layer:
- `database.ts` — Dexie schema setup
- `migrations.ts` — IndexedDB migration runner
- `operations.ts`, `pricing-operations.ts` — read/write helpers
- `types.ts`, `pricing-types.ts` — shared TS types

`offline-queue.ts` (in `src/lib/`) buffers writes when offline and replays on reconnect.

---

## Engine architecture (`src/engine/`)

12 modules + sub-folder `calculators/`. **All modules are pure functions** — no side effects, no state mutations, no external calls. Tests in `__tests__/` verify per-module.

### Engine modules

| Module | Purpose |
|---|---|
| `price-comparison.ts` | `calculateComparison()` — Cito vs DIA vs JIJ at publication prices (Scenario A, no current provider) |
| `current-vs-proposed.ts` | `calculateCurrentVsProposed()` — current cost vs Cito (Scenario A + current provider per module) |
| `migration.ts` | `calculateMigration()` — business case current → new Cito platform (Scenario B) |
| `cito-bundles.ts` | Cito bundle pricing logic |
| `dia-packages.ts` | DIA package pricing logic |
| `discount-patterns.ts` | Detect/apply known discount patterns |
| `hybrid-scenario.ts` | Mixed-scenario calculation |
| `scenario-detection.ts` | Determine which scenario A vs B applies based on inputs |
| `sales-signals.ts` | Surface sales-signal flags |
| `schijnvoordeel.ts` | Detect "schijnvoordeel" (apparent advantage that isn't) |
| `sensitivity.ts` | Sensitivity analysis on inputs |
| `upsell.ts` | Upsell recommendation logic |
| `build-override-prices.ts` | Helper to merge override layers |

### Calculators sub-folder

Per-provider pricing calculators with shared interface:
- `cito-calculator.ts`, `dia-calculator.ts`, `jij-calculator.ts`, `flat-calculator.ts`
- `types.ts` — shared calculator interface
- `index.ts` — calculator registry

---

## AI integration

- **Model**: `claude-haiku-4-5` (fast, real-time during conversation)
- **SDK**: `@anthropic-ai/sdk` 0.80.x
- **Structured output**: Zod schemas + `messages.parse()` for type-safe extraction
- **API key**: `VITE_ANTHROPIC_API_KEY` in `.env.local` (frontend) / `ANTHROPIC_API_KEY` in Vercel env (backend functions)
- **Frontend wrappers**: `src/lib/ai-intake.ts`, `ai-advice.ts`, `ai-analysis.ts`, `ai-wizard.ts`, `ai-price-normalization.ts`, `ai-model-config.ts`, `schoolplan-analyzer.ts`
- **Vercel functions**: 9 endpoints in `api/` (3 with 300s budget)
- **Guard**: `intake-guard.ts` validates intake before pushing to wizard

> **Hard rule**: AI is NOT a black box in this app. Used only for intake (free text → wizard fields). Pricing is deterministic engines, never AI-generated.

---

## PWA setup

`vite-plugin-pwa` config in `vite.config.ts`:
- `registerType: 'autoUpdate'`
- Manifest: name "Cito Rekentool", short "Rekentool", theme `#003082`, display `standalone`
- Workbox runtime caching:
  - Supabase REST: `StaleWhileRevalidate`, 100 entries, 7-day TTL
  - Supabase Auth: `NetworkFirst`, 10 entries, 1-hour TTL
- Icons: `/icon-192.png`, `/icon-512.png` (with maskable)

App installs as PWA, works partially offline via IndexedDB cache + service worker.

---

## Security

### Content Security Policy (from `vercel.json`)

```
default-src 'self'
script-src 'self' https://*.sentry.io
connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.anthropic.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self'
frame-ancestors 'none'
```

Adding a new external service requires updating CSP `connect-src` (and possibly `script-src`).

### Other headers

`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=() microphone=() geolocation=()`.

### Database security

- Supabase RLS enabled on all tables (migration 002, fixes in 006/007)
- `service_role_key` server-only — never sent to client
- Storage `documents` bucket has explicit RLS (migration 003 + 007 fix)

---

## File layout

```
apps/concurrentoolVO/
├── api/                  # Vercel Serverless Functions (9 endpoints)
│   └── __tests__/
├── e2e/                  # Playwright e2e tests
├── public/               # Static assets, PWA icons
├── src/
│   ├── App.tsx           # <RouterProvider router={router} />
│   ├── main.tsx          # entry point
│   ├── components/
│   │   └── routing/      # RootLayout, SchoolLayout, WizardPage shells
│   ├── data/             # default-prices.ts, cito-migration-prices.ts (LOCKED)
│   ├── db/               # Dexie / IndexedDB layer (6 files)
│   ├── engine/           # Pure-function pricing engines (12 modules + calculators/)
│   │   ├── __tests__/
│   │   └── calculators/  # cito/dia/jij/flat
│   ├── features/         # Feature folders (auth, school-overview, school-profile, price-comparison, export, review, admin)
│   ├── hooks/            # Reusable React hooks
│   ├── lib/              # AI wrappers, utilities, sentry, offline-queue (16 files)
│   ├── models/           # Type definitions
│   ├── router/           # routes.ts, router.ts, guards.ts
│   ├── stores/           # Zustand stores (pricing-data-store visible)
│   ├── styles/           # Tailwind input
│   └── test/             # Test setup
├── supabase/
│   ├── migrations/       # 13 SQL migrations
│   └── seed-pricing-data.ts
├── skills/               # Pre-existing rekentool skills (review in Phase 5 of per-app tailoring)
├── eslint.config.js      # ESLint flat config
├── vite.config.ts        # Vite + PWA + Sentry
├── vite-api-plugin.ts    # Local dev: serve api/ functions through Vite
├── vitest.config.ts
├── playwright.config.ts
├── vercel.json           # Function timeouts + CSP + rewrites
├── tsconfig.json + .app.json + .node.json
├── package.json + package-lock.json (npm)
└── index.html
```

---

## Invariants — what must hold

1. **Three providers `cito`, `dia`, `jij` are hard-coded.** Adding a fourth touches engines, calculators, types, schemas, data, UI. Treat as major change.
2. **Engines are pure functions.** No side effects, no state mutation, no I/O. Tests verify.
3. **Locked files**: `src/data/default-prices.ts` and `src/data/cito-migration-prices.ts` — never edit without explicit approval.
4. **NL UI / EN code.** All user-facing text Dutch. All code English. Bug if either side leaks.
5. **Forms = react-hook-form + Zod.** Always both. Zod schemas live alongside the feature.
6. **State via Zustand** (no new React Context, no prop drilling).
7. **`getState()` cross-store reads** — don't refactor to hooks.
8. **RLS on all Supabase tables.** Service-role key never leaves Vercel function context.
9. **AI for parsing only**, not for pricing logic. Pricing is deterministic engines.
10. **CSP must be updated** when adding new external services to `connect-src` or `script-src`.

---

## ADR-equivalent bullets — promote to per-app ADRs in Phase 6

- **Vite (not Next.js)** — chosen for fast dev iteration + PWA support; SSR not needed for tool-internal users
- **npm (not pnpm)** — pre-dates App-Dev OS root pnpm convention; switching introduces lockfile churn for no gain
- **ESLint + typescript-eslint (not Biome)** — pre-dates ADR-0002; ESLint flat-config + react-hooks plugin sufficient
- **Zustand (not Redux/Context)** — minimal boilerplate, persist middleware fits offline use case
- **TanStack Router (not React Router)** — type-safe routes, code-defined tree, integrates with TanStack Query
- **Three-layer storage** — Postgres canonical, IndexedDB cache, localStorage UI state
- **Pure-function engines** — testability, no test mocking
- **Hard-coded three providers** — domain reality (Cito/DIA/JIJ are the market); deferred abstraction until 4th appears
- **Locked price data** — operational safety, not technical
- **AI for parsing only** — explainability + reliability
- **Vercel function regions = `fra1`** — data-residency for Dutch schools (EU)
- **300s timeout for 3 AI endpoints** — long Claude calls + document parsing chain
