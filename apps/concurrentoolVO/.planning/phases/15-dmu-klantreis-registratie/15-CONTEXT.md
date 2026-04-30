# Phase 15: DMU Klantreis Registratie - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Per DMU-contactpersoon een engagement-status registreren die het beslissingsproces binnen de school inzichtelijk maakt. De accountmanager ziet in één oogopslag wie waar staat in de klantreis, wie op wie wacht (interne afhankelijkheden), en waar stagnatie optreedt. DMU-voortgang is zichtbaar op het school-dashboard, op schoolkaarten in het overzicht, en filterbaar in het schooloverzicht.

Dit is NIET een lineaire sales funnel per persoon — het gaat om het in kaart brengen van het beslissingsnetwerk: welke DMU-leden hebben welke bevoegdheid, bij wie moet je zijn voor welk onderdeel, en wie moet intern doorverwijzen naar een andere DMU voor budget of accordering.

</domain>

<decisions>
## Implementation Decisions

### Engagement-statussen
- **D-01:** 6 statussen per contactpersoon: Nog niet benaderd → In gesprek → Positief → Wacht op intern → Akkoord → Afgehaakt
- **D-02:** Vrij heen en weer — elke fase-overgang is toegestaan zonder restricties
- **D-03:** Bij "Afgehaakt": verplichte reden opgeven (vergelijkbaar met school-pipeline "Verloren")
- **D-04:** Bij "Wacht op intern": mogelijkheid om te registreren bij WIE binnen de school (link naar andere contactpersoon)
- **D-05:** Elke statuswijziging wordt automatisch gelogd als systeemevent in de school-tijdlijn met datum en optionele notitie

### Relatie school-pipeline ↔ DMU-klantreis
- **D-06:** School-pipeline en contactpersoon-status zijn onafhankelijk beheerd, maar bij mismatch toont het systeem een suggestie (bijv. "Meeste DMU-leden staan op Akkoord, maar school is nog op Demo — pipeline bijwerken?")

### Visuele weergave — School-dashboard
- **D-07:** DMU-beslissingsoverzicht als matrix/tabel op de bestaande Overzicht-tab (dashboard) — geen nieuwe tab
- **D-08:** Matrix-kolommen: Naam | DMU-rol | Bevoegdheid | Status | Wacht op
- **D-09:** "Wacht op" kolom toont de naam van de contactpersoon waar de DMU op wacht (link naar andere contact), of "—" als niet van toepassing

### Voortgangsindicator
- **D-10:** Compacte DMU-voortgangsindicator op schoolkaarten in het overzicht (bijv. "DMU 3/5 ✓" of gekleurde bolletjes per DMU-lid met statuskleur)
- **D-11:** Zelfde mini DMU-indicator ook op kanban-kaarten in de Pipeline Kanban-view

### Stagnatie-signalen
- **D-12:** Stagnatie-drempel: 30 dagen in dezelfde fase
- **D-13:** Inline oranje waarschuwingsbadge naast de contactpersoon in de DMU-matrix en op de schoolkaart — subtiel maar zichtbaar

### Filtering in schooloverzicht
- **D-14:** Extra filterrij onder de bestaande pipeline-filter in het schooloverzicht: "Toon scholen met DMU in: [status]"
- **D-15:** Pipeline-filter en DMU-status-filter zijn combineerbaar (AND-logica)

### Claude's Discretion
- Exacte kleurcodes per engagement-status (aansluiten bij bestaande statusbadge-patronen)
- Layout en spacing van de DMU-matrix op het dashboard
- Design van de mini DMU-indicator op school- en kanban-kaarten
- UX voor het instellen van "Wacht op" (dropdown van bestaande contactpersonen)
- Mismatch-suggestie UI (toast, inline banner, of badge)
- Stagnatie-badge design en positie
- DMU-filter UI-patroon (chips, dropdown, of checkbox-filter)
- Empty state wanneer school geen contactpersonen heeft

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contactpersonen & DMU (Phase 7 — basis)
- `src/db/types.ts` — Contact interface met id, schoolId, dmuPosition, authority, isPrimary, lastContactDate
- `src/models/school.ts` — DMU_POSITIONS, DMUPosition, AuthorityLevel, PIPELINE_STATUSES, PipelineStatus types
- `src/db/operations.ts` — CRUD voor contacts, setPipelineStatus, createSystemEvent
- `src/features/school-profile/components/ContactCard.tsx` — Bestaand contact-kaart component
- `src/features/school-profile/components/ContactForm.tsx` — Contact aanmaken/bewerken formulier

