---
phase: 26-cito-prijzen-concurrentie-editor
plan: 02
subsystem: pricing-editor + tab-routing + cito-domain-grouping
tags: [wave-1, pricing, tabs, tanstack-router, search-params, dutch-ui, manager-gate]
requires:
  - 26-01 wave 0 (StartschermPage, PrijzenPage shell, shared types)
  - existing ProviderConfigForm (src/features/admin/ProviderConfigForm.tsx)
  - existing usePricingConfigs + updatePricingConfig save pipeline
  - existing usePricingDataStore (Zustand + Supabase)
provides:
  - 3 hoofdtabs UI on /prijzen (Cito Basisvaardigheden | Cito Modules | Concurrentie)
  - ConcurrentieSubTabs (DIA/JIJ!/SAQI) reusing ProviderConfigForm
  - URL-backed tab state via TanStack Router search params (D-02)
  - UI-only Cito-module grouping constants (D-03)
  - usePrijzenSearch hook for reading/writing search params
affects:
  - src/features/pricing/PrijzenPage.tsx (placeholder replaced with tab structure)
  - src/router/routes.ts (prijzenRoute now declares validateSearch)
tech-stack:
  added: []
  patterns:
    - TanStack Router validateSearch with whitelist coercion
    - ReadonlySet<string> UI-only grouping constants
    - Controlled tab components (caller owns state)
    - Save pipeline reuse: updatePricingConfig + loadFromSupabase + queryClient.invalidate
key-files:
  created:
    - apps/concurrentoolVO/src/features/pricing/constants/cito-module-grouping.ts
    - apps/concurrentoolVO/src/features/pricing/__tests__/cito-module-grouping.test.ts
    - apps/concurrentoolVO/src/features/pricing/hooks/usePrijzenSearch.ts
    - apps/concurrentoolVO/src/features/pricing/components/PrijzenTabs.tsx
    - apps/concurrentoolVO/src/features/pricing/components/ConcurrentieSubTabs.tsx
    - apps/concurrentoolVO/src/features/pricing/components/CitoBasisvaardigheidenTab.tsx
    - apps/concurrentoolVO/src/features/pricing/components/CitoModulesTab.tsx
    - apps/concurrentoolVO/src/features/pricing/__tests__/PrijzenTabs.test.tsx
  modified:
    - apps/concurrentoolVO/src/router/routes.ts (added validateSearch + type imports)
    - apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx (composed tabs)
