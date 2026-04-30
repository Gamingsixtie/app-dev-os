# Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Bestaande Cito-klanten op het huidige platform kunnen een eerlijke prijsvergelijking doen met DIA en JIJ, zonder aanname van migratie naar het nieuwe Cito-platform. Scenario C: retentie-perspectief — "waarom bij Cito blijven" i.p.v. "waarom naar Cito overstappen". Het AI-advies integreert schoolplan-kansen en het migratiepad (volgend schooljaar nieuw platform) als onderdeel van de zachte deal.

</domain>

<decisions>
## Implementation Decisions

### Scenario-routing
- **D-01:** Nieuw Scenario C = "Huidig Cito vs. Concurrent". Schone scheiding naast Scenario A (concurrent → Cito, acquisitie) en Scenario B (migratie oud → nieuw platform)
- **D-02:** Wizard scenario-detectie bij `alles-oud-cito` biedt keuze: migratie (B) óf concurrentievergelijking (C) — niet automatisch naar migratie sturen
- **D-03:** ScenarioDetector in engine uitbreiden met `Scenario = 'A' | 'B' | 'C'`
- **D-04:** WizardScenario `alles-oud-cito` krijgt een vervolgkeuze in de wizard i.p.v. directe doorverwijzing naar migratie

### Prijsbron huidig Cito
- **D-05:** Publicatieprijzen van het huidige Cito-platform als basis voor de "Huidig Cito" kant
- **D-06:** School-specifieke prijzen (deals/kortingen) kunnen als override ingevoerd worden, net als bij Scenario A
- **D-07:** Engine moet onderscheid maken tussen oud-platform-prijzen (Scenario C) en nieuw-platform-prijzen (Scenario A) — twee prijssets voor Cito

### AI-advies perspectief
- **D-08:** Retentie-frame: "u betaalt nu X bij Cito, concurrent biedt Y — maar u verliest Z" (i.p.v. acquisitie: "Cito biedt u X")
- **D-09:** Schoolplan-integratie in AI-advies: schoolplan-kansen (Phase 14 analyse) worden meegenomen — "Uw schoolplan noemt [doel], Cito's [module] ondersteunt dit, concurrent biedt dit niet"
- **D-10:** Migratiepad als onderdeel van advies: "als u bij Cito blijft, gaat u volgend schooljaar over naar het nieuwe platform met extra voordelen" — de zachte deal
- **D-11:** Drie lagen in het advies: (1) prijs: wat u nu betaalt vs. concurrent, (2) wat u verliest bij overstap (differentiators + schoolplan-aansluiting), (3) wat u erbij krijgt als u blijft (nieuw platform upgrade)
- **D-12:** Differentiators geframed als "behouden" i.p.v. "krijgen" — retentie-taal

### Tabelweergave
- **D-13:** 2 kolommen: Huidig Cito vs. Concurrent — simpel en overzichtelijk
- **D-14:** Nieuw-platform informatie leeft in het AI-advies, niet in de tabel
- **D-15:** Schoolplan-koppeling geïntegreerd in AI-advies, geen aparte visuele sectie onder de tabel

### Claude's Discretion
- Visueel ontwerp van de keuze-UI bij `alles-oud-cito` detectie (migratie vs. concurrent)
- Exacte structuur van het retentie-advies (secties, volgorde, copy)
- Hoe schoolplan-kansen visueel worden verweven in het AI-advies output
- Data-structuur voor oud-platform-prijzen in de engine
- Hoe de "zachte deal" (migratiepad + schoolplan) visueel onderscheiden wordt van het harde prijsverhaal in het advies
- Loading/streaming UX voor het uitgebreidere AI-advies
- Responsive behavior op tablet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scenario-detectie (bestaand — uitbreiden)
- `src/engine/scenario-detection.ts` — Engine-level ScenarioDetection met recommended A/B, migrationModuleIds, competitorModuleIds
- `src/features/price-comparison/wizard/scenario-detection.ts` — Wizard-level detectScenario() met WizardScenario type ('deels-concurrent', 'alles-oud-cito', 'alles-nieuw-cito')
- `src/features/price-comparison/wizard/types.ts` — WizardScenario, WizardAdviceResult, ModuleVariantSelection types
- `src/models/school.ts` — Scenario type ('A' | 'B'), CurrentProvider, ModuleCurrentSetup

