# AGENTS.md — concurrentoolVO

App-specific instructions for **concurrentoolVO** (rekentool / concurrentie-vergelijkings-tool VO).

This file lives in `apps/concurrentoolVO/` and is loaded by Claude Code when working in this app. It **inherits all rules from the root App-Dev OS template** at `../../AGENTS.md` (operating rules, skills registry, branching policy, permissions, hooks, memory model). Only the **deviations and app-specific additions** below override the root.

---

## App identity

- **Purpose**: Cito-consultants vergelijken kosten tussen toetsaanbieders (Cito, DIA, JIJ) voor Nederlandse middelbare scholen. Wizard verzamelt schoolprofiel → engine berekent prijzen → vergelijkingsoverzicht.
- **Type**: React 19 SPA (Vite 8) + Vercel Serverless Functions in `api/`
- **PWA**: yes (vite-plugin-pwa) — installeerbaar, deels offline-werkend dankzij IndexedDB
- **Visibility**: public GitHub repo `Gamingsixtie/concurrentie-rekentool-VO`
- **Source provenance**: imported into App-Dev OS via `git subtree add --squash` from upstream commit `814ec61` (2026-04-30)
- **Production deploy**: Vercel auto-deploy from upstream `main` — see "Vercel deploy migration" section below for monorepo flip-over plan

---

## Stack deviations from root template

The App-Dev OS root template defaults to Next.js + pnpm + Biome + Supabase. This app diverges:

| Concern | Root default | This app | Resolution |
|---|---|---|---|
| Framework | Next.js (App Router) | Vite 8 SPA + React 19 | per-app ADR planned (Phase 6) |
| Package manager | pnpm | npm (`package-lock.json`) | per-app override in `code_context/conventions.md` |
| Linter / formatter | Biome (ADR-0002) | ESLint 9 + typescript-eslint | per-app ADR overrides ADR-0002 for this app |
| Routing | Next.js routing | TanStack Router | per-app ADR planned |
| Server-state | RSC + fetch | TanStack Query | per-app override |
| Client-state | mostly RSC | Zustand 5 + `persist` middleware | per-app ADR planned |
| Backend | Route Handlers | Vercel Serverless Functions in `api/*.ts` | inherits root deploy patterns |
| Auth | Supabase Auth | Supabase Auth (consistent) | inherits |
| Database | Supabase Postgres | Supabase + IndexedDB (Dexie) for offline + localStorage (Zustand persist) | per-app ADR planned (3-layer storage rationale) |
| Testing | Vitest | Vitest 4 + Playwright e2e | inherits |
| Observability | Sentry + Vercel logs (ADR-0004) | Sentry already installed | inherits ADR-0004 |
| TypeScript config | single `tsconfig.json` | split: `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` | per-app override |

Concrete reasoning + decision history go in `code_context/architecture.md` (Phase 2) and per-app `ADR/` (Phase 6).

---

## App-specific hard rules

These extend or override App-Dev OS root rules. Non-negotiable for this app.

### Locked files — never edit without explicit approval

- `src/data/default-prices.ts` — actuele tarieven Cito/DIA/JIJ
- `src/data/cito-migration-prices.ts` — migration tariff data

**Why locked**: incorrect price data corrupts comparison output that Cito-consultants use in real customer conversations. Edits require Pim's explicit go-ahead.

### Language convention (overrides root template English-throughout default)

- **All UI text in Dutch** — labels, tooltips, error messages, button copy, onboarding, empty states, everything user-facing
- **All code in English** — variable names, function names, comments, commit messages, JSDoc, file names, ADRs, learnings entries

Strictly enforced. If a UI string appears in English, that's a bug. If a variable name or comment appears in Dutch, that's a bug.

### Three hard-coded providers

`cito`, `dia`, `jij` are hard-coded in the comparison engine. Adding a fourth provider touches **multiple** files (engines, types, schemas, data, UI). Treat as a major change requiring planning, not a small edit.

### Pure-function engines — preserve invariant

