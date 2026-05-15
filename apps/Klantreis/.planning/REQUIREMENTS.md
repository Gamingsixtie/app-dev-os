# Requirements: Klantreis VO — Klant in Beeld

**Defined:** 2026-05-14
**Core Value:** Het MT moet collectief achter het UI-ontwerp kunnen staan voordat er één regel productiecode of één activiteit aan content wordt toegevoegd. Het ontwerp drijft de discussie — niet andersom.

## v1 Requirements

Requirements voor deze milestone: een visueel UI-prototype waar het Cito VO-MT achter kan komen te staan, vóór de overstap naar Next.js + Supabase.

### Fundering (FUND)

Datamodel + state-architectuur die de migratie naar Supabase soepel maakt en CLAUDE.md-domeinregels afdwingt.

- [ ] **FUND-01**: Domain-laag (`domain/types.ts`) bevat TypeScript-types `Journey`, `Phase`, `Activiteit`, `DMUlid`, `MistItem`, `KlantStem` zonder React-imports — herbruikbaar voor Next.js en unit-testbaar zonder DOM
- [ ] **FUND-02**: `MAANDEN`-constante in domain-laag begint bij augustus (index 0) en eindigt bij juli (index 11) — schooljaar-tijdas, geen kalenderjaar
- [ ] **FUND-03**: `DMU_ROLLEN` is een TypeScript-enum/const-array met exact `["beslisser", "beïnvloeder", "gebruiker"]` in die volgorde — render-volgorde komt van deze constante, niet van object-key-volgorde
- [ ] **FUND-04**: `MIST_CATEGORIEEN` is een TypeScript-enum met exact `["systeem", "data", "proces", "capaciteit"]` en `IMPACT` met `["blokkerend", "hinderlijk"]` — geen andere waarden toelaatbaar
- [ ] **FUND-05**: `Activiteit` heeft een flat datamodel met `laneId`, `maand: MaandIndex`, optionele `idealeMaand: MaandIndex` en `mismatchReden`, `mismatchKlantstemId` — niet genest per lane
- [ ] **FUND-06**: `MistItem` heeft optionele `klantstemId` als FK naar een aparte `klantStemmen`-collectie — geen inline-quote-objecten
- [ ] **FUND-07**: `seedData.ts` levert drie lege `Journey`-instances (bestaande klanten, nieuwe klanten, bestuur op stichtingsniveau) elk met 12 lege maanden, 4 fases en 5 lanes — **geen** Cito-specifieke content
- [ ] **FUND-08**: Pure functie `detectMismatches(journey): Mismatch[]` in `domain/mismatch.ts` — selectors berekenen mismatches on-the-fly uit `Activiteit.idealeMaand`, geen aparte data-entity
- [ ] **FUND-09**: Pure functie `validateKlantstap(text): {valid, reason}` controleert dat klantstappen in eerste persoon beginnen ("Ik ", "We ", "Wij ", "Mijn ", "Onze ") — gebruikt in InlineEdit met soft-warning

### Persistence (PER)

Lokale state nu, datamodel-shape al voorbereid op Supabase.

- [ ] **PER-01**: `PersistenceAdapter`-interface met methods `load()`, `save(state)`, `clear()` definieert het contract tussen UI en storage
- [ ] **PER-02**: `LocalStorageAdapter` implementeert het contract met JSON-serialisatie en schema-versie-veld (`schemaVersion: 1`)
- [ ] **PER-03**: Zustand-store (`journeyStore.ts`) gebruikt `persist`-middleware met de adapter; state-veranderingen worden direct naar localStorage geserialiseerd
- [ ] **PER-04**: Migratie-functie `migrate(persistedState, version)` is aanwezig (nu no-op) zodat schema-evolutie later geen dataverlies geeft
- [ ] **PER-05**: `LoadStateError` en `SaveStateError` worden zichtbaar voor de gebruiker via een toast — geen silent failure
- [ ] **PER-06**: Undo/redo via zundo-temporal-middleware (Zustand) — minimaal 10 stappen geschiedenis in-memory