### Pipeline & status UI (Phase 7)
- `src/components/ui/PipelineBadge.tsx` — Bestaande status-badge met kleurcodes
- `src/features/school-overview/PipelineKanbanView.tsx` — Kanban-view met drag & drop
- `src/features/school-overview/SchoolCard.tsx` — Schoolkaart in overzicht
- `src/features/school-overview/SchoolOverviewPage.tsx` — Schooloverzicht met filtering
- `src/features/school-profile/components/LostDealDialog.tsx` — Verplicht reden-dialog bij "Verloren"

### Tijdlijn (Phase 7)
- `src/features/school-profile/components/Timeline.tsx` — Tijdlijn-component met systeemevents
- `src/features/school-profile/components/TimelineEntry.tsx` — Individueel tijdlijn-item

### Dashboard & tabs
- `src/features/school-profile/components/TabNavigation.tsx` — 7 tabs (geen nieuwe tab nodig)
- `src/features/school-profile/components/ProfileHeader.tsx` — School-profiel header met pipeline-status

### Database
- `supabase/migrations/001_initial_schema.sql` — Supabase schema met contacts tabel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PipelineBadge.tsx` — Herbruikbaar patroon voor engagement-status badges (kleur per status)
- `LostDealDialog.tsx` — Herbruikbaar patroon voor verplichte reden bij "Afgehaakt"
- `Timeline.tsx` + `TimelineEntry.tsx` — Automatisch loggen van statuswijzigingen als systeemevents
- `PipelineKanbanView.tsx` — @dnd-kit/core drag & drop patroon, kan hergebruikt voor DMU-status-wijziging
- `ContactCard.tsx` — Basis voor uitbreiding met engagement-status
- `SchoolCard.tsx` — Uitbreiden met DMU-voortgangsindicator
- `FilterBar` in SchoolOverviewPage — Uitbreiden met DMU-status filterrij

### Established Patterns
- `setPipelineStatus()` in operations.ts — Patroon voor status-wijziging met automatische systeemevent logging
- `createSystemEvent()` — Systeemevents in tijdlijn: type, description, metadata
- Supabase React Query hooks voor real-time data
- Zod schemas voor form-validatie

### Integration Points
- Contact interface in `src/db/types.ts` — Nieuw veld `engagementStatus` toevoegen
- Contact interface — Nieuw optioneel veld `waitingForContactId` (link naar andere contact)
- `operations.ts` — Nieuwe functie `setEngagementStatus()` met systeemevent logging
- SchoolOverviewPage — Extra filterrij voor DMU-status
- SchoolCard — DMU-voortgangsindicator toevoegen
- PipelineKanbanView — Mini DMU-indicator op kaarten
- Overzicht-tab (dashboard) — DMU-matrix sectie toevoegen
- Supabase migration — Nieuwe kolommen op contacts tabel

</code_context>

<specifics>
## Specific Ideas

- DMU-matrix voorbeeld uit discussie:
  | Naam | Rol | Bevoegd | Status | Wacht op |
  |------|-----|---------|--------|----------|
  | Jan de Vries | Coordinator | Adviserend | Positief | — |
  | Petra Bakker | MT | Beslissend | Wacht intern | Finance (Lisa) |
  | Lisa Smit | Finance | Budgethouder | In gesprek | — |

- Het kernidee: de tool maakt het beslissingsnetwerk binnen de school zichtbaar. Wie heeft welke rechten, bij wie moet je zijn voor welk onderdeel van de klantreis, en wanneer moet een DMU doorverwijzen naar een andere DMU voor budget of accordering.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-dmu-klantreis-registratie*
*Context gathered: 2026-03-23*
