---
phase: 28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-
plan: 04
subsystem: price-comparison-engine-deal-discounts-overlay
tags: [engine, pure-function, overlay, backward-compat, threat-mitigation, r3]

# Dependency graph
requires:
  - phase: 28
    plan: 01
    provides: EngineDealDiscount conceptual shape (DealDiscount DB row + dealDiscountSchema XOR), 4-provider catalog incl. saqi, R3 Wave-0 scaffold (4 it.todo + 1 SCAFFOLD invariant)
  - phase: 28
    plan: 02
    provides: deal_discounts DB CHECK + RLS team-scoping (defense layer below engine clamp)
provides:
  - "ComparisonOptions.dealDiscounts?: readonly EngineDealDiscount[] option"
  - "EngineDealDiscount engine-internal slim type (no DB metadata — keeps engine module independent from features/deal-outcomes)"
  - "applyDealDiscountToProviderCost() private pure helper (XOR resolution, 0-clamp, breakdown step, source flip)"
  - "Post-calculator overlay seam between modules construction and totals/differences (D-01 calculator-order constraint honored)"
  - "10 Phase 28 R3 acceptance tests in engine __tests__"
affects:
  - 28-05 (Uitkomst/Deal tab — wires real dealDiscounts via TanStack Query into existing ComparisonTab calculateComparison call)
  - 28-06 (DiscountEditor — XOR-form writes deal_discounts; needs mapper toEngineDiscount(DealDiscount) → EngineDealDiscount)
  - 28-09 (deal_cohort_stats matview — reads pricing snapshots without re-invoking engine; not affected by overlay)

# Tech tracking
tech-stack:
  added: []  # No new libraries
  patterns:
    - "Post-calculator overlay seam: pure-function transform on the constructed `modules` array between calculator results and totals/differences, mirroring the existing Scenario C `oldPlatformPrice` override pattern but per (module, provider) instead of cito-only"
    - "Engine-internal slim type vs DB row type (EngineDealDiscount vs DealDiscount): the engine never imports from features/deal-outcomes/ — keeps module-graph acyclic and the engine independently testable. Plan 06 owns the mapper bridge."
    - "Defense-in-depth XOR resolution: Math.max(0, ...) clamp on both percentage and amount paths, even though Zod + DB CHECK enforce upstream — engine boundary is the last gate before computation."
    - "Source-flip + breakdown-append pattern: priceRecord.source='manual' + sourceLabel='Deal-korting' + new PriceBreakdownStep makes the overlay visible in existing UI (PriceBadge + Prijsopbouw section) without UI changes"
    - "readonly EngineDealDiscount[]: the option signature makes mutation a compile error at the call-site, reinforcing the engine's pure-function invariant from the consumer side"

key-files:
  created: []
  modified:
    - "apps/concurrentoolVO/src/engine/price-comparison.ts (+75 LOC: EngineDealDiscount type + applyDealDiscountToProviderCost helper + overlay block + option field)"
    - "apps/concurrentoolVO/src/engine/__tests__/price-comparison.test.ts (+161 LOC net: 4 it.todo + 1 SCAFFOLD replaced by 10 real R3 tests; import EngineDealDiscount type)"

key-decisions:
  - "Overlay seam = constructed `modules` array, not the internal providerResults Map. The map → ModuleComparison[] transform via selectedModules.map(...) is where the user-visible structure crystallizes; mutating after that point means (a) we only walk modules the user actually selected (no orphan discounts), (b) the totals + hasAnyModule loops already iterate `modules` so they see the change for free, (c) the providerResults Map stays untouched (a Phase 25 internal contract)."
  - "Order locked: Calculators → Scenario C oldPlatform override → modules build → Phase 28 dealDiscounts overlay → totals → hasAnyModule → differences → diaPackageResult. The diaPackageResult is intentionally NOT recomputed for dealDiscounts because per-deal kortingen apply POST-package (Phase 10.2 + D-01) and the package selection logic operates on per-config publication prices, not on per-deal overrides. Plan 06 will confirm with a test fixture if needed."
  - "EngineDealDiscount is engine-internal and intentionally lacks id/dealOutcomeId/createdAt — keeps the engine module free of DB-row concerns and avoids a circular import between src/engine/ and src/features/deal-outcomes/. Plan 06 will add toEngineDiscount() in operations layer."
  - "XOR resolution: if both percentage and amount are (defensively) set, percentage wins. Zod + DB CHECK make this combination unreachable in production; the engine just needs a deterministic tiebreaker. Documented in the helper's JSDoc."
  - "Negative-result clamp at Math.max(0, ...) on BOTH percentage and amount paths. Zod enforces percentage ∈ (0, 100] and amount ≥ 0 at form layer; DB CHECK enforces the same at storage layer; engine clamp is defense-in-depth at boundary 3. Mitigates T-28-15 + T-28-16."
  - "Wave 0 scaffold's SCAFFOLD test replaced (not appended) because its only assertion (empty dealDiscounts == no option) is now redundant with the new 'backward-compat: empty dealDiscounts array' test. Net test count: −5 scaffold lines + 10 new tests = +5 active R3 tests."

