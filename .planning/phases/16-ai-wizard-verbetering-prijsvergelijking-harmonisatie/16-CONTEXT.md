# Phase 16: AI Wizard Verbetering & Prijsvergelijking Harmonisatie - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Eerlijke, correcte en consistente vergelijking tussen Cito en concurrenten (DIA/JIJ) ondanks hun verschillende varianten-structuren, via een verbeterde AI wizard met drie logische stappen. De wizard vervangt de bestaande AdvicePanel en wordt de primaire manier om een eerlijke prijsvergelijking op te stellen.

</domain>

<decisions>
## Implementation Decisions

### Wizard stappen-flow
- **D-01:** De wizard vervangt de bestaande `AdvicePanel` component — zelfde plek op de prijsvergelijkingspagina, maar nu met 3 stappen in plaats van één knop
- **D-02:** Drie stappen: (1) Gespreksnotities → AI extraheert concurrent-varianten, (2) Variant-selectie per module bevestigen/aanpassen, (3) AI matching + resultaat aanpassen + doorvoeren naar tabel
- **D-03:** Lineaire navigatie met stappen-balk (vorige/volgende knoppen + voortgangsindicator bovenaan)
- **D-04:** Wizard is altijd zichtbaar bovenaan de vergelijkingspagina — gebruiker kan stappen opnieuw doorlopen
- **D-05:** AI-advies (stap 3) is verplicht — niet overslaan. De kern van eerlijke matching vereist AI-validatie vanwege de vele concurrent-varianten
- **D-06:** Alle concurrenten tegelijk selecteren in stap 2 — een school kan per module een andere aanbieder hebben (bv. DIA voor rekenen, JIJ voor sociaal-emotioneel)
- **D-07:** Pre-fill variant-selectie vanuit bestaande `moduleSetups` (WizardStep4) als startpunt, maar gebruiker kan altijd overrulen
- **D-08:** AI output in stap 3 via streaming (real-time tekst verschijnt geleidelijk), consistent met bestaande AI-intake pattern

### Stap 1: Gespreksnotities
- **D-09:** Stap 1 is een tekstveld waar de accountmanager gespreksnotities invoert — AI extraheert welke concurrenten/varianten de school gebruikt
- **D-10:** "Niet bekend" knop als er geen gespreksinfo beschikbaar is — skip naar lege variant-selectie in stap 2
- **D-11:** AI markeert duidelijk wat wél en wat niet kon worden afgeleid uit de notities — onbekende punten worden gemarkeerd in stap 2 zodat gebruiker die handmatig aanvult

### Stap 2: Variant-selectie per module
- **D-12:** Per module selecteert de gebruiker welke concurrent en welke specifieke variant (DIA pakket / JIJ licentietier) — niet één variant voor alles, maar per module apart
- **D-13:** DIA-pakketten en JIJ-tiers tonen met prijs/leerling en welke modules inbegrepen — geïnformeerde keuze
- **D-14:** Slimme suggesties: engine berekent meest logische variant op basis van schoolgrootte en toont als "Aanbevolen" — gebruiker kan overrulen

### Stap 3: AI matching + resultaat
- **D-15:** AI genereert volledig gespreksadvies: eerlijke matching concurrent→Cito bundel + sterke punten + bezwaren weerleggen + strategie per DMU
- **D-16:** AI adviseert expliciet welke Cito-bundel (los/basis/plus) past bij de geselecteerde concurrent-variant, met uitleg waarom dit eerlijk is
- **D-17:** Advies moet uitlegbaar zijn richting de school — accountmanager kan de matching-redenatie overnemen in het gesprek
- **D-18:** Cito wordt goed gepositioneerd, maar wel eerlijk en verdedigbaar
- **D-19:** Gebruiker kan in stap 3 het resultaat handmatig aanpassen (modules/matching) voordat het wordt doorgevoerd naar de tabel

### AI bronnen & extra context
- **D-20:** AI gebruikt drie bronnen: (1) interne provider-data (prijzen, features uit src/data/providers/), (2) algemene marktkennis over toetsaanbieders (niet voor prijzen), (3) gebruikersinput via gestructureerd extra-context veld
- **D-21:** Gestructureerd extra-context veld in stap 3 waar accountmanager aanvullende info kan geven (korting, DMU-focus, bijzonderheden) — structuur zodanig dat AI de context goed kan plaatsen
- **D-22:** AI neemt differentiators mee: zowel prijsverschil als Cito-meerwaarde per module (tijdwinst, automatisering, kwaliteit) uit bestaande MODULE_DIFFERENTIATORS data

### Harmonisatie wizard ↔ tabel
- **D-23:** Wizard-resultaat (variant-selectie + AI matching) wordt opgeslagen in de Zustand store → tabel leest dezelfde store — single source of truth
- **D-24:** Na wizard opnieuw doorlopen met andere varianten: tabel update pas na expliciete bevestiging via 'Pas tabel aan' knop
- **D-25:** AI-advies (uitleg matching, strategie) leeft alleen binnen de wizard — tabel toont puur data

