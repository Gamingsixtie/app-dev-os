# Klantreis VO — Klant in Beeld

## What This Is

Interactief klantreis-instrument voor de VO-sector binnen het Cito-programma Klant in Beeld. Het toont per maand van het schooljaar (augustus–juli) wat de klant doet boven de lijn (klantstap, DMU, kanaal, emotie) en wat de vijf Cito-afdelingen onder de lijn doen (Marketing, Sales, Productmanagement, Toetstekunde, Customer Success). Primaire doelgroep is het VO-managementteam voor periodieke besluitvorming over uitvoering, investeringen en prioriteiten.

## Core Value

Het MT moet collectief achter het UI-ontwerp kunnen staan voordat er één regel productiecode of één activiteit aan content wordt toegevoegd. Het ontwerp drijft de discussie — niet andersom.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — eerst MT-akkoord op ontwerp, daarna pas invullen)

### Active

<!-- Current milestone: een visueel UI-prototype waar het MT en de afdelingen achter staan. -->

- [ ] Visueel UI-prototype dat het instrument volledig laat zien zonder echte Cito-content — MT kan reageren op vorm en flow, niet op invulling
- [ ] Drie klantreizen-tabs zichtbaar: bestaande klanten, nieuwe klanten, bestuur op stichtingsniveau
- [ ] Schooljaar-tijdlijn (aug–jul) met fases per klantreis, klantstap (eerste persoon), DMU-rij (beslisser, beïnvloeder, gebruiker), klantkanaal en emotie boven de lijn
- [ ] Vijf afdelings-lanes onder de lijn met placeholder-activiteiten per maand
- [ ] Activiteit-detail-paneel met de velden: eigenaar, betrokken, DMU-leden, klantverwachting, KPI's, opdrachtdocument-status, ontbrekende randvoorwaarden (categorie systeem/data/proces/capaciteit + impact blokkerend/hinderlijk + optionele klantcitaat)
- [ ] Mismatch-visualisatie: schaduwkaart in de ideale maand + mismatch-paneel met klantstem
- [ ] Aggregaat-view voor ontbrekende randvoorwaarden gegroepeerd per categorie
- [ ] Inline structuur-aanpassingen mogelijk: lanes, fases en klantreizen toevoegen, hernoemen, verwijderen — zonder code-aanpassing
- [ ] Editorial designtaal: Inter als enig UI-lettertype, Source Serif 4 italic voor klantcitaten, Cito-blauw (#2E75B6) als enige functionele accentkleur, oranje uitsluitend voor mismatch, rood uitsluitend voor blokkerende randvoorwaarden
- [ ] Werkende localhost-versie waarop het MT live kan klikken; geen deploy nodig voor dit moment

### Out of Scope

<!-- Wat we deze milestone bewust NIET bouwen, met reden. -->

- Echte Cito-content invullen (specifieke activiteiten, klantcitaten, ontbrekende randvoorwaarden per casus) — komt pas ná MT-akkoord op het ontwerp; v10 wordt expliciet niet als content-blueprint genomen
- Supabase-persistentie en datamodel-implementatie — eerst ontwerp valideren, daarna tech-overstap (Next.js + Supabase) in volgende milestone
- Authenticatie en toegangsrechten — expliciet uitgesloten in scope-document; lokale state, geen login-logica
- Multi-user gelijktijdig editen met conflictresolutie — pas relevant na Supabase-stap
- Wijzigingshistorie en audit trail — komt met Supabase-fase
- Cito-SSO koppeling — verre toekomst
- PO- en Zakelijk-sectoren — VO-specifiek bouwen, geen generieke sectorstructuur
- DIN-framework koppeling uit het programmamanagement — buiten huidige scope
- PDF-export voor MT-presentatie — niet kritiek voor ontwerp-validatie; MT kijkt live mee
- Klantsegmentatie binnen reizen — pas zinvol als content is ingevuld

## Context

**Bestaande kennis en materiaal:**
- Werkend prototype v10 (standalone HTML + React + Tailwind via CDN) staat in de chat als referentie. Het v10 is "een ontwerp dat op niets werkt" — alle ontwerpelementen aanwezig met realistische voorbeeldcontent, maar geen persistentie, geen echte koppeling, geen gevalideerde content. v10 dient als startpunt voor iteratie, niet als blueprint waarvan featurepariteit nodig is.
- Scope-document `Project_Klantreis_VO.md` legt doel, scope, methodologische basis (CJM + Service Blueprint + 3sides), doelgroep en designtaal vast.
- `CLAUDE.md` in deze app-folder legt de harde regels vast: tweedeling boven/onder de lijn nooit mengen, klantstap altijd in 1e persoon, DMU-volgorde beslisser-beïnvloeder-gebruiker, één accentkleur, LIB VO → Woots-migratie augustus 2026.

**Technische omgeving:**
- Dit project zit binnen `apps/Klantreis/` in de grotere `app-dev-os` monorepo.
- Voor deze milestone werken we bewust standalone (HTML + React via CDN of een lichte Next.js zonder backend) — Supabase en hosted deploy volgen pas in de volgende milestone.

**Parallelle instrumenten bij Cito:**
- Tom Koolen werkt parallel aan de DIN-app en consolidatie-app. Stack-keuzes hier (Next.js + Supabase voor latere milestone) sluiten daarop aan voor consistentie.

**Programmacontext:**
- Cito-programma Klant in Beeld: ambitie klanttevredenheid 8.5 in 2030, transformatie van productgerichte leverancier naar strategische partner. Drie sectoren (PO/VO/Zakelijk), vier domeinen (Mens/Proces/Systeem & Data/Cultuur). Dit instrument betreft VO en het systeem/data-domein voor MT-besluitvorming.

## Constraints

- **Tech stack**: HTML + React + Tailwind via CDN of lichte Next.js zonder backend — Supabase en backend pas in volgende milestone, deze fase is puur ontwerp-validatie
- **Designtaal**: Inter als enig UI-lettertype, Source Serif 4 italic voor klantcitaten, Cito-blauw (#2E75B6) als enige functionele accentkleur, oranje alleen voor mismatch, rood alleen voor blokkerende randvoorwaarden — geen andere functionele kleuren
- **Taal**: Volledige UI en alle teksten in Nederlands; klantstappen verplicht in eerste persoon van de klant
- **Tweedeling**: Klantperspectief boven de lijn, organisatieperspectief onder de lijn — nooit mengen
- **DMU-rollen**: Altijd in deze volgorde en met deze labels — beslisser, beïnvloeder, gebruiker
- **Mist-categorieën**: Uitsluitend systeem, data, proces, capaciteit met label blokkerend of hinderlijk — geen andere categorieën
- **Platformnamen**: LIB VO tot augustus 2026, Woots daarna — niet door elkaar gebruiken
- **Drie klantreizen**: Bestaande klanten, nieuwe klanten, bestuur op stichtingsniveau (referentie Stichting BOOR) — geen vierde reis zonder expliciete opdracht
- **Iteratief aanpasbaar**: Lanes, fases en klantreizen moeten toevoegbaar/verwijderbaar zijn zonder code-aanpassing — flexibiliteit is een ontwerpdoel, niet een nice-to-have
- **Geen authenticatie**: Expliciet uitgesloten — geen login-stub, geen RLS-voorbereiding, geen user-systeem
- **Goedkeuringsregel**: Niets wordt gedeeld, gepubliceerd of verstuurd zonder expliciete goedkeuring van de eigenaar (Pim)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Eerst UI-ontwerp valideren met MT, dan pas tech (Next.js + Supabase) | Voorkomt dat we tijd in implementatie steken op een opzet die het MT later toch wil omgooien | — Pending |
| Lokale state, geen Supabase deze milestone | Persistentie heeft pas waarde als de structuur staat; lokale state voldoende voor ontwerp-validatie | — Pending |
| Geen echte Cito-content, alleen lege/placeholder-structuur in dit prototype | MT moet reageren op vorm en flow, niet afgeleid worden door content-discussies | — Pending |
| Iteratieve aanpasbaarheid (lanes/fases/klantreizen) als kern-feature | Het MT zal vrijwel zeker structuur willen aanpassen; dat moet triviaal kunnen, anders blokkeert het de discussie | — Pending |
| v10 HTML als referentie, niet als blueprint | v10 was eerste ontwerp; deze milestone is opnieuw beginnen vanuit gevalideerde ontwerpprincipes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-14 after initialization*
