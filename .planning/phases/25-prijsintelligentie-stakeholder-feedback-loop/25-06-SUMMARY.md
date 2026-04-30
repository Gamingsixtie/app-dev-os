---
phase: 25-prijsintelligentie-stakeholder-feedback-loop
plan: 06
subsystem: admin-config
tags: [zod, react, admin, pricing-config, validation, tanstack-router]

requires:
  - phase: 25-prijsintelligentie-stakeholder-feedback-loop
    plan: 02
    provides: usePricingConfigs hook, usePricingDataStore, providerConfigs injection
  - phase: 10.1-data-model-refactor
    provides: Provider configs (PROVIDER_CONFIGS), PricingStrategy discriminated union types
provides:
  - AdminConfigEditor component with manager-only access and per-provider tabs
  - ProviderConfigForm with dynamic field rendering for all 4 PricingStrategy types
  - Zod validation schemas (pricingConfigSchema) matching real provider config structures
  - validatePricingConfig function combining schema + calculator runtime validation
  - /admin route registered in TanStack Router
affects: [25-07, 25-08]

tech-stack:
  added: []
  patterns: [Zod discriminated union for config validation, calculator-backed runtime validation, manager-only route guard pattern]

key-files:
  created:
    - src/features/admin/schemas/pricing-config.schema.ts
    - src/features/admin/AdminConfigEditor.tsx
    - src/features/admin/ProviderConfigForm.tsx
    - src/features/admin/__tests__/config-validation.test.ts
    - src/features/pricing/__tests__/config-editor.test.tsx
    - src/engine/__tests__/staleness.test.ts
  modified:
    - src/router/routes.ts

key-decisions:
  - "Zod schemas match actual provider-specific types (JijLicenseTier, DiaPackage, CitoBundle) rather than simplified plan interfaces"
  - "validatePricingConfig uses createCalculator factory from engine/calculators for runtime validation"
  - "AdminConfigEditor uses static PROVIDER_CONFIGS as data source; Supabase integration deferred to merge with Plan 25-01/02"

patterns-established:
  - "Manager-only access pattern: useAuth().userProfile.role check with Geen toegang fallback"
  - "Pricing config validation: Zod schema parse + engine calculator test calculation two-step validation"

requirements-completed: [PI-07]

duration: 8min
completed: 2026-03-30
---

# Phase 25 Plan 06: Admin Pricing Config Editor Summary

**Manager-only admin editor with per-provider tabs, Zod schema validation, and engine calculator runtime verification for all 4 pricing strategy types**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T21:07:52Z
- **Completed:** 2026-03-30T21:16:16Z
- **Tasks:** 2 (both TDD)
- **Files created:** 6
- **Files modified:** 1

## Accomplishments

- Zod validation schemas covering all 4 PricingStrategy discriminated union variants (flat, tiered-license, package-bundle, platform+module) with Dutch error messages
- validatePricingConfig combines schema validation + engine calculator runtime test to catch structurally valid but functionally broken configs
- AdminConfigEditor with manager-only access (role check), per-provider tabs (Cito, DIA, JIJ!, SAQI)
- ProviderConfigForm renders dynamic form fields per strategy type: tier management for JIJ!, package list for DIA, bundle/contract/individual prices for Cito, simple price for SAQI
- /admin route registered in TanStack Router routeTree
- Staleness detection tests for getPriceStatus function
- 20 tests passing, production build succeeds

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1: Zod schemas and validation for pricing configs**
   - RED: `cd41449` (test) - 9 config validation + 5 staleness tests
   - GREEN: `c4ed5c7` (feat) - Schema file with all 4 variants + validatePricingConfig

2. **Task 2: AdminConfigEditor with per-provider tabs**
   - RED: `ce6a10b` (test) - 5 component + route tests
   - GREEN: `fda8550` (feat) - AdminConfigEditor, ProviderConfigForm, /admin route

## Files Created/Modified

- `src/features/admin/schemas/pricing-config.schema.ts` - Zod schemas for all PricingStrategy variants + validatePricingConfig
- `src/features/admin/AdminConfigEditor.tsx` - Manager-only config editor with provider tabs
- `src/features/admin/ProviderConfigForm.tsx` - Dynamic per-strategy form with validation and save
- `src/features/admin/__tests__/config-validation.test.ts` - 9 schema + validation tests
- `src/features/pricing/__tests__/config-editor.test.tsx` - 5 component + route tests
- `src/engine/__tests__/staleness.test.ts` - 5 getPriceStatus staleness tests
- `src/router/routes.ts` - Added /admin route and adminRoute to routeTree

## Decisions Made

- Zod schemas match actual provider-specific types (JijLicenseTier fields, DiaPackage structure, CitoBundle with contractPrices) rather than simplified interfaces from the plan spec
- validatePricingConfig uses the existing createCalculator factory to instantiate a real calculator for runtime validation
- AdminConfigEditor currently uses static PROVIDER_CONFIGS; Supabase persistence (updatePricingConfig, usePricingDataStore reload) deferred to merge point with Plans 25-01/02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error with JijLicenseTier.tier type**
- **Found during:** Task 2 (build verification)
- **Issue:** JijLicenseTier.tier is typed as literal union `1 | 2 | 3 | 4`, addTier used `number`
- **Fix:** Added explicit type assertion with `as JijLicenseTier['tier']` and used `JijLicenseTier` type in map callback
- **Files modified:** src/features/admin/ProviderConfigForm.tsx
- **Committed in:** `fda8550`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-safety fix required for build to pass. No scope creep.

## Known Stubs

- `AdminConfigEditor.handleSave` has TODO comments for `updatePricingConfig` and `usePricingDataStore.getState().loadFromSupabase()` calls. These depend on Plan 25-01 (DB operations) and 25-02 (pricing data store) which are built in parallel. The save handler logs to console until merge. This is intentional and will be wired when branches merge.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin config editor ready for integration with Supabase persistence (Plan 25-01/02)
- Validation schemas can be reused by any component that edits pricing configs
- /admin route accessible for managers after authentication

---
*Phase: 25-prijsintelligentie-stakeholder-feedback-loop*
*Completed: 2026-03-30*

## Self-Check: PASSED
