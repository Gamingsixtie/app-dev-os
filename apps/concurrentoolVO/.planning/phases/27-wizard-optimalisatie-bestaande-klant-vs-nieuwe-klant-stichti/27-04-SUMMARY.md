---
phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti
plan: 04
subsystem: module-catalog
tags: [module-catalog, burgerschap, digitale-geletterdheid, slo-kerndoelen, cito-only, schijnvoordeel]

# Dependency graph
requires:
  - phase: 27
    plan: 01
    provides: src/data/__tests__/module-catalog.test.ts scaffold (6 it.todo placeholders)
provides:
  - 2 nieuwe ModuleDefinition entries (burgerschap, digitale-geletterdheid)
  - 'extra-modules' ModuleCategory + CATEGORY_LABELS
  - 2 Cito placeholder PriceRecords (€0,00) + individualPrices entries
  - 2 MODULE_DIFFERENTIATORS entries (Cito-only voordelen)
  - WizardStep3 CATEGORY_ORDER bevat 'extra-modules' (R6 acceptance: zichtbaar)
  - module-catalog.test.ts 8 GREEN assertions (replace scaffold it.todo)
affects: [phase-27-06, phase-27-08, phase-27-09, phase-27-16]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Niveau-onafhankelijke modules: MODULE_CATALOG heeft geen per-module levels veld; alle niveau-coverage volgt automatisch omdat WizardStep3 geen niveau-filter toepast"
    - "Cito-only schijnvoordeel: availableFrom=['cito'] + alleen Cito PriceRecord + andere provider configs onaangeraakt (cito-only by absence)"
    - "Placeholder tarieven €0,00 met source='manual': forceert handmatige invoer voor publicatie (data-correctheid is owner-verantwoordelijkheid per SPEC R6 out-of-scope)"
    - "Minimale UI-hook in WizardStep3 CATEGORY_ORDER: nieuwe category zichtbaar maar Plan 27-06 doet de feitelijke Basisvaardigheden/Extra Modules restructuring"

key-files:
  created:
    - "(geen nieuwe files; alle wijzigingen in bestaande catalog/data/test files)"
  modified:
    - src/models/modules.ts
    - src/data/providers/cito.ts
    - src/data/differentiators.ts
    - src/features/school-profile/components/WizardStep3.tsx
    - src/data/__tests__/module-catalog.test.ts
    - src/models/__tests__/modules.test.ts
    - src/data/providers/__tests__/migration-parity.test.ts
    - src/features/pricing/__tests__/cito-module-grouping.test.ts

key-decisions:
  - "[Phase 27-04]: ModuleDefinition krijgt GEEN levels field — niveau-coverage is een UI-runtime invariant (WizardStep3 filtert niet op niveau), niet een data-eigenschap. Toevoeging zou breaking shape-change zijn voor 10 bestaande modules en alle consumers."
  - "[Phase 27-04]: providerAvailability map vermeden — bestaand model gebruikt availableFrom: ProviderKey[] consistent over alle 10 modules; nieuwe pattern zou inconsistentie creëren. Cito-only = availableFrom: ['cito'] + andere providers schrijven geen PriceRecord (absence-pattern, conform DIA/JIJ/SAQI)."
  - "[Phase 27-04]: WizardStep3 CATEGORY_ORDER krijgt 'extra-modules' toegevoegd ondanks 'GEEN UI-wijzigingen' policy — Rule 2 critical functionality: SPEC R6 acceptance vereist 'beide modules zichtbaar in WizardStep3', dus zonder deze 1-line tweak zouden modules onzichtbaar zijn. Plan 27-06 doet de feitelijke Basis/Extra restructuring (heading-split, presets, layout)."
  - "[Phase 27-04]: cito-module-grouping `'overige'` subcategory wordt catch-all — comment in cito-module-grouping.ts zegt expliciet 'future-proofing'. Test invariant gesplitst: baseline-Cito-modules NOT IN 'overige' + nieuwe modules WEL in 'overige' tot Plan 27-06 promoot."
  - "[Phase 27-04]: Cito-prijzen €0,00 placeholder + source='manual' + verifiedAt=plan-datum — dwingt handmatige invoer via prijs-editor af voor publicatie. Geen user-OK gevraagd voor placeholder waarde omdat data-correctheid expliciet uit SPEC R6 scope is."

