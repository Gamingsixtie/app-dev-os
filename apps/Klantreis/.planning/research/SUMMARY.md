# Project Research Summary — Klantreis VO

**Project:** Klantreis VO — Klant in Beeld (Cito)
**Domain:** Interactief CJM + Service Blueprint hybride visualisatie-instrument voor MT-besluitvorming
**Researched:** 2026-05-14
**Confidence:** HOOG (stack, architectuur, valkuilen) / MEDIUM (UX-patronen rond mismatch-visualisatie en inline editing — minder gestandaardiseerd in branche)
**Milestone:** UI-design-first prototype voor MT-validatie — vóór tech-overstap naar Next.js + Supabase

---

## Executive Summary

Dit is een **UI-validatie-prototype, geen product**. Het MT-VO moet collectief achter het ontwerp staan vóór er één regel productiecode of één stuk Cito-content bij komt. De onderzoekslijn convergeert op: bouw een **Vite 8 + React 19 SPA met Tailwind v4 + shadcn/ui + Zustand**, met een strikt **migratie-vriendelijke architectuur** (adapter-pattern voor persistentie, command-pattern voor mutaties, React-vrije domain-laag) zodat de volgende milestone (Next.js + Supabase) een additieve overstap is in plaats van een herschrijfoperatie.

Het instrument onderscheidt zich van Smaply / UXPressia / Custellence op **drie scharnierende differentiators**: (1) **schaduwkaart-mismatch** — activiteiten visueel zichtbaar op de ideale klantmaand naast hun huidige uitvoer-maand, geen tool doet dit native; (2) **DMU-rij beslisser/beïnvloeder/gebruiker** per maand — geen CJM-tool heeft native DMU-rijen; (3) **4-categorieën-aggregaat** van ontbrekende randvoorwaarden (systeem/data/proces/capaciteit × blokkerend/hinderlijk) — Smaply gebruikt vrije tags die bij aggregatie chaos opleveren. Deze drie features samen vormen de "waarom dit bestaat"-kern; alles eromheen is table stakes of polish.

De grootste risico's zijn niet technisch maar **procesmatig**: het MT discussieert over content in plaats van ontwerp (pitfall 2), de tool wordt visueel te druk om in een MT-sessie te kunnen lezen (pitfall 1), of er ontstaat consensus-paralyse (pitfall 3). Preventie zit in lelijke generieke placeholder-content ("Activiteit M-03"), default-collapse van lanes, vooraf vastgelegd beslis-eigenaarschap en read-only-modus als sessie-default. Technisch is de hoofd-valkuil een lokale state-shape die niet migreerbaar is naar Supabase (pitfall 4) — preventie: relationeel datamodel met IDs vanaf dag één in plaats van geneste objecten.

---

## Key Findings

### Recommended Stack

Een **Vite 8 SPA** is bewust gekozen boven Next.js voor deze milestone: Next.js voegt RSC-mental-model, file-based routing en server/client-split toe die voor een prototype zonder backend overkill zijn en iteratie vertragen. Alle keuzes zijn migratie-compatibel met Next.js — componenten zijn gewone React, Tailwind v4 + shadcn/ui draaien identiek, Zustand werkt op beide platforms, types worden basis voor Supabase-schemamigratie.

