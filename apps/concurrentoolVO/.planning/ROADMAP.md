# Roadmap: Rekentool VO

## Milestones

- â **v1.0 Fundament** - Phases 1-5 (shipped 2026-03-20)
- ð§ **v2.0 Sales Intelligence Platform** - Phases 6-17 (in progress)

## Phases

<details>
<summary>â v1.0 Fundament (Phases 1-5) - SHIPPED 2026-03-20</summary>

### Phase 1: Fundament
**Goal**: Schoolprofiel-invoer, datastructuren, Cito-huisstijl en app-skelet
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, DATA-01, DATA-02, DATA-03, DATA-05, DATA-06, UX-03, UX-04
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md â Project scaffold, Tailwind CSS 4 theming, TypeScript data models, zustand store en zod schemas
- [x] 01-02-PLAN.md â 4-staps wizard UI met voortgangsbalk, navigatie en alle stap-componenten
- [x] 01-03-PLAN.md â Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

### Phase 2: Prijsvergelijking
**Goal**: Modulaire Cito vs. DIA vs. JIJ vergelijking met staafdiagram en transparante bronvermelding
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, DATA-04, INPUT-01, MODE-01
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md â Rekenmotor: pure calculateComparison functie, uitgebreide prijsdata, differentiator-data en nl-NL formatting (TDD)
- [x] 02-02-PLAN.md â Zustand store met draft/applied override-scheiding, Recharts staafdiagram en BusinessCaseCTA
- [x] 02-03-PLAN.md â ComparisonTable, ModuleDetailPanel met prijsoverschrijving, PriceComparisonPage en wizard-routing

### Phase 3: Business Case
**Goal**: Migratie huidig â nieuw Cito-platform met financieel verschil, tijdswinst en meerjarenprojectie
**Requirements**: BCASE-01, BCASE-02, BCASE-03, BCASE-04, BCASE-05, BCASE-06, BCASE-07
**Plans**: 2 plans

### Phase 4: Interne Modus & Doelgroepen
**Goal**: Sales-signalen, gevoeligheidsanalyse, doelgroep-perspectieven, print en clipboard-export
**Requirements**: MODE-02, MODE-03, MODE-04, MODE-05, DOELGR-01, DOELGR-02, DOELGR-03, EXPORT-01, EXPORT-02
**Plans**: 2 plans

### Phase 5: AI & Polish
**Goal**: AI-validatie, prijsinvoer en tablet-optimalisatie
**Requirements**: INPUT-02, INPUT-03, AI-01, AI-02, AI-03, UX-01, UX-02
**Plans**: 2 plans

</details>

### ð§ v2.0 Sales Intelligence Platform (In Progress)

**Milestone Goal:** Van statische prijsvergelijker naar dynamisch sales intelligence platform met multi-school persistentie, AI-intake, schoolprofielen, waarde-engine en DMU-exports.

