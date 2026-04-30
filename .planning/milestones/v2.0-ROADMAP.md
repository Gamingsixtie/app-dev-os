# Roadmap: Rekentool VO

## Milestones

- ✅ **v1.0 Fundament** - Phases 1-5 (shipped 2026-03-20)
- 🚧 **v2.0 Sales Intelligence Platform** - Phases 6-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 Fundament (Phases 1-5) - SHIPPED 2026-03-20</summary>

### Phase 1: Fundament
**Goal**: Schoolprofiel-invoer, datastructuren, Cito-huisstijl en app-skelet
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, DATA-01, DATA-02, DATA-03, DATA-05, DATA-06, UX-03, UX-04
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Tailwind CSS 4 theming, TypeScript data models, zustand store en zod schemas
- [x] 01-02-PLAN.md — 4-staps wizard UI met voortgangsbalk, navigatie en alle stap-componenten
- [x] 01-03-PLAN.md — Reusable UI-componenten: PriceBadge, EditableAssumption, DisclaimerFooter

### Phase 2: Prijsvergelijking
**Goal**: Modulaire Cito vs. DIA vs. JIJ vergelijking met staafdiagram en transparante bronvermelding
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, DATA-04, INPUT-01, MODE-01
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Rekenmotor: pure calculateComparison functie, uitgebreide prijsdata, differentiator-data en nl-NL formatting (TDD)
- [x] 02-02-PLAN.md — Zustand store met draft/applied override-scheiding, Recharts staafdiagram en BusinessCaseCTA
- [x] 02-03-PLAN.md — ComparisonTable, ModuleDetailPanel met prijsoverschrijving, PriceComparisonPage en wizard-routing

### Phase 3: Business Case
**Goal**: Migratie huidig → nieuw Cito-platform met financieel verschil, tijdswinst en meerjarenprojectie
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

### 🚧 v2.0 Sales Intelligence Platform (In Progress)

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
- [x] **Phase 10.2: Engine Refactoring** (INSERTED) - Provider-aware berekeningen met JIJ-tiers, DIA-pakketten, prijsopbouw (completed 2026-03-24)
- [x] **Phase 10.3: UX Overhaul** (INSERTED) - Wizard redesign, dynamische vergelijkingstabel, prijsmodel-uitleg (completed 2026-03-24)
- [x] **Phase 11: Waarde-engine & Migratie** - Tijdwinst in euro's, meerjarenprojectie, migratie-businesscase en upsell-detectie (completed 2026-03-23)
- [x] **Phase 12: DMU-Export & Offline** - PDF-rapporten per DMU-rol, clipboard-export en offline werking (completed 2026-03-24)
- [x] **Phase 13: Architectuur Review & Go-Live** - Architectuur-check, performance audit, security review en productie-readiness voor online deployment (completed 2026-03-24)
- [x] **Phase 14: Schoolplan Upload & Kansen-analyse** - AI-analyse van geüpload schoolplan om Cito-kansen en concurrentie-verdwijning inzichtelijk te maken (completed 2026-03-23)
- [x] **Phase 15: DMU Klantreis Registratie** - Registratie van DMU-contactpersonen in de klantreis, van eerste contact tot aan beslissing
 (completed 2026-03-23)
- [x] **Phase 15.1: Framework-analyse & Samenhang** (INSERTED) - Diepgaande analyse van het complete framework: correctheid engines, koppelingen, AI-inzet, logische stappen en verbeterpunten (completed 2026-03-23)

## Phase Details

