# Phase 19: Gesprekken-tab & Acties Upgrade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 19-gesprekken-tab-acties-upgrade
**Areas discussed:** Spraak-naar-tekst ervaring, Gesprekken-formulier na AI-verwijdering, Acties inline invoer, Verwijder-bevestiging & UX-verfijning

---

## Spraak-naar-tekst ervaring

| Option | Description | Selected |
|--------|-------------|----------|
| Microfoon-icoon naast tekstveld | Kleine microfoonknop rechts in of naast het notitie-tekstveld. Klik = start/stop. Tekst verschijnt live. | ✓ |
| Push-to-talk knop | Aparte knop die je ingedrukt houdt om te spreken. Laat los = tekst ingevoegd. | |
| Apart spraakpaneel | Overlay/paneel met grote opnameknop en geluidsgolf. | |

**User's choice:** Microfoon-icoon naast tekstveld
**Notes:** Minimale UI-impact, past bij bestaand formulier

| Option | Description | Selected |
|--------|-------------|----------|
| Microfoonknop verbergen | Knop wordt niet getoond als browser geen Web Speech API heeft. | |
| Knop tonen maar uitgeschakeld | Disabled state met tooltip. Gebruiker weet dat het bestaat. | ✓ |
| You decide | Claude kiest de beste aanpak. | |

**User's choice:** Knop tonen maar uitgeschakeld

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen Nederlands | lang='nl-NL' | ✓ |
| Nederlands met Engels fallback | Probeer Nederlands, val terug op Engels. | |
| Gebruiker kiest taal | Taalkeuze-dropdown naast de microfoonknop. | |

**User's choice:** Alleen Nederlands

| Option | Description | Selected |
|--------|-------------|----------|
| Direct in tekstveld | Live getranscribeerd en direct toegevoegd aan tekstveld. | ✓ |
| Preview + bevestigen | Eerst in preview-vak, dan 'Toevoegen' klikken. | |

**User's choice:** Direct in tekstveld

---

## Gesprekken-formulier na AI-verwijdering

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown met status-badge | Select-menu met contactpersonen + DMU-rol + engagement-status. | ✓ |
| Autocomplete zoekveldje | Typ de naam, suggesties verschijnen. | |
| Contactkaartjes | Visuele kaartjes per contactpersoon om uit te kiezen. | |

**User's choice:** Dropdown met status-badge

| Option | Description | Selected |
|--------|-------------|----------|
| Verplicht veld | Contactpersoon is verplicht bij elk gesprek. | ✓ |
| Optioneel veld | Kan leeg blijven voor snelle notities. | |
| Verplicht + 'Nieuw contact' optie | Verplicht met inline nieuw contact aanmaken. | |

**User's choice:** Verplicht veld

| Option | Description | Selected |
|--------|-------------|----------|
| Volledig verwijderen uit ConversationForm | AI-modus, streaming, diff-view — alles weg. | |
| AI-toggle verbergen, code behouden | IntakeModeToggle verborgen maar code blijft als fallback. | ✓ |
| You decide | Claude bepaalt. | |

**User's choice:** AI-toggle verbergen, code behouden

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in de pagina (huidige stijl) | Formulier verschijnt inline boven de tijdlijn. | ✓ |
| Slide-over panel | Schuift in vanaf rechts. | |
| Modal dialog | Centered modal overlay. | |

**User's choice:** Inline in de pagina (huidige stijl)

---

## Acties inline invoer

| Option | Description | Selected |
|--------|-------------|----------|
| Invoerveld onderaan 'Te doen' kolom | Altijd zichtbaar, typ + Enter = aangemaakt. Trello-stijl. | ✓ |
| Invoerveld bovenaan elke kolom | Elke kolom heeft een invoerveld. | |
| Centraal invoerveld boven het bord | Eén veld boven het hele kanban-bord. | |

**User's choice:** Invoerveld onderaan 'Te doen' kolom

| Option | Description | Selected |
|--------|-------------|----------|
| Vrije tekst + optioneel type-label | Titel + optioneel type (bellen, mailen, offerte, intern overleg). | ✓ |
| Vaste actietypes als snelknoppen | Snelknoppen voor veelvoorkomende acties. | |
| Alleen vrije tekst, geen types | Simpelste variant, alleen titel. | |

**User's choice:** Vrije tekst titel + optioneel type-label

| Option | Description | Selected |
|--------|-------------|----------|
| Optionele koppeling via dropdown | Na aanmaak koppelen aan recent gesprek. | ✓ |
| Automatisch koppelen aan laatste gesprek | Auto-koppeling, handmatig los te koppelen. | |
| Geen koppeling bij inline aanmaak | Alleen titel bij inline aanmaak. | |

**User's choice:** Optionele koppeling via dropdown

| Option | Description | Selected |
|--------|-------------|----------|
| Klik op kaart = inline bewerken | Titel wordt bewerkbaar tekstveld, auto-save. | ✓ |
| Klik op kaart = detail-panel | Zijpaneel met alle velden. | |
| You decide | Claude kiest. | |

**User's choice:** Klik op kaart = inline bewerken

---

## Verwijder-bevestiging & UX-verfijning

| Option | Description | Selected |
|--------|-------------|----------|
| Modale dialoog | Centered modal met 'Weet u het zeker?', Annuleren/Verwijderen knoppen. | ✓ |
| Inline undo-bar | Item verdwijnt, balk met 'Ongedaan maken' (5 sec). | |
| Toast met undo | Toast-notificatie met 'Ongedaan maken' link. | |

**User's choice:** Modale dialoog

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen verwijderen | Bevestiging alleen bij verwijderen, niet bij statuswijzigingen. | ✓ |
| Verwijderen + afgerond markeren | Bevestiging bij verwijderen én afgerond markeren. | |
| Alle destructieve acties | Verwijderen, afgerond markeren, contactpersoon wijzigen. | |

**User's choice:** Alleen verwijderen

| Option | Description | Selected |
|--------|-------------|----------|
| Subtiele verbeteringen | Betere spacing, iconen, hover-states. Voortbouwen op bestaand design. | ✓ |
| Redesign met prioriteit-kleuren | Kleurcodes op basis van urgentie. | |
| You decide | Claude bepaalt. | |

**User's choice:** Subtiele verbeteringen

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, optioneel datumveld | Deadline + visuele markering bij verlopen. | ✓ |
| Nee, houd het simpel | Geen deadline-veld. | |
| Ja, met herinnering | Deadline + visuele herinnering bij bijna-verlopen. | |

**User's choice:** Ja, optioneel datumveld

---

## Claude's Discretion

- Microfoon-icoon styling en animatie tijdens opname
- Web Speech API configuratie (SpeechRecognition, interim results)
- Type-label UI in actiekaart
- Deadline-veld UI in actiekaart
- Bevestigingsdialoog exacte styling
- ActionItem model uitbreiding details

## Deferred Ideas

None — discussion stayed within phase scope