**Phase Numbering:**
- Integer phases (6, 7, 8...): Planned milestone work
- Decimal phases (7.1, 7.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 6: Multi-School Data Layer** - IndexedDB persistentie, v1 migratie, navigatie-scaffolding en basisweergave
- [x] **Phase 7: School Intelligence** - Schoolprofielen met CRM-lite functionaliteit: contactpersonen, productgebruik, pipeline, gespreksnotities
- [x] **Phase 8: Supabase & Deploy** - Migratie naar Supabase (Postgres), Vercel hosting, auth met team-model, serverless AI-proxy
- [x] **Phase 9: AI Intake & Prijsbeheer** - AI-gestuurde gespreksverwerking, prijsbeheer met actieve selectie, document-upload extractie
- [x] **Phase 10: Prijsvergelijking & Gevoeligheid** - Uitgebreide vergelijkingsengine met DIA-pakketten, hybride scenario, differentiators en gevoeligheidsanalyse (completed 2026-03-22)
- [x] **Phase 10.1: Data Foundation** (INSERTED) - Prijsmodel-types, volledige module-catalogus, provider-configuraties (completed 2026-03-24)
- [x] **Phase 10.2: Engine Refactoring** (INSERTED) - Provider-aware berekeningen met JIJ-tiers, DIA-pakketten, prijsopbouw
 (completed 2026-03-24)
- [x] **Phase 10.3: UX Overhaul** (INSERTED) - Wizard redesign, dynamische vergelijkingstabel, prijsmodel-uitleg (completed 2026-03-24)
- [x] **Phase 11: Waarde-engine & Migratie** - Tijdwinst in euro's, meerjarenprojectie, migratie-businesscase en upsell-detectie (completed 2026-03-23)
- [x] **Phase 12: DMU-Export & Offline** - PDF-rapporten per DMU-rol, clipboard-export en offline werking (completed 2026-03-24)
- [x] **Phase 13: Architectuur Review & Go-Live** - Architectuur-check, performance audit, security review en productie-readiness voor online deployment (completed 2026-03-24)
- [x] **Phase 14: Schoolplan Upload & Kansen-analyse** - AI-analyse van geÃ¼pload schoolplan om Cito-kansen en concurrentie-verdwijning inzichtelijk te maken (completed 2026-03-23)
- [x] **Phase 15: DMU Klantreis Registratie** - Registratie van DMU-contactpersonen in de klantreis, van eerste contact tot aan beslissing
 (completed 2026-03-23)
- [x] **Phase 15.1: Framework-analyse & Samenhang** (INSERTED) - Diepgaande analyse van het complete framework: correctheid engines, koppelingen, AI-inzet, logische stappen en verbeterpunten (completed 2026-03-23)
- [x] **Phase 16: AI Wizard Verbetering & Prijsvergelijking Harmonisatie** - Eerlijke concurrentievergelijking via verbeterde AI wizard (concurrent-selectie â AI-advies â tabblad-synchronisatie) met correcte variant-matching voor DIA/JIJ (completed 2026-03-25)
- [x] **Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking** - Scholen op het huidige Cito-platform kunnen vergelijken met DIA/JIJ zonder aanname van migratie naar nieuw platform â extra wizard-scenario voor bestaande Cito-klanten die concurrentie evalueren
 (completed 2026-03-28)
- [ ] **Phase 18: Contactbeheer Upgrade & Klantreis-inzicht** - DMU-posities handmatig toewijzen (eenmalig, geldt overal), klantreis-tijdlijn per school met contactvolgorde en blokkades, en totaaloverzicht in school-dashboard
- [x] **Phase 19: Gesprekken-tab & Acties Upgrade** - Gesprekken vastleggen zonder AI (dat doet de wizard al), spraaknotities, contactpersoon-koppeling per gesprek, en verfijnd actie-tabblad met inline invoer en verwijder-bevestiging (completed 2026-03-25)
- [ ] **Phase 20: Waarde-tab Veilig Verwijderen** - Het Waarde-tabblad volledig verwijderen uit de app zonder dat andere tabs, routes, stores of exports kapot gaan — alle afhankelijkheden opruimen en de app stabiel houden
- [ ] **Phase 21: DMU-Export Upgrade** - Export-tab met DMU-gerichte rapporten (coördinator, MT/directie, finance) op basis van generieke aannames, met geëxtraheerde tekst uit schoolplan en Cito-bronnen
- [x] **Phase 22: Architectuur, Testen & Productie-readiness** - Complete architectuurreview, end-to-end tests, integratietests en productie-hardening zodat het prototype volledig productiegereed is
 (completed 2026-03-28)
 (completed 2026-03-25)
- [x] **Phase 24: UX-audit Vergelijkingsoverzicht** - Vergelijkingsoverzicht UX-technisch doorgelicht en geoptimaliseerd: doublures geëlimineerd, progressive disclosure, stakeholder-ready (completed 2026-03-28)
- [~] **Phase 25: Prijsintelligentie & Stakeholder Feedback Loop** - Database-driven prijsdata met stakeholder-feedbackworkflow: flaggen, corrigeren, valideren, audittrail, automatische herberekening en ops-competitor-intel skill _(CLOSED – INCOMPLETE 2026-05-14: 11/12 plans gedaan, 25-07 UI-integration deferred — verder niet afgemaakt, zie Phase 25 details)_
- [ ] **Phase 26: Cito Prijzen + Concurrentie Editor** - Startscherm-entry naast Schooloverzicht met dedicated prijs-editor (tabs Basisvaardigheden/Modules/Concurrentie), multi-format export (PDF/HTML/Word/TXT) en optionele AI-Excel-import met diff-preview

## Phase Details

### Phase 6: Multi-School Data Layer
**Goal**: Applicatie ondersteunt meerdere schoolprofielen met persistente opslag, bestaande v1-data behouden, en navigatie met browser-history
**Depends on**: v1.0 (Phase 5)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, MODE-01, MODE-03
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een nieuw schoolprofiel aanmaken, opslaan, heropenen en verwijderen â data blijft bewaard na browser-herstart
  2. Bestaande v1-data (wizard inputs, prijsoverschrijvingen) is automatisch beschikbaar als schoolprofiel in de v2-interface zonder handmatige actie
  3. Gebruiker kan via browser-back-button terug navigeren naar vorige view en via URL direct naar een specifieke school/view gaan
  4. Alle UI-tekst is in formeel Nederlands (u-vorm) en de interface is bruikbaar op tablet met touch
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md â Dexie database, SchoolRecord types, CRUD operations, slug utility en v1 localStorage migratie (TDD)
- [ ] 06-02-PLAN.md â TanStack Router setup met code-based routing, route guards en smart redirect
- [ ] 06-03-PLAN.md â Store refactoring, SchoolLayout, school overview UI, migration wizard, wizard naamveld en App.tsx rewrite

### Phase 7: School Intelligence
**Goal**: Accountmanager heeft per school een compleet profiel met contactpersonen, productgebruik, gesprekshistorie en pipeline-status â en kan snel de juiste school vinden
**Depends on**: Phase 6
**Requirements**: SCHOOL-01, SCHOOL-02, SCHOOL-03, SCHOOL-04, SCHOOL-05, SCHOOL-06, PRIJS-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een school aanmaken met basisgegevens en per school vastleggen welke modules van welke aanbieder worden gebruikt, inclusief prijzen en bron
  2. Gebruiker kan contactpersonen (naam, rol, DMU-positie) en gespreksnotities (datum, contactpersoon, kernpunten) per school beheren
  3. Gebruiker kan pipeline-status instellen (prospect t/m at-risk) en ziet een doorzoekbaar schooloverzicht gesorteerd op laatst gebruikt met status-badges
  4. Schoolspecifieke prijsoverschrijvingen (deals/kortingen) worden apart opgeslagen per school en worden niet verward met publicatieprijzen
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md â CRM-lite data layer: types, Dexie v2 schema migratie, CRUD operaties, Zod schemas en timeline utility
- [x] 07-02-PLAN.md â Profiel-UI: tab-routing, ProfileHeader, TabNavigation, DashboardTab, ComparisonTab, ProductsTab en pipeline-management
- [x] 07-03-PLAN.md â ContactsTab met CRUD en DMU-mapping, ConversationsTab met tijdlijn, tags, zoekfunctie en kanban-actielijst
- [x] 07-04-PLAN.md â Schooloverzicht: FilterBar, ViewToggle, CardModeToggle, PipelineKanbanView met drag & drop en visuele verificatie

### Phase 8: Supabase & Deploy
**Goal**: Migratie van lokale IndexedDB/Dexie-architectuur naar Supabase (Postgres) met Vercel hosting, team-authenticatie (accountmanager/manager/viewer), serverless AI-proxy en data-migratie
**Depends on**: Phase 7
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, AUTH-01, AUTH-02, AUTH-03, DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. Alle schooldata is opgeslagen in Supabase Postgres met genormaliseerd schema (schools, contacts, conversations, actions, system_events, school_prices tabellen)
  2. Gebruiker kan inloggen via email/wachtwoord of magic link en ziet alleen data van het eigen team â accountmanagers bewerken eigen scholen, managers en viewers zijn read-only
  3. Bestaande IndexedDB data wordt bij eerste login automatisch gemigreerd naar Supabase zonder dataverlies
  4. AI-calls lopen via Vercel serverless functions met server-side API key â geen API keys in de browser
  5. App is bereikbaar via Vercel URL met werkende auth, database en AI-proxy
**Plans**: 5 plans

Plans:
- [x] 08-01-PLAN.md â Supabase client, Database types, genormaliseerd SQL schema (8 tabellen) en RLS policies
- [x] 08-02-PLAN.md â Auth systeem: AuthProvider, LoginPage, ProtectedRoute, UserMenu en AuthLoadingScreen
- [x] 08-03-PLAN.md â Data layer migratie: operations.ts herschrijven voor Supabase, React Query hooks, QueryClientProvider
- [x] 08-04-PLAN.md â Cloud migratie wizard (IndexedDB naar Supabase) en role-based UI componenten
- [x] 08-05-PLAN.md â Vercel serverless AI proxy, useLiveQuery vervanging, component integratie en deploy verificatie

### Phase 9: AI Intake & Prijsbeheer
**Goal**: Accountmanager kan tijdens een telefoongesprek vrije tekst invoeren die real-time wordt gestructureerd in schooldata, en kan prijzen beheren met actieve selectie, handmatige invoer en document-upload extractie (PDF/Excel/Word/CSV)
**Depends on**: Phase 8
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, PRIJSMGT-01, PRIJSMGT-02, PRIJSMGT-03, PRIJSMGT-04
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan in de Gesprekken-tab vrije tekst invoeren die real-time (streaming) wordt gestructureerd â modules, aanbieders, prijzen, contactpersonen en actiepunten worden herkend
  2. GeÃ«xtraheerde data verschijnt in een diff-view bevestigingsscherm waar de gebruiker per item kan aanvinken wat overgenomen wordt â bestaande data wordt getoond als referentie
  3. AI intake voegt toe aan een bestaand schoolprofiel zonder eerdere data te overschrijven
  4. Gebruiker kan in de Producten-tab meerdere prijzen per module/aanbieder beheren met prijsgeschiedenis, en kiest welke prijs actief is met een verplichte reden â met bruto/netto onderscheid
  5. Gebruiker kan een document (PDF, Excel, Word, CSV) uploaden en de AI extraheert prijzen die in dezelfde diff-view ter goedkeuring worden getoond â nooit automatisch doorgevoerd
  6. Prijzen worden gevalideerd tegen publicatieprijzen (>50% afwijking = inline â  waarschuwing) of gemarkeerd als handmatige invoer als geen referentie beschikbaar is
**Plans**: 5 plans

Plans:
- [x] 09-00-PLAN.md â Wave 0: test stub files voor alle Phase 9 plannen (8 test stubs)
- [x] 09-01-PLAN.md â Shared foundation: extended extraction schema, price deviation logic, useSchoolPrices hook, PriceBadge extension en serverless v2 prompt
- [x] 09-02-PLAN.md â AI intake flow: IntakeModeToggle, StreamingExtraction, DiffView components (met bewerkbare velden), ConversationForm AI-modus en append-only save
- [x] 09-03-PLAN.md â Prijsbeheer UI: PriceManager, PriceEditModal, PriceHistoryList, ProductsTab uitbreiding met prijsgeschiedenis en actieve selectie
- [x] 09-04-PLAN.md â Document upload: documents bucket, serverless document parser (PDF/Excel/Word/CSV), DocumentDropzone, DocumentExtractionPreview en ProductsTab integratie

### Phase 10: Prijsvergelijking & Gevoeligheid
**Goal**: Accountmanager ziet een compleet, interactief prijsvergelijkingsoverzicht met DIA-pakketlogica en JIJ-pakketlogica, hybride scenario's, onderscheidend vermogen en gevoeligheidsanalyse voor interne voorbereiding
**Depends on**: Phase 8 (Supabase), Phase 9 (prijsdata)
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, PRIJS-08, GEVOEL-01, GEVOEL-02, GEVOEL-03, MODE-02
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per module de kosten per leerling en totaalkosten per aanbieder naast elkaar, met visueel staafdiagram en uitklapbare berekeningsdetails
  2. Gebruiker kan prijzen handmatig overschrijven met bronvermelding en de vergelijking herberekent reactief â DIA-pakketprijzen worden automatisch correct berekend bij 3+ modules
  3. Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) als onderscheidend vermogen
  4. Hybride scenario berekent per module apart de besparingen waar een school van aanbieder wisselt
  5. In interne modus ziet de gebruiker gevoeligheidsanalyse met 10%/20% kortingsscenario's, het effect per module, en het break-even kortingspercentage â plus sales-signalen per module
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md â TDD engine: DIA-pakketprijzen, hybride scenario, gevoeligheidsanalyse met break-even en sales-signalen (4 engine files + 4 test files)
- [x] 10-02-PLAN.md â Store uitbreiding en UI-componenten: ModeToggle, PeriodToggle, SalesSignalBadge, SensitivitySection + wiring in ComparisonTable, Chart, DetailPanel en Page
- [x] 10-03-PLAN.md â Visuele verificatie van alle Phase 10 features goedgekeurd door gebruiker; DiaPackageManager UI uitgesteld naar post-Vercel deployment

