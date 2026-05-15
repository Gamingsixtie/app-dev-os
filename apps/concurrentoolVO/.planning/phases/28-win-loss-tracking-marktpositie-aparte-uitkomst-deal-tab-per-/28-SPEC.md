# Phase 28: Win/loss-tracking & Marktpositie + Korting-verrijking — Specification

**Created:** 2026-05-14
**Ambiguity score:** 0.19 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Accountmanagers registreren per school de uitkomst van elke prijsvergelijking in een aparte 'Uitkomst/Deal'-tab (vervangt LostDealDialog) met prijs-snapshot, reden en contactpersoon; een cross-school marktpositie-dashboard aggregeert deze data tot win-rate, gemiddelde marge en trends; en een cohort-gebaseerde AI-voorspelling toont per open deal een win-kans op basis van homogene scholen (onderwijsvisie + schoolniveau). Per-deal kortingen kunnen per module en provider worden vastgelegd en herberekenen de vergelijking voor die specifieke deal.

## Background

**Bestaande functionaliteit die deze fase raakt:**

- [LostDealDialog.tsx](src/features/school-profile/components/LostDealDialog.tsx) — bestaande dialog voor verloren deal-registratie (concurrent + optionele reden). Wordt **volledig vervangen** door Uitkomst/Deal-tab.
- Pipeline-status SCHOOL-05: `prospect → contact → offerte → besluit → klant → at-risk`. Blijft ongewijzigd; pipeline = procesfase, Uitkomst = eindstand (geen sync).
- Markt-aggregaat korting: [MarktKortingToggle.tsx](src/features/price-comparison/MarktKortingToggle.tsx) + [KortingsPatroonAlert.tsx](src/features/price-comparison/KortingsPatroonAlert.tsx) + Phase 25 discount-patterns engine. Blijft apart bestaan — per-deal korting wordt een nieuwe laag erbovenop.
- Gevoeligheidsanalyse (GEVOEL-01/02/03) in [SensitivitySection.tsx](src/features/price-comparison/SensitivitySection.tsx). Niet aangeraakt door deze fase.

**Wat ontbreekt vandaag:**
- Geen gestructureerde win/loss-uitkomst-registratie (alleen verloren via LostDealDialog, geen win-pad)
- Geen prijs-snapshot per deal (vergelijking-data niet bevroren op moment van besluit)
- Geen cross-school dashboard met marktpositie-inzicht
- Geen per-deal korting-laag (alleen markt-aggregaat-kortingen)
- Geen voorspelling van deal-uitkomst op basis van historie

**Bestaande testdata-context:** Alle huidige LostDealInfo-records + pipeline-status-states zijn testdata. Geen historische migratie nodig — schone start vanaf Phase 28 go-live.

## Requirements

1. **Uitkomst/Deal-tab — canoniek registratiepunt per school**: Accountmanager beheert deal-uitkomst in dedicated tab.
   - Current: Geen Uitkomst-tab; alleen LostDealDialog voor losse loss-registratie zonder prijs-snapshot, datum, of contactpersoon-koppeling
   - Target: Nieuwe tab in school-profiel die de volledige uitkomst-lifecycle beheert: status (open / in onderhandeling / gewonnen / verloren), prijs-snapshot van vergelijking-moment, reden (vrije tekst), contactpersoon (link naar Phase 7 contacts), datum, AM. Records bewerkbaar achteraf. LostDealDialog wordt verwijderd.
   - Acceptance: Accountmanager kan: (a) deal-status zetten op alle 4 waarden, (b) prijs-snapshot vastleggen met Cito-prijs + concurrent-prijs + verschil €, (c) reden invullen, (d) contactpersoon koppelen, (e) bestaande Uitkomst-record achteraf bewerken. Geen LostDealDialog-import meer in codebase.

2. **WinDealDialog — symmetrische gewonnen-deal-flow**: Pipeline-transitie naar `klant` triggert win-detail-dialog.
   - Current: Geen win-registratie. Pipeline → `klant` slaat alleen de status op, geen contextuele dealdata.
   - Target: Bij pipeline-transitie naar `klant` opent WinDealDialog (parallel aan LostDealDialog-patroon). Velden: prijs-snapshot, datum afsluiting, contactpersoon, optionele reden. Bij confirm wordt een Uitkomst-record met status `gewonnen` aangemaakt.
   - Acceptance: Pipeline-status zetten op `klant` opent WinDealDialog; na bevestigen verschijnt een gewonnen Uitkomst-record in de Uitkomst/Deal-tab van die school; annuleren laat pipeline-status terug op vorige waarde.