### Designtaal (UI)

Editorial designtaal: Inter overal, Source Serif 4 italic alleen voor klantcitaten, één accentkleur Cito-blauw.

- [ ] **UI-01**: Inter (variable font) is overal in de UI als enig lettertype — self-hosted via Fontsource, geen Google Fonts CDN-call
- [ ] **UI-02**: Source Serif 4 italic wordt uitsluitend gebruikt voor klantcitaten — overal anders verboden
- [ ] **UI-03**: Cito-blauw (#2E75B6) is de enige functionele accentkleur in de UI (links, focus-rings, primaire knoppen, actieve tabs)
- [ ] **UI-04**: Mismatch-oranje (#C2410C) wordt uitsluitend gebruikt voor mismatch-visualisatie — geen andere context
- [ ] **UI-05**: Blokkerend-rood (#B91C1C) wordt uitsluitend gebruikt voor blokkerende ontbrekende randvoorwaarden — geen andere context
- [ ] **UI-06**: Designtokens (kleuren, font-families, spacing) liggen vast in één `styles/tokens.css` met Tailwind v4 `@theme`-directive — geen hardcoded hex-waarden in componenten
- [ ] **UI-07**: UI is volledig in het Nederlands; geen Engelse strings in labels, knoppen, foutmeldingen
- [ ] **UI-08**: Lay-out behoudt visuele tweedeling boven/onder de lijn — een duidelijke horizontale visibility-line scheidt klantperspectief van organisatieperspectief
- [ ] **UI-09**: Tailwind CSS v4 met `@tailwindcss/vite`; geen utility-soep (>10 classes per element) — extract naar herbruikbare component zodra het patroon zich herhaalt

### Tijdlijn-frame (TIJD)

12-maands schooljaartijdlijn met fases-rij, één voor elk van de drie klantreizen.

- [ ] **TIJD-01**: `TimelineHeader` toont 12 maandkolommen in volgorde aug-sep-okt-nov-dec-jan-feb-mrt-apr-mei-jun-jul met jaarsuffix ('25/'26)
- [ ] **TIJD-02**: Fases-rij boven de maandkolommen — een fase spant één-of-meerdere maanden (`from`, `to`) en toont fase-naam centrale
- [ ] **TIJD-03**: Drie klantreizen-tabs zichtbaar: "Bestaande klanten", "Nieuwe klanten", "Bestuur (stichtingsniveau)" — switchen wisselt de zichtbare reis maar behoudt structuur-data per reis
- [ ] **TIJD-04**: Actieve tab is visueel duidelijk (Cito-blauw onderlijn); inactieve tabs zijn duidelijk minder prominent
- [ ] **TIJD-05**: Maandkolommen wisselen lichte/iets-donkere achtergrondkleur (alternating) voor leesbaarheid — geen gridlines

### Boven de lijn (BOV) — klantperspectief

Vier rijen boven de visibility-line: klantstap, DMU, klantkanaal, emotie.

- [ ] **BOV-01**: Klantstap-rij toont per maand een korte tekst in eerste persoon ("Ik richt het schooljaar in...") — verplicht in 1e persoon, soft-validator waarschuwt bij andere openingen
- [ ] **BOV-02**: DMU-rij is opgesplitst in drie sub-rijen in vaste volgorde: beslisser, beïnvloeder, gebruiker — per maand kunnen 0-3 rollen actief zijn
- [ ] **BOV-03**: Elke DMU-cel bevat de rol-naam (bv. "Toetscoördinator") plus korte rol-toelichting in compacte vorm
- [ ] **BOV-04**: Klantkanaal-rij toont per maand een icoon (telefoon/mail/digitaal/fysiek/document) — geen icoon = geen contactmoment
- [ ] **BOV-05**: Emotie-rij toont per maand één gekleurde dot op een 3-puntsschaal (positief/neutraal/negatief) — geen curve, geen 5-puntsschaal
- [ ] **BOV-06**: Klantstap is typografisch prominenter dan afdelings-lanes — outside-in komt visueel naar voren

### Onder de lijn (OND) — organisatieperspectief

Vijf afdelings-lanes met activiteit-kaarten per maand.

- [ ] **OND-01**: Vijf afdelings-lanes onder de lijn in vaste volgorde: Marketing, Sales, Productmanagement, Toetstekunde, Customer Success
- [ ] **OND-02**: Lane-label staat links van elke lane-rij, met korte beschrijving (één regel) onder de naam
- [ ] **OND-03**: Elke lane-cel toont 0-N activiteit-kaarten in die maand; bij meer dan 3 zichtbaar wordt een "+ N meer"-indicator getoond
- [ ] **OND-04**: Activiteit-kaart toont minimaal: titel, optioneel een status-indicator (gepland/actief/afgerond), eventuele blokker-/mismatch-indicator
- [ ] **OND-05**: Klikken op een activiteit-kaart opent het detail-paneel — geen edit-in-place op kaart-niveau zelf
- [ ] **OND-06**: Lege lane-maand-cellen blijven zichtbaar maar visueel onopvallend (geen content, alleen ruimte voor toevoegen in edit-modus)

### Activiteit-detail (DETAIL)

Side-panel met alle CLAUDE.md-verplichte velden per activiteit.

- [ ] **DETAIL-01**: Detail-paneel opent als zij-paneel rechts (niet als full-modal) — tijdlijn blijft op de achtergrond zichtbaar voor context
- [ ] **DETAIL-02**: Eerste regel van detail-paneel beantwoordt expliciet "Wat verwacht de klant?" — outside-in als visueel anker
- [ ] **DETAIL-03**: Detail-paneel toont velden: titel, type (lane), status, eigenaar (naam + functie), betrokken-lijst (naam + rol), DMU-lijst (rol + positie + toelichting), beschrijving, doel, aanpak, klantverwachting, KPI's, opdrachtdocument (titel + status)
- [ ] **DETAIL-04**: Ontbrekende randvoorwaarden-blok toont per item: categorie (systeem/data/proces/capaciteit), impact (blokkerend/hinderlijk), beschrijving, optionele klantstem-koppeling
- [ ] **DETAIL-05**: Klantstem in detail-paneel rendert in Source Serif 4 italic; vermeldt rol + schoolprofiel van bron ("Toetscoördinator, vmbo-havo school")
- [ ] **DETAIL-06**: Detail-paneel sluit via X-knop, Esc-toets, of klik buiten paneel; selectie wordt cleared in store
- [ ] **DETAIL-07**: Alle velden zijn placeholder-gevuld in seed-data — bewust generiek ("Activiteit A-03", "Doel: [doel hier]") zodat MT op vorm reageert, niet op inhoud

### Editing (EDIT)

Inline-edit van veld-waarden en activiteit-CRUD; read-only is default.

- [ ] **EDIT-01**: Globale edit-modus-toggle in app-header (Cito-blauw als actief); read-only is default bij eerste laad
- [ ] **EDIT-02**: In edit-modus zijn vrije velden klikbaar-om-te-bewerken — visueel subtiel (hover-onderstreping, geen knoppen overal)
- [ ] **EDIT-03**: Save-on-blur: focus verlies op een veld slaat de wijziging op; Esc-toets reverteert de wijziging
- [ ] **EDIT-04**: Activiteit toevoegen via "+"-knop in lane-cel — opent nieuw detail-paneel met lege placeholder-velden
- [ ] **EDIT-05**: Activiteit verwijderen via knop in detail-paneel — vraagt confirm-dialog ("Activiteit X verwijderen — kan ongedaan via Undo")
- [ ] **EDIT-06**: Undo-bar verschijnt als toast na elke mutatie met "Ongedaan maken" gedurende 8 seconden; redo via Ctrl+Shift+Z

### Mismatch-differentiator (MIS)

Schaduwkaart op ideale maand + mismatch-paneel met klantstem.

- [ ] **MIS-01**: Detail-paneel bevat veld `idealeMaand` (optioneel) met dropdown van 12 maanden — leeg = activiteit valt op het juiste moment
- [ ] **MIS-02**: Detail-paneel bevat veld `mismatchReden` (optioneel free-text) plus optionele koppeling aan een klantstem-bewijs
- [ ] **MIS-03**: Bij `idealeMaand !== maand` rendert in de ideale maand-cel een visueel onderscheiden schaduwkaart (gestippelde rand, oranje accent, lichtere achtergrond)
- [ ] **MIS-04**: De originele activiteit-kaart krijgt een mismatch-indicator (oranje punt of pijl-richtingsindicatie)
- [ ] **MIS-05**: Klikken op schaduwkaart opent het mismatch-paneel — niet hetzelfde paneel als activiteit-detail
- [ ] **MIS-06**: Mismatch-paneel toont in volgorde: huidige maand, ideale maand, mismatch-reden, klantstem in Source Serif 4 italic met bron
- [ ] **MIS-07**: Hover op schaduwkaart toont optioneel een dun connector-lijntje naar originele activiteit-kaart (toggleable)

### Blokkers-aggregaat (BLK)

Cross-cutting view van alle ontbrekende randvoorwaarden, gegroepeerd per categorie.

- [ ] **BLK-01**: Aparte "Aggregaat-view"-knop in app-header opent een full-screen overlay met cross-cutting blokkers
- [ ] **BLK-02**: Aggregaat-view groepeert alle `MistItem`-instances per categorie (4 kolommen: systeem, data, proces, capaciteit)
- [ ] **BLK-03**: Binnen elke categorie-kolom worden items eerst gesorteerd op impact (blokkerend boven hinderlijk), dan op naam
- [ ] **BLK-04**: Elk item in aggregaat-view toont: korte beschrijving, impact-label (rood = blokkerend, grijs = hinderlijk), bron-activiteit (klikbaar om naar activiteit te navigeren)
- [ ] **BLK-05**: Aggregaat-view sluit via Esc of X-knop; navigatie naar bron-activiteit sluit overlay en opent detail-paneel

### Structuur-flexibiliteit (STR)

Lanes, fases en klantreizen kunnen worden toegevoegd, hernoemd of verwijderd zonder code-aanpassing.

- [ ] **STR-01**: "Structuur bewerken"-knop in app-header opent `StructuurEditor`-modal
- [ ] **STR-02**: StructuurEditor heeft drie tabs: Lanes, Fases, Klantreizen
- [ ] **STR-03**: Lane toevoegen vraagt: naam (verplicht), korte omschrijving (optioneel) — wordt onderaan de lane-lijst geplaatst
- [ ] **STR-04**: Lane hernoemen werkt inline; lane verwijderen vraagt confirm-dialog met aantal-activiteiten warning ("Lane bevat 3 activiteiten — ook verwijderen?")
- [ ] **STR-05**: Fase toevoegen vraagt: naam, start-maand (dropdown), eind-maand (dropdown, ≥ start-maand)
- [ ] **STR-06**: Fase hernoemen werkt inline; fase verwijderen ontkoppelt eventuele knelpunten/kansen die eraan hingen (waarschuwing in dialog)
- [ ] **STR-07**: Klantreis toevoegen vraagt: titel, subtitle — start met lege fases/lanes-set (gekopieerd van laatste klantreis als template, optioneel)
- [ ] **STR-08**: Klantreis verwijderen vraagt confirm-dialog en heeft een ongedaan-maken-window (vooral relevant — minst recoverable actie)
- [ ] **STR-09**: Lanes/fases herordenen via drag-handle (@dnd-kit/sortable); werkt met muis én toetsenbord (pijltjes + space)
- [ ] **STR-10**: Voor structuur-mutaties wordt een localStorage-snapshot vóór de mutatie weggeschreven — undo terug naar dat snapshot mogelijk binnen één sessie

### Polish (POL)

Filters, knelpunten/kansen-weergave, JSON-export.

- [ ] **POL-01**: Filterbar in app-header bevat: afdeling-multiselect (Marketing/Sales/PM/Toetstekunde/CS) en blokker-toggle ("Alleen activiteiten met blokkers")
- [ ] **POL-02**: Niet-matchende activiteiten worden gedimd (opacity verlaagd) — niet verwijderd, om visuele context te behouden
- [ ] **POL-03**: Knelpunten/kansen per fase tonen via toggle in fase-header — opent een klein paneel onder de fase met de twee lijsten
- [ ] **POL-04**: JSON-export-knop in app-header downloadt de volledige state als `klantreis-vo-{datum}.json` — voor handmatige backup pre-Supabase
- [ ] **POL-05**: JSON-import-knop accepteert een eerder geëxporteerd bestand en overschrijft state na confirm-dialog

### MT-validatie-preflight (MT)

Sessie-process en completeness-checklist; voorkomt dat technisch perfect prototype faalt door slecht MT-proces.

- [ ] **MT-01**: Demo-banner bovenaan de app: "Vandaag valideren we de structuur en flow — niet de inhoud" — toggleable, default zichtbaar
- [ ] **MT-02**: Walkthrough-script (in `apps/Klantreis/.planning/MT-SESSIE/walkthrough.md`) van max 10 minuten met genummerde stappen voor demo-facilitator
- [ ] **MT-03**: Feedback-sjabloon (printable A4-PDF of structured-form-in-app) met drie gerichte ja/nee-vragen plus open opmerkingen-veld
- [ ] **MT-04**: Beslis-eigenaarschap schriftelijk vastgelegd in `apps/Klantreis/.planning/MT-SESSIE/beslis-eigenaarschap.md` — wie hakt knopen door bij verdeeldheid
- [ ] **MT-05**: Completeness-checklist gerend vóór sessie: tweedeling herkenbaar, DMU-volgorde correct, augustus-links/juli-rechts, geen LIB/Woots-mix vóór aug 2026, max 3 functionele kleuren, mismatch-voorbeeld volledig, tab-navigatie werkt, Chrome+Safari+iPad getest
- [ ] **MT-06**: Localhost-versie draait via `pnpm dev` op poort die niet conflicteert met andere apps in deze monorepo — geen deploy nodig

## v2 Requirements

Deferred — voor volgende milestone(s) na MT-akkoord op ontwerp.

### Tech-overstap

- **TECH-01**: Migratie naar Next.js 15 (App Router)
- **TECH-02**: Supabase project + database schema voor `journeys`, `phases`, `lanes`, `activities`, `dmu_members`, `mist_items`, `klant_stemmen`
- **TECH-03**: Persistence-adapter omzetten van LocalStorage naar Supabase met identieke interface — geen UI-rewrite
- **TECH-04**: TanStack Query voor server-state caching

### Content

- **CONT-01**: Echte Cito-content per klantreis invullen op basis van vastgelegde MT-akkoorden
- **CONT-02**: Klantstemmen-bibliotheek opbouwen vanuit interviews/klantgesprekken
- **CONT-03**: Activiteit-templates per afdeling

### Polish

- **POL-V2-01**: PDF-export voor MT-presentaties (met print-stylesheet)
- **POL-V2-02**: Status-filter (gepland/actief/afgerond)
- **POL-V2-03**: Knelpunten/kansen-paneel in tijdlijn-rand
- **POL-V2-04**: Print-optimalisatie (`@media print`)

### Latere features

- **LAT-01**: Wijzigingshistorie + audit trail
- **LAT-02**: Eigenaarschap per activiteit (user-id)
- **LAT-03**: Magic-link login (Supabase Auth)
- **LAT-04**: Klantsegmentatie binnen reizen
- **LAT-05**: Programmabaten-koppeling

## Out of Scope

Expliciet uitgesloten — voorkomt scope-creep en content-discussies.

| Feature | Reden |
|---------|-------|
| Authenticatie / login / RLS | Expliciet uit scope per CLAUDE.md; lokale state, alles publiek tot Supabase-fase |
| Multi-user gelijktijdig editen | Niet zinvol zonder backend; conflictresolutie hoort bij Supabase-fase |
| AI-suggesties / autogenerated text | Afleidend, ondergraaft outside-in-discipline |
| Versiehistorie binnen sessie | Komt met Supabase + audit-tabel; undo-stack volstaat voor MT-validatie |
| Comments / annotations per element | Out-of-scope voor MT-validatie; komt eventueel in latere milestone |
| As-is vs to-be split | CLAUDE.md verbiedt expliciet — instrument toont alleen gewenste klantreis 2025/2026; mismatches zijn de plek waar verbetering leeft |
| Templates-bibliotheek | Eerst één goede klantreis-structuur valideren, daarna pas templates |
| DIN-framework koppeling | Programmamanagement-context; later eventueel, niet nu |
| Real-time klantdata-integratie (Woots, CRM) | Pas relevant na content-fase; nu placeholder-content |
| Storyboard-lane (visuele scenario's) | Geen onderbouwing in scope-document; eventueel later |
| Emotie-curve (smooth-line over maanden) | Vervangen door 3-punts-dot-schaal — past bij editorial designtaal, voorkomt valse precisie |
| PO- en Zakelijk-sectoren | VO-specifiek bouwen, geen generieke sectorstructuur |
| Cito-SSO koppeling | Verre toekomst — niet eens in v2 |
| PDF-export voor MT-presentatie | Niet kritiek voor ontwerp-validatie; MT kijkt live mee (in v2 als nuttig) |
| Klantsegmentatie binnen reizen | Pas zinvol nadat content is ingevuld |

## Traceability

Welke fase covert welke requirement. Ingevuld door roadmapper op 2026-05-14.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FUND-01 | Fase 1 — Fundering | Pending |
| FUND-02 | Fase 1 — Fundering | Pending |
| FUND-03 | Fase 1 — Fundering | Pending |
| FUND-04 | Fase 1 — Fundering | Pending |
| FUND-05 | Fase 1 — Fundering | Pending |
| FUND-06 | Fase 1 — Fundering | Pending |
| FUND-07 | Fase 1 — Fundering | Pending |
| FUND-08 | Fase 1 — Fundering | Pending |
| FUND-09 | Fase 1 — Fundering | Pending |
| PER-01 | Fase 1 — Fundering | Pending |
| PER-02 | Fase 1 — Fundering | Pending |
| PER-03 | Fase 1 — Fundering | Pending |
| PER-04 | Fase 1 — Fundering | Pending |
| PER-05 | Fase 1 — Fundering | Pending |
| PER-06 | Fase 1 — Fundering | Pending |
| UI-01 | Fase 2 — UI-skelet read-only | Pending |
| UI-02 | Fase 2 — UI-skelet read-only | Pending |
| UI-03 | Fase 2 — UI-skelet read-only | Pending |
| UI-04 | Fase 2 — UI-skelet read-only | Pending |
| UI-05 | Fase 2 — UI-skelet read-only | Pending |
| UI-06 | Fase 2 — UI-skelet read-only | Pending |
| UI-07 | Fase 2 — UI-skelet read-only | Pending |
| UI-08 | Fase 2 — UI-skelet read-only | Pending |
| UI-09 | Fase 2 — UI-skelet read-only | Pending |
| TIJD-01 | Fase 2 — UI-skelet read-only | Pending |
| TIJD-02 | Fase 2 — UI-skelet read-only | Pending |
| TIJD-03 | Fase 2 — UI-skelet read-only | Pending |
| TIJD-04 | Fase 2 — UI-skelet read-only | Pending |
| TIJD-05 | Fase 2 — UI-skelet read-only | Pending |
| BOV-01 | Fase 2 — UI-skelet read-only | Pending |
| BOV-02 | Fase 2 — UI-skelet read-only | Pending |
| BOV-03 | Fase 2 — UI-skelet read-only | Pending |
| BOV-04 | Fase 2 — UI-skelet read-only | Pending |
| BOV-05 | Fase 2 — UI-skelet read-only | Pending |
| BOV-06 | Fase 2 — UI-skelet read-only | Pending |
| OND-01 | Fase 2 — UI-skelet read-only | Pending |
| OND-02 | Fase 2 — UI-skelet read-only | Pending |
| OND-03 | Fase 2 — UI-skelet read-only | Pending |
| OND-04 | Fase 2 — UI-skelet read-only | Pending |
| OND-05 | Fase 2 — UI-skelet read-only | Pending |
| OND-06 | Fase 2 — UI-skelet read-only | Pending |
| DETAIL-01 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-02 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-03 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-04 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-05 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-06 | Fase 3 — Editing & detail-paneel | Pending |
| DETAIL-07 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-01 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-02 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-03 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-04 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-05 | Fase 3 — Editing & detail-paneel | Pending |
| EDIT-06 | Fase 3 — Editing & detail-paneel | Pending |
| MIS-01 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-02 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-03 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-04 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-05 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-06 | Fase 4 — Mismatch & aggregaat | Pending |
| MIS-07 | Fase 4 — Mismatch & aggregaat | Pending |
| BLK-01 | Fase 4 — Mismatch & aggregaat | Pending |
| BLK-02 | Fase 4 — Mismatch & aggregaat | Pending |
| BLK-03 | Fase 4 — Mismatch & aggregaat | Pending |
| BLK-04 | Fase 4 — Mismatch & aggregaat | Pending |
| BLK-05 | Fase 4 — Mismatch & aggregaat | Pending |
| STR-01 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-02 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-03 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-04 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-05 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-06 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-07 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-08 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-09 | Fase 5 — Structuur-flexibiliteit | Pending |
| STR-10 | Fase 5 — Structuur-flexibiliteit | Pending |
| POL-01 | Fase 6 — Polish | Pending |
| POL-02 | Fase 6 — Polish | Pending |
| POL-03 | Fase 6 — Polish | Pending |
| POL-04 | Fase 6 — Polish | Pending |
| POL-05 | Fase 6 — Polish | Pending |
| MT-01 | Fase 7 — MT-validatie-preflight | Pending |
| MT-02 | Fase 7 — MT-validatie-preflight | Pending |
| MT-03 | Fase 7 — MT-validatie-preflight | Pending |
| MT-04 | Fase 7 — MT-validatie-preflight | Pending |
| MT-05 | Fase 7 — MT-validatie-preflight | Pending |
| MT-06 | Fase 7 — MT-validatie-preflight | Pending |

**Coverage:**
- v1 requirements: **87 totaal** (feitelijke telling — instructies vermelden 73, REQUIREMENTS.md bevat er 87)
- Gemapt naar fases: **87 (100%)**
- Ongedekt: **0**
- Duplicaten: **0**

| Fase | # Requirements |
|------|----------------|
| Fase 1 — Fundering | 15 (FUND × 9 + PER × 6) |
| Fase 2 — UI-skelet read-only | 26 (UI × 9 + TIJD × 5 + BOV × 6 + OND × 6) |
| Fase 3 — Editing & detail-paneel | 13 (DETAIL × 7 + EDIT × 6) |
| Fase 4 — Mismatch & aggregaat | 12 (MIS × 7 + BLK × 5) |
| Fase 5 — Structuur-flexibiliteit | 10 (STR × 10) |
| Fase 6 — Polish | 5 (POL × 5) |
| Fase 7 — MT-validatie-preflight | 6 (MT × 6) |
| **Totaal** | **87** |

---
*Requirements defined: 2026-05-14*
*Traceability ingevuld door roadmapper: 2026-05-14*
