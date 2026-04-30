# Phase 11: Waarde-engine & Migratie - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Onderbouwen van de totale waarde van Cito: prijsverschil (uit Phase 10) plus tijdwinst in euro's, meerjarenprojectie met break-even, migratie-businesscase (huidig naar nieuw Cito-platform), en automatische upsell-detectie. Nieuwe "Waarde" tab in het schoolprofiel met hero-samenvatting en 3 secties. Upsell-kansen zichtbaar op school-dashboard en schooloverzicht.

</domain>

<decisions>
## Implementation Decisions

### Waarde-tab Locatie & Structuur
- **D-01:** Nieuwe 6e tab "Waarde" in het schoolprofiel, naast Dashboard/Vergelijking/Producten/Contacten/Gesprekken. Past bij het bestaande tab-patroon uit Phase 7.
- **D-02:** Hero-kaart bovenaan met totale jaarlijkse waarde: prijsverschil (uit Phase 10 vergelijking) + tijdwinst + migratie-effect gecombineerd in één bedrag.
- **D-03:** Drie secties onder de hero: (1) Tijdwinst nieuw platform, (2) Migratie huidig naar nieuw, (3) Meerjarenprojectie.

### Tijdwinst Presentatie
- **D-04:** Tabel met inline editing voor de 5 TIME_SAVING_TASKS. Kolommen: Taak | Oud | Nieuw | Uren/jaar (bewerkbaar) | euro/jaar. Totaalrij onderaan.
- **D-05:** Uurtarief per school instelbaar, opgeslagen bij het schoolprofiel. Default euro 50 (CAO VO).
- **D-06:** Uren per taak per school bewerkbaar en persistent opgeslagen. Defaults uit TIME_SAVING_TASKS.
- **D-07:** Tijdwinst-tabel altijd zichtbaar — ook in externe modus. Tijdwinst is een sterk verkoopargument, niet sales-sensitief.

### Migratie Business Case
- **D-08:** Migratie-sectie altijd tonen, ook met placeholder-prijzen. Duidelijke waarschuwingsbanner: "Migratieprijzen zijn indicatief — vul werkelijke tarieven in." Prijzen inline bewerkbaar met asterisk-markering bij placeholders.
- **D-09:** Per-module tabel: Module | Huidig | Nieuw | Verschil. Totaalrij onderaan.

### Meerjarenprojectie
- **D-10:** Recharts staafdiagram met 3 staven (1/3/5 jaar) voor cumulatieve besparing. Consistent met Phase 10 staafdiagram-patroon.
- **D-11:** Compacte tabel onder het diagram met exacte bedragen per jaar.
- **D-12:** Break-even punt t.o.v. bewerkbare overstapkosten. Default euro 0. Toon in welke maand de cumulatieve besparing de overstapkosten terugverdient.
- **D-13:** Overstapkosten per school opslaan in het schoolprofiel. Persistent.

### Upsell-detectie
- **D-14:** Upsell-kans criterium: school gebruikt concurrent voor module EN (Cito is goedkoper OF Cito heeft differentiators). Combineert prijs + waarde.
- **D-15:** Signaal-sterkte: groen (goedkoper + differentiators), geel (goedkoper OF differentiators), rood (duurder + geen differentiators = geen kans, niet tonen).
- **D-16:** Dashboard-kaart op het school-dashboard: "X upsell-kansen" met per module de besparing per leerling en link naar Vergelijking-tab.
- **D-17:** Badge "X kansen" op schoolkaarten in het schooloverzicht (lijst en kanban). Accountmanager ziet in één oogopslag welke scholen upsell-potentieel hebben.

### Claude's Discretion
- Exacte Supabase schema-uitbreiding voor per-school uurtarief, uren-overrides en overstapkosten
- Styling van de hero-kaart (kleuren, grootte, iconen)
- Responsive gedrag van de Waarde-tab op tablet
- Animaties bij inline editing en herberekening
- Exacte berekening van break-even maand (lineaire interpolatie)
- Hoe de upsell-engine de Phase 10 comparison data en Phase 7 productgebruik combineert
- Loading states bij het ophalen van prijsdata voor de hero-samenvatting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande migratie-engine
- `src/engine/migration.ts` — calculateMigration() met modules, timeSavings, multiYearProjection (uitbreiden met overstapkosten en break-even)
- `src/models/migration.ts` — TimeSavingTask type en TIME_SAVING_TASKS (5 taken met defaults)
- `src/data/cito-migration-prices.ts` — CitoMigrationPriceRecord[] met placeholder-prijzen (oud = nieuw)
- `src/data/default-assumptions.ts` — DEFAULT_ASSUMPTIONS met uurtarief euro 50

