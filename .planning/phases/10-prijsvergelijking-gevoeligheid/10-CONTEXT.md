# Phase 10: Prijsvergelijking & Gevoeligheid - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Uitgebreide vergelijkingsengine met DIA-pakketlogica en JIJ-pakketlogica, hybride scenario's (school wisselt per module van aanbieder), onderscheidend vermogen per module, gevoeligheidsanalyse met kortingsscenario's en break-even, en interne modus met sales-signalen. Bouwt voort op de bestaande vergelijkingstabel (Phase 2) en schoolspecifieke prijzen (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### DIA/JIJ Pakketlogica
- **D-01:** DIA-pakketten: engine berekent automatisch het voordeligste pakket bij 3+ modules, maar gebruiker kan overschrijven naar een ander pakket of losse modules
- **D-02:** DIA-pakketten zijn configureerbaar door de accountmanager — nieuwe pakketten toevoegen, prijzen aanpassen. Niet hardcoded.
- **D-03:** Pakketprijs-weergave: PriceBadge toont [Pakketprijs] naast het bedrag. Uitklapbare detailrij toont welk pakket van toepassing is met uitleg welke modules erin zitten
- **D-04:** JIJ verschijnt alleen in de vergelijking als de school JIJ daadwerkelijk gebruikt (productgebruik vastgelegd in Phase 7 schoolprofiel)
- **D-05:** JIJ zonder ingevoerde prijzen: kolom verschijnt met invoervelden per module + differentiators (wat JIJ wel/niet biedt), maar geen bedrag tot ingevoerd

### Hybride Scenario
- **D-06:** Hybride scenario volgt automatisch uit het productgebruik dat in Phase 7 vastgelegd is — niet-Cito modules tonen automatisch wat Cito kost. AM kan per module overschrijven
- **D-07:** Basisvaardighedentoetsen (rekenwiskunde, Nederlands, etc.) zijn typisch bij 1 aanbieder; extra modules (sociaal-emotioneel, cognitieve capaciteiten) kunnen per module bij een andere aanbieder zitten
- **D-08:** Extra kolom 'Na overstap' naast Cito/DIA/JIJ die per module toont wat de school betaalt als ze switchen. Besparingsrij onderaan
- **D-09:** Overstap-info toont euro's + percentage per module en totaal

### 3-Jarige Cito-licentie
- **D-10:** Toggle bovenaan de vergelijking: [Per jaar] / [3-jarig contract]. Bij 3-jarig toont de engine de 3-jaars Cito-prijs naast de jaarlijkse concurrent-prijs x 3
- **D-11:** Exacte prijsmodel voor 3-jarige licentie wordt door de gebruiker aangeleverd — researcher/planner moet hier input voor vragen of placeholder ondersteunen

### Gevoeligheidsanalyse
- **D-12:** Scenariotabel: huidige vergelijking, 10% korting concurrent, 20% korting concurrent. Per scenario het totaalverschil en per-module verschil
- **D-13:** Break-even: zowel totaal ('DIA wordt goedkoper bij 18% korting') als per-module in de detailrij
- **D-14:** Alleen de actieve concurrent tonen (de concurrent die de school nu gebruikt), niet altijd beide
- **D-15:** Gevoeligheidsanalyse als uitklapbare sectie onder de vergelijkingstabel, op dezelfde pagina
- **D-16:** Alleen zichtbaar in interne modus

### Sales-signalen (Interne Modus)
- **D-17:** Automatische signalen op basis van prijsverschil: Cito goedkoper → 'Benadruk prijs' (groen), Cito duurder maar differentiators → 'Focus op meerwaarde' (geel), Cito duurder zonder differentiators → 'Kwetsbaar punt' (rood)
- **D-18:** Visueel: gekleurde badge naast modulenaam in de vergelijkingstabel. In de detailrij een korte toelichting
- **D-19:** Toggle in de pagina-header: [Extern] / [Intern]. Extern verbergt gevoeligheidsanalyse en sales-signalen. Extern = 'schoon voor scherm delen met school'
- **D-20:** Altijd ingelogd. Extern is geen publieke modus, maar een weergavemodus zonder sales-specifieke info

### Claude's Discretion
- Exacte DIA-pakketconfiguratie UI (CRUD voor pakketten)
- Berekening van pakketprijzen vs losse moduleprijzen in de engine
- Visueel onderscheid tussen interne en externe modus (achtergrondkleur, subtiele aanduiding)
- Exacte positioning en styling van de 'Na overstap' kolom
- Break-even berekening: wiskundige benadering (lineaire interpolatie vs exacte berekening)
- Responsive gedrag van de uitgebreide tabel op tablet
- Loading state bij herberekening na prijswijziging
- Animaties bij toggle-switches en uitklap-secties

### Folded Todos
Geen — geen todos gematcht voor Phase 10.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Vergelijkingsengine (bestaand)
- `src/engine/price-comparison.ts` — calculateComparison() huidige engine (simpel per-leerling x totaal, moet uitgebreid voor pakketten + hybride)
- `src/engine/types.ts` — CalculationInput, CalculationResult, SchoolProfile types
- `src/engine/current-vs-proposed.ts` — calculateCurrentVsProposed() (referentie voor hybride logica)
- `src/engine/__tests__/price-comparison.test.ts` — Bestaande tests (uitbreiden)

