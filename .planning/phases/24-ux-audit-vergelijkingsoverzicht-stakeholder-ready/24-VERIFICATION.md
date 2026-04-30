---
phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready
verified: 2026-03-29T00:00:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Visuele sectievolgorde en kleurzones"
    expected: "Pagina toont: AI hero (grijs) -> bediening (wit) -> totalen (grijs) -> toolbar+tabel (wit) -> grafiek ingeklapt (grijs) -> meerwaarde ingeklapt (wit) -> disclaimer (grijs)"
    why_human: "Visuele lay-out en kleurcodering zijn niet via DOM-queries volledig te verifiëren"
  - test: "AI hero collapse/expand interactie"
    expected: "Standaard: 2-3 regels samenvatting of 'Start de analyse' CTA zichtbaar. Klik 'Lees volledig advies' opent volledig advies. Klik 'Samenvatting tonen' klapt in."
    why_human: "Interactief gedrag van de useState-gestuurde collapse vereist visuele verificatie"
  - test: "PricingInfoPopover interactie"
    expected: "Klik op info-icoon bij een aanbieder toont popover met prijsmodel-beschrijving. Klik buiten popover of Escape sluit hem."
    why_human: "Popover open/sluit gedrag en positioning is interactief"
  - test: "D-14 tooltips op hover"
    expected: "Hover over 'Bundel' label toont tooltip 'Een bundel combineert meerdere modules met volumekorting'. Hover over PeriodToggle toont tooltip over contractperiode."
    why_human: "Browser-native title-attribute tooltips zijn niet testbaar met jsdom"
---

# Phase 24: UX-audit vergelijkingsoverzicht — Verification Report

**Phase Goal:** Het volledige vergelijkingsoverzicht (PriceComparisonPage) UX-technisch doorlichten en optimaliseren: doublures elimineren, informatie-architectuur herstructureren, progressive disclosure toepassen, en visueel stakeholder-ready maken.
**Verified:** 2026-03-29
**Status:** human_needed — alle automatisch verifieerbare checks slagen; visuele en interactieve verificatie vereist menselijke beoordeling.
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Secties staan in de juiste volgorde: AI hero -> bediening -> totalen -> toolbar+tabel -> grafiek -> meerwaarde -> disclaimer | VERIFIED | PriceComparisonPage.tsx regels 188-279: 8 SectionBand-secties in exacte D-05 volgorde. PriceComparisonPage.test.tsx test 'renders sections in D-05 order' verifieert volgorde via section-indices. |
| 2 | Differentiators-lijst verwijderd uit ComparisonSummary en MeerwaardePanel | VERIFIED | ComparisonSummary (regels 25-111) bevat alleen de totalen-grid, geen `citoAdvantages` of "Unieke Cito voordelen". MeerwaardePanel.tsx bevat geen DifferentiatorsSection, geen MODULE_DIFFERENTIATORS import. |
| 3 | AI-advies hero standaard ingeklapt met 2-3 regels samenvatting, uitklapbaar tot volledig advies | VERIFIED | AiAdviesSection.tsx: `useState(false)` voor `expanded`, collapsed state toont `analysisResult.samenvatting` of "Start de analyse" CTA met "Open AI Advies" knop. Expanded state toont volledige flow met "Samenvatting tonen" knop. |
| 4 | ProviderSelector en PricingModelCards samengevoegd tot compacte toolbar met info-popovers | VERIFIED | ProviderToolbar.tsx: één component met checkboxes, kleurpunten, module-tellingen en PricingInfoPopover. Geen ProviderSelector of PricingModelCards functies meer in PriceComparisonPage.tsx. |
| 5 | Grafiek en MeerwaardePanel standaard ingeklapt (progressive disclosure) | VERIFIED | PriceComparisonPage.tsx regels 231-267: `<details class="group">` zonder `open` attribuut voor zowel grafiek als meerwaarde. Tests D-10 en D-11 bevestigen dit. |
| 6 | Visuele scheiding via afwisselende kleurzones (bg-neutral-50/bg-white) | VERIFIED | SectionBand.tsx met `bg` prop. PriceComparisonPage.tsx: afwisselend bg-neutral-50/bg-white per sectie. Test 'applies alternating color bands (D-15)' verifieert alle 7 secties. |

