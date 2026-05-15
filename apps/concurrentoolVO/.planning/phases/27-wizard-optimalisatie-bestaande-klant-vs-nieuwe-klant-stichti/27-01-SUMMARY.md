---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 01
subsystem: testing
tags: [test-scaffolds, type-relocation, dexie-migration-prep, wave-0, vitest, playwright]

# Dependency graph
requires:
  - phase: 22-test-coverage-baseline
    provides: vitest coverage thresholds (27/18/25/27), 122 baseline test files
  - phase: 11-migration-engine
    provides: TimeSavingTask, TIME_SAVING_TASKS, TimeSavingResult definitions in models/engine
provides:
  - src/models/time-savings.ts as the new canonical home for time-savings types
  - 9 vitest scaffold files + 2 playwright scaffold files (57 it.todo + 2 test.skip)
  - Backward-compat re-export shims in src/models/migration.ts and src/engine/migration.ts
affects: [phase-27-02, phase-27-03, phase-27-04, phase-27-07, phase-27-08, phase-27-09, phase-27-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Backward-compat type re-export shim — old paths re-export from new canonical location during multi-plan refactors"
    - "Test scaffold pattern: it.todo() per acceptance bullet so vitest reports pending coverage without false-positive greens"
    - "Playwright skip-scaffold pattern: test.skip with TODO(Plan XX) comment for downstream wave implementation"

key-files:
  created:
    - src/models/time-savings.ts
    - src/db/__tests__/stichting-operations.test.ts
    - src/db/__tests__/migration-v3.test.ts
    - src/features/stichtingen/__tests__/csv-export.test.ts
    - src/features/stichtingen/__tests__/pdf-aggregation.test.ts
    - src/lib/__tests__/painPointKeywordMap.test.ts
    - src/lib/__tests__/ai-match-pijnpunt.test.ts
    - src/lib/__tests__/stichtingMatcher.test.ts
    - src/engine/__tests__/price-comparison-upsell.test.ts
    - src/data/__tests__/module-catalog.test.ts
    - e2e/stichting-crud.spec.ts
    - e2e/wizard-phase-27.spec.ts
  modified:
    - src/models/migration.ts (now re-export shim)
    - src/engine/migration.ts (TimeSavingResult re-exported)
    - src/features/school-profile/components/TimeSavingsSection.tsx (imports updated)

key-decisions:
  - "[Phase 27-01]: Type relocation done before any downstream cleanup so migration.ts deletion in Plan 27-10 cannot break TimeSavingsSection compile path"
  - "[Phase 27-01]: Backward-compat shims kept in src/models/migration.ts + src/engine/migration.ts so untouched callers (db/types.ts, store.ts, ai-analysis.ts) keep working — Plan 27-10 removes shims"
  - "[Phase 27-01]: Test scaffolds use it.todo() not it.skip() — todos are reported as pending in vitest output, surfacing missing coverage to the planner"
  - "[Phase 27-01]: ValueReportSection.tsx left untouched — plan listed it but actual file only consumes MigrationResult from @/engine/migration, not the three relocated symbols directly"

patterns-established:
  - "Multi-wave refactor pattern: relocate canonical home first (Wave 0), keep re-export shim during transition waves, delete shim in cleanup wave"
  - "Scaffold-first testing: every Phase 27 requirement (R1, R2, R6, R9, R10, R11) has at least one test file with it.todo placeholders before any production code lands"

requirements-completed: [R1, R2, R6, R9, R10, R11]

# Metrics
duration: ~35min
completed: 2026-05-15
---

# Phase 27 Plan 01: Type Relocation + Test Scaffolds Summary

**TimeSavingTask / TIME_SAVING_TASKS / TimeSavingResult relocated to `src/models/time-savings.ts` with backward-compat shims, plus 11 test scaffolds (57 it.todo + 2 playwright skip) covering R1, R2, R6, R9, R10, R11**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-15T00:18:00Z
- **Completed:** 2026-05-15T00:32:00Z
- **Tasks:** 2 (both fully automated)
- **Files modified:** 15 (4 modified + 11 created — see Deviations for the 16-vs-15 plan delta)

## Accomplishments

- New `src/models/time-savings.ts` is the canonical home for the three relocated types — Plan 27-10 can now safely delete `src/models/migration.ts` and the `TimeSavingResult` declaration in `src/engine/migration.ts` without breaking `TimeSavingsSection.tsx`
- Backward-compat re-export shims keep all unrelated callers (`src/db/types.ts`, `src/features/price-comparison/store.ts`, `src/lib/ai-analysis.ts`) working without any code change in this plan
- 9 vitest scaffold files detected by the runner (test files 122 → 131, +57 it.todo); 2 playwright scaffolds detected by `playwright test --list` (20 tests / 7 files)
- Build is green; vitest is green (969 passed, no regressions); coverage thresholds untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Relocate TimeSavingTask + TIME_SAVING_TASKS + TimeSavingResult to `src/models/time-savings.ts`** — `57b1475` (refactor)
2. **Task 2: Add 11 Phase 27 test scaffolds (R1, R2, R6, R9, R10, R11)** — `dec5fb6` (test)

## Files Created/Modified

### Created
- `apps/concurrentoolVO/src/models/time-savings.ts` — canonical home for `TimeSavingTask`, `TIME_SAVING_TASKS`, `TimeSavingResult`
- `apps/concurrentoolVO/src/db/__tests__/stichting-operations.test.ts` — R1 CRUD scaffold (12 todos)
- `apps/concurrentoolVO/src/db/__tests__/migration-v3.test.ts` — R11 Dexie v3 scaffold (5 todos)
- `apps/concurrentoolVO/src/features/stichtingen/__tests__/csv-export.test.ts` — R2 CSV export scaffold (5 todos)
- `apps/concurrentoolVO/src/features/stichtingen/__tests__/pdf-aggregation.test.ts` — R2 PDF aggregation scaffold (5 todos)
- `apps/concurrentoolVO/src/lib/__tests__/painPointKeywordMap.test.ts` — R9 rule-based fallback scaffold (7 todos)
- `apps/concurrentoolVO/src/lib/__tests__/ai-match-pijnpunt.test.ts` — R9 AI-mocked matcher scaffold (5 todos)
- `apps/concurrentoolVO/src/lib/__tests__/stichtingMatcher.test.ts` — D-03 smart-suggestion scaffold (6 todos)
- `apps/concurrentoolVO/src/engine/__tests__/price-comparison-upsell.test.ts` — R10 Basis-Plus upsell scaffold (6 todos)
- `apps/concurrentoolVO/src/data/__tests__/module-catalog.test.ts` — R6 Burgerschap + Digi-gel scaffold (6 todos)
- `apps/concurrentoolVO/e2e/stichting-crud.spec.ts` — R1 E2E scaffold (1 test.skip with TODO)
- `apps/concurrentoolVO/e2e/wizard-phase-27.spec.ts` — R3-R10 wizard happy-path scaffold (1 test.skip with TODO)

### Modified
- `apps/concurrentoolVO/src/models/migration.ts` — three declarations replaced by re-export from `@/models/time-savings`; `MIGRATION_MODULE_BENEFITS` block left intact (Plan 27-10 may move it)
- `apps/concurrentoolVO/src/engine/migration.ts` — `TimeSavingResult` interface replaced by re-export; local import switched to `../models/time-savings`
- `apps/concurrentoolVO/src/features/school-profile/components/TimeSavingsSection.tsx` — imports consolidated to single `@/models/time-savings` source

## Decisions Made

See `key-decisions` in frontmatter. Most consequential:
- **ValueReportSection.tsx untouched** — plan's `<files>` and `<action>` step 4 listed this file, but inspection shows it only imports `MigrationResult` from `@/engine/migration` (not any of the three relocated symbols). Since the engine re-export keeps `MigrationResult` working transparently, no edit was needed. Logged below as a benign plan-vs-reality delta.
- **TimeSavingTask kept as a value-side import in `engine/migration.ts`** despite being declared as `import type` — the existing file already had it as `type`-import, plus the value-side `TIME_SAVING_TASKS` import. Both rewired to the new path without changing import semantics.

## Deviations from Plan

### Plan-vs-reality delta (not a code issue)

**1. [Rule 1 — accuracy correction] Plan listed `ValueReportSection.tsx` in `<files>` and step 4 of Task 1, but the file does not directly import the three relocated symbols**
- **Found during:** Task 1 (pre-edit Read of `ValueReportSection.tsx`)
- **Issue:** Plan's `key_links` and `<action>` step 4 implied `ValueReportSection.tsx` had to be edited to point at `@/models/time-savings`. Actual file only imports `import type { MigrationResult } from '@/engine/migration'` — neither `TimeSavingTask` nor `TIME_SAVING_TASKS` nor `TimeSavingResult` appear in its import list.
- **Fix:** No edit performed. The engine-side `MigrationResult` type still includes `TimeSavingResult[]` correctly because `engine/migration.ts` re-exports from the new canonical home, so transitive typing remains intact.
- **Files modified:** none (this is a non-deviation explained for traceability)
- **Verification:** Build green, vitest 969 passed, no `TimeSavingResult`/`TimeSavingTask`/`TIME_SAVING_TASKS` references remain via `Grep` in the file.
- **Committed in:** N/A (no-op)

### Verification expectation mismatch

**2. [Rule 1 — accuracy correction] Plan `<verification>` expects 16 files changed, actual is 15**
- **Found during:** Task 2 (post-commit `git diff --stat` review)
- **Issue:** Plan's verification gate says `git diff --stat toont 16 files changed`. Actual count is 15 (4 modified + 11 created) because `ValueReportSection.tsx` did not need editing (see Deviation 1).
- **Fix:** Both task verifications still pass (build green, vitest 969 passed, all 11 scaffolds detected). The 16-vs-15 number was a plan-side off-by-one based on an incorrect assumption about which files import the relocated types.
- **Files modified:** none
- **Verification:** `git diff --name-only 57b1475^..dec5fb6 -- apps/concurrentoolVO/src apps/concurrentoolVO/e2e | wc -l` = 15.
- **Committed in:** N/A

---

**Total deviations:** 0 code-side (both items above are plan-text vs reality clarifications, no auto-fix was needed)
**Impact on plan:** All `must_haves.truths` satisfied. All 12 `must_haves.artifacts` produced. `key_links` for `TimeSavingsSection.tsx` realised; the second `key_link` for `src/engine/migration.ts` realised via the re-export.

## Issues Encountered

- **Initial slip on `engine/migration.ts`** — first edit removed the local `TimeSavingResult` interface and added `export type { ... }` re-export only, which left lines 39 + 114 referring to an unbound `TimeSavingResult` name. Caught immediately on the build attempt and fixed in the same task by adding `import type { TimeSavingResult, ... }` from `../models/time-savings`. No commit needed before the fix because the build run came after the consolidated edit pass. Lesson logged for `code-feature-build` learnings: `export type { X }` does NOT create a local binding — combine with `import type` when the file still uses `X` locally.

## Self-Check: PASSED

- Files exist:
  - FOUND: apps/concurrentoolVO/src/models/time-savings.ts
  - FOUND: apps/concurrentoolVO/src/db/__tests__/stichting-operations.test.ts
  - FOUND: apps/concurrentoolVO/src/db/__tests__/migration-v3.test.ts
  - FOUND: apps/concurrentoolVO/src/features/stichtingen/__tests__/csv-export.test.ts
  - FOUND: apps/concurrentoolVO/src/features/stichtingen/__tests__/pdf-aggregation.test.ts
  - FOUND: apps/concurrentoolVO/src/lib/__tests__/painPointKeywordMap.test.ts
  - FOUND: apps/concurrentoolVO/src/lib/__tests__/ai-match-pijnpunt.test.ts
  - FOUND: apps/concurrentoolVO/src/lib/__tests__/stichtingMatcher.test.ts
  - FOUND: apps/concurrentoolVO/src/engine/__tests__/price-comparison-upsell.test.ts
  - FOUND: apps/concurrentoolVO/src/data/__tests__/module-catalog.test.ts
  - FOUND: apps/concurrentoolVO/e2e/stichting-crud.spec.ts
  - FOUND: apps/concurrentoolVO/e2e/wizard-phase-27.spec.ts
- Commits exist:
  - FOUND: 57b1475 (Task 1: refactor type relocation)
  - FOUND: dec5fb6 (Task 2: 11 test scaffolds)

## User Setup Required

None — no external service configuration required for this plan. Production deploy unaffected (re-export shims keep the runtime contract identical).

## Next Phase Readiness

- **Plan 27-02 (Dexie v3 + Stichting CRUD)** can land: `migration-v3.test.ts` and `stichting-operations.test.ts` scaffolds are in place for TDD GREEN passes
- **Plan 27-03 (smart-suggestion)** can land: `stichtingMatcher.test.ts` scaffold ready
- **Plan 27-04 (stichting export)** can land: `csv-export.test.ts` + `pdf-aggregation.test.ts` scaffolds ready
- **Plan 27-07 (Step 3 modules)** can land: `module-catalog.test.ts` scaffold ready
- **Plan 27-08 (pijnpunt matching)** can land: `painPointKeywordMap.test.ts` + `ai-match-pijnpunt.test.ts` scaffolds ready
- **Plan 27-09 (Cito Basis vs Plus)** can land: `price-comparison-upsell.test.ts` scaffold ready
- **Plan 27-10 (cleanup)** must remove the backward-compat shims in `src/models/migration.ts` and `src/engine/migration.ts` and update remaining importers (`src/db/types.ts`, `src/features/price-comparison/store.ts`, `src/lib/ai-analysis.ts`)
- **Playwright scaffolds**: `stichting-crud.spec.ts` and `wizard-phase-27.spec.ts` are detected by `playwright test --list` and skipped at runtime — no e2e flake risk

---
*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Plan: 01*
*Completed: 2026-05-15*
