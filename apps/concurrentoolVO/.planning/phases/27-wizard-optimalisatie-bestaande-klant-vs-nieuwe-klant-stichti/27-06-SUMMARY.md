---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 06
subsystem: wizard-step3
tags: [wizard-step3, basisvaardigheden, extra-modules, ui-restructure, r7]

# Dependency graph
requires:
  - phase: 27
    plan: 01
    provides: types relocated, scaffolds
  - phase: 27
    plan: 04
    provides: burgerschap + digitale-geletterdheid in MODULE_CATALOG (extra-modules category) + WizardStep3 CATEGORY_ORDER stub
provides:
  - WizardStep3 met 2 expliciete `<section>` headings (Basisvaardigheden / Extra Modules)
  - BASICS_MODULE_IDS export-equivalent constant (rekenwiskunde, nederlands, engels, taalverzorging)
  - MVT-subgroep als h3 binnen Extra Modules
  - LVS Compleet preset hermapt naar 4-module basis-set (incl. taalverzorging)
  - 9 nieuwe Vitest assertions voor R7 layout
affects: [phase-27-08, phase-27-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section-level grouping in WizardStep3 ontkoppeld van data-model categorieën — BASICS_MODULE_IDS array bepaalt section-split, niet `MODULE_CATALOG[].category`. Dit voorkomt breaking changes in price-comparison engine + ComparisonTable (die `'leerlingvolgsysteem'`/`'overige-instrumenten'` als group key gebruiken)."
    - "ARIA-correct sectie-structuur: `<section aria-labelledby='basisvaardigheden-heading'>` + `<h2 id='...'>` voor toegankelijkheidstools; MVT-subgroep als `<h3>` binnen Extra Modules section."
    - "Test-helper `sectionFor(headingText)` pattern: lookup-via-h2-heading + closest-section voor scoped `within(...)` assertions zonder DOM-fragiele class-selectors."

key-files:
  created: []
  modified:
    - src/features/school-profile/components/WizardStep3.tsx
    - src/features/school-profile/components/__tests__/WizardStep3.test.tsx
    - src/features/school-profile/__tests__/step3.test.tsx

key-decisions:
  - "[Phase 27-06] Geen rename van MODULE_CATALOG categorieën — Plan-text vroeg `'lvs'` → `'basisvaardigheden'` rename maar de actuele category-keys waren `'leerlingvolgsysteem'` en `'overige-instrumenten'`. Een data-model rename zou 20+ files breken (engine, ComparisonTable, 6 engine-test files met `moduleCategory: 'leerlingvolgsysteem'` mock data). R7 acceptance is een UI-restructure, niet een data-model rewire."
  - "[Phase 27-06] Section-split via WizardStep3-local constant `BASICS_MODULE_IDS` — section-grouping is een view-concern, geen data-concern. Behoudt scheiding tussen catalog-shape (engine-input) en UI-presentation (wizard step 3)."
  - "[Phase 27-06] Basisvaardigheden = 4 modules incl. Taalverzorging — user-prompt overrode plan-interfaces (3 modules). Plan en SPEC zaten in lichte conflict; user-prompt is meest recent en wint. LVS Compleet preset volgt deze definitie."
  - "[Phase 27-06] LVS Basis preset behoudt 3-module setup (geen taalverzorging) — backward-compat voor bestaande sales-flow; alleen LVS Compleet remap is nodig."
  - "[Phase 27-06] modules.ts ONGEWIJZIGD gelaten — plan-text Task 1 vroeg edits in modules.ts maar elke wijziging in categorie-keys zou bestaande tests + engine breken zonder R7-meerwaarde. Plan goal (R7) bereikt zonder modules.ts touch."

requirements-completed: [R7]

# Metrics
duration: ~8min
completed: 2026-05-15
---

# Phase 27 Plan 06: WizardStep3 Basisvaardigheden vs Extra Modules Summary

**WizardStep3 visueel geherstructureerd naar twee expliciete `<section>` headings — Basisvaardigheden (Rekenen + NL + EN + Taalverzorging) en Extra Modules (sociaal-emotioneel + cog cap + leer-werkhouding + Burgerschap + Digitale geletterdheid + MVT subgroep) — zonder data-model categorieën te renamen, met 9 nieuwe Vitest assertions die de layout, MVT-subgroep, preset-remap en section-onafhankelijke toggling borgen.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-14T22:51:00Z
- **Completed:** 2026-05-14T22:58:42Z
- **Tasks:** 2 (autonomous, no checkpoint)
- **Files modified:** 3 (1 production + 2 test)

## Accomplishments

- WizardStep3 toont nu **2 expliciete `<section>` headings** met ARIA-labelling (`aria-labelledby` gekoppeld aan h2 `id`)
- **Basisvaardigheden** sectie = rekenwiskunde + nederlands + engels + taalverzorging (4 modules; per user prompt; LVS Compleet preset hermapt hierop)
- **Extra Modules** sectie = al het andere (sociaal-emotioneel, cognitieve-capaciteiten, leer-werkhouding, burgerschap, digitale-geletterdheid) + MVT-subgroep (frans/duits/spaans) als h3 binnen Extra Modules
- MVT-subgroep blijft visueel binnen Extra Modules met h3 "Moderne Vreemde Talen" + "Alleen JIJ" badge
- **LVS Basis** preset behoudt 3-module setup (rekenwiskunde + nederlands + engels) voor backward-compat
- **LVS Compleet** preset hermapt naar 4-module basis-set (incl. taalverzorging) — volgt nieuwe Basisvaardigheden-definitie
- **Alles** preset werkt onveranderd (alle 12 modules)
- Module-toggling onafhankelijk per sectie geverifieerd via test (1 module per sectie tegelijk geselecteerd, store-state correct)
- 9 nieuwe Vitest assertions voor R7 layout (Basisvaardigheden heading, Extra Modules heading, module-distributie, MVT h3, ARIA-labelling, preset-remap)
- 1 bestaande assertion in `step3.test.tsx` bijgewerkt van oude category-headings naar nieuwe section-headings (Rule 1 scope-fix)
- WizardStep3 + step3 test files: **21/21 passed**

## Task Commits

1. **feat(27-06): restructure WizardStep3 into Basisvaardigheden + Extra Modules sections (R7)** — `59ba5dd`
   Files: `src/features/school-profile/components/WizardStep3.tsx`

2. **test(27-06): add Basisvaardigheden / Extra Modules section assertions (R7)** — `1d05e33`
   Files: `src/features/school-profile/components/__tests__/WizardStep3.test.tsx`, `src/features/school-profile/__tests__/step3.test.tsx`

## Files Created/Modified

### Modified — Production

- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep3.tsx`
  - Vervangen: `CATEGORY_ORDER`-driven `.map(category => ...)` rendering door 2 expliciete `<section>` blokken met h2 headings
  - Nieuw: `BASICS_MODULE_IDS` (rekenwiskunde + nederlands + engels + taalverzorging) lokaal in WizardStep3
  - Nieuw: `basicsModules`, `extraRegularModules`, `extraMvtModules` derivations binnen component body (preserve MODULE_CATALOG declaration order)
  - LVS Compleet preset: `MODULE_CATALOG.filter(m => m.category === 'leerlingvolgsysteem')` → `[...BASICS_MODULE_IDS]` (4 modules)
  - Verwijderd: import van `MODULE_CATEGORIES` + `ModuleCategory` type (niet meer gebruikt)
  - Inline rationale-comment: section-grouping is WizardStep3-only concept om engine-breakage te voorkomen

### Modified — Tests

- `apps/concurrentoolVO/src/features/school-profile/components/__tests__/WizardStep3.test.tsx`
  - Nieuw `describe('WizardStep3 - Basisvaardigheden vs Extra Modules (R7)')` met 9 assertions
  - Bestaande 5 assertions onveranderd (renders all modules, toggle visual state, persists to store, 0-modules valid, quick-picks present)
- `apps/concurrentoolVO/src/features/school-profile/__tests__/step3.test.tsx`
  - 1 assertion bijgewerkt: oude `'Leerlingvolgsysteem'`/`'Overige instrumenten'` heading-check → nieuwe `'Basisvaardigheden'`/`'Extra Modules'` h2-heading-check via `getByRole('heading', { level: 2, ... })`

### Untouched (per minimal-touch decision)

- `apps/concurrentoolVO/src/models/modules.ts` — plan-text vroeg category-rename, maar dat zou 20+ andere files breken. R7 goal (UI heading-split) bereikt zonder model-rewire.
- `apps/concurrentoolVO/src/engine/price-comparison.ts` — `moduleCategory: 'leerlingvolgsysteem'` default behouden; comparison engine ongewijzigd.
- `apps/concurrentoolVO/src/features/price-comparison/ComparisonTable.tsx` — `categoryOrder` array gebruikt nog `'leerlingvolgsysteem'`/`'overige-instrumenten'` als group-keys (ongewijzigd).
- `apps/concurrentoolVO/src/data/__tests__/module-catalog.test.ts` — assertions over data-model categorie ongewijzigd.
- `apps/concurrentoolVO/src/models/__tests__/modules.test.ts` — assertions over data-model categorie ongewijzigd.
- LOCKED files (`src/data/default-prices.ts`, `src/data/cito-migration-prices.ts`) — niet aangeraakt.

## Decisions Made

Belangrijkste: zie `key-decisions` in frontmatter.

Meest consequentieel:

- **Section-grouping ≠ data-model categorieën.** Het plan-text suggereerde een rename van `'lvs'` → `'basisvaardigheden'` op MODULE_CATALOG niveau. Inspectie wees uit dat de actual category-keys `'leerlingvolgsysteem'` / `'overige-instrumenten'` zijn (na Plan 27-04 ook `'extra-modules'`), en dat deze sleutels diep verweven zijn met `price-comparison.ts` engine logic + `ComparisonTable.tsx` rendering + 6 engine-test files (`upsell.test.ts`, `sensitivity.test.ts`, `hybrid-scenario.test.ts`, `cito-bundles.test.ts`, `ComparisonTable.test.tsx`, `ComparisonChart.test.tsx`, `ModuleDetailPanel.test.tsx`, `PriceComparisonPage.test.tsx`, `ai-advice.test.ts`). Een rename zou ~20+ files raken zonder R7-meerwaarde — R7 vraagt een UI-heading-split, niet een data-model rewire. Minimal-touch: section-split via WizardStep3-local `BASICS_MODULE_IDS` constant.

- **Basisvaardigheden = 4 modules** (incl. Taalverzorging), niet 3. User-prompt was helder: "Rekenen + NL + EN + TVZ baseline". Plan's `interfaces`-sectie zei 3 modules; SPEC R7 was ambigu. User-prompt is meest authoritative en meest recent (parallel-coordination context).

- **LVS Basis preset behoudt 3-module setup** voor backward-compat (sales-flow continuïteit). Alleen LVS Compleet remap is nodig om consistent te zijn met nieuwe Basisvaardigheden-definitie.

## Deviations from Plan

### Rule 3 — Plan-text vs reality mismatch (no breaking changes)

**1. [Rule 3 — Blocking issue avoided] Plan vroeg `'lvs'` rename, code gebruikt `'leerlingvolgsysteem'`**
- **Found during:** Task 1 read_first inspection
- **Issue:** Plan-text Task 1 zei "rename `'lvs'` → `'basisvaardigheden'`". Actual code (post-27-04) gebruikt `'leerlingvolgsysteem'` als category-key. Een rename op modules.ts zou 20+ files breken (engine + ComparisonTable + 6 engine-tests + 4 reporting-tests + 1 ai-advice test).
- **Fix:** Section-grouping verplaatst naar WizardStep3-lokale `BASICS_MODULE_IDS` constant. modules.ts niet aangeraakt. R7 acceptance volledig vervuld via UI-restructure.
- **Files modified:** alleen WizardStep3.tsx
- **Commit:** `59ba5dd`
- **Rationale:** Rule 3 (auto-fix blocking issues) — de plan-as-written zou de build/tests breken. Het plan goal (R7 = "Twee duidelijk gescheiden secties met heading") is volledig haalbaar zonder data-model rewire. Forward-compat: als toekomstige plans wel een data-model rename willen, kunnen ze dan ook alle 20+ consumer-files atomic updaten.

### Rule 1 — Scope-related test fix

**2. [Rule 1 — Bug] `src/features/school-profile/__tests__/step3.test.tsx` verwachtte oude category-headings**
- **Found during:** Task 2 vitest run (`npx vitest run src/features/school-profile/`)
- **Issue:** Een tweede WizardStep3-testfile (`__tests__/step3.test.tsx`, ouder pattern naast `components/__tests__/WizardStep3.test.tsx`) bevatte `expect(screen.getByText('Leerlingvolgsysteem')).toBeInTheDocument()`. Na R7 restructure bestaat die heading niet meer.
- **Fix:** Assertion bijgewerkt naar `getByRole('heading', { level: 2, name: 'Basisvaardigheden' })` + idem voor 'Extra Modules'. Inline comment refereert Phase 27 R7.
- **Files modified:** `src/features/school-profile/__tests__/step3.test.tsx`
- **Commit:** `1d05e33`

### Out-of-scope discoveries (deferred — see `deferred-items.md`)

**3. [Out of scope] Pre-existing TS errors in `src/features/pricing/PrijzenPage.tsx`**
- `npm run build` faalt vanwege `basisSub`/`setProvider`/`setBasisSub` references in PrijzenPage die niet in `usePrijzenSearch.ts` API zitten + `'overig'` key niet in `ConcurrentieSubTab`. Volledig pre-existing van een parallel prijs-editor refactor. WizardStep3 ongerelateerd.
- **Filed in:** `.planning/phases/27-.../deferred-items.md`

**4. [Out of scope] Test regressions in WizardStep1.test.tsx + WizardShell.test.tsx**
- Tussen Task 1 en Task 2 commit van 27-06 landde commit `9ac109b feat(27-03)` op dezelfde branch (parallel agent). 27-03 voegt nieuwe required fields toe aan WizardStep1 schema (customerType/schoolType/growthTrajectory) zonder de WizardStep1 + WizardShell tests bij te werken. Niet 27-06 verantwoordelijkheid.
- **Filed in:** `.planning/phases/27-.../deferred-items.md`

**Total deviations:** 2 (1× Rule 3 + 1× Rule 1)

**Impact on plan:** R7 acceptance volledig vervuld. Plan's `must_haves.truths` allemaal voldaan:
- ✓ WizardStep3 toont 2 expliciete secties (Basisvaardigheden + Extra Modules)
- ✓ Burgerschap + Digi-gel verschijnen in Extra Modules sectie
- ✓ Bestaande presets (LVS Basis/Compleet/Alles) blijven werken
- ✓ Module-toggling onafhankelijk per sectie
- ✓ MVT-subgroep blijft visueel binnen Extra Modules

## Issues Encountered

Geen blocking issues binnen 27-06 scope. Twee out-of-scope discoveries (PrijzenPage TS errors + 27-03 test regressions) gedocumenteerd in deferred-items.md voor de verantwoordelijke plan-owners.

## Acceptance Criteria — verification

- [x] R7 acceptance: expliciete Basisvaardigheden + Extra Modules headings (visueel + ARIA via `aria-labelledby`) — `getByRole('heading', { level: 2, name: 'Basisvaardigheden' })` + idem voor Extra Modules
- [x] Presets blijven functioneren — LVS Basis (3 mods), LVS Compleet (4 mods incl. taalverzorging), Alles (12 mods) allemaal getest
- [x] Snapshot/assertions confirmt layout — 9 nieuwe assertions slagen
- [x] Module-toggling onafhankelijk per sectie — getest met 1 click per sectie + store-state check
- [x] Burgerschap + Digitale geletterdheid in Extra Modules — `within(extraSection).getByText('Burgerschap')` + idem voor Digi-gel
- [x] MVT-subgroep zichtbaar binnen Extra Modules — h3 "Moderne Vreemde Talen" + 3 MVT modules getest
- [x] `npx vitest run src/features/school-profile/components/__tests__/WizardStep3.test.tsx src/features/school-profile/__tests__/step3.test.tsx` — 21/21 passed
- [ ] `npm run build` slaagt zonder TS errors — faalt op pre-existing PrijzenPage errors (out of 27-06 scope; filed in deferred-items.md)
- [ ] Volledige vitest suite groen — 1007/1015 passed (8 falen in WizardStep1.test.tsx + WizardShell.test.tsx = 27-03 regressions, out of 27-06 scope)

## Self-Check: PASSED (within 27-06 scope)

- Files modified existence verified via `git diff --stat`:
  - FOUND: `src/features/school-profile/components/WizardStep3.tsx` (modified, +99/-65)
  - FOUND: `src/features/school-profile/components/__tests__/WizardStep3.test.tsx` (modified, +166/-1)
  - FOUND: `src/features/school-profile/__tests__/step3.test.tsx` (modified, +12/-2)
- Commits exist:
  - FOUND: `59ba5dd` (feat(27-06): restructure WizardStep3)
  - FOUND: `1d05e33` (test(27-06): add R7 assertions)
- Verification gates within scope:
  - FOUND: WizardStep3 + step3 test files 21/21 passed
  - FOUND: TS typecheck clean for all 27-06 modified files (`tsc --noEmit` returns 0 errors in WizardStep3.tsx + both test files)
  - DEFERRED: PrijzenPage.tsx TS errors (pre-existing, see `deferred-items.md`)
  - DEFERRED: WizardStep1.test.tsx + WizardShell.test.tsx failures (parallel 27-03 regressions, see `deferred-items.md`)

## User Setup Required

Geen externe configuratie nodig. Handmatige verificatie (optioneel, voor sales-team UAT):
- Open `/wizard` → ga naar Stap 3 → controleer dat er twee duidelijk gescheiden headings staan: **Basisvaardigheden** (4 module-cards) en **Extra Modules** (6 module-cards + MVT-subgroep met 3 module-cards)
- Klik "LVS Compleet" preset → 4 module-toggles in Basisvaardigheden zijn aan
- Klik op individuele toggles → state persisteert in browser localStorage (Zustand persist)

## Next Phase Readiness

- **Plan 27-08 (R8 WizardStep4 summary + opmerkingen + tijd)** kan landen: WizardStep3 sectie-structuur is nu stabiel en testbaar, summary-blok in Stap 4 kan de module-keuze tonen gegroepeerd per sectie
- **Plan 27-09 (R9 AI pijnpunt-matching)** kan landen: MODULE_DIFFERENTIATORS (uit 27-04) gekoppeld aan Extra Modules sectie levert input voor rule-based matching keyword-map
- **Owner-actie (deferred)**: 27-03 test regressions (WizardStep1.test.tsx + WizardShell.test.tsx) — vraagt update van de tests om customerType/schoolType/growthTrajectory required fields te leveren
- **Owner-actie (deferred)**: PrijzenPage refactor — resync `PrijzenPage.tsx` met huidige `usePrijzenSearch` API

---
*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Plan: 06*
*Completed: 2026-05-15*