### Phase 6: Multi-School Data Layer
**Goal**: Applicatie ondersteunt meerdere schoolprofielen met persistente opslag, bestaande v1-data behouden, en navigatie met browser-history
**Depends on**: v1.0 (Phase 5)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, MODE-01, MODE-03
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een nieuw schoolprofiel aanmaken, opslaan, heropenen en verwijderen — data blijft bewaard na browser-herstart
  2. Bestaande v1-data (wizard inputs, prijsoverschrijvingen) is automatisch beschikbaar als schoolprofiel in de v2-interface zonder handmatige actie
  3. Gebruiker kan via browser-back-button terug navigeren naar vorige view en via URL direct naar een specifieke school/view gaan
  4. Alle UI-tekst is in formeel Nederlands (u-vorm) en de interface is bruikbaar op tablet met touch
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Dexie database, SchoolRecord types, CRUD operations, slug utility en v1 localStorage migratie (TDD)
- [ ] 06-02-PLAN.md — TanStack Router setup met code-based routing, route guards en smart redirect
- [ ] 06-03-PLAN.md — Store refactoring, SchoolLayout, school overview UI, migration wizard, wizard naamveld en App.tsx rewrite

### Phase 7: School Intelligence
**Goal**: Accountmanager heeft per school een compleet profiel met contactpersonen, productgebruik, gesprekshistorie en pipeline-status — en kan snel de juiste school vinden
**Depends on**: Phase 6
**Requirements**: SCHOOL-01, SCHOOL-02, SCHOOL-03, SCHOOL-04, SCHOOL-05, SCHOOL-06, PRIJS-07
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een school aanmaken met basisgegevens en per school vastleggen welke modules van welke aanbieder worden gebruikt, inclusief prijzen en bron
  2. Gebruiker kan contactpersonen (naam, rol, DMU-positie) en gespreksnotities (datum, contactpersoon, kernpunten) per school beheren
  3. Gebruiker kan pipeline-status instellen (prospect t/m at-risk) en ziet een doorzoekbaar schooloverzicht gesorteerd op laatst gebruikt met status-badges
  4. Schoolspecifieke prijsoverschrijvingen (deals/kortingen) worden apart opgeslagen per school en worden niet verward met publicatieprijzen
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md — CRM-lite data layer: types, Dexie v2 schema migratie, CRUD operaties, Zod schemas en timeline utility
- [x] 07-02-PLAN.md — Profiel-UI: tab-routing, ProfileHeader, TabNavigation, DashboardTab, ComparisonTab, ProductsTab en pipeline-management
- [x] 07-03-PLAN.md — ContactsTab met CRUD en DMU-mapping, ConversationsTab met tijdlijn, tags, zoekfunctie en kanban-actielijst
- [x] 07-04-PLAN.md — Schooloverzicht: FilterBar, ViewToggle, CardModeToggle, PipelineKanbanView met drag & drop en visuele verificatie

### Phase 8: Supabase & Deploy
**Goal**: Migratie van lokale IndexedDB/Dexie-architectuur naar Supabase (Postgres) met Vercel hosting, team-authenticatie (accountmanager/manager/viewer), serverless AI-proxy en data-migratie
**Depends on**: Phase 7
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, AUTH-01, AUTH-02, AUTH-03, DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. Alle schooldata is opgeslagen in Supabase Postgres met genormaliseerd schema (schools, contacts, conversations, actions, system_events, school_prices tabellen)
  2. Gebruiker kan inloggen via email/wachtwoord of magic link en ziet alleen data van het eigen team — accountmanagers bewerken eigen scholen, managers en viewers zijn read-only
  3. Bestaande IndexedDB data wordt bij eerste login automatisch gemigreerd naar Supabase zonder dataverlies
  4. AI-calls lopen via Vercel serverless functions met server-side API key — geen API keys in de browser
  5. App is bereikbaar via Vercel URL met werkende auth, database en AI-proxy
**Plans**: 5 plans

Plans:
- [x] 08-01-PLAN.md — Supabase client, Database types, genormaliseerd SQL schema (8 tabellen) en RLS policies
- [x] 08-02-PLAN.md — Auth systeem: AuthProvider, LoginPage, ProtectedRoute, UserMenu en AuthLoadingScreen
- [x] 08-03-PLAN.md — Data layer migratie: operations.ts herschrijven voor Supabase, React Query hooks, QueryClientProvider
- [x] 08-04-PLAN.md — Cloud migratie wizard (IndexedDB naar Supabase) en role-based UI componenten
- [x] 08-05-PLAN.md — Vercel serverless AI proxy, useLiveQuery vervanging, component integratie en deploy verificatie

