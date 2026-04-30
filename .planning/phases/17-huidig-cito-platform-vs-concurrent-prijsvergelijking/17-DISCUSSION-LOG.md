# Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 17-huidig-cito-platform-vs-concurrent-prijsvergelijking
**Areas discussed:** Scenario-routing, Prijsbron huidig Cito, AI-advies perspectief, Tabelweergave & framing, Schoolplan-integratie

---

## Scenario-routing

| Option | Description | Selected |
|--------|-------------|----------|
| Scenario C (nieuw scenario) | Aparte letter: C = 'huidig Cito vs. concurrent'. Wizard detecteert 'alles-oud-cito' en biedt keuze: migratie (B) of concurrentievergelijking (C). | ✓ |
| Subtype van A | Scenario A krijgt subtype A-nieuw en A-huidig. Minder code-impact maar vermengt perspectieven. | |
| Keuze bij alles-oud-cito | Geen nieuw label. Keuzemenu bij detectie, routeert naar bestaande flows met parameters. | |

**User's choice:** Scenario C (nieuw scenario)
**Notes:** Schone scheiding gewenst. A = acquisitie, B = migratie, C = retentie.

---

## Prijsbron huidig Cito

| Option | Description | Selected |
|--------|-------------|----------|
| Publicatieprijzen oud platform | Officiële publicatieprijzen huidig platform. School-specifieke deals als override. | ✓ |
| School-specifieke prijzen eerst | School-deals eerst, fallback naar publicatie. Nauwkeuriger maar vereist data. | |
| Identiek aan huidige engine | Nieuw-platform-prijzen gebruiken. Minder werk maar niet eerlijk. | |

**User's choice:** Publicatieprijzen oud platform
**Notes:** Eerlijk en verdedigbaar als basis. School-overrides mogelijk.

---

## AI-advies perspectief

| Option | Description | Selected |
|--------|-------------|----------|
| Retentie-frame met schoolplan | AI vanuit retentie + schoolplan-kansen integratie. Differentiators als "wat je verliest". | ✓ |
| Neutraal vergelijkend | Puur feitelijk zonder framing. Accountmanager bepaalt verhaal. | |
| Retentie zonder schoolplan | Retentie-frame maar zonder schoolplan-koppeling. | |

**User's choice:** Retentie-frame met schoolplan + migratiepad
**Notes:** Gebruiker voegde toe: elke Cito-klant gaat uiteindelijk naar het nieuwe platform (volgend schooljaar). Dit migratiepad moet onderdeel zijn van het advies — "blijf en krijg het nieuwe platform erbij". Drie lagen: prijs + wat je verliest + wat je erbij krijgt. Ook de "zachte deal" moet duidelijk naar voren: niet alleen prijzen maar ook Cito-voordelen, schoolplan-aansluiting, en toekomstpad.

---

## Tabelweergave & framing

| Option | Description | Selected |
|--------|-------------|----------|
| Huidig Cito + Nieuw Cito + Concurrent (3 kolommen) | Hele plaatje in tabel: huidig, nieuw platform, concurrent. | |
| Huidig Cito vs. Concurrent (2 kolommen) | Simpel: huidig vs. concurrent. Nieuw-platform info in AI-advies. | ✓ |
| 2 kolommen + upgrade-badge | Huidig vs. concurrent met badge/tooltip voor nieuw-platform info. | |

**User's choice:** 2 kolommen
**Notes:** Overzichtelijk houden. Kan ook goed zijn als variant "Huidig Cito vs. Nieuw Cito" maar dat is al Scenario B. Niet elke Cito-klant vergelijkt met concurrent.

---

## Schoolplan-integratie

| Option | Description | Selected |
|--------|-------------|----------|
| Geïntegreerd in AI-advies | Schoolplan-kansen verweven in het AI-advies tekst. Geen apart tabblad. | ✓ |
| Aparte sectie onder tabel | Visuele 'Schoolplan-aansluiting' sectie na de tabel. | |
| Beide — AI-advies + visuele sectie | Dubbele exposure in advies én visueel. | |

**User's choice:** Geïntegreerd in AI-advies
**Notes:** AI-advies wordt de plek waar de zachte deal leeft. Schoolplan-kansen uit Phase 14 analyse als input.

---

## Claude's Discretion

- Visueel ontwerp keuze-UI bij alles-oud-cito
- Structuur retentie-advies (secties, volgorde)
- Data-structuur oud-platform-prijzen
- Visueel onderscheid zachte/harde deal in advies
- Loading/streaming UX
- Responsive behavior tablet

## Deferred Ideas

None — discussion stayed within phase scope.
