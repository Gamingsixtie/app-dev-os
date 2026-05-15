---
phase: 26-cito-prijzen-concurrentie-editor
plan: 05
subsystem: end-to-end test coverage + verification checklist (wave 2 capstone)
tags: [wave-2, capstone, integration-test, unit-test, verification-checklist, human-verify]
requires:
  - 26-01 (StartschermPage + PrijzenPage shell + manager-gate)
  - 26-02 (3-tab UI + Concurrentie sub-tabs + URL search-params)
  - 26-03 (PriceListExportButton + 4 export formats)
  - 26-04 (PriceImportFlow + PriceImportDiffView + AI Excel-import)
provides:
  - PrijzenPage integration test (composition verification)
  - PriceImportDiffView unit tests (10 tests, full UI-contract coverage)
  - 26-VERIFICATION-CHECKLIST.md (18 checks: 14 SPEC AC + 4 smoke)
affects:
  - apps/concurrentoolVO/src/features/pricing/__tests__/ (added 2 test files)
  - apps/concurrentoolVO/.planning/phases/26-.../26-VERIFICATION-CHECKLIST.md (new)
tech-stack:
  added: []
  patterns:
    - vi.hoisted + vi.stubEnv to control import.meta.env.VITE_SKIP_AUTH before module evaluation
    - vi.mock heavy children (CitoBasisvaardigheidenTab, PriceListExportButton, PriceImportFlow)
      to keep integration tests focused on composition
    - fireEvent.click for React state-updating clicks (wraps in act())
key-files:
  created:
    - apps/concurrentoolVO/src/features/pricing/__tests__/PrijzenPage.integration.test.tsx
    - apps/concurrentoolVO/src/features/pricing/__tests__/PriceImportDiffView.test.tsx
    - apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-VERIFICATION-CHECKLIST.md
  modified: []
decisions:
  - "Test isolation via vi.mock of heavy children: PrijzenPage composition is verified
     by checking visible Dutch labels + data-testid markers on stubbed children;
     internal logic of children is covered by their own existing tests."
  - "VITE_SKIP_AUTH stubbed to 'false' via vi.hoisted (runs before module load) — required
     because PrijzenPage reads import.meta.env.VITE_SKIP_AUTH at module-evaluation time
     into a const. Otherwise a developer's local .env.local with SKIP_AUTH=true would
     mask the 'Geen toegang' gate behavior in tests."
  - "Checkpoint:human-verify task delivered as static markdown checklist, not interactive
     prompt. The 18 checks map 1-op-1 to SPEC.md (14 AC) + smoke-checks (4)."
requirements_completed:
  - R-01-startscherm-twee-cards (verified by AC-1, AC-2 in checklist)
  - R-02-domein-tabs (AC-4, AC-5)
  - R-03-real-time-save (AC-6)
  - R-04-multi-format-export (AC-7)
  - R-05-export-branding-disclaimer (AC-8)
  - R-06-ai-excel-import-diff-preview (AC-9, AC-10 + new PriceImportDiffView tests)
  - R-07-no-locked-files (AC-11 + automated guard)
  - R-08-manager-only-gate (AC-12 + new PrijzenPage integration test)
metrics:
  duration: ~15 minutes
  completed: 2026-05-14
  commits: 2 (test + docs)
  tasks: 2/3 automated + 1 checkpoint (awaiting human verification)
---

# Phase 26 Plan 05: End-to-end verification — Summary

Wave 2 capstone for Phase 26 — closes the loop on the four wave-1 deliverables (startscherm, domein-tabs, multi-format export, AI Excel-import) with end-to-end test coverage and a structured human-verification checklist. PrijzenPage is now covered by an integration test that asserts the composition (manager-gate + heading + tabs + export/import buttons + tab-content routing + import-flow toggle). PriceImportDiffView — which shipped without its own dedicated unit test in 26-04 — now has 10 tests covering the full UI contract. A markdown checklist with 18 checks maps 1-op-1 to the 14 SPEC.md acceptance criteria plus 4 smoke-checks (deeplink, /admin redirect, server-only AI key, lazy export-bundles); the user walks through it manually before Phase 26 is signed off.

## What was built

