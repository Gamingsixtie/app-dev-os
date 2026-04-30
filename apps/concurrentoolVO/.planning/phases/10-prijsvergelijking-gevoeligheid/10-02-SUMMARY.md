---
phase: 10-prijsvergelijking-gevoeligheid
plan: 02
subsystem: ui-store
tags: [mode-toggle, sensitivity-ui, sales-signals, dynamic-columns, dia-packages, period-toggle]
dependency_graph:
  requires: [dia-package-engine, hybrid-scenario-engine, sensitivity-engine, sales-signals-engine, comparison-ui]
  provides: [mode-aware-comparison-page, sensitivity-section-ui, sales-signal-badges, dynamic-column-table]
  affects: [price-comparison-page, comparison-table, comparison-chart, module-detail-panel]
tech_stack:
  added: []
  patterns: [zustand-store-extension, conditional-column-rendering, mode-toggle-pattern, collapsible-disclosure]
key_files:
  created:
    - src/features/price-comparison/ModeToggle.tsx
    - src/features/price-comparison/PeriodToggle.tsx
    - src/features/price-comparison/SalesSignalBadge.tsx
    - src/features/price-comparison/SensitivitySection.tsx
    - src/features/price-comparison/__tests__/mode-toggle.test.tsx
  modified:
    - src/features/price-comparison/store.ts
    - src/features/price-comparison/ComparisonTable.tsx
    - src/features/price-comparison/ComparisonChart.tsx
    - src/features/price-comparison/ModuleDetailPanel.tsx
    - src/features/price-comparison/PriceComparisonPage.tsx
    - src/features/price-comparison/__tests__/store.test.ts
    - src/features/price-comparison/__tests__/ComparisonTable.test.tsx
    - src/models/school.ts
decisions:
  - "isInternalMode defaults to true (internal mode is the primary use case for accountmanagers)"
  - "activeCompetitor determined by alphabetical moduleId sort for deterministic ordering"
  - "Sensitivity data computed unconditionally in store; UI conditionally shows based on isInternalMode"
  - "JIJ column shown only when school has at least one module with currentProvider 'jij'"
  - "3-year contract period uses placeholder factor 2.85x (exact pricing TBD)"
metrics:
  duration: 9min
  completed: 2026-03-22T22:35:00Z
  tasks_completed: 4
  tasks_total: 4
  test_count: 5
  files_created: 5
  files_modified: 8
---

# Phase 10 Plan 02: Store Extension and UI Components for Mode Toggle, Sensitivity, and Sales Signals Summary

Extended Zustand store with mode/period/sensitivity/hybrid/DIA-package state, built 4 new components (ModeToggle, PeriodToggle, SalesSignalBadge, SensitivitySection), wired into existing ComparisonTable/Chart/DetailPanel/Page with dynamic columns and conditional rendering.

## What Was Built

### Task 1: Extended Store + New Standalone Components
- **Store** (`src/features/price-comparison/store.ts`): Added `isInternalMode`, `contractPeriod`, `hybridResult`, `sensitivityResult`, `diaPackageResult`, `activeCompetitor`. Both `initialize()` and `recalculate()` now compute extended results via DIA package engine, hybrid scenario engine, and sensitivity engine. `activeCompetitor` uses deterministic alphabetical moduleId ordering.
- **ModeToggle** (`ModeToggle.tsx`): Intern/Extern toggle with Cito primary styling. Shows "Geschikt voor scherm delen met school" hint in external mode.
- **PeriodToggle** (`PeriodToggle.tsx`): Per jaar / 3-jarig contract toggle with amber warning banner for placeholder pricing.
- **SalesSignalBadge** (`SalesSignalBadge.tsx`): Colored badge (green/yellow/red) with tooltip description.
- **SensitivitySection** (`SensitivitySection.tsx`): Collapsible disclosure with scenario table (0/10/20% korting), break-even summary, and optional per-module detail.

### Task 2a: ComparisonTable + ComparisonChart Wiring
- **ComparisonTable**: Dynamic column visibility (JIJ only when used), "Na overstap" column from hybrid results, SalesSignalBadge per module in internal mode, DIA "Pakketprijs" badge, Besparingsrij with euros and percentages.
- **ComparisonChart**: Conditional JIJ bar, optional "Na overstap" bar with 50% opacity Cito primary color.

### Task 2b: ModuleDetailPanel + PriceComparisonPage Wiring
- **ModuleDetailPanel**: DIA package formula with package name, covered modules, and savings detail. Per-module break-even analysis section (internal mode only).
- **PriceComparisonPage**: ModeToggle and PeriodToggle in header. SensitivitySection after comparison table, conditionally rendered in internal mode.

### Task 3: Mode Toggle Test (MODE-02)
- 5 store-level tests: default true, toggle false, toggle back, sensitivity computed in external mode, mode survives recalculate.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 600bd83 | feat(10-02): extend store with mode/period/sensitivity state and add toggle components |
| 2 | 9d8ece1 | feat(10-02): wire ComparisonTable and ComparisonChart with dynamic columns and sales signals |
| 3 | 554eff0 | feat(10-02): wire ModuleDetailPanel and PriceComparisonPage with toggles and sensitivity |
| 4 | 0a00092 | test(10-02): add mode toggle automated test for MODE-02 compliance |
| 5 | 9e96b4f | fix(10-02): update existing tests for extended store and dynamic ComparisonTable |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate CurrentProvider/ModuleCurrentSetup in src/models/school.ts**
- **Found during:** Task 1
- **Issue:** Plan 10-01 added `CurrentProvider` and `ModuleCurrentSetup` types but they were duplicated (lines 21 and 32)
- **Fix:** Removed the first (shorter) duplicate, kept the documented version with comments
- **Files modified:** src/models/school.ts

**2. [Rule 3 - Blocking] Copied missing files from main working directory to worktree**
- **Found during:** Task 1 build verification
- **Issue:** The worktree was missing files from parallel worktree branches (CurrentVsProposedPage, MigrationPage, WizardStep5, etc.) causing TypeScript compilation errors
- **Fix:** Copied uncommitted files from main project working directory to worktree
- **Files affected:** Multiple pre-existing files (not committed as part of this plan)

**3. [Rule 3 - Blocking] Updated store.test.ts mock to include moduleSetups**
- **Found during:** Task 3 full test run
- **Issue:** Existing store test mock did not include `moduleSetups`, causing `determineActiveCompetitor` to crash on spread of undefined
- **Fix:** Added `moduleSetups` array to mock school profile state
- **Files modified:** src/features/price-comparison/__tests__/store.test.ts

**4. [Rule 3 - Blocking] Updated ComparisonTable.test.tsx mocks for dynamic columns**
- **Found during:** Task 3 full test run
- **Issue:** ComparisonTable now reads store state (isInternalMode, hybridResult, etc.) and school profile store (moduleSetups) but existing tests only mocked result
- **Fix:** Added full store mock with new state fields and school-profile store mock with JIJ moduleSetup
- **Files modified:** src/features/price-comparison/__tests__/ComparisonTable.test.tsx

## Verification

- `npm run build` succeeds without TypeScript errors
- `npx vitest run` -- all 261 tests pass (41 files, 9 skipped pre-existing)
- 5 new mode-toggle tests pass
- All 53 engine tests continue to pass

## Known Stubs

None -- all components are fully functional with real store data and engine outputs.

## Self-Check: PASSED