### Scenario-detectie
- **D-26:** Wizard detecteert scenario: (1) school gebruikt deels concurrent → AI wizard voor eerlijke vergelijking, (2) school gebruikt alles oud-Cito → doorverwijzen naar migratie-scenario, (3) school gebruikt alles nieuw-Cito → melding "Deze school gebruikt al Cito nieuw — wat wil je vergelijken?"

### Claude's Discretion
- UX-design van het gestructureerde extra-context veld (vaste velden vs. vrij tekstveld met tags — kies wat het best begrepen wordt door de AI)
- Exact visueel ontwerp van de stappen-balk en variant-selectie kaarten
- Loading/streaming UX details tijdens AI-generatie
- Hoe de "Niet bekend" markering visueel eruitziet in stap 2
- Hoe de scenario-detectie melding wordt gepresenteerd
- Responsive behavior op tablet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Provider data & pricing
- `src/data/providers/dia.ts` — DIA package definitions (6 packages), prices, module mappings
- `src/data/providers/jij.ts` — JIJ license tier definitions (4 tiers), price-per-test, administration volumes
- `src/data/providers/cito.ts` — Cito pricing and bundle definitions (los/basis/plus)
- `src/data/providers/index.ts` — PROVIDER_CONFIGS map, central provider registry

### Engine & calculators
- `src/engine/calculators/dia-calculator.ts` — DIA package cost calculation (picks cheapest qualifying package)
- `src/engine/calculators/jij-calculator.ts` — JIJ tier cost calculation (based on administration volume)
- `src/engine/calculators/cito-calculator.ts` — Cito bundle cost calculation
- `src/engine/price-comparison.ts` — Main calculateComparison() function with breakdowns
- `src/engine/cito-bundles.ts` — Cito bundle definitions and selection logic

### Existing AI components (to be replaced/refactored)
- `src/features/price-comparison/AdvicePanel.tsx` — Current one-click AI advice panel (replaced by wizard)
- `src/lib/ai-advice.ts` — AI advice generation with SSE streaming (to be extended for wizard)
- `src/lib/ai-intake.ts` — AI intake for conversation notes extraction (reuse pattern for stap 1)

### State management
- `src/features/price-comparison/store.ts` — Zustand store for comparison results and overrides
- `src/features/school-profile/store.ts` — School profile store with moduleSetups (pre-fill source)

### Differentiators
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS data for Cito meerwaarde per module

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdvicePanel.tsx` — Component to replace; streaming UI pattern reusable for stap 3
- `ai-advice.ts` — `generateAdvice()` and `streamAdvice()` functions with SSE streaming via `/api/ai-advice` endpoint — extend for wizard
- `ai-intake.ts` — AI extraction from conversation notes with Zod structured output — reuse pattern for stap 1 (gespreksnotities → variant extraction)
- `WizardShell.tsx` + `ProgressBar.tsx` — Existing wizard shell with step navigation and progress bar — pattern reusable for AI wizard stappen-balk
- `CitoBundleSelector.tsx` — Existing Cito bundle toggle (individual/basis/plus)
- `DiffView.tsx` — Existing confirmation/edit UI for AI-extracted data — pattern reusable for stap 2 (bevestigen/aanpassen)

### Established Patterns
- Zustand store with `persist` middleware for state management
- SSE streaming for AI responses via Vercel serverless proxy
- `getAuthHeaders()` pattern for authenticated API calls
- Provider-aware calculators in `src/engine/calculators/`
- Module-level setup via `ModuleCurrentSetup` type in school store

### Integration Points
- `PriceComparisonPage.tsx` — Container where AdvicePanel lives (wizard replaces it)
- `usePriceComparisonStore` — Wizard writes results here → ComparisonTable reads from same store
- `useSchoolProfileStore.moduleSetups` — Pre-fill source for variant-selectie
- `ComparisonTable.tsx` — Downstream consumer of wizard results
- `/api/ai-advice` — Serverless endpoint to extend for wizard AI calls

</code_context>

<specifics>
## Specific Ideas

- De wizard moet voorkomen dat accountmanagers fouten maken door de vele concurrent-varianten — AI-validatie is daarom verplicht, niet optioneel
- Cito heeft maar 3 bundels (los, basis, plus) tegenover DIA's 6 pakketten en JIJ's 4 tiers — de AI moet uitleggen waarom een specifieke Cito-bundel de eerlijke vergelijking is
- Het advies moet "overneembaar" zijn door de accountmanager in een gesprek met de school — uitlegbare matching, geen black box
- Gespreksnotities in stap 1 zijn de natuurlijke start — accountmanagers bellen en typen tegelijk, dit sluit aan bij de bestaande AI-intake UX
- Per module een andere concurrent is de realiteit (bv. DIA voor basisvaardigheden, JIJ voor sociaal-emotioneel) — de wizard moet dit gemixte scenario ondersteunen

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-ai-wizard-verbetering-prijsvergelijking-harmonisatie*
*Context gathered: 2026-03-25*
