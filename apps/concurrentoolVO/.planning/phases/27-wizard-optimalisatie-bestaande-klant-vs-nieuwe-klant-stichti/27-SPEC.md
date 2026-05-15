# Phase 27: Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag — Specification

**Created:** 2026-05-14
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 11 locked

## Goal

Sales-accountmanagers kunnen onderscheid maken tussen bestaande Cito-klanten en nieuwe prospects, scholen groeperen onder een Stichting (bestuur), concurrent-pijnpunten omzetten naar Cito-voordelen, en Cito Basis vs Cito Plus vergelijken — met `cito-oud` volledig uit het systeem omdat de huidige prijsstructuur per volgend schooljaar niet meer geldt.

## Background

De 5-stappen wizard (`Niveaus → Leerlingen → Modules → Situatie → Doel`) in `apps/concurrentoolVO/` is functioneel compleet (Phase 999.1, 10.3, 16, 17 — SHIPPED) maar mist:

1. Geen **Stichting/bestuur**-entiteit — sales kan niet op bestuursniveau plannen of rapporteren.
2. Geen **schoolsoort-varianten** (Dakpanklas, Daltonschool, regulier) — alleen niveaus (VMBO B/K/GT, HAVO, VWO).
3. Geen **groei-trajectorie** (groei / krimp / loting met mogelijke daling).
4. Geen **klant-type vinkje** (bestaande Cito-klant vs nieuwe prospect) — moet nu afgeleid worden uit moduleSetups.
5. Geen **opmerkingen/pijnpunt-veld** in Stap 4 — concurrent-pijnpunten kunnen niet vastgelegd of gematcht worden aan Cito-voordelen.
6. Geen **tijdscomponent voor concurrent-rapportages** in TimeSavingsSection-patroon.
7. **Burgerschap + Digitale geletterdheid** ontbreken in module-catalogus (wettelijk verplicht in VO per nieuwe SLO kerndoelen 2025-2026, definitief 1-8-2027).
8. **Scenario's A/B/C** in Stap 5 zijn gebouwd op `cito-oud` als bestaande situatie — dit concept verdwijnt per volgend schooljaar omdat Cito Basis/Plus de nieuwe contractstructuur worden.
9. Geen **Upsell-scenario** (Cito Basis vs Cito Plus).

Huidige codebase-staat:
- Wizard-componenten: `src/features/school-profile/components/WizardStep{1..5}.tsx`
- Store: `useSchoolProfileStore` (Zustand + persist + Dexie sync)
- Module-catalogus locatie: `src/models/` + `src/data/`
- Engines (pure functions): `src/engine/price-comparison.ts`, `current-vs-proposed.ts`, `migration.ts`
- AI intake: `src/lib/ai-intake.ts` (claude-haiku-4-5 via `api/ai-intake.ts`)
- `cito-oud` provider in `src/data/default-prices.ts` (LOCKED file — wijzigen vereist expliciete goedkeuring)
- Hardcoded `TOTAL_STEPS = 5` in `WizardShell`
- 3 hardcoded providers: `cito`, `dia`, `jij` (raakt meerdere bestanden bij wijziging)

## Requirements

### R1 — Stichting-entiteit
**Stichting (bestuur) is een eerste-klas entiteit naast School op het startscherm.**
- Current: Geen Stichting-concept bestaat — alleen losse SchoolRecords in Dexie/Supabase.
- Target: `StichtingRecord` model met `id`, `name`, `region`, gekoppelde `schoolIds[]`. Eigen route `/stichtingen` met overzicht + create/edit/delete. Per gekoppelde school markering: `usage_mix: 'cito-only' | 'concurrent-only' | 'mixed'`.
- Acceptance: Stichting aanmaken met 3 scholen, naam wijzigen, school toevoegen/loskoppelen, stichting verwijderen (cascade NIET — scholen blijven bestaan zonder stichting). Vitest unit tests + Playwright e2e voor stichting-CRUD flow.