### Phase 9: AI Intake & Prijsbeheer
**Goal**: Accountmanager kan tijdens een telefoongesprek vrije tekst invoeren die real-time wordt gestructureerd in schooldata, en kan prijzen beheren met actieve selectie, handmatige invoer en document-upload extractie (PDF/Excel/Word/CSV)
**Depends on**: Phase 8
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, PRIJSMGT-01, PRIJSMGT-02, PRIJSMGT-03, PRIJSMGT-04
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan in de Gesprekken-tab vrije tekst invoeren die real-time (streaming) wordt gestructureerd — modules, aanbieders, prijzen, contactpersonen en actiepunten worden herkend
  2. Geëxtraheerde data verschijnt in een diff-view bevestigingsscherm waar de gebruiker per item kan aanvinken wat overgenomen wordt — bestaande data wordt getoond als referentie
  3. AI intake voegt toe aan een bestaand schoolprofiel zonder eerdere data te overschrijven
  4. Gebruiker kan in de Producten-tab meerdere prijzen per module/aanbieder beheren met prijsgeschiedenis, en kiest welke prijs actief is met een verplichte reden — met bruto/netto onderscheid
  5. Gebruiker kan een document (PDF, Excel, Word, CSV) uploaden en de AI extraheert prijzen die in dezelfde diff-view ter goedkeuring worden getoond — nooit automatisch doorgevoerd
  6. Prijzen worden gevalideerd tegen publicatieprijzen (>50% afwijking = inline ⚠ waarschuwing) of gemarkeerd als handmatige invoer als geen referentie beschikbaar is
**Plans**: 5 plans

Plans:
- [x] 09-00-PLAN.md — Wave 0: test stub files voor alle Phase 9 plannen (8 test stubs)
- [x] 09-01-PLAN.md — Shared foundation: extended extraction schema, price deviation logic, useSchoolPrices hook, PriceBadge extension en serverless v2 prompt
- [x] 09-02-PLAN.md — AI intake flow: IntakeModeToggle, StreamingExtraction, DiffView components (met bewerkbare velden), ConversationForm AI-modus en append-only save
- [x] 09-03-PLAN.md — Prijsbeheer UI: PriceManager, PriceEditModal, PriceHistoryList, ProductsTab uitbreiding met prijsgeschiedenis en actieve selectie
- [x] 09-04-PLAN.md — Document upload: documents bucket, serverless document parser (PDF/Excel/Word/CSV), DocumentDropzone, DocumentExtractionPreview en ProductsTab integratie

### Phase 10: Prijsvergelijking & Gevoeligheid
**Goal**: Accountmanager ziet een compleet, interactief prijsvergelijkingsoverzicht met DIA-pakketlogica en JIJ-pakketlogica, hybride scenario's, onderscheidend vermogen en gevoeligheidsanalyse voor interne voorbereiding
**Depends on**: Phase 8 (Supabase), Phase 9 (prijsdata)
**Requirements**: PRIJS-01, PRIJS-02, PRIJS-03, PRIJS-04, PRIJS-05, PRIJS-06, PRIJS-08, GEVOEL-01, GEVOEL-02, GEVOEL-03, MODE-02
**Success Criteria** (what must be TRUE):
  1. Gebruiker ziet per module de kosten per leerling en totaalkosten per aanbieder naast elkaar, met visueel staafdiagram en uitklapbare berekeningsdetails
  2. Gebruiker kan prijzen handmatig overschrijven met bronvermelding en de vergelijking herberekent reactief — DIA-pakketprijzen worden automatisch correct berekend bij 3+ modules
  3. Gebruiker ziet per module wat Cito biedt dat de concurrent niet biedt (en omgekeerd) als onderscheidend vermogen
  4. Hybride scenario berekent per module apart de besparingen waar een school van aanbieder wisselt
  5. In interne modus ziet de gebruiker gevoeligheidsanalyse met 10%/20% kortingsscenario's, het effect per module, en het break-even kortingspercentage — plus sales-signalen per module
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md — TDD engine: DIA-pakketprijzen, hybride scenario, gevoeligheidsanalyse met break-even en sales-signalen (4 engine files + 4 test files)
- [x] 10-02-PLAN.md — Store uitbreiding en UI-componenten: ModeToggle, PeriodToggle, SalesSignalBadge, SensitivitySection + wiring in ComparisonTable, Chart, DetailPanel en Page
- [x] 10-03-PLAN.md — Visuele verificatie van alle Phase 10 features goedgekeurd door gebruiker; DiaPackageManager UI uitgesteld naar post-Vercel deployment