patterns-established:
  - "Post-calculator overlay seam — replicable for any future per-deal or per-school override that needs to apply BEFORE totals/differences but AFTER per-provider calculation. Phase 25 marktKortingToggle uses a similar pattern at a different seam (pre-calculator); Phase 28 per-deal overlay is the post-calculator counterpart."
  - "Engine-internal slim type pattern: when a feature folder defines a DB-row type with persistence metadata (id, createdAt, etc.) and the engine needs only the business-logic subset, the engine declares its own slim type and the feature folder owns the mapper. Keeps module graph acyclic + engine independently testable."
  - "Breakdown step labeling convention for discounts: `Deal-korting (-${pct}%)` and `Deal-korting (-€${amount.toFixed(2)}/lln)`. Phase 25 MarktKortingToggle uses `Markt-korting`; Phase 28 distinguishes via `Deal-korting`. UI Prijsopbouw section already renders breakdown steps verbatim — no UI change needed."

requirements-completed: [R3]

# Metrics
duration: ~3min
completed: 2026-05-15
---

# Phase 28 Plan 04: Engine dealDiscounts Overlay (R3) Summary

**Phase 28 Wave 2 — `calculateComparison()` extended with optional `dealDiscounts: readonly EngineDealDiscount[]` option that overlays per-(module, provider) kortingen after the calculator loop and before totals/differences; 10 acceptance tests prove R3 (Vergelijking-tab herberekent met deal-kortingen) and the engine remains pure + backward-compatible.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-15T09:51:26Z
- **Completed:** 2026-05-15T09:54:37Z
- **Tasks:** 2 atomic commits
- **Files modified:** 2 (price-comparison.ts + price-comparison.test.ts)
- **LOC delta:** +75 source / +161 test net (replaced 41-line scaffold block with 202-line real-test block)
- **Tests delta:** +10 R3 acceptance tests (replaced 4 it.todo + 1 SCAFFOLD invariant)

## Accomplishments

- **`EngineDealDiscount` engine-internal type added** to `src/engine/price-comparison.ts` — intentionally lacks DB metadata (id, dealOutcomeId, createdAt) so the engine module stays independent from `src/features/deal-outcomes/`. Plan 06 owns the `toEngineDiscount(DealDiscount)` mapper.
- **`ComparisonOptions.dealDiscounts?: readonly EngineDealDiscount[]` option** wired — backward-compat verified: omitted OR empty array → identical output to no-option call (`toEqual` deep equality at both call sites).
- **`applyDealDiscountToProviderCost()` pure helper** — XOR resolution (percentage wins if both set, returns input unchanged if neither set), `Math.max(0, ...)` clamp on both paths (T-28-15/16 mitigation), appends a `Deal-korting` PriceBreakdownStep with the negative delta, flips `priceRecord.source='manual'` + `sourceLabel='Deal-korting'` so existing UI badge logic surfaces the override.
- **Overlay seam locked correctly** between modules-array construction (line ~215) and totals computation (line ~217). D-01 calculator-order constraint honored: Calculators → Scenario C override → modules build → **Phase 28 overlay** → totals → hasAnyModule → differences → diaPackageResult.
- **10 Phase 28 R3 acceptance tests** added in a dedicated `describe('Phase 28 — dealDiscounts overlay (R3)')` block — covers backward compat (×2), percentage discount, amount discount, amount clamp, totals recompute, differences recompute, defensive skip on unknown moduleId, defensive skip on null ProviderCost, multi-discount independence, and breakdown step append.
- **No regression in existing engine tests** — `npx vitest run src/engine` → 18 files passed + 1 skipped, 219 pass + 6 todo. Full project: 1060 pass + 80 todo + 11 fail (= exactly the 11 Plan 28-01 RED Nyquist anchors; no new regressions).

## Task Commits

Each task committed atomically:

1. **Task 1: Engine extension (option + helper + overlay seam)** — `207ab74` (feat)
2. **Task 2: 10 Phase 28 R3 acceptance tests + EngineDealDiscount type import** — `f7a8f68` (test)

## Files Created/Modified

### Modified

- `apps/concurrentoolVO/src/engine/price-comparison.ts` — added `EngineDealDiscount` interface, extended `ComparisonOptions` with `dealDiscounts?: readonly EngineDealDiscount[]`, added `applyDealDiscountToProviderCost()` private pure helper, injected overlay block between modules construction and totals computation (~+75 LOC).
- `apps/concurrentoolVO/src/engine/__tests__/price-comparison.test.ts` — replaced 41-line Wave-0 R3 scaffold block (4 it.todo + 1 SCAFFOLD test) with 202-line block containing 10 real R3 acceptance tests; added `EngineDealDiscount` type import.

## Verification