3. **Per-deal korting per module + provider**: Accountmanager kan kortingen per (module, provider) vastleggen die de vergelijking voor deze deal herberekenen.
   - Current: Alleen markt-aggregaat-korting (MarktKortingToggle): één gemiddelde % per provider over alle scholen. Geen per-deal granulariteit.
   - Target: In Uitkomst/Deal-tab kan accountmanager per (module, provider)-paar een korting invoeren als % of als absoluut € (een van beide). Bij geconfigureerde korting herberekent de vergelijking voor díe deal (niet markt-breed). Records gekoppeld aan Uitkomst-record. Audittrail: wie, wanneer, oude vs nieuwe prijs.
   - Acceptance: Voor een open Uitkomst-record kan minimaal één korting per (module, provider) worden ingevoerd; de vergelijking-tab toont herberekende totalen wanneer deze deal geopend is; audit-record bestaat per korting-mutatie; verwijderen van korting herstelt publicatieprijs in vergelijking.

4. **Markt-dashboard cross-school met filters + trendgrafiek**: Aggregaatweergave van alle Uitkomst-records.
   - Current: Geen cross-school dashboard. Inzicht in markt-positie alleen indirect via SchoolOverviewPage telstanden van pipeline-status.
   - Target: Dedicated dashboard-route die toont (alle waarden gefilterd op periode + niveau): totaal aantal deals, win-rate %, gemiddelde marge € (Cito vs gekozen concurrent), trendgrafiek over tijd (week/maand/kwartaal). Elk getal heeft "Gebaseerd op N deals"-badge. Periode-filter: laatste 30/90/365 dagen of custom range. Niveau-filter: vmbo/havo/vwo + sub-types.
   - Acceptance: Dashboard toont op een lege dataset een nette empty-state; bij ≥1 deal toont 't telstanden + N-badge; bij ≥10 deals toont win-rate + gemiddelde marge + trendgrafiek; filters periode + niveau werken (correcte subset wordt getoond na filter); trendgrafiek toont x-as periode en y-as aantal deals of win-rate.

5. **AI-voorspelling cohort-gebaseerd**: Per open deal toont systeem voorspelde win-kans op basis van vergelijkbare scholen.
   - Current: Geen voorspelling-functionaliteit. AI wordt elders gebruikt voor intake/advies, niet voor deal-uitkomst-predictie.
   - Target: Bij elke open Uitkomst-record berekent het systeem een cohort van scholen met dezelfde combinatie van `onderwijsvisie` (dalton/montessori/regulier/lyceum) + `schoolniveau` (vmbo/havo/vwo + sub-types). UI toont: win-kans % + cohort-grootte ("Vergelijkbaar met 12 vmbo-dalton-scholen — win-kans 65%") + top verlies-reden in dat cohort ("In dit cohort verliezen we vaak op prijs"). Altijd zichtbaar, ook bij kleine cohorts — N-badge maakt betrouwbaarheid expliciet.
   - Acceptance: Voor een open deal met bekend niveau + onderwijsvisie toont UI de win-kans% + cohort-size + matching features (welke 2 features matchten) + top verlies-reden in cohort; bij cohort-size 0 wordt fallback-tekst getoond ("Geen vergelijkbare scholen nog — eerste in z'n cohort"); bij cohort-size 1-4 wordt expliciete "lage betrouwbaarheid"-disclaimer getoond.

## Boundaries

**In scope:**
- Uitkomst/Deal-tab als nieuwe tab in school-profiel-navigatie
- WinDealDialog component (parallel aan LostDealDialog)
- Verwijdering van LostDealDialog uit codebase (vervangen door Uitkomst-tab)
- Per-deal korting datamodel + UI + recalculation-logica
- Markt-dashboard route + componenten + filter-state + trend-chart
- Cohort-AI berekening + voorspelling-component
- Supabase schema-uitbreidingen: `deal_outcomes`, `deal_discounts`, `deal_audit_log` tabellen met RLS per team
- Empty-states + N-badges + lage-betrouwbaarheid-disclaimers

