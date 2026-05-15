---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 05
subsystem: school-profile-wizard
tags: [wizard-step2, current-tool-usage, per-level, stichting-aggregation, dexie, supabase, zod, wave-3]

# Dependency graph
requires:
  - phase: 27-01
    provides: Plan scaffolds + test todos (CurrentToolPerLevel not yet exercised by 27-01)
  - phase: 27-02
    provides: Stichting entity + Dexie v3 schema + `getStichtingUsageMix` placeholder helper (returned 'unknown')
  - phase: 27-03
    provides: SchoolRecord sales-context shape pattern (customerType/schoolType/growthTrajectory wired the same way)
provides:
  - SchoolRecord.currentToolUsage optional `Partial<Record<SchoolLevel, CurrentToolUsage>>` field
  - CURRENT_TOOL_USAGE_VALUES + CurrentToolUsage + CurrentToolUsageMap types + Dutch CURRENT_TOOL_USAGE_LABELS in src/models/school.ts
  - supabase/migrations/016_current_tool_usage.sql — `ALTER TABLE schools ADD COLUMN current_tool_usage JSONB NOT NULL DEFAULT '{}'::jsonb`
  - Dexie v3 upgrade-callback append (idempotent `?? {}` default) — geen v4 bump
  - useSchoolProfileStore — setCurrentToolUsage(level, value) + setCurrentToolUsageMap(map) + hydrate mapping + initialState default
  - schemas/step2-schema.ts — extended met `currentToolUsage: z.partialRecord(...).default({})` + type → z.input
  - CurrentToolPerLevel.tsx — stateless presentational component (D-17), fieldset+legend per niveau met 5 radios
  - WizardStep2.tsx integratie — sectie alleen bij levels>0, write-through naar form + store + submit-mirror
  - Echte `getStichtingUsageMix` aggregatie in src/models/stichting.ts (4 mogelijke return-waardes, mix-shortcut, geen-grouped-with-concurrent)
  - 5 nieuwe stichting-aggregation tests + 4 nieuwe WizardStep2 R5 tests
