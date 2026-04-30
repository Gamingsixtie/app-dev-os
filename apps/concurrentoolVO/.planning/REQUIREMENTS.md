# Requirements: Rekentool VO v2.0 — Sales Intelligence Platform

**Defined:** 2026-03-21
**Core Value:** Accountmanagers hebben tijdens elk schoolgesprek direct een onderbouwd, eerlijk en op de DMU afgestemd overzicht dat zowel financieel als in tijdsbesparing concreet maakt waarom Cito de beste keuze is.

## v2.0 Requirements

### Data & Architectuur

- [x] **ARCH-01**: Gebruiker kan meerdere schoolprofielen aanmaken, openen en verwijderen — elk met eigen wizard-data, prijsoverschrijvingen en gesprekshistorie
- [x] **ARCH-02**: Bestaande v1 localStorage-data wordt automatisch gemigreerd naar v2-structuur zonder dataverlies
- [x] **ARCH-03**: Applicatie gebruikt IndexedDB (Dexie) voor schooldata-persistentie met ondersteuning voor 50+ schoolprofielen
- [x] **ARCH-04**: Navigatie ondersteunt browser-back-button, deep linking naar specifieke school/view, en URL-state
- [x] **ARCH-05**: Applicatie werkt offline op tablet na eerste laden (service worker cacht assets en data)

### School Intelligence

- [x] **SCHOOL-01**: Gebruiker kan schoolprofiel aanmaken met basisgegevens (naam, type, leerlingaantallen, regio)
- [x] **SCHOOL-02**: Gebruiker kan per school het huidige productgebruik vastleggen (welke modules van welke aanbieder, met prijzen en bronvermelding)
- [x] **SCHOOL-03**: Gebruiker kan contactpersonen per school vastleggen met naam, rol en DMU-positie (coordinator, MT, finance)
- [x] **SCHOOL-04**: Gebruiker kan gespreksnotities per school toevoegen met datum, contactpersoon en kernpunten
- [x] **SCHOOL-05**: Gebruiker kan pipeline-status per school instellen (prospect, contact, offerte, besluit, klant, at-risk)
- [x] **SCHOOL-06**: Gebruiker ziet schooloverzicht met zoekfunctie, gesorteerd op laatst gebruikt, met pipeline-status badge
- [x] **SCHOOL-07**: Systeem detecteert upsell-kansen: modules waar school een concurrent gebruikt en overstap naar Cito voordelig is

### AI Intake

- [x] **INTAKE-01**: Gebruiker kan tijdens een telefoongesprek vrije tekst invoeren die real-time (streaming) wordt gestructureerd in schooldata, prijzen en actiepunten
- [x] **INTAKE-02**: AI extraheert modulegebruik, aanbieders, prijzen en contactpersonen uit vrije tekst met fuzzy matching op modulenamen
- [x] **INTAKE-03**: Geextraheerde data wordt getoond op een bevestigingsscherm waar de gebruiker kan corrigeren voordat het wordt opgeslagen
- [x] **INTAKE-04**: Prijzen worden semantisch gevalideerd tegen bekende ranges (per provider/module) — afwijkingen worden gemarkeerd als "ongebruikelijk, controleer"
- [x] **INTAKE-05**: AI intake voegt toe aan een bestaand schoolprofiel (append) — overschrijft niet eerder vastgelegde data

### Prijsvergelijking

- [x] **PRIJS-01**: Gebruiker ziet per geselecteerde module de kosten per leerling en totaalkosten per aanbieder (Cito, DIA, JIJ) naast elkaar
- [x] **PRIJS-02**: Gebruiker ziet een visuele vergelijking (staafdiagram) van totaalkosten per aanbieder
- [x] **PRIJS-03**: Gebruiker kan berekeningsdetails per module uitklappen en ziet de formule en inputs
- [x] **PRIJS-04**: Gebruiker kan prijzen handmatig overschrijven met bronvermelding, en de vergelijking herberekent reactief
- [x] **PRIJS-05**: Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) — onderscheidend vermogen
- [x] **PRIJS-06**: Engine berekent correcte DIA-pakketprijzen: als school 3+ DIA-modules afneemt wordt automatisch het voordeligste pakket berekend
- [x] **PRIJS-07**: Schoolspecifieke prijsoverschrijvingen (deals/kortingen) worden apart opgeslagen per school en niet verward met publicatieprijzen
- [x] **PRIJS-08**: Hybride scenario: engine berekent per module apart waar school wisselt van aanbieder en toont besparingen per module