### Phase 10.1: Data Foundation â Prijsmodel & Module-uitbreiding (INSERTED)
**Goal**: Correcte datastructuren die de werkelijke prijsmodellen van alle aanbieders weerspiegelen, met volledige productcatalogus
**Depends on**: Phase 10, User input (prijsstructuur-informatie via ops-competitor-intel)
**Requirements**: PRIJS-01, PRIJS-06
**Success Criteria** (what must be TRUE):
  1. MODULE_CATALOG bevat de volledige VO-productcatalogus per aanbieder (niet slechts 6 modules) met categorien, provider-beschikbaarheid en aliassen
  2. Prijsmodel-types zijn gedefinieerd als discriminated union (flat / tiered-license / package-bundle / platform+module) in een PricingStrategy type
  3. Provider-specifieke configuratiebestanden (src/data/providers/cito.ts, dia.ts, jij.ts) bevatten het volledige prijsmodel inclusief tiers, pakketten en platformkosten
  4. Bestaande default-prices.ts, dia-packages.ts en jij-license-tiers.ts data is gemigreerd naar de provider-configuraties
  5. Differentiators zijn uitgebreid voor alle nieuwe modules
**Plans**: 2 plans

Plans:
- [x] 10.1-01-PLAN.md â Types (PricingStrategy union), MODULE_CATALOG uitbreiding (10 modules), differentiators, test scaffolds
- [x] 10.1-02-PLAN.md â Provider config files (cito.ts, dia.ts, jij.ts, saqi.ts), re-export wrappers, backward compatibility, migratie-verificatie

### Phase 10.2: Engine Refactoring â Provider-aware berekeningen (INSERTED)
**Goal**: De rekenmotor begrijpt de werkelijke prijsmodellen per aanbieder en rekent correct op basis van schoolgrootte
**Depends on**: Phase 10.1
**Requirements**: PRIJS-01, PRIJS-06, PRIJS-08
**Success Criteria** (what must be TRUE):
  1. Per aanbieder bestaat een pure ProviderPriceCalculator die het prijsmodel van die aanbieder implementeert (flat, tiers, pakketten)
  2. calculateComparison() gebruikt de provider-calculators en produceert per module een prijsopbouw (breakdown) die uitlegt HOE de prijs tot stand komt
  3. JIJ-prijs varieert daadwerkelijk met schoolgrootte (tier-selectie op basis van leerlingaantal), niet meer een flat schatting
  4. DIA-pakketoptimalisatie werkt automatisch in de vergelijking (bestaande dia-packages engine geintegreerd)
  5. Schoolspecifieke prijsoverschrijvingen (Supabase) gaan boven de provider-calculator
**Plans**: 2 plans

Plans:
- [x] 10.2-01-PLAN.md â TDD: ProviderPriceCalculator interface, 4 calculators (Cito/DIA/JIJ/Flat), factory, refactored calculateComparison() met breakdowns
- [x] 10.2-02-PLAN.md â Store simplificatie: provider-logica verwijderd, nieuwe engine-signature, parity-verificatie en cleanup

### Phase 10.3: UX Overhaul â Wizard & Vergelijking (INSERTED)
**Goal**: Overzichtelijke, flexibele wizard en vergelijkingsweergave met dynamische provider-kolommen, prijsmodel-uitleg en prijsopbouw
**Depends on**: Phase 10.2
**Requirements**: PRIJS-01, PRIJS-03, PRIJS-05, UX-01
**Success Criteria** (what must be TRUE):
  1. Module-selectie wizard toont de uitgebreide catalogus gegroepeerd per categorie, met provider-beschikbaarheid badges en quick-pick combinaties
  2. Vergelijkingstabel heeft dynamische provider-kolommen (gebruiker kiest welke aanbieders te vergelijken)
  3. Per aanbieder is een uitklapbare prijsmodel-uitleg zichtbaar die uitlegt HOE die aanbieder prijst (pakketten, tiers, flat)
  4. Module detail-panel toont de volledige prijsopbouw per aanbieder (hoe het bedrag is berekend)
  5. Schoolgrootte-impact is visueel: gebruiker ziet welke JIJ-tier en welk DIA-pakket actief is bij deze schoolgrootte
**Plans**: 2 plans

- [x] 10.3-01-PLAN.md ï¿½ Wizard Step 3 provider badges, quick-picks, MVT subcategorie + store visibleProviders
- [x] 10.3-02-PLAN.md ï¿½ ComparisonTable dynamische kolommen, ModuleDetailPanel prijsopbouw per aanbieder
- [x] 10.3-03-PLAN.md ï¿½ ProviderSelector, PricingModelCards, inline CitoBundleSelector en visuele verificatie

### Phase 11: Waarde-engine & Migratie
**Goal**: Accountmanager kan de totale waarde van Cito onderbouwen: prijsverschil plus tijdwinst in euro's, meerjarenprojectie, migratie-businesscase en automatische upsell-detectie
**Depends on**: Phase 10 (prijsvergelijking)
**Requirements**: WAARDE-01, WAARDE-02, WAARDE-03, WAARDE-04, MIGR-01, MIGR-02, MIGR-03, SCHOOL-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per taak (rechten, resetten, inloggen, planning, koppeling) de concrete uren bespaard met bewerkbare aannames, en kan optioneel een uurtarief instellen om tijdsbesparing in euro's te zien
  2. Gebruiker ziet de totale waarde van de overstap: financieel verschil plus tijdsbesparing in euro's, met meerjarenprojectie over 1 en 3 jaar inclusief cumulatieve besparing en break-even punt
  3. Gebruiker ziet het financieel verschil tussen huidig en nieuw Cito-platform per module en als totaal, met een gecombineerde businesscase (prijsverschil + tijdwinst + meerjarenprojectie)
  4. Systeem detecteert automatisch upsell-kansen: modules waar school een concurrent gebruikt en overstap naar Cito voordelig is
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md â TDD engines: migratie-engine uitbreiden met switchingCosts en break-even, nieuwe upsell-detectie engine, data layer uitbreiding (SchoolRecord + Supabase)
- [x] 11-02-PLAN.md â WaardeTab UI: hero-kaart, tijdwinst-tabel, migratie-tabel, meerjarenprojectie-chart, EditableField extractie, tab-routing en navigatie
- [x] 11-03-PLAN.md â Upsell UI: UpsellCard op school-dashboard, UpsellBadge op schoolkaarten, visuele verificatie alle Phase 11 features