requirements-completed: [R6]

# Metrics
duration: ~20min
completed: 2026-05-15
---

# Phase 27 Plan 04: Burgerschap + Digitale geletterdheid Module-catalogus Summary

**Twee Cito-only modules toegevoegd aan MODULE_CATALOG (Burgerschap, Digitale geletterdheid) — nieuwe 'extra-modules' categorie, placeholder Cito tarieven (€0,00), AI-intake aliases (incl. AI-geletterdheid + burgerschapsonderwijs), differentiators, en minimal WizardStep3 hook zodat R6 acceptance "beide modules zichtbaar" voldoet zonder Plan 27-06 R7 te pre-empten.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-15T00:32:00Z
- **Completed:** 2026-05-15T00:42:00Z
- **Tasks:** 1 (autonomous, no checkpoint per SPEC R6 lock)
- **Files modified:** 8 (4 production + 4 test)

## Accomplishments

- `MODULE_CATALOG` uitgebreid van 10 naar 12 entries — Burgerschap + Digitale geletterdheid beide met cito-only availability, alle SLO-relevante aliases, in nieuwe `'extra-modules'` categorie
- `ModuleCategory` union + `MODULE_CATEGORIES` map uitgebreid met `'extra-modules': 'Extra Modules'`
- Cito provider data uitgebreid: 2 placeholder PriceRecords (€0,00, source='manual') + `individualPrices` entries — data-correctheid bewust uit scope per SPEC R6
- `MODULE_DIFFERENTIATORS` uitgebreid met Cito-onderscheidende voordelen voor beide modules (SLO kerndoelen aansluiting, AI-geletterdheid inclusief, adaptief leerpad)
- WizardStep3 `CATEGORY_ORDER` uitgebreid met `'extra-modules'` — minimal hook (1 regel) zodat de twee modules zichtbaar zijn; Plan 27-06 R7 verbouwt dit visueel naar Basisvaardigheden / Extra Modules layout
- `module-catalog.test.ts` 6 `it.todo` placeholders vervangen door 8 GREEN assertions (presence, Cito-only, AI-geletterdheid alias, burgerschapsonderwijs alias, extra-modules category, niveau-onafhankelijkheid via shape inspection, regression guard)
- Build groen (npm run build) en volledige vitest suite groen (980 passed, 51 todo, 8 skipped — geen regressies)

## Task Commits

Each task was committed atomically:

1. **feat(27-04): add burgerschap + digitale-geletterdheid modules (Cito-only)** — `af48543`
   Files: modules.ts, providers/cito.ts, differentiators.ts, WizardStep3.tsx

2. **test(27-04): convert R6 it.todo scaffold to real assertions + dependent test updates** — `9ba4bd6`
   Files: module-catalog.test.ts, modules.test.ts, migration-parity.test.ts, cito-module-grouping.test.ts

## Files Created/Modified

### Modified — Production
- `apps/concurrentoolVO/src/models/modules.ts` — ModuleCategory union + 2 nieuwe ModuleDefinitions + CATEGORY_LABELS
- `apps/concurrentoolVO/src/data/providers/cito.ts` — 2 placeholder PriceRecords + individualPrices entries (€0,00)
- `apps/concurrentoolVO/src/data/differentiators.ts` — 2 Cito-only differentiator entries
- `apps/concurrentoolVO/src/features/school-profile/components/WizardStep3.tsx` — CATEGORY_ORDER 1-line tweak

### Modified — Tests
- `apps/concurrentoolVO/src/data/__tests__/module-catalog.test.ts` — scaffold → 8 GREEN assertions
- `apps/concurrentoolVO/src/models/__tests__/modules.test.ts` — count 10→12 + expectedIds
- `apps/concurrentoolVO/src/data/providers/__tests__/migration-parity.test.ts` — count 20→22 + phase27Prices array
- `apps/concurrentoolVO/src/features/pricing/__tests__/cito-module-grouping.test.ts` — invariant split (baseline vs Phase 27 extras-in-overige fallback)