### R2 — Stichting bulk-export
**Sales kan op stichtingsniveau een rapport exporteren.**
- Current: Alleen per-school PDF-export bestaat (`@react-pdf/renderer` in Phase 12).
- Target: (a) CSV-export met alle gekoppelde scholen + hun core data (naam, niveaus, klant-type, modules-mix, pipeline-status). (b) PDF-aggregatie op stichtingsniveau: dezelfde DMU-templates (coordinator/MT/finance) maar met aggregatie over scholen heen (totaal-tijdwinst, totaal-financieel, scholen-tabel).
- Acceptance: Stichting met 3 scholen produceert geldige CSV (parseerbaar door `papaparse`) en valide PDF (rendered zonder errors, bevat alle 3 scholen in aggregatie-tabel).

### R3 — Bestaande klant vinkje in Stap 1
**WizardStep1 vraagt expliciet of dit een huidige Cito-klant is.**
- Current: Geen veld. Klant-type wordt afgeleid uit moduleSetups (alle providers = cito-oud → impliciet bestaande klant).
- Target: Radio-vraag in WizardStep1: `customerType: 'huidige-cito' | 'nieuwe-prospect' | 'gedeeltelijk'`. Persist in SchoolRecord. Stuurt downstream scenario-keuze in Stap 5.
- Acceptance: Vinkje verschijnt onder schoolnaam + niveaus. Selectie persisteert in Dexie. Verificatie via WizardStep1 unit test + e2e wizard-flow.

### R4 — Schoolsoort + groei-trajectorie in Stap 1
**WizardStep1 capteert schoolsoort en groei-trajectorie.**
- Current: Alleen `levels[]` (VMBO B/K/GT/HAVO/VWO).
- Target: (a) `schoolType: 'regulier' | 'dakpanklas' | 'dalton' | 'montessori' | 'vrije-school' | 'overig'` als select. (b) `growthTrajectory: 'groei' | 'krimp' | 'stabiel' | 'loting'` als radio. (c) Optioneel veld `customSchoolType: string` als schoolType='overig'.
- Acceptance: Beide velden zichtbaar onder bestaande niveaus-checkboxen. Validatie via Zod schema. Persistent in SchoolRecord. WizardStep1 test dekt beide velden.

### R5 — Huidig-gebruik per niveau in Stap 2
**WizardStep2 capteert per niveau welk pakket de school nu gebruikt.**
- Current: Alleen `studentCounts[level][year]` matrix.
- Target: Onder de student-counts-matrix een tweede sectie: per niveau een mini-radio `currentToolUsage: 'cito' | 'dia' | 'jij' | 'mix' | 'geen'`. Aggregatie hiervan wordt gebruikt voor klant-type-suggestie + Stichting-mix-indicator.
- Acceptance: Per niveau radio-keuze persisteert. Aggregatie op Stichting-overzicht toont mix correct (3 scholen × 5 niveaus = 15 keuzes opgeteld).

### R6 — Module-catalogus uitbreiding (Burgerschap + Digitale geletterdheid)
**Module-catalogus bevat de twee wettelijk verplichte VO-vakken.**
- Current: 10 modules in 2 categorieën (LVS: Reken-Wiskunde, Nederlands, Engels; Overig: Taalverzorging, Sociaal-emotioneel, Cognitieve capaciteiten, Leer-werkhouding, Frans, Duits, Spaans).
- Target: 2 nieuwe modules toevoegen onder een nieuwe categorie **"Extra Modules"** (of bij bestaande "Overig"): `burgerschap`, `digitale-geletterdheid`. Beide beschikbaar voor alle niveaus (VMBO B/K/GT, HAVO, VWO) per SLO kerndoelen. ModuleDefinition met label, aliases voor AI-intake fuzzy matching, provider-availability (initieel `cito: true, dia: false, jij: false` — schijnvoordeel pattern).
- Acceptance: Beide modules zichtbaar in WizardStep3 voor alle niveaus. Toggle-state persisteert in `selectedModules`. AI-intake herkent aliases ("burgerschapsonderwijs", "digitale vaardigheden", "AI-geletterdheid").