**Core technologies:**
- **Vite 8 + React 19 + TypeScript 5.7** — productie-rijp, snelste dev-iteratie (Rolldown 10-30× sneller dan Vite 7), volledige Next.js-compatibiliteit bij latere overstap
- **Tailwind CSS v4 + `@tailwindcss/vite`** — `@theme`-directive voor Cito-tokens (#2E75B6 blauw, mismatch-oranje, blokkerend-rood) in één CSS-bestand; shadcn-CLI initialiseert direct in v4
- **shadcn/ui (copy-in, Radix-based)** — niet als npm-dep, kopieert componenten in `src/`; toegankelijkheid + keyboard-navigatie gratis, volledig editable, geen lock-in op dashboard-druk frameworks
- **Zustand 5 + `persist` + `temporal` (zundo)** — fine-grained subscriptions voorkomen re-render-storms op 180+ cellen, localStorage-persist gratis, undo/redo via middleware, store-API blijft identiek bij Supabase-overstap
- **@dnd-kit/core 6.3 + sortable** — stable production-keuze (NIET `@dnd-kit/react` 0.4 pre-1.0), touch-support voor iPad-MT-gebruik
- **Fontsource self-hosted (Inter Variable + Source Serif 4 italic)** — privacy (AVG-relevant in onderwijs), identiek gedrag dev/prod, 1-op-1 in Next.js
- **Lucide React 1.14, clsx, tailwind-merge, immer** — standaard-stack rondom shadcn/ui

**Bewust NIET nu:** Next.js (volgt na MT-akkoord), TanStack Query (geen server), authenticatie, PDF-export, html2canvas, MUI/Chakra/Mantine (design-druk).

→ Detail in [STACK.md](./STACK.md).

### Expected Features

17 P1-features dragen de MVP. Centrale lens: **outside-in** (klant boven, organisatie onder, "line of visibility" nooit mengen) en **editorial designtaal** (Inter overal, Source Serif 4 italic uitsluitend voor klantcitaten, één accentkleur Cito-blauw + functionele oranje/rood).

**Must have (table stakes — 17 P1):**
- Tijdlijn-layout met 12 schooljaar-maandkolommen (aug→jul) + fases-header-rij
- Line of Visibility — visuele tweedeling klant ↔ organisatie
- Klantstap-rij in eerste persoon ("Ik …")
- Klantkanaal-indicator + emotie-dot per klantstap (3-puntsschaal, geen curve)
- Vijf afdelings-swimlanes onder de lijn (Marketing/Sales/Productmanagement/Toetstekunde/Customer Success)
- Activiteit-kaarten in lane-maand-cellen met placeholder-content
- Activiteit-detail-paneel (side-panel) met alle CLAUDE.md-verplichte velden (eigenaar, betrokken, DMU-leden, klantverwachting, KPI's, opdrachtdocument-status, ontbrekende randvoorwaarden)
- Klantcitaten in Source Serif 4 italic in detail-paneel
- Drie klantreizen-tabs (bestaande klanten / nieuwe klanten / bestuur op stichtingsniveau — Stichting BOOR)
- Inline structuur-editing (lanes/fases/reizen toevoegen, hernoemen, verwijderen)
- Filterbar (afdeling + blokker-toggle)
- localStorage-persistence met schema-versie

**Should have — de drie differentiators (kerndifferentiators):**
- **Schaduwkaart-mismatch-visualisatie** — activiteit blijft op huidige maand, schaduwkaart verschijnt op ideale maand (gestippelde rand, oranje accent, optionele connector); mismatch-paneel met klantstem als "waarom". **Geen referentie-tool doet dit native.**
- **DMU-rij beslisser/beïnvloeder/gebruiker per maand** — 3 sub-rijen in vaste volgorde, 0–3 rollen actief per maand. **Geen CJM-tool heeft native DMU.**
- **Aggregaat-view: ontbrekende randvoorwaarden gegroepeerd per 4 vaste categorieën** (systeem/data/proces/capaciteit) — voedt MT-investeringsbesluit. **Concurrenten hebben vrije tags die bij aggregatie chaos opleveren.**

**Defer (v1.x / v2+):**
- Supabase-persistentie + Next.js-overstap (volgende milestone, ná MT-akkoord)
- Echte Cito-content invullen (eerst vorm-akkoord, dan inhoud)
- PDF-export voor MT-presentaties
- Status-filter met meerdere statussen

**Bewust NOOIT in deze milestone (anti-features):** authenticatie/login, multi-user real-time collab, AI-suggesties, versiehistorie, comments/annotations, as-is/to-be-splitsing (CLAUDE.md verbiedt expliciet), templates-bibliotheek, DIN-koppeling, real-time klantdata-integratie, storyboard-lane, emotie-curve, opportunity-cards náást randvoorwaarden.

→ Detail in [FEATURES.md](./FEATURES.md).

### Architecture Approach

Een **vier-lagen-architectuur** met strikte scheiding zodat de migratie naar Next.js + Supabase additief is in plaats van een rewrite: Presentation Layer (React components, pure rendering) → State Layer (één Zustand-store met selectors) → Persistence Layer (adapter-interface met LocalStorage- nu, Supabase-stub later) → Domain Layer (React-vrije types, validatie, mismatch-detectie). De tweedeling boven/onder de lijn is een **UI-invariant, geen data-invariant** — de data weet niet wat "boven" of "onder" is, dat is een rendering-contract.

**Major components / patterns:**
1. **`JourneyView`** — container voor één actieve reis; orkestreert `TimelineHeader`, klantperspectief-rijen (`KlantstapRij`, `DMURij`, `KanaalRij`, `EmotieRij`) boven de lijn, vijf `Lane`-subtrees onder de lijn met `ActiviteitCel` → `ActiviteitKaart` + optionele `Schaduwkaart`
2. **`journeyStore` (Zustand)** — single source of truth: `journeys[]`, `activeJourneyId`, `selectedActivityId`, `filters`, `undoStack`/`redoStack`; fine-grained selectors (`selectActiviteitenInCel`, `selectSchaduwkaartenInCel`, `selectMismatches`, `selectAggregaatBlokkers`)
3. **Overlays via `createPortal`** — `ActiviteitDetailPaneel`, `MismatchPaneel`, `AggregaatBlokkersView`, `StructuurEditor` leven buiten de timeline-tree om accidentele timeline-rerenders te voorkomen
4. **`PersistenceAdapter`-interface** — UI praat met de interface, niet direct met localStorage of Supabase; adapter-swap = 2-regel-change in `KlantreisApp.tsx`
5. **`Command`-pattern voor mutaties** — elke schrijfactie produceert een Command met `apply()`/`revert()`; undo/redo gratis, optimistic UI bij Supabase later triviaal
6. **`domain/` zonder React-imports** — types (`Journey`, `Activiteit`, `MistItem`, `KlantStem`), constants (`MAANDEN`, `DMU_ROLLEN`, `MIST_CATEGORIEËN`), pure functies (`detectMismatches`, `validateKlantstap`); 1-op-1 herbruikbaar in Next.js, unit-testbaar zonder DOM

**Datamodel-fundament (kritiek voor migratie):** `activiteiten` als flat list met `laneId + maand + idealeMaand?` (niet genest per lane), `MistItem.klantstemId` als FK, `lanes` als data-rij (geen enum), TypeScript-enums voor DMU-rol en mist-categorie. Schaduwkaart is een **toestand op `Activiteit`** (`idealeMaand !== maand`), geen aparte entiteit — selectors berekenen mismatch on-the-fly. `MaandIndex` 0–11 met augustus = 0 (geen Date-objecten, geen tz-issues).

→ Detail in [ARCHITECTURE.md](./ARCHITECTURE.md).

### Critical Pitfalls

Zeven project-killers — onder elke één-zin preventie. Volledige analyse + warning signs in [PITFALLS.md](./PITFALLS.md).

1. **CJM te druk om in MT te bespreken** — default-collapse van lanes, max 3 activiteiten/cel zichtbaar, één tab tegelijk, MT-modus die alles dimt behalve focus-elementen
2. **MT discussieert content i.p.v. ontwerp** — bewust lelijke generieke placeholder ("Activiteit M-03", "DMU-citaat hier"), demo-banner met "vandaag valideren we structuur en flow", facilitator-script
3. **Consensus-paralyse ("iedereen-achter")** — vooraf "akkoord" definiëren als "go/no-go op structuur", beslis-eigenaar (Pim) met tie-break-bevoegdheid op ontwerp-keuzes binnen scope-grenzen, drie beslis-niveaus expliciet (structureel / iteratief / post-launch-tweakbaar)
4. **Lokale state niet migreerbaar naar Supabase** — datamodel-contract vanaf dag één met relationele shape + IDs, geen inline-mismatch-objecten, één `persistenceAdapter`-laag tussen UI en storage
5. **Inline-edit overweldigt of geeft dataverlies** — read-only als default, expliciete "Bewerken"-toggle, save-on-blur + Esc=revert, localStorage-snapshot vóór elke structuur-mutatie, confirm-dialog voor destructieve acties
6. **Mismatch-visualisatie verwarrend i.p.v. inzichtgevend** — schaduwkaart visueel duidelijk verschillend (gestippelde rand + oranje + lichtere achtergrond), connector-lijn bij hover, mismatch-indicator op originele kaart, mismatch-paneel verplicht klantcitaat
7. **Outside-in-claim binnenshuis vergeten** — klantstap typografisch groter dan afdelings-lanes, detail-paneel begint met "Wat verwacht de klant?", reviewer-vraag bij elke UI-toevoeging "wat ervaart de klant?" niet "wat moet de afdeling weten?"

Daarnaast 11 moderate (datamodel-enums voor DMU/categorieën, schooljaar-aug=0 constante, LIB→Woots-helper, Cito-jargon in data niet componenten, completeness-checklist preflight) en 7 minor (touch-DnD, FOIT/FOUT, accessibility, Tailwind-utility-soep).

---

## Implications for Roadmap

Op basis van pitfall-to-phase-mapping (PITFALLS sectie) + build-volgorde (ARCHITECTURE sectie 9) + feature-afhankelijkheden (FEATURES sectie) komt deze fase-volgorde naar voren. **Kritiek pad:** Fase 1 → 2 → 3 → 4 → 5. Fase 6 (polish) kan parallel met 5; fase 7 (preflight) is altijd laatste.

### Fase 1: Fundering — domain + state + datamodel-contract
**Rationale:** Pitfall 4 (niet-migreerbare state) en pitfalls 14/16/17 (schooljaar, DMU, mist-categorieën-drift) moeten allemaal in de domain-laag vóór één component bestaat. Bouw van binnen naar buiten.
**Delivers:** `domain/types.ts` (Journey, Activiteit, MistItem, KlantStem), `domain/constants.ts` (MAANDEN aug=0, DMU_ROLLEN, MIST_CATEGORIEËN als enums), `domain/seed.ts` (3 lege Journeys met fases+lanes, géén Cito-content), `domain/mismatch.ts` + `domain/validatie.ts` (pure functies, unit-testbaar), `persistence/adapter.ts` interface + `LocalStorageAdapter`, `store/journeyStore.ts` (Zustand + persist + zundo temporal).
**Avoids:** Pitfalls 4, 14, 16, 17, 23 (state-explosie).

### Fase 2: UI-skelet read-only — designtaal + tijdlijn-frame
**Rationale:** Pitfalls 1 (CJM te druk), 7 (outside-in vergeten), 10 (Service Blueprint overweldigt), 11 (kleur-overload), 20 (FOIT/FOUT) sturen de designtaal-keuzes. Bouw eerst lege, leesbare structuur — voeg interactiviteit pas toe nadat de visuele hiërarchie staat.
**Delivers:** Vite-project-init, `styles/tokens.css` met Cito-tokens en `@theme`, Inter Variable + Source Serif 4 italic self-hosted, primitives (`InlineEdit`, `KlantCitaat`, `KleurAccent`, `Knop`), `KlantreisApp` + `JourneyTabs`, `TimelineHeader` (12 maandkolommen + fase-banners), klantperspectief-rijen, `Lane` + `ActiviteitCel` + `ActiviteitKaart` (alleen render uit seed-data, geen edit).
**Uses:** Vite 8, React 19, Tailwind v4 + `@tailwindcss/vite`, Fontsource, shadcn/ui-init.
**Checkpoint:** MT kan al "kijken hoe een lege reis eruit ziet" zonder edit-capaciteit.

### Fase 3: Editing — inline edit + detail-paneel
**Rationale:** Editing is een eigen pitfall-cluster (pitfall 5, 23, UX-pitfalls). Apart houden van skelet-fase voorkomt dat edit-edge-cases visuele iteratie blokkeren.
**Delivers:** `InlineEdit` toegepast op alle vrije velden, `ActiviteitDetailPaneel` (portal-modal met alle CLAUDE.md-velden), activiteit toevoegen/verwijderen met confirm-dialog, edit-modus toggle (read-only default), save-on-blur + Esc=revert, undo-bar UI.
**Implements:** Command-pattern uit ARCHITECTURE sectie 8.

### Fase 4: Mismatch + aggregaat — de differentiator-fase
**Rationale:** Schaduwkaart is **het** unieke onderscheidend kenmerk en pitfall 6 ("mismatch verwarrend") is een van de zwaarste valkuilen. Verdient eigen fase met user-test bij 2 buitenstaanders vóór MT-sessie.
**Delivers:** `idealeMaand` + `mismatchReden` velden in detail-paneel, schaduwkaart-rendering in `ActiviteitCel` (gestippelde rand, oranje accent, optionele connector), `MismatchPaneel` met klantstem-koppeling, `AggregaatBlokkersView` (4 categorieën-kolommen met cross-cutting items).
**Addresses:** De 3 differentiators (schaduwkaart, DMU-rij was al in fase 2, 4-cat aggregaat).

### Fase 5: Structuur-flexibiliteit — lanes/fases/reizen muteren
**Rationale:** Iteratieve aanpasbaarheid is kernscope per PROJECT.md en CLAUDE.md — niet nice-to-have. Drag-and-drop touch-support (pitfall 19) verdient eigen aandacht.
**Delivers:** `StructuurEditor`-modal (lanes/fases/reizen toevoegen, hernoemen, verwijderen), cascade-validatie bij delete ("lane bevat 3 activiteiten — alles verwijderen?"), optioneel drag-and-drop via @dnd-kit/sortable met keyboard- en touch-support, snapshot-undo voor structuur-mutaties.

### Fase 6: Polish — filters + knelpunten/kansen + JSON-export
**Rationale:** Niet-kritieke maar P1-features die het MT-validatie-gesprek soepeler maken. Kan deels parallel met Fase 5.
**Delivers:** Filterbar in `JourneyToolbar` (afdeling + blokker-toggle), knelpunten/kansen-toggles per fase, undo-bar-toast bij elke mutatie, JSON-export/import voor handmatige backup pre-Supabase.

### Fase 7: MT-sessie preflight — proces + completeness
**Rationale:** Pitfalls 2, 3, 12, 13 zijn allemaal procesmatig. Een werkend prototype dat in een slechte sessie-opzet wordt getoond, faalt alsnog.
**Delivers:** Demo-banner "vandaag valideren we structuur en flow", feedback-sjabloon met 3 gerichte ja/nee-vragen, 10-min walkthrough-demoscript, completeness-checklist uit PITFALLS preflight-sectie (tweedeling herkenbaar, DMU-volgorde, aug links/jul rechts, LIB/Woots-grep, 3 kleuren-audit, mismatch-voorbeeld volledig, accessibility tab-navigatie, Chrome+Safari+iPad-test), beslis-eigenaarschap schriftelijk vastgelegd.

### Phase Ordering Rationale

- **Datamodel eerst, UI later** — pitfall 4 (migreerbaarheid) maakt elke andere volgorde duur. ARCHITECTURE sectie 9 noemt dit "binnen-naar-buiten".
- **Read-only skelet vóór editing** — verlaagt complexiteit-druk in fase 2; designtaal landt eerst, dán komen edge-cases.
- **Differentiator-fase apart** — mismatch is conceptueel zwaarder dan inline-editing en verdient ruimte voor ontwerp-iteratie (pitfall 6).
- **Structuur-mutaties apart van inline-edit** — DnD en cascade-validatie zijn eigen problemen.
- **Preflight-fase is geen detail** — pitfalls 2 + 3 + 13 leren dat zonder gestructureerd MT-proces de hele build voor niets is geweest.

### Research Flags

Fasen waar `/gsd-research-phase` waarschijnlijk loont:
- **Fase 4 (mismatch + aggregaat):** UX-patronen voor "tweede-orde concepten" (relaties tussen twee plekken op dezelfde tijdlijn) zijn niet goed gestandaardiseerd; één-of-twee referentie-implementaties zoeken (data-visualisatie communities, finance-tooling met "expected vs actual" patronen)
- **Fase 5 (structuur-mutaties):** Cascade-confirm-flows en undo-stack-UX met @dnd-kit specifiek voor toegankelijke nested-list-mutaties verdienen kort onderzoek; touch-flows op iPad zijn een bekende valkuil
- **Fase 7 (MT-sessie-proces):** Workshop-facilitatie-patronen voor "design-review-sessie met C-level" — buiten technisch domein

Fasen met standaard-patronen (skip research):
- **Fase 1 (fundering):** Zustand + persist + zundo + adapter-pattern is goed gedocumenteerd
- **Fase 2 (UI-skelet):** Tailwind v4 + shadcn/ui-CLI + Fontsource is recept-werk
- **Fase 3 (editing):** Click-to-edit met staging-buffer is standaard React-patroon
- **Fase 6 (polish):** Filter + export = standaard React-werk

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HOOG | Vite 8 / React 19 / Tailwind v4 / shadcn/ui / Zustand allemaal stable in 2026 met expliciete cross-compatibiliteit. Eén LOW-flag op `@dnd-kit/react` 0.x (bewust gekozen voor 6.3 stable i.p.v. 0.4). |
| Features | HOOG (concurrent-features) / MEDIUM (UX-patterns) | Vijf referentie-tools (Smaply, UXPressia, Custellence, TheyDo, FlowMapp) geanalyseerd; differentiators leunen op CLAUDE.md-regels en domeinkennis, niet op pure markt-precedent. |
| Architecture | HOOG | Pattern-keuzes (adapter, command, fine-grained selectors, domain-isolatie) zijn gevestigde React-patronen; Supabase-migratiepad is gedocumenteerd (officiële Next.js-from-Vite-gids). |
| Pitfalls | HOOG | 25 valkuilen waarvan 7 critical, allemaal verankerd in expliciete CLAUDE.md-regels, PROJECT.md-scope, of bekende CJM/Service Blueprint-praktijk. |

**Overall confidence:** HOOG. Het onderzoek is conservatief opgezet: alle stack-keuzes hebben backup-alternatieven, alle differentiators zijn vergeleken tegen 5 concurrenten, alle critical pitfalls hebben een preventie + warning signs + recovery-strategie.

### Gaps to Address

- **dnd-kit onderhoudstempo-onzekerheid** — @dnd-kit/core 6.3.1 is een jaar geleden gepubliceerd, `@dnd-kit/react` is pre-1.0. Voor deze milestone geen blocker, maar herevalueer vóór productie-fase (Atlassian Pragmatic DnD als alternatief monitoren).
- **Mismatch-UX nog niet getest** — er bestaan geen referentie-implementaties van "schaduwkaart op ideale tijdas-positie" in publiek beschikbare CJM-tools. Plan vroege user-test (2 buitenstaanders) in Fase 4 vóór MT-sessie.
- **MT-sessie-format nog open** — beslis-eigenaarschap, feedback-sjabloon en sessie-cadans moeten in Fase 7 concreet ingevuld worden; nu nog principes, geen artefact.
- **Tom Koolen's parallel DIN + consolidatie-app stack onbekend** — als hij afwijkt van Next.js 15 + Supabase, verifieer voor consolidatie-fase (later, niet blokkerend nu).
- **Performance bij echte content** — 300-500 kaarten in DOM op een MT-laptop is in onderzoek "waarschijnlijk OK" maar niet getest; preflight-checklist (Fase 7) bevat test op MT-typische hardware.
- **LIB VO → Woots-migratie-grens (augustus 2026)** — helper-functie ontworpen, maar exact peildatum-gedrag bij rand-cases (eind juli vs begin aug 2026) moet in seed-data + reviewer-checklist worden afgevangen.

---

## Sources

### Primary (HIGH confidence)
- `apps/Klantreis/.planning/research/STACK.md` — volledige stack-research met confidence per component, alternatives, version-compatibility, migration-pad naar Next.js + Supabase
- `apps/Klantreis/.planning/research/FEATURES.md` — feature-landschap (table stakes, differentiators, anti-features), concurrent-analyse (Smaply/UXPressia/Custellence/TheyDo/FlowMapp), feature-afhankelijkheids-graaf, MVP-definitie met P1/P2/P3
- `apps/Klantreis/.planning/research/ARCHITECTURE.md` — systeemoverzicht, component-decompositie, projectstructuur, datamodel-shape (TypeScript), state-management (Zustand+zundo), data-flow, migratiepad + Supabase-schema, architecturale patterns, build-volgorde
- `apps/Klantreis/.planning/research/PITFALLS.md` — 25 valkuilen (7 critical / 11 moderate / 7 minor), preflight-checklist, recovery-strategies, pitfall-to-phase-mapping
- `apps/Klantreis/.planning/PROJECT.md` — projectscope, requirements, constraints, key decisions
- `apps/Klantreis/CLAUDE.md` — harde domeinregels (tweedeling, DMU-volgorde, mist-categorieën, designtaal, LIB→Woots-platform-migratie)

### Secondary (MEDIUM confidence)
- React 19 + Next.js 15.1 release notes en officiële migratie-gidsen — voor stack-compatibiliteit
- Nielsen Norman Group artikelen over CJM en Service Blueprint pitfalls
- Smaply / UXPressia / Custellence / TheyDo / FlowMapp documentatie — voor concurrent-feature-baseline
- TkDodo "Zustand and React Context" — voor state-management-keuze

### Tertiary (LOW confidence — flagged)
- dnd-kit production-use issue #1830 — onderhouds-discussie, niet blokkerend maar te monitoren
- shadcn/ui's `data-slot`-pattern in nieuwste CLI release — runbook-stap nodig om vóór `add` te updaten

---

*Research completed: 2026-05-14*
*Ready for roadmap: ja — alle 4 onderliggende files (STACK, FEATURES, ARCHITECTURE, PITFALLS) zijn HIGH-confidence en convergeren op consistente aanbevelingen.*

---

## Roadmap-implicaties (TL;DR voor roadmapper — 7 bullets)

- **7 fases voorgesteld**, kritiek pad 1→2→3→4→5, fase 6 parallel met 5, fase 7 altijd laatste
- **Bouw binnen-naar-buiten:** domain-types + state + adapter-pattern vóór één React-component bestaat — anders is Supabase-migratie een rewrite
- **Read-only skelet (fase 2) voor editing (fase 3)** — designtaal eerst landen, edge-cases pas erna
- **Differentiator-fase (4) krijgt eigen ruimte** — schaduwkaart-mismatch heeft geen publieke referentie-implementatie; plan user-test met 2 buitenstaanders vóór MT
- **MT-sessie-preflight (fase 7) is geen administratie** — pitfalls 2/3/13 laten zien dat technisch perfect prototype + slecht proces = mislukking; feedback-sjabloon, demoscript, beslis-eigenaarschap zijn echte deliverables
- **Research-flag op fase 4 + 5 + 7** — UX-patronen voor mismatch, toegankelijke DnD-flows, MT-facilitatie-format verdienen `/gsd-research-phase`
- **Anti-feature-discipline expliciet inbouwen** — placeholder bewust lelijk en generiek, geen as-is/to-be-splitsing, geen AI-suggesties, geen auth-stubs — anders sluipt scope via content-discussie de sessie binnen