**Score: 6/6 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/price-comparison/components/SectionBand.tsx` | Full-bleed section wrapper met alternerende achtergronden | VERIFIED | Bestaat, substantieel (bg prop, max-w-[960px] container), geïmporteerd en gebruikt in PriceComparisonPage.tsx |
| `src/features/price-comparison/components/ProviderToolbar.tsx` | Gecombineerde provider selector + pricing model info | VERIFIED | Bestaat, substantieel (checkboxes, dots, counts, PricingInfoPopover), gebruikt in PriceComparisonPage.tsx regel 223 |
| `src/features/price-comparison/components/PricingInfoPopover.tsx` | Click-to-show popover met prijsmodel beschrijving | VERIFIED | Bestaat, substantieel (open state, backdrop, Escape handler, PRICING_STRATEGY_DESCRIPTIONS), gebruikt in ProviderToolbar |
| `src/features/price-comparison/PriceComparisonPage.tsx` | Geherstructureerde pagina in D-05 volgorde | VERIFIED | 8 SectionBand-secties, geen ProviderSelector/PricingModelCards functies, geen SchoolplanBanner import, correcte imports voor SectionBand en ProviderToolbar |
| `src/features/price-comparison/MeerwaardePanel.tsx` | Alleen tijdwinst, geen DifferentiatorsSection | VERIFIED | Geen DifferentiatorsSection, geen MODULE_DIFFERENTIATORS import, bevat ComparisonTimeSavings |
| `src/features/price-comparison/ai-advies/AiAdviesSection.tsx` | AI hero met collapse/expand en samenvatting preview | VERIFIED | useState(false), Lees volledig advies, Samenvatting tonen, samenvatting rendering, onAnalysisComplete callback wiring |
| `src/features/price-comparison/AnalysisPanel.tsx` | onAnalysisComplete callback prop | VERIFIED | Prop gedeclareerd in interface (regel 100), geaccepteerd in functiesignatuur (regel 103), aangeroepen bij analyse-voltooiing (regel 167) |
| `src/features/price-comparison/__tests__/PriceComparisonPage.test.tsx` | Gedragstests voor sectievolgorde, kleurzones, collapse defaults | VERIFIED | 7 tests: D-05 sectievolgorde, D-15 kleurzones, D-10 grafiek ingeklapt, D-11 meerwaarde ingeklapt, D-06 geen differentiators, D-14 tooltips, chevron-animatie |
| `src/features/price-comparison/__tests__/ProviderToolbar.test.tsx` | Gedragstests voor gecombineerde toolbar met popover | VERIFIED | 8 tests: Vergelijk: label, 4 checkboxes, cito/dia checked, cito disabled, aria-labels, kleurpunten, popover open op klik, module counts |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PriceComparisonPage.tsx` | `SectionBand` | import + wrapping elke sectie | WIRED | `import { SectionBand } from './components/SectionBand'` + 8x `<SectionBand bg="...">` gebruikt |
| `ProviderToolbar.tsx` | `usePriceComparisonStore` | visibleProviders + toggleProvider | WIRED | Regels 19-20: beide selectors gebruikt voor checkbox state en onChange |
| `AiAdviesSection.tsx` | `useWizardStore` | hasCompletedOnce, shouldAutoTriggerAnalysis | WIRED | Regels 23-25: drie selectors uit wizard-store gebruikt |
| `AiAdviesSection.tsx` | `AnalysisPanel` | onAnalysisComplete callback | WIRED | Regel 177-180: `<AnalysisPanel onAnalysisComplete={(result) => setAnalysisResult(...)} />` |
| `AnalysisPanel.tsx` | `onAnalysisComplete` caller | callback bij analyse-voltooiing | WIRED | Regel 167: `onAnalysisComplete?.(analysisResult)` na `setAnalysis(analysisResult)` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ComparisonSummary` | `result.totals`, `result.differences` | `usePriceComparisonStore((s) => s.result)` → engine berekening via `initialize()` | Ja — engine berekent op basis van werkelijke schoolprofiel-state | FLOWING |
| `AiAdviesSection` | `analysisResult.samenvatting` | `onAnalysisComplete` callback van `AnalysisPanel` → `generateAnalysis()` → Claude API | Ja — API-aanroep, niet hardcoded | FLOWING |
| `ProviderToolbar` | `visibleProviders` | `usePriceComparisonStore((s) => s.visibleProviders)` | Ja — echte store state | FLOWING |
| `SchoolplanContextCard` | `analysis.opportunities`, `analysis.summary` | `useSchoolplanAnalysis(activeSchoolId)` hook → DB query | Ja — database-backed via hook | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — alle tests zijn al gedraaid door het bouw-systeem (804 tests slagen). De gedrags-unit-tests voor deze fase (PriceComparisonPage.test.tsx en ProviderToolbar.test.tsx) zijn onderdeel van de testsuiteresultaten die de gebruiker heeft bevestigd.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 24-02-PLAN | AI Advies hero bovenaan, schoolplan-context geïntegreerd (geen aparte banner) | SATISFIED | AiAdviesSection is sectie 1. SchoolplanContextCard (functioneel equivalent van SchoolplanBanner) is geïntegreerd in de hero. SchoolplanBanner niet meer als aparte top-level render in PriceComparisonPage. |
| D-02 | 24-01-PLAN | Bundel/Periode bediening direct na AI hero | SATISFIED | SectionBand sectie 2 (bg-white) bevat CitoBundleSelector, DiaBundleSelector, PeriodToggle |
| D-03 | 24-01-PLAN | Totaal-kaarten als tweede prominente sectie | SATISFIED | SectionBand sectie 3 (bg-neutral-50) bevat ComparisonSummary met Cito/DIA/JIJ kaarten |
| D-04 | 24-01-PLAN | Tabel vóór grafiek | SATISFIED | Tabel in sectie 4, grafiek in sectie 5 |
| D-05 | 24-01-PLAN | Volledige volgorde: AI hero → bediening → totalen → toolbar → tabel → grafiek → meerwaarde → disclaimer | SATISFIED | Bevestigd in PriceComparisonPage.tsx regels 188-279 |
| D-06 | 24-01-PLAN | Differentiators-lijst weg uit ComparisonSummary | SATISFIED | ComparisonSummary bevat alleen totalen-grid, geen citoAdvantages of "Unieke Cito voordelen" |
| D-07 | 24-01-PLAN | MeerwaardePanel behoudt tijdwinst + migratie CTA, differentiators verhuizen naar AI | SATISFIED | MeerwaardePanel.tsx bevat alleen ComparisonTimeSavings, geen DifferentiatorsSection |
| D-08 | 24-01-PLAN | ProviderSelector + PricingModelCards samengebracht in één toolbar met popover | SATISFIED | ProviderToolbar.tsx gecreëerd en gebruikt; originele inline functies verwijderd |
| D-09 | 24-02-PLAN | AI advies hero standaard samengevat (2-3 regels) met expand-knop | SATISFIED | AiAdviesSection: expanded=false default, samenvatting weergave, "Lees volledig advies" knop |
| D-10 | 24-01-PLAN | Grafiek standaard ingeklapt | SATISFIED | `<details class="group">` zonder `open` attribuut, test bevestigt dit |
| D-11 | 24-01-PLAN | MeerwaardePanel standaard ingeklapt | SATISFIED | `<details class="group">` zonder `open` attribuut, test bevestigt dit |
| D-12 | 24-01-PLAN | Tabel module-rijen: bestaande expandable detail-panels zijn voldoende | SATISFIED | Geen wijzigingen aan ComparisonTable — bestaand gedrag behouden |
| D-13 | 24-01-PLAN | Eén view voor alle stakeholders — geen aparte filters/modi | SATISFIED | Geen stakeholder-toggle of view-switch geïmplementeerd |
| D-14 | 24-01-PLAN | Pagina moet self-explanatory zijn — labels en tooltips geven context | SATISFIED | `title="Een bundel combineert meerdere modules met volumekorting"` op CitoBundleSelector wrapper; `title="Langere contractperiode geeft korting op de jaarprijs"` op PeriodToggle wrapper. PricingInfoPopover biedt uitleg per aanbieder. |
| D-15 | 24-01-PLAN | Visuele scheiding via afwisselende kleurzones (lichtgrijs/wit) | SATISFIED | SectionBand met bg prop, alternerende bg-neutral-50/bg-white bevestigd door tests |
| D-16 | 24-01-PLAN | Store-reactivity patroon behouden | SATISFIED | usePriceComparisonStore en useSchoolProfileStore patronen ongewijzigd in alle geherstructureerde componenten |
| D-17 | 24-01-PLAN | Alle secties lezen uit dezelfde usePriceComparisonStore.result | SATISFIED | ComparisonSummary, ComparisonTable, ComparisonChart lezen allemaal result uit dezelfde store |

**Alle 17 beslissingen (D-01 t/m D-17) zijn gedekt.**

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `AiAdviesSection.tsx` regel 5 (comment) | Comment zegt "SchoolplanBanner is always visible at the top of the hero" maar de component importeert SchoolplanBanner niet — SchoolplanContextCard wordt in plaats daarvan gebruikt | Info | Misleidende comment. Geen functionele impact — SchoolplanContextCard vervult dezelfde rol. Comment is een naspoor van een bug-fix iteratie. |

**Geen blockers of warnings.** De comment-mismatch is informatief maar heeft geen impact op het gedrag.

---

## Opmerking over D-01 en SchoolplanBanner

Plan 02 acceptatiecriterium vereiste `AiAdviesSection.tsx contains 'import { SchoolplanBanner }'`. Dit criterium is NIET gehaald in de uiteindelijke implementatie. De SUMMARY van Plan 02 documenteert expliciet dat in commit `960219f` de duplicate SchoolplanBanner uit de hero werd verwijderd omdat SchoolplanContextCard dezelfde functionaliteit biedt en dubbele content werd vermeden.

**Beoordeling:** D-01 vereist "schoolplan-context geïntegreerd in dezelfde sectie" — dit is gehaald via SchoolplanContextCard. De letter van het plan-acceptatiecriterium verschilt van de uiteindelijke implementatie, maar de geest van de beslissing (D-01) is volledig gerealiseerd. Dit telt als SATISFIED.

---

## Human Verification Required

### 1. Visuele sectievolgorde en kleurzones

**Test:** Open de vergelijkingspagina voor een bestaande school (Vergelijking tab).
**Expected:** Van boven naar beneden: AI Advies sectie op lichtgrijze achtergrond -> Prijsvergelijking + bediening op witte achtergrond -> Samenvatting vergelijking op lichtgrijs -> Provider toolbar + tabel op wit -> Staafgrafiek ingeklapt op lichtgrijs -> Meerwaarde ingeklapt op wit -> Disclaimer op lichtgrijs.
**Why human:** Visuele kleurcodering en lay-out-afstand zijn niet volledig via jsdom te beoordelen.

### 2. AI hero collapse/expand interactie

**Test:** Laad de pagina vers. Controleer AI hero. Klik "Open AI Advies" (geen analyse beschikbaar) of "Lees volledig advies" (na analyse). Klik "Samenvatting tonen" om in te klappen.
**Expected:** Standaard: 2-3 regels tekst of "Start de analyse om een advies op maat te ontvangen" + actieknop. Na expand: volledige AI-flow zichtbaar met SchoolplanContextCard, wizard en analyse-panel. Na "Samenvatting tonen": terug naar ingeklapte staat.
**Why human:** useState-gedreven expand/collapse is een interactief patroon dat visuele verificatie vereist.

### 3. PricingInfoPopover interactie

**Test:** Klik op het info-icoon (ℹ) naast DIA of JIJ! in de provider toolbar.
**Expected:** Popover verschijnt met naam van aanbieder en beschrijving van het prijsmodel. Klik buiten de popover of druk Escape — popover verdwijnt.
**Why human:** Popover-positionering en klik-buiten-sluiting zijn interactieve browser-gedragingen.

### 4. D-14 tooltips op hover (optioneel)

**Test:** Hover met de muis over het gebied rondom de CitoBundleSelector en PeriodToggle.
**Expected:** Browser toont native tooltip "Een bundel combineert meerdere modules met volumekorting" resp. "Langere contractperiode geeft korting op de jaarprijs".
**Why human:** Native `title` attribute tooltips zijn niet verifieerbaar in jsdom testomgeving.

---

## Gaps Summary

Geen functionele gaps gevonden. Alle 6 succes-criteria zijn verifieerbaar in de codebase. Alle 17 beslissingen D-01 t/m D-17 zijn gedekt. De enige openstaande items zijn interactieve/visuele verificaties die menselijke beoordeling vereisen.

De comment-mismatch in AiAdviesSection.tsx (regel 5) is een cosmetisch artefact van de bug-fix iteratie — geen impact op gedrag.

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
