# Roadmap: Klantreis VO — Klant in Beeld

**Created:** 2026-05-14
**Granularity:** coarse (3-5 plans per fase)
**Mode:** yolo
**Parallelization:** ja
**Coverage:** 87/87 v1 requirements gemapt (100%)

## Milestone-doel

Een visueel UI-prototype dat het Cito VO-MT collectief kan valideren — vóór de tech-overstap naar Next.js + Supabase en vóór invulling van echte Cito-content. Het ontwerp drijft de discussie, niet andersom.

## Phases

- [x] **Fase 1: Fundering** ✅ — Domain-laag, datamodel-contract, lokale persistence en Zustand-store vóór één React-component (62 tests groen, SC#2 wacht op Fase 2-UI)
- [ ] **Fase 2: UI-skelet read-only** — Designtaal, tijdlijn-frame, klantperspectief boven de lijn en afdelings-lanes onder de lijn (alleen lezen)
- [ ] **Fase 3: Editing & detail-paneel** — Activiteit-detail-paneel met outside-in volgorde, inline edit-flows, undo en activiteit-CRUD
- [ ] **Fase 4: Differentiators — mismatch & aggregaat** — Schaduwkaart-mismatch op ideale maand en aggregaat-view van ontbrekende randvoorwaarden
- [ ] **Fase 5: Structuur-flexibiliteit** — Lanes, fases en klantreizen muteren zonder code-aanpassing, met cascade-validatie en snapshot-undo
- [ ] **Fase 6: Polish — filters, knelpunten/kansen & JSON-export** — Filterbar, knelpunten/kansen-paneel per fase en JSON-export/import voor handmatige backup
- [ ] **Fase 7: MT-validatie-preflight** — Sessie-proces, demoscript, feedback-sjabloon, beslis-eigenaarschap en completeness-checklist

## Phase Details

### Fase 1: Fundering
**Goal**: Een React-vrije domain-laag, een relationeel datamodel en een lokale persistence + Zustand-store staan, zodat de migratie naar Supabase later additief is in plaats van een rewrite.
**Depends on**: Niets (eerste fase)
**Requirements**: FUND-01, FUND-02, FUND-03, FUND-04, FUND-05, FUND-06, FUND-07, FUND-08, FUND-09, PER-01, PER-02, PER-03, PER-04, PER-05, PER-06
**Success Criteria** (wat moet WAAR zijn):
  1. Een ontwikkelaar kan `pnpm test` draaien en alle domain-pure-functies (mismatch-detectie, eerste-persoon-validatie, schooljaar-volgorde) groen zien zonder dat er een DOM of React in de testrun zit
  2. Bij eerste laden van de app verschijnen drie lege klantreizen (bestaande klanten, nieuwe klanten, bestuur op stichtingsniveau) met augustus links en juli rechts — geen Cito-specifieke content zichtbaar
  3. Een wijziging aan de in-memory state overleeft een browser-refresh via localStorage met schema-versie 1
  4. Een ontbrekende of corrupt-localStorage-payload toont een zichtbare toast (geen silent failure) en valt terug op de seed-state
  5. Een mutatie laat zich ongedaan maken tot minimaal 10 stappen terug binnen één sessie
**Plans**: 5 plans (alle voltooid)
Plans:
- [x] 01-01-PLAN.md ✅ — Vite 8 + React 19 + Tailwind v4 + Fontsource + shadcn-init + Vitest-config (infra-scaffold)
- [x] 01-02-PLAN.md ✅ — Domain pure-laag: types, constants (MAANDEN/DMU/MIST/IMPACT), seedData, mismatch, validatie, platform-helper
- [x] 01-03-PLAN.md ✅ — PersistenceAdapter-interface + LocalStorageAdapter + Zod-schema + migrate-pipeline
- [x] 01-04-PLAN.md ✅ — Zustand-store + zundo temporal (min 10 stappen undo) + Command-pipeline + selectors + hydrate-flow
- [x] 01-05-PLAN.md ✅ — Contract-tests per CLAUDE.md-invariant (domain, persistence, store) — bewijst SC#1, #3, #4, #5 (62 tests groen)
**UI hint**: no

### Fase 2: UI-skelet read-only
**Goal**: Het MT kan op localhost door drie lege klantreizen kijken en herkent direct de tweedeling boven/onder de lijn, de schooljaartijdlijn en de editorial designtaal — zonder iets te kunnen bewerken.
**Depends on**: Fase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, TIJD-01, TIJD-02, TIJD-03, TIJD-04, TIJD-05, BOV-01, BOV-02, BOV-03, BOV-04, BOV-05, BOV-06, OND-01, OND-02, OND-03, OND-04, OND-05, OND-06
**Success Criteria** (wat moet WAAR zijn):
  1. Een buitenstaander herkent binnen 5 seconden welke informatie het klantperspectief is en welke het organisatieperspectief — de visibility-line is visueel evident
  2. Het MT ziet één actieve klantreis tegelijk en kan via drie tabs schakelen tussen "Bestaande klanten", "Nieuwe klanten" en "Bestuur (stichtingsniveau)" met behoud van structuur per reis
  3. De tijdlijn toont augustus links en juli rechts, met fases-banners die één of meerdere maanden spannen — geen kalenderjaar-volgorde
  4. De UI is volledig Nederlands, gebruikt Inter als enig lettertype behalve klantcitaten in Source Serif 4 italic, en toont maximaal drie functionele kleuren (Cito-blauw, mismatch-oranje, blokkerend-rood)
  5. Een klantstap leest visueel prominenter dan een afdelings-lane — outside-in komt naar voren zonder uitleg
**Plans**: TBD
**UI hint**: yes

### Fase 3: Editing & detail-paneel
**Goal**: Het MT kan een activiteit aanklikken, het volledige detail-paneel lezen met "Wat verwacht de klant?" als eerste regel, en in edit-modus velden bewerken, activiteiten toevoegen en verwijderen — zonder dataverlies en met undo binnen handbereik.
**Depends on**: Fase 2
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05, DETAIL-06, DETAIL-07, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06
**Success Criteria** (wat moet WAAR zijn):
  1. Klikken op een activiteit-kaart opent een zij-paneel dat begint met de klantverwachting en alle CLAUDE.md-verplichte velden toont (eigenaar, betrokken, DMU-lijst, klantverwachting, KPI's, opdrachtdocument-status, ontbrekende randvoorwaarden)
  2. In read-only modus (default bij laden) zijn velden niet bewerkbaar; na het inschakelen van edit-modus in de header zijn vrije velden klikbaar en wijzigen ze op blur, terwijl Esc de wijziging revertet
  3. Een MT-lid kan een activiteit toevoegen via een "+"-knop in een lane-cel en verwijderen via het detail-paneel met confirm-dialog
  4. Na elke mutatie verschijnt 8 seconden een "Ongedaan maken"-toast; Ctrl+Shift+Z herstelt een teruggedraaide actie
  5. Het detail-paneel sluit via X, Esc en klik buiten paneel — de selectie wordt netjes gewist in de store
**Plans**: TBD
**UI hint**: yes

### Fase 4: Differentiators — mismatch & aggregaat
**Goal**: Het MT ziet in één oogopslag wáár Cito's activiteiten op een verkeerde maand vallen ten opzichte van de ideale klantmaand, en kan in een aparte aggregaat-view de ontbrekende randvoorwaarden gegroepeerd per vier vaste categorieën beoordelen voor investeringsbesluiten.
**Depends on**: Fase 3
**Requirements**: MIS-01, MIS-02, MIS-03, MIS-04, MIS-05, MIS-06, MIS-07, BLK-01, BLK-02, BLK-03, BLK-04, BLK-05
**Success Criteria** (wat moet WAAR zijn):
  1. Twee buitenstaanders begrijpen binnen 10 seconden — zonder uitleg — dat een schaduwkaart (gestippelde rand, oranje accent, lichtere achtergrond) staat waar de activiteit eigenlijk zou moeten plaatsvinden en de originele kaart staat waar hij nu valt
  2. Klikken op een schaduwkaart opent een mismatch-paneel dat de huidige maand, ideale maand, mismatch-reden en een klantstem in Source Serif 4 italic toont (met rol + schoolprofiel als bron)
  3. Een aggregaat-view-knop in de app-header opent een full-screen overlay met exact vier kolommen — systeem, data, proces, capaciteit — geen vijfde categorie, geen vrije tags
  4. Binnen elke categorie staan blokkerende items (rood label) boven hinderlijke items (grijs label) en daarna gesorteerd op naam
  5. Klikken op een item in de aggregaat-view sluit de overlay en opent het detail-paneel van de bron-activiteit op de juiste maand
**Plans**: TBD
**UI hint**: yes

### Fase 5: Structuur-flexibiliteit
**Goal**: Het MT kan tijdens de validatie-sessie lanes, fases en klantreizen toevoegen, hernoemen of verwijderen — zonder code-aanpassing en zonder vertrouwen-verlies door dataverlies. Iteratieve aanpasbaarheid is kernscope, geen nice-to-have.
**Depends on**: Fase 4
**Requirements**: STR-01, STR-02, STR-03, STR-04, STR-05, STR-06, STR-07, STR-08, STR-09, STR-10
**Success Criteria** (wat moet WAAR zijn):
  1. Een MT-lid opent via "Structuur bewerken" een modal met drie tabs (Lanes, Fases, Klantreizen) en kan in elke tab toevoegen, hernoemen en verwijderen
  2. Een lane verwijderen die activiteiten bevat toont een confirm-dialog met aantal-warning ("Lane bevat 3 activiteiten — ook verwijderen?") — geen stille destructie
  3. Een klantreis verwijderen vraagt expliciete confirm met ongedaan-maken-window — de minst-recoverable actie is het zwaarst beveiligd
  4. Lanes en fases herordenen werkt zowel met de muis (drag-handle) als met het toetsenbord (pijltjes + spatie) op desktop én op iPad
  5. Voor elke structuur-mutatie wordt een snapshot in localStorage weggeschreven; één-klik undo herstelt de vorige structuur binnen dezelfde sessie
**Plans**: TBD
**UI hint**: yes

### Fase 6: Polish — filters, knelpunten/kansen & JSON-export
**Goal**: Het MT kan de tijdlijn filteren op afdeling en blokkers, knelpunten/kansen per fase opklappen en de volledige state als JSON downloaden voor handmatige backup vóór de Supabase-overstap.
**Depends on**: Fase 4 (kan parallel met Fase 5 worden uitgevoerd)
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05
**Success Criteria** (wat moet WAAR zijn):
  1. Een MT-lid kan in de filterbar één of meerdere afdelingen selecteren en alleen-met-blokkers togglen; niet-matchende activiteiten worden gedimd (niet verwijderd) zodat visuele context behouden blijft
  2. Per fase opent een toggle in de fase-header een paneel met knelpunten en kansen — zonder dat de hoofdtijdlijn verspringt
  3. De JSON-export-knop downloadt een bestand met de naam `klantreis-vo-{datum}.json` dat de volledige state bevat
  4. Een eerder geëxporteerd bestand kan via JSON-import worden teruggezet — met confirm-dialog vóór overschrijven van de huidige state
  5. Filters resetten en exporteren werken zonder de scroll-positie of de actieve tab te verliezen
**Plans**: TBD
**UI hint**: yes

### Fase 7: MT-validatie-preflight
**Goal**: De MT-sessie zelf slaagt — een technisch perfect prototype + slecht proces is alsnog mislukking. Demoscript, feedback-sjabloon, beslis-eigenaarschap en een afgevinkte completeness-checklist zijn écht aanwezig vóór de sessie.
**Depends on**: Fase 5 én Fase 6 (laatste fase, altijd na alle andere)
**Requirements**: MT-01, MT-02, MT-03, MT-04, MT-05, MT-06
**Success Criteria** (wat moet WAAR zijn):
  1. Bij eerste laden toont de app een prominente demo-banner "Vandaag valideren we de structuur en flow — niet de inhoud" — toggleable, maar default zichtbaar
  2. De facilitator (Pim) heeft een walkthrough-script op papier dat in maximaal 10 minuten élk hoofdelement van het prototype één keer aanraakt
  3. Elk MT-lid krijgt een feedback-sjabloon met drie gerichte ja/nee-vragen plus een open opmerkingen-veld — niet een open einde, niet "stuur maar mail"
  4. Beslis-eigenaarschap bij verdeeldheid is schriftelijk vastgelegd in `apps/Klantreis/.planning/MT-SESSIE/beslis-eigenaarschap.md` vóór de sessie start
  5. De completeness-checklist is 100% afgevinkt — tweedeling herkenbaar, DMU-volgorde correct, augustus-links/juli-rechts, geen LIB/Woots-mix vóór aug 2026, max 3 functionele kleuren, mismatch-voorbeeld volledig, tab-navigatie werkt, Chrome+Safari+iPad getest — én `pnpm dev` draait op een conflictvrije poort
**Plans**: TBD
**UI hint**: yes

## Phase-ordering rationale

- **Kritiek pad: 1 → 2 → 3 → 4 → 5.** Datamodel-contract en state-architectuur (fase 1) staan vóór één React-component bestaat; anders is de Supabase-migratie een rewrite (pitfall 4). UI-skelet read-only (fase 2) landt designtaal en visuele hiërarchie vóór editing-edge-cases (fase 3). De differentiator-fase (4) krijgt eigen ruimte omdat schaduwkaart geen publieke referentie-implementatie heeft (pitfall 6). Structuur-flexibiliteit (5) komt ná editing zodat DnD- en cascade-validatie-problemen niet visuele iteratie blokkeren.
- **Fase 6 mag parallel met fase 5** lopen — polish raakt geen structuur-mutaties of differentiators en kan asynchroon worden ingebouwd zodra fase 4 staat.
- **Fase 7 is altijd laatste.** Pitfalls 2, 3, 12 en 13 leren dat een technisch perfect prototype in een slecht-opgezette sessie alsnog faalt; preflight is geen administratie.

## Progress

| Fase | Plans Compleet | Status | Afgerond |
|------|----------------|--------|----------|
| 1. Fundering | 5/5 | ✅ Voltooid — 62 tests groen, SC#2 wacht op Fase 2-UI | 2026-05-15 |
| 2. UI-skelet read-only | 0/? | Niet gestart | - |
| 3. Editing & detail-paneel | 0/? | Niet gestart | - |
| 4. Mismatch & aggregaat | 0/? | Niet gestart | - |
| 5. Structuur-flexibiliteit | 0/? | Niet gestart | - |
| 6. Polish | 0/? | Niet gestart | - |
| 7. MT-validatie-preflight | 0/? | Niet gestart | - |

## Coverage-samenvatting

- **Totaal v1 requirements:** 87 (verdeeld over 13 categorieën in REQUIREMENTS.md)
- **Gemapt naar fases:** 87/87 (100%)
- **Ongedekt:** 0
- **Duplicaten (een requirement in meerdere fases):** 0

| Categorie | # | Fase |
|-----------|---|------|
| FUND (Fundering) | 9 | 1 |
| PER (Persistence) | 6 | 1 |
| UI (Designtaal) | 9 | 2 |
| TIJD (Tijdlijn-frame) | 5 | 2 |
| BOV (Boven de lijn) | 6 | 2 |
| OND (Onder de lijn) | 6 | 2 |
| DETAIL (Activiteit-detail) | 7 | 3 |
| EDIT (Editing) | 6 | 3 |
| MIS (Mismatch-differentiator) | 7 | 4 |
| BLK (Blokkers-aggregaat) | 5 | 4 |
| STR (Structuur-flexibiliteit) | 10 | 5 |
| POL (Polish) | 5 | 6 |
| MT (MT-preflight) | 6 | 7 |

**Telnoot:** De roadmapper-instructies vermelden 73 v1 requirements; de feitelijke telling in REQUIREMENTS.md is 87. Coverage is geverifieerd tegen de feitelijke lijst — niet tegen het instructie-getal — en is 100%.

---

*Roadmap created: 2026-05-14 — gebaseerd op research/SUMMARY.md (aanbevolen 7-fase-structuur), research/PITFALLS.md (pitfall-to-phase-mapping) en research/ARCHITECTURE.md (build-volgorde binnen-naar-buiten).*
*Fase 1 plans gegenereerd: 2026-05-14 — 5 plans, kritiek pad 01-01 → 01-02 → 01-03 → 01-04 → 01-05.*