### R7 — WizardStep3 herstructurering Basis vs Extra
**Module-keuze toont expliciete splitsing Basisvaardigheden vs Extra Modules.**
- Current: 2 categorieën (LVS: 3 modules; Overig: 7 modules). LVS-presets: Basis (3 core), Compleet, Alles.
- Target: Twee duidelijk gescheiden secties: **Basisvaardigheden** (Reken-Wiskunde, Nederlands, Engels — elk optioneel met individuele toggles) en **Extra Modules** (Taalverzorging, Sociaal-emotioneel, Burgerschap, Digitale geletterdheid + behouden vakken Frans/Duits/Spaans/Cognitieve cap/Leer-werkhouding indien gewenst). Presets blijven werken maar mappen naar nieuwe categorieën.
- Acceptance: WizardStep3 toont twee secties met heading. Bestaande presets functioneren. Snapshot-test bevestigt layout. Module-toggling werkt onafhankelijk per sectie.

### R8 — Stap 4: dubbel-check + opmerkingen-veld + tijdscomponent
**WizardStep4 capteert vrije pijnpunten en concurrent-rapportage-tijd, en toont een dubbel-check-summary van Stap 1-3.**
- Current: Per geselecteerde module: provider + prijs + custom-provider-naam. Geen vrije tekst, geen tijd-veld, geen summary.
- Target: (a) Bovenaan een **summary-blok** dat school-naam, niveaus, schoolsoort, groei-trajectorie, klant-type, en modules-overzicht toont (read-only met "Wijzig"-link terug naar betreffende stap). (b) **Opmerkingen-veld** (textarea, max 1000 chars): "Wat zijn pijnpunten bij het huidige pakket?". (c) **Tijd-sectie** in TimeSavingsSection-patroon: per taak-type (rechten, resetten, inloggen, planning, koppeling, rapporten-lezen) een number-input voor "minuten/week bezig met concurrent". Engine berekent Cito-tijdwinst (Cito-baseline minus concurrent-tijd).
- Acceptance: Alle 3 secties zichtbaar. Summary update reactief bij wijzigingen in vorige stappen. Opmerkingen + tijd persisteren in SchoolRecord (`competitorRemarks: string`, `competitorTimeMinutes: Record<TaskType, number>`). Tests: WizardStep4 component test + engine-test op tijdwinst-berekening.

### R9 — AI/rule-based pijnpunt → Cito-voordeel matching
**Pijnpunten uit opmerkingen-veld worden gematcht aan Cito-voordelen via AI met rule-based fallback.**
- Current: Geen pijnpunt-extractie. Engine kent wel `differentiators` per module/provider (Phase 10/16 advantages-list).
- Target: (a) Bij verlaten van opmerkingen-veld (onBlur) → call naar `/api/ai-match-pijnpunt` (nieuwe serverless function, claude-haiku-4-5, structured output via Zod schema `{ painPoints: string[], matchedAdvantages: { module: string, advantage: string }[] }`). (b) Server-side rule-based keyword-lookup als AI niet beschikbaar of timeout: keyword-map (`'onduidelijk' → ['rapportage-helder', 'visualisatie']`) tegen bestaande `differentiators`-data. (c) UI toont onder opmerkingen-veld lijst van matched Cito-voordelen met module-context. (d) Feedback-loop: user kan match thumb-up/down — feedback persisteert in `painPointMatchFeedback: { painPoint: string, advantage: string, vote: 'up'|'down', timestamp }`.
- Acceptance: 5 test-pijnpunten ("rapportages zijn onduidelijk", "te traag", "te duur", "missen burgerschap-rapport", "support reageert niet") produceren elk minstens 1 relevant Cito-voordeel via AI én via rule-based fallback. Feedback persisteert. Test met AI mock + integration test op rule-based pad.

