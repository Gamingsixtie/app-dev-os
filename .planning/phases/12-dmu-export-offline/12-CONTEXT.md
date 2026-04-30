# Phase 12: DMU-Export & Offline - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Accountmanager kan na elk gesprek direct een op de DMU afgestemd PDF-rapport genereren (coordinator, MT, finance) met schoolspecifieke data en Cito-huisstijl, vergelijking kopiëren naar clipboard, en de applicatie werkt offline op tablet met volledige functionaliteit.

</domain>

<decisions>
## Implementation Decisions

### PDF Rapport Inhoud & DMU-afstemming
- Dezelfde secties in andere volgorde per DMU-rol + aangepaste samenvatting — bestaand `dmu-filters.ts` patroon uitbouwen (geen aparte templates)
- 3-5 bullet points samenvatting afgestemd op DMU-focus: practical (coordinator), strategic (MT), financial (finance)
- Grafieken als statische SVG-afbeeldingen in PDF opnemen — visuele impact voor MT/finance
- Schoolplan-kansen (Phase 14 data) als optionele sectie meenemen wanneer beschikbaar

### Clipboard & Deelbaarheid
- Clipboard-format: geformatteerde tekst (markdown-achtig) met schoolnaam, totalen en conclusie — plakbaar in email/Teams
- Clipboard-inhoud: schoolnaam, geselecteerde modules, totaalverschil per aanbieder, tijdwinst in euro's, conclusie
- Geen "deel via email" optie — clipboard volstaat, accountmanager plakt zelf

### Offline & Service Worker
- Cache-first strategie voor assets + stale-while-revalidate voor API data — snelste tablet-ervaring
- Subtiele offline-banner bovenaan: "Offline modus — data kan verouderd zijn"
- Alle schoolprofielen + prijsdata + vergelijkingen offline beschikbaar — volledige functionaliteit
- Queue mutaties lokaal bij offline, sync bij reconnect — custom queue met conflict detection

### Claude's Discretion
- Exacte SVG rendering approach voor Recharts charts in @react-pdf/renderer
- Service worker implementatie details (Workbox vs custom)
- Offline queue storage mechanisme en conflict resolution strategie
- Clipboard API fallback voor oudere browsers
- PDF pagina-indeling en whitespace
- Offline data sync UI (progress indicator bij reconnect)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/export/` — ExportTab, ExportConfigPanel, ExportPreview, PdfDownloadButton al gebouwd
- `src/features/export/pdf/ReportDocument.tsx` — @react-pdf/renderer Document met secties
- `src/features/export/pdf/dmu-filters.ts` — DMU-rol filtering en sectie-reordering (coordinator/mt/finance/generiek)
- `src/features/export/pdf/styles.ts` — PDF styling met Cito-huisstijl
- `src/features/export/pdf/components/` — PdfHeader, PdfFooter, SummarySection, PriceComparisonSection, ValueReportSection
- `src/features/export/types.ts` — ReportType, DmuTarget, ExportConfig, ReportData types
- `@react-pdf/renderer` al geïnstalleerd (^4.3.2)

### Established Patterns
- ExportTab berekent comparison en migration data via hooks en geeft door aan PDF components
- DMU-filtering via `getReportSections()` — reorder + summaryFocus per rol
- Supabase voor data persistence, React Query voor data fetching
- Zustand stores voor UI state (price-comparison store, school-profile store)

### Integration Points
- ExportTab al geïntegreerd in school-profile tabs
- `calculateComparison()` en `calculateMigration()` engines leveren data
- School data via `useSchool()` hook (React Query)
- Prijsdata via `useSchoolPrices()` hook
- Schoolplan-analyse data in school record (Phase 14)

</code_context>

<specifics>
## Specific Ideas

- Cito-huisstijl in PDF: Primary #003082, Accent #FF6600, Background #F8F9FA
- Bronvermelding en disclaimer verplicht in elk rapport (al aanwezig in ReportDocument.tsx)
- PDF per DMU-rol: coordinator (tijdwinst, dagelijks gebruik), MT (overzicht, onderbouwing, strategische waarde), finance (euro's, meerjarenprojectie, terugverdientijd)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
