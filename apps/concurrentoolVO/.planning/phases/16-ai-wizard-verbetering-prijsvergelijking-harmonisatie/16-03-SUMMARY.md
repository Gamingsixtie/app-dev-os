---
phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
plan: 03
subsystem: wizard-ui, react-components, page-integration
tags: [react, tailwind, zustand, wizard, ai-streaming, advice-cards, price-comparison]

# Dependency graph
requires:
  - phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
    plan: 01
    provides: "wizard-store, types, ai-wizard streaming helpers, parseAdviceFromText"
  - phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
    plan: 02
    provides: "ComparisonWizard shell, WizardStep1Notes, WizardStep2Variants, VariantCard"
provides:
  - "WizardStep3Advice with AI streaming, typed advice cards, editable matching, and Pas tabel aan CTA"
  - "ExtraContextField with 3 labeled inputs for optional context"
  - "PriceComparisonPage with ComparisonWizard replacing AdvicePanel"
affects:
  - "src/features/price-comparison/ — wizard is now primary AI interface"

# Tech stack
added: []
patterns:
  - "TYPE_CONFIG extended with strategie type for advice card rendering"
  - "DMU strategy collapsible section with expand/collapse state"
  - "Editable matching section with dropdown provider selection per module"

key-files:
  created:
    - src/features/price-comparison/wizard/WizardStep3Advice.tsx
    - src/features/price-comparison/wizard/ExtraContextField.tsx
  modified:
    - src/features/price-comparison/wizard/ComparisonWizard.tsx
    - src/features/price-comparison/PriceComparisonPage.tsx

key-decisions:
  - "Editable matching uses simple dropdown selects per module (not full card grid from step 2)"
  - "adjustedSelections initialized from variantSelections when advice first generated"

patterns-established:
  - "Streaming display with animate-pulse blinking cursor during AI generation"

requirements-completed: [PRIJS-01, PRIJS-03, PRIJS-05, PRIJS-06]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 16 Plan 03: AI Advice Step 3 & Page Integration Summary

**WizardStep3Advice with AI streaming, typed advice cards (prijs/meerwaarde/bezwaar/kans/strategie), editable matching, ExtraContextField, and ComparisonWizard replacing AdvicePanel in PriceComparisonPage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T09:42:20Z
- **Completed:** 2026-03-25T09:47:00Z
- **Tasks:** 2 of 2 auto tasks complete (Task 3 is human-verify checkpoint)
- **Files created:** 2
- **Files modified:** 2

## Accomplishments
- WizardStep3Advice component with full AI advice generation flow: extra context input, streaming display with blinking cursor, parsed advice result with typed cards and DMU strategy section, editable matching per module, and "Pas tabel aan" confirmation button
- ExtraContextField component with 3 labeled inputs (korting, DMU-focus, bijzonderheden) per D-21
- ComparisonWizard updated to render WizardStep3Advice on step 2 (index-based), replacing placeholder
- PriceComparisonPage updated to render ComparisonWizard instead of AdvicePanel

## Task Commits

Each task was committed atomically:

1. **Task 1: Step 3 advice component with streaming, result display, and extra context field** - `771bac5` (feat)
2. **Task 2: Replace AdvicePanel with ComparisonWizard in PriceComparisonPage** - `71252c4` (feat)

## Files Created/Modified
- `src/features/price-comparison/wizard/WizardStep3Advice.tsx` - AI advice streaming, result display, editable matching, apply-to-table confirmation
- `src/features/price-comparison/wizard/ExtraContextField.tsx` - 3 labeled input fields for extra context (D-21)
- `src/features/price-comparison/wizard/ComparisonWizard.tsx` - Added WizardStep3Advice import and rendering
- `src/features/price-comparison/PriceComparisonPage.tsx` - Replaced AdvicePanel with ComparisonWizard

## Decisions Made
- Editable matching uses simple dropdown selects per module (not the full card grid from step 2) -- simpler UX for quick adjustments
- adjustedSelections initialized from variantSelections when advice first generated -- ensures user starts from AI suggestions

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all components are fully implemented.

## Issues Encountered

Minor: 3 unused variable warnings fixed (abortRef, providerLabel, ModuleVariantSelection type import) during build verification. All resolved before commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 wizard steps complete and wired into PriceComparisonPage
- Task 3 (human-verify checkpoint) pending: visual verification of complete wizard flow
- After verification approval, Phase 16 is complete

---
*Phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie*
*Completed: 2026-03-25*
