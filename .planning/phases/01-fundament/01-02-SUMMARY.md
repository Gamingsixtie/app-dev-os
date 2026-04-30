---
phase: 01-fundament
plan: 02
subsystem: ui
tags: [react, wizard, react-hook-form, zod, zustand, tailwind, dutch-i18n]

# Dependency graph
requires:
  - phase: 01-fundament-01
    provides: "Zod schemas, zustand store, school/module models, school-profiles data, Tailwind theme"
provides:
  - "4-step wizard UI (WizardShell, ProgressBar, NavigationButtons, StepContainer)"
  - "WizardStep1: school level selection with checkbox validation"
  - "WizardStep2: student count matrix with Klein/Middelgroot/Groot VO presets"
  - "WizardStep3: module toggle cards grouped by category"
  - "WizardStep4: scenario radio cards with visual selection"
  - "Full Dutch-language interface with formal u-form"
  - "31 component tests covering all steps and navigation"
affects: [01-fundament-03, 02-rekenmotor, results-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [forwardRef-with-useImperativeHandle-for-form-submit, zustand-driven-wizard-navigation]

key-files:
  created:
    - src/components/wizard/WizardShell.tsx
    - src/components/wizard/ProgressBar.tsx
    - src/components/wizard/StepContainer.tsx
    - src/components/wizard/NavigationButtons.tsx
    - src/features/school-profile/components/WizardStep1.tsx
    - src/features/school-profile/components/WizardStep2.tsx
    - src/features/school-profile/components/WizardStep3.tsx
    - src/features/school-profile/components/WizardStep4.tsx
    - src/features/school-profile/__tests__/step1.test.tsx
    - src/features/school-profile/__tests__/step2.test.tsx
    - src/features/school-profile/__tests__/step3.test.tsx
    - src/features/school-profile/__tests__/step4.test.tsx
    - src/features/school-profile/__tests__/wizard-navigation.test.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "forwardRef + useImperativeHandle pattern for step form submission from parent WizardShell"
  - "Optional chaining on scrollIntoView for jsdom test compatibility"

patterns-established:
  - "WizardStepRef interface: each step exposes submit() returning Promise<boolean> via forwardRef"
  - "Store-driven navigation: currentStep in zustand, completedSteps tracked in WizardShell local state"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04, UX-03, UX-04]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 01 Plan 02: Wizard UI Summary

**4-step wizard with Dutch UI: school level checkboxes, student count matrix with 3 presets, module toggle cards with categories, scenario radio cards, clickable progress bar, and 31 component tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T13:55:44Z
- **Completed:** 2026-03-20T14:00:31Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Complete 4-step wizard UI with Cito brand colors and Dutch formal u-form copy
- ProgressBar with clickable completed steps (checkmark icon), current step highlight (accent orange), disabled future steps
- Student count matrix dynamically renders rows for selected levels with correct leerjaar columns, preset buttons fill data from SCHOOL_SIZE_PRESETS
- Module toggle cards grouped by Leerlingvolgsysteem and Overige instrumenten categories, with differentiators and "Losse licentie" annotation
- Scenario radio cards with visual selection state (blue border, accent left edge, light blue background)
- 31 new component tests covering form validation, store persistence, navigation flow, and visual state changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Build wizard shell, progress bar, navigation buttons, and all 4 step components** - `bc55c86` (feat)
2. **Task 2: Write component tests for all 4 wizard steps and navigation** - `777a288` (test)

## Files Created/Modified
- `src/components/wizard/WizardShell.tsx` - Wizard container orchestrating step routing, validation, navigation, and scroll-to-top
- `src/components/wizard/ProgressBar.tsx` - 4-step progress bar with clickable completed steps and Cito brand colors
- `src/components/wizard/StepContainer.tsx` - Simple step wrapper with Dutch heading
- `src/components/wizard/NavigationButtons.tsx` - Vorige/Volgende stap buttons with disabled and last-step states
- `src/features/school-profile/components/WizardStep1.tsx` - School level checkbox selection with zod validation
- `src/features/school-profile/components/WizardStep2.tsx` - Student count matrix with Klein/Middelgroot/Groot VO preset buttons
- `src/features/school-profile/components/WizardStep3.tsx` - Module toggle cards in 2 categories with differentiators
- `src/features/school-profile/components/WizardStep4.tsx` - Scenario A/B radio cards with visual selection
- `src/App.tsx` - Updated to render WizardShell with page title and subtitle
- `src/features/school-profile/__tests__/step1.test.tsx` - 5 tests: checkbox rendering, validation, store persistence
- `src/features/school-profile/__tests__/step2.test.tsx` - 6 tests: matrix rows, columns, presets, store persistence
- `src/features/school-profile/__tests__/step3.test.tsx` - 8 tests: module cards, categories, toggles, Losse licentie, store
- `src/features/school-profile/__tests__/step4.test.tsx` - 5 tests: scenario cards, selection, validation, store persistence
- `src/features/school-profile/__tests__/wizard-navigation.test.tsx` - 7 tests: progress bar, back/forward, data preservation

## Decisions Made
- Used forwardRef + useImperativeHandle pattern so WizardShell can trigger form submission on each step component without prop drilling onSubmit callbacks
- Added optional chaining on scrollIntoView call (`scrollIntoView?.()`) since jsdom does not implement this method, preventing test failures without impacting browser behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scrollIntoView crash in jsdom test environment**
- **Found during:** Task 2 (wizard-navigation tests)
- **Issue:** `scrollIntoView` is not implemented in jsdom, causing all WizardShell tests to fail with TypeError
- **Fix:** Changed `scrollIntoView({...})` to `scrollIntoView?.({...})` using optional chaining
- **Files modified:** src/components/wizard/WizardShell.tsx
- **Verification:** All 60 tests pass, build succeeds
- **Committed in:** 777a288 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for test compatibility. No scope creep.

## Issues Encountered
None beyond the scrollIntoView fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All wizard UI components in place, ready for Plan 03 (integration/results)
- Zustand store fully populated through wizard flow
- 60 total tests passing, build clean

## Self-Check: PASSED

All 13 created files verified. Both task commits (bc55c86, 777a288) verified in git log.

---
*Phase: 01-fundament*
*Completed: 2026-03-20*