`src/engine/price-comparison.ts`, `current-vs-proposed.ts`, `migration.ts` are **pure functions**: no side effects, no state mutations, no external calls. Existing tests verify this. New engine logic must follow the same pattern.

### Zustand store cross-reads via `getState()`, not hooks

`usePriceComparisonStore` reads sibling-store data via `useSchoolProfileStore.getState()`, NOT via hooks. This is deliberate to prevent stale closures. Don't refactor to hook-based reads.

### Wizard structure is fixed

5 steps (index 0–4): Niveaus → Leerlingen → Modules → Situatie → Doel. `TOTAL_STEPS = 5` in `WizardShell`. Adding a step requires updating `TOTAL_STEPS` and `ProgressBar` labels in lockstep.

---

## Per-app context layer (filled across Phase 2-6)

Files that override or extend root template context for this app:

| Path | Purpose | Filled in |
|---|---|---|
| `code_context/conventions.md` | npm scripts, ESLint setup, file layout, banned patterns | Phase 2 |
| `code_context/architecture.md` | Vite + TanStack + Zustand + Vercel Functions + Supabase + Dexie + PWA shape | Phase 2 |
| `code_context/runbook.md` | Real Vercel URLs, real Supabase project, deploy + rollback specifics | Phase 2 |
| `brand_context/voice-profile.md` | Cito-context tone (likely formal-NL), overrides root neutral default | Phase 3 |
| `brand_context/icp.md` | Cito-consultants + scholen + decisiekring | Phase 3 |
| `brand_context/positioning.md` | Concurrentie-vergelijkings-tool, scenario A (markt) vs B (migratie) | Phase 3 |
| `ADR/*.md` | Per-app ADRs (Vite, npm, ESLint, Zustand, IndexedDB rationales) | Phase 6 |
| `.claude/skills/` | App-specific skills migrated from existing top-level `skills/` folder | Phase 5 |
| `context/learnings.md` | App-specific feedback per skill — auto-populated as skills run | Phase 2 (initial scaffold) |

Pending status tracked in `.planning/tailor-state.md`.

---

## Inherited automatically from root template (no per-app declaration needed)

These apply to this app without re-declaring:

- All 5 Claude-side hooks: `branch-guard`, `secret-scan`, `dangerous-bash`, `lockfile-guard`, `typecheck-guard`
- All `.claude/settings.json` permissions (allow + deny lists)
- All 8 root foundation skills: `code-feature-build`, `code-review`, `test-write-unit`, `docs-adr`, `mkt-brand-voice`, `ops-cron`, `meta-skill-creator`, `meta-wrap-up`
- All 4 active root cron jobs — `weekly-dep-audit`, `weekly-dep-update-check`, `skill-update-check`, `monthly-learnings-health` — auto-scan this app's `package.json` and `learnings.md` once they exist
- DEV_ETHOS rules from `../../context/DEV_ETHOS.md`
- USER profile from `../../context/USER.md`
- Memory model: `git log` + `ADR/` (root + per-app) + `learnings.md` (root + per-app)
- Promotion path: skill-learnings → conventions → ADR
- Output standards from root: `projects/{category}-{type}/` for Level 1 deliverables
- **Workflow** ([ADR-0007](../../ADR/0007-single-branch-no-pr-workflow.md), supersedes the workflow parts of [ADR-0005](../../ADR/0005-otap-framework.md)) — single-branch (`main`), feature branches squash-merged directly, manual pre-merge testing, no PR ceremony, no CI gate, Vercel auto-deploys main → production
- **Two-Supabase isolation** ([ADR-0005](../../ADR/0005-otap-framework.md)) — still active: dev + prod project per app, Vercel env-var scoping, manual production migrations

---

## OTAP rollout state (per-app activation)

The OTAP root-template is installed (ADR-0005, `code_context/otap.md`). Per-app activation for concurrentoolVO is partial:

