---
phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie
verified: 2026-03-25T11:35:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Volledige 3-staps wizard flow visueel doorlopen in de browser"
    expected: "Stap 1 toont notitie-invoer en AI-extractie; stap 2 toont variant-kaarten per module met Aanbevolen-badge; stap 3 streamt AI-advies en 'Pas tabel aan' updatet de vergelijkingstabel"
    why_human: "AI-streaming, real-time blinking cursor, tabel-harmonisatie na 'Pas tabel aan', collapsed/expanded-states zijn allemaal runtime-gedrag dat niet programmatisch verificeerbaar is zonder de app te draaien"
  - test: "Controleer dat 'Pas tabel aan' de ComparisonTable correct updatet"
    expected: "Na klikken op 'Pas tabel aan' worden de geselecteerde aanbieders en de aanbevolen Cito-bundel zichtbaar in de tabel eronder — wizard klapt in tot de summary-balk"
    why_human: "applyToTable() verloopt via Zustand cross-store write + initialize() die de engine opnieuw aanroept; visuele verificatie van het eindresultaat in de tabel vereist de browser"
  - test: "Controleer dat wizard ook op de CurrentVsProposed- en Migratiepagina's beschikbaar is (commit 8147a40)"
    expected: "ComparisonWizard rendert bovenaan op alle drie de vergelijkingsviews (Vergelijking, Huidig vs. Cito, Migratie)"
    why_human: "Post-phase commit 8147a40 breidde de wizard uit naar twee extra pagina's — visuele controle nodig"
---

# Phase 16: AI Wizard Verbetering Prijsvergelijking Harmonisatie — Verification Report

