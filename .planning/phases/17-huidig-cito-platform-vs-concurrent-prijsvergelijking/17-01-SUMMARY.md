---
phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking
plan: 01
subsystem: engine
tags: [scenario-detection, price-comparison, types, tdd]

# Dependency graph
requires:
  - phase: 10-scenario-aware-prijsvergelijking
    provides: "Engine detectScenario, calculateComparison, ModuleCurrentSetup types"
provides:
  - "Scenario 'C' type in engine and wizard layers"
  - "WizardScenario 'alles-oud-cito-concurrent' value"
  - "getOldPlatformPrice helper for old-platform price lookup"
  - "Engine detectScenario forRetentionComparison option"
  - "calculateComparison scenarioType 'C' old-platform price branching"
  - "Wave 0 test scaffold for buildRetentionAdvicePayload"
affects: [17-02, 17-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Options parameter pattern for extending pure functions without breaking backward compat"
    - "Post-processing pattern for provider-specific price overrides in calculateComparison"

key-files:
  created:
    - src/lib/__tests__/ai-advice.test.ts
  modified:
    - src/features/price-comparison/wizard/types.ts
    - src/models/school.ts
    - src/data/cito-migration-prices.ts
    - src/engine/scenario-detection.ts
    - src/engine/price-comparison.ts
    - src/engine/__tests__/scenario-detection.test.ts
    - src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts
    - src/components/wizard/DMUContextPanel.tsx
    - src/features/school-profile/schemas/step5-schema.ts

key-decisions:
  - "forRetentionComparison as optional options param keeps backward compat while enabling Scenario C"
  - "Post-process cito providerResults for Scenario C instead of modifying calculator internals"
  - "Wave 0 tests use it.skip to document contract without blocking CI"

patterns-established:
  - "Options parameter extension: detectScenario(setups, options?) for new capabilities"
  - "Post-processing price override: modify providerResults after calculation for scenario-specific pricing"

requirements-completed: [SC17-01, SC17-02, SC17-05]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 17 Plan 01: Scenario C Type Foundation Summary

**Scenario C ('Huidig Cito vs. concurrent') type system, engine detection via forRetentionComparison option, and calculateComparison old-platform price branching with getOldPlatformPrice helper**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T15:59:56Z
- **Completed:** 2026-03-25T16:04:34Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Scenario 'C' is a first-class type in both engine (Scenario) and wizard (WizardScenario) layers
- Engine detectScenario supports Scenario C via forRetentionComparison option with full backward compat
- calculateComparison uses old-platform prices for Cito when scenarioType is 'C' via post-processing
- getOldPlatformPrice helper exported for reuse across engine and UI
- Wave 0 test scaffold for buildRetentionAdvicePayload ready for Plan 17-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types, add old-platform price helper, create Wave 0 AI advice test scaffold** - `d70e4a9` (feat)
2. **Task 2: Extend engine-level scenario detection and price-comparison for Scenario C** - `8e019dd` (feat)

## Files Created/Modified
- `src/features/price-comparison/wizard/types.ts` - Added 'alles-oud-cito-concurrent' to WizardScenario
- `src/models/school.ts` - Extended Scenario to 'A' | 'B' | 'C', added SCENARIO_LABELS['C']
- `src/data/cito-migration-prices.ts` - Added getOldPlatformPrice helper
- `src/engine/scenario-detection.ts` - DetectScenarioOptions with forRetentionComparison, returns 'C'
- `src/engine/price-comparison.ts` - scenarioType in ComparisonOptions, Scenario C old-platform price post-processing
- `src/engine/__tests__/scenario-detection.test.ts` - Tests for Scenario C detection, getOldPlatformPrice, calculateComparison Scenario C
- `src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` - Type assertion test for WizardScenario
- `src/lib/__tests__/ai-advice.test.ts` - Wave 0 scaffold with skipped buildRetentionAdvicePayload tests
- `src/components/wizard/DMUContextPanel.tsx` - Added Scenario C DMU mapping
- `src/features/school-profile/schemas/step5-schema.ts` - Extended scenario enum to include 'C'

## Decisions Made
- forRetentionComparison as optional options parameter on detectScenario keeps all existing call sites working unchanged
- Post-process cito providerResults for Scenario C instead of modifying calculator internals -- cleaner separation, calculator remains unaware of scenarios
- Wave 0 tests use it.skip to document the expected contract without blocking CI -- Plan 17-03 will unskip and implement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed build errors from Scenario type extension**
- **Found during:** Task 2 (after extending Scenario type to include 'C')
- **Issue:** DMUContextPanel.tsx Record<Scenario,...> missing 'C' entry; step5-schema.ts Zod enum restricted to ['A','B']; ai-advice.test.ts unused import
- **Fix:** Added Scenario C DMU mapping, extended step5-schema enum, removed unused expect import
- **Files modified:** src/components/wizard/DMUContextPanel.tsx, src/features/school-profile/schemas/step5-schema.ts, src/lib/__tests__/ai-advice.test.ts
- **Verification:** npm run build exits 0
- **Committed in:** 8e019dd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Downstream type consumers needed update after Scenario union extension. Expected consequence, no scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all implementations are complete and wired.

## Next Phase Readiness
- Scenario C type foundation complete, ready for Plan 17-02 (UI: ScenarioDetector flow)
- Engine detection and price comparison fully support Scenario C
- Wave 0 tests scaffolded for Plan 17-03 (AI advice)

---
*Phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking*
*Completed: 2026-03-25*