**Out of scope:**
- PDF/clipboard-export uitbreiden met Uitkomst-data — Phase 12/21 niet wijzigen, blijft visueel apart
- Korting-feedback-loop naar Phase 25 markt-aggregaat (KortingsPatroonAlert leert NIET van per-deal kortingen) — toekomstig idee, expliciet als FUTURE-XX gemarkeerd
- Externe CRM-sync (Microsoft Dynamics) — verschoven naar backlog/FUTURE; geen Phase 28-werk meer voor de stub-laag
- Pipeline-status enum wijzigen (geen `gewonnen`/`verloren` toevoegen) — pipeline blijft procesfase, Uitkomst is eindstand
- Top-3 verlies-redenen-aggregatie + per-concurrent breakdown op dashboard — nice-to-have, niet acceptance-blokkerend (kan plan-phase meenemen als haalbaar)
- Migratie van bestaande LostDealInfo-records naar Uitkomst-records — alle huidige data is testdata, schone start
- AI-voorspelling op basis van ML-training of externe modellen — cohort-aggregatie is een statistische operatie op bestaande deal-data, geen LLM-call

## Constraints

- **Storage:** Supabase Postgres met RLS per team — consistent met bestaande schema-patronen (Phase 8 + 25). Tabellen `deal_outcomes`, `deal_discounts`, `deal_audit_log`. School-FK + contact-FK gebruiken bestaande UUID's.
- **Pipeline-status onveranderlijk:** Bestaande `pipeline_status` kolom + enum-waarden blijven exact zoals nu — geen schema-wijziging. Sync-richting alleen één kant: WinDealDialog wordt getriggerd door pipeline-transitie, niet omgekeerd.
- **Markt-aggregaat onaangeroerd:** Phase 25 discount-patterns engine wordt NIET gewijzigd. Per-deal kortingen leven in `deal_discounts` tabel, gescheiden van `pricing_configs`/`price_proposals`.
- **Cohort-features:** Cohort-groepering gebruikt uitsluitend `onderwijsvisie` + `schoolniveau` velden. Beide velden moeten aanwezig zijn op school voor cohort-match — fallback bij ontbrekende velden = "Geen vergelijkbare scholen".
- **Performance:** Dashboard moet renderen <2s bij 500 deals; cohort-berekening client-side acceptabel tot 1000 schools, anders Supabase view.
- **Recalculation:** Per-deal korting-recalc moet pure-function blijven (engine-conventie). Geen side-effects in price-comparison engine.
- **Tab-volgorde:** Uitkomst/Deal-tab plaatsen NA Comparison-tab en VOOR Acties-tab in school-profiel-navigatie (sales-flow-logisch).

## Acceptance Criteria

- [ ] Uitkomst/Deal-tab is bereikbaar via school-profiel-navigatie en toont een lege state bij geen records
- [ ] Accountmanager kan een nieuwe Uitkomst-record aanmaken met status (4 waarden), prijs-snapshot, reden, contactpersoon en datum
- [ ] Bestaande Uitkomst-record is achteraf bewerkbaar (status, reden, contactpersoon, prijzen kunnen muteren)
- [ ] Pipeline-status zetten op `klant` opent WinDealDialog; bevestigen creëert een gewonnen Uitkomst-record; annuleren rolt pipeline-status terug
- [ ] LostDealDialog is verwijderd uit codebase (geen imports, geen rendering) — Uitkomst/Deal-tab vervangt deze functie volledig
- [ ] Per (module, provider) kan korting als % OF als absoluut € worden vastgelegd op een Uitkomst-record
- [ ] Vergelijking-tab toont, wanneer een Uitkomst met kortingen geopend is, herberekende totalen incl. die kortingen
- [ ] Korting-verwijdering herstelt publicatieprijs in vergelijking-tab voor die deal
- [ ] Audit-log record bestaat voor elke korting-mutatie (insert/update/delete) met user-id + timestamp + voor/na waarden
- [ ] Markt-dashboard route bestaat en toont alle telstanden + win-rate% + gemiddelde marge € met "Gebaseerd op N deals" badge
- [ ] Filter periode (30/90/365/custom) past de getoonde subset correct aan
- [ ] Filter niveau (vmbo/havo/vwo + sub-types) past de getoonde subset correct aan
- [ ] Trendgrafiek toont over de gekozen periode het aantal deals OF win-rate op de y-as (gebruikerskeuze)
- [ ] AI-voorspelling toont voor een open deal met bekend niveau + onderwijsvisie: win-kans% + cohort-grootte + matching features
- [ ] AI-voorspelling toont top verlies-reden in cohort wanneer cohort ≥1 verloren deal bevat
- [ ] AI-voorspelling toont fallback "eerste in z'n cohort" bij cohort-grootte = 0
- [ ] AI-voorspelling toont "lage betrouwbaarheid"-disclaimer bij cohort-grootte 1-4
- [ ] Supabase RLS-policies beperken zicht op deal_outcomes/deal_discounts/deal_audit_log tot eigen team
- [ ] Dashboard laadt <2s bij 500 deals (lokale meting in dev-omgeving)
- [ ] Geen regressies in bestaande markt-korting (MarktKortingToggle + KortingsPatroonAlert) en gevoeligheidsanalyse

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                              |
|--------------------|-------|------|--------|--------------------------------------------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | 5 deelfeatures elk concreet; cohort-AI helder als statistische op  |
| Boundary Clarity   | 0.80  | 0.70 | ✓      | Expliciete uit-scope-lijst; Phase 25/12/21 ongeraakt                |
| Constraint Clarity | 0.72  | 0.65 | ✓      | Storage + RLS + performance benoemd; engine-conventies vastgelegd  |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 21 pass/fail criteria; alle 5 requirements verifieerbaar           |
| **Ambiguity**      | 0.19  | ≤0.20| ✓      | Gate gehaald                                                       |