**Phase Goal:** Eerlijke, correcte en consistente vergelijking tussen Cito en concurrenten (DIA/JIJ) ondanks hun verschillende varianten-structuren, via een verbeterde AI wizard met drie logische stappen
**Verified:** 2026-03-25T11:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Gebruiker kiest in een eerste stap welk specifiek aanbod/variant van de concurrent (DIA of JIJ) wordt gebruikt als vergelijkingsbasis — de wizard toont de beschikbare varianten per concurrent | VERIFIED | WizardStep2Variants.tsx (233 regels) toont per module DIA_PACKAGES gefilterd op moduleId en alle JIJ_LICENSE_TIERS als selecteerbare VariantCard-componenten. suggestDiaPackage/suggestJijTier markeren de aanbevolen optie. |
| 2 | AI wizard genereert na de selectie een eerlijk vergelijkingsadvies dat het geselecteerde concurrent-aanbod correct matcht met het juiste Cito-aanbod, inclusief uitleg waarom deze matching eerlijk is | VERIFIED | WizardStep3Advice.tsx roept streamWizardAdvice() aan met variantSelections + providerData. ai-wizard-advice.ts systeem-prompt vereist expliciet `matchingUitleg` en `aanbevolenCitoBundel` in JSON-output. parseAdviceFromText() verwerkt het resultaat. |
| 3 | AI gebruikt de correcte concurrentie-informatie (prijzen, features, pakketten) uit de provider-configuraties voor het advies | VERIFIED | WizardStep3Advice.tsx bouwt `providerData` payload uit DIA_PACKAGES, JIJ_LICENSE_TIERS en CITO_BUNDLES (regels 119-138). MODULE_DIFFERENTIATORS gefilterd op selectedModules wordt meegestuurd voor Cito-meerwaarde per module (per PRIJS-05). api/ai-wizard-advice.ts verwerkt deze data in het user-message voor de AI. |
| 4 | Prijzen en tabelweergave in het tabblad vergelijking zijn identiek aan de output van de wizard — geen afwijkingen tussen wizard-resultaat en vergelijkingstab | VERIFIED (wiring confirmed, visual pending) | applyToTable() in wizard-store.ts (regels 151-188) roept usePriceComparisonStore.getState().setVisibleProviders() en setCitoBundleType() aan. setCitoBundleType() triggert automatisch initialize() die de engine opnieuw aanroept. Wizard-store test bevestigt: applyToTable calls setVisibleProviders and setCitoBundleType op comparison store (test passing). |
| 5 | Tabelweergave in het vergelijkingstabblad weerspiegelt exact de input (geselecteerde variant, prijzen, modules) zonder dataverlies of transformatie-fouten | VERIFIED (engine untouched) | ComparisonTable.tsx is niet gewijzigd in Phase 16. Comparison engine pure functions zijn niet aangeraakt. De wizard schrijft alleen naar setVisibleProviders en setCitoBundleType — de engine berekent zelf op basis van de bestaande schoolprofieldata. 1056 tests geslaagd inclusief alle engine-tests. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `src/features/price-comparison/wizard/types.ts` | — | 39 | VERIFIED | Exporteert WizardScenario, VariantConfidence, ModuleVariantSelection, WizardAdviceResult, ExtraContextInput, ExtractedVariantResult |
| `src/features/price-comparison/wizard/wizard-store.ts` | — | 203 | VERIFIED | Zustand store met persist, applyToTable implementatie (regels 151-188), usePriceComparisonStore.getState() aanroep |
| `src/features/price-comparison/wizard/scenario-detection.ts` | — | 33 | VERIFIED | detectScenario pure function; controleert 'cito-oud' en 'cito-nieuw' correct op basis van CurrentProvider type |
| `src/features/price-comparison/wizard/variant-suggestions.ts` | — | 63 | VERIFIED | suggestDiaPackage (goedkoopste DIA-pakket) en suggestJijTier (tier op basis van totale afnames) |
| `api/ai-wizard-extract.ts` | — | 163 | VERIFIED | Lazy-init Anthropic + Supabase, JWT-auth, claude-sonnet-4-6, SSE streaming, POST handler |
| `api/ai-wizard-advice.ts` | — | 202 | VERIFIED | Lazy-init Anthropic + Supabase, JWT-auth, claude-sonnet-4-6, differentiators in systeem-prompt, SSE streaming |
| `src/lib/ai-wizard.ts` | — | 254 | VERIFIED | Exporteert extractVariantsFromNotes, streamWizardAdvice, parseAdviceFromText; inline getAuthHeaders; parseSSEChunk import |
| `src/features/price-comparison/wizard/ComparisonWizard.tsx` | 80 | 142 | VERIFIED | Rendert WizardStep1Notes/Step2Variants/Step3Advice; useWizardStore; detectScenario; collapsed/expanded states |
| `src/features/price-comparison/wizard/ComparisonWizardProgress.tsx` | 30 | 80 | VERIFIED | 3-staps progress bar met labels Gespreksnotities/Variant-selectie/Advies & Resultaat |
| `src/features/price-comparison/wizard/WizardStep1Notes.tsx` | 60 | 117 | VERIFIED | extractVariantsFromNotes call; Niet bekend knop; Analyseren... loading state |
| `src/features/price-comparison/wizard/WizardStep2Variants.tsx` | 80 | 233 | VERIFIED | DIA_PACKAGES en JIJ_LICENSE_TIERS; suggestDiaPackage/suggestJijTier; confidence indicators; moduleSetups-first pre-fill |
| `src/features/price-comparison/wizard/VariantCard.tsx` | 40 | 77 | VERIFIED | Aanbevolen badge; isSelected ring-2 ring-cito-accent; isRecommended prop |
| `src/features/price-comparison/wizard/ScenarioDetector.tsx` | 25 | 56 | VERIFIED | alles-oud-cito banner; alles-nieuw-cito banner met Doorgaan knop; null voor deels-concurrent |
| `src/features/price-comparison/wizard/WizardStep3Advice.tsx` | 120 | 406 | VERIFIED | streamWizardAdvice; parseAdviceFromText; applyToTable; Genereer advies/Pas tabel aan/Opnieuw genereren; animate-pulse cursor; strategie TYPE_CONFIG; AI disclaimer |
| `src/features/price-comparison/wizard/ExtraContextField.tsx` | 40 | 68 | VERIFIED | 3 velden: Eventuele korting concurrent, DMU-focus, Bijzonderheden |
| `src/features/price-comparison/PriceComparisonPage.tsx` | — | — | VERIFIED | Importeert ComparisonWizard (regel 17); rendert `<ComparisonWizard />` (regel 384); geen AdvicePanel import meer |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| wizard-store.ts | store.ts (PriceComparisonStore) | applyToTable() roept usePriceComparisonStore.getState() aan | WIRED | Regels 169-181: comparisonStore.setVisibleProviders(providers) + setCitoBundleType + initialize() |
| WizardStep1Notes.tsx | ai-wizard.ts | extractVariantsFromNotes call bij submit | WIRED | Regel 9: import; regel 34: aanroep |
| WizardStep2Variants.tsx | variant-suggestions.ts | suggestDiaPackage en suggestJijTier voor Aanbevolen-badge | WIRED | Regel 13: import; regels 124-125: useMemo aanroepen |
| WizardStep3Advice.tsx | ai-wizard.ts | streamWizardAdvice en parseAdviceFromText | WIRED | Regel 19: import; regels 143/156: aanroepen |
| WizardStep3Advice.tsx | wizard-store.ts | applyToTable() bij Pas tabel aan bevestiging | WIRED | Regel 175: useWizardStore.getState().applyToTable() |
| ai-wizard.ts | api/ai-wizard-extract.ts | fetch naar /api/ai-wizard-extract met SSE | WIRED | Regel 45: fetch('/api/ai-wizard-extract') |
| ai-wizard.ts | api/ai-wizard-advice.ts | fetch naar /api/ai-wizard-advice met SSE | WIRED | Regel 159: fetch('/api/ai-wizard-advice') |
| PriceComparisonPage.tsx | ComparisonWizard.tsx | import en render ter vervanging van AdvicePanel | WIRED | Regel 17: import; regel 384: `<ComparisonWizard />` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| WizardStep3Advice.tsx | streamingText | appendStreamingText() aangeroepen vanuit for-await loop over streamWizardAdvice() generator | Ja — generator leest van SSE-stream van api/ai-wizard-advice.ts die Anthropic API aanroept | FLOWING |
| WizardStep3Advice.tsx | aiAdvice | parseAdviceFromText(fullText) na stream-voltooiing | Ja — geparsed JSON van geaccumuleerde AI-tekst | FLOWING |
| WizardStep2Variants.tsx | variantSelections | useEffect pre-fill vanuit moduleSetups + extractionResult overlay | Ja — geladen vanuit wizard store (persist) en/of AI extractie-resultaat | FLOWING |
| ComparisonTable (na apply) | modules/totals | initialize() in PriceComparisonStore triggert calculateComparison() engine | Ja — pure engine berekening op basis van school-profiel data | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Wizard types exporteerbaar | `node -e "const t = require('./src/features/price-comparison/wizard/types.ts')"` | N/A — TypeScript module, geen runtime check | SKIP — vitest tests valideren type exports |
| parseAdviceFromText werkt correct | `npx vitest run src/features/price-comparison/wizard/__tests__/wizard-advice.test.ts` | 3 tests passed | PASS |
| suggestDiaPackage/suggestJijTier werken correct | `npx vitest run src/features/price-comparison/wizard/__tests__/variant-suggestions.test.ts` | 10 tests passed | PASS |
| applyToTable schrijft naar comparison store | `npx vitest run src/features/price-comparison/wizard/__tests__/wizard-store.test.ts` | 9 tests passed, inclusief applyToTable tests | PASS |
| Productie-build slaagt | `npm run build` | Built in 754ms, geen TypeScript errors | PASS |
| Alle 1056 tests slagen | `npx vitest run` | 1056 passed, 18 skipped, 70 todo | PASS |

