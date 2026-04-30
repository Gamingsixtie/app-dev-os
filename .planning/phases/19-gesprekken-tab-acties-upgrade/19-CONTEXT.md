# Phase 19: Gesprekken-tab & Acties Upgrade - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Vereenvoudiging van het gesprekken-tab: AI-extractie wordt verborgen (code behouden, toggle verborgen), spraak-naar-tekst wordt toegevoegd voor het inspreken van gespreksnotities, en per gesprek wordt de contactpersoon verplicht gekoppeld met DMU-rol en engagement-status zichtbaar. Het actie-tab wordt verfijnd met directe inline invoer onderaan de 'Te doen' kolom, optioneel actie-type label, inline bewerking van actiekaarten, een optioneel deadline-veld, en een modale bevestigingsdialoog bij verwijderen.

</domain>

<decisions>
## Implementation Decisions

### Spraak-naar-tekst
- **D-01:** Microfoon-icoon naast het notitie-tekstveld in ConversationForm. Klik = start opname, klik nogmaals = stop. Tekst verschijnt live in het veld via Web Speech API.
- **D-02:** Spraak wordt direct in het bestaande notitie-tekstveld ingevoegd (live transcriptie, geen preview-stap). Gebruiker kan daarna handmatig bijwerken.
- **D-03:** Taal is vast ingesteld op Nederlands (`lang='nl-NL'`).
- **D-04:** Als de browser geen Web Speech API ondersteunt: microfoonknop wordt getoond maar uitgeschakeld (disabled state) met tooltip "Spraakherkenning niet ondersteund in deze browser".

### Gesprekken-formulier vereenvoudiging
- **D-05:** AI-intake gerelateerde code (IntakeModeToggle, StreamingExtraction, DiffView) wordt verborgen maar niet verwijderd uit ConversationForm. AI-modus toggle wordt hidden — het formulier opent standaard in handmatige modus zonder zichtbare keuze.
- **D-06:** Contactpersoon-selectie via dropdown met DMU-rol badge en engagement-status per contactpersoon. Bijv: "Jan de Vries — Beslisser — In gesprek".
- **D-07:** Contactpersoon is een verplicht veld bij het vastleggen van een gesprek. Elk gesprek is met iemand.
- **D-08:** Formulier blijft inline in de pagina (huidige stijl) — verschijnt boven de tijdlijn wanneer je op "+ Gesprek vastleggen" klikt.

### Acties inline invoer & kanban-verfijning
- **D-09:** Altijd zichtbaar invoerveld onderaan de 'Te doen' kolom in het kanban-bord. Typ titel + Enter = actie aangemaakt in 'Te doen' status. Geen extra klikken nodig (Trello-stijl).
- **D-10:** Vrije tekst titel + optioneel type-label per actie. Actietypes als labels/chips: bellen, mailen, offerte, intern overleg (of vrije tekst). Type wordt na aanmaak ingesteld, niet tijdens inline invoer.
- **D-11:** Nieuwe actie kan optioneel aan een gesprek worden gekoppeld via dropdown met recente gesprekken. Bestaand `conversationId` veld in ActionItem wordt hergebruikt.
- **D-12:** Klik op actietitel in de kaart → wordt een bewerkbaar tekstveld. Bewerkingen worden direct opgeslagen (auto-save). Minimale UI-overhead.
- **D-13:** Optioneel deadline-veld per actie (datumpicker). Verlopen deadlines worden visueel gemarkeerd (rode rand of badge).

### Verwijder-bevestiging
- **D-14:** Modale bevestigingsdialoog bij verwijderen van gesprekken en acties. "Weet u het zeker?" tekst met "Annuleren" en "Verwijderen" knoppen (verwijderen in rood). Consistent met bestaande dialog guards.
- **D-15:** Bevestiging alleen bij verwijderen — statuswijzigingen (drag-and-drop in kanban) zonder bevestiging, die zijn makkelijk omkeerbaar.

### Visuele verfijning actie-tab
- **D-16:** Subtiele verbeteringen: betere spacing, kolomkoppen met iconen, actiekaartjes met datum en gekoppeld-gesprek-indicator, hover-states. Bouwt voort op bestaand design zonder complete redesign.