### R10 — Stap 5 scenario-herstructurering (Cito-huidig eruit)
**Scenario-keuze wordt Basis/Plus/Upsell — bestaande scenario B (migratie) en C (huidig Cito vs concurrent) worden verwijderd.**
- Current: Stap 5 toont 3 scenario's: A (Cito vs concurrent), B (migratie huidig → nieuw Cito-platform), C (huidig Cito vs concurrent — Phase 17). Engine `migration.ts` + `current-vs-proposed.ts` ondersteunen B en C. `cito-oud` provider in `default-prices.ts`.
- Target: Stap 5 toont nieuwe scenario's: (A) **Cito Basis vs concurrent**, (B) **Cito Plus vs concurrent**, (C) **Upsell: Cito Basis → Cito Plus** (alleen zichtbaar als klant-type ≠ 'nieuwe-prospect'). Engines: `migration.ts` verwijderd; `current-vs-proposed.ts` verwijderd; `price-comparison.ts` uitgebreid met `bundle: 'basis' | 'plus'` parameter en `calculateUpsell()` functie. `cito-oud` provider verwijderd uit `default-prices.ts` (LOCKED file — vereist expliciete goedkeuring tijdens PLAN-fase).
- Acceptance: WizardStep5 toont 2-3 scenario's afhankelijk van klant-type. Snapshot-test op Upsell-engine (Basis vs Plus delta met bekende prijzen). Bestaande routes naar `migration`/`current-vs-proposed` views verwijderd of redirect naar comparison. Geen `cito-oud` referenties meer in `git grep cito-oud`.

### R11 — Bulk-migratie bestaande scholen naar Stichting
**Bestaande SchoolRecords (zonder stichting) kunnen via een bulk-tool aan een Stichting gekoppeld worden.**
- Current: Geen migratie-tool. Bestaande scholen hebben geen `stichtingId` veld.
- Target: SchoolRecord schema krijgt optioneel `stichtingId: string | null` (default null). Stichting-overzicht heeft "Scholen koppelen" actie → multi-select dialog met alle ongekoppelde scholen → bulk-koppel-actie. Dexie + Supabase migratie schrijft `stichtingId` ALTER TABLE met default null voor bestaande rows.
- Acceptance: 10 bestaande scholen na migratie zichtbaar als ongekoppeld. Multi-select 3 scholen + bulk-koppel → `stichtingId` gevuld voor 3 scholen, andere 7 nog null. Reverse (loskoppelen) werkt ook. Dexie migration-test + Supabase migration smoke-test.

## Boundaries

**In scope (alle 11 requirements + extras):**
- Stichting-entiteit + CRUD + bulk-export CSV + DMU-PDF-aggregatie op stichtingsniveau (R1, R2)
- Wizard Step 1: klant-vinkje, schoolsoort, groei-trajectorie (R3, R4)
- Wizard Step 2: huidig-gebruik per niveau (R5)
- Wizard Step 3: Basis/Extra herstructurering + Burgerschap + Digitale geletterdheid modules (R6, R7)
- Wizard Step 4: dubbel-check summary + opmerkingen + concurrent-tijd per taak (R8)
- AI pijnpunt-matching + rule-based fallback + feedback-loop (R9)
- Stap 5: Basis/Plus/Upsell scenario's, `cito-oud` + `migration` + `current-vs-proposed` engines verwijderd (R10)
- Bulk-migratie bestaande scholen naar stichting (R11)
- Concurrent-tijd-benchmarking aggregatie op stichtingsniveau (afgeleid van R2 + R8)
- Vitest unit/integration tests + Playwright e2e voor critical paths
- Cito-huisstijl + Nederlandse UI-tekst behouden