| Artifact | File | Purpose |
|---|---|---|
| `PrijzenPage.integration.test.tsx` | `src/features/pricing/__tests__/` | 6 tests verifying composition: (1) `Geen toegang` voor accountmanager, (2) heading + 3 tabs + export + import knoppen voor manager, (3) basis-tab content render, (4) modules-tab content render, (5) concurrentie sub-tabs + ProviderConfigForm render, (6) import-flow toggle on button click. Uses `vi.hoisted` + `vi.stubEnv('VITE_SKIP_AUTH', 'false')` so the manager-gate test fires even when a developer's local `.env.local` overrides the flag. Heavy children (`CitoBasisvaardigheidenTab`, `PriceListExportButton`, `PriceImportFlow`, etc.) are mocked to keep the test focused on composition. |
| `PriceImportDiffView.test.tsx` | `src/features/pricing/__tests__/` | 10 tests: empty-diff → `Geen wijzigingen gevonden` + `Sluiten` button; `changed:false` rows filtered out; default state = all selected + `Bevestig N wijzigingen` shows full count; AI-notitie display; "Alles selecteren" toggle → 0/all roundtrip with disabled button at 0; per-row checkbox updates counter + singular/plural label; `onConfirm` called with correct ReadonlySet (full + subset); `onCancel` called on Annuleer without `onConfirm`; `saving=true` disables confirm with "Opslaan…" label. |
| `26-VERIFICATION-CHECKLIST.md` | `.planning/phases/26-.../` | 18 checkboxes: AC-1 t/m AC-14 (1-op-1 with SPEC.md § Acceptance Criteria lines 111-124) + S-1 t/m S-4 (deeplink, `/admin` redirect, `VITE_ANTHROPIC` leak guard, lazy PDF/Word bundle verification via Network tab). Includes a sign-off block and a step-by-step "how to use" section. |

## Verification — what passed

| Check | Result |
|---|---|
| `npx tsc --noEmit` (apps/concurrentoolVO) | clean, zero errors |
| `npm run build` | **PASS** — exit 0, dist generated, PWA precache 66 entries (4056.50 KiB) |
| `npm run lint` | **PASS** — 0 errors. 12 pre-existing warnings in unrelated files (`SchoolLayout`, `WizardShell`, `ExportTab`, `AnalysisPanel`, `PriceProposalModal`, `ConversationForm`, `DashboardTab`, `ProductsTab`, `SchoolplanTab`) — out of scope per execute-plan SCOPE BOUNDARY |
| `npx vitest run` (full suite) | **PASS** — **959/959 tests across 122 files** |
| `npx vitest run src/features/pricing` | **PASS** — **100/100 tests across 13 files** (16 new from 26-05 + 84 pre-existing) |
| Locked-files guard: `git diff main..HEAD -- src/data/default-prices.ts src/data/cito-migration-prices.ts` | **PASS** — empty diff |
| Server-only AI key guard: `grep -rE "VITE_ANTHROPIC" {src,api,dist}` | **PASS** — 0 matches |

## Test coverage delta

| File | Tests before 26-05 | Tests after 26-05 |
|---|---:|---:|
| `PrijzenPage.integration.test.tsx` | 0 | **6 (new)** |
| `PriceImportDiffView.test.tsx` | 0 | **10 (new)** |
| **Pricing suite total** | 84 | **100** |
| **Full vitest suite** | 943 | **959** |

(Pre-existing pricing tests stay green: `cito-module-grouping`, `PrijzenTabs`, `excel-parser`, `price-diff`, `price-import-schemas`, `price-list-html`, `price-list-snapshot`, `price-list-txt`, `config-editor`, `price-flag`, `review-queue` — 84 tests.)

## Deviations from Plan

### 1. [Rule 3 — Blocking issue] vi.stubEnv alone wasn't enough — needed vi.hoisted

- **Found during:** First vitest run of `PrijzenPage.integration.test.tsx`.
- **Issue:** `vi.stubEnv('VITE_SKIP_AUTH', 'false')` at top-level runs AFTER the `import { PrijzenPage }` at the bottom of the file evaluates `const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true'` at module-load time. Because the test runner had `VITE_SKIP_AUTH=true` in the actual env (Vite reads `.env.local` for tests too), `SKIP_AUTH` was captured as `true` and the manager-gate test failed: the page rendered the full composition even with `userProfile.role = 'accountmanager'`.
- **Fix:** Wrapped a `process.env.VITE_SKIP_AUTH = 'false'` assignment in `vi.hoisted(() => {...})`, which Vitest hoists to the top of the file BEFORE all imports. Kept the `vi.stubEnv` for symmetry/cleanup. Both layers cooperate.
- **Files modified:** `src/features/pricing/__tests__/PrijzenPage.integration.test.tsx`
- **Impact:** Pure test-infrastructure fix; no production code change.