### Claude's Discretion
- Exacte microfoon-icoon styling en animatie tijdens opname
- Web Speech API implementation details (SpeechRecognition configuratie, interim results)
- Hoe het type-label veld eruitziet in de actiekaart (chip, badge, of tekst)
- Deadline-veld UI in de actiekaart (inline datumpicker of klik-om-toe-te-voegen)
- Exacte styling van de bevestigingsdialoog
- Hoe disabled microfoonknop eruit ziet
- ActionItem model uitbreiding voor `type` en `dueDate` velden

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gesprekken-tab & formulier
- `src/features/school-profile/tabs/ConversationsTab.tsx` — Huidige gesprekken-tab met tijdlijn en acties secties
- `src/features/school-profile/components/ConversationForm.tsx` — Gesprekformulier met AI-intake (te vereenvoudigen)
- `src/features/school-profile/components/IntakeModeToggle.tsx` — AI/handmatig toggle (te verbergen)
- `src/features/school-profile/components/StreamingExtraction.tsx` — Streaming UI (te verbergen)
- `src/features/school-profile/components/DiffView.tsx` — Diff-view bevestiging (te verbergen)
- `src/features/school-profile/schemas/conversation.schema.ts` — Zod validatieschema voor gesprekken
- `src/hooks/useConversations.ts` — React Query hook voor gesprekken

### Acties & kanban
- `src/features/school-profile/components/ActionKanban.tsx` — Kanban-bord met 3 kolommen en @dnd-kit drag-and-drop
- `src/features/school-profile/components/ActionItem.tsx` — Actiekaart component (uit te breiden)
- `src/hooks/useActions.ts` — React Query hooks voor acties (useActions, useCreateAction, useUpdateAction, useDeleteAction)

### Data types & operaties
- `src/db/types.ts` — Contact, Conversation, ActionItem interfaces (ActionItem uit te breiden met type en dueDate)
- `src/db/operations.ts` — CRUD operaties voor gesprekken en acties
- `src/models/school.ts` — DMUPosition, EngagementStatus definities

### Contacten (voor dropdown met status)
- `src/hooks/useContacts.ts` — React Query hook voor contacten
- `src/components/ui/DMUBadge.tsx` — DMU-positie badge (herbruikbaar in dropdown)
- `src/components/ui/EngagementBadge.tsx` — Engagement-status badge (herbruikbaar in dropdown)

### Prior context
- `.planning/phases/09-ai-intake-prijsbeheer/09-CONTEXT.md` — Originele AI-intake beslissingen (D-01 t/m D-06)
- `.planning/phases/18-contactbeheer-upgrade-klantreis-inzicht/18-CONTEXT.md` — DMU-rollen en contactbeheer upgrade

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConversationForm` — Bestaand formulier, wordt vereenvoudigd (AI-code verborgen)
- `ActionKanban` + `ActionItemCard` — Kanban met @dnd-kit, te extenden met inline invoer
- `DMUBadge` + `EngagementBadge` — Herbruikbaar voor contactpersoon-dropdown
- `Timeline` component — Bestaande tijdlijn, geen wijzigingen nodig
- `TagInput` component — Bestaand in ConversationForm, blijft behouden
- Dialog guard pattern — Bevestigingsdialoog patronen al aanwezig in de app (pipeline status)

### Established Patterns
- React Hook Form + Zod voor formulieren
- Zustand stores met persist middleware
- React Query (useContacts, useConversations, useActions) voor data fetching
- @dnd-kit/core voor drag-and-drop in kanban
- Tailwind CSS v4 met Cito design tokens (cito-primary, cito-accent)

### Integration Points
- `ConversationsTab.tsx` — Orchestreert gesprekken + acties secties, entry point voor alle wijzigingen
- `ActionItem` interface in `db/types.ts` — Moet uitgebreid worden met `type` en `dueDate`
- `db/operations.ts` — Bestaande addAction, updateAction, deleteAction functies
- `db/migrations.ts` — Voor schema-migratie (nieuwe ActionItem velden)

</code_context>

<specifics>
## Specific Ideas

- Spraak-naar-tekst: Web Speech API met `lang='nl-NL'`, live transcriptie direct in tekstveld
- Inline actie-invoer: Trello-stijl invoerveld onderaan 'Te doen' kolom
- Contactpersoon-dropdown: toont "Naam — DMU-rol — Engagement-status"
- Actie-types als labels/chips na aanmaak (bellen, mailen, offerte, intern overleg)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-gesprekken-tab-acties-upgrade*
*Context gathered: 2026-03-25*
