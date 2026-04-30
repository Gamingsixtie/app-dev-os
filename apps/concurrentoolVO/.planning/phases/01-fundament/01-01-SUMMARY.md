---
phase: 01-fundament
plan: 01
subsystem: ui, data-models
tags: [vite, react-19, tailwindcss-4, zustand, zod, react-hook-form, vitest, typescript]

requires:
  - phase: none
    provides: greenfield project
provides:
  - Vite 8 + React 19 + Tailwind CSS 4 scaffold with Cito brand theming
  - TypeScript types for SchoolLevel, ModuleDefinition, PriceRecord, Assumption
  - Zustand store for 4-step wizard state with preset support
  - Zod validation schemas for all 4 wizard steps
  - Static data (school size presets, default assumptions, placeholder prices)
  - Vitest + React Testing Library test infrastructure
  - Engine types placeholder (CalculationInput, CalculationResult)
affects: [01-02-PLAN (wizard UI), 01-03-PLAN (price/assumption components), phase-02]

tech-stack:
  added: [react@19, vite@8, tailwindcss@4, zustand@5, zod@4, react-hook-form@7, recharts@3, vitest@4, @testing-library/react@16]
  patterns: [CSS-first Tailwind @theme, pure-function domain models, Zustand store with selectors, TDD red-green]

key-files:
  created:
    - src/styles/index.css
    - src/models/school.ts
    - src/models/modules.ts
    - src/models/pricing.ts
    - src/models/assumptions.ts
    - src/lib/date-utils.ts
    - src/data/school-profiles.ts
    - src/data/default-assumptions.ts
    - src/data/default-prices.ts
    - src/engine/types.ts
    - src/features/school-profile/store.ts
    - src/features/school-profile/schemas/step1-schema.ts
    - src/features/school-profile/schemas/step2-schema.ts
    - src/features/school-profile/schemas/step3-schema.ts
    - src/features/school-profile/schemas/step4-schema.ts
  modified:
    - vite.config.ts
    - index.html
    - src/main.tsx
    - src/App.tsx

key-decisions:
  - "Zod v4 uses 'message' param instead of 'required_error' for z.enum error customization"
  - "getPriceStalenessLabel accepts optional now parameter for testability"

patterns-established:
  - "Domain models as pure TypeScript with no React dependency"
  - "Staleness computed from verifiedAt date, never stored"
  - "Zustand store with applyPreset for school size defaults"
  - "Per-step Zod schemas for wizard validation"
  - "TDD: write failing tests first, then implement"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-05, DATA-06, UX-03, UX-04]

duration: 6min
completed: 2026-03-20
---

# Phase 01 Plan 01: Fundament Summary

**Vite 8 + React 19 + Tailwind CSS 4 scaffold with Cito brand theming, complete TypeScript data models for pricing/assumptions/school/modules, Zustand wizard store, Zod schemas, and 11 passing unit tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-20T13:46:40Z
- **Completed:** 2026-03-20T13:52:32Z
- **Tasks:** 2
- **Files modified:** 35

## Accomplishments
- Working Vite 8 + React 19 project with Tailwind CSS 4 Cito brand theme (22 color tokens)
- Complete TypeScript type system: SchoolLevel, ModuleDefinition, PriceRecord, Assumption, Scenario
- Zustand store for 4-step wizard with applyPreset (klein/midden/groot) and full navigation
- Zod validation schemas for all wizard steps with Dutch error messages
- 11 unit tests passing for pricing logic, assumptions, and date utilities (TDD)
- Static data: 3 school size presets, 1 default assumption, 3 placeholder prices, 6 module definitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite project** - `5bf1147` (feat)
2. **Task 2 RED: Failing tests** - `cb405a1` (test)
3. **Task 2 GREEN: Implement models, store, schemas** - `73b88d3` (feat)

## Files Created/Modified
- `vite.config.ts` - Vite config with React + Tailwind CSS 4 plugins and @ alias
- `vitest.config.ts` - Vitest config with jsdom environment and globals
- `index.html` - Dutch lang attribute, "Rekentool VO" title
- `src/main.tsx` - Entry point importing Tailwind CSS
- `src/App.tsx` - Minimal Dutch-language shell with Cito theming
- `src/styles/index.css` - Tailwind CSS 4 @theme with all 22 Cito brand color tokens
- `src/test/setup.ts` - Test setup with jest-dom matchers and cleanup
- `src/models/school.ts` - SchoolLevel, SCHOOL_LEVELS, SCHOOL_LEVEL_LABELS, YEARS_PER_LEVEL, Scenario
- `src/models/modules.ts` - ModuleDefinition, MODULE_CATALOG (6 modules), MODULE_CATEGORIES
- `src/models/pricing.ts` - PriceRecord, getPriceStatus, getPriceStalenessLabel
- `src/models/assumptions.ts` - Assumption, isModified, resetToDefault, AssumptionPreset
- `src/lib/date-utils.ts` - isPriceStale utility
- `src/data/school-profiles.ts` - SCHOOL_SIZE_PRESETS (klein/midden/groot)
- `src/data/default-assumptions.ts` - DEFAULT_ASSUMPTIONS placeholder
- `src/data/default-prices.ts` - DEFAULT_PRICES placeholder records
- `src/engine/types.ts` - CalculationInput, CalculationResult placeholders
- `src/engine/index.ts` - Re-exports engine types
- `src/features/school-profile/types.ts` - SchoolProfile interface
- `src/features/school-profile/store.ts` - useSchoolProfileStore Zustand store
- `src/features/school-profile/schemas/step1-schema.ts` - School type validation
- `src/features/school-profile/schemas/step2-schema.ts` - Student counts validation
- `src/features/school-profile/schemas/step3-schema.ts` - Module selection validation
- `src/features/school-profile/schemas/step4-schema.ts` - Scenario selection validation

## Decisions Made
- Zod v4 API change: `z.enum()` uses `message` parameter instead of `required_error` for error customization
- `getPriceStalenessLabel` accepts optional `now` parameter for deterministic testing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 API: required_error -> message for z.enum**
- **Found during:** Task 2 (build verification)
- **Issue:** Zod v4 changed the error customization API for `z.enum()` - `required_error` is no longer a valid parameter
- **Fix:** Changed to `message` parameter in step4-schema.ts
- **Files modified:** src/features/school-profile/schemas/step4-schema.ts
- **Verification:** `npm run build` exits with code 0
- **Committed in:** 73b88d3 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API adaptation for Zod v4 compatibility. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All TypeScript types and data models are ready for Plan 02 (wizard UI components)
- Zustand store and Zod schemas are ready for form integration
- Test infrastructure is working for Plan 02 component tests
- Static data (presets, module catalog) ready for UI consumption

## Self-Check: PASSED

All 17 key files verified present. All 3 task commits verified in git log.

---
*Phase: 01-fundament*
*Completed: 2026-03-20*
