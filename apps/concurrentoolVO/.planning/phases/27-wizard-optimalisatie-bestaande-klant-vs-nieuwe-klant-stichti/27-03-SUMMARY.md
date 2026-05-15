---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 03
subsystem: school-profile-wizard
tags: [wizard-step1, customer-type, school-type, growth-trajectory, sales-context, dexie, supabase, zod]

# Dependency graph
requires:
  - phase: 27-01
    provides: Time-savings type relocation + 11 test scaffolds (R1, R2, R6, R9, R10, R11)
  - phase: 27-02
    provides: Stichting entity + Dexie v3 schema + idempotent upgrade pattern (SchoolRecord.stichtingId already wired)
provides:
  - SchoolRecord camelCase fields customerType + schoolType + customSchoolType + growthTrajectory (all optional + null)
  - supabase/migrations/015_school_sales_context.sql — 4 nullable TEXT kolommen op schools tabel (geen DB CHECK-constraint)
  - Dexie v3 upgrade-callback append (idempotent ?? null defaults) — geen v4 bump
  - useSchoolProfileStore — 4 nieuwe setters + hydrate-mapping + initialState defaults
  - WizardShell auto-save uitgebreid met de 4 nieuwe velden (persist via existing handleNext flow)
  - schemas/school-meta.schema.ts — gedeelde Zod (customerType + schoolType + customSchoolType + growthTrajectory) met conditional refine voor 'overig'
  - schemas/step1-schema.ts — extended via spread van schoolMetaShape + her-applied refine (ZodEffects.merge() niet bruikbaar in Zod 4)
  - 3 stateless sub-components: CustomerTypeRadio (R3), SchoolTypeFields (R4 select + conditional input), GrowthTrajectoryRadio (R4)
  - WizardStep1.tsx wired 3 nieuwe secties onder bestaande levels-checkboxen; store-setters op valid submit; customSchoolType geforceerd null als schoolType ≠ 'overig'
