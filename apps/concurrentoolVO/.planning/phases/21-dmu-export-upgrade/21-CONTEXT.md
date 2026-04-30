# Phase 21: DMU-Export Upgrade - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Het bestaande export-tabblad wordt uitgebreid met intelligente, DMU-gerichte rapporten. Per DMU-rol (coördinator, MT/directie, finance) worden rapporten gegenereerd met rolspecifieke inleidingsteksten op basis van generieke aannames, onderbouwd met Cito-bronmateriaal en (indien beschikbaar) schoolplan-analyse. PDF krijgt een cover page met Cito-logo.

</domain>

<decisions>
## Implementation Decisions

### Rapport-inhoud per DMU-rol
- **D-01:** Elke DMU-rol krijgt een eigen inleidende alinea met aannames over wat die rol belangrijk vindt. Bijv. coördinator: "Als dagelijks gebruiker is tijdwinst het meest relevant." Secties zelf blijven data-gedreven (bestaande reorder + filter logica).
- **D-02:** DMU-aannames zijn bewerkbaar per export-sessie. Defaults komen uit een statisch databestand (dmu-assumptions.ts), maar de gebruiker kan ze tweaken in het ExportConfigPanel bij het genereren van een rapport. Geen opslag per school — elke export begint met de defaults.

### Cito-bronmateriaal integratie
- **D-03:** Bronmateriaal wordt opgeslagen in een statisch TypeScript databestand (bijv. cito-product-info.ts) met per module: productomschrijving, USP's, onderscheidende features.
- **D-04:** Elk voordeel in het databestand krijgt tags (bijv. 'tijdwinst', 'financieel', 'strategisch'). DMU-rolfilter selecteert relevante voordelen op basis van tags. Schaalt goed en is consistent met de rest van het systeem.
- **D-05:** Bronvermeldingen worden opgenomen per stuk productinformatie (bijv. "Bron: Cito Productsheet 2025"). Verhoogt geloofwaardigheid van het rapport.

### Schoolplan-verwerking in rapport
- **D-06:** Schoolplan-kansen worden per DMU-rol gefilterd op relevantie, met dezelfde tag-structuur als het bronmateriaal. Coördinator ziet dagelijks-gebruik gerelateerde kansen, MT ziet strategische thema's, finance ziet financieel voordelige kansen.
- **D-07:** Als er geen schoolplan beschikbaar is, wordt de sectie overgeslagen met een korte melding in de samenvatting: "Upload een schoolplan voor een nog specifiekere onderbouwing."

### PDF-huisstijl en kwaliteit
- **D-08:** Cover page toevoegen met Cito-logo (geleverd door gebruiker als bestand in src/assets/), schoolnaam, datum en rapporttype. Rest van de huisstijl (kleuren, typografie, structuur) is al voldoende.
- **D-09:** Cover page toont: schoolnaam, datum, DMU-doelgroep, rapporttype. Geen accountmanager-naam.

### Claude's Discretion
- Technische implementatie van het tag-filter systeem (shared utility of per-component)
- Structuur van het dmu-assumptions.ts en cito-product-info.ts databestand
- Layout en design van de cover page binnen de bestaande Cito-huisstijl
- Hoe de bewerkbare aannames UI er in ExportConfigPanel uitziet (accordion, modal, inline edit)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export systeem (bestaand)
- `src/features/export/ExportTab.tsx` — Huidige export orchestratie, data flow, ReportData opbouw
- `src/features/export/types.ts` — ExportConfig, ReportData, DmuTarget types
- `src/features/export/pdf/dmu-filters.ts` — Bestaande DMU-filter logica (section reorder + summaryFocus)
- `src/features/export/pdf/ReportDocument.tsx` — Hoofdcomponent PDF-generatie
- `src/features/export/pdf/styles.ts` — Cito-huisstijl constanten en StyleSheet
- `src/features/export/pdf/components/SummarySection.tsx` — Rolspecifieke summary bullets (getSummaryBullets)
- `src/features/export/pdf/components/SchoolplanSection.tsx` — Bestaande schoolplan-weergave in PDF
- `src/features/export/components/ExportConfigPanel.tsx` — DMU-target en rapporttype selectie UI

### Data en engines
- `src/engine/price-comparison.ts` — ComparisonResult type en calculateComparison
- `src/engine/migration.ts` — MigrationResult type en calculateMigration
- `src/hooks/useSchoolplanAnalysis.ts` — Schoolplan analysis data hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ExportConfigPanel` — Bestaande radio-button UI voor rapporttype + DMU-target selectie. Uitbreiden met aannames-editor.
- `dmu-filters.ts` — `getReportSections()` herordent en filtert secties per DMU-rol. Tag-systeem kan hier aansluiten.
- `SummarySection` — `getSummaryBullets()` genereert rolspecifieke bullets. Uitbreiden met inleidingstekst.
- `SchoolplanSection` — Bestaande schoolplan-rendering. Uitbreiden met DMU-filtering.
- `PdfHeader` / `PdfFooter` — Bestaande header/footer componenten. Cover page is een nieuwe Page vóór deze.

### Established Patterns
- `@react-pdf/renderer` voor alle PDF-generatie — Document > Page > View/Text structuur
- Cito-kleuren en stijlen in `styles.ts` met `CITO_COLORS` constanten
- Data files in `src/data/` voor statische configuratie (default-prices.ts, cito-migration-prices.ts als voorbeelden)
- DMU-targets als union type: `'coordinator' | 'mt' | 'finance' | 'generiek'`

### Integration Points
- `ExportTab.tsx` passeert `ReportData` aan `ReportDocument` — nieuwe data (bronmateriaal, aannames) moet hier doorgesluisd
- `ExportConfigPanel` ontvangt `ExportConfig` — type uitbreiden met aannames-overschrijvingen
- `useSchoolplanAnalysis` hook levert schoolplan-data — al geïntegreerd in ExportTab

</code_context>

<specifics>
## Specific Ideas

- Tag-structuur voor zowel bronmateriaal als schoolplan-kansen — één gedeeld filter-mechanisme per DMU-rol
- Cito-logo wordt aangeleverd door gebruiker en geplaatst in `src/assets/cito-logo.png`
- Bronvermeldingen per productinformatie-item (bijv. "Bron: Cito Productsheet 2025")
- Cover page: eenvoudig, schoolnaam + datum + rapporttype + DMU-doelgroep

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-dmu-export-upgrade*
*Context gathered: 2026-03-26*
