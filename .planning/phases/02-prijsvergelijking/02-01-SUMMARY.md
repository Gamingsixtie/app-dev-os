---
phase: 02-prijsvergelijking
plan: 01
subsystem: engine
tags: [typescript, tdd, intl, pricing, calculation]

# Dependency graph
requires:
  - phase: 01-fundament
    provides: "PriceRecord, ModuleDefinition, MODULE_CATALOG, SchoolProfile types"
provides:
  - "calculateComparison pure function for price comparison across providers"
  - "getTotalStudents helper for aggregating nested student counts"
  - "Dutch locale formatting utilities (formatCurrency, formatCurrencyCompact, formatNumber)"
  - "Complete default price data for all 6 modules across Cito/DIA/JIJ"
  - "Module differentiator data per provider"
  - "ComparisonResult type (CalculationResult alias)"
affects: [02-prijsvergelijking, 03-tijdsbesparing]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-engine, intl-number-format-nl-NL]

key-files:
  created:
    - src/engine/price-comparison.ts
    - src/engine/__tests__/price-comparison.test.ts
    - src/lib/format.ts
    - src/data/differentiators.ts
  modified:
    - src/engine/types.ts
    - src/data/default-prices.ts

key-decisions:
  - "ProviderCost is null (not zero) when provider does not offer a module"
  - "Differences (citoVsDia/citoVsJij) are null when competitor has no modules at all"
  - "formatCurrency uses Intl.NumberFormat nl-NL locale for consistent Dutch formatting"

patterns-established:
  - "Pure engine functions: no React deps, accepts data in, returns structured result"
  - "Null-safety: missing provider data is null, not zero or NaN"

requirements-completed: [PRIJS-01, PRIJS-02, PRIJS-03]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 02 Plan 01: Price Comparison Engine Summary

**Pure calculateComparison engine with per-module per-provider costs, null-safe missing providers, Dutch locale formatting, and complete price/differentiator data for all 6 modules**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T15:30:13Z
- **Completed:** 2026-03-20T15:33:07Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 6

## Accomplishments
- Pure calculateComparison function computes per-module per-provider costs with null-safe handling
- getTotalStudents aggregates nested Record<SchoolLevel, Record<year, count>> correctly
- Dutch locale formatting utilities (formatCurrency, formatCurrencyCompact, formatNumber) using Intl.NumberFormat
- Default prices expanded from 3 records to 13 records covering all 6 modules across Cito/DIA/JIJ
- Differentiator data defined for all 6 modules per provider
- CalculationResult type updated from placeholder to ComparisonResult alias
- 13 passing test cases, 73 total tests passing, TypeScript build clean

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for price comparison engine** - `fdb0362` (test)
2. **Task 1 (GREEN): Implement price comparison engine** - `b780dd1` (feat)

_TDD task with RED and GREEN commits._

## Files Created/Modified
- `src/engine/price-comparison.ts` - Pure calculation engine: calculateComparison, getTotalStudents, types
- `src/engine/__tests__/price-comparison.test.ts` - 13 test cases covering all behaviors
- `src/lib/format.ts` - Dutch locale currency and number formatting utilities
- `src/data/default-prices.ts` - Expanded from 3 to 13 price records for all modules/providers
- `src/data/differentiators.ts` - Per-module per-provider differentiator strings
- `src/engine/types.ts` - CalculationResult updated to ComparisonResult alias

## Decisions Made
- ProviderCost is null (not zero) when provider does not offer a module -- prevents misleading zero costs
- Differences (citoVsDia/citoVsJij) are null when competitor has no modules at all -- distinguishes "no data" from "equal cost"
- formatCurrency uses Intl.NumberFormat with nl-NL locale for consistent Dutch formatting across the app

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused TypeScript imports in test file**
- **Found during:** Task 1 (GREEN phase build verification)
- **Issue:** Type-only imports (ProviderCost, ModuleComparison, ComparisonResult, ProviderKey) and unused value imports (PROVIDERS, PROVIDER_LABELS) caused TS6133 build errors
- **Fix:** Removed type-only imports, added assertion tests for PROVIDERS and PROVIDER_LABELS exports
- **Files modified:** src/engine/__tests__/price-comparison.test.ts
- **Verification:** npm run build passes cleanly
- **Committed in:** b780dd1 (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor -- TypeScript strictness required removing unused imports. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Calculation engine ready for consumption by UI components in Plans 02 and 03
- ComparisonResult type available for price comparison table and chart components
- Format utilities ready for all Dutch locale display needs

## Self-Check: PASSED

All 6 created/modified files verified on disk. Both commits (fdb0362, b780dd1) verified in git log.

---
*Phase: 02-prijsvergelijking*
*Completed: 2026-03-20*