affects: [phase-27-05, phase-27-08, phase-27-10, phase-27-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sub-component composition pattern: 3 stateless presentational components (CustomerTypeRadio / SchoolTypeFields / GrowthTrajectoryRadio) krijgen react-hook-form register-spread + value + error props. Geen interne state — ouder controleert. Past binnen 'composition over inheritance' D-17 uit Phase 27 CONTEXT."
    - "Shared Zod shape exported as plain object (schoolMetaShape) i.p.v. ZodObject schema. Hierdoor kunnen callers via `...schoolMetaShape` spreaden in een eigen `z.object({...})` ZONDER ZodEffects-wrap die `.merge()`-incompatibel zou zijn. Refine wordt op het samengestelde schema her-applied."
    - "Hand-augment Supabase TypeScript types-file (Plan 27-02 pattern voortgezet) — voor elke nieuwe TEXT-kolom 3 plekken updaten: Row + Insert + Update. No codegen pipeline."
    - "Conditional-field invariant in submit-handler: schoolType !== 'overig' → setCustomSchoolType(null). Voorkomt 'stale' free-text wanneer user terug-switcht naar een gestructureerde optie."

key-files:
  created:
    - apps/concurrentoolVO/supabase/migrations/015_school_sales_context.sql
    - apps/concurrentoolVO/src/features/school-profile/schemas/school-meta.schema.ts
    - apps/concurrentoolVO/src/features/school-profile/components/CustomerTypeRadio.tsx
    - apps/concurrentoolVO/src/features/school-profile/components/SchoolTypeFields.tsx
    - apps/concurrentoolVO/src/features/school-profile/components/GrowthTrajectoryRadio.tsx
  modified:
    - apps/concurrentoolVO/src/models/school.ts (CUSTOMER_TYPES + SCHOOL_TYPES + GROWTH_TRAJECTORIES + 3 LABELS-maps + 3 unions)
    - apps/concurrentoolVO/src/db/types.ts (SchoolRecord 4 nieuwe optional fields + imports)
    - apps/concurrentoolVO/src/db/database.ts (Dexie v3 upgrade append — idempotente ?? null defaults)
    - apps/concurrentoolVO/src/db/operations.ts (mapSchoolRow + mapSchoolUpdateToSnakeCase voor 4 velden)
    - apps/concurrentoolVO/src/lib/supabase/types.ts (schools Row/Insert/Update 4 nieuwe customer_type/school_type/custom_school_type/growth_trajectory kolommen)
    - apps/concurrentoolVO/src/features/school-profile/store.ts (4 setters + initialState defaults + hydrate mapping)
    - apps/concurrentoolVO/src/components/wizard/WizardShell.tsx (auto-save serialiseert 4 nieuwe velden)
    - apps/concurrentoolVO/src/features/school-profile/schemas/step1-schema.ts (...schoolMetaShape spread + her-applied refine)
    - apps/concurrentoolVO/src/features/school-profile/components/WizardStep1.tsx (3 nieuwe sub-componenten + store-setters submit + customSchoolType clear-on-non-overig)
    - apps/concurrentoolVO/src/features/school-profile/components/__tests__/WizardStep1.test.tsx (10 nieuwe assertions over R3+R4)
    - apps/concurrentoolVO/src/features/school-profile/__tests__/step1.test.tsx (2 tests aangepast — fill nieuwe required fields)
    - apps/concurrentoolVO/src/features/school-profile/__tests__/wizard-navigation.test.tsx (2 tests aangepast)
    - apps/concurrentoolVO/src/features/school-profile/components/__tests__/WizardShell.test.tsx (3 tests aangepast)
    - apps/concurrentoolVO/.planning/phases/27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti/deferred-items.md (resolution note + pricing-PrijzenPage scope-out re-affirmation)

key-decisions:
  - "[Phase 27-03]: schoolMetaShape exported as plain JS object (NOT ZodObject) zodat caller-schemas via `...schoolMetaShape` kunnen spreaden binnen een eigen `z.object({...})`. Plan-interfaces stelden `.merge(schoolMetaSchema)` voor, maar Zod 4 maakt van een `.refine()`-wrapped schema een ZodEffects die niet `.merge()`-baar is. Spread + her-applied refine is dichterbij de plan-intent én typecheckt correct met `z.infer`."
  - "[Phase 27-03]: customSchoolType wordt geforceerd `null` in store bij submit als schoolType !== 'overig' (i.p.v. de raw form-value door te schrijven). Voorkomt 'orphan' free-text na een back-and-forth, en houdt downstream reporting consistent."
  - "[Phase 27-03]: 3 sub-components zijn stateless presentational — `register`-spread + `value` + `error` props in plaats van interne `useFormContext()`. Hierdoor blijven ze testbaar zonder full form-context provider in unit tests, en kan dezelfde component later worden hergebruikt in WizardStep4 summary-block (Plan 27-08 R8)."
  - "[Phase 27-03]: Dexie upgrade idempotent append in bestaande version(3) — geen v4. Plan 27-02 schreef v3 voor Stichting; toevoegen van 4 ?? null defaults in dezelfde callback voorkomt dat newly-opened DBs (die op v3 al meteen het schema krijgen) onnodig opnieuw migreren. ?? null check is veilig voor reruns."
  - "[Phase 27-03]: Plan listed only WizardStep1.test.tsx in `files_modified`, maar 3 extra test-files (step1.test.tsx, wizard-navigation.test.tsx, WizardShell.test.tsx) bleken dezelfde Zod-validated Step 1 te triggeren via integratie-tests en breekten. Rule 1 — bug introduced by my change → fix in scope. 7 testcases extended om de 3 nieuwe required fields in te vullen."

requirements-completed: [R3, R4]

# Metrics
duration: ~50min
completed: 2026-05-15
---

# Phase 27 Plan 03: WizardStep1 R3 klant-type + R4 schoolsoort/groei-trajectorie Summary

**WizardStep1 capteert nu klant-type (huidige Cito-klant / nieuwe prospect / gedeeltelijk), schoolsoort-variant (regulier / dakpanklas / dalton / montessori / vrije-school / overig + optionele free-text) en groei-trajectorie (groei / krimp / stabiel / loting). Drie stateless sub-components, gedeelde Zod-schema met conditional refine, Supabase migratie 015 + Dexie v3 idempotent uitgebreid, store + WizardShell auto-save volledig wired, 16/16 nieuwe + bestaande tests groen.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-05-15T00:50:00Z
- **Completed:** 2026-05-15T01:40:00Z
- **Tasks:** 2 (both fully automated)
- **Files modified:** 14 (5 created + 9 modified)
- **Commits:** 2 atomic

## Accomplishments

- **Data-laag complete (Task 1):** SchoolRecord uitgebreid met 4 optional fields + 3 const arrays + 3 LABELS-maps (Dutch). Supabase migratie `015_school_sales_context.sql` voegt 4 nullable TEXT kolommen toe (geen CHECK-constraint — Zod valideert front-end, T-27-03-03 mitigatie). Dexie v3 upgrade-callback krijgt idempotente `?? null` defaults (geen v4 bump, conform Plan-instructie). Store-setters + hydrate-mapping + WizardShell auto-save serialiseren de nieuwe velden via de bestaande `updateSchoolData()` flow. `src/lib/supabase/types.ts` hand-augmented (Plan 27-02 pattern voortgezet) — Row/Insert/Update voor de 4 nieuwe kolommen.
- **UI complete (Task 2):** 3 stateless sub-components — `CustomerTypeRadio` (R3, 3 opties + fieldset/legend ARIA-group), `SchoolTypeFields` (R4 select 6 opties + conditional `customSchoolType` input met maxLength=50 per T-27-03-01), `GrowthTrajectoryRadio` (R4, 4 opties). `WizardStep1.tsx` wired alle 3 onder de levels-checkboxen; submit-handler propagates naar store-setters; `customSchoolType` wordt geforceerd `null` als `schoolType !== 'overig'` (cleanup invariant). Reactive `watch('schoolType')` zorgt dat het conditional `customSchoolType` veld direct toggle bij user-selectie zonder volledige re-mount.
- **Schema R3+R4 complete:** `schoolMetaShape` als plain JS-object i.p.v. ZodObject — caller-schemas kunnen via `...schoolMetaShape` spreaden binnen hun eigen `z.object({...})` ZONDER ZodEffects-wrap die `.merge()` zou breken in Zod 4. Step1-schema spreadt + re-applied de conditional refine (`customSchoolType` required als `schoolType === 'overig'`).
- **Tests:** 16/16 in `WizardStep1.test.tsx` (10 nieuwe R3+R4 cases + 6 originele behouden). 4 testfiles (step1, wizard-navigation, WizardShell, WizardStep1) samen 36/36 groen. Resterende vitest failures (12 in `cito-module-grouping.test.ts` + 2 in `PrijzenPage.*`) zijn pre-existing parallel-agent WIP — confirmed out-of-scope, logged in `deferred-items.md`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Data-laag — SchoolRecord uitbreiding + Supabase migratie 015 + Dexie v3 idempotent + store actions** — `9ac109b` (feat)
2. **Task 2: UI — 3 sub-components + WizardStep1 integratie + Zod schema extension + 4 test-files updated** — `4e1d641` (feat)

## Files Created/Modified

### Created (5 files)

- `apps/concurrentoolVO/supabase/migrations/015_school_sales_context.sql` — `ALTER TABLE schools ADD COLUMN customer_type / school_type / custom_school_type / growth_trajectory` (allemaal nullable TEXT)
- `apps/concurrentoolVO/src/features/school-profile/schemas/school-meta.schema.ts` — `customerTypeSchema` + `schoolTypeEnum` + `growthTrajectorySchema` + `schoolMetaShape` (plain object) + `schoolMetaSchema` (z.object + refine) + `SchoolMetaData` type
- `apps/concurrentoolVO/src/features/school-profile/components/CustomerTypeRadio.tsx` — stateless radio-group, 3 opties met `CUSTOMER_TYPE_LABELS`, fieldset+legend voor ARIA group-semantics
- `apps/concurrentoolVO/src/features/school-profile/components/SchoolTypeFields.tsx` — native `<select>` met 6 opties + conditional `customSchoolType` input (maxLength=50)
- `apps/concurrentoolVO/src/features/school-profile/components/GrowthTrajectoryRadio.tsx` — stateless radio-group, 4 opties met `GROWTH_TRAJECTORY_LABELS`, fieldset+legend

### Modified (9 files)

- `apps/concurrentoolVO/src/models/school.ts` — 3 nieuwe const arrays (`CUSTOMER_TYPES` / `SCHOOL_TYPES` / `GROWTH_TRAJECTORIES`) + 3 union-types + 3 Dutch labels-maps
- `apps/concurrentoolVO/src/db/types.ts` — `SchoolRecord` uitgebreid met `customerType` + `schoolType` + `customSchoolType` + `growthTrajectory` (allemaal optional + null) + imports
- `apps/concurrentoolVO/src/db/database.ts` — Dexie `version(3).upgrade()` callback krijgt 4 idempotente `?? null` defaults
- `apps/concurrentoolVO/src/db/operations.ts` — `mapSchoolRow` + `mapSchoolUpdateToSnakeCase` mappen de 4 snake_case ↔ camelCase
- `apps/concurrentoolVO/src/lib/supabase/types.ts` — schools-tabel Row/Insert/Update krijgen `customer_type` + `school_type` + `custom_school_type` + `growth_trajectory` (nullable string)
- `apps/concurrentoolVO/src/features/school-profile/store.ts` — `useSchoolProfileStore` krijgt `customerType` + `schoolType` + `customSchoolType` + `growthTrajectory` state + 4 setters; `initialState` + `hydrate(record)` uitgebreid
- `apps/concurrentoolVO/src/components/wizard/WizardShell.tsx` — `handleNext()` auto-save uitgebreid met de 4 nieuwe velden uit de store
- `apps/concurrentoolVO/src/features/school-profile/schemas/step1-schema.ts` — `schoolTypeSchema` composeert nu `schoolName + levels + ...schoolMetaShape` + re-applied conditional refine
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep1.tsx` — 3 nieuwe sub-componenten onder levels; submit propagates naar 4 store-setters; `customSchoolType` geforceerd `null` als `schoolType !== 'overig'`; reactive `watch('schoolType')` voor conditional render

## Decisions Made

See `key-decisions` in frontmatter. Most consequential:

- **`schoolMetaShape` als plain JS-object** — plan-interfaces stelden `.merge(schoolMetaSchema)` voor maar Zod 4 maakt van een `.refine()`-wrapped schema een `ZodEffects` die niet `.merge()`-baar is. Plain shape spread + re-applied refine op het samengestelde schema is dichterbij de plan-intent én typecheckt correct met `z.infer`.
- **Idempotente Dexie v3 upgrade append** — i.p.v. een v4 bump koppelen we de 4 nieuwe `?? null` defaults aan de bestaande v3 `.upgrade()` callback van Plan 27-02. Newly-opened DBs op v3 krijgen het schema meteen via `.stores()`; bestaande v1/v2 DBs migreren in één keer.
- **Conditional-field invariant in submit** — `customSchoolType` wordt expliciet `null` gezet als `schoolType !== 'overig'`. Voorkomt 'stale' free-text wanneer user terug-switcht naar een gestructureerde optie, en houdt downstream reporting (CSV/PDF export Plan 27-11) consistent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan-interface `.merge(schoolMetaSchema)` werkt niet in Zod 4 (ZodEffects niet `.merge()`-baar)**

- **Found during:** Task 2 (eerste `npm run build` na schemafile creation)
- **Issue:** Plan `<interfaces>` block stelde `schoolTypeSchema.merge(schoolMetaSchema)` voor, maar `schoolMetaSchema = z.object({...}).refine(...)` is een `ZodEffects` instance — `.merge()` bestaat alleen op `ZodObject`. TS compileert wel maar `z.infer<typeof schoolTypeSchema>` resolved alleen naar `{ schoolName, levels }` — de gemerged fields ontbreken volledig in het type.
- **Fix:** `schoolMetaShape` geëxporteerd als plain JS-object zonder ZodObject-wrap, en in step1-schema gespread (`...schoolMetaShape`) binnen een `z.object({...})`. Refine wordt na het samenstellen opnieuw toegepast.
- **Files modified:** `school-meta.schema.ts`, `step1-schema.ts`
- **Commit:** included in `4e1d641` (caught + fixed pre-commit)

**2. [Rule 1 - Bug] Plan listed alleen WizardStep1.test.tsx maar 3 andere test-files breekten ook door de nieuwe required fields**

- **Found during:** Full vitest run na Task 2
- **Issue:** Plan `<files>` block listed alleen `__tests__/WizardStep1.test.tsx`. Maar 3 andere test-files (`__tests__/step1.test.tsx` + `__tests__/wizard-navigation.test.tsx` + `components/__tests__/WizardShell.test.tsx`) renderen WizardStep1 via integration paths en breekten op de nieuwe Zod-validation (required customerType + schoolType + growthTrajectory).
- **Fix:** 7 testcases uitgebreid om de 3 nieuwe required fields in te vullen na de levels-clicks. Bestaande assertions behouden.
- **Files modified:** `step1.test.tsx`, `wizard-navigation.test.tsx`, `WizardShell.test.tsx`
- **Verification:** 36/36 tests groen across alle 4 affected test-files.
- **Committed in:** `4e1d641`

**3. [Rule 2 - Auto-add missing critical functionality] Supabase types + WizardShell auto-save niet in plan files_modified, maar moeten mee anders breekt persistentie**

- **Found during:** Task 1 (mapSchoolRow + WizardShell flow review)
- **Issue:** Plan `<files>` block listed niet `src/lib/supabase/types.ts` (de hand-maintained Database types) en niet `src/components/wizard/WizardShell.tsx`. Zonder beide breekt of (a) `npm run build` op `supabase.from('schools').update({ customer_type: ... })` of (b) worden de fields wel in store gezet maar NIET naar Dexie/Supabase geschreven.
- **Fix:** Supabase types Row/Insert/Update extended (Plan 27-02 pattern). WizardShell `handleNext()` auto-save serialiseert de 4 nieuwe velden uit `state` naar `updateSchoolData()`. Beide nodig voor R3+R4 acceptance ("Alle 4 nieuwe velden persisteren in Dexie + Supabase via store").
- **Files modified:** `src/lib/supabase/types.ts`, `src/components/wizard/WizardShell.tsx`
- **Committed in:** `9ac109b`

### Plan-vs-reality (informational)

**4. [Plan accuracy] Actual files_modified count = 14 (5 created + 9 modified) vs plan-listed 11**

- **Found during:** SUMMARY drafting
- **Issue:** Plan frontmatter `files_modified` listed 12 paths; actual = 14. De extras zijn alle 3 Rule 2 augmentations (Supabase types + WizardShell auto-save) en de 3 extra test-files (Rule 1 bug-fixes) + de `deferred-items.md` planning note.
- **Fix:** No code change — extras zijn legitiem in scope onder Rules 1+2 boven.

---

**Total deviations:** 2 Rule 1 bug-fixes (Zod 4 `.merge()` workaround + 3 extra test-files extended) + 1 Rule 2 auto-add (Supabase types + WizardShell auto-save) + 1 informational delta. No Rule 4 architectural decisions needed.

**Impact on plan:** All 6 `must_haves.truths` satisfied. All 5 `must_haves.artifacts` produced. Both `must_haves.key_links` realised:
- `WizardStep1.tsx` → `CustomerTypeRadio.tsx` via JSX render ✓
- `WizardStep1.tsx` → store via `setCustomerType` / `setSchoolType` / `setCustomSchoolType` / `setGrowthTrajectory` ✓

## Issues Encountered

- **Stash POP brought in unrelated WIP** — tijdens een tussentijdse `git stash` (om te verifiëren of de pricing-PrijzenPage build-errors pre-existing waren) bracht de POP onverwacht een batch wijzigingen van andere parallel-agents binnen (Plan 27-07 stichting-matcher files, Phase 26/27-06 pricing refactors). Mijn eigen wijzigingen bleven in het werkbestand, maar ik moest scrupuleus filteren bij `git add` om alleen mijn Plan 27-03 files te committen. Geen verloren werk.
- **Pre-existing build failures in pricing/PrijzenPage.tsx** — 8 TS-errors uit `src/features/pricing/PrijzenPage.tsx` blokkeren `npm run build` 100%. Bevestigd pre-existing via een tijdelijke `git stash` test. Origin: in-progress Phase 26 prijs-editor refactor in de werktree van een andere agent. Logged + scoped out in `deferred-items.md`.
- **Pre-existing vitest failures (14 tests)** — 12 in `cito-module-grouping.test.ts` + 2 in `PrijzenPage.*` blijven na mijn werk falen. Ook pre-existing parallel-agent territory; logged in `deferred-items.md`.

## Known Stubs

Geen. R3+R4 functionaliteit is volledig end-to-end gewired (form → store → Dexie/Supabase). De velden zijn nu beschikbaar voor:

- **Plan 10 (R10) Upsell-scenario visibility** — `customerType !== 'nieuwe-prospect'` check in WizardStep5.
- **Plan 27-08 (R8) WizardStep4 summary-block** — `schoolType` + `growthTrajectory` + `customerType` lezen uit store voor read-only summary met "Wijzig"-link terug naar Stap 1.
- **Plan 27-11 (R2) Stichting bulk-export** — alle 4 velden meenemen in CSV-kolommen en DMU-PDF-aggregatie.

## Threat Flags

Geen nieuwe surface buiten plan-`<threat_model>`. T-27-03-01 mitigated via `maxLength={50}` op `customSchoolType` input + Zod `.max(50)`. T-27-03-02 mitigated via inherited RLS van bestaande schools-tabel (geen nieuwe policies nodig). T-27-03-03 mitigated via Zod enum-validation; DB stores plain TEXT zonder CHECK-constraint per D-18 simplicity.

## Self-Check: PASSED

- Files exist:
  - FOUND: apps/concurrentoolVO/supabase/migrations/015_school_sales_context.sql
  - FOUND: apps/concurrentoolVO/src/features/school-profile/schemas/school-meta.schema.ts
  - FOUND: apps/concurrentoolVO/src/features/school-profile/components/CustomerTypeRadio.tsx
  - FOUND: apps/concurrentoolVO/src/features/school-profile/components/SchoolTypeFields.tsx
  - FOUND: apps/concurrentoolVO/src/features/school-profile/components/GrowthTrajectoryRadio.tsx
- Commits exist:
  - FOUND: 9ac109b (Task 1: data-laag)
  - FOUND: 4e1d641 (Task 2: UI + tests)
- Schema wired:
  - FOUND: `schoolMetaShape` spread in `step1-schema.ts` + refine re-applied
- Store wired:
  - FOUND: `customerType` / `schoolType` / `customSchoolType` / `growthTrajectory` in `useSchoolProfileStore` (state + setter + hydrate + initialState)
- WizardShell auto-save wired:
  - FOUND: 4 nieuwe velden in `updateSchoolData` call inside `handleNext`
- Tests green: 36/36 across 4 affected test files (`npx vitest run src/features/school-profile/__tests__/step1.test.tsx src/features/school-profile/__tests__/wizard-navigation.test.tsx src/features/school-profile/components/__tests__/WizardShell.test.tsx src/features/school-profile/components/__tests__/WizardStep1.test.tsx` → 36 passed)
- Build status: pre-existing pricing/PrijzenPage errors blokkeren `npm run build` exit 0 (8 errors uit `features/pricing/` werk-in-progress). Plan 27-03 surface compileert schoon — `npx tsc --noEmit -p tsconfig.app.json | grep "school-profile\|stichting"` = 0 hits.

## User Setup Required

Supabase migratie `015_school_sales_context.sql` moet via `supabase db push` worden uitgevoerd voor zowel dev als prod project — conform de bestaande migratie-workflow. Geen nieuwe env-vars, geen nieuwe external services, geen nieuwe dependencies.

## Next Phase Readiness

- **Plan 27-05 (R5 currentToolUsage per niveau)** — onafhankelijk; kan parallel uitgevoerd worden. WizardStep2 territorium, geen overlap met Step 1 fields.
- **Plan 27-08 (R8 WizardStep4 summary + opmerkingen)** — gebruik de 3 nieuwe Step 1 store-fields (`customerType` / `schoolType` / `growthTrajectory` + `customSchoolType` als `overig`) voor het summary-blok. Wijzig-links via `setCurrentStep(0)`.
- **Plan 27-10 (R10 cito-oud cleanup + Upsell-scenario)** — `customerType !== 'nieuwe-prospect'` is nu de officiële check voor Upsell-zichtbaarheid in WizardStep5.
- **Plan 27-11 (R2 Stichting bulk-export)** — 4 nieuwe SchoolRecord velden kunnen direct meegenomen worden in CSV-kolommen + DMU-PDF aggregatie.

---
*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Plan: 03*
*Completed: 2026-05-15*
