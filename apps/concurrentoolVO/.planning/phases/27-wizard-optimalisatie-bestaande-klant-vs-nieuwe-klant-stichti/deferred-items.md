# Phase 27 — Deferred items (out-of-scope discoveries)

Items discovered during plan execution that are out of scope for the current
plan but should be addressed by their owning plan.

## From 27-06 execution (2026-05-15)

### Pre-existing TS errors in `src/features/pricing/PrijzenPage.tsx`

Discovered during `npm run build` after Plan 27-06 commits. Errors are
**pre-existing** and unrelated to WizardStep3 R7 changes — they originate
from an in-progress refactor of the prijzen-tab structure (a separate
working-tree change, likely the in-progress prijs-editor revision).

**Errors:**

```
src/features/pricing/PrijzenPage.tsx(31,26): error TS2339: Property 'basisSub' does not exist on type '{ tab: PrijzenTab; sub: ConcurrentieSubTab; setTab; setSub; }'.
src/features/pricing/PrijzenPage.tsx(31,44): error TS2339: Property 'setProvider' does not exist.
src/features/pricing/PrijzenPage.tsx(31,57): error TS2339: Property 'setBasisSub' does not exist.
src/features/pricing/PrijzenPage.tsx(54,24): error TS7053: Element implicitly has 'any' type ... Property 'overig' does not exist on type 'Record<ProviderKey, ProviderConfig>'.
```

**Root cause:** `usePrijzenSearch.ts` was updated to export `tab/sub/setTab/setSub`
(simplified API), but `PrijzenPage.tsx` still references the older
`basisSub/setProvider/setBasisSub` API + an `'overig'` sub-tab key that's
not in `ConcurrentieSubTab`. The hook + page got out of sync mid-refactor.

**Status:** WizardStep3 (R7) work is unaffected — vitest suite 1015/1015
passes, including all WizardStep3 + step3 + price-comparison tests. The
build errors block deploy of the `PrijzenPage` route only.

**Owner:** Whoever is driving the prijzen-tab refactor. Likely a follow-up
to Phase 26 prijs-editor work, or part of an in-progress plan touching
`features/pricing/`.

**Action:** Resync `PrijzenPage.tsx` with the new `usePrijzenSearch` API
(rename or restore `basisSub`/`setProvider`/`setBasisSub`) + extend
`ConcurrentieSubTab` with `'overig'` (or remove the `'overig'` reference
in PrijzenPage). Not in 27-06 scope.

### Test regressions from parallel-landed 27-03 (commit 9ac109b)

After Plan 27-03 (`feat(27-03): data-laag voor klant-type, schoolsoort en
groei-trajectorie`) landed between Task 1 and Task 2 of Plan 27-06, the
following test files started failing:

- `src/features/school-profile/components/__tests__/WizardStep1.test.tsx`
  (multiple cases — schema now requires customerType/schoolType/growthTrajectory)
- `src/features/school-profile/components/__tests__/WizardShell.test.tsx`
  (integration flow assumes WizardStep1 fields not yet wired in test)

**Status:** Out of 27-06 scope. My WizardStep3 changes pass their own
21 assertions (`WizardStep3.test.tsx` + `step3.test.tsx`). 27-03 owner
needs to update WizardStep1 + WizardShell tests to provide the new
required form fields. Filed for 27-03 follow-up.

**Owner:** Plan 27-03 driver (or a follow-up 27-03b plan).

## From 27-07 execution (2026-05-15)

### Pre-existing build errors (`src/features/pricing/PrijzenPage.tsx`)

Same cluster documented above for 27-06: `PrijzenPage.tsx` still references
the old `usePrijzenSearch` API (`provider` / `basisSub` / `setProvider` /
`setBasisSub`), still imports the deleted `./components/BasisSubTabs`, and
still passes props that don't match the new `ConcurrentieSubTabs` shape.

**Status during 27-07:** 8 errors in `PrijzenPage.tsx` only. All `src/lib/*`,
`src/features/stichtingen/*` and `src/db/operations.ts` files compile cleanly.
Plan 27-07 changes do not touch the pricing-page surface.

### Pre-existing vitest failures from in-flight concurrent agents

Discovered when running `npx vitest run` at the end of Plan 27-07. 19 tests
failed across 7 files — all in code paths the 27-07 plan does not touch:

- `src/features/pricing/__tests__/PrijzenPage.integration.test.tsx`
- `src/features/pricing/__tests__/PrijzenTabs.test.tsx`
- `src/features/pricing/__tests__/cito-module-grouping.test.ts` (12 tests)
- `src/features/school-profile/__tests__/step1.test.tsx` (2 tests)
- `src/features/school-profile/__tests__/wizard-navigation.test.tsx` (2 tests)
- `src/features/school-profile/components/__tests__/WizardShell.test.tsx` (3 tests)
- `src/features/school-profile/components/__tests__/WizardStep1.test.tsx`