### Gevoeligheidsanalyse

- [x] **GEVOEL-01**: Gebruiker kan in interne modus automatische gevoeligheidsanalyse zien: wat als DIA/JIJ 10% of 20% korting geeft
- [x] **GEVOEL-02**: Gevoeligheidsanalyse toont per kortingsscenario het effect op totaalverschil en per-module verschil
- [x] **GEVOEL-03**: Gebruiker ziet bij welk kortingspercentage de concurrent goedkoper wordt dan Cito (break-even korting)

### Waarde & Tijdwinst

- [x] **WAARDE-01**: Gebruiker ziet per taak (rechten, resetten, inloggen, planning, koppeling) de concrete uren bespaard met bewerkbare aannames
- [x] **WAARDE-02**: Gebruiker kan uurtarief instellen en ziet tijdsbesparing omgerekend naar euro's per jaar
- [x] **WAARDE-03**: Gebruiker ziet de totale waarde van de overstap: financieel verschil + tijdsbesparing in euro's
- [x] **WAARDE-04**: Gebruiker ziet meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing en break-even punt

### Migratie (Huidig → Nieuw Platform)

- [x] **MIGR-01**: Gebruiker ziet financieel verschil tussen huidig en nieuw Cito-platform per module en als totaal
- [x] **MIGR-02**: Migratie-engine verwerkt het gewijzigde prijsmodel van het nieuwe Cito-platform correct
- [x] **MIGR-03**: Gebruiker ziet gecombineerde business case: prijsverschil + tijdwinst + meerjarenprojectie

### DMU-Export

