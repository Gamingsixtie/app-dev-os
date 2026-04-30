---
phase: 10-prijsvergelijking-gevoeligheid
plan: 01
subsystem: engine
tags: [dia-packages, hybrid-scenario, sensitivity, break-even, sales-signals, tdd]
dependency_graph:
  requires: [price-comparison-engine, differentiators-data, default-prices]
  provides: [dia-package-engine, hybrid-scenario-engine, sensitivity-engine, sales-signals-engine]
  affects: [comparison-ui, internal-mode-ui]
tech_stack:
  added: []
  patterns: [pure-engine-functions, tdd-red-green, per-student-pricing, package-optimization]
key_files:
  created:
    - src/models/dia-packages.ts
    - src/data/dia-packages.ts
    - src/engine/dia-packages.ts
    - src/engine/hybrid-scenario.ts
    - src/engine/sensitivity.ts
    - src/engine/sales-signals.ts
    - src/engine/__tests__/dia-packages.test.ts
    - src/engine/__tests__/hybrid-scenario.test.ts
    - src/engine/__tests__/sensitivity.test.ts
    - src/engine/__tests__/sales-signals.test.ts
  modified:
    - src/models/school.ts
decisions:
  - "DIA package selection compares all qualifying packages by total cost (package + uncovered individual) and picks cheapest"
  - "Break-even returns null when Cito is already more expensive (no discount needed for competitor to win)"
  - "Sales signals use only Cito differentiators count to determine yellow vs red (competitor differentiators reserved for future use)"
  - "Added CurrentProvider and ModuleCurrentSetup types to src/models/school.ts as prerequisite for hybrid scenario engine"
metrics:
  duration: 5min
  completed: 2026-03-22T22:23:31Z
  tasks_completed: 2
  tasks_total: 2
  test_count: 25
  files_created: 10
  files_modified: 1
---

# Phase 10 Plan 01: Engine Functions for Sensitivity and Package Pricing Summary

Pure engine functions for DIA package pricing, hybrid scenario comparison, sensitivity/break-even analysis, and sales signal classification -- all TDD with 25 tests passing.

## What Was Built

### Task 1: DIA Package Types, Data, and Engine
- **Types** (`src/models/dia-packages.ts`): `DiaPackage` and `DiaPackageResult` interfaces
- **Data** (`src/data/dia-packages.ts`): Two configurable packages -- `lvs-basis` (13.00/student for 3 LVS modules) and `lvs-compleet` (15.50/student for 3 LVS + sociaal-emotioneel)
- **Engine** (`src/engine/dia-packages.ts`): `selectOptimalDiaPackage` finds cheapest package at 3+ modules; `calculateDiaModuleCosts` provides per-module cost breakdown with package allocation
- **Tests**: 7 tests covering package selection, savings calculation, overrides, empty input, uncovered modules

### Task 2: Hybrid Scenario, Sensitivity, Break-even, and Sales Signals
- **Hybrid** (`src/engine/hybrid-scenario.ts`): `calculateHybridScenario` calculates per-module savings when switching from DIA/JIJ to Cito, excludes already-Cito and inactive modules
- **Sensitivity** (`src/engine/sensitivity.ts`): `calculateSensitivity` runs discount scenarios (0/10/20%) with Dutch labels; `calculateBreakEven` computes exact discount percentage where competitor becomes cheaper
- **Sales Signals** (`src/engine/sales-signals.ts`): `determineSalesSignal` classifies each module as "Benadruk prijs" (green), "Focus op meerwaarde" (yellow), or "Kwetsbaar punt" (red)
- **Tests**: 18 tests across 3 files (6 hybrid + 6 sensitivity + 6 sales signals)

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | c4a2227 | feat(10-01): add DIA package types, data, and engine with TDD tests |
| 2 | 026c8fa | feat(10-01): add hybrid scenario, sensitivity, break-even, and sales signals engines |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added CurrentProvider and ModuleCurrentSetup types to src/models/school.ts**
- **Found during:** Task 2
- **Issue:** The plan references `CurrentProvider` and `ModuleCurrentSetup` types from `src/models/school.ts`, but these types did not exist in the codebase yet
- **Fix:** Added the types directly to `src/models/school.ts` as specified in the plan's interface section
- **Files modified:** src/models/school.ts

**2. [Rule 1 - Bug] Fixed floating-point comparison in DIA package tests**
- **Found during:** Task 1
- **Issue:** `3 x 5.20` produces `15.600000000000001` in JavaScript due to IEEE 754 floating-point representation
- **Fix:** Changed `.toBe(15.60)` to `.toBeCloseTo(15.60)` in affected test assertions
- **Files modified:** src/engine/__tests__/dia-packages.test.ts

## Verification

- All 38 engine tests pass (`npx vitest run src/engine/__tests__/`)
- `npm run build` succeeds without TypeScript errors
- All new engine functions are pure: no store imports, no side effects, no DOM access
- `src/data/default-prices.ts` is NOT modified (verified via git diff)

## Known Stubs

None -- all engines are fully functional with real logic and tested behavior.

## Self-Check: PASSED

- All 10 created files exist on disk
- Both commits (c4a2227, 026c8fa) found in git log
- 38 engine tests pass
- Build succeeds