- **Plan grep gates:**
  - `grep -c "dealDiscounts" src/engine/price-comparison.ts` → 5 (≥2 required) ✓
  - `grep "applyDealDiscountToProviderCost" src/engine/price-comparison.ts` → 2 matches (≥1 required) ✓
  - `grep -E "PROVIDERS\s*=\s*\[" src/engine/price-comparison.ts` → 1 match with all 4 providers (cito, dia, jij, saqi) ✓
- **Plan must-haves:**
  - `calculateComparison()` accepts new optional `dealDiscounts` option ✓
  - Overlay is pure-function (no side effects, no async, deterministic — input array readonly, ProviderCost returned new, breakdown spread) ✓
  - Empty/missing `dealDiscounts` produces identical output to no-option call ✓ (proven by 2 backward-compat tests)
  - All existing price-comparison tests still pass (4 providers preserved) ✓
  - Phase 28 engine test block has ≥6 passing tests covering R3 acceptance ✓ (10 delivered)
- **TypeScript:** `npx tsc --noEmit -p .` → 0 errors.
- **Vitest engine suite:** 219 pass + 6 todo + 1 skipped file. **Zero engine regressions.**
- **Vitest full suite:** 1060 pass + 80 todo + 11 fail. The 11 failures are exactly the Plan 28-01 RED Nyquist anchors (`ERR_MODULE_NOT_FOUND` for files Plans 28-05..08 will create). Baseline matches Plan 28-02's 1050 + 10 new R3 tests = 1060 expected.
- **Threat-model coverage:** T-28-15 (negative `discountAmount` → positive price) and T-28-16 (`discountPercentage > 100` → negative price) both mitigated by the `Math.max(0, ...)` clamp at the engine boundary. T-28-17 (engine logging discount details) intrinsically satisfied — engine is pure, no logging.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Auto-add missing critical functionality] Breakdown step assertion added (test 11)**
- **Found during:** Task 2 (test authoring — comparing plan's "behavior" spec against the 10 listed test cases)
- **Issue:** The plan's `<behavior>` for Task 1 explicitly required "breakdown gets a final PriceBreakdownStep appended labeled 'Deal-korting' with the negative euro delta per student", but the plan's `<action>` test list (10 cases) did NOT include a breakdown-step assertion. Without a test, a future refactor could drop or rename the breakdown step silently — breaking the UI Prijsopbouw section which renders breakdown verbatim.
- **Fix:** Added an 11th test (`'breakdown: overlay appends a Deal-korting step with the negative delta'`) that asserts both `breakdown.length === baseLen + 1` and `lastStep.amount ≈ -basePrice * 0.1` for a 10% discount. This locks the contract that the UI relies on.
- **Files modified:** `src/engine/__tests__/price-comparison.test.ts`
- **Commit:** `f7a8f68`

### Auth Gates Encountered

None — pure engine work, no external services.

### Asked About (Rule 4)

None — no architectural changes needed. All work fit within the plan's seam-injection scope.

## Known Stubs

None — the overlay is complete and the 10+1 tests cover both the happy path and 3 defensive corner cases. The mapper `toEngineDiscount(DealDiscount): EngineDealDiscount` is intentionally deferred to Plan 06 per the plan's interfaces block; the engine's type `EngineDealDiscount` is callable today by any consumer who hand-constructs the slim shape (which Plan 05 will do for the UI wiring as well).

## Deferred Issues

None — both tasks completed first attempt; no auto-fix iterations needed.

## Threat Flags

None — no new attack surface introduced. The overlay strengthens existing trust boundaries: ui→engine boundary now has a Math.max(0, ...) clamp as boundary 3 (after Zod refine + DB CHECK), and the readonly array signature prevents in-place mutation of the input.

## Self-Check: PASSED

- FOUND: apps/concurrentoolVO/src/engine/price-comparison.ts (modified, +75 LOC)
- FOUND: apps/concurrentoolVO/src/engine/__tests__/price-comparison.test.ts (modified, +161 LOC net)
- FOUND: commit 207ab74 (feat — engine option + helper + overlay seam)
- FOUND: commit f7a8f68 (test — 10 R3 acceptance tests + breakdown assertion)
- VERIFIED: `dealDiscounts` appears 5 times in price-comparison.ts (option, helper-param, JSDoc, overlay-block, overlay-block-2)
- VERIFIED: `applyDealDiscountToProviderCost` appears 2 times (definition + call site)
- VERIFIED: PROVIDERS array still contains all 4 catalog providers (cito, dia, jij, saqi)
- VERIFIED: TypeScript clean (`npx tsc --noEmit -p .` exit 0)
- VERIFIED: Engine suite 219 pass + 6 todo + 1 skipped file (0 regressions)
- VERIFIED: Full project suite 1060 pass + 80 todo + 11 fail (= 1050 Plan-28-02 baseline + 10 new R3 tests; the 11 failures are the Plan 28-01 RED Nyquist anchors for Plans 28-05..08, no new regressions)