### Phase 10.1: Data Foundation — Prijsmodel & Module-uitbreiding (INSERTED)
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
- [x] 10.1-01-PLAN.md — Types (PricingStrategy union), MODULE_CATALOG uitbreiding (10 modules), differentiators, test scaffolds
- [x] 10.1-02-PLAN.md — Provider config files (cito.ts, dia.ts, jij.ts, saqi.ts), re-export wrappers, backward compatibility, migratie-verificatie

### Phase 10.2: Engine Refactoring — Provider-aware berekeningen (INSERTED)
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
- [x] 10.2-01-PLAN.md — TDD: ProviderPriceCalculator interface, 4 calculators (Cito/DIA/JIJ/Flat), factory, refactored calculateComparison() met breakdowns
- [x] 10.2-02-PLAN.md — Store simplificatie: provider-logica verwijderd, nieuwe engine-signature, parity-verificatie en cleanup

### Phase 10.3: UX Overhaul — Wizard & Vergelijking (INSERTED)
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

- [x] 10.3-01-PLAN.md � Wizard Step 3 provider badges, quick-picks, MVT subcategorie + store visibleProviders
- [x] 10.3-02-PLAN.md � ComparisonTable dynamische kolommen, ModuleDetailPanel prijsopbouw per aanbieder
- [x] 10.3-03-PLAN.md � ProviderSelector, PricingModelCards, inline CitoBundleSelector en visuele verificatie

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
- [x] 11-01-PLAN.md — TDD engines: migratie-engine uitbreiden met switchingCosts en break-even, nieuwe upsell-detectie engine, data layer uitbreiding (SchoolRecord + Supabase)
- [x] 11-02-PLAN.md — WaardeTab UI: hero-kaart, tijdwinst-tabel, migratie-tabel, meerjarenprojectie-chart, EditableField extractie, tab-routing en navigatie
- [x] 11-03-PLAN.md — Upsell UI: UpsellCard op school-dashboard, UpsellBadge op schoolkaarten, visuele verificatie alle Phase 11 features