### Untouched (per plan / LOCKED policy)
- `src/data/default-prices.ts` — LOCKED file; re-export shim only, no direct edit
- `src/data/cito-migration-prices.ts` — LOCKED file; not in 27-04 scope
- `src/data/providers/dia.ts` / `jij.ts` / `saqi.ts` — no `unavailable`/`excludedModules` array pattern bestaat; cito-only = absence (geen PriceRecord added)
- Geen Zod module-ID enum aangetroffen in `schemas/` (step3-schema gebruikt `z.array(z.string())` zonder enum) — niets te updaten

## Decisions Made

Belangrijkste: zie `key-decisions` in frontmatter.

Meest consequentieel:
- **Model-shape gepreserveerd**: `ModuleDefinition` krijgt GEEN `levels` of `providerAvailability` field. Plan-frontmatter taal ("alle 5 VO-niveaus", "providerAvailability cito-only") is conceptueel — vertaald naar bestaand model als (a) niveau-onafhankelijkheid by absence + (b) `availableFrom: ['cito']`. Toevoegen zou breaking change zijn voor 10 bestaande modules en alle consumers (engines, ModuleCard rendering, etc.).
- **Minimale UI-tweak in WizardStep3** (CATEGORY_ORDER + 1 regel) — strikt genomen "UI-wijziging" die plan-tekst zegt te vermijden, maar SPEC R6 acceptance ("beide modules zichtbaar in WizardStep3") faalt zonder. Plan 27-06 doet de echte herstructurering (heading-split Basisvaardigheden/Extra Modules, presets, ModuleCard subcategorisatie).
- **Cito-only via absence-pattern**: DIA/JIJ/SAQI hebben geen `unavailable`/`excluded` arrays — ze listen alleen modules die ze daadwerkelijk aanbieden. Cito-only = simpelweg geen entry in dia/jij/saqi. Geen wijziging in die files nodig. Conform bestaand patroon.

## Deviations from Plan

### Auto-fixed Issues (Rule 1 — scope-related test fixes)

**1. [Rule 1 — Bug] `src/models/__tests__/modules.test.ts` verwacht 10 entries**
- **Found during:** Task 1 (vitest full-suite verificatie na catalog-uitbreiding)
- **Issue:** `it('has exactly 10 entries')` faalt omdat ik 2 modules heb toegevoegd.
- **Fix:** Update naar `12 entries` + expand `expectedIds` array met burgerschap + digitale-geletterdheid. Inline comment refereert Phase 27 R6.
- **Files modified:** `src/models/__tests__/modules.test.ts`
- **Commit:** `9ba4bd6`

**2. [Rule 1 — Bug] `migration-parity.test.ts` verwacht 20 price records**
- **Found during:** Task 1 (vitest full-suite verificatie)
- **Issue:** `it('has exactly 20 price records')` faalt omdat Cito provider config 2 nieuwe placeholder entries kreeg → DEFAULT_PRICES nu 22.
- **Fix:** Toegevoegd `phase27Prices` array + count update `20 → 22`. Test breidt out naar 22 expectations (incl. €0 voor beide nieuwe modules).
- **Files modified:** `src/data/providers/__tests__/migration-parity.test.ts`
- **Commit:** `9ba4bd6`

**3. [Rule 1 — Bug] `cito-module-grouping.test.ts` invariant "geen overige" faalt**
- **Found during:** Task 1 (vitest full-suite verificatie)
- **Issue:** Test verwacht dat alle Cito modules in CITO_CONFIG in een named sub-categorie vallen (taal-rekenen/zaakjes/executieve, NIET 'overige'). Mijn nieuwe modules vallen automatisch in 'overige' omdat ze in geen van de drie named sets zitten.
- **Root cause:** `cito-module-grouping.ts` heeft expliciet `'overige'` als catch-all "future-proofing" subcategory (zie comment in source). De test was overly strict.
- **Fix:** Test gesplitst in twee assertions: (a) baseline Cito modules NIET in 'overige' (regression guard voor bestaande 7 Cito modules), (b) Phase 27 R6 nieuwe modules WEL in 'overige' (catch-all by design, tot Plan 27-06 ze promoot naar dedicated subcategory). `getCitoModuleIdsForSubcategory` test update om `['burgerschap', 'digitale-geletterdheid']` te verwachten i.p.v. lege array.
- **Files modified:** `src/features/pricing/__tests__/cito-module-grouping.test.ts`
- **Commit:** `9ba4bd6`