**Out of scope (expliciet uitgesloten):**
- **Nieuwe Cito Basis/Plus prijsdata correctheid** — placeholder-prijzen blijven in `cito-migration-prices.ts` tot Cito officiële tarieven aanlevert. Phase 27 wijzigt geen tarieven, alleen structuur. Reden: data-correctheid is owner-verantwoordelijkheid (LOCKED file).
- **Vierde provider (naast cito/dia/jij)** — drie providers blijven hardcoded. Reden: raakt te veel bestanden, eigen phase waard.
- **Migratie-pad voor scholen die op Cito-oud zaten** — we verwijderen `cito-oud` zonder data-migratie-flow voor klanten die nog op oud-platform zitten. Reden: per volgend schooljaar zit niemand meer op cito-oud volgens user.
- **Push-notificaties voor stichting-updates / collaborative editing** — single-user pattern blijft. Reden: complexiteit, geen sales-need.
- **Externe CRM-integratie (Salesforce/HubSpot)** — Dexie+Supabase blijft enige opslag. Reden: scope-grens, separate backlog.
- **Schoolsoort-specifieke prijslogica** — Dakpanklas/Dalton/etc. zijn metadata, beïnvloeden geen berekeningen in deze phase. Reden: prijzen zijn niveau-gebaseerd, schoolsoort is sales-context.
- **Roll-out training voor Cito-sales-team** — tool-build only. Reden: niet-technisch werk.

## Constraints

- **LOCKED files**: `src/data/default-prices.ts` en `src/data/cito-migration-prices.ts` — wijzigingen vereisen expliciete goedkeuring per CLAUDE.md app-rule. Phase 27 wijzigt `default-prices.ts` voor R10 (verwijdering `cito-oud`) — goedkeuring opnemen in PLAN-fase.
- **`TOTAL_STEPS = 5`** in WizardShell blijft 5. Stichting is GEEN extra wizard-stap (R1: aparte route).
- **3 hardcoded providers** blijven (`cito`, `dia`, `jij`). Geen 4e provider in scope.
- **Pure-function engines** moeten pure blijven (`src/engine/*`). Nieuwe `calculateUpsell()` volgt zelfde pattern.
- **Zustand `getState()`-pattern** voor cross-store-reads (geen hooks-based refactor).
- **Alle UI-tekst Nederlands**, alle code Engels.
- **TanStack Router** voor nieuwe `/stichtingen`-route, consistent met Phase 8-19 patroon.
- **Zod schemas** voor alle nieuwe form fields, in `src/features/school-profile/schemas/` + nieuwe `src/features/stichtingen/schemas/`.
- **AI calls** server-side via Vercel Functions in `api/`, met `ANTHROPIC_API_KEY` server-only (geen `VITE_` prefix).
- **Performance**: Stichting-overzicht met 50+ scholen moet < 500ms renderen (vergelijkbaar met SchoolOverview Phase 7-benchmark).
- **Dexie migration** moet idempotent zijn (kan meermaals draaien zonder corruptie).

## Acceptance Criteria