### Phase 12: DMU-Export & Offline
**Goal**: Accountmanager kan na elk gesprek direct een op de DMU afgestemd PDF-rapport genereren en de applicatie werkt offline op tablet
**Depends on**: Phase 11 (waarde-engine, migratie), Phase 10 (prijsvergelijking)
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, ARCH-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een PDF-rapport genereren per DMU-rol: coordinator (tijdwinst, dagelijks gebruik), MT (overzicht, onderbouwing, strategische waarde), finance (euro's, meerjarenprojectie, terugverdientijd)
  2. PDF-rapporten bevatten schoolspecifieke data, Cito-huisstijl (Primary #003082, Accent #FF6600), bronvermelding en disclaimer
  3. Gebruiker kan de vergelijking kopiÃ«ren naar clipboard als geformatteerde samenvatting
  4. Applicatie werkt offline op tablet na eerste laden â service worker cacht assets en data
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md â PDF verbetering: SVG staafdiagram, SchoolplanSection, multi-page, DMU-samenvatting
- [x] 12-02-PLAN.md â Clipboard export: geformatteerde kopieer-functionaliteit voor email/Teams
- [x] 12-03-PLAN.md â PWA/Offline: service worker, offline-banner, mutatie-queue

### Phase 13: Architectuur Review & Go-Live
**Goal**: Volledige architectuur-check, performance audit, security review en productie-readiness verificatie voordat de app live gaat voor het team
**Depends on**: Phase 12
**Requirements**: REVIEW-01
**Success Criteria** (what must be TRUE):
  1. Architectuur-review bevestigt dat Supabase schema, RLS policies, serverless functions en auth correct werken onder productie-condities
  2. Performance audit: pagina-laadtijd <2s, AI-response <5s, database queries <500ms voor 200+ scholen
  3. Security review: geen API keys in frontend, RLS policies getest, auth flow veilig, CORS correct
  4. Data-integriteit: migratie van IndexedDB naar Supabase is volledig en correct, geen dataverlies
  5. Team kan de app gebruiken via de productie-URL met stabiele performance
**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md â Security hardening: SKIP_AUTH productie-guard, schoolplan_analyses RLS fix, storage bucket RLS fix, VITE_ANTHROPIC_API_KEY verwijderd
- [x] 13-02-PLAN.md â Build fix: offline-queue.ts TypeScript error, bundle verificatie, productie build
- [x] 13-03-PLAN.md â Productie-readiness: performance audit, data-integriteit verificatie, deployment check
### Phase 14: Schoolplan Upload & Kansen-analyse
**Goal**: Accountmanager kan een schoolplan (PDF/Word) uploaden dat door AI wordt geanalyseerd om Cito-kansen te identificeren, concurrentie-verdwijning te signaleren en strategische inzichten per school te genereren
**Depends on**: Phase 9 (document upload infra), Phase 7 (schoolprofielen)
**Requirements**: SC-01, SC-02, SC-03, SC-04, SC-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een schoolplan-document (PDF/Word) uploaden per school
  2. AI extraheert relevante thema's, doelen en prioriteiten uit het schoolplan
  3. Systeem matcht schoolplan-thema's met Cito-productaanbod en toont concrete kansen (bijv. "school focust op adaptief toetsen â Cito Volgsysteem is relevant")
  4. Systeem signaleert waar concurrenten kwetsbaar zijn op basis van schoolplan-prioriteiten (bijv. "school wil meer data-inzicht â DIA biedt dit beperkt")
  5. Kansen en inzichten worden opgeslagen bij het schoolprofiel en zijn zichtbaar in het school-dashboard
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md â Data foundation: Zod schemas, model config, Supabase migration, React Query hooks en client orchestrator
- [x] 14-02-PLAN.md â Serverless analyse: twee-stappen AI pipeline (samenvatting + kansen-matching) met SSE streaming
- [x] 14-03-PLAN.md â Schoolplan-tab UI: route, componenten (KansCard, KansCardList, streaming progress), SchoolplanTab container en visuele verificatie

### Phase 15: DMU Klantreis Registratie
**Goal**: Accountmanager kan per school de DMU-contactpersonen volgen door de engagement-klantreis met 6 statussen (Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt), met DMU-beslissingsoverzicht, stagnatie-detectie en filtering
**Depends on**: Phase 7 (contactpersonen), Phase 8 (Supabase)
**Requirements**: KR-01, KR-02, KR-03, KR-04, KR-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan per DMU-contactpersoon een engagement-status instellen: Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt
  2. Elke statuswijziging wordt vastgelegd als systeemevent met datum en optionele notitie â de volledige tijdlijn is zichtbaar per contactpersoon
  3. School-dashboard toont een DMU-beslissingsoverzicht (matrix) van alle DMU-leden en hun huidige status, zodat de accountmanager in een oogopslag ziet wie waar staat
  4. Gebruiker kan filteren op engagement-status in het schooloverzicht (bijv. "toon alle scholen met DMU in positief-fase")
  5. Systeem toont hoelang een contactpersoon al in de huidige fase zit en signaleert stagnatie (>30 dagen in dezelfde fase)
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md â Data foundation: EngagementStatus types, Supabase migration, setEngagementStatus operation, Zod schema en unit tests
- [x] 15-02-PLAN.md â School-profiel UI: EngagementBadge, DropOffReasonDialog, DmuMatrix, DmuMismatchBanner en DashboardTab integratie
- [x] 15-03-PLAN.md â School-overzicht UI: DmuProgressIndicator op kaarten, DmuStatusFilter, getAllSchools contacts join en filtering

### Phase 15.1: Framework-analyse & Samenhang (INSERTED)
**Goal**: Diepgaande analyse van het complete framework: correctheid engines, koppelingen tussen modules, AI-inzet, logische stappen en verbeterpunten
**Depends on**: Phase 15 (laatste afgeronde fase)
**Success Criteria**: Verbeterrapport opgeleverd met must/should/could prioritering
**Plans**: 1 plan

Plans:
- [x] FRAMEWORK-ANALYSE.md â Volledige analyse met 4 MUST, 9 SHOULD en 10 COULD verbeterpunten

## Progress

**Execution Order:**
Phases execute in custom order: 6 â 7 â 8 â 9 â 10 â 11 â 14 â 15 â 15.1 â 13 â 12
(Reprioritized 2026-03-23: Phase 14/15 first for feature value, then go-live, then DMU-export on termijn)
(Decimal phases, if inserted, execute between their surrounding integers)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fundament | v1.0 | 3/3 | Complete | 2026-03-20 |
| 2. Prijsvergelijking | v1.0 | 3/3 | Complete | 2026-03-20 |
| 3. Business Case | v1.0 | 2/2 | Complete | 2026-03-20 |
| 4. Interne Modus & Doelgroepen | v1.0 | 2/2 | Complete | 2026-03-20 |
| 5. AI & Polish | v1.0 | 2/2 | Complete | 2026-03-20 |
| 6. Multi-School Data Layer | v2.0 | 3/3 | Superseded (absorbed by 7+8) | 2026-03-22 |
| 7. School Intelligence | v2.0 | 4/4 | Complete | 2026-03-22 |
| 8. Supabase & Deploy | v2.0 | 5/5 | Complete | 2026-03-22 |
| 9. AI Intake & Prijsbeheer | v2.0 | 5/5 | Complete | 2026-03-22 |
| 10. Prijsvergelijking & Gevoeligheid | v2.0 | 3/3 | Complete | 2026-03-22 |
| 10.1 Data Foundation: Prijsmodel & Modules | v2.0 | 2/2 | Complete    | 2026-03-24 |
| 10.2 Engine Refactoring: Provider-aware | v2.0 | 2/2 | Complete    | 2026-03-24 |
| 10.3 UX Overhaul: Wizard & Vergelijking | v2.0 | 2/3 | Complete    | 2026-03-24 |
| 11. Waarde-engine & Migratie | v2.0 | 3/3 | Complete    | 2026-03-23 |
| 12. DMU-Export & Offline | v2.0 | 3/3 | Complete    | 2026-03-24 |
| 13. Architectuur Review & Go-Live | v2.0 | 3/3 | Complete    | 2026-03-24 |
| 14. Schoolplan Upload & Kansen-analyse | v2.0 | 3/3 | Complete   | 2026-03-23 |
| 15. DMU Klantreis Registratie | v2.0 | 3/3 | Complete    | 2026-03-23 |
| 15.1 Framework-analyse & Samenhang | v2.0 | 1/1 | Complete | 2026-03-23 |
| 16. AI Wizard & Prijsvergelijking Harmonisatie | v2.0 | 3/3 | Complete    | 2026-03-25 |
| 17. Huidig Cito vs. Concurrent | v2.0 | 4/4 | Complete    | 2026-03-28 |
| 18. Contactbeheer Upgrade & Klantreis-inzicht | v2.0 | 0/0 | Not Started | — |
| 19. Gesprekken-tab & Acties Upgrade | v2.0 | 0/3 | Complete    | 2026-03-25 |
| 20. Vergelijking & Waarde Optimalisatie | v2.0 | 0/0 | Not Started | — |
| 21. DMU-Export Upgrade | v2.0 | 2/3 | In Progress|  |
| 22. Architectuur, Testen & Productie-readiness | v2.0 | 6/6 | Complete    | 2026-03-28 |
| 24. UX-audit Vergelijkingsoverzicht | v2.0 | 2/2 | Complete    | 2026-03-28 |
| 25. Prijsintelligentie & Stakeholder Feedback Loop | v2.0 | 11/12 | Closed (Incomplete) | 2026-05-14 |

### Phase 16: AI Wizard Verbetering & Prijsvergelijking Harmonisatie
**Goal**: Eerlijke, correcte en consistente vergelijking tussen Cito en concurrenten (DIA/JIJ) ondanks hun verschillende varianten-structuren, via een verbeterde AI wizard met drie logische stappen
**Depends on**: Phase 10.3 (UX Overhaul), Phase 10.2 (Engine Refactoring)
**Requirements**: PRIJS-01, PRIJS-03, PRIJS-05, PRIJS-06
**Success Criteria** (what must be TRUE):
  1. Gebruiker kiest in een eerste stap welk specifiek aanbod/variant van de concurrent (DIA of JIJ) wordt gebruikt als vergelijkingsbasis â de wizard toont de beschikbare varianten per concurrent
  2. AI wizard genereert na de selectie een eerlijk vergelijkingsadvies dat het geselecteerde concurrent-aanbod correct matcht met het juiste Cito-aanbod, inclusief uitleg waarom deze matching eerlijk is
  3. AI gebruikt de correcte concurrentie-informatie (prijzen, features, pakketten) uit de provider-configuraties voor het advies
  4. Prijzen en tabelweergave in het tabblad vergelijking zijn identiek aan de output van de wizard â geen afwijkingen tussen wizard-resultaat en vergelijkingstab
  5. Tabelweergave in het vergelijkingstabblad weerspiegelt exact de input (geselecteerde variant, prijzen, modules) zonder dataverlies of transformatie-fouten
**Plans:** 3/3 plans complete

- [x] 16-01-PLAN.md â Types, wizard store, scenario detection, variant suggestions, AI endpoints
- [x] 16-02-PLAN.md â Wizard shell, progress bar, step 1 notes, step 2 variant selection
- [x] 16-03-PLAN.md â Step 3 AI advice streaming, PriceComparisonPage integration, visual verification

### Phase 17: Huidig Cito-platform vs. Concurrent Prijsvergelijking
**Goal**: Scholen die op het huidige Cito-platform zitten kunnen een eerlijke prijsvergelijking doen met DIA en JIJ, zonder de aanname dat ze naar het nieuwe Cito-platform migreren. De wizard herkent dit scenario en vergelijkt de huidige Cito-situatie (bestaande modules, huidige prijzen) direct met wat de concurrent biedt â zodat accountmanagers ook voor bestaande klanten die de markt verkennen een onderbouwd verhaal hebben.
**Depends on**: Phase 16 (AI Wizard)
**Requirements**: SC17-01, SC17-02, SC17-03, SC17-04, SC17-05
**Success Criteria** (what must be TRUE):
  1. Wizard herkent het scenario "school zit op huidig Cito-platform en wil vergelijken met concurrent" als aparte flow naast de bestaande scenario's
  2. Vergelijking gebruikt de huidige Cito-prijzen/modules van de school, niet de tarieven van het nieuwe platform
  3. AI-advies houdt rekening met het feit dat de school al Cito-klant is en genereert passend advies (retentie-perspectief, niet acquisitie)
  4. Resultaat in vergelijkingstabel toont huidig Cito vs. concurrent, niet nieuw Cito vs. concurrent
  5. ScenarioDetector vangt dit scenario correct op en routeert naar de juiste flow
**Plans:** 4/4 plans complete

Plans:
- [x] 17-01-PLAN.md — Types, engine scenario detection, old-platform price helper en tests
- [x] 17-02-PLAN.md — ScenarioDetector keuze-UI, wizard store Scenario C, ComparisonTab routing
- [x] 17-03-PLAN.md — AI retentie-advies, ComparisonTable label override, visuele verificatie
- [x] 17-04-PLAN.md — Gap closure: retention advice wiring fix + UX verbeteringen (advies rendering, tabel formatting, pakketkeuze, basisvaardigheden)

### Phase 18: Contactbeheer Upgrade & Klantreis-inzicht
**Goal**: Accountmanager kan per school DMU-posities handmatig toewijzen aan contactpersonen (beslisser, adviseur, gebruiker, inkoper, etc.) — eenmalig instellen, overal beschikbaar. Onder het tabblad Contacten wordt de volledige klantreis zichtbaar: wie was het eerste contactpunt, met wie moet intern overlegd worden, waar hangt de beslissing om en waar loopt het vast. Het school-dashboard toont een totaaloverzicht van de DMU-structuur en klantreis-voortgang.
**Depends on**: Phase 15 (DMU Klantreis), Phase 7 (contactpersonen)
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan per contactpersoon handmatig een DMU-positie toewijzen (beslisser, adviseur, gebruiker, inkoper, beïnvloeder) — dit wordt eenmalig ingesteld en is vervolgens overal in de app beschikbaar
  2. Onder het tabblad Contacten is per school zichtbaar wie welke DMU-rol heeft, wie de beslisser is en wie adviseert — met duidelijke visuele hiërarchie
  3. Klantreis-tijdlijn toont chronologisch: wie was het eerste contact, wie is daarna benaderd, met wie moet overlegd worden, en waar loopt het proces vast — inclusief blokkades en notities
  4. School-dashboard (totaaloverzicht) toont een samenvatting van de DMU-structuur en klantreis-status zodat de accountmanager in één oogopslag ziet hoe het salesproces ervoor staat
  5. DMU-posities en klantreis-data worden persistent opgeslagen en zijn beschikbaar voor alle views (contacten-tab, dashboard, exports)
**Plans:** 8 plans

Plans:
- [x] 25-01-PLAN.md — DB schema (publication_prices, pricing_configs, price_proposals, audit_log) + seed + CRUD
- [x] 25-02-PLAN.md — Pricing data store (Zustand + persist) + engine config injection + offline fallback
- [x] 25-03-PLAN.md — Price proposal submission: hooks, modal, ProposalBadge, PriceDiffDisplay
- [x] 25-04-PLAN.md — Review queue page, approve/reject workflow, navigation badge, /review route
- [x] 25-05-PLAN.md — Discount pattern detection engine + market pricing toggle + alerts
- [x] 25-06-PLAN.md — Admin pricing config editor met per-provider forms en validatie
- [ ] 25-07-PLAN.md — UI integration: Klopt niet triggers, staleness indicators, AI normalization endpoint
- [x] 25-08-PLAN.md — ops-competitor-intel skill, Supabase types update, final verification
- [x] 25-09-PLAN.md — [GAP] Wire loadFromSupabase at app startup (RootLayout useEffect)
- [x] 25-10-PLAN.md — [GAP] Wire AdminConfigEditor handleSave to Supabase persistence
- [x] 25-11-PLAN.md — [GAP] Wire orphaned discount pattern UI into PriceComparisonPage
- [x] 25-12-PLAN.md — [GAP] Fill todo-only test stubs for offline pricing and price provider

### Phase 19: Gesprekken-tab & Acties Upgrade
**Goal**: Het tabblad Gesprekken wordt vereenvoudigd en praktischer: AI-extractie wordt verwijderd (dat gebeurt al in de AI Wizard), notities kunnen ingesproken worden via spraak-naar-tekst, en per gesprek wordt de contactpersoon gekoppeld met status. Het tabblad Acties wordt verfijnd met directe inline invoer en een bevestigingsdialoog bij verwijderen.
**Depends on**: Phase 18 (contactbeheer upgrade), Phase 9 (gesprekken-infra)
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. AI-extractiefunctie is verwijderd uit het gesprekken-tab — gespreksnotities worden handmatig of via spraak vastgelegd (AI-intake gebeurt via de wizard)
  2. Gebruiker kan een gespreksnotitie inspreken via spraak-naar-tekst (Web Speech API of vergelijkbaar) zodat er niet alles overgetypt hoeft te worden
  3. Bij het vastleggen van een gesprek kan de gebruiker de contactpersoon selecteren waarmee het gesprek is gevoerd, inclusief de huidige status van dat contact
  4. Actie-tab: gebruiker kan direct inline een nieuwe actie typen zonder extra klikken — het invoerveld is altijd zichtbaar en ondersteunt verschillende actietypes
  5. Bij het verwijderen van een gesprek of actie verschijnt een bevestigingsdialoog ("Weet u het zeker?") voordat het definitief wordt verwijderd
  6. Algeheel verfijnd design van het actie-tabblad met verbeterde UX
**Plans:** 3/3 plans complete

Plans:
- [ ] 19-01-PLAN.md — Data layer extensie: ActionItem type+deadline, deleteConversation, useSpeechRecognition hook, ConfirmDialog, Supabase migratie
- [ ] 19-02-PLAN.md — ConversationForm upgrade: AI-toggle verborgen, spraak-naar-tekst, contact-dropdown met DMU+engagement, gesprek-verwijdering
- [ ] 19-03-PLAN.md — Kanban upgrade: always-visible inline invoer, inline titel-edit, type-labels, deadline, modale verwijder-bevestiging, visuele verfijning

### Phase 20: Waarde-tab Veilig Verwijderen
**Goal**: Het Waarde-tabblad volledig en veilig verwijderen uit de app. Alle componenten, routes, navigatie-items en store-referenties die exclusief aan de Waarde-tab hangen worden opgeruimd, zonder dat de overige tabs (Dashboard, Vergelijking, Export, etc.), routes of functionaliteit kapot gaan. De app moet na verwijdering foutloos builden en werken.
**Depends on**: Phase 18, Phase 19
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Het Waarde-tabblad is volledig verwijderd uit de tab-navigatie (TabNavigation.tsx) — niet meer zichtbaar of bereikbaar
  2. WaardeTab.tsx en alle componenten die exclusief door de Waarde-tab gebruikt worden (ValueHeroCard, ValueAIPanel, ZachteKantPanel, ai-value.ts, etc.) zijn verwijderd of veilig losgekoppeld
  3. Routes die naar de Waarde-tab verwijzen zijn opgeruimd zonder andere routes te breken
  4. Store-state en berekeningen die door andere tabs gebruikt worden (export, vergelijking) blijven intact en werken correct
  5. `npm run build` slaagt zonder errors na verwijdering
  6. Alle bestaande tests slagen (`npx vitest run`) — geen regressies in overige functionaliteit
  7. Navigatie tussen overige tabs werkt correct — geen dode links of lege views
**Plans:** 8 plans

Plans:
- [x] 25-01-PLAN.md — DB schema (publication_prices, pricing_configs, price_proposals, audit_log) + seed + CRUD
- [x] 25-02-PLAN.md — Pricing data store (Zustand + persist) + engine config injection + offline fallback
- [x] 25-03-PLAN.md — Price proposal submission: hooks, modal, ProposalBadge, PriceDiffDisplay
- [x] 25-04-PLAN.md — Review queue page, approve/reject workflow, navigation badge, /review route
- [x] 25-05-PLAN.md — Discount pattern detection engine + market pricing toggle + alerts
- [x] 25-06-PLAN.md — Admin pricing config editor met per-provider forms en validatie
- [ ] 25-07-PLAN.md — UI integration: Klopt niet triggers, staleness indicators, AI normalization endpoint
- [x] 25-08-PLAN.md — ops-competitor-intel skill, Supabase types update, final verification
- [x] 25-09-PLAN.md — [GAP] Wire loadFromSupabase at app startup (RootLayout useEffect)
- [x] 25-10-PLAN.md — [GAP] Wire AdminConfigEditor handleSave to Supabase persistence
- [x] 25-11-PLAN.md — [GAP] Wire orphaned discount pattern UI into PriceComparisonPage
- [x] 25-12-PLAN.md — [GAP] Fill todo-only test stubs for offline pricing and price provider

### Phase 21: DMU-Export Upgrade
**Goal**: Het export-tabblad wordt uitgebreid met intelligente, DMU-gerichte rapporten. Op basis van generieke aannames per DMU-rol (coördinator, MT/directie, finance) worden de relevante verschillen en voordelen getoond. De rapporten bevatten geëxtraheerde tekst uit het schoolplan en Cito-bronmateriaal, zodat elk rapport inhoudelijk onderbouwd is voor de specifieke beslisser.
**Depends on**: Phase 20 (waarde-tab verwijderd), Phase 14 (schoolplan-analyse)
**Requirements**: SC-1, SC-2, SC-3, SC-4, SC-5
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan per DMU-rol (coördinator, MT/directie, finance) een rapport genereren op basis van generieke aannames over wat die rol belangrijk vindt
  2. Rapporten tonen de relevante verschillen per rapporttype — coördinator ziet tijdwinst en dagelijks gebruik, MT ziet strategische waarde, finance ziet euro's en meerjarenprojectie
  3. Geëxtraheerde tekst uit het schoolplan (indien beschikbaar) wordt automatisch verwerkt in het rapport als onderbouwing
  4. Cito-bronmateriaal en productinformatie wordt gebruikt om de voordelen inhoudelijk te onderbouwen — niet alleen cijfers maar ook context
  5. Rapporten zijn exporteerbaar als PDF met Cito-huisstijl en zijn direct bruikbaar in klantgesprekken
**Plans:** 2/3 plans executed

Plans:
- [x] 21-01-PLAN.md — Data foundation: dmu-tag-filter utility, dmu-assumptions data, cito-product-info data, export types uitbreiding
- [x] 21-02-PLAN.md — PDF componenten: CoverPage, IntroSection, ProductInfoSection, SchoolplanSection DMU-filtering, ReportDocument wiring
- [ ] 21-03-PLAN.md — UI layer: AssumptionsEditor, ExportConfigPanel uitbreiding, ExportTab state wiring, ExportPreview uitbreiding

### Phase 22: Architectuur, Testen & Productie-readiness
**Goal**: Complete architectuurreview en uitgebreide testsuite (unit, integratie, end-to-end) zodat het prototype productiegereed is. Alle engines, views, flows en koppelingen worden systematisch getest volgens gangbare development-methodieken. Dit is de afsluitende kwaliteitsfase die het prototype klaar maakt voor dagelijks gebruik door het team.
**Depends on**: Phase 21 (alle features compleet)
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06
**Success Criteria** (what must be TRUE):
  1. Alle engines hebben volledige unit tests met edge cases en foutscenario's — testcoverage >80%
  2. Integratietests verifiëren de koppelingen tussen modules: wizard → store → engine → UI → export
  3. End-to-end tests dekken de volledige gebruikersflows: school aanmaken → wizard doorlopen → vergelijking bekijken → rapport exporteren
  4. Architectuurreview bevestigt correcte scheiding van concerns, geen security-issues, en performante queries
  5. Alle bekende bugs en technische schuld uit eerdere fases zijn opgelost
  6. App is stabiel, performant en productiegereed voor dagelijks gebruik door het team
**Plans:** 6/6 plans complete

Plans:
- [x] 22-01-PLAN.md — Test environment fix: worktree exclusion, coverage config, fix failing tests, triage 158 todos
- [x] 22-02-PLAN.md — CI pipeline (GitHub Actions) + Sentry error tracking + security headers
- [x] 22-03-PLAN.md — Unit tests voor hooks, stores en utils
- [x] 22-04-PLAN.md — Component tests (React Testing Library) voor wizard, forms, modals, navigation
- [x] 22-05-PLAN.md — Playwright E2E setup + tests voor alle gebruikersflows
- [x] 22-06-PLAN.md — Security audit, performance profiling, coverage thresholds, productie-readiness checkpoint

### Phase 24: UX-audit Vergelijkingsoverzicht — Stakeholder-ready
**Goal**: Het volledige vergelijkingsoverzicht (PriceComparisonPage) UX-technisch doorlichten en optimaliseren: doublures elimineren, informatie-architectuur herstructureren, progressive disclosure toepassen, en visueel stakeholder-ready maken. Geen nieuwe features — alleen herstructurering van bestaande secties.
**Depends on**: Phase 22 (productiegereed), Phase 16 (AI Wizard)
**Requirements**: D-01 through D-17 (from discuss-phase)
**Success Criteria** (what must be TRUE):
  1. Secties staan in de juiste volgorde: AI hero -> bediening -> totalen -> toolbar+tabel -> grafiek -> meerwaarde -> disclaimer
  2. Differentiators-lijst verwijderd uit ComparisonSummary en MeerwaardePanel (data verhuist naar AI-advies context)
  3. AI-advies hero standaard ingeklapt met 2-3 regels samenvatting, uitklapbaar tot volledig advies
  4. ProviderSelector en PricingModelCards samengevoegd tot compacte toolbar met info-popovers
  5. Grafiek en MeerwaardePanel standaard ingeklapt (progressive disclosure)
  6. Visuele scheiding via afwisselende kleurzones (bg-neutral-50/bg-white)
**Plans:** 2/2 plans complete

Plans:
- [x] 24-01-PLAN.md — SectionBand + ProviderToolbar extractie, ComparisonSummary/MeerwaardePanel cleanup, pagina-herstructurering met kleurzones
- [x] 24-02-PLAN.md — AI hero collapse/expand met SchoolplanBanner integratie, visuele checkpoint

### Phase 25: Prijsintelligentie & Stakeholder Feedback Loop _(CLOSED – INCOMPLETE 2026-05-14)_

**Closure note (2026-05-14):** Phase wordt niet meer afgemaakt. 11/12 plans uitgevoerd; 25-07 (UI-integration: "Klopt niet" triggers, staleness indicators, AI normalization endpoint) blijft deferred. De DB-driven prijsdata, review-queue, discount-engine, admin-editor en ops-competitor-intel skill staan in productie en werken zelfstandig — de "Klopt niet"-feedback-loop UI ontbreekt nog. Reden voor sluiting: focus verschuift naar Phase 26 (Cito Prijzen + Concurrentie Editor) en Phase 27 (Wizard-optimalisatie). Restscope kan later opnieuw worden ingepland als losse phase als de feedback-loop alsnog nodig blijkt.

**Goal**: Concurrentie-informatie (prijzen, bundelstructuren, features) verplaatsen van hardcoded TypeScript-bestanden naar een database-driven systeem met stakeholder-feedbackworkflow — zodat accountmanagers en productspecialisten prijzen kunnen flaggen, corrigeren en valideren, en elke wijziging automatisch doorcijfert naar alle vergelijkingen en analyses.
**Depends on**: Phase 22 (productie-readiness), Phase 10.1 (provider configs), Phase 9 (prijsbeheer infra)
**Requirements**: PI-01, PI-02, PI-03, PI-04, PI-05, PI-06, PI-07, PI-08, PI-09, PI-10
**Success Criteria** (what must be TRUE):
  1. Publicatieprijzen en pricing-strategie configuraties (bundels, tiers, pakketten) staan in Supabase `publication_prices` + `pricing_configs` tabellen — huidige TS-bestanden dienen als seed en offline fallback
  2. Engine calculators lezen prijsdata via een async provider-functie die Supabase-first werkt met fallback naar static data — bestaande pure-function architectuur blijft intact
  3. Gebruiker kan in de Products-tab een publicatieprijs flaggen als "klopt niet" met toelichting en optioneel bewijs (document upload) — dit creëert een prijsvoorstel in een review-queue
  4. Admin/productmanager ziet een review-queue van alle openstaande prijsvoorstellen, kan per voorstel goedkeuren of afwijzen met reden, en goedgekeurde wijzigingen worden direct actief
  5. Bij goedkeuring van een prijswijziging worden alle bestaande schoolvergelijkingen die deze provider/module gebruiken automatisch herberekend — geen handmatige actie nodig
  6. Elke prijswijziging heeft een volledig audittrail: wie, wanneer, oude waarde, nieuwe waarde, bron, reden — zichtbaar als prijsgeschiedenis per module/provider
  7. Structuurwijzigingen (nieuw DIA-pakket, JIJ-tier aanpassing, Cito-bundel wijziging) kunnen door een admin worden doorgevoerd via een configuratie-editor — de engine past zich automatisch aan
  8. Staleness-detectie: systeem signaleert proactief wanneer prijzen van een provider langer dan 6 maanden niet geverifieerd zijn, per provider en per module
  9. `ops-competitor-intel` skill is gebouwd als single entry point voor alle concurrentie-informatie (handmatig, document-upload, AI-intake, periodieke check) en schrijft naar de review-queue
  10. Offline modus blijft werken: app valt terug op laatst gesyncte prijsdata uit localStorage/IndexedDB wanneer Supabase niet bereikbaar is
**Plans:** 11/12 plans executed (1 deferred — phase closed)

Plans:
- [x] 25-01-PLAN.md — DB schema (publication_prices, pricing_configs, price_proposals, audit_log) + seed + CRUD
- [x] 25-02-PLAN.md — Pricing data store (Zustand + persist) + engine config injection + offline fallback
- [x] 25-03-PLAN.md — Price proposal submission: hooks, modal, ProposalBadge, PriceDiffDisplay
- [x] 25-04-PLAN.md — Review queue page, approve/reject workflow, navigation badge, /review route
- [x] 25-05-PLAN.md — Discount pattern detection engine + market pricing toggle + alerts
- [x] 25-06-PLAN.md — Admin pricing config editor met per-provider forms en validatie
- [~] 25-07-PLAN.md — UI integration: Klopt niet triggers, staleness indicators, AI normalization endpoint _(DEFERRED — phase closed 2026-05-14)_
- [x] 25-08-PLAN.md — ops-competitor-intel skill, Supabase types update, final verification
- [x] 25-09-PLAN.md — [GAP] Wire loadFromSupabase at app startup (RootLayout useEffect)
- [x] 25-10-PLAN.md — [GAP] Wire AdminConfigEditor handleSave to Supabase persistence
- [x] 25-11-PLAN.md — [GAP] Wire orphaned discount pattern UI into PriceComparisonPage
- [x] 25-12-PLAN.md — [GAP] Fill todo-only test stubs for offline pricing and price provider

## Backlog

| Phase | Description | Status |
|-------|-------------|--------|
| 999.1 | Wizard als onderdeel van school-aanmaak flow | Complete |

### Phase 999.1: Wizard als onderdeel van school-aanmaak flow (COMPLETE)
**Goal**: Bij het aanmaken van een nieuwe school meteen de vergelijkingswizard doorlopen zodat het profiel direct compleet is — de wizard wordt het startpunt van elk schoolgesprek, niet een los tabblad dat je later moet ontdekken.
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04
**Plans**: 1 plan

Plans:
- [x] 999.1-01-PLAN.md — SchoolNameDialog, SchoolCard wizard-routing, DashboardTab CTA banner, WizardPage context-header

### Phase 26: Cito Prijzen + Concurrentie Editor — startscherm-entry naast Schooloverzicht met dedicated prijs-editor (tabs Basisvaardigheden/Modules/Concurrentie), multi-format export (PDF/HTML/Word/TXT) van de prijslijst, en AI-Excel-import voor batch prijs-updates met diff-preview voor goedkeuring

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 25
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 26 to break down)

### Phase 27: Wizard-optimalisatie bestaande klant vs nieuwe klant + Stichting-laag

**Goal:** Sales-accountmanagers onderscheiden bestaande Cito-klanten van nieuwe prospects, groeperen scholen onder een Stichting (bestuur), zetten concurrent-pijnpunten om naar Cito-voordelen via AI+rule-based matching, en vergelijken Cito Basis vs Cito Plus — met cito-oud volledig uit het systeem.
**Requirements**: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11
**Depends on:** Phase 26
**Plans:** 16 plans (revised 2026-05-14 after gsd-plan-checker BLOCKER #1 + WARNINGS #2/3/5/6)

Plans:
- [x] 27-01-PLAN.md — Wave 0: type-relocatie TimeSavingTask naar src/models/time-savings.ts + 11 test-scaffolds (R1, R2, R6, R9, R10, R11)
- [x] 27-02-PLAN.md — Wave 1: Stichting entity + CRUD + Dexie/Supabase + /stichtingen routes (R1)
- [x] 27-03-PLAN.md — Wave 2: WizardStep1 klant-type + schoolsoort + groei-trajectorie velden (R3, R4)
- [x] 27-04-PLAN.md — Wave 1: Burgerschap + Digitale geletterdheid in module-catalogus (R6) [revised: checkpoint dropped per SPEC R6 lock]
- [x] 27-05-PLAN.md — Wave 3: WizardStep2 huidig-gebruik per niveau + stichting mix-aggregatie (R5)
- [x] 27-06-PLAN.md — Wave 2: WizardStep3 herstructureren naar Basisvaardigheden + Extra Modules (R7)
- [x] 27-07-PLAN.md — Wave 2: Stichting bulk-link met smart-suggestion + inline Levenshtein (R11)
- [ ] 27-08-PLAN.md — Wave 4: WizardStep4 summary-blok + opmerkingen + TimeInputSection dual-mode (R8)
- [ ] 27-09-PLAN.md — Wave 5: R9 data-laag (pain_point_match_feedback + team_settings migrations) + rule-based fallback (R9) [revised: split with 27-16]
- [ ] 27-10-PLAN.md — Wave 6: cito-oud cleanup-fase 1: scope-verify (Assumption A1) + LOCKED file delete + big-bang deletes (R10) [autonomous: false — LOCKED file delete, revised: split into 27-10/13/14/15]
- [ ] 27-11-PLAN.md — Wave 7: Stichting bulk-export CSV + DMU-PDF-aggregatie (R2)
- [ ] 27-12-PLAN.md — Wave 8: E2E tests + grep-gates + UAT-walkthrough (alle R1-R11) [autonomous: false — UAT gate]
- [ ] 27-13-PLAN.md — Wave 6: cito-oud cleanup-fase 2: enum-strip uit CurrentProvider + Zod schemas + WizardStep4 dropdown (R10) [NEW — depends_on 27-10]
- [ ] 27-14-PLAN.md — Wave 6: cito-oud cleanup-fase 3: Scenario type rename + routes cleanup + scenario-detection rewrites (R10) [NEW — depends_on 27-13]
- [ ] 27-15-PLAN.md — Wave 6: cito-oud cleanup-fase 4: calculateBasisPlusUpsell + WizardStep5 Basis/Plus/Upsell + final engine cleanup + Supabase migration 020 (R10) [NEW — depends_on 27-14]
- [ ] 27-16-PLAN.md — Wave 5: R9 AI-laag: Vercel function + PainPointPanel UI + PromptOverrideSettings (R9) [NEW — depends_on 27-09, parallel to 27-09 in same wave]

### Phase 28: Win/loss-tracking & Marktpositie — Aparte 'Uitkomst/Deal'-tab per school waar accountmanager elke prijsvergelijking-uitkomst registreert (gewonnen/verloren/in onderhandeling, prijsverschil, reden, contactpersoon), cross-school marktpositie-dashboard met telstanden (win-rate, gemiddelde marge t.o.v. concurrent, top verlies-redenen), en korting-verrijking in vergelijking-tab zodat actuele kortingen meegenomen worden in de uiteindelijke prijs

**Goal:** Accountmanagers registreren per school de uitkomst van elke prijsvergelijking in een Uitkomst/Deal-tab (gewonnen/verloren/in onderhandeling) met prijs-snapshot, reden, contactpersoon en per-deal kortingen; een cross-school marktdashboard aggregeert dit tot win-rate + marge + trend; en een cohort-AI voorspelt win-kans op basis van (onderwijsvisie, schoolniveau).
**Requirements**: R1, R2, R3, R4, R5
**Depends on:** Phase 27
**Plans:** 4/10 plans executed

Plans:
- [x] 28-01-PLAN.md — Wave 1: types + Zod schemas + Dutch labels + 14 test scaffolds (R1, R2, R3, R4, R5)
- [x] 28-02-PLAN.md — Wave 2: migrations 017 (schools.onderwijsvisie) + 018 (deal_outcomes/discounts/audit-log + RLS) + Supabase types + row-shape mappers (R1, R2, R3) — actual file numbers bumped from PLAN.md's 016+017 because 016 was taken by Phase 27-05
- [x] 28-03-PLAN.md — Wave 3: migration 019 (deal_cohort_stats matview + SECURITY DEFINER refresh trigger + pg_cron nightly fallback + RPC) + Supabase Views type + mapCohortStatsRow + CohortStats harmonization (R5) — migration renumbered 018 → 019 per executor critical-deviation note
- [x] 28-04-PLAN.md — Wave 2: engine extension price-comparison.ts dealDiscounts overlay (R3) [parallel to 28-02; iter 2: rewritten against real engine API]
- [ ] 28-05-PLAN.md — Wave 3: Uitkomst-tab + DealAfsluitenDialog + WinDealDialog + LostDealForm + CRUD operations + snapshot helper + Heropen-deal button (R1, R2) [iter 2: B5 + F9 fixes]
- [ ] 28-05b-PLAN.md — Wave 5: DealDetailsForm inline edit + StickyDirtyBar (R1) [NEW iter 2 — F11 fix; depends on 05+06, serializes DealOutcomesTab.tsx write after 06]
- [ ] 28-06-PLAN.md — Wave 4: DiscountEditor + DiscountRow + AuditLogAccordion + comparison-tab recalc integration (R3) [iter 2: F6 fix]
- [ ] 28-07-PLAN.md — Wave 4: migration 020 get_deal_stats RPC + /dashboard route + KPI cards + TrendChart + CompetitorBreakdownCard + filters (R4) [iter 2: B3 demoted from Wave 3, B6 RPC, F2 grouping toggle, F8 global-N=0] — migration number bumped from 019 (28-03 now owns 019)
- [ ] 28-08-PLAN.md — Wave 6: CohortPredictionCard + useCohortPrediction + onderwijsvisie field on school (R5) [iter 2: B4 demoted to serialize DealOutcomesTab writes after 06+05b]
- [ ] 28-09-PLAN.md — Wave 7: LostDealDialog cleanup (incl. PipelineKanbanView) + pipeline-dropdown tooltip + redirect-to-Uitkomst from kanban + Playwright e2e + UAT gate (R1, R2, R3, R4, R5) [autonomous: false — UAT gate; iter 2: B2 fix]