### Rule 2 — Critical functionality auto-add

**4. [Rule 2 — UI-hook voor R6 acceptance] WizardStep3 CATEGORY_ORDER**
- **Found during:** Pre-commit analysis (plan-text says "GEEN UI-wijzigingen" maar `acceptance_criteria` zegt "beide modules zichtbaar in WizardStep3 voor alle niveaus")
- **Issue:** Met category `'extra-modules'` en hardcoded `CATEGORY_ORDER = ['leerlingvolgsysteem', 'overige-instrumenten']` zouden de nieuwe modules NIET gerenderd worden in WizardStep3. R6 acceptance ("beide modules zichtbaar") zou daarmee falen. Plan-tekst zegt zelf in `verification`: "open WizardStep3 → beide modules verschijnen onder Overig/Extra Modules (Plan 06 herstructureert visueel)" — dus ze MOETEN verschijnen.
- **Fix:** `CATEGORY_ORDER` uitgebreid naar `['leerlingvolgsysteem', 'overige-instrumenten', 'extra-modules']` — minimale 1-regel tweak met inline comment dat Plan 27-06 de feitelijke restructuring (heading-split / presets / layout) doet.
- **Files modified:** `src/features/school-profile/components/WizardStep3.tsx`
- **Commit:** `af48543`
- **Rationale:** Rule 2 (auto-add missing critical functionality voor correctheid van plan-goal). Plan 27-06 wijzigt category-rendering verder; deze tweak is forward-compatible (geen weggegooid werk).

### Plan-vs-reality clarifications (geen code-fixes)

**5. [Plan-text clarification] LOCKED files niet aangeraakt**
- Plan zegt: `src/data/default-prices.ts` is LOCKED en wijzigen vereist OK. Maar `default-prices.ts` is sinds een eerdere refactor een re-export shim — de echte data zit in `providers/cito.ts` (etc.). Mijn changes in `providers/cito.ts` voegen 2 entries toe; `default-prices.ts` re-exporteert die automatisch. Geen LOCKED file aangeraakt. Geen user-OK vereist.

**6. [Plan-text clarification] DIA/JIJ/SAQI provider files niet aangeraakt**
- Plan zegt: "Als ze `unavailable` of `excludedModules` arrays gebruiken: wel toevoegen". Inspectie toont: deze patroon bestaat niet in DIA/JIJ/SAQI files — ze listen alleen modules die ze aanbieden (absence-pattern). Cito-only voor mijn 2 modules = geen entries in andere providers. Conform.

**7. [Plan-text clarification] Zod module-ID enums niet aangetroffen**
- Plan zegt: "Als module-ID Zod enums bestaan in `src/features/school-profile/schemas/`: voeg toe". Inspectie: `step3-schema.ts` gebruikt `z.array(z.string())` zonder enum constraint. Geen enum bestaat. Skip stap 5 conform plan-instructie "Anders skip".

**Total deviations:** 4 (3× Rule 1 scope-related test fixes + 1× Rule 2 critical functionality)
**Impact on plan:** Alle `must_haves.truths` voldaan. Alle 3 `must_haves.artifacts` aangemaakt (modules.ts/cito.ts/differentiators.ts). Beide `key_links` actief: WizardStep3 importeert MODULE_CATALOG; ai-intake.ts fuzzy-matched de aliases (verificatie tests gepland in Plan 27-09/27-16).

## Issues Encountered

Geen blocking issues. Drie scope-related test-regressies waren voorspelbaar gevolg van het uitbreiden van MODULE_CATALOG (count-asserties) en pricing data (count-asserties + 'no overige' invariant). Allemaal auto-fixed in commit 2.

## Acceptance Criteria — verification

