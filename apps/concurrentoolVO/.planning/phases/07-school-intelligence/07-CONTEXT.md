# Phase 7: School Intelligence - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Schoolprofielen met CRM-lite functionaliteit: per school een compleet profiel met contactpersonen (DMU-mapping), productgebruik, gesprekshistorie met tijdlijn, pipeline-status en een kanban-actielijst. Het schooloverzicht wordt uitgebreid met rijke kaarten, statusbadges, filtering en een pipeline-view. Accountmanager kan snel de juiste school vinden en ziet per school alle relevante context.

AI-intake (Phase 8), prijsvergelijking-engine (Phase 9) en DMU-export (Phase 11) zijn ook binnen scope — deze fase bouwt de datastructuren en UI die latere fasen consumeren.

</domain>

<decisions>
## Implementation Decisions

### Schoolprofiel-detailpagina
- **D-01:** Dashboard-first layout — bij openen van een school zie je bovenaan een samenvattingsblok (pipeline-status, laatst contact, aantal modules, snelle acties), daaronder horizontale tabs
- **D-02:** Tab-volgorde: Overzicht (dashboard) | Vergelijking | Producten | Contacten | Gesprekken
- **D-03:** Context-slimme acties passen zich aan op pipeline-status: prospect ziet "Vergelijking maken", bestaande klant ziet "Migratie bekijken", at-risk ziet "Laatste gesprek bekijken"
- **D-04:** Wizard-data (naam, niveaus, leerlingaantallen, modules, scenario) is inline bewerkbaar in het profiel — geen wizard heropenen nodig
- **D-05:** Vergelijkingsresultaten (prijsvergelijking, business case) zijn een geïntegreerde tab binnen het schoolprofiel
- **D-06:** Schoolkaarten in het overzicht zijn configureerbaar: gebruiker kiest compact (naam + status + datum) of uitgebreid (status-badge + modules-samenvatting + laatst contact + volgende actie)

### Contactpersonen & DMU-rollen
- **D-07:** Uitgebreide contactvelden: naam, DMU-positie (dropdown: coordinator/MT/finance/overig), functietitel, e-mail, telefoon, voorkeurs-communicatiekanaal, beslissingsbevoegdheid (adviserend/beslissend/budgethouder), "laatste contact" datum, notities
- **D-08:** Eén primair contactpersoon per school, verschijnt op de schoolkaart in het overzicht
- **D-09:** Meerdere contactpersonen per DMU-rol toegestaan (bijv. twee coördinatoren onderbouw + bovenbouw)
- **D-10:** Contactpersonen verschijnen context-gebonden: bij gesprekken (wie sprak je), bij exports (voor wie), bij productoverzicht (wie is verantwoordelijk)
- **D-11:** Verwijderen geblokkeerd zolang er gesprekken aan gekoppeld zijn — eerst ontkoppelen
- **D-12:** Cross-school zoeken op contactpersonen: niet in Phase 7, later toevoegen als behoefte blijkt

### Gespreksnotities
- **D-13:** Hybride invoer: verplichte metadata (datum, contactpersoon uit dropdown) + vrij tekstveld voor inhoud. Phase 8 verrijkt de vrije tekst via AI
- **D-14:** Tijdlijn-weergave: chronologisch, nieuwste bovenaan, met datum-headers en contactpersoon-initialen
- **D-15:** Tijdlijn bevat ook systeemgebeurtenissen: "Vergelijking gemaakt", "Prijzen bijgewerkt", "Pipeline-status gewijzigd naar X"
- **D-16:** Vrije tags per gesprek — gebruiker maakt eigen tags aan (bijv. "pricing", "demo", "klacht")
- **D-17:** Gesprekken volledig bewerkbaar na opslaan (datum, contactpersoon, tekst, tags)
- **D-18:** Doorzoekbaar: zoekbalk boven de tijdlijn, zoekt op tekst, contactpersoon en tag
- **D-19:** Kanban-actielijst per school met drie kolommen: te doen | in uitvoering | afgerond. Elke actie linkt terug naar het brongespreksnotitie

### Pipeline & statusbeheer
- **D-20:** Lineaire pipeline: Prospect → Contact gelegd → Demo/Presentatie → Offerte → Gewonnen → Verloren
- **D-21:** Statuswijziging via dropdown in het profiel (dashboard-tab) + drag & drop in kanban-view
- **D-22:** Kanban-view als apart tabblad in het schooloverzicht ("Lijst" en "Pipeline")
- **D-23:** Statuswijzigingen automatisch gelogd in de tijdlijn als systeemevent
- **D-24:** Vooruit in pipeline is vrij, terug vereist een korte toelichting (verschijnt in tijdlijn)
- **D-25:** Filterbar in schooloverzicht: Alle | Prospect | Contact gelegd | Demo | Offerte | Gewonnen | Verloren
- **D-26:** Kleurgecodeerde statusbadges: grijs=prospect, blauw=contact gelegd, paars=demo, oranje=offerte, groen=gewonnen, rood=verloren
- **D-27:** Bij status "Verloren": verplicht concurrent selecteren (DIA/JIJ/overig) + optionele reden

### Claude's Discretion
- Exacte dashboard-layout en spacing
- Kaart-design voor contactpersonen en gesprekken
- Kanban-board implementatie (drag & drop library keuze)
- Animaties en transities bij tabwisseling
- Responsive gedrag op tablet
- Tijdlijn-styling (iconen, kleuren per event-type)
- Empty states per tab
- Inline-editing UX voor wizard-data (welke velden hoe bewerkbaar)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schoolprofiel & data
- `.planning/PROJECT.md` — Projectvisie, DMU-realiteit op scholen, constraints (taal, huisstijl, tech stack)
- `.planning/ROADMAP.md` — Phase 7 success criteria, requirements SCHOOL-01..06 en PRIJS-07