decisions:
  - D-02 honored: tab state in URL via TanStack Router search params (deeplinkable + refresh-safe)
  - D-03 honored: UI-only grouping; zero changes to src/data/providers/*.ts or ModuleDefinition
  - D-04 honored: ModuleDefinition.category field deferred — pragmatic UI mapping first
  - VITE_SKIP_AUTH dev-bypass from 26-01 preserved as required
metrics:
  duration: ~15 minutes
  completed: 2026-05-14
  commits: 5
  tasks: 5/5
requirements_completed:
  - R-02-domein-tabs
  - R-03-real-time-save
  - R-07-no-locked-files
---

# Phase 26 Plan 02: Domein-tabs + Concurrentie sub-flow — Summary

Wave 1 of Phase 26 — replaces 26-01's placeholder body in `PrijzenPage.tsx` with the 3-hoofdtab UI specified in the SPEC: **Cito Basisvaardigheden** | **Cito Modules** | **Concurrentie** (with DIA/JIJ!/SAQI sub-tabs). Tab state lives in the URL via TanStack Router search params, the Cito basis/modules split is pure UI-mapping (zero data-file changes), and saves reuse the exact same pipeline as `AdminConfigEditor.tsx` — `updatePricingConfig` → `usePricingDataStore.loadFromSupabase()` → `queryClient.invalidateQueries`. The Concurrentie sub-tabs delegate rendering to the existing `ProviderConfigForm` (no duplication), and the manager-only gate (including the VITE_SKIP_AUTH dev-bypass added during 26-01) is preserved as-is.

## What was built

| Artifact | File | Purpose |
|---|---|---|
| `BASIS_MODULE_IDS` / `MODULES_MODULE_IDS` | `src/features/pricing/constants/cito-module-grouping.ts` | `ReadonlySet<string>` constants — UI-only split of `CITO_CONFIG.individualPrices` keys into the two Cito tabs. No data-shape change (D-03). |
| Grouping tests | `src/features/pricing/__tests__/cito-module-grouping.test.ts` | 4 tests: exact membership of both sets, zero overlap, full coverage of `CITO_CONFIG.individualPrices` keys. |
| `usePrijzenSearch` hook | `src/features/pricing/hooks/usePrijzenSearch.ts` | Reads + writes `{tab, provider}` via TanStack Router's `useSearch` / `useNavigate`. Switching to `concurrentie` auto-selects `dia` if no provider is set. |
| `prijzenRoute.validateSearch` | `src/router/routes.ts` | Whitelists tab against `['basis','modules','concurrentie']` and provider against `['dia','jij','saqi']`; invalid values fall back to defaults (mitigates T-26-02-01). |
| `PrijzenTabs` | `src/features/pricing/components/PrijzenTabs.tsx` | Controlled hoofd-tab nav with the 3 Dutch labels. Cito-primary border on active tab. |
| `ConcurrentieSubTabs` | `src/features/pricing/components/ConcurrentieSubTabs.tsx` | Controlled sub-tab nav for DIA / JIJ! / SAQI; smaller styling to nest visually. |
| Tab-component tests | `src/features/pricing/__tests__/PrijzenTabs.test.tsx` | 5 tests: 3 hoofdtabs render, active-tab marking, click callback; 3 sub-tabs render, click callback. |
| `CitoBasisvaardigheidenTab` | `src/features/pricing/components/CitoBasisvaardigheidenTab.tsx` | Edit-form for `BASIS_MODULE_IDS` subset of Cito individual prices. Filters from full `PROVIDER_CONFIGS.cito.pricingStrategy.individualPrices`, merges back on save, persists via `updatePricingConfig` + `loadFromSupabase`. |
| `CitoModulesTab` | `src/features/pricing/components/CitoModulesTab.tsx` | Same shape as basis tab, scoped to `MODULES_MODULE_IDS`. |
| `PrijzenPage` body | `src/features/pricing/PrijzenPage.tsx` | Wires `usePrijzenSearch` to `PrijzenTabs`, conditionally renders the three tab contents. Concurrentie path mounts `ConcurrentieSubTabs` + the existing `ProviderConfigForm` with the AdminConfigEditor-style save handler. Manager gate + VITE_SKIP_AUTH dev-bypass preserved. |

## Tab-state URL examples (D-02)

- `/prijzen` → defaults to `tab=basis`, no provider
- `/prijzen?tab=modules` → opens the Cito Modules tab
- `/prijzen?tab=concurrentie` → opens Concurrentie, defaults provider to `dia`
- `/prijzen?tab=concurrentie&provider=jij` → opens Concurrentie + JIJ! sub-tab
- `/prijzen?tab=concurrentie&provider=saqi` → opens Concurrentie + SAQI sub-tab
- Invalid values (e.g. `?tab=nonsense`) → coerced to `tab=basis` by `validateSearch`

## Save-pipeline reuse confirmed

All three save flows (Cito basis tab, Cito modules tab, Concurrentie sub-tab) share the identical pipeline established by `AdminConfigEditor.tsx`:

1. Find the active `pricing_configs` row via `usePricingConfigs` (filtered by `provider` + `is_active`)
2. Call `updatePricingConfig(id, newConfig)` — increments `version`, writes audit log (mitigates T-26-02-04 by reuse)
3. `await usePricingDataStore.getState().loadFromSupabase()` — refreshes runtime engine data
4. `queryClient.invalidateQueries({ queryKey: ['pricing-configs'] })` — keeps React Query cache in sync

The Cito tabs' merge step (`{ ...citoStrategy.individualPrices, ...localPrices }`) is safe because both `BASIS_MODULE_IDS` and `MODULES_MODULE_IDS` are `ReadonlySet`s and `localPrices` is seeded by filtering the full `individualPrices` keys — no foreign keys can be injected (mitigates T-26-02-03).

## Verification — what passed

- `cd apps/concurrentoolVO && npx tsc --noEmit` — clean (zero errors), run after every Write/Edit per typecheck-guard.
- `cd apps/concurrentoolVO && npm run build` — clean, dist generated, PWA precache regenerated.
- `cd apps/concurrentoolVO && npm run lint` — 0 errors. 12 pre-existing warnings in unrelated files (`ExportTab`, `AnalysisPanel`, `PriceProposalModal`, `ConversationForm`, `DashboardTab`, `ProductsTab`, `SchoolplanTab`) — out of scope per execute-plan SCOPE BOUNDARY.
- `cd apps/concurrentoolVO && npx vitest run src/features/pricing src/features/startscherm` — **36/36 tests pass across 6 test files** (24 pre-existing pricing tests stay green; 4 new grouping tests + 5 new tab tests; 3 startscherm tests unchanged).
- **Locked-files guard:** `git diff HEAD~5 HEAD --name-only -- apps/concurrentoolVO/src/data/` returns empty. `src/data/default-prices.ts`, `src/data/cito-migration-prices.ts`, and `src/data/providers/*.ts` are all untouched across the entire plan.

## Locked-files confirmed unchanged

- `apps/concurrentoolVO/src/data/default-prices.ts` — untouched.
- `apps/concurrentoolVO/src/data/cito-migration-prices.ts` — untouched.
- `apps/concurrentoolVO/src/data/providers/cito.ts` — untouched.
- `apps/concurrentoolVO/src/data/providers/dia.ts` — untouched.
- `apps/concurrentoolVO/src/data/providers/jij.ts` — untouched.
- `apps/concurrentoolVO/src/data/providers/saqi.ts` — untouched.
- `src/models/pricing.ts` — untouched (D-04 honored).

## Deviations from Plan

### 1. [Rule 1 — Bug fix during Task 2] Typed search-reducer parameter

- **Found during:** Task 2 verify (`npm run build`).
- **Issue:** The plan's example `setTab` / `setProvider` reducers used `(prev: Record<string, unknown>)`. TanStack Router's `useNavigate` infers `search:` as a `ParamsReducerFn` whose return type must conform to `PrijzenSearchParams` (with `tab?: PrijzenTab`). Returning `tab: string` from a `Record<string, unknown>`-typed `prev` failed `TS2322`.
- **Fix:** Typed the reducer parameter and return type as `PrijzenSearchParams` directly:
  ```ts
  search: (prev: PrijzenSearchParams): PrijzenSearchParams => ({ ... })
  ```
- **Files modified:** `apps/concurrentoolVO/src/features/pricing/hooks/usePrijzenSearch.ts`
- **Commit:** `b031662`
- **Impact:** None functional — the runtime behavior is identical. Strictly a type-correctness fix.

### 2. [Acceptance criteria letter vs. spirit] grep regex pattern

- **Found during:** Task 5 acceptance check.
- **Issue:** The PLAN listed an acceptance criterion of `grep -c "userProfile\?\.role !== 'manager'" >= 1` (with escaped `\?`). PowerShell + ripgrep behave differently with escaped vs. unescaped `?`. With `grep -c "userProfile?.role !== 'manager'"` the count is 1, which matches the spirit (manager-gate exists in PrijzenPage).
- **Fix:** None needed — verified `grep -c "userProfile?.role !== 'manager'"` returns 1.
- **Impact:** None.

## Threat-model coverage

| Threat ID | Disposition | How addressed in this plan |
|-----------|-------------|----------------------------|
| T-26-02-01 (Tampering on URL search params) | mitigate | `prijzenRoute.validateSearch` whitelists tab + provider; invalid values fall back to `'basis'` / `undefined`. |
| T-26-02-02 (Spoofing client-side manager-gate) | accept | Same client-side `userProfile?.role !== 'manager'` UX gate as 26-01; Supabase RLS remains the real protection (untouched). |
| T-26-02-03 (Tampering with `individualPrices` merge) | mitigate | `localPrices` is seeded by filtering through `BASIS_MODULE_IDS` / `MODULES_MODULE_IDS` ReadonlySets; spread merge cannot inject new keys outside what was loaded from `PROVIDER_CONFIGS.cito.pricingStrategy.individualPrices`. |
| T-26-02-04 (Repudiation — who edited prices) | accept | Reuses existing `price_audit_log` insert inside `updatePricingConfig` (lines 95-103 of `pricing-operations.ts`) — no new audit gap. |

## Contracts available to downstream plans (26-03 / 04)

- Search-param shape `?tab=basis|modules|concurrentie&provider=dia|jij|saqi` is now validated at route level.
- `usePrijzenSearch()` is the canonical reader/writer — 26-03 (export button) and 26-04 (AI Excel-import) should NOT bypass it.
- The `Cito*Tab` save pipeline is the template for any future provider tab — copy + filter the modules.
- `PrijzenPage.tsx` is the single composition point. 26-03's export button slots above `<PrijzenTabs/>`, 26-04's import button slots in the same header region.

## Commits

| Hash | Task | Subject |
|---|---|---|
| `275ef7d` | 1 | `feat(26-02): add Cito module grouping constants for prijzen tabs` |
| `b031662` | 2 | `feat(26-02): add usePrijzenSearch hook + prijzenRoute validateSearch (D-02)` |
| `0acd308` | 3 | `feat(26-02): add PrijzenTabs + ConcurrentieSubTabs controlled components` |
| `b8e3ea7` | 4 | `feat(26-02): add CitoBasisvaardigheidenTab + CitoModulesTab edit forms` |
| `009c2aa` | 5 | `feat(26-02): compose PrijzenPage with 3 hoofdtabs + concurrentie sub-flow` |

## Known Stubs

None. All three save-flows write through to Supabase via the existing pipeline. No mock data, no `coming soon` placeholders.

## Self-Check: PASSED

- `apps/concurrentoolVO/src/features/pricing/constants/cito-module-grouping.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/cito-module-grouping.test.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/hooks/usePrijzenSearch.ts` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/PrijzenTabs.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/ConcurrentieSubTabs.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/CitoBasisvaardigheidenTab.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/components/CitoModulesTab.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/PrijzenTabs.test.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/PrijzenPage.tsx` — MODIFIED (placeholder replaced with tab composition)
- `apps/concurrentoolVO/src/router/routes.ts` — MODIFIED (validateSearch added to prijzenRoute)
- Commit `275ef7d` — FOUND in `git log`
- Commit `b031662` — FOUND in `git log`
- Commit `0acd308` — FOUND in `git log`
- Commit `b8e3ea7` — FOUND in `git log`
- Commit `009c2aa` — FOUND in `git log`
- Locked files `default-prices.ts`, `cito-migration-prices.ts`, all `src/data/providers/*.ts` — VERIFIED UNCHANGED across all 5 commits