- [ ] **R1**: Stichting CRUD werkt via `/stichtingen`-route; aanmaken/wijzigen/verwijderen + scholen koppelen/loskoppelen geverifieerd via Vitest unit tests + Playwright e2e flow.
- [ ] **R2**: Stichting met 3 scholen exporteert geldige CSV (papaparse-parseerbaar) én valide PDF (renders zonder errors, bevat aggregatie-tabel).
- [ ] **R3**: `customerType` vinkje aanwezig in WizardStep1; selectie persisteert in Dexie + Supabase; WizardStep1 unit test dekt alle 3 opties.
- [ ] **R4**: `schoolType` + `growthTrajectory` velden aanwezig en gevalideerd via Zod; persistent; getest.
- [ ] **R5**: Per niveau `currentToolUsage` keuze persisteert; aggregatie op Stichting-overzicht klopt voor 3 scholen × 5 niveaus.
- [ ] **R6**: `burgerschap` + `digitale-geletterdheid` modules zichtbaar in WizardStep3 voor alle niveaus; AI-intake matched aliases ("burgerschapsonderwijs", "AI-geletterdheid").
- [ ] **R7**: WizardStep3 toont expliciete "Basisvaardigheden" + "Extra Modules" headings; presets functioneren; snapshot-test groen.
- [ ] **R8**: WizardStep4 toont summary + opmerkingen + tijd-sectie; alle 3 persisteren; engine-test op tijdwinst correct.
- [ ] **R9**: 5 test-pijnpunten produceren elk ≥1 Cito-voordeel via AI én rule-based; feedback persisteert.
- [ ] **R10**: WizardStep5 toont Basis/Plus/Upsell scenario's; `git grep -i cito-oud src/` levert 0 hits; `git grep migration\\.ts src/engine/` levert 0 hits; Upsell-engine snapshot-test groen.
- [ ] **R11**: Dexie migration draait clean op bestaande 10 scholen; bulk-koppel-flow werkt; loskoppel-flow werkt; Supabase migration smoke-test groen.
- [ ] `npm run build` slaagt zonder TS errors.
- [ ] `npx vitest run` slaagt: alle bestaande + nieuwe tests groen, coverage ≥ baseline (27/18/25/27 per Phase 22).
- [ ] `npx playwright test` slaagt voor nieuwe stichting-e2e + bestaande wizard-e2e.
- [ ] Handmatige UAT-walkthrough afgevinkt door gebruiker: stichting aanmaken → 3 scholen → wizard per school → pijnpunt-match → Upsell-scenario → bulk-export.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                            |
|--------------------|-------|------|--------|------------------------------------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | 11 expliciete requirements met Current/Target/Acceptance         |
| Boundary Clarity   | 0.75  | 0.70 | ✓      | 7 expliciete out-of-scope items; Cito-oud-verwijdering vastgelegd |
| Constraint Clarity | 0.85  | 0.65 | ✓      | LOCKED files, hardcoded providers, pure engines, Zustand-pattern  |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 11 R-checks + 4 build/test/UAT-checks = 15 pass/fail criteria     |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      | Gate passed na 4 rounds                                          |

## Interview Log

| Round | Perspective    | Question summary                                  | Decision locked                                                       |
|-------|----------------|---------------------------------------------------|-----------------------------------------------------------------------|
| 1     | Researcher     | Stichting plek (UI)                               | Eigen entiteit op startscherm, eigen route `/stichtingen`             |
| 1     | Researcher     | Klant-type detectie                               | Expliciet vinkje in WizardStep1                                       |
| 1     | Researcher     | Burgerschap + Digi-gel niveau-afhankelijkheid     | Web-research: alle niveaus per SLO kerndoelen 2025-2026               |
| 2     | Simplifier     | Stichting MVP scope                               | Volle suite: CRUD + scholen koppelen + bulk-CSV + PDF-aggregatie      |
| 2     | Simplifier     | Pijnpunt-matching aanpak                          | AI (claude-haiku-4-5) + rule-based fallback                            |
| 2     | Simplifier     | Tijd-granulariteit                                | Per taak-type (TimeSavingsSection-patroon hergebruiken)               |
| 3     | Boundary Keeper| Upsell-scenario plek                              | Cito-huidig wordt uitgefaseerd — scenario's worden Basis/Plus/Upsell  |
| 3     | Boundary Keeper| Out-of-scope confirmatie                          | Alles in Phase 27 (grote phase geaccepteerd) — alleen 7 expliciete excludes |
| 3     | Boundary Keeper| Acceptatie-criteria                               | 4 cruciale: Stichting CRUD, wizard-velden persist, AI matching, Upsell+modules |
| 4     | Failure Analyst| Cito-huidig uitfaseren bevestiging                | Vervang scenario B+C door Basis/Plus/Upsell in deze phase             |
| 4     | Failure Analyst| Out-of-scope confirmatie                          | Bevestigd: alles in 27, geen splitsing                                |

---

*Phase: 27-wizard-optimalisatie-bestaande-klant-vs-nieuwe-klant-stichti*
*Spec created: 2026-05-14*
*Next step: /gsd-discuss-phase 27 — implementation decisions (HOE bouwen we wat hier gespecificeerd is)*