## Interview Log

| Round | Perspective         | Question summary                                       | Decision locked                                                                                  |
|-------|---------------------|-------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| 1     | Researcher          | Hoe verhoudt Uitkomst-tab zich tot LostDealDialog?   | LostDealDialog volledig vervangen; Uitkomst-tab is canoniek registratiepunt                      |
| 1     | Researcher          | Hoe registreren we GEWONNEN deal?                     | Pipeline → klant triggert WinDealDialog symmetrisch met LostDealDialog                           |
| 1     | Researcher          | Wat met bestaande markt-korting (MarktKortingToggle)? | Per-deal korting wordt aparte laag in Uitkomst-tab; markt-aggregaat blijft apart                 |
| 2     | Researcher/Simplifier | Hoe verhoudt pipeline-status zich tot Uitkomst?     | Twee aparte concepten: pipeline = procesfase, Uitkomst = eindstand, geen sync                    |
| 2     | Simplifier          | Minimaal dashboard?                                   | Full: telstanden + win-rate + marge + filters periode/niveau + trendgrafiek                       |
| 2     | Simplifier          | Korting-detail?                                       | Per module + per provider: korting% OF absoluut € (een van beide)                                |
| 3     | Boundary Keeper     | Korting feedback-loop naar Phase 25 aggregaat?       | Optie C: voor nu apart, noteren als FUTURE-XX                                                    |
| 3     | Boundary Keeper     | Historische data migreren?                            | Nee — alle bestaande data is testdata, schone start vanaf Phase 28                               |
| 3     | Boundary Keeper     | Wat NIET in scope?                                    | AI-voorspelling-historie (in), PDF-export-uitbreiding (out), CRM-sync (in→backlog), wizard-koppeling (neutral) |
| 3.5   | Boundary revisie    | CRM-sync nader bekeken                                | Microsoft Dynamics, maar als stub-laag — uiteindelijk verschoven naar backlog/FUTURE             |
| 4     | Failure Analyst     | AI-voorspelling drempel?                              | Cohort-gebaseerd: groepeert homogene scholen, altijd zichtbaar met N-badge betrouwbaarheid       |
| 4     | Failure Analyst     | Dynamics export-stub velden?                          | Verschoven naar backlog — geen Phase 28-werk                                                     |
| 4     | Failure Analyst     | Dashboard met weinig data?                            | Altijd cijfers tonen met "Gebaseerd op N deals" badge                                            |
| 5     | Seed Closer         | Welke cohort-features?                                | Onderwijsvisie + schoolniveau (vmbo/havo/vwo + sub-types)                                        |
| 5     | Seed Closer         | Uitkomst-tab acceptance?                              | 5 capabilities: status zetten, prijs-snapshot, reden, contactpersoon, achteraf bewerken           |
| 5     | Seed Closer         | Dashboard acceptance?                                 | Win-rate + totaal + marge + N-badge + filters periode/niveau + trendgrafiek (minimaal MVP)        |
| 6     | Seed Closer         | AI-voorspelling acceptance?                           | Win-kans% + cohort-grootte + matching features + top verlies-reden in cohort                     |

---

*Phase: 28-win-loss-tracking-marktpositie-aparte-uitkomst-deal-tab-per-*
*Spec created: 2026-05-14*
*Next step: /gsd-discuss-phase 28 — implementation decisions (data-model details, dashboard route, cohort-berekening client vs server, etc.)*