affects: [phase-27-08, phase-27-11, phase-27-02 (consumer site StichtingOverviewPage card-indicator no longer always grey)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod 4 `z.partialRecord(z.enum(...), z.enum(...))` voor optionele enum-keyed maps. `z.record(z.enum(...), ...)` produceert in Zod 4 een strict `Record<K,V>` (exhaustive), wat botst met de R5-eis dat ontbrekende niveau-keys legitiem zijn. `partialRecord` is de canonieke Zod-4 idiom hiervoor."
    - "Write-through dual-source state pattern: per-radio `onChange` schrijft direct naar Zustand store (live cross-step UX) ÉN naar react-hook-form state via `setValue`. Submit-handler mirror't form-final terug naar store (defense-in-depth voor edge cases). Match't bestaand Phase 27-03 patroon."
    - "Append-in-place Dexie v3 upgrade — bij elke Phase-27 plan dat een schools-veld toevoegt extend ik dezelfde `version(3)` upgrade-callback met een nieuwe idempotente `?? <default>` regel. Voorkomt v4-bump voor users die nog niet eens migrated van v2 → v3, en houdt de migratie-window atomic."
    - "Test-scope hardening via `within(matrix)`: toen de R5-sectie dezelfde tekst-labels ('HAVO', 'VWO') als de matrix-rows kreeg, brak `screen.getByText('HAVO')` met 'multiple elements'. Fix: `within(screen.getByRole('table')).getByText(...)`. Geldig algemeen patroon zodra meerdere secties dezelfde labels reuse'n."

key-files:
  created:
    - apps/concurrentoolVO/supabase/migrations/016_current_tool_usage.sql
    - apps/concurrentoolVO/src/features/school-profile/components/CurrentToolPerLevel.tsx
  modified:
    - apps/concurrentoolVO/src/models/school.ts (CURRENT_TOOL_USAGE_VALUES + CurrentToolUsage + CurrentToolUsageMap + LABELS map)
    - apps/concurrentoolVO/src/models/stichting.ts (getStichtingUsageMix placeholder → real classification per Plan 27-05 interfaces)
    - apps/concurrentoolVO/src/db/types.ts (SchoolRecord.currentToolUsage optional + CurrentToolUsageMap import)
    - apps/concurrentoolVO/src/db/database.ts (Dexie v3 upgrade append — idempotent `?? {}` default voor currentToolUsage)
    - apps/concurrentoolVO/src/db/operations.ts (mapSchoolRow + mapSchoolUpdateToSnakeCase voor current_tool_usage)
    - apps/concurrentoolVO/src/lib/supabase/types.ts (schools Row/Insert/Update — current_tool_usage Json kolom)
    - apps/concurrentoolVO/src/features/school-profile/store.ts (setCurrentToolUsage + setCurrentToolUsageMap + hydrate + initialState)
    - apps/concurrentoolVO/src/features/school-profile/schemas/step2-schema.ts (z.partialRecord enum-keyed + .default({}) + type → z.input)
    - apps/concurrentoolVO/src/features/school-profile/components/WizardStep2.tsx (watch + setValue + setCurrentToolUsage(Map) wiring + section render)
    - apps/concurrentoolVO/src/features/school-profile/components/__tests__/WizardStep2.test.tsx (4 nieuwe R5 tests + bestaande 4 gescopt via `within(matrix)`)
    - apps/concurrentoolVO/src/features/school-profile/__tests__/step2.test.tsx (parallel test-file: 4 bestaande tests gescopt via `within(matrix)`)
    - apps/concurrentoolVO/src/db/__tests__/stichting-operations.test.ts (5 nieuwe getStichtingUsageMix aggregation assertions)

key-decisions:
  - "[Phase 27-05]: `'geen'` (nieuwe markt) groeperen met de concurrent-side in getStichtingUsageMix — niet als aparte 'unknown'. Reden: het Plan interfaces-block schreef `All ∈ {'dia','jij'}` → concurrent-only, maar Sales' intent voor de 3-dots indicator is 'kunnen we hier nog winnen?'. `'geen'` betekent niet-Cito, dus voor het mix-onderscheid valt het bij concurrent-side. Een lege/ontbrekende map blijft 'unknown'."
  - "[Phase 27-05]: Per-niveau `'mix'` short-circuits direct naar `'mixed'` zonder verdere iteratie — semantisch onmiskenbaar (een school met 'mix' op één niveau IS multi-aanbieder) en houdt de helper goedkoop voor straks 100+ scholen aggregatie. Houdt de iteratie verder cheap voor leesbaarheid."
  - "[Phase 27-05]: `z.partialRecord` ipv `z.record` voor de Zod schema, na een eerste typecheck-fail. `z.record(z.enum(K), z.enum(V))` produceert in Zod 4 een strict `Record<K,V>` (exhaustive over alle enum-keys), wat botst met de R5-eis dat ontbrekende niveau-keys legitiem zijn. `partialRecord` is precies hiervoor."
  - "[Phase 27-05]: Write-through naar store via `setCurrentToolUsage(level, value)` per radio-click + mirror via `setCurrentToolUsageMap` in submit-handler. Dubbel-pad lijkt redundant maar dekt twee gebruikssituaties: (a) live cross-step UX (gebruiker wisselt terug naar Stap 1 — store moet up-to-date zijn ZONDER expliciete submit), en (b) form-state als enige bron-of-truth bij edge-case errors. Past binnen het bredere Phase 27-03 patroon."
  - "[Phase 27-05]: Bestaande 4 WizardStep2 tests (in 2 verschillende test-files) braken op `getByText('HAVO')` omdat de R5-sectie via `<legend>` dezelfde tekst toevoegt aan de DOM. Per Rule 1 (bug introduced by my change in scope) gescopt via `within(screen.getByRole('table'))`. Geen behoud van losse getByText - die assertion-stijl is bij overlap fragiel."
  - "[Phase 27-05]: `getStichtingUsageMix` real classification getest met 5 nieuwe scenarios in stichting-operations.test.ts (Rule 2 — nieuw active codepad krijgt tests, niet alleen het placeholder-pad uit Plan 27-02). De bestaande 'returns unknown before Plan 27-05 fills currentToolUsage' test blijft groen omdat stub schools nog steeds geen currentToolUsage map hebben — backward-compatible."

metrics:
  duration: "~20min"
  completed_date: "2026-05-15"
  tasks_completed: 2
  files_created: 2
  files_modified: 11
  loc_added: "~315"
  commits: 2
---

# Phase 27 Plan 05: WizardStep2 huidig-gebruik per niveau + stichting mix-aggregatie Summary

R5 implemented: WizardStep2 capteert per geselecteerd niveau het huidige toetspakket (Cito / DIA / JIJ! / Mix / Geen) via radio's; aggregatie op stichtingsniveau via `getStichtingUsageMix` flipt van Plan 27-02 placeholder naar echte classificatie met 4 mogelijke uitkomsten.

## What Shipped

**Data-laag (Task 1):**
- `SchoolRecord.currentToolUsage?: Partial<Record<SchoolLevel, 'cito'|'dia'|'jij'|'mix'|'geen'>>` op Dexie + Supabase
- Migration `016_current_tool_usage.sql`: JSONB-kolom met default `{}`
- Dexie v3 upgrade-callback appended met idempotente `?? {}` default (geen v4 bump — atomic in dezelfde Plan-02/03/05 migratie-window)
- Zustand store: `setCurrentToolUsage(level, value)` + `setCurrentToolUsageMap(map)` actions + hydrate mapping
- `getStichtingUsageMix` real classification: per-niveau 'mix' → directe `'mixed'`; 'geen' grouped met concurrent-side; alleen 'cito' → `'cito-only'`; mix van Cito+niet-Cito → `'mixed'`; lege/ontbrekende maps → `'unknown'`

**UI (Task 2):**
- `CurrentToolPerLevel.tsx` (NEW): stateless component, fieldset+legend per niveau met 5 radios + Dutch heading "Welk pakket gebruikt elk niveau nu?"
- `WizardStep2.tsx` integratie onder student-counts-matrix: alleen rendered bij `levels.length > 0`; per-radio write-through naar form (`setValue`) + store (`setCurrentToolUsage`) + submit-mirror via `setCurrentToolUsageMap`
- Zod schema: `currentToolUsage: z.partialRecord(z.enum(SCHOOL_LEVELS), z.enum(CURRENT_TOOL_USAGE_VALUES)).default({})` — optioneel, Next-knop blokkeert niet bij lege state
- 4 nieuwe WizardStep2 R5 tests (rendering, persist, conditional show, optional-submit) + 5 nieuwe stichting-aggregation tests + bestaande 4 tests in 2 parallel test-files gescopt via `within(matrix)` voor labelduplicatie

## Commits

| Hash | Type | Message |
|------|------|---------|
| `91ad8d3` | feat | currentToolUsage per-niveau data-laag + stichting mix-aggregatie |
| `acf95bb` | feat | CurrentToolPerLevel UI + WizardStep2 integratie + Zod schema + tests |

## Verification

| Gate | Result |
|------|--------|
| `npm run build` | PASS — build succeeded zonder errors |
| `npx tsc -p tsconfig.app.json --noEmit` (full) | PASS — no errors anywhere |
| `npx tsc -p tsconfig.app.json --noEmit` (plan surface filter) | PASS — 0 hits op school-profile/stichting/db/operations |
| `npx vitest run src/db` | PASS — 42 tests / 13 todo / 7 files |
| `npx vitest run src/features/school-profile` | PASS — 163 tests / 21 files |
| `npx vitest run` (plan-targeted: stichting + migration + WizardStep2 tests) | PASS — 22 tests / 13 todo |

## Acceptance Criteria — R5

- ✓ Per niveau radio-keuze (Cito / DIA / JIJ! / Mix / Geen) persisteert in Dexie + Supabase
- ✓ Selectie persisteert via store (write-through) en blijft bij back-navigation
- ✓ Sectie is alleen zichtbaar wanneer 1+ niveaus geselecteerd in Stap 1
- ✓ Next-knop blokkeert NIET als geen radio gekozen is (optioneel veld)
- ✓ Aggregatie levert 4 mogelijke UsageMix-waardes op (cito-only / concurrent-only / mixed / unknown)
- ✓ getStichtingUsageMix verwerkt 3 scholen × 5 niveaus = 15 keuzes correct (geverifieerd via 5 unit-test scenarios)
- ✓ UI is Dutch, code is English (CLAUDE.md app-rule)
- ✓ Geen LOCKED files aangeraakt (`default-prices.ts` / `cito-migration-prices.ts`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing 4 WizardStep2 tests in 2 test-files broke on `getByText('HAVO')`**
- **Found during:** Task 2 — after wiring CurrentToolPerLevel
- **Issue:** Adding `<legend>HAVO</legend>` in the R5 section caused `screen.getByText('HAVO')` to throw 'multiple elements found' because the matrix row label and the R5 legend now both contain the same level name.
- **Fix:** Scoped queries via `within(screen.getByRole('table'))` in both `components/__tests__/WizardStep2.test.tsx` and `__tests__/step2.test.tsx`. Tests now assert against the matrix specifically, leaving the R5 section as a separate concern with its own dedicated tests.
- **Files modified:** `WizardStep2.test.tsx`, `step2.test.tsx`
- **Commit:** `acf95bb`

**2. [Rule 2 - Missing Critical Test Coverage] New `getStichtingUsageMix` codepath untested**
- **Found during:** Task 1 — Plan 27-02 only asserted the `'unknown'` placeholder path; flipping to real classification needed real-data assertions before the Stichting overview consumer (`StichtingOverviewPage.tsx`) starts relying on it.
- **Fix:** Added 5 scenarios to `stichting-operations.test.ts` covering cito-only, concurrent-only, mixed (cross-school), mix (short-circuit per-niveau), and empty-map → unknown. The pre-existing "before Plan 27-05" assertion still passes because stub schools without `currentToolUsage` legitimately produce `'unknown'`.
- **Files modified:** `src/db/__tests__/stichting-operations.test.ts`
- **Commit:** `acf95bb`

**3. [Rule 1 - Bug] Zod 4 `z.record(z.enum(...), z.enum(...))` produces strict Record**
- **Found during:** Task 2 — `npx tsc` failure: form type from `z.input` requires every level-key, but R5 is per-niveau-optional.
- **Fix:** Switched to `z.partialRecord` (Zod 4 idiom for optional enum-keyed records).
- **Files modified:** `step2-schema.ts`
- **Commit:** `acf95bb`

### Architectural decisions made within Claude's discretion

- **`'geen'` (nieuwe markt) grouped with concurrent-side in aggregation.** Plan interfaces showed `All ∈ {'dia','jij'}` → concurrent-only. Sales' implicit intent for the 3-dots indicator is "kunnen we hier nog winnen?" — `'geen'` is non-Cito, so falls on the concurrent side for the mix-discriminator. An empty/missing map stays `'unknown'`.
- **Per-niveau `'mix'` short-circuits to `'mixed'`.** Semantically a school marked 'mix' at any niveau is already multi-aanbieder, regardless of what the other niveaus say. Avoids unnecessary iteration; helper stays cheap for 100+ schools.
- **Dexie v3 upgrade-callback extended in place (no v4 bump).** Phase 27 has already added 4 fields in the same `version(3)` window (Plan 02 stichtingId + Plan 03's 4 sales-context fields). Appending currentToolUsage as a fifth idempotent default in the same callback keeps the v1/v2 → v3 migration atomic for users who haven't migrated yet.

## Authentication Gates

None. R5 is fully client-side state + Supabase JSONB persistence under existing RLS (schools table policies from migration 002). No new auth surface introduced.

## Threat Surface — Plan threat-model status

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-27-05-01 (Tampering: invalid enum) | mitigate | DONE — Zod enum frontend; helper skipt unknown enum (treated as `else` branch → concurrent-side); Postgres JSONB tolerant |
| T-27-05-02 (Info Disclosure: cross-team) | accept | DONE — RLS op schools tabel beschermt nieuwe kolom automatisch (inherited from migration 002) |

No new threat surface beyond what the plan threat-model anticipated.

## Known Stubs

None for R5 surface — full data-laag through UI is wired end-to-end. The aggregation is consumed downstream by `StichtingOverviewPage` (Plan 27-02) which still passes an empty `[]` to `getStichtingUsageMix` because per-card linked-school fetching is deferred (Plan 27-02 key-decision documented this as N+1 avoidance — proper aggregated count comes via Plan 27-07's smart-suggestion join). That stub is owned by Plan 27-02, not R5: the aggregation logic itself is now real.

## Deferred Issues

None. Out-of-scope `src/features/pricing/PrijzenPage.tsx` pre-existing TS errors mentioned in the orchestrator prompt did NOT surface during this plan's `npx tsc --noEmit` — full typecheck was clean. If they re-emerge in a later commit, they remain explicitly out of scope for 27-05.

## Self-Check: PASSED

- ✓ `apps/concurrentoolVO/src/features/school-profile/components/CurrentToolPerLevel.tsx` exists
- ✓ `apps/concurrentoolVO/supabase/migrations/016_current_tool_usage.sql` exists
- ✓ Commit `91ad8d3` exists in `git log`
- ✓ Commit `acf95bb` exists in `git log`