### AI wizard (Phase 16 — uitbreiden voor retentie-advies)
- `src/features/price-comparison/wizard/ComparisonWizard.tsx` — 3-staps wizard container
- `src/features/price-comparison/wizard/wizard-store.ts` — Wizard state management
- `src/lib/ai-advice.ts` — AI advice generation met SSE streaming (prompt aanpassen voor retentie)

### Schoolplan-analyse (Phase 14 — data bron voor advies)
- `src/features/school-profile/tabs/SchoolplanTab.tsx` — Schoolplan upload en AI-analyse
- `src/lib/ai-analysis.ts` — Schoolplan analysis AI functions

### Engine & calculators
- `src/engine/price-comparison.ts` — calculateComparison() (uitbreiden voor oud-platform-prijzen)
- `src/engine/calculators/cito-calculator.ts` — Cito bundle cost calculation
- `src/data/providers/cito.ts` — Cito pricing (nieuw platform — oud-platform-prijzen toevoegen)

### Vergelijkings-UI
- `src/features/price-comparison/ComparisonTable.tsx` — Tabel (aanpassen voor 2-kolom Scenario C)
- `src/features/price-comparison/PriceComparisonPage.tsx` — Pagina container
- `src/features/price-comparison/store.ts` — Zustand store

### Prior context
- `.planning/phases/16-ai-wizard-verbetering-prijsvergelijking-harmonisatie/16-CONTEXT.md` — AI wizard beslissingen
- `.planning/phases/10-prijsvergelijking-gevoeligheid/10-CONTEXT.md` — Vergelijkingsengine beslissingen

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ComparisonWizard** (`wizard/ComparisonWizard.tsx`): 3-staps wizard — uitbreiden met Scenario C keuze bij alles-oud-cito
- **ScenarioDetector** (`wizard/ScenarioDetector.tsx`): Component dat scenario toont — uitbreiden met keuze migratie/concurrent
- **detectScenario()** (engine): Pure function — uitbreiden met Scenario C routing
- **ai-advice.ts**: Streaming advies — prompt aanpassen voor retentie-frame + schoolplan-integratie
- **SchoolplanTab**: Bevat al AI-analyse van schoolplan met kansen — data herbruiken voor advies
- **ComparisonTable**: Bestaande tabel — aanpassen voor 2-kolom huidig Cito vs. concurrent

### Established Patterns
- Zustand store met `persist` middleware voor state management
- SSE streaming voor AI responses via Vercel serverless proxy
- Provider-aware calculators in `src/engine/calculators/`
- `getAuthHeaders()` pattern voor authenticated API calls
- Scenario routing via `Scenario` type in school store

### Integration Points
- `useSchoolProfileStore.scenario` — Uitbreiden met 'C' als optie
- `useSchoolProfileStore.moduleSetups` — Bron voor detectie alles-oud-cito
- `usePriceComparisonStore` — Wizard schrijft resultaten hier
- Schoolplan-analyse data (Phase 14) → AI-advies prompt voor Scenario C
- `/api/ai-advice` — Serverless endpoint uitbreiden met retentie-prompt variant

</code_context>

<specifics>
## Specific Ideas

- Elke Cito-klant op het huidige platform gaat uiteindelijk over naar het nieuwe platform (volgend schooljaar). Dit is een krachtig argument in het retentie-advies: "blijf en krijg het nieuwe platform erbij"
- De "zachte deal" is minstens zo belangrijk als de prijsvergelijking: schoolplan-aansluiting, migratiepad, Cito-differentiators als "wat u verliest"
- Niet elke Cito-klant vergelijkt met een concurrent — sommigen willen alleen het migratiepad zien (dat is Scenario B). Scenario C is specifiek voor klanten die actief de markt verkennen
- Het AI-advies moet drie lagen combineren: harde prijs + zachte meerwaarde + toekomstpad — dit maakt het voor de accountmanager een compleet verhaal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking*
*Context gathered: 2026-03-25*
