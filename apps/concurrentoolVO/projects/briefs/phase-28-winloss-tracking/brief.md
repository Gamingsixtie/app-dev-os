# Phase 28 — Win/loss-tracking & Marktpositie + Korting-verrijking Vergelijking

**Status:** Handoff vanuit App-Dev OS root sessie op 2026-05-14. Wacht op toevoegen aan ROADMAP.md via `/gsd-phase` in een sessie die binnen `apps/concurrentoolVO/` draait.

**Context van de gesprek:** User wil een aparte, op zichzelf staande feature toevoegen die het sales-inzicht versterkt. Niet afhankelijk van Phase 25/26/27 voor scope, maar wel "downstream" qua roadmap-volgorde (komt achter 27 in de wachtrij).

---

## Goal (zoals afgestemd)

Accountmanager registreert per school de uitkomst van elke prijsvergelijking (gewonnen / verloren / in onderhandeling, prijsverschil, reden) in een aparte **Uitkomst/Deal**-tab. Een cross-school **marktpositie-dashboard** aggregeert deze data tot strategisch inzicht (win-rate, gemiddelde marge t.o.v. concurrent, top verlies-redenen). De **vergelijking-tab** wordt verrijkt zodat actuele kortingen meegenomen kunnen worden in de uiteindelijke prijs.

## Depends on

- Phase 27 (wizard-optimalisatie bestaande klant vs nieuwe klant) — queued
- Phase 25 (prijsintelligentie-stakeholder-feedback-loop) — executing
- Phase 15 (DMU klantreis registratie) — complete
- Phase 7 (school intelligence / contactpersonen) — complete

## Scope highlights (te concretiseren in SPEC + DISCUSS)

1. **Uitkomst/Deal-tab per school**
   - Status: Lopend / Gewonnen / Verloren / Niet gestart
   - Prijsverschil-snapshot (Cito vs. gekozen concurrent uit Phase 16/17 wizard)
   - Reden (vrije tekst + categorie: prijs / functionaliteit / voorkeur / anders)
   - Datum afsluiting + contactpersoon (link naar Phase 7 contacts)
   - Koppeling naar Phase 15 engagement-status (Akkoord → win, Afgehaakt → loss)

2. **Markt-dashboard (cross-school)**
   - Totaalteller: aantal vergelijkingen, win-rate %
   - Cito-positie: voordeliger in X%, duurder in Y%, gemiddelde marge €
   - Top 3 verlies-redenen
   - Filterbaar op periode / niveau / regio

3. **Vergelijking-tab korting-verrijking**
   - Mogelijkheid om kortingen in te voeren die de "echte" prijs van Cito of concurrent veranderen
   - Kortingen worden gekoppeld aan de Deal-registratie (niet aan publicatieprijzen → blijven Phase 25-gevalideerd)
   - Recalculatie van vergelijking met korting-laag erbovenop
   - Audittrail per korting (wie, wanneer, reden)

4. **Persistentie**
   - Supabase tabellen: `deal_outcomes`, `deal_discounts` (concept; SPEC bepaalt)
   - RLS per team (consistent met bestaande modellen)

## Niet-doelen / scope-uitsluitingen

- Geen externe CRM-integratie (Salesforce, HubSpot, etc.) — registratie blijft in-app
- Geen voorspellende AI/ML op win-kans — eerst registreren, dan eventueel later analyseren
- Geen wijzigingen aan publicatieprijzen-laag (die is Phase 25)

## Open vragen voor `/gsd-discuss-phase`

- Moet de Uitkomst/Deal-tab ook open deals tonen, of alleen afgesloten? → waarschijnlijk beide
- Hoe wordt het markt-dashboard ontsloten — startscherm, eigen route, of als sectie binnen Schooloverzicht?
- Hoeveel detail bij de korting-invoer: per module of een totaalkorting op de comparison?
- Wat is de relatie met de bestaande `school_prices` / proposals uit Phase 25? Concurrenten met team-specifieke kortingen of universele markt-kortingen?

## GSD-flow vanaf hier

1. **`/gsd-phase`** → Phase 28 toevoegen aan `apps/concurrentoolVO/.planning/ROADMAP.md` met bovenstaande Goal en scope
2. **`/gsd-spec-phase 28`** → SPEC.md (WAT levert deze fase op, ambiguity-score)
3. **`/gsd-discuss-phase 28`** → adaptieve vragen voor de openstaande punten hierboven
4. **`/gsd-plan-phase 28`** → PLAN.md met taken-breakdown
5. **`/gsd-execute-phase 28`** → uitvoeren (waarschijnlijk pas nadat Phase 25 en 26/27 klaar zijn)

## Volgorde-attentie

Phase 25 staat nog op EXECUTING (Plan 6/12). Phase 26 + 27 zijn queued. Phase 28 plannen kan parallel maar **executeren** komt na 25/26/27 in de roadmap-volgorde. Bij `/gsd-plan-phase` daar rekening mee houden — zou alleen kunnen botsen als er gedeelde bestanden zijn (waarschijnlijk minimaal).
