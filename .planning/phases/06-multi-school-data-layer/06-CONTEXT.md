# Phase 6: Multi-School Data Layer - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Applicatie ondersteunt meerdere schoolprofielen met persistente opslag (IndexedDB via Dexie), bestaande v1-data wordt behouden via migratie, en navigatie werkt met browser-history en deep linking. Schoolprofielen zijn het fundament waar alle latere fasen (intelligence, intake, vergelijking, export) op bouwen. Schoolspecifieke CRM-functionaliteit (contactpersonen, pipeline, gesprekshistorie) komt in Phase 7.

</domain>

<decisions>
## Implementation Decisions

### App-opening & schooloverzicht
- **D-01:** Slimme routing bij app-opening: 0 scholen → direct naar lege schooloverzicht met "Voeg school toe" actie. 1 school → direct naar die school. 2+ scholen → schooloverzicht.
- **D-02:** Schooloverzicht is dashboard-achtig: kaarten met mini-samenvatting per school — schooltype, niveaus, aantal leerlingen, geselecteerde modules, laatst berekend resultaat. Bijna een preview, genoeg om te kiezen zonder te openen.
- **D-03:** Zoekbalk met tekstfilter in het schooloverzicht (simpel filter nu, uitbreiden met pipeline-status badges en sortering in Phase 7 / SCHOOL-06).
- **D-04:** "Nieuwe school toevoegen" is altijd een bewuste actie vanuit het schooloverzicht, nooit vanuit een lopend gesprek of vergelijking. Exacte knop-plaatsing naar Claude's discretie.

### v1-migratie ervaring
- **D-05:** Migratiewizard bij eerste keer openen met v1-data: "We hebben uw data gevonden. Wilt u een naam geven aan dit schoolprofiel?" Gebruiker geeft naam, bevestigt, klaar.
- **D-06:** Schoolnaam bij migratie wordt afgeleid uit bestaande data als suggestie (bijv. "HAVO/VWO-school" op basis van geselecteerde niveaus), gebruiker kan aanpassen.
- **D-07:** Nieuwe gebruikers (geen v1-data) starten met een leeg schooloverzicht met duidelijke "Voeg school toe" actie.
- **D-08:** Bij mislukte migratie (corrupt localStorage): eerlijke foutmelding — "Uw eerdere gegevens konden niet worden overgezet. U kunt opnieuw beginnen." Geen stille fallback.

### Schoolprofiel CRUD-interactie
- **D-09:** Nieuwe school aanmaken via de volledige 5-staps wizard (bestaande wizard + naamveld erbij). Wizard is de standaard aanmaakroute.
- **D-10:** Bewerken via twee routes: wizard als hoofdroute (school openen → wizard met ingevulde data), plus snelkoppelingen vanuit de resultaatweergave naar specifieke wizard-stappen (bijv. "modules wijzigen").
- **D-11:** Verwijderen met bevestigingsdialoog: "Weet u zeker dat u [schoolnaam] wilt verwijderen? Dit kan niet ongedaan worden gemaakt." Geen soft delete.
- **D-12:** Automatisch opslaan per wizard-stap. Elke stap slaat tussentijds op naar IndexedDB. Profiel is altijd zo compleet als waar de gebruiker is gekomen. Incompleet profiel verschijnt in de lijst (met indicator).

### URL-structuur & back-button gedrag
- **D-13:** Diepe URLs tot wizard-stap niveau: `/scholen/{slug}/wizard/3`, `/scholen/{slug}/vergelijking`, `/scholen/{slug}/migratie` etc.
- **D-14:** Leesbare slugs in URLs afgeleid van schoolnaam: `/scholen/montessori-college-oost/vergelijking`. Slug moet stabiel blijven of updaten bij naamwijziging.
- **D-15:** Echte browser history — back-button gedrag hangt af van waar je vandaan kwam. Vanuit wizard → terug naar vorige wizard-stap of overzicht. Vanuit overzicht direct naar school → back naar overzicht. Browser history bepaalt.
- **D-16:** Niet-bestaande school URL → redirect naar schooloverzicht met korte melding "Dit schoolprofiel bestaat niet meer."

### Claude's Discretion
- Exacte schoolkaart-design in het overzicht (layout, info-hiërarchie, spacing)
- Router library keuze (TanStack Router vs eigen History API wrapper)
- Dexie schema-ontwerp en indexen
- Slug-generatie logica en collision handling
- Migratiewizard UI-ontwerp en stappen
- Indicator-design voor incomplete profielen
- Loading states en skeleton screens
- Exacte plaatsing van "nieuwe school" knop

</decisions>

