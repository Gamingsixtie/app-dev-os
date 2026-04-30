---
phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
plan: 02
subsystem: wizard-ui, react-components
tags: [react, tailwind, zustand, wizard, variant-selection, ai-extraction]

# Dependency graph
requires:
  - phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
    plan: 01
    provides: "wizard-store, types, scenario-detection, variant-suggestions, ai-wizard helpers"
provides:
  - "ComparisonWizard shell with 3-step navigation and collapsed state"
  - "ComparisonWizardProgress 3-step progress bar"
  - "WizardStep1Notes conversation notes with AI extraction trigger"
  - "WizardStep2Variants per-module variant selection with DIA/JIJ cards"
  - "VariantCard selectable card with Aanbevolen badge"
  - "ScenarioDetector banner for old-Cito/new-Cito edge cases"
affects:
  - "src/features/price-comparison/ — new wizard UI components"

# Tech stack
added: []
patterns:
  - "Zustand selectors for wizard state (useWizardStore)"
  - "moduleSetups-first pre-fill with AI extraction overlay (D-07)"
  - "Confidence badges (high/low/unknown) from AI extraction"
  - "Smart suggestions via suggestDiaPackage/suggestJijTier"

# Key files
created:
  - src/features/price-comparison/wizard/ComparisonWizard.tsx
  - src/features/price-comparison/wizard/ComparisonWizardProgress.tsx
  - src/features/price-comparison/wizard/WizardStep1Notes.tsx
  - src/features/price-comparison/wizard/WizardStep2Variants.tsx
  - src/features/price-comparison/wizard/VariantCard.tsx
  - src/features/price-comparison/wizard/ScenarioDetector.tsx
modified: []

# Decisions
decisions:
  - "Step 1 navigation handled internally (not via parent) -- WizardStep1Notes calls setStep(1) directly after extraction"
  - "Pre-fill uses useEffect with dependency on selectedModules/moduleSetups/extractionResult -- only initializes when modules don't match"
  - "Provider radio buttons use min-h-[44px] for tablet touch targets"

# Metrics
duration: "4m 52s"
completed: "2026-03-25"
---

# Phase 16 Plan 02: Wizard UI Shell and Steps 1-2 Summary

6 React components forming the wizard shell, progress bar, conversation notes input, variant selection grid, variant cards, and scenario detection banner for the AI comparison wizard.

## What Was Built

### Task 1: Wizard shell, progress bar, step 1 notes, scenario detector (357a6a5)

- **ComparisonWizardProgress.tsx** (80 lines): 3-step horizontal progress bar with labels "Gespreksnotities", "Variant-selectie", "Advies & Resultaat". Active step in cito-accent, completed steps in cito-primary with checkmark SVG and clickable navigation. Labels hidden on small screens, only step numbers shown.

- **ScenarioDetector.tsx** (60 lines): Banner component per D-26. Returns null for deels-concurrent. Blue info banner for alles-oud-cito with migration redirect. Green info banner for alles-nieuw-cito with "Doorgaan" button.

- **WizardStep1Notes.tsx** (105 lines): Conversation notes textarea with "Niet bekend -- handmatig selecteren" skip button and "Volgende stap" primary CTA. AI extraction via extractVariantsFromNotes on submit. Loading state with spinner + "Analyseren..." text and pulse animation. Error handling with inline message and "Doorgaan zonder analyse" fallback.

- **ComparisonWizard.tsx** (135 lines): Main wizard container with title "AI Vergelijkingsadvies", subtitle, 3-step navigation, collapsed/expanded states, scenario detection, and empty state guard. Collapsed state shows "AI vergelijkingsadvies actief" + "Opnieuw doorlopen" button.

### Task 2: Step 2 variant selection with DIA/JIJ cards (b39441c)

- **VariantCard.tsx** (80 lines): Selectable card for DIA package or JIJ tier. Shows name, price label, description, optional module tags. Selected state with ring-2 ring-cito-accent/20. "Aanbevolen" pill badge for engine-suggested variants.

- **WizardStep2Variants.tsx** (195 lines): Per-module variant selection grid. Pre-fill logic: moduleSetups as base layer (D-07), AI extraction overlay for specific variant details. Provider radio group (DIA/JIJ/Geen) per module. Confidence indicators (green/orange/gray dots with labels). DIA packages filtered to applicable ones per module. JIJ tiers shown with annual fee + per-test pricing. Smart suggestions via suggestDiaPackage and suggestJijTier with "Aanbevolen" badge.

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Step 1 internal navigation**: WizardStep1Notes calls setStep(1) directly after successful extraction or skip, rather than delegating to parent ComparisonWizard. This simplifies the flow since step 1 has multiple exit paths (skip, extract success, extract error + continue).

2. **Pre-fill guard**: The useEffect in WizardStep2Variants only re-initializes when modules don't match existing selections, preventing loss of user edits when the component re-renders.

3. **Tablet touch targets**: All interactive elements (radio buttons, variant cards, navigation buttons) use min-h-[44px] or min-h-[48px] per UI-SPEC touch target requirements.

## Known Stubs

- **ComparisonWizard.tsx line 83**: Step 3 (Advies & Resultaat) renders a placeholder div. This is intentional -- WizardStep3Advice will be built in Plan 16-03.

## Verification

- All 26 existing tests pass (variant-suggestions + dia-packages)
- `npm run build` succeeds with no TypeScript errors
- All UI text in Dutch per CLAUDE.md
- All components follow Tailwind CSS 4 + Cito theme tokens

## Self-Check: PASSED

- All 6 created files exist on disk
- Both commit hashes (357a6a5, b39441c) found in git log