### Vergelijkingsengine (Phase 10)
- `src/engine/price-comparison.ts` — calculateComparison() voor prijsverschil-data in hero-kaart
- `src/engine/sales-signals.ts` — Sales-signalen logica (hergebruiken voor upsell-detectie)
- `src/engine/sensitivity.ts` — Gevoeligheidsanalyse (referentie voor berekeningspatronen)
- `src/data/differentiators.ts` — MODULE_DIFFERENTIATORS (basis voor upsell signaal-sterkte)

### Schoolprofiel & Dashboard
- `src/features/school-profile/tabs/` — Bestaande tabs (DashboardTab, ComparisonTab, ProductsTab, ContactsTab, ConversationsTab) — Waarde-tab toevoegen
- `src/features/school-overview/` — Schooloverzicht met kaarten — upsell-badge toevoegen
- `src/hooks/useSchoolPrices.ts` — Schoolspecifieke prijzen uit Supabase

### Bestaande migratie-UI (v1 data migratie, NIET de business case)
- `src/features/migration/MigrationWizard.tsx` — v1 naar v2 data migratie wizard (niet verwarren met migratie business case)

### Prior context
- `.planning/phases/10-prijsvergelijking-gevoeligheid/10-CONTEXT.md` — Phase 10 beslissingen: DIA-pakketten, hybride scenario, gevoeligheid, sales-signalen, interne/externe modus
- `.planning/REQUIREMENTS.md` — WAARDE-01..04, MIGR-01..03, SCHOOL-07

### Project
- `.planning/PROJECT.md` — Tijdwinst nieuw platform (5 taken), DMU-realiteit, constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **calculateMigration()** (`src/engine/migration.ts`): Pure engine met modules, timeSavings, multiYearProjection — uitbreiden met overstapkosten en break-even maand
- **TIME_SAVING_TASKS** (`src/models/migration.ts`): 5 taken met id, labels, old/new methode en defaultHoursPerYear
- **sales-signals.ts** (`src/engine/sales-signals.ts`): Signaal-logica op basis van prijsverschil en differentiators — hergebruiken/uitbreiden voor upsell-detectie
- **MODULE_DIFFERENTIATORS** (`src/data/differentiators.ts`): Per-aanbieder differentiator-data — input voor upsell signaal-sterkte
- **EditableAssumption** component: Bestaand patroon voor bewerkbare aannames — hergebruiken voor inline uren-editing
- **Recharts staafdiagram** (ComparisonChart): Bestaand chart-patroon — hergebruiken voor meerjarenprojectie
- **PriceBadge**: Prijsstatus-badges — hergebruiken voor placeholder-markering bij migratieprijzen

### Established Patterns
- **Pure engine functies**: Rekenmotor gescheiden van UI (engine/ directory) — behouden
- **Zustand store + getState()**: Store leest via getState(), niet hooks — behouden
- **Supabase + React Query**: Data fetching patroon uit Phase 8/9 — voor per-school data
- **Tab-routing in schoolprofiel**: Bestaand tab-patroon — 6e tab toevoegen
- **Interne/externe modus toggle**: Phase 10 patroon — tijdwinst altijd zichtbaar per D-07

### Integration Points
- **School dashboard**: DashboardTab.tsx — upsell-kaart toevoegen
- **School overview kaarten**: Schooloverzicht-componenten — upsell-badge toevoegen
- **Hero-kaart leest**: Phase 10 comparison result (prijsverschil) + migration result (tijdwinst + migratie)
- **Supabase schema**: Uitbreiden voor per-school hourlyRate, timeSavingOverrides, switchingCosts
- **Tab navigatie**: TabNavigation component — 6e tab "Waarde" toevoegen

</code_context>

<specifics>
## Specific Ideas

- Hero-kaart toont het "headline number" voor elk verkoopgesprek: totale jaarlijkse waarde die de overstap oplevert
- Migratieprijzen zijn placeholders — UI moet duidelijk maken dat de businesscase pas betrouwbaar is na invullen werkelijke tarieven
- Upsell-detectie combineert prijs (Phase 10) + differentiators (bestaande data) + productgebruik (Phase 7) tot automatische kansen
- Overstapkosten als bewerkbaar veld maakt break-even berekening concreet voor MT/finance DMU
- Alles per school opslaan (uurtarief, uren, overstapkosten) zodat elk gesprek op maat is

</specifics>

<deferred>
## Deferred Ideas

- DMU-gerichte PDF-exports met waarde-data (coordinator/MT/finance perspectief) — Phase 12
- AI-gestuurde suggestie voor uurtarief op basis van schooltype/regio — FUTURE
- Scenario-vergelijking: meerdere overstap-scenario's naast elkaar — FUTURE
- Upsell-kansen als notificatie/alert bij nieuw vastgelegde prijzen — FUTURE

</deferred>

---

*Phase: 11-waarde-engine-migratie*
*Context gathered: 2026-03-23*