| Item | Status | Action owner |
|------|--------|--------------|
| `.env.local.example` OTAP-aware (single name, Vercel scoping note) | ✓ Done | — |
| `apps/concurrentoolVO/**` path filter in root CI workflow | ✓ Done | — |
| Local Supabase project (`concurrentool-dev` or current) | ✓ Exists | — |
| Production Supabase project (`concurrentool-prod`) | ✗ Not yet | **User** — Supabase dashboard |
| Vercel env-vars per environment scope | ✗ Not yet | **User** — Vercel dashboard |
| Vercel deploy source flipped from upstream repo to App-Dev OS | ✗ Not yet | **User** — see [`projects/ops-vercel-flip/`](../../projects/ops-vercel-flip/) |
| First production migration applied via `supabase db push --project-ref <prod-ref>` | ✗ Not yet | **User** — after prod project exists |

Tracking project: [`projects/briefs/ops-otap-rollout-concurrentoolVO/brief.md`](../../projects/briefs/ops-otap-rollout-concurrentoolVO/brief.md).

Until the manual user actions are done, the app effectively runs in pre-OTAP mode for production: deploys still come from the upstream repo and any "production" Supabase config is whatever is wired into the existing Vercel project. The framework is in place; the infra catch-up is queued.

---

## App-specific overrides on root rules

### Auto-commit-and-push behavior (overrides rekentool's pre-existing CLAUDE.md rule)

The pre-existing `CLAUDE.md` (before App-Dev OS import) contained: *"Na elke goedgekeurde wijziging: automatisch committen EN pushen naar remote."*

**Current rule under App-Dev OS (per ADR-0007):**
- `branch-guard` hook prints an advisory warning when working on `main` but does not block — direct push to main is allowed
- Impact-based-autonomy from root `USER.md`: production deploys are high-impact — direct push to main triggers Vercel deploy, so explicit approval before pushing main is still expected
- Commit-after-approval is fine (encouraged by DEV_ETHOS); push to `feature/*` automatically allowed; push to `main` allowed but only after explicit OK and the manual pre-merge test ritual (`npm run build` + `npx vitest run`)

**Effective rule for this app**: feature branches commit + push freely. Squash-merge to main + push to main happens only after the manual pre-merge tests pass and you give explicit OK.

### Build command override (this app uses npm not pnpm)

Root template typecheck guard expects `pnpm tsc --noEmit`. This app's commands are:

- `npm run dev` — Vite dev server
- `npm run build` — type-check + production build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npx vitest run` — full unit tests
- `npx vitest` — vitest watch mode
- `npx playwright test` — e2e tests
- `npx vercel dev` — local Vercel runtime (api/ functions + frontend together)

Pre-commit hook (`scripts/git-hooks/pre-commit` at root level) only runs at App-Dev OS root and only checks root `tsconfig.json`. **It does NOT type-check this app's TS files at commit time.** Per-app typecheck is currently dev-time-only (Vite HMR + IDE). Vercel build will catch type errors loudly on deploy.

If this becomes a real issue (type errors slipping past commit), extend root pre-commit to walk into changed `apps/*/tsconfig.json` files.

---

## Vercel deploy migration (deferred — separate decision)

Currently the Vercel project for this app deploys from the upstream GitHub repo `Gamingsixtie/concurrentie-rekentool-VO`. The subtree-import to App-Dev OS only made a local copy — production is fully unaffected.

To migrate Vercel deploys to use the App-Dev OS monorepo as source:

1. Push App-Dev OS itself to a new GitHub repo (no `origin` configured yet)
2. In Vercel project settings:
   - Change connected GitHub repo to the App-Dev OS repo
   - Set "Root Directory" to `apps/concurrentoolVO/`
   - Verify build command auto-detects (or set to `npm run build`)
3. Trigger deploy → validate first build matches old deploy (build size, response, no env-var drift)
4. Once validated, archive (don't delete) the old upstream repo

**When to do this**: when App-Dev OS itself becomes worth pushing to GitHub for backup/sharing, AND you want a single deploy source for all apps. Until then: keep the current setup. Subtree-import works regardless.

---

## State

This file was created in Phase 1 of per-app tailoring (see `.planning/tailor-state.md`). Phases 2-6 fill in the context layer and per-app ADRs.