- [x] **EXPORT-01**: Gebruiker kan een PDF-rapport genereren afgestemd op de coordinator (focus: tijdwinst, dagelijks gebruik)
- [x] **EXPORT-02**: Gebruiker kan een PDF-rapport genereren afgestemd op MT/directie (focus: overzicht, onderbouwing, strategische waarde)
- [x] **EXPORT-03**: Gebruiker kan een PDF-rapport genereren afgestemd op finance (focus: euro's, meerjarenprojectie, terugverdientijd)
- [x] **EXPORT-04**: PDF-rapporten bevatten schoolspecifieke data, Cito-huisstijl, bronvermelding en disclaimer
- [x] **EXPORT-05**: Gebruiker kan vergelijking kopiëren naar clipboard als geformatteerde samenvatting

### Prijsbeheer

- [x] **PRIJSMGT-01**: Gebruiker kan prijzen handmatig invoeren of bijwerken met bron, verificatiedatum en vertrouwensniveau
- [x] **PRIJSMGT-02**: Prijzen ouder dan 6 maanden worden automatisch gemarkeerd als "mogelijk verouderd"
- [x] **PRIJSMGT-03**: Gebruiker kan prijsdocumenten uploaden (PDF) voor AI-gestuurde prijsextractie
- [x] **PRIJSMGT-04**: Geextraheerde prijzen worden getoond ter goedkeuring — nooit automatisch doorgevoerd

### Modus & Weergave

- [ ] **MODE-01**: Alle UI-tekst in formeel Nederlands (u-vorm)
- [x] **MODE-02**: Interne modus toont sales-signalen per module ("benadruk prijs" / "focus op kwaliteit" / "focus op meerwaarde")
- [ ] **MODE-03**: Applicatie is bruikbaar op tablet (touch-friendly, responsief)

### Wizard School-aanmaak Flow

- [x] **WIZ-01**: Bij "School toevoegen" handmatig wordt de schoolnaam gevraagd in een dialog voordat het schoolrecord wordt aangemaakt
- [x] **WIZ-02**: Incomplete scholen tonen een "Profiel voltooien" banner op het dashboard met link naar de wizard
- [x] **WIZ-03**: SchoolCard voor incomplete scholen linkt direct naar de wizard in plaats van het dashboard
- [x] **WIZ-04**: Zowel handmatige als "kies uit lijst" school-aanmaak flow werkt correct

## v2.x Requirements (Deferred)

### Toekomstige uitbreidingen

- **FUTURE-01**: AI-agent die zelfstandig concurrentprijzen opzoekt via web
- **FUTURE-02**: Scenario C engine (concurrentie → nieuw Cito-platform) als aparte flow
- **FUTURE-03**: Volledige tekst-zoekfunctie over alle gespreksnotities
- **FUTURE-04**: School data export/import voor overdracht tussen collega's
- **FUTURE-05**: Negotiation preparation card (pre-call cheat sheet)

## Out of Scope

| Feature | Reason |
|---------|--------|
| CRM-integratie (Salesforce/HubSpot) | Externe dependency, auth complexity, privacy. Schoolprofielen leven lokaal |
| Real-time voice transcriptie | AVG/GDPR vereist toestemming, technisch complex, privacy-risico |
| Automatische email-verzending | Accountmanager moet controle houden over relatie en timing |
| Gebruikersaccounts met login | Geen backend, geen auth — tool draait lokaal per device |
| Uitputtende feature-matrix concurrenten | Onderhoudsnachtmerrie, verschuift gesprek van behoefte naar checkboxes |
| Dynamische korting-suggesties | Prijsautoriteit bij sales management, niet bij de tool |

### Authenticatie & Deploy

- [x] **AUTH-01**: Gebruiker kan inloggen via email/wachtwoord of magic link met Supabase Auth
- [x] **AUTH-02**: Drie rollen: accountmanager (bewerkt eigen scholen), manager (leest alles), viewer (leest alles). Alle teamleden zien alle scholen.
- [x] **AUTH-03**: Elke wijziging toont wie (created_by/updated_by) en wanneer — traceerbaarheid per gebruiker
- [ ] **DEPLOY-01**: App draait op Vercel met Supabase backend, API keys server-side via serverless functions

### Architectuur Review

- [x] **REVIEW-01**: Architectuur-check, performance audit, security review en productie-readiness voordat de app live gaat

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 6, 8 | Complete |
| ARCH-02 | Phase 6, 8 | Complete |
| ARCH-03 | Phase 8 | Complete |
| ARCH-04 | Phase 6 | Complete |
| ARCH-05 | Phase 12 | Complete |
| AUTH-01 | Phase 8 | Complete |
| AUTH-02 | Phase 8 | Complete |
| AUTH-03 | Phase 8 | Complete |
| DEPLOY-01 | Phase 8 | Pending |
| SCHOOL-01 | Phase 7 | Complete |
| SCHOOL-02 | Phase 7 | Complete |
| SCHOOL-03 | Phase 7 | Complete |
| SCHOOL-04 | Phase 7 | Complete |
| SCHOOL-05 | Phase 7 | Complete |
| SCHOOL-06 | Phase 7 | Complete |
| SCHOOL-07 | Phase 11 | Complete |
| INTAKE-01 | Phase 9 | Complete |
| INTAKE-02 | Phase 9 | Complete |
| INTAKE-03 | Phase 9 | Complete |
| INTAKE-04 | Phase 9 | Complete |
| INTAKE-05 | Phase 9 | Complete |
| PRIJS-01 | Phase 10 | Complete |
| PRIJS-02 | Phase 10 | Complete |
| PRIJS-03 | Phase 10 | Complete |
| PRIJS-04 | Phase 10 | Complete |
| PRIJS-05 | Phase 10 | Complete |
| PRIJS-06 | Phase 10 | Complete |
| PRIJS-07 | Phase 7 | Complete |
| PRIJS-08 | Phase 10 | Complete |
| GEVOEL-01 | Phase 10 | Complete |
| GEVOEL-02 | Phase 10 | Complete |
| GEVOEL-03 | Phase 10 | Complete |
| WAARDE-01 | Phase 11 | Complete |
| WAARDE-02 | Phase 11 | Complete |
| WAARDE-03 | Phase 11 | Complete |
| WAARDE-04 | Phase 11 | Complete |
| MIGR-01 | Phase 11 | Complete |
| MIGR-02 | Phase 11 | Complete |
| MIGR-03 | Phase 11 | Complete |
| EXPORT-01 | Phase 12 | Complete |
| EXPORT-02 | Phase 12 | Complete |
| EXPORT-03 | Phase 12 | Complete |
| EXPORT-04 | Phase 12 | Complete |
| EXPORT-05 | Phase 12 | Complete |
| PRIJSMGT-01 | Phase 9 | Complete |
| PRIJSMGT-02 | Phase 9 | Complete |
| PRIJSMGT-03 | Phase 9 | Complete |
| PRIJSMGT-04 | Phase 9 | Complete |
| MODE-01 | Phase 6 | Pending |
| MODE-02 | Phase 10 | Complete |
| MODE-03 | Phase 6 | Pending |
| REVIEW-01 | Phase 13 | Complete |

**Coverage:**
- v2.0 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-22 after roadmap restructuring — Phase 8 split into Supabase & Deploy + AI Intake, phases renumbered 8-13*
