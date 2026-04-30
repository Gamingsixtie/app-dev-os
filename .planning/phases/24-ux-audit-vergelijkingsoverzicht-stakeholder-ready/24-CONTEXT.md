# Phase 24: UX-audit vergelijkingsoverzicht — stakeholder-ready prototype - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Het volledige vergelijkingsoverzicht (PriceComparisonPage) UX-technisch doorlichten en optimaliseren: doublures elimineren, informatie-architectuur herstructureren, progressive disclosure toepassen, en visueel stakeholder-ready maken. Geen nieuwe features — alleen herstructurering van bestaande secties.

</domain>

<decisions>
## Implementation Decisions

### Informatie-hiërarchie (nieuwe volgorde)
- **D-01:** AI Advies hero bovenaan de pagina — schoolplan-context geïntegreerd in dezelfde sectie (SchoolplanBanner wordt onderdeel van AI-advies, geen aparte banner meer)
- **D-02:** Bundel/Periode bediening direct na AI hero (CitoBundleSelector + DiaBundleSelector + PeriodToggle)
- **D-03:** Totaal-kaarten (Cito vs DIA vs JIJ met verschilbedragen) als tweede prominente sectie
- **D-04:** Tabel vóór grafiek — consultant wil snel per-module detail zien, grafiek is visuele samenvatting eronder
- **D-05:** Volledige volgorde: AI hero → bediening → totalen → provider toolbar → tabel → grafiek → meerwaarde → disclaimer

### Doublures elimineren
- **D-06:** Differentiators-lijst weg uit ComparisonSummary — AI-advies verwerkt differentiators in het adviesverhaal (geen aparte "Unieke Cito voordelen" lijst meer)
- **D-07:** MeerwaardePanel behoudt: tijdwinst + migratie CTA. Differentiators-data verhuist naar AI-advies context
- **D-08:** ProviderSelector (checkboxes) + PricingModelCards samengebracht in één compacte toolbar boven de tabel. Pricing model uitleg via tooltip/popover in plaats van inklapbare kaarten

### Progressive disclosure
- **D-09:** AI advies hero standaard samengevat (2-3 regels conclusie) met "Lees volledig advies" expand-knop — stakeholder ziet kern, consultant kan uitklappen
- **D-10:** Grafiek standaard ingeklapt — on-demand voor wie het wil zien
- **D-11:** MeerwaardePanel standaard ingeklapt — on-demand
- **D-12:** Tabel module-rijen: huidige expandable detail-panels (prijsopbouw) zijn voldoende — geen extra disclosure-lagen nodig

### Stakeholder-presentatie
- **D-13:** Eén view voor alle stakeholders — geen aparte filters/modi. De hiërarchie (conclusie → totalen → detail) werkt voor iedereen: MT stopt na totalen, coordinator scrollt door
- **D-14:** Pagina moet self-explanatory zijn — labels, tooltips en AI-advies geven voldoende context. Stakeholder kan het alleen lezen en begrijpen zonder uitleg van consultant
- **D-15:** Visuele scheiding via kleurzones (afwisselende achtergrondkleur-banden lichtgrijs/wit) in plaats van kaart-per-sectie met borders. Minder visuele ruis, rustiger scanbaar

### Data-reactivity (bevestigd vanuit codebase-analyse)
- **D-16:** Store is volledig reactief — elke bundel/periode/module-wijziging triggert initialize() → engine herberekening → alle UI-componenten updaten. Dit patroon moet behouden blijven na herstructurering
- **D-17:** Alle secties lezen uit dezelfde `usePriceComparisonStore.result` — single source of truth. Geen stale data mogelijk zolang dit patroon intact blijft