### Requirements Coverage

| Requirement | Bron-plan(s) | Beschrijving | Status | Bewijs |
|-------------|-------------|--------------|--------|--------|
| PRIJS-01 | 16-01, 16-02, 16-03 | Gebruiker ziet per geselecteerde module de kosten per leerling en totaalkosten per aanbieder (Cito, DIA, JIJ) naast elkaar | SATISFIED | ComparisonWizard + ComparisonTable samenwerken: wizard schrijft visibleProviders via applyToTable() naar store; tabel toont geselecteerde aanbieders naast elkaar |
| PRIJS-03 | 16-02, 16-03 | Gebruiker kan berekeningsdetails per module uitklappen en ziet de formule en inputs | SATISFIED | ComparisonTable.tsx (ongewijzigd) heeft expandedModule state met uitklapbare detail-rijen (regels 19, 173, 320). Phase 16 verbreekt dit niet — build en tests slagen. |
| PRIJS-05 | 16-01, 16-03 | Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) — onderscheidend vermogen | SATISFIED | MODULE_DIFFERENTIATORS wordt gefilterd op selectedModules en meegestuurd in de AI-advies payload (WizardStep3Advice.tsx regels 113-116). ai-wizard-advice.ts system prompt vereist gebruik van differentiators voor Cito-meerwaarde per module. parseAdviceFromText() getest in wizard-advice.test.ts (3 tests passed). |
| PRIJS-06 | 16-01, 16-02, 16-03 | Engine berekent correcte DIA-pakketprijzen: als school 3+ DIA-modules afneemt wordt automatisch het voordeligste pakket berekend | SATISFIED | suggestDiaPackage() retourneert het goedkoopste DIA-pakket dat ALLE geselecteerde DIA-beschikbare modules dekt (variant-suggestions.ts). Wizard toont dit als aanbeveling. Bestaande DIA-calculators in de price-comparison engine zijn ongewijzigd. |