<specifics>
## Specific Ideas

- Schooloverzicht als dashboard met mini-preview kaarten — vergelijkbaar met hoe een CRM contactkaarten toont
- Migratiewizard moet warm aanvoelen: "We hebben uw data gevonden" — niet technisch, niet eng
- Naamveld bij school-aanmaak als eerste stap van de wizard, niet als apart scherm ervoor
- Auto-save per stap betekent dat de accountmanager halverwege kan stoppen voor een telefoontje en later verder kan

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 requirements
- `.planning/REQUIREMENTS.md` — ARCH-01 (multi-school CRUD), ARCH-02 (v1 migratie), ARCH-03 (IndexedDB/Dexie), ARCH-04 (browser routing/deep linking), MODE-01 (Nederlands u-vorm), MODE-03 (tablet touch)
- `.planning/PROJECT.md` — Key decisions: Dexie/IndexedDB, reuse v1 code iteratively, schoolprofielen lokaal

### Bestaande code en patronen
- `src/features/school-profile/store.ts` — Huidige Zustand store met localStorage persist. Persist keys: `rekentool-school-profile`. Moet school-ID aware worden.
- `src/features/price-comparison/store.ts` — Zustand store met localStorage persist. Persist key: `rekentool-price-comparison`. Leest school profile via `getState()`.
- `src/App.tsx` — Huidige view routing via `useState<View>`. Moet vervangen door URL-gebaseerde router.
- `src/models/school.ts` — SchoolLevel, Scenario, CurrentProvider, ModuleCurrentSetup types. Uit te breiden met SchoolProfile (id, naam, slug, metadata).
- `src/features/school-profile/schemas/` — Zod schemas per wizard-stap. Uit te breiden met naamveld.
- `src/features/school-profile/components/WizardShell.tsx` — 5-staps wizard. Moet 6e stap of naamveld integreren.

### Prior phase context
- `.planning/phases/01-fundament/01-CONTEXT.md` — Wizard-flow, module-selectie, prijsdata-model, bewerkbare aannames
- `.planning/phases/02-prijsvergelijking/02-CONTEXT.md` — Vergelijkingsweergave, staafdiagram, onderscheidend vermogen, handmatige prijsinvoer

### Stack
- `.planning/STATE.md` — Accumulated decisions: React 19, Zustand 5, Zod v4, Vite 8, Tailwind CSS 4, Recharts 3

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Zustand persist pattern**: Beide stores gebruiken `persist` middleware met localStorage. Vervangen door Dexie-backed persistence.
- **WizardShell + WizardSteps**: 5-staps wizard met `forwardRef` + `useImperativeHandle` submit pattern. Herbruikbaar, naamveld toevoegen.
- **Zod + react-hook-form validatie**: Schema-per-stap patroon in `schemas/`. Uitbreiden met naam-schema.
- **Pure engine functies**: `calculateComparison()`, `calculateCurrentVsProposed()`, `calculateMigration()` — ongewijzigd, werken op input parameters.
- **AI intake extractie**: `src/lib/ai-intake.ts` — herbruikbaar voor alle scholen, geen wijziging nodig.

### Established Patterns
- **Store interactie**: Price comparison store leest school profile via `getState()` (niet hooks) — dit patroon blijft.
- **Draft/applied override systeem**: Twee-laags override merging in price comparison store — per school opslaan.
- **Module sync**: `setSelectedModules` synct automatisch `moduleSetups` — bewaren.
- **View routing via callbacks**: `handleWizardComplete` bepaalt view op basis van scenario + moduleSetups — vervangen door URL-navigatie.

### Integration Points
- **App.tsx view state → URL router**: `useState<View>` moet vervangen worden door router-gestuurde views
- **localStorage persist → Dexie**: Zustand persist middleware moet naar IndexedDB schrijven per school-ID
- **School selector → store loading**: Bij schoolwissel moet store geladen worden met data van geselecteerde school
- **Wizard completion → URL navigatie**: Na wizard redirect naar juiste view-URL i.p.v. `setView()` callback
- **Package.json**: Dexie en router library moeten geïnstalleerd worden (nog niet aanwezig)

</code_context>

<deferred>
## Deferred Ideas

- Doorzoekbaar overzicht met pipeline-status badges en sortering — Phase 7 (SCHOOL-06)
- Contactpersonen, productgebruik, gesprekshistorie per school — Phase 7
- Offline werking via service worker — Phase 11 (ARCH-05)
- School data export/import voor overdracht tussen collega's — FUTURE-04

</deferred>

---

*Phase: 06-multi-school-data-layer*
*Context gathered: 2026-03-21*
