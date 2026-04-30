---
phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
plan: 01
subsystem: api, state-management, logic
tags: [zustand, anthropic-sdk, sse-streaming, typescript, vitest, wizard]

# Dependency graph
requires:
  - phase: 10-prijsvergelijking-v2
    provides: "usePriceComparisonStore with setVisibleProviders, setCitoBundleType, initialize"
  - phase: 10.1-data-consolidation
    provides: "Provider configs (DIA_PACKAGES, JIJ_LICENSE_TIERS, CITO_BUNDLES)"
provides:
  - "WizardScenario, ModuleVariantSelection, WizardAdviceResult, ExtraContextInput, ExtractedVariantResult types"
  - "useWizardStore Zustand store with applyToTable harmonization"
  - "detectScenario pure function for 3 scenario types"
  - "suggestDiaPackage and suggestJijTier recommendation functions"
  - "/api/ai-wizard-extract serverless endpoint for variant extraction"
  - "/api/ai-wizard-advice serverless endpoint for comparison advice"
  - "extractVariantsFromNotes, streamWizardAdvice, parseAdviceFromText client functions"
affects: [16-02-PLAN, 16-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wizard Zustand store with persist partialize for selective persistence"
    - "Inline getAuthHeaders in ai-wizard.ts to avoid circular imports"
    - "Lazy-init Anthropic/Supabase pattern in serverless endpoints"

key-files:
  created:
    - src/features/price-comparison/wizard/types.ts
    - src/features/price-comparison/wizard/wizard-store.ts
    - src/features/price-comparison/wizard/scenario-detection.ts
    - src/features/price-comparison/wizard/variant-suggestions.ts
    - api/ai-wizard-extract.ts
    - api/ai-wizard-advice.ts
    - src/lib/ai-wizard.ts
    - src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts
    - src/features/price-comparison/wizard/__tests__/variant-suggestions.test.ts
    - src/features/price-comparison/wizard/__tests__/wizard-store.test.ts
    - src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts
  modified: []

key-decisions:
  - "Persist only essential wizard state (notes, selections, extraContext, scenario) via partialize -- streaming/advice state regenerated each time"
  - "applyToTable uses adjustedSelections when available, falls back to variantSelections"
  - "parseAdviceFromText returns fallback instead of throwing on invalid JSON -- graceful degradation"

patterns-established:
  - "Wizard store pattern: persist middleware with partialize for selective persistence of user input vs. transient AI state"
  - "Three-strategy JSON parsing: direct parse, strip markdown fences, extract first {...} block"

requirements-completed: [PRIJS-01, PRIJS-05, PRIJS-06]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 16 Plan 01: Data Foundation Summary

**Wizard types, Zustand store with applyToTable harmonization, scenario detection, variant suggestions, two AI serverless endpoints, and client-side streaming library with 28 passing tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-25T09:23:46Z
- **Completed:** 2026-03-25T09:31:04Z
- **Tasks:** 3
- **Files created:** 11

## Accomplishments
- Complete type system for 3-step wizard (ModuleVariantSelection, WizardAdviceResult, ExtraContextInput, ExtractedVariantResult, WizardScenario)
- Zustand wizard store with persist middleware and applyToTable() that writes variant selections and Cito bundle type to usePriceComparisonStore
- Scenario detection for 3 cases: deels-concurrent, alles-oud-cito, alles-nieuw-cito
- suggestDiaPackage (cheapest qualifying package) and suggestJijTier (tier by administration volume)
- Two serverless AI endpoints with lazy-init Anthropic/Supabase, JWT auth, SSE streaming
- Client-side streaming library with parseAdviceFromText (tested for PRIJS-05 coverage)
- 28 passing tests across 4 test files, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Wizard types, scenario detection, variant suggestions, and advice stub test** - `d0fe2d1` (feat)
2. **Task 2: Wizard Zustand store with applyToTable harmonization** - `de10cea` (feat)
3. **Task 3: Serverless AI endpoints and client streaming library** - `249381e` (feat)

## Files Created/Modified
- `src/features/price-comparison/wizard/types.ts` - All wizard-specific TypeScript types
- `src/features/price-comparison/wizard/scenario-detection.ts` - detectScenario pure function
- `src/features/price-comparison/wizard/variant-suggestions.ts` - suggestDiaPackage and suggestJijTier
- `src/features/price-comparison/wizard/wizard-store.ts` - Zustand store with persist and applyToTable
- `api/ai-wizard-extract.ts` - Serverless endpoint for step 1 AI extraction
- `api/ai-wizard-advice.ts` - Serverless endpoint for step 3 AI advice with differentiators
- `src/lib/ai-wizard.ts` - Client-side extractVariantsFromNotes, streamWizardAdvice, parseAdviceFromText
- `src/features/price-comparison/wizard/__tests__/scenario-detection.test.ts` - 6 test cases
- `src/features/price-comparison/wizard/__tests__/variant-suggestions.test.ts` - 10 test cases
- `src/features/price-comparison/wizard/__tests__/wizard-store.test.ts` - 9 test cases
- `src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts` - 3 test cases

## Decisions Made
- Persist only essential wizard state (notes, selections, extraContext, scenario) via partialize -- streaming/advice state regenerated each time
- applyToTable uses adjustedSelections when available, falls back to variantSelections
- parseAdviceFromText returns fallback instead of throwing on invalid JSON -- graceful degradation for streaming

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functions are fully implemented and tested.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Endpoints use existing ANTHROPIC_API_KEY and SUPABASE env vars.

## Next Phase Readiness
- All types, store, logic, endpoints and client library ready for UI plans (16-02, 16-03)
- useWizardStore can be consumed by wizard step components
- extractVariantsFromNotes and streamWizardAdvice ready for UI integration
- applyToTable harmonization tested and ready to connect wizard output to comparison table

---
*Phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie*
*Completed: 2026-03-25*