### Claude's Discretion
- Exacte kleurcodes voor de lichtgrijze banden (afstemmen op bestaande Tailwind neutral palette)
- Toolbar layout: horizontaal vs. compact grid op mobile
- Tooltip vs. popover keuze voor pricing model uitleg
- Exacte tekst van de AI-advies samenvatting (2-3 regels)
- Collapse/expand animatie-timing
- Responsive breakpoints voor de herstructurering

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pagina-structuur (huidige staat)
- `src/features/price-comparison/PriceComparisonPage.tsx` — Hoofd-component met alle secties in huidige volgorde
- `src/features/price-comparison/ai-advies/AiAdviesSection.tsx` — AI advies sectie (schoolplan + wizard + analyse)
- `src/features/price-comparison/ai-advies/SchoolplanContextCard.tsx` — Schoolplan banner (wordt geïntegreerd in AI hero)
- `src/features/price-comparison/MeerwaardePanel.tsx` — Differentiators + tijdwinst + migration CTA

### Componenten die herstructureerd worden
- `src/features/price-comparison/ComparisonTable.tsx` — Vergelijkingstabel met detail-panels
- `src/features/price-comparison/ComparisonChart.tsx` — Staafgrafiek (wordt ingeklapt by default)
- `src/features/price-comparison/CitoBundleSelector.tsx` — Cito bundel toggle
- `src/features/price-comparison/DiaBundleSelector.tsx` — DIA bundel selector
- `src/features/price-comparison/PeriodToggle.tsx` — Contractperiode toggle
- `src/features/price-comparison/SchoolplanBanner.tsx` — Schoolplan banner (wordt onderdeel van AI hero)

### State management
- `src/features/price-comparison/store.ts` — Zustand store met initialize(), recalculate(), visibleProviders, bundel/periode state
- `src/features/price-comparison/wizard/wizard-store.ts` — Wizard state

### Data bronnen
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS (verhuist naar AI-advies context)
- `src/data/providers/index.ts` — PROVIDER_CONFIGS met pricingStrategy (voor toolbar tooltips)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PriceComparisonPage.tsx` — Container met alle secties; herordenen zonder nieuwe componenten te bouwen
- `AiAdviesSection.tsx` — Bevat al SchoolplanContextCard + ComparisonWizard + AnalysisPanel; samenvoeging met SchoolplanBanner past hier
- `ComparisonSummary` (inline in PriceComparisonPage) — Refactoren: differentiators-lijst verwijderen, alleen totalen+verschil behouden
- `MeerwaardePanel.tsx` — DifferentiatorsSection verwijderen, TimeSavingsSection + BusinessCaseCTA behouden
- `ProviderSelector` + `PricingModelCards` (inline in PriceComparisonPage) — Samenvoegen tot toolbar-component

### Established Patterns
- Tailwind CSS 4 met Cito design tokens (`bg-cito-primary`, `text-cito-primary`)
- Zustand store met `persist` middleware + `getState()` reads (geen hooks in store)
- `<details>/<summary>` voor collapsible secties (gebruikt door PricingModelCards)
- Provider kleurschema: Cito=#003082, DIA=#FF6600, JIJ=#22C55E, SAQI=#8B5CF6

### Integration Points
- `usePriceComparisonStore` — Alle secties lezen hier; herordening raakt geen data-flow
- `useSchoolProfileStore` — School data voor module-selectie en student counts
- `useWizardStore` — Wizard state voor AI-advies hero
- ComparisonTab (school profile) wraps PriceComparisonPage — geen changes needed daar

</code_context>

<specifics>
## Specific Ideas

- Kleurzones (afwisselende lichtgrijs/wit banden) als visuele sectie-scheiding — vergelijkbaar met moderne dashboard-designs
- AI hero moet een "samenvattings-modus" hebben: 2-3 regels conclusie die de kern van het advies bevatten, met expand voor het volledige verhaal
- De tabel is het hart van de pagina voor consultants — die moet altijd zichtbaar zijn zonder scrollen voorbij de AI hero + totalen
- Provider toolbar combineert checkboxes + pricing info in één rij: "Vergelijk: [✓ Cito] [✓ DIA ℹ️] [☐ JIJ ℹ️] [☐ SAQI ℹ️]" waar ℹ️ een tooltip/popover opent met het prijsmodel
- Self-explanatory: tooltips op termen als "bundel", "contractperiode", "per leerling/jaar" zodat stakeholders begrijpen wat ze zien

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready*
*Context gathered: 2026-03-28*
