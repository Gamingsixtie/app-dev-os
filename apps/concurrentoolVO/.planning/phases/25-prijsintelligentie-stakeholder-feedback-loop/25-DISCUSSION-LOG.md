# Phase 25: Prijsintelligentie & Stakeholder Feedback Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 25-prijsintelligentie-stakeholder-feedback-loop
**Areas discussed:** Datamigratie-strategie, Review & goedkeuringsflow, Structuurwijzigingen, ops-competitor-intel skill & AI-validatie

---

## Datamigratie-strategie

### Overgang TS → Database

| Option | Description | Selected |
|--------|-------------|----------|
| Database-first met TS-fallback | App leest uit Supabase, fallback naar TS bij offline | ✓ |
| Hybride: structuur in TS, prijzen in DB | Bundellogica blijft in TS, alleen bedragen naar DB | |
| Volledig in database | Alles naar Supabase inclusief structuren | |

**User's choice:** Database-first met TS-fallback
**Notes:** —

### Seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Automatische seed bij deploy | TS-bestanden automatisch omzetten bij migratie | ✓ |
| Admin-import functie | Admin importeert handmatig via de app | |
| Geleidelijke migratie | Per provider migreren bij eerste review | |

**User's choice:** Automatische seed bij deploy
**Notes:** —

### Engine loading

| Option | Description | Selected |
|--------|-------------|----------|
| Store-first: laden bij app-start | Alles in Zustand store, calculators blijven synchroon | ✓ |
| Async calculators | Calculators lezen zelf uit Supabase | |

**User's choice:** Store-first (na uitleg betrouwbaarheid)
**Notes:** User vroeg "welke is betrouwbaarder". Toelichting gegeven: store-first behoudt pure-function architectuur, voorkomt race conditions en stale closures. Eén foutpunt, één fallback.

### Offline sync

| Option | Description | Selected |
|--------|-------------|----------|
| Cache in localStorage + stale indicator | Gecached in localStorage, banner bij offline | ✓ |
| IndexedDB mirror | Volledige kopie in IndexedDB | |

**User's choice:** localStorage cache (na uitleg betrouwbaarheid)
**Notes:** User vroeg "welke is betrouwbaarder". Toelichting: publicatieprijzen zijn kleine dataset (~50 records), localStorage is simpeler en sneller, IndexedDB zou overkill zijn.

---

## Review & goedkeuringsflow

### Wie mag indienen

| Option | Description | Selected |
|--------|-------------|----------|
| Iedereen (accountmanagers + managers) | Laagdrempelig, kracht zit in reviewproces | ✓ |
| Alleen managers | Accountmanagers kunnen alleen flaggen | |

**User's choice:** Iedereen
**Notes:** —

### Wie mag goedkeuren

| Option | Description | Selected |
|--------|-------------|----------|
| Managers (bestaande rol) | Past in bestaand rollenmodel | ✓ |
| Nieuwe 'prijsbeheerder' rol | Aparte rol voor prijsgoedkeuring | |
| Peer-review (4-ogen) | Twee accountmanagers moeten akkoord geven | |

**User's choice:** Managers (bestaande rol)
**Notes:** —

### Queue UI

| Option | Description | Selected |
|--------|-------------|----------|
| Centrale pagina met filters | Aparte /review pagina voor managers | ✓ |
| Inline per school | Badges in Products-tab per school | |
| Beide | Centrale queue + inline badges | |

**User's choice:** Centrale pagina met filters
**Notes:** —

### Na goedkeuring

| Option | Description | Selected |
|--------|-------------|----------|
| Direct actief + automatisch herberekenen | Meteen actief, vergelijkingen herberekend | ✓ |
| Actief na bevestiging door indiener | Extra bevestigingsstap | |
| Actief op geplande datum | Ingangsdatum instellen | |

**User's choice:** Direct actief + automatisch herberekenen
**Notes:** —

### Notificaties

| Option | Description | Selected |
|--------|-------------|----------|
| In-app badge/teller | Badge op review-menu-item | ✓ |
| In-app + email | Badge + email notificaties | |
| Geen notificaties | Zelf review-pagina checken | |

**User's choice:** In-app badge/teller
**Notes:** —

---

## Structuurwijzigingen

### Doorvoering

| Option | Description | Selected |
|--------|-------------|----------|
| Admin-editor in de app | Managers krijgen configuratie-editor | ✓ |
| Via review-queue | Structuurwijzigingen als voorstel indienen | |
| Alleen via code | Structuurwijzigingen blijven in TS-bestanden | |

**User's choice:** Admin-editor in de app
**Notes:** —

### Frequentie

| Option | Description | Selected |
|--------|-------------|----------|
| 1-2x per jaar | Zelden, simpeler volstaat | |
| Meerdere keren per jaar | Regelmatig, flexibele editor nodig | ✓ |
| Onbekend | Geen ervaring | |

**User's choice:** Meerdere keren per jaar
**Notes:** —

---

## ops-competitor-intel skill & AI-validatie

### AI-validatielaag

| Option | Description | Selected |
|--------|-------------|----------|
| AI normaliseert + valideert alle input | Ongeacht kanaal, AI maakt input schoon | ✓ |
| AI alleen bij vrije tekst/documenten | Handmatige invoer al gestructureerd | |
| Geen AI, formuliervalidatie | Alles via gestructureerde formulieren | |

**User's choice:** AI normaliseert + valideert alle input
**Notes:** User benadrukte belang van juiste format ongeacht hoe stakeholder aanlevert.

### Skill scope

| Option | Description | Selected |
|--------|-------------|----------|
| Prijzen + features + differentiators | Volledige concurrentie-intelligentie | ✓ |
| Alleen prijzen | Puur prijsintelligentie | |
| Prijzen + features (geen differentiators) | Prijzen en features, differentiators in code | |

**User's choice:** Prijzen + features + differentiators
**Notes:** User voegde belangrijk inzicht toe: ook school-specifieke kortingen bijhouden en patronen ontdekken. Als meerdere scholen vergelijkbare kortingen melden, onthult dit de werkelijke marktprijs.

### Kortingspatroondetectie

| Option | Description | Selected |
|--------|-------------|----------|
| Automatische patroondetectie + signalering | Systeem detecteert patronen bij 3+ scholen | ✓ |
| Handmatige analyse door manager | Manager filtert en vergelijkt zelf | |
| Dashboard met korting-overview | Apart analytics-scherm | |

**User's choice:** Automatische patroondetectie + signalering
**Notes:** —

### Doorwerking marktkorting

| Option | Description | Selected |
|--------|-------------|----------|
| Als optioneel scenario | Toggle in vergelijking: publicatie vs. marktprijzen | ✓ |
| Automatisch als standaard | Marktkorting automatisch meegenomen | |
| Alleen informatief | Getoond maar niet doorgerekend | |

**User's choice:** Als optioneel scenario
**Notes:** —

### Integratie met Phase 9

| Option | Description | Selected |
|--------|-------------|----------|
| Skill als orchestrator | Hergebruikt Phase 9 infra, voegt review-queue toe | ✓ |
| Skill naast bestaande flows | Apart kanaal naast document-upload en AI-intake | |
| Skill vervangt bestaande flows | Alle prijsinvoer via skill | |

**User's choice:** Skill als orchestrator
**Notes:** —

---

## Claude's Discretion

- Supabase tabelschema ontwerp
- RLS policies voor review-flow
- Admin-editor component design en UX
- Patroondetectie-algoritme
- Staleness-detectie implementatie
- Store-architectuur
- AI system prompt voor normalisatie
- Audittrail structuur

## Deferred Ideas

None — discussion stayed within phase scope
