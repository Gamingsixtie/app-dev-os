# Rekentool VO — Sales Intelligence Platform

## What This Is

Een sales intelligence platform voor Cito-accountmanagers in het voortgezet onderwijs. De tool combineert real-time prijsvergelijking, AI-gestuurde intake tijdens telefoongesprekken, schoolspecifieke intelligence en DMU-gerichte exports. Accountmanagers kunnen tijdens een gesprek met een school direct inzicht krijgen in prijsverschillen, Cito-voordelen en tijdswinst — en het resultaat meteen op maat exporteren voor de juiste beslisser.

## Core Value

Accountmanagers hebben tijdens elk schoolgesprek direct een onderbouwd, eerlijk en op de DMU afgestemd overzicht dat zowel financieel als in tijdsbesparing concreet maakt waarom Cito de beste keuze is — gevoed door actuele prijsintelligentie en schoolspecifieke context.

## Current Milestone: v2.0 Sales Intelligence Platform

**Goal:** Van statische prijsvergelijker naar dynamisch sales intelligence platform met AI-intake, schoolprofielen en DMU-exports.

**Target features:**
- AI-intake tijdens telefoongesprekken (prijzen, context, deals vastleggen)
- Prijsintelligentie op schoolniveau (productgebruik, deals, gesprekshistorie)
- Twee kernscenario's: Cito vs. concurrent + migratie huidig → nieuw platform
- Hybride scenario's (school gebruikt deels Cito)
- Waarde voorbij prijs (tijdwinst, automatisering als onderhandelingstool)
- DMU-gerichte exports (coordinator, MT, finance — elk ander perspectief)
- Automatische prijsupdates via agent, documenten of handmatig

## Requirements

### Validated

**v1.0 Fundament** (validated 2026-03-20):
- [x] Schoolprofiel-invoer: schooltype, leerlingaantallen per leerjaar/niveau, modules selecteren
- [x] Cito-huisstijl: Primary #003082, Accent #FF6600, Background #F8F9FA als Tailwind tokens
- [x] Nederlandse interface met correcte labels en navigatie
- [x] Datastructuren: school levels, pricing model, assumptions, modules
- [x] Wizard-flow met voortgangsbalk en formuliervalidatie
- [x] Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

**v1.0 Prijsvergelijking** (deels gebouwd, te herstructureren):
- [x] Pure rekenmotor (calculateComparison) met provider costs en differentiators
- [x] Zustand store met draft/applied override-scheiding
- [x] Recharts staafdiagram component
- [x] Prijsdata-structuur met bronvermelding en houdbaarheidsdatum

**v2.0 School Intelligence** (validated Phase 07, 2026-03-22):
- [x] CRM-lite data layer: contacts, conversations, actions, pipeline management (SCHOOL-01)
- [x] School profile page with 5 tabs: dashboard, vergelijking, producten, contacten, gesprekken (SCHOOL-02, SCHOOL-03, SCHOOL-04)
- [x] Pipeline status management with transition validation and dialog guards (SCHOOL-05)
- [x] School overview with filtering, list/kanban views, compact/extended cards (SCHOOL-06)
- [x] School-specific price overrides clearly separated from publication prices (PRIJS-07)

**v2.0 AI Wizard Prijsvergelijking** (validated Phase 16, 2026-03-25):
- [x] 3-staps AI wizard voor eerlijke prijsvergelijking met variant-selectie per module (PRIJS-01, PRIJS-03)
- [x] AI-advies met matching-uitleg en Cito-bundel aanbeveling op basis van provider-configuraties (PRIJS-05, PRIJS-06)
- [x] Wizard-tabel harmonisatie: single source of truth via applyToTable() cross-store write

### Active

*Wordt gedefinieerd in REQUIREMENTS.md voor v2.0*

### Out of Scope

- Scenario C (concurrentie → nieuw Cito-platform) — combinatie van A+B, later
- Real-time prijssynchronisatie met externe bronnen — prijzen via agent/documenten/handmatig
- Gebruikersaccounts met login — tool werkt op basis van lokale opslag en schoolprofielen
- Contractonderhandeling of offertefunctionaliteit
- CRM-integratie — schoolprofielen leven in de tool, niet in een extern CRM

## Context