- [x] MODULE_CATALOG bevat 2 nieuwe entries (12 totaal) — `MODULE_CATALOG.toHaveLength(12)` groen
- [x] Beide modules op alle 5 niveaus — niveau-onafhankelijk model + geen niveau-filter in WizardStep3 ⇒ alle VMBO B/K/GT + HAVO + VWO automatisch
- [x] Provider-availability cito-only — `availableFrom: ['cito']` getest in `lists Cito as the only provider`
- [x] AI-intake aliases bevatten "AI-geletterdheid" + "burgerschapsonderwijs" — beide explicit getest
- [x] Differentiators entries aanwezig voor Plan 09 R9 rule-based lookup — getest via bestaande `differentiators.test.ts` "every MODULE_CATALOG entry has matching MODULE_DIFFERENTIATORS entry" (groen)
- [x] 'extra-modules' category toegevoegd aan ModuleCategory union + CATEGORY_LABELS — `MODULE_CATEGORIES['extra-modules']` === 'Extra Modules'
- [x] module-catalog tests groen (8 tests i.p.v. plan-voorspelde 6 — meer expliciete coverage)
- [x] npm run build slaagt zonder TS errors — 914ms, 66 PWA entries
- [x] GEEN cito-prijzen ingevoerd zonder user-OK — €0,00 placeholder + `source: 'manual'` + sourceLabel "Placeholder — owner vult in"

## Self-Check: PASSED

- Files modified existence verified via `git diff --stat`:
  - FOUND: src/models/modules.ts (modified)
  - FOUND: src/data/providers/cito.ts (modified)
  - FOUND: src/data/differentiators.ts (modified)
  - FOUND: src/features/school-profile/components/WizardStep3.tsx (modified)
  - FOUND: src/data/__tests__/module-catalog.test.ts (modified — scaffold replaced)
  - FOUND: src/models/__tests__/modules.test.ts (modified — count update)
  - FOUND: src/data/providers/__tests__/migration-parity.test.ts (modified — count update)
  - FOUND: src/features/pricing/__tests__/cito-module-grouping.test.ts (modified — invariant split)
- Commits exist:
  - FOUND: af48543 (feat(27-04): catalog + providers + differentiators + WizardStep3 hook)
  - FOUND: 9ba4bd6 (test(27-04): GREEN assertions + 3 dependent test fixes)
- Verification gates:
  - FOUND: `npm run build` exit 0 (914ms)
  - FOUND: `npx vitest run` exit 0 (980 passed / 51 todo / 8 skipped / 0 failed)

## User Setup Required

Geen externe configuratie nodig. Wel **nuttig voor publicatie** (niet blocking):
- Owner moet werkelijk Cito tarief voor Burgerschap en Digitale geletterdheid invoeren via `/prijzen` editor (UI uit Phase 26) zodra Cito ze publiceert. Placeholder €0,00 forceert zichtbaarheid in prijs-editor.

## Next Phase Readiness

- **Plan 27-06 (R7 WizardStep3 Basisvaardigheden vs Extra Modules)** kan landen: `MODULE_CATALOG` heeft 12 modules om te herstructureren; `'extra-modules'` categorie en CATEGORY_LABELS staan klaar; minimal CATEGORY_ORDER hook kan vervangen worden door de feitelijke Basisvaardigheden/Extra heading-split + presets
- **Plan 27-09 (R9 rule-based pijnpunt matching)** kan landen: MODULE_DIFFERENTIATORS bevat Cito-only voordelen voor burgerschap + digitale-geletterdheid (bv. "Inclusief AI-geletterdheid", "Aansluitend op SLO kerndoelen 2025-2026") — keyword-map kan deze koppelen aan pijnpunten zoals "missen burgerschap-rapport"
- **Plan 27-16 (R9 AI-laag)** kan landen: AI-intake aliases incl. "AI-geletterdheid", "burgerschapsonderwijs", "mediawijsheid" zijn beschikbaar voor fuzzy matching in `api/ai-match-pijnpunt.ts`
- **Owner-actie (asynchroon)**: invullen werkelijke Cito tarieven voor burgerschap + digitale-geletterdheid via prijs-editor — niet blocking voor andere Phase 27 plans, maar wel nodig vóór tool gebruikt wordt in echte klantgesprekken

---
*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Plan: 04*
*Completed: 2026-05-15*