### Vergelijkings-UI (bestaand)
- `src/features/price-comparison/ComparisonTable.tsx` — Vergelijkingstabel (uitbreiden met hybride kolom, sales-signalen)
- `src/features/price-comparison/ComparisonChart.tsx` — Recharts staafdiagram
- `src/features/price-comparison/ModuleDetailPanel.tsx` — Uitklapbare detailrij (uitbreiden met break-even, differentiators)
- `src/features/price-comparison/PriceComparisonPage.tsx` — Pagina (toggle intern/extern, gevoeligheid-sectie toevoegen)
- `src/features/price-comparison/store.ts` — Zustand store met overrides en herberekening

### Prijsdata
- `src/data/default-prices.ts` — Publicatieprijzen als referentie
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS per aanbieder (basis voor sales-signalen)
- `src/models/pricing.ts` — PriceRecord, PriceSource, getPriceStatus
- `src/hooks/useSchoolPrices.ts` — Schoolspecifieke prijzen uit Supabase (Phase 9)

### Schoolprofiel (Phase 7/9)
- `src/features/school-profile/tabs/ProductsTab.tsx` — Productgebruik per school (bron voor hybride scenario)
- `src/features/school-profile/tabs/ComparisonTab.tsx` — Tab die vergelijkingspagina wrappt

### Phase 2 context (vergelijkingsbeslissingen)
- `.planning/phases/02-prijsvergelijking/02-CONTEXT.md` — Originele beslissingen: tabel-layout, Cialdini framing, differentiators

### Phase 9 context (prijsbeheer)
- `.planning/phases/09-ai-intake-prijsbeheer/09-CONTEXT.md` — useSchoolPrices, prijsgeschiedenis, actieve selectie

### Project
- `.planning/REQUIREMENTS.md` — PRIJS-01..08, GEVOEL-01..03, MODE-02
- `.planning/PROJECT.md` — Prijslandschap DIA/JIJ, DMU-realiteit, constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **calculateComparison()** (`src/engine/price-comparison.ts`): Pure engine — moet uitgebreid voor DIA-pakketten, hybride scenario, 3-jarige licentie
- **ComparisonTable** (`src/features/price-comparison/ComparisonTable.tsx`): Bestaande tabel met uitklapbare rijen — uitbreiden met 'Na overstap' kolom, sales-badges
- **ModuleDetailPanel**: Detailrij per module — uitbreiden met break-even, gevoeligheid per module
- **PriceBadge**: Prijsstatus-badge — uitbreiden met [Pakketprijs] variant
- **MODULE_DIFFERENTIATORS**: Differentiator-data per aanbieder — basis voor automatische sales-signalen
- **useSchoolPrices hook**: Schoolspecifieke prijzen uit Supabase — integratie met engine
- **ComparisonChart** (Recharts): Staafdiagram — uitbreiden voor hybride/3-jarig
- **usePriceComparisonStore**: Zustand store — uitbreiden met hybride state, modus toggle, gevoeligheid

### Established Patterns
- **Pure engine functies**: Rekenmotor gescheiden van UI (engine/ directory) — behouden
- **Zustand store + getState()**: Store leest via getState(), niet hooks — behouden
- **PriceBadge statussen**: Geverifieerd/Handmatig/Verouderd — uitbreiden met Pakketprijs
- **Uitklapbare detailrij**: Per module uitklappen voor details — herbruiken voor gevoeligheid
- **Supabase + React Query**: Data fetching patroon uit Phase 8/9

### Integration Points
- **Schoolprofiel productgebruik** → bepaalt welke aanbieders in de vergelijking, hybride scenario
- **useSchoolPrices** → actieve prijzen per school als input voor engine
- **ComparisonTab in schoolprofiel** → wrappt de vergelijkingspagina
- **Router** → mogelijk nieuwe route voor vergelijking met hybride/3-jarig toggle
- **Interne/externe modus toggle** → header-level, beïnvloedt meerdere componenten

</code_context>

<specifics>
## Specific Ideas

- Cito biedt een 3-jarige licentie aan — exacte prijsmodel wordt later aangeleverd door gebruiker. Engine moet dit kunnen verwerken als het beschikbaar is.
- Basisvaardighedentoetsen zitten typisch bij 1 aanbieder als pakket, extra modules kunnen per stuk bij verschillende aanbieders — hybride scenario moet dit onderscheid respecteren
- DIA-pakketten moeten configureerbaar zijn, niet hardcoded — DIA kan hun aanbod wijzigen
- JIJ verschijnt alleen als de school JIJ daadwerkelijk gebruikt — geen lege kolom bij scholen die alleen Cito en DIA vergelijken
- Sales-signalen zijn automatisch en data-gedreven (niet handmatig) — dit maakt het consistent en schaalt mee

</specifics>

<deferred>
## Deferred Ideas

- Vercel deploy (DEPLOY-01) — hoort bij Phase 8, niet Phase 10. Gebruiker wil dit nog afmaken.
- Meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing — Phase 11 (Waarde-engine)
- AI-verrijking van differentiators op basis van concurrentie-informatie — FUTURE
- Publieke link voor school (extern zonder login) — niet in scope, maar als idee genoteerd

</deferred>

---

*Phase: 10-prijsvergelijking-gevoeligheid*
*Context gathered: 2026-03-22*