**Root cause:** Plans 27-03 (WizardStep1 R3/R4 fields) and an in-progress
pricing-page refactor are landing in the working tree concurrently with
27-07. Their `cito-module-grouping`, `step1-schema`, and `WizardStep1` tests
expect symbols that haven't been exported yet, and the WizardStep flow
tests assert against a stale step1 shape.

**Plan 27-07 scope verification:**
- `npx vitest run src/lib/__tests__/stringSimilarity.test.ts
  src/lib/__tests__/stichtingMatcher.test.ts` → 17/17 passed.
- Bulk-link UI code paths (`src/features/stichtingen/*`) compile cleanly
  and have no direct test coverage in this plan (UI integration tests are
  Plan 27-12 scope).

**Owner:** Plans 27-03 (school-profile failures) + in-progress pricing
refactor (pricing failures). Both will resolve once their respective
plans finish landing.

## From 27-03 execution (2026-05-15)

### Resolution of 27-06/27-07-filed school-profile test regressions

Plan 27-03 has extended the four legacy WizardStep1 / WizardShell /
wizard-navigation / step1 tests to fill the newly-required R3 + R4 fields
(`customerType`, `schoolType`, `growthTrajectory`). All four files now pass
their assertions again.

- `src/features/school-profile/__tests__/step1.test.tsx` — 5/5 passing
- `src/features/school-profile/__tests__/wizard-navigation.test.tsx` — 8/8 passing
- `src/features/school-profile/components/__tests__/WizardShell.test.tsx` — 6/6 passing
- `src/features/school-profile/components/__tests__/WizardStep1.test.tsx` — 16/16 passing (10 new R3/R4 cases added on top of the original 6)

### Pre-existing pricing build + test failures NOT touched by 27-03

`src/features/pricing/PrijzenPage.tsx` + dependents still fail `npm run build`
with the same 8 TS errors logged above (out-of-sync `usePrijzenSearch` API,
missing `BasisSubTabs`, missing `ConcurrentieSubTab='overig'`). `cito-module-
grouping.test.ts` (12 failures), `PrijzenPage.integration.test.tsx`, and
`PrijzenTabs.test.tsx` fail with the same import-resolution errors.

These are 100% outside Plan 27-03 scope (no file in `src/features/pricing/`
is touched by R3/R4). Confirmed pre-existing via pre-Task-1 build run.

**Owner:** In-progress pricing refactor (likely Phase 26 prijs-editor follow-up
or a separate 27-x plan that hasn't merged yet).

## From 27-05 execution (2026-05-15)

### Migration-number collision with planned Phase 28 Plan 02

Plan 28-02 (per `apps/concurrentoolVO/.planning/ROADMAP.md` line 603)
states: *"migrations 016 (schools.onderwijsvisie) + 017 (deal_outcomes/
discounts/audit-log + RLS)"*.

Plan 27-05 has now landed `supabase/migrations/016_current_tool_usage.sql`.
This means **Plan 28-02 must renumber its migration sequence by +1**
(its `016` becomes `017`, its `017` becomes `018`, and the existing
Plan 28-03 reference to `018` becomes `019`).

**Status:** Out of 27-05 scope — Phase 28 hasn't been executed yet, so
this is a purely planning-side coordination issue. Plan 27-05 used the
next available number at execution time (015 was the previous max).

**Owner:** Phase 28 planner / planner of any future 27-08+ migration.
Re-number the Phase 28 plans before execution starts. Equivalent
update needed in `28-01-PLAN.md` if it mentions `016_*` filenames.

### Pre-existing build/test failures: NOT observed during 27-05

Unlike 27-03 / 27-06 / 27-07, the `PrijzenPage.tsx` TS errors and
`cito-module-grouping` test failures **did not surface** during
27-05 verification:
- `npm run build` succeeded clean
- Full `npx tsc -p tsconfig.app.json --noEmit` produced no errors
- `npx vitest run src/db` + `src/features/school-profile` all green

The in-progress pricing refactor changes are still staged as `M` /
`A` / `D` in the user's working tree (visible in `git status --short`
at session start). They have either been fixed in someone else's
parallel work since 27-06/27-07 ran, or they're temporarily resolved
in the current uncommitted working-tree state. Either way, this is
**not blocking 27-05** and the existing deferred-items entries above
remain owned by their original drivers.