### Phase 12: DMU-Export & Offline
**Goal**: Accountmanager kan na elk gesprek direct een op de DMU afgestemd PDF-rapport genereren en de applicatie werkt offline op tablet
**Depends on**: Phase 11 (waarde-engine, migratie), Phase 10 (prijsvergelijking)
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, ARCH-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een PDF-rapport genereren per DMU-rol: coordinator (tijdwinst, dagelijks gebruik), MT (overzicht, onderbouwing, strategische waarde), finance (euro's, meerjarenprojectie, terugverdientijd)
  2. PDF-rapporten bevatten schoolspecifieke data, Cito-huisstijl (Primary #003082, Accent #FF6600), bronvermelding en disclaimer
  3. Gebruiker kan de vergelijking kopiëren naar clipboard als geformatteerde samenvatting
  4. Applicatie werkt offline op tablet na eerste laden — service worker cacht assets en data
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — PDF verbetering: SVG staafdiagram, SchoolplanSection, multi-page, DMU-samenvatting
- [x] 12-02-PLAN.md — Clipboard export: geformatteerde kopieer-functionaliteit voor email/Teams
- [x] 12-03-PLAN.md — PWA/Offline: service worker, offline-banner, mutatie-queue

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
- [x] 13-01-PLAN.md — Security hardening: SKIP_AUTH productie-guard, schoolplan_analyses RLS fix, storage bucket RLS fix, VITE_ANTHROPIC_API_KEY verwijderd
- [x] 13-02-PLAN.md — Build fix: offline-queue.ts TypeScript error, bundle verificatie, productie build
- [x] 13-03-PLAN.md — Productie-readiness: performance audit, data-integriteit verificatie, deployment check
### Phase 14: Schoolplan Upload & Kansen-analyse
**Goal**: Accountmanager kan een schoolplan (PDF/Word) uploaden dat door AI wordt geanalyseerd om Cito-kansen te identificeren, concurrentie-verdwijning te signaleren en strategische inzichten per school te genereren
**Depends on**: Phase 9 (document upload infra), Phase 7 (schoolprofielen)
**Requirements**: SC-01, SC-02, SC-03, SC-04, SC-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan een schoolplan-document (PDF/Word) uploaden per school
  2. AI extraheert relevante thema's, doelen en prioriteiten uit het schoolplan
  3. Systeem matcht schoolplan-thema's met Cito-productaanbod en toont concrete kansen (bijv. "school focust op adaptief toetsen → Cito Volgsysteem is relevant")
  4. Systeem signaleert waar concurrenten kwetsbaar zijn op basis van schoolplan-prioriteiten (bijv. "school wil meer data-inzicht → DIA biedt dit beperkt")
  5. Kansen en inzichten worden opgeslagen bij het schoolprofiel en zijn zichtbaar in het school-dashboard
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md — Data foundation: Zod schemas, model config, Supabase migration, React Query hooks en client orchestrator
- [x] 14-02-PLAN.md — Serverless analyse: twee-stappen AI pipeline (samenvatting + kansen-matching) met SSE streaming
- [x] 14-03-PLAN.md — Schoolplan-tab UI: route, componenten (KansCard, KansCardList, streaming progress), SchoolplanTab container en visuele verificatie

### Phase 15: DMU Klantreis Registratie
**Goal**: Accountmanager kan per school de DMU-contactpersonen volgen door de engagement-klantreis met 6 statussen (Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt), met DMU-beslissingsoverzicht, stagnatie-detectie en filtering
**Depends on**: Phase 7 (contactpersonen), Phase 8 (Supabase)
**Requirements**: KR-01, KR-02, KR-03, KR-04, KR-05
**Success Criteria** (what must be TRUE):
  1. Gebruiker kan per DMU-contactpersoon een engagement-status instellen: Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt
  2. Elke statuswijziging wordt vastgelegd als systeemevent met datum en optionele notitie — de volledige tijdlijn is zichtbaar per contactpersoon
  3. School-dashboard toont een DMU-beslissingsoverzicht (matrix) van alle DMU-leden en hun huidige status, zodat de accountmanager in een oogopslag ziet wie waar staat
  4. Gebruiker kan filteren op engagement-status in het schooloverzicht (bijv. "toon alle scholen met DMU in positief-fase")
  5. Systeem toont hoelang een contactpersoon al in de huidige fase zit en signaleert stagnatie (>30 dagen in dezelfde fase)
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md — Data foundation: EngagementStatus types, Supabase migration, setEngagementStatus operation, Zod schema en unit tests
- [x] 15-02-PLAN.md — School-profiel UI: EngagementBadge, DropOffReasonDialog, DmuMatrix, DmuMismatchBanner en DashboardTab integratie
- [x] 15-03-PLAN.md — School-overzicht UI: DmuProgressIndicator op kaarten, DmuStatusFilter, getAllSchools contacts join en filtering

### Phase 15.1: Framework-analyse & Samenhang (INSERTED)
**Goal**: Diepgaande analyse van het complete framework: correctheid engines, koppelingen tussen modules, AI-inzet, logische stappen en verbeterpunten
**Depends on**: Phase 15 (laatste afgeronde fase)
**Success Criteria**: Verbeterrapport opgeleverd met must/should/could prioritering
**Plans**: 1 plan

Plans:
- [x] FRAMEWORK-ANALYSE.md — Volledige analyse met 4 MUST, 9 SHOULD en 10 COULD verbeterpunten

## Progress

**Execution Order:**
Phases execute in custom order: 6 → 7 → 8 → 9 → 10 → 11 → 14 → 15 → 15.1 → 13 → 12
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