Cito opereert in de VO-markt voor toetsing en leerlingvolgsystemen. Belangrijkste concurrenten zijn DIA en JIJ (IEP). Scholen kopen modulair in: LVS-onderdelen, capaciteitentoetsen, sociaal-emotionele instrumenten, etc.

**Commerciële uitdagingen:**
1. **New business**: scholen vergelijken aanbieders — Cito moet laten zien dat het competitief geprijsd is EN meer biedt
2. **Migratie**: bestaande Cito-klanten twijfelen over overstap naar nieuw platform — business case moet concreet zijn
3. **Hybride**: scholen die deels Cito gebruiken maar niet alles — upsell met onderbouwing

**DMU-realiteit op scholen:**
- Coördinator/docent: dagelijks gebruiker, beslist over inhoud, geeft advies aan MT
- Conrector/rector (MT): neemt het besluit, wil overzicht en onderbouwing
- Finance/budgetverantwoordelijke: bewaakt budget, wil euro's en meerjarenprojectie
- Elke DMU heeft ander perspectief nodig op dezelfde data

**Prijslandschap:**
- DIA: individuele modules €3,36/leerling, pakketten €5,84-€35,58 (bron: DIA Webshop 2025-2026)
- JIJ! (Bureau ICE): licentie + per afname model, prijzen niet publiek — offerte vereist
- Cito: per leerling per module, publicatieprijzen beschikbaar
- Prijsmodel nieuw Cito-platform wijkt af van huidig platform

**Tijdwinst nieuw platform:**
- Rechten docenten: automatisch i.p.v. handmatig
- Toetsen resetten: zelf i.p.v. klantenservice bellen
- Inloggen: Entree-federatie i.p.v. startcodes
- Planning: automatisch voorstel i.p.v. handmatig
- Leerling-/docentkoppeling: Somtoday/Magister-sync i.p.v. EDEXML

**Beschikbare skills:**
- `ops-competitor-intel` — concurrentprijzen bijhouden
- `ops-school-intel` — schoolprofielen en gesprekshistorie
- `ops-price-intake` — AI-gestuurde prijsinvoer tijdens gesprekken
- `ops-dmu-export` — DMU-gerichte rapporten genereren
- `str-value-case` — meerwaarde Cito kwantificeren
- `viz-comparison-spec` — UI-ontwerp vergelijkingsschermen

## Constraints

- **Taal**: Volledig Nederlands, formeel "u"-vorm in externe modus, informeler in interne modus
- **Huisstijl**: Cito Primary #003082, Accent #FF6600, Background #F8F9FA
- **Tech stack**: Vite 8 + React 19 + TypeScript + Tailwind CSS 4 + Zustand + Zod v4 + Vitest + Recharts 3
- **AI**: Claude Haiku 4.5 voor real-time intake (snel, goedkoop), via Anthropic SDK
- **Responsiviteit**: Bruikbaar op tablet tijdens schoolbezoek
- **Perspectief**: Altijd vanuit Cito — intern instrument, maar eerlijk en transparant
- **Concurrenten bij launch**: DIA en JIJ (IEP)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modulair vergelijken, niet pakketten | Appels met appels — alleen vergelijken wat beide aanbieders leveren | — Pending |
| Publicatieprijs als bovengrens | Eerlijk: werkelijke prijs kan lager zijn, dat maakt het transparant | — Pending |
| Elke prijs heeft houdbaarheidsdatum | Geen verouderde data zonder waarschuwing | — Pending |
| Tech stack: Vite 8 + React 19 + Tailwind 4 + Zustand + Zod v4 | Moderne stack, snelle builds, type-safe state management | Decided v1.0 |
| AI intake via Claude Haiku 4.5 | Snel genoeg voor real-time tijdens gesprekken, kostenefficient | Decided v2.0 |
| Schoolprofielen lokaal (niet CRM) | Geen externe dependency, privacy-bewust, snel itereerbaar | Decided v2.0 |
| DMU-export als kernfunctie | Elk gesprek moet eindigen met iets dat de contactpersoon kan delen | Decided v2.0 |
| Bestaande v1 code hergebruiken | Engines, store-patronen en wizard zijn bruikbaar — iteratief verbeteren | Decided v2.0 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after Phase 18 contactbeheer-upgrade-klantreis-inzicht completion*