Alle vier vereiste requirement-IDs zijn gedekt. De traceability-tabel in REQUIREMENTS.md wijst PRIJS-01, PRIJS-03, PRIJS-05, PRIJS-06 toe aan Phase 10 als "Complete" — Phase 16 verbetert en versterkt deze requirements met de AI wizard, zonder ze te verbreken.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/features/price-comparison/wizard/ComparisonWizard.tsx` regel 83 (origineel) | Step 3 renderde aanvankelijk een placeholder div (gedocumenteerd in 16-02-SUMMARY Known Stubs) | Opgelost in Plan 16-03 | Geen impact — WizardStep3Advice volledig geimplementeerd |

Geen blokkerende anti-patterns gevonden in de huidige code. Geen TODO/FIXME/placeholder-opmerkingen in de geproduceerde wizard-bestanden. Geen lege return null-implementaties.

### Human Verification Required

#### 1. Volledige 3-staps wizard flow

**Test:** Open de app (`npm run dev`), navigeer naar een schoolprofiel met geselecteerde modules, ga naar het tabblad Vergelijking. Doorloop alle stappen: voer gespreksnotities in of klik Niet bekend, selecteer varianten in stap 2, genereer advies in stap 3, klik Pas tabel aan.
**Expected:** Stap 1 toont notitie-textarea met Analyseren... spinner; stap 2 toont per module DIA-pakketten en JIJ-tiers als selecteerbare kaarten met Aanbevolen-badge; stap 3 streamt AI-advies met blinking cursor, toont gekleurde advies-kaarten na voltooiing; Pas tabel aan klapt wizard in en tabel reflecteert geselecteerde aanbieders.
**Why human:** AI-streaming, visuele animaties (animate-pulse cursor), en cross-store Zustand-updates zijn runtime-gedrag dat niet programmatisch verifieerbaar is zonder de app te draaien.

#### 2. Tabel-harmonisatie verificatie

**Test:** Na het klikken op Pas tabel aan: controleer dat (a) de wizard-summary-balk verschijnt met "AI vergelijkingsadvies actief" en "Opnieuw doorlopen" knop, en (b) de ComparisonTable eronder de geselecteerde aanbieders toont (bijv. alleen Cito + DIA als de school DIA gebruikt).
**Expected:** De tabel toont geen aanbieders die niet geselecteerd zijn in de wizard. De aanbevolen Cito-bundel uit het AI-advies (individual/basis/plus) wordt weerspiegeld in de CitoBundleSelector.
**Why human:** setVisibleProviders en setCitoBundleType worden correct aangeroepen per test-bewijs, maar de visuele weergave van het eindresultaat in de tabel vereist de browser.

#### 3. Wizard beschikbaarheid op CurrentVsProposed- en Migratiepagina's

**Test:** Navigeer naar het Huidig vs. Cito tabblad en het Migratie tabblad (commit 8147a40 voegde de wizard toe aan deze pagina's na Phase 16 voltooiing).
**Expected:** ComparisonWizard kaart is zichtbaar bovenaan op alle drie de vergelijkingsviews.
**Why human:** Commit 8147a40 vond plaats na de Phase 16 plans; visuele bevestiging nodig.

### Gaps Summary

Geen gaps gevonden. Alle 5 observable truths zijn VERIFIED door code-inspectie, key-link verificatie en het slagen van tests. De fase is functioneel volledig. Menselijke verificatie is vereist voor het runtime-gedrag van AI-streaming en de visuele tabel-harmonisatie na `Pas tabel aan`.

**Opmerking: Scenario-detectie correctheid** — `detectScenario` controleert op `'cito-nieuw'` (niet `'cito'`), wat overeenkomt met het `CurrentProvider` type in `src/models/school.ts`. Dit is correct en consistent.

**Opmerking: Post-phase commits** — Na de drie Phase 16 plans zijn twee extra commits toegevoegd (`4afbfb9` DIA-pakket beschrijvingen verbeterd + wizard-navigatie, `8147a40` wizard toegevoegd aan CurrentVsProposed- en Migratiepagina's). Deze verbeteren de fase maar vallen buiten de oorspronkelijke plan-scope. De kern-doelstellingen zijn volledig gerealiseerd.

---

*Verified: 2026-03-25T11:35:00Z*
*Verifier: Claude (gsd-verifier)*