### Bestaande fase-context
- `.planning/phases/01-fundament/01-CONTEXT.md` — Wizard-flow, module-selectie, prijsdata-model, bewerkbare aannames
- `.planning/phases/02-prijsvergelijking/02-CONTEXT.md` — Vergelijkingsweergave, staafdiagram, prijsinvoer, onderscheidend vermogen

### Bestaande code (Phase 6 — reeds geïmplementeerd)
- `src/db/database.ts` — Dexie schema met schools table en indexes
- `src/db/types.ts` — SchoolRecord interface (basis — moet uitgebreid worden met contactpersonen, gesprekken, pipeline)
- `src/db/operations.ts` — CRUD operaties (createSchool, updateSchoolData, deleteSchool, getSchoolBySlug, getAllSchools)
- `src/models/school.ts` — SchoolLevel, Scenario, CurrentProvider, ModuleCurrentSetup types
- `src/router/routes.ts` — TanStack Router route tree (moet uitgebreid worden met profiel-tabs)
- `src/components/routing/SchoolLayout.tsx` — School-level layout met store hydration
- `src/features/school-overview/SchoolOverviewPage.tsx` — Huidige kaart-weergave (moet uitgebreid met pipeline-view)
- `src/features/school-profile/store.ts` — Zustand store met hydrate() patroon
- `src/features/price-comparison/store.ts` — Prijsvergelijking store (vergelijking-tab leest hieruit)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SchoolRecord + Dexie CRUD**: Basis datastructuur en operaties bestaan — uitbreiden met contacts[], conversations[], pipelineStatus, actions[]
- **SchoolLayout + hydration**: Patroon voor het laden van schooldata bij navigatie — uitbreiden met nieuwe data
- **SchoolOverviewPage + SchoolCard**: Kaart-weergave bestaat — uitbreiden met statusbadges, rijke content, compact/uitgebreid toggle
- **SchoolSearchBar**: Zoekfunctionaliteit bestaat — uitbreiden met statusfilters
- **WizardStep-componenten**: Formuliervelden voor schooldata bestaan — hergebruiken voor inline editing
- **PriceBadge**: Badge-component patroon — herbruikbaar voor pipeline-statusbadges
- **EditableAssumption**: Inline-edit patroon — herbruikbaar voor profiel-velden
- **DeleteSchoolDialog**: Bevestigingsdialoog patroon — herbruikbaar voor verwijderen contactpersonen

### Established Patterns
- **Zustand stores + hydrate()**: Data laden vanuit Dexie bij navigatie
- **Zod v4 schemas**: Validatie per formulier — toepassen op contactpersoon- en gespreksformulieren
- **TanStack Router met $slug**: Dynamische routes per school — uitbreiden met tab-routing
- **useLiveQuery (dexie-react-hooks)**: Reactieve queries op Dexie — gebruiken voor tijdlijn en actielijst
- **react-hook-form + Zod**: Formulierpatroon uit wizard — toepassen op nieuwe formulieren

### Integration Points
- **SchoolRecord uitbreiden**: Nieuwe velden voor contacts, conversations, pipelineStatus, actions, tags, viewPreference
- **Dexie schema versie ophogen**: version(2) met nieuwe indexes (bijv. op pipelineStatus)
- **Router uitbreiden**: Tabs als nested routes onder /scholen/$slug/ (bijv. /scholen/$slug/producten, /scholen/$slug/contacten)
- **SchoolLayout uitbreiden**: Tab-navigatie component toevoegen
- **Vergelijking-tab**: Bestaande PriceComparisonPage/CurrentVsProposedPage/MigrationPage embedden in tab-context
- **Tijdlijn-events**: Systeemevents genereren bij statuswijziging, prijsupdate, vergelijking-creatie

</code_context>

<specifics>
## Specific Ideas

- Context-slimme acties zijn cruciaal: de accountmanager moet in één oogopslag zien wat de logische volgende stap is voor deze school
- Tijdlijn met systeemevents geeft een compleet beeld — niet alleen wat de accountmanager deed, maar ook wat er in het systeem gebeurde
- Kanban-actielijst vervangt geen extern takenbeheersysteem — het is specifiek voor schoolgerelateerde vervolgacties uit gesprekken
- Bij "Verloren" verplicht concurrent vastleggen bouwt over tijd waardevolle competitieve intelligence op
- Configureerbare kaartweergave (compact/uitgebreid) is belangrijk omdat accountmanagers met weinig scholen alles willen zien, en met veel scholen snel willen scannen
- Terug in pipeline alleen met reden voorkomt per-ongeluk-statuswijzigingen en bouwt audit trail

</specifics>

<deferred>
## Deferred Ideas

- AI-gestuurde gespreksverwerking (vrije tekst → gestructureerde data) — Phase 8
- Cross-school zoeken op contactpersonen — backlog, toevoegen als behoefte blijkt
- Automatische herinneringen bij vervolgacties — buiten scope
- Export van schoolprofiel als PDF — Phase 11 (DMU-Export)
- Contractbeheer (looptijd, opzegdatum) — buiten scope, mogelijk toekomstige fase
- Activiteiten-dashboard over alle scholen heen (hoeveel in offerte-fase, hoeveel gewonnen deze maand) — buiten scope

</deferred>

---

*Phase: 07-school-intelligence*
*Context gathered: 2026-03-21*