### 2. [Rule 1 — Bug fix] `.click()` not wrapped in act → fireEvent.click

- **Found during:** First vitest run of `PrijzenPage.integration.test.tsx`.
- **Issue:** Used native DOM `element.click()` to fire the "Importeer prijzen uit Excel" button. React 19 + jsdom emitted an `act(...)` warning and the import-flow div didn't appear in the DOM before the subsequent `expect` assertion ran.
- **Fix:** Replaced `screen.getByText(...).click()` with `fireEvent.click(screen.getByText(...))` — `fireEvent` wraps in `act` automatically.
- **Files modified:** `src/features/pricing/__tests__/PrijzenPage.integration.test.tsx`
- **Impact:** Test now passes; assertion fires AFTER the React state update is committed.

### 3. [Task 3 — checkpoint:human-verify] Not blocked; deliverable IS the checklist

- **Note:** Plan task 3 is `type="checkpoint:human-verify"` — per execution protocol, the deliverable is the checklist itself (already created in task 2). I do NOT pause and wait for the user inside this executor agent; the orchestrator (`/gsd-verify-phase 26`) picks up from here.
- **Status:** Marked "awaiting human verification" in the return summary.

## Known Stubs

None. All four wave-1 deliverables are wired through real save-paths (Supabase, AI endpoint, blob download). The tests use mocks only for isolation; no mock data leaks into production.

## Threat-model coverage

| Threat ID | Disposition | How addressed |
|-----------|-------------|---------------|
| T-26-05-01 (Info Disclosure — real Excel during verification) | accept | Documented in checklist as dev-mode-only ritual; dev Supabase + dev Anthropic key. |
| T-26-05-02 (Tampering — test mocks may hide regressions) | mitigate | The manual verification checklist forces a real-environment walk-through; mocks are used only inside vitest. The locked-files `git diff` and `VITE_ANTHROPIC` `grep` invariants are NOT mocked. |

## Contracts available downstream

Phase 26 is now testable end-to-end:
- Integration test covers the composition of all 4 wave-1 deliverables in a single render-pass.
- Unit test fully covers the diff-view UI contract (the most user-visible AI-import surface).
- Manual checklist provides a structured walk-through that catches what unit/integration tests cannot (PDF visual output, real Anthropic API call, lazy-bundle Network-tab verification).

## Commits

| Hash | Task | Subject |
|---|---|---|
| `d3a55b1` | 1 | `test(26-05): add PrijzenPage integration test + PriceImportDiffView unit tests` |
| `6231c36` | 2 | `docs(26-05): add Phase 26 verification checklist` |

## Awaiting

**Task 3 (checkpoint:human-verify):** User walks through `26-VERIFICATION-CHECKLIST.md`. Types **"approved"** when all 18 checkboxes pass, then `/gsd-verify-phase 26` closes Phase 26.

If any check fails: user describes the failure per checklist-item and Claude proposes a gap-closure plan.

## Self-Check: PASSED

- `apps/concurrentoolVO/src/features/pricing/__tests__/PrijzenPage.integration.test.tsx` — FOUND
- `apps/concurrentoolVO/src/features/pricing/__tests__/PriceImportDiffView.test.tsx` — FOUND
- `apps/concurrentoolVO/.planning/phases/26-cito-prijzen-concurrentie-editor-startscherm-entry-naast-sch/26-VERIFICATION-CHECKLIST.md` — FOUND
- Commit `d3a55b1` — FOUND in `git log`
- Commit `6231c36` — FOUND in `git log`
- Locked files (`default-prices.ts`, `cito-migration-prices.ts`) — VERIFIED UNCHANGED across `main..HEAD`
- `grep -rE "VITE_ANTHROPIC" {src,api,dist}` — 0 matches
- `npm run build` — PASS
- `npm run lint` — 0 errors
- `npx vitest run` — 959/959 PASS
