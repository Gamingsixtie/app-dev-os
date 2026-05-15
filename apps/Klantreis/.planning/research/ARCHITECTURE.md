# Architecture Research — Klantreis VO

**Domein:** Interactief klantreis-visualisatie-instrument (CJM + Service Blueprint), single-page React app met editable timeline UI
**Onderzocht:** 2026-05-14
**Confidence:** HIGH (op SPA-architectuur en datamodel — verifieerbaar via React docs en CJM/Service Blueprint methodologie) / MEDIUM (op Supabase-migratiepad — verifieerbaar wanneer schema concreet wordt)

---

## 1. Systeemoverzicht

### High-level architectuur

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                          │
│  (React components — pure rendering + event-handlers, geen logica)   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ KlantreisApp │  │ JourneyTabs      │  │ JourneyToolbar       │   │
│  │ (root)       │  │ (3 tabs)         │  │ (filter/aggregate)   │   │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│         │                   │                       │                │
│  ┌──────▼───────────────────▼───────────────────────▼────────────┐  │
│  │                       JourneyView (1 actieve reis)              │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │  TimelineHeader (aug — jul, fases)                     │    │  │
│  │  ├────────────────────────────────────────────────────────┤    │  │
│  │  │  KlantPerspectief (boven de lijn)                      │    │  │
│  │  │   - KlantstapRij (1e persoon)                          │    │  │
│  │  │   - DMURij (beslisser/beïnvloeder/gebruiker)           │    │  │
│  │  │   - KanaalRij                                          │    │  │
│  │  │   - EmotieRij                                          │    │  │
│  │  ├──────── HARDE LIJN (UI-divider, nooit mengen) ─────────┤    │  │
│  │  │  Organisatieperspectief (onder de lijn)                │    │  │
│  │  │   - Lane × 5 (Marketing/Sales/PM/Toetst./CS)           │    │  │
│  │  │     └── ActiviteitCel(maand) ×12                       │    │  │
│  │  │         └── eventueel Schaduwkaart (mismatch)          │    │  │
│  │  ├────────────────────────────────────────────────────────┤    │  │
│  │  │  DataRij (datalevering per maand)                      │    │  │
│  │  │  SystemenRij (LIB VO/Woots per maand)                  │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Overlays (portal-based modals — niet binnen timeline tree) │    │
│  │   - ActiviteitDetailPaneel                                  │    │
│  │   - MismatchPaneel                                          │    │
│  │   - AggregaatBlokkersView                                   │    │
│  │   - StructuurEditor (lanes/fases/reizen toevoegen)          │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                          STATE LAYER                                  │
│  (Single source of truth — Zustand store of useReducer + Context)    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  journeyStore                                                │    │
│  │   - journeys: Journey[]      (3 reizen)                     │    │
│  │   - activeJourneyId          (welke tab)                    │    │
│  │   - selectedActivityId       (welk paneel open)             │    │
│  │   - filters                  (afdeling/status/blokker)      │    │
│  │   - undoStack / redoStack    (voor reversibele edits)       │    │
│  │   - actions: addActivity, updateActivity, addLane, ...      │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                          PERSISTENCE LAYER                            │
│  (Deze milestone: localStorage + JSON-export. Volgende: Supabase.)   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐   ┌─────────────────────────────────┐      │
│  │ persistenceAdapter  │ → │ LocalStorageAdapter (nu)        │      │
│  │ (interface)         │   │ SupabaseAdapter (volgende milest)│      │
│  └─────────────────────┘   └─────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Cruciale architectuur-principes

1. **Tweedeling als UI-invariant, niet als data-invariant.** Boven/onder de lijn is een rendering-contract van de timeline-component. De data weet niet wat "boven" of "onder" is — elke rij heeft een `position: 'klant' | 'organisatie'` of zit in een aparte sub-structuur. Dit voorkomt dat refactors van de visuele lay-out het schema raken.

2. **Journey is een aggregate root.** Eén `Journey` bevat alles wat bij die klantreis hoort (fases, klantstappen, activiteiten, mist-items, klantstemmen). Geen orphan-data tussen reizen. Dit mapt later 1:1 naar één Supabase-rij met child-tabellen via FK.

3. **Adapter-pattern voor persistentie.** De UI praat met een `persistenceAdapter`-interface, niet direct met `localStorage` of Supabase. Dat is het hele migratiepad in één architectuur-beslissing.

4. **Structurele flexibiliteit is een eerste-klas data-concern.** Lanes, fases en reizen zijn allemaal data-objecten met IDs — geen hard-coded constanten. Toevoegen/verwijderen werkt automatisch via dezelfde update-paden als andere edits.

---

## 2. Component-decompositie

### Component-boom met verantwoordelijkheden

| Component | Verantwoordelijkheid | Praat met | Re-render-trigger |
|-----------|---------------------|-----------|-------------------|
| `KlantreisApp` | Root, store-provider, routing tussen tabs/overlays | store-init, ErrorBoundary | nooit (alleen mount) |
| `JourneyTabs` | Render 3 reizen-tabs, switcht `activeJourneyId` | store: `journeys[].title`, `activeJourneyId` | tab-switch |
| `JourneyToolbar` | Filters (afdeling/status/blokker), knoppen voor structuur-edit en aggregaat-view | store: `filters`, opens overlays | filter-change |
| `JourneyView` | Container voor één actieve reis — orkestreert timeline-onderdelen | store: hele actieve `Journey` | journey-mutaties |
| `TimelineHeader` | 12 maandkolommen + fase-banners + knelpunten/kansen-toggles per fase | store: `phases[]`, view-config | fase-edits |
| `KlantstapRij` | Klantstap-tekst per maand (1e persoon) | store: `rows.klantstap[]` | klantstap-edit |
| `DMURij` | DMU-rollen per maand (beslisser/beïnvloeder/gebruiker, vaste volgorde) | store: `rows.dmu[]` | DMU-edit |
| `KanaalRij` | Klantkanaal per maand | store: `rows.kanaal[]` | kanaal-edit |
| `EmotieRij` | Emotie-curve / emoji per maand | store: `rows.emotie[]` | emotie-edit |
| `Lane` | Eén afdelings-lane met activiteit-cellen | store: `activiteiten[]` gefilterd op `lane` | activiteit-mutatie in deze lane |
| `ActiviteitCel` | Eén cel (lane × maand): rendert 0..n activiteitkaarten + eventuele schaduwkaarten | store: activiteiten in deze cel | mutatie in deze cel |
| `ActiviteitKaart` | Eén concrete activiteit (titel, status-indicator, mist-rood, klikt door naar detail) | parent-prop | prop-change |
| `Schaduwkaart` | Visuele "deze activiteit hoort hier maar staat ergens anders" indicator | parent-prop | mismatch-change |
| `DataRij` | Datalevering per maand (onder lanes) | store: `data[maand]` | data-edit |
| `SystemenRij` | Welk systeem actief is per maand (LIB VO → Woots augustus 2026) | store: `systemen[maand]` | systeem-edit |
| `ActiviteitDetailPaneel` | Modal/side-paneel voor activiteit (alle velden + mist-editor) | store: geselecteerde activiteit + alle CRUD-actions | open/close + edits |
| `MismatchPaneel` | Sub-paneel binnen detail: klantstem, ideale maand, mismatch-reden | parent-prop (selected activity) | mismatch-edit |
| `AggregaatBlokkersView` | Modal-view: alle mist-items gegroepeerd per categorie, gekoppeld aan activiteiten | store: alle mist-items over hele reis | mist-mutatie |
| `StructuurEditor` | Modal: lanes/fases/reizen toevoegen/hernoemen/verwijderen | store: structurele CRUD-actions | structuur-edit |

### Component boundary-regels

- **Geen rij-component kent zijn buren.** `KlantstapRij` weet niets van `DMURij`. Alle rij-componenten lezen onafhankelijk uit de store en renderen 12 kolommen.
- **Lane is geen rij — Lane is een eigen subtree.** Een lane heeft een eigen titel-cel + 12 maand-cellen. Renderpad: `JourneyView → Lane → ActiviteitCel → ActiviteitKaart`. Dit isoleert lane-specifieke logica (drag/drop, filtering op lane).
- **Modals leven buiten de timeline-tree.** `ActiviteitDetailPaneel` rendert via `createPortal` op document.body. Voorkomt CSS-stacking-issues en re-renders van de timeline bij open/close.
- **Schaduwkaart is een type ActiviteitKaart, niet een aparte component-tak.** `ActiviteitKaart` heeft een `variant: 'normal' | 'schaduw'` prop. De cel kiest welke variant te renderen op basis van data (`maand === activiteit.maand` vs `maand === activiteit.idealeMaand`).

---

## 3. Aanbevolen projectstructuur

```
apps/Klantreis/
├── src/
│   ├── app/                          # Next.js app router (vanaf milestone 2)
│   │   └── (deze milestone: simpele Vite + React SPA)
│   │
│   ├── components/
│   │   ├── KlantreisApp.tsx          # Root component
│   │   ├── journey/
│   │   │   ├── JourneyTabs.tsx
│   │   │   ├── JourneyToolbar.tsx
│   │   │   ├── JourneyView.tsx       # Container voor 1 actieve reis
│   │   │   └── TimelineHeader.tsx
│   │   ├── klant-perspectief/        # Boven de lijn
│   │   │   ├── KlantstapRij.tsx
│   │   │   ├── DMURij.tsx
│   │   │   ├── KanaalRij.tsx
│   │   │   └── EmotieRij.tsx
│   │   ├── organisatie-perspectief/  # Onder de lijn
│   │   │   ├── Lane.tsx
│   │   │   ├── ActiviteitCel.tsx
│   │   │   ├── ActiviteitKaart.tsx
│   │   │   ├── Schaduwkaart.tsx
│   │   │   ├── DataRij.tsx
│   │   │   └── SystemenRij.tsx
│   │   ├── overlays/                 # Modals/portals
│   │   │   ├── ActiviteitDetailPaneel.tsx
│   │   │   ├── MismatchPaneel.tsx
│   │   │   ├── AggregaatBlokkersView.tsx
│   │   │   └── StructuurEditor.tsx
│   │   └── primitives/               # Editorial UI atoms
│   │       ├── InlineEdit.tsx        # Click-to-edit text
│   │       ├── KlantCitaat.tsx       # Source Serif 4 italic wrapper
│   │       ├── KleurAccent.tsx       # Enforce 4-color regel
│   │       └── Knop.tsx
│   │
│   ├── store/
│   │   ├── journeyStore.ts           # Zustand (of useReducer + Context)
│   │   ├── selectors.ts              # Afgeleide data (mismatch-detectie, filtering)
│   │   ├── actions/
│   │   │   ├── activiteit.ts         # add/update/delete + move
│   │   │   ├── mist.ts               # mist-CRUD
│   │   │   ├── structuur.ts          # lanes/fases/reizen
│   │   │   └── undo.ts               # undo/redo stack-acties
│   │   └── undoMiddleware.ts         # Command-pattern voor reversibele mutaties
│   │
│   ├── domain/                       # Pure types + logica, geen React
│   │   ├── types.ts                  # Journey, Phase, Activiteit, Mist, etc.
│   │   ├── constants.ts              # MAANDEN, DMU_ROLLEN, MIST_CATEGORIEËN
│   │   ├── mismatch.ts               # detectMismatches(journey): MismatchInfo[]
│   │   ├── validatie.ts              # invariant-checks (1e persoon, DMU-volgorde)
│   │   └── seed.ts                   # Lege placeholder-structuur (geen Cito-content)
│   │
│   ├── persistence/
│   │   ├── adapter.ts                # PersistenceAdapter interface
│   │   ├── localStorage.ts           # Implementatie deze milestone
│   │   ├── supabase.ts               # Implementatie volgende milestone (stub nu)
│   │   └── serialize.ts              # Journey ↔ JSON
│   │
│   ├── styles/
│   │   ├── tokens.css                # CSS-vars: kleuren, fonts, spacing
│   │   └── globals.css               # Inter + Source Serif 4 imports
│   │
│   └── tests/
│       ├── unit/                     # domain/ logica + store actions
│       ├── component/                # Testing Library per component
│       └── e2e/                      # Playwright happy-paths
│
├── public/
│   └── fonts/                        # Inter, Source Serif 4 (geen CDN in productie)
│
├── .planning/
└── package.json
```

### Structuur-rationale

- **`components/` opgesplitst per perspectief (klant vs organisatie)** — spiegelt de harde tweedeling uit de domeinregels. Mengen wordt fysiek lastig: een `Lane` importeren in `klant-perspectief/` is direct verdacht.
- **`domain/` is React-vrij.** Types, constants en pure logica (mismatch-detectie, validatie). Deze map kan 1:1 mee naar Next.js zonder aanpassing. Tests draaien snel in Vitest zonder DOM.
- **`store/` is geïsoleerd van components.** Componenten importeren selectors en actions, nooit interne store-state. Migratie naar server-state (TanStack Query + Supabase) raakt alleen `store/` + `persistence/`.
- **`persistence/` met adapter-interface.** Hét architectuur-vehikel voor de migratie. Adapter swap = 2-regel-change in `KlantreisApp.tsx`.
- **`overlays/` apart van timeline-componenten.** Modals zijn portal-based en hebben hun eigen open/close-lifecycle. Apart houden voorkomt accidentele timeline-rerenders.
- **`primitives/` voor editorial designtokens.** `InlineEdit`, `KlantCitaat` en `KleurAccent` zorgen dat de Cito-designregels (Inter only, Source Serif voor citaten, 4-kleuren-regel) op één plek afgedwongen worden.

---

## 4. Datamodel-shape (TypeScript-style)

### Kerntypes

```typescript
// domain/types.ts

/** Een schooljaarmaand. Index 0 = augustus, 11 = juli. */
export type MaandIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type ReisType = 'bestaande-klant' | 'nieuwe-klant' | 'bestuur-stichting';

export type LaneType =
  | 'marketing'
  | 'sales'
  | 'productmanagement'
  | 'toetstekunde'
  | 'customer-success';
// NB: opgeslagen als string, niet als enum, zodat user nieuwe lanes kan toevoegen.

export type DMURol = 'beslisser' | 'beïnvloeder' | 'gebruiker';
// HARDE volgorde — UI rendert altijd in deze volgorde, ongeacht datavolgorde.

export type MistCategorie = 'systeem' | 'data' | 'proces' | 'capaciteit';
export type MistImpact = 'blokkerend' | 'hinderlijk';

export type ActiviteitStatus =
  | 'concept'        // alleen titel
  | 'uitgewerkt'     // alle velden ingevuld
  | 'opdracht-actief' // opdrachtdocument bestaat
  | 'lopend'         // wordt uitgevoerd
  | 'afgerond';

export type Platform = 'lib-vo' | 'woots';
// Pre-augustus-2026 = lib-vo, post = woots. Mengen niet toegestaan in UI.

// ─────────────────────────────────────────────────────────────

export interface Journey {
  id: string;                          // ULID of nanoid
  type: ReisType;
  title: string;                       // "Bestaande klanten"
  subtitle?: string;                   // Optionele context
  volgorde: number;                    // Voor tab-ordering
  fases: Phase[];                      // Fase-banners over de tijdlijn
  rows: KlantPerspectiefRows;          // Alles boven de lijn
  lanes: Lane[];                       // Afdelings-lanes (configurable!)
  activiteiten: Activiteit[];          // Alle activiteit-items (flat list)
  data: Record<MaandIndex, string>;    // Datalevering per maand
  systemen: Record<MaandIndex, Platform | null>;
  klantstemmen: KlantStem[];           // Losse citaten (los gekoppeld aan mist/activiteit via id)
  voorstellen: Voorstel[];             // Verbeter-voorstellen per fase
  createdAt: string;                   // ISO
  updatedAt: string;
}

export interface Phase {
  id: string;
  name: string;                        // "Schooljaar inrichten"
  fromMaand: MaandIndex;
  toMaand: MaandIndex;
  knelpunten: string[];                // Vrije tekst, toggleable in UI
  kansen: string[];
}

export interface KlantPerspectiefRows {
  klantstap: Record<MaandIndex, string>;     // 1e persoon — validatie: moet beginnen met "Ik "
  kanaal: Record<MaandIndex, string>;        // "Telefoon", "Portaal", "E-mail"
  emotie: Record<MaandIndex, EmotieScore>;
  dmu: Record<MaandIndex, DMURolAanwezig>;   // Welke DMU-rollen actief per maand
}

export interface DMURolAanwezig {
  beslisser: boolean;
  beïnvloeder: boolean;
  gebruiker: boolean;
}

export type EmotieScore = -2 | -1 | 0 | 1 | 2;  // Voor emotie-curve

export interface Lane {
  id: string;
  type: LaneType | string;             // String voor user-toegevoegde lanes
  label: string;                       // Display-naam
  volgorde: number;                    // Vertical sorting onder de lijn
  kleur?: string;                      // Optioneel — anders default
}

export interface Activiteit {
  id: string;
  journeyId: string;
  laneId: string;
  maand: MaandIndex;                   // Waar staat-ie nu
  idealeMaand?: MaandIndex;            // Bij mismatch: waar zou-ie horen
  mismatchReden?: string;              // Klantstem-id of vrije tekst
  titel: string;
  beschrijving?: string;
  doel?: string;
  aanpak?: string;
  markt?: string;                      // Welk segment
  status: ActiviteitStatus;
  eigenaar?: string;                   // Persoon-naam (geen FK in deze milestone)
  betrokken: string[];                 // Personen-namen
  dmu: DMURol[];                       // Welke DMU-leden bij deze activiteit
  kpi: string[];                       // Vrije tekst per KPI
  opdrachtdocument?: {
    status: 'geen' | 'concept' | 'definitief';
    url?: string;
  };
  mist: MistItem[];                    // Ontbrekende randvoorwaarden
  klantverwachting?: string;
  volgorde: number;                    // Binnen dezelfde cel (lane × maand)
}

export interface MistItem {
  id: string;
  categorie: MistCategorie;            // systeem/data/proces/capaciteit
  impact: MistImpact;                  // blokkerend/hinderlijk
  wat: string;                         // Beschrijving
  klantstemId?: string;                // Optionele koppeling naar KlantStem
}

export interface KlantStem {
  id: string;
  citaat: string;                      // Wordt in Source Serif 4 italic gerenderd
  wie?: string;                        // "Toetscoördinator HAVO"
  context?: string;
}

export interface Voorstel {
  id: string;
  faseId: string;
  titel: string;
  beschrijving: string;
  type: 'knelpunt-oplossing' | 'kans-benutten';
}

// ─────────────────────────────────────────────────────────────
// Afgeleide types (selectors, niet opgeslagen)

export interface MismatchInfo {
  activiteit: Activiteit;
  huidigeMaand: MaandIndex;
  idealeMaand: MaandIndex;
  reden?: string;
  klantstem?: KlantStem;
}

export interface AggregaatBlokker {
  categorie: MistCategorie;
  items: Array<{
    mist: MistItem;
    activiteit: Activiteit;
    klantstem?: KlantStem;
  }>;
  aantalBlokkerend: number;
  aantalHinderlijk: number;
}
```

### Top-level app-state

```typescript
// store/journeyStore.ts

export interface AppState {
  journeys: Journey[];                 // 3 reizen
  activeJourneyId: string | null;
  selectedActivityId: string | null;   // Welk detail-paneel
  overlay: 'none' | 'detail' | 'mismatch' | 'aggregaat' | 'structuur';
  filters: {
    lanes: string[];                   // Welke afdelingen tonen (default: alle)
    statuses: ActiviteitStatus[];
    alleenMetBlokker: boolean;
  };
  undoStack: Command[];
  redoStack: Command[];
  meta: {
    versie: number;                    // Schema-versie voor migraties
    lastSaved: string;                 // ISO
  };
}
```

### Datamodel-keuzes verklaard

1. **`maand: MaandIndex` (0–11) ipv string of Date.** Het schooljaar begint augustus = 0. Geen tz-issues, geen parse-gedoe, sorteert numeriek. Voor weergave: `MAANDEN[index]` lookup.
2. **`rows` als `Record<MaandIndex, ...>` ipv arrays.** Met sparse data (niet elke maand heeft klantstap) zijn objects met expliciete keys helderder. Bij Supabase wordt dit een rij per (journey_id, maand, type).
3. **`activiteiten` als flat list met `laneId + maand`.** Niet genest per lane. Voordelen: filteren is een `.filter()`, dragging tussen cellen is alleen een veld-update, geen tree-restructure. Supabase-mapping triviaal.
4. **`Lane` als data ipv enum.** Zelfs al hebben we 5 default-lanes, ze leven als rijen in `lanes[]`. Een 6e lane toevoegen = `lanes.push({...})`. Geen code-aanpassing.
5. **`MistItem.klantstemId` als losse FK.** Citaten kunnen bij meerdere mist-items of activiteiten horen. Apart houden voorkomt duplicatie en mapt naar een echte FK in Supabase.
6. **`idealeMaand` als optioneel veld op `Activiteit`.** Mismatch is niet een aparte tabel maar een toestand van een activiteit. Selector berekent de mismatch-info on-the-fly.
7. **`Command[]` undo-stack.** Elke mutatie produceert een Command met `apply()`/`revert()`. Bij Supabase later: alleen `apply()` propageert naar de server; `revert()` ook. Optimistic UI = `apply()` direct, server-fout = `revert()` + toast.

---

## 5. State-management

### Aanbeveling: Zustand

**Waarom Zustand boven Redux/Context+useReducer:**

- **Geen provider hell** — store is een hook, geen tree-wrapper. Cruciaal omdat overlays via portals leven (anders zou je provider opnieuw moeten wrappen).
- **Fine-grained subscriptions** via selectors voorkomen re-renders van hele timeline bij één veld-edit. Belangrijk: de tijdlijn heeft ~12 maanden × 5 lanes × ~3 activiteiten = 180+ cellen. Naive context = onbruikbaar.
- **TypeScript-first** met inferentie. Geen action-types boilerplate zoals Redux.
- **Persist-middleware** geeft localStorage gratis — schrijf alleen een serializer.
- **Migratie-vriendelijk:** Zustand-store wisselen voor TanStack Query + mutations bij Supabase is een herschrijving van `store/`, niet van components (zolang components alleen via selectors lezen).

**Alternatief verworpen:** Redux Toolkit is zwaarder, biedt geen substantiële wins voor SPA-scale. Jotai zou werken maar atomic state wordt rommelig bij geneste structuren als Journey. useReducer + Context = re-render-stormen.

### Store-structuur (pseudocode)

```typescript
// store/journeyStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';        // undo/redo middleware

export const useJourneyStore = create<AppState & Actions>()(
  persist(
    temporal(
      (set, get) => ({
        // initial state
        journeys: seedJourneys(),
        activeJourneyId: null,
        selectedActivityId: null,
        overlay: 'none',
        filters: defaultFilters(),

        // actions (alle mutaties via immer-stijl draft of explicit spread)
        addActiviteit: (journeyId, partial) => set(state => ({
          journeys: state.journeys.map(j =>
            j.id === journeyId
              ? { ...j, activiteiten: [...j.activiteiten, makeActiviteit(partial)] }
              : j
          )
        })),
        updateActiviteit: (id, patch) => set(...),
        deleteActiviteit: (id) => set(...),
        moveActiviteit: (id, newLaneId, newMaand) => set(...),
        // structuur-acties
        addLane: (journeyId, lane) => set(...),
        renameLane: (laneId, label) => set(...),
        deleteLane: (laneId) => set(...),  // confirm: activiteiten in deze lane?
        addPhase: (journeyId, phase) => set(...),
        addJourney: (journey) => set(...),
        // overlay-control
        openDetail: (activityId) => set({ selectedActivityId: activityId, overlay: 'detail' }),
        closeOverlay: () => set({ overlay: 'none', selectedActivityId: null }),
      }),
      { limit: 50 }   // undo-buffer
    ),
    {
      name: 'klantreis-vo-store',
      version: 1,
      migrate: (persistedState, version) => migrateState(persistedState, version),
    }
  )
);
```

### Selectors (afgeleide state)

```typescript
// store/selectors.ts

export const selectActiveJourney = (s: AppState) =>
  s.journeys.find(j => j.id === s.activeJourneyId);

export const selectActiviteitenInCel = (laneId: string, maand: MaandIndex) =>
  (s: AppState) => {
    const journey = selectActiveJourney(s);
    if (!journey) return [];
    return journey.activiteiten
      .filter(a => a.laneId === laneId && a.maand === maand)
      .sort((a, b) => a.volgorde - b.volgorde);
  };

export const selectSchaduwkaartenInCel = (laneId: string, maand: MaandIndex) =>
  (s: AppState) => {
    const journey = selectActiveJourney(s);
    if (!journey) return [];
    // Activiteiten die HIER zouden moeten staan (idealeMaand === maand)
    // maar elders staan (maand !== idealeMaand)
    return journey.activiteiten
      .filter(a =>
        a.laneId === laneId &&
        a.idealeMaand === maand &&
        a.maand !== a.idealeMaand
      );
  };

export const selectMismatches = (s: AppState): MismatchInfo[] => {
  const journey = selectActiveJourney(s);
  if (!journey) return [];
  return journey.activiteiten
    .filter(a => a.idealeMaand !== undefined && a.idealeMaand !== a.maand)
    .map(a => ({
      activiteit: a,
      huidigeMaand: a.maand,
      idealeMaand: a.idealeMaand!,
      reden: a.mismatchReden,
      klantstem: a.mismatchReden
        ? journey.klantstemmen.find(k => k.id === a.mismatchReden)
        : undefined,
    }));
};

export const selectAggregaatBlokkers = (s: AppState): AggregaatBlokker[] => {
  // Group all mist-items across activiteiten by categorie
  // Used by AggregaatBlokkersView
};
```

### Re-render-discipline

- Componenten gebruiken `useJourneyStore(selector)` — niet de hele store.
- Voor cel-niveau: `useJourneyStore(selectActiviteitenInCel(laneId, maand), shallow)`.
- `Lane` rendert 12 `ActiviteitCel`-children; alleen cellen waar mutatie plaatsvindt re-renderen.
- Modals zijn portals — open/close re-rendert NIET de timeline.

---

## 6. Data flow

### Lees-pad (rendering)

```
[Component mounts]
    ↓
[useJourneyStore(selector)]
    ↓
[selector leest store-slice]
    ↓
[component rendert met die slice]
    ↓
[bij store-mutatie: selector re-evalueert]
    ↓
[shallow-compare → re-render alleen indien data daadwerkelijk veranderde]
```

### Schrijf-pad (mutatie)

```
[User actie: klik / typ / drag]
    ↓
[Component-handler roept store-action: store.updateActiviteit(id, patch)]
    ↓
[Action wraps mutatie als Command]
    ↓
[Command.apply() — wijzigt store-state]
    ↓
  ├─→ [temporal-middleware pusht Command op undoStack]
  ├─→ [persist-middleware schrijft naar localStorage (debounced)]
  └─→ [selectors re-evalueren → componenten re-renderen]
```

### Mismatch-flow (specifiek)

```
[User opent detail-paneel van activiteit X]
    ↓
[paneel toont veld "ideale maand" als optionele dropdown]
    ↓
[User kiest een andere maand dan activiteit.maand]
    ↓
[updateActiviteit(X.id, { idealeMaand: N, mismatchReden: '...' })]
    ↓
[store-mutatie]
    ↓
[selectSchaduwkaartenInCel(laneX, N) selector → ActiviteitCel rendert nu een Schaduwkaart]
[selectMismatches selector → MismatchPaneel toont X in mismatch-overzicht]
[ActiviteitKaart in originele cel krijgt oranje accent (mismatch-indicator)]
```

### Persistentie-flow

```
[Store-mutatie]
    ↓
[persist-middleware debounce 500ms]
    ↓
[serialize(state) → JSON]
    ↓
[persistenceAdapter.save('klantreis-vo-store', json)]
    ↓
  ├─→ [Deze milestone: localStorage.setItem]
  └─→ [Volgende milestone: Supabase upsert via mutation]
```

---

## 7. Migratiepad naar Next.js + Supabase

### Adapter-interface (deze milestone)

```typescript
// persistence/adapter.ts
export interface PersistenceAdapter {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  subscribe?(callback: (state: AppState) => void): () => void;
  // Volgende milestone: realtime via Supabase channels
}

// persistence/localStorage.ts
export class LocalStorageAdapter implements PersistenceAdapter {
  async load() {
    const raw = localStorage.getItem('klantreis-vo-store');
    return raw ? deserialize(JSON.parse(raw)) : null;
  }
  async save(state: AppState) {
    localStorage.setItem('klantreis-vo-store', JSON.stringify(serialize(state)));
  }
}

// persistence/supabase.ts (stub nu, fully geïmplementeerd volgende milestone)
export class SupabaseAdapter implements PersistenceAdapter {
  constructor(private client: SupabaseClient) {}
  async load() { /* fetch + denormalize naar Journey-aggregate */ }
  async save(state: AppState) { /* split per tabel + upsert */ }
  subscribe(callback) { /* postgres_changes channel */ }
}
```

### Suggested Supabase-schema

Zie ook STACK.md voor stack-keuzes — hier alleen het schema dat 1:1 mapt op het datamodel hierboven.

```sql
-- journeys (1 rij per klantreis, 3 in totaal voor VO)
create table journeys (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('bestaande-klant', 'nieuwe-klant', 'bestuur-stichting')),
  title       text not null,
  subtitle    text,
  volgorde    integer not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- phases
create table phases (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys(id) on delete cascade,
  name        text not null,
  from_maand  smallint not null check (from_maand between 0 and 11),
  to_maand    smallint not null check (to_maand between 0 and 11),
  knelpunten  jsonb default '[]'::jsonb,   -- text[] kan ook
  kansen      jsonb default '[]'::jsonb
);

-- klant_perspectief_rows (denormalized: 1 rij per (journey, maand) met alle 4 velden)
create table klant_perspectief (
  journey_id  uuid references journeys(id) on delete cascade,
  maand       smallint check (maand between 0 and 11),
  klantstap   text,
  kanaal      text,
  emotie      smallint check (emotie between -2 and 2),
  dmu         jsonb,    -- { beslisser: bool, beïnvloeder: bool, gebruiker: bool }
  primary key (journey_id, maand)
);

-- lanes (data-driven; user kan toevoegen)
create table lanes (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys(id) on delete cascade,
  type        text not null,             -- 'marketing' etc. of user-string
  label       text not null,
  volgorde    integer not null,
  kleur       text
);

-- activiteiten
create table activiteiten (
  id                uuid primary key default gen_random_uuid(),
  journey_id        uuid references journeys(id) on delete cascade,
  lane_id           uuid references lanes(id) on delete cascade,
  maand             smallint not null check (maand between 0 and 11),
  ideale_maand      smallint check (ideale_maand between 0 and 11),
  mismatch_reden    text,                -- of klantstem_id
  titel             text not null,
  beschrijving      text,
  doel              text,
  aanpak            text,
  markt             text,
  status            text not null,
  eigenaar          text,
  betrokken         jsonb default '[]',
  dmu               jsonb default '[]',  -- ['beslisser', ...]
  kpi               jsonb default '[]',
  klantverwachting  text,
  opdrachtdocument  jsonb,               -- { status, url }
  volgorde          integer not null default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- mist_items (ontbrekende randvoorwaarden)
create table mist_items (
  id              uuid primary key default gen_random_uuid(),
  activiteit_id   uuid references activiteiten(id) on delete cascade,
  categorie       text not null check (categorie in ('systeem','data','proces','capaciteit')),
  impact          text not null check (impact in ('blokkerend','hinderlijk')),
  wat             text not null,
  klantstem_id    uuid references klantstemmen(id) on delete set null
);

-- klantstemmen
create table klantstemmen (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys(id) on delete cascade,
  citaat      text not null,
  wie         text,
  context     text
);

-- voorstellen
create table voorstellen (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid references phases(id) on delete cascade,
  titel         text not null,
  beschrijving  text,
  type          text check (type in ('knelpunt-oplossing','kans-benutten'))
);

-- data_leveringen (1 rij per maand per journey)
create table data_per_maand (
  journey_id  uuid references journeys(id) on delete cascade,
  maand       smallint check (maand between 0 and 11),
  beschrijving text,
  primary key (journey_id, maand)
);

-- systemen_per_maand
create table systemen_per_maand (
  journey_id  uuid references journeys(id) on delete cascade,
  maand       smallint check (maand between 0 and 11),
  platform    text check (platform in ('lib-vo','woots')),
  primary key (journey_id, maand)
);
```

### Migratie-stappen (toekomstige milestone — referentie)

1. **Schema migreren** via Supabase CLI: `supabase migration new init_klantreis_vo`.
2. **`SupabaseAdapter.save()` implementeren** — split Journey aggregate naar tabellen (transactionele upsert).
3. **`SupabaseAdapter.load()` implementeren** — denormaliseer via JOIN of meerdere queries naar Journey-shape.
4. **Adapter-swap in `KlantreisApp.tsx`** — één regel: `new SupabaseAdapter(...)` ipv `new LocalStorageAdapter()`.
5. **TanStack Query introduceren** voor server-state caching (vervangt persist-middleware).
6. **Mutations optimistic maken** — bestaande Command-pattern is hier al voor ontworpen.
7. **Realtime channels** via `supabase.channel('klantreis').on('postgres_changes', ...)`.
8. **Eenmalige export uit localStorage** — script dat huidige state migreert naar Supabase.

### Wat NIET nu bouwen om migratie soepel te houden

- **Geen Zustand-internals lekken naar components.** Componenten kennen alleen selectors + actions. TanStack Query-mutations krijgen later dezelfde naam.
- **Geen UUID's hard-coden.** Gebruik `nanoid()` of `crypto.randomUUID()` zodat lokaal en Supabase-formaat compatibel zijn.
- **Geen datums als ISO-strings parsen op kritische plekken.** Alleen voor display.
- **Geen circulaire references** tussen `activiteit ↔ mist ↔ klantstem`. Houd FKs door IDs, niet object-refs (anders breken JSON serialization én Supabase-joins).

---

## 8. Architecturale patterns

### Pattern 1: Command-pattern voor reversibele mutaties

**Wat:** Elke schrijfactie wordt een `Command`-object met `apply()` en `revert()`.

**Wanneer:** Voor alle activiteit/lane/fase-mutaties die undo-bar moeten zijn.

**Trade-off:** Iets meer boilerplate per actie, maar undo/redo komt gratis en optimistic UI wordt triviaal. Voor zoiets als emotie-curve-edit (real-time slider) is dit overkill — daar batchen we naar één Command on-mouseup.

```typescript
// store/undo.ts
interface Command {
  type: string;
  apply(state: AppState): AppState;
  revert(state: AppState): AppState;
  label: string;   // Voor "Undo: activiteit toegevoegd" toast
}

const addActiviteitCommand = (a: Activiteit): Command => ({
  type: 'add-activiteit',
  apply: s => ({ ...s, journeys: s.journeys.map(j =>
    j.id === a.journeyId ? { ...j, activiteiten: [...j.activiteiten, a] } : j
  )}),
  revert: s => ({ ...s, journeys: s.journeys.map(j =>
    j.id === a.journeyId ? { ...j, activiteiten: j.activiteiten.filter(x => x.id !== a.id) } : j
  )}),
  label: `Activiteit toegevoegd: ${a.titel}`,
});
```

### Pattern 2: Inline editing — controlled met staging

**Wat:** Velden zijn click-to-edit. Bij click: input verschijnt met huidige waarde als `defaultValue`. Bij blur of Enter: commit naar store. Bij Escape: discard.

**Wanneer:** Voor alle vrije tekst-velden (klantstap, titel, beschrijving, klantcitaat).

**Trade-off:** "Optimistic local editing" — geen flicker, geen wachten op store-roundtrip. Risico: user denkt dat-ie heeft opgeslagen terwijl-ie nog in edit-mode zit. Mitigatie: visuele indicator (cursor + lichte achtergrond) tijdens edit.

```typescript
// components/primitives/InlineEdit.tsx
export function InlineEdit({ value, onCommit, placeholder, multiline }) {
  const [staged, setStaged] = useState(value);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <span onClick={() => { setStaged(value); setEditing(true); }}
            className={value ? '' : 'text-muted'}>
        {value || placeholder}
      </span>
    );
  }

  const commit = () => {
    if (staged !== value) onCommit(staged);   // dispatch alleen bij echte change
    setEditing(false);
  };

  const cancel = () => { setStaged(value); setEditing(false); };

  return multiline ? (
    <textarea
      value={staged}
      onChange={e => setStaged(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && e.metaKey) commit(); }}
      autoFocus
    />
  ) : (
    <input
      value={staged}
      onChange={e => setStaged(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
      autoFocus
    />
  );
}
```

### Pattern 3: Schaduwkaart via data, niet via aparte component-tree

**Wat:** Mismatch is een toestand op `Activiteit` (`idealeMaand !== maand`). De cel-component rendert per cel:
1. `activiteiten` waar `a.maand === cel.maand` (echte kaarten)
2. `schaduwkaarten` waar `a.idealeMaand === cel.maand && a.maand !== cel.maand` (ghost-versies)

**Wanneer:** Altijd voor dit instrument — mismatch is een eerste-klas concept.

**Trade-off:** Twee selectors per cel ipv één. Maar: één bron van waarheid voor de mismatch-status. Geen duplicatie van activiteit-data tussen "echte" en "schaduw"-versie.

```typescript
// components/organisatie-perspectief/ActiviteitCel.tsx
export function ActiviteitCel({ laneId, maand }) {
  const activiteiten = useJourneyStore(selectActiviteitenInCel(laneId, maand), shallow);
  const schaduwkaarten = useJourneyStore(selectSchaduwkaartenInCel(laneId, maand), shallow);

  return (
    <div className="cel">
      {schaduwkaarten.map(a => (
        <ActiviteitKaart key={`schaduw-${a.id}`} activiteit={a} variant="schaduw" />
      ))}
      {activiteiten.map(a => (
        <ActiviteitKaart key={a.id} activiteit={a} variant="normal" />
      ))}
    </div>
  );
}
```

### Pattern 4: Adapter-pattern voor persistentie

**Wat:** UI praat met `PersistenceAdapter`-interface, niet direct met `localStorage` of Supabase-client.

**Wanneer:** Vanaf dag 1 — dit is hét architectuur-vehikel voor de migratie.

**Trade-off:** Extra laag voor wat nu één `localStorage.setItem`-call kan zijn. Maar zonder is een rewrite onvermijdelijk bij Supabase-overstap.

(Zie Sectie 7 voor code.)

### Pattern 5: Domain-laag zonder React

**Wat:** Pure types, validatie-functies en mismatch-detectie in `domain/` zonder React-import.

**Wanneer:** Voor alles dat reusable moet zijn tussen milestones (lokaal → Next.js) en wat unit-testbaar moet zijn zonder DOM.

**Trade-off:** Iets strikter dan "alles in components". Maar test-snelheid (geen JSDOM nodig) en migratie-soepelheid maken het waard.

```typescript
// domain/mismatch.ts — geen React-import
export function detectMismatches(journey: Journey): MismatchInfo[] {
  return journey.activiteiten
    .filter(a => a.idealeMaand !== undefined && a.idealeMaand !== a.maand)
    .map(a => buildMismatchInfo(a, journey));
}

// domain/validatie.ts
export function validateKlantstap(text: string): { valid: boolean; reden?: string } {
  if (!text.trim()) return { valid: false, reden: 'Klantstap mag niet leeg zijn' };
  if (!/^Ik\b/i.test(text.trim())) {
    return { valid: false, reden: 'Klantstap moet beginnen met "Ik" (eerste persoon)' };
  }
  return { valid: true };
}
```

---

## 9. Build-volgorde met afhankelijkheden

**Principe:** Bouw van binnen naar buiten — eerst types, dan store, dan UI-skelet, dan features.

### Fase A — Fundering (geen UI)

1. **Domain types** (`domain/types.ts`) — alle interfaces uit Sectie 4. Geen afhankelijkheden.
2. **Constants** (`domain/constants.ts`) — `MAANDEN`, `DMU_ROLLEN`, `MIST_CATEGORIEËN`. Geen afhankelijkheden.
3. **Seed-data** (`domain/seed.ts`) — 3 lege Journeys met fases en lanes maar zonder Cito-content. Hangt af van 1-2.
4. **Validatie + mismatch** (`domain/validatie.ts`, `domain/mismatch.ts`) — pure functies. Unit-testbaar voor de UI bestaat.

### Fase B — State

5. **Persistence-adapter interface + LocalStorageAdapter** (`persistence/`). Hangt af van Fase A.
6. **Store met basis-state** (`store/journeyStore.ts`) — `journeys`, `activeJourneyId`, `selectedActivityId`. Zustand setup + persist-middleware. Hangt af van 3+5.
7. **Selectors** (`store/selectors.ts`) — `selectActiveJourney`, `selectActiviteitenInCel`, `selectMismatches`. Hangt af van 6.
8. **Actions: CRUD voor activiteiten** (`store/actions/activiteit.ts`). Hangt af van 6.
9. **Undo-middleware (Command-pattern)** (`store/undoMiddleware.ts`). Hangt af van 8.

### Fase C — UI-skelet (read-only)

10. **Designtokens + global styles** (`styles/tokens.css`, `globals.css`). Inter + Source Serif laden, 4-kleuren-paletvars.
11. **Primitives**: `InlineEdit`, `KlantCitaat`, `KleurAccent`, `Knop`. Geen store-koppeling.
12. **KlantreisApp + JourneyTabs** — root-mount, store-init, tab-switching. Read-only.
13. **TimelineHeader** — 12 maandkolommen + fase-banners. Read-only uit store.
14. **Klantperspectief-rijen** (`KlantstapRij`, `DMURij`, `KanaalRij`, `EmotieRij`). Read-only.
15. **Organisatieperspectief: `Lane` + `ActiviteitCel` + `ActiviteitKaart`** (read-only, geen detail-paneel).
16. **`DataRij` + `SystemenRij`**.

**Checkpoint:** Na 16 staat het volledige visuele frame met seed-data. MT kan al "kijken hoe een lege reis eruit ziet" zonder edit-capaciteit.

### Fase D — Editing

17. **InlineEdit toepassen op alle vrije tekst-velden** in rijen 14 + 16.
18. **ActiviteitDetailPaneel** (portal-modal) — toont alle velden, koppelt aan `updateActiviteit`-action.
19. **Activiteit toevoegen** — "+"-knop in `ActiviteitCel` → opent leeg detail-paneel.
20. **Activiteit verwijderen** — knop in detail-paneel + confirm-dialog.
21. **Drag-and-drop activiteiten tussen cellen** (optioneel deze milestone — kan ook via dropdown "verplaats naar").

### Fase E — Mismatch + Aggregaat

22. **Mismatch-UI**: `idealeMaand` + `mismatchReden`-velden in detail-paneel.
23. **Schaduwkaart-rendering** in `ActiviteitCel` (via `selectSchaduwkaartenInCel`).
24. **MismatchPaneel** binnen detail-paneel: klantstem-koppeling.
25. **AggregaatBlokkersView** (modal) — alle mist-items gegroepeerd per categorie.

### Fase F — Structuur-flexibiliteit

26. **StructuurEditor-modal** — lanes toevoegen/hernoemen/verwijderen, fases idem, klantreizen idem.
27. **Cascade-validatie** bij verwijderen: "Lane X bevat 3 activiteiten — alles verwijderen?"

### Fase G — Polish

28. **Filters** (`JourneyToolbar`): afdeling, status, alleen-met-blokker.
29. **Knelpunten/kansen toggles** per fase in `TimelineHeader`.
30. **Undo-bar UI** (toast bij elke mutatie met "Ongedaan maken").
31. **JSON-export/import** (voor handmatige backup pre-Supabase).

### Build-afhankelijkheden visueel

```
Fase A (domain)
    ↓
Fase B (state)
    ↓
Fase C (UI-skelet, read-only)  ← demo-baar checkpoint
    ↓
Fase D (editing)
    ↓
Fase E (mismatch)  ← kern-feature compleet
    ↓
Fase F (structuur)  ← MT-flexibiliteit klaar
    ↓
Fase G (polish)
```

**Kritieke pad:** A → B → C → D → E. Fase F kan parallel met E indien capaciteit; G is altijd laatste.

---

## 10. Inline editing-patroon (detail)

### Beslissing: controlled met local staging

- **Niet uncontrolled** (`defaultValue` + `ref`) — verlies data-flow inzicht en bemoeilijkt undo.
- **Niet pure controlled** (elke keypress → store) — veroorzaakt re-renders van veel componenten per toets, plus undo-stack vervuilt met ~30 commands per zin.
- **Wel:** lokale `useState` voor de in-progress waarde, commit naar store bij blur of Enter. Eén Command per "bewerking", niet per toetsaanslag.

### Optimistic UI

In deze milestone: alle mutaties zijn synchroon (localStorage), dus "optimistic" is automatisch. Voorbereiding voor Supabase:

- Command-pattern is al designed met `apply()`/`revert()`.
- Bij Supabase: `apply()` direct → store muteert → UI update. Async server-call op achtergrond. Bij fout: `revert()` + error-toast.
- Conflict (twee users editen tegelijk): later milestone, gebruik `updated_at` + last-write-wins of CRDT — beslissing uitstellen.

### Undo-discipline

- Undo-buffer: 50 commands. Vergeet ouderen.
- Een "edit" = van focus tot blur, niet per keystroke. Implementatie via batchen in `InlineEdit`.
- Visuele undo: na elke commit een korte toast "Activiteit bijgewerkt. Ongedaan maken? (⌘Z)" — 4 seconden.
- Keyboard: ⌘Z / Ctrl+Z = undo, ⌘⇧Z / Ctrl+Y = redo.
- Discard-paths (Escape in InlineEdit) genereren géén Command — er was nog niets gecommit.

---

## 11. Mismatch-mechanisme (waar zit de logica?)

### Drie-laagse architectuur voor mismatch

**Laag 1 — Data (`domain/`):** `Activiteit.idealeMaand` is een optioneel veld. Aanwezig = mismatch bestaat.

**Laag 2 — Selectors (`store/selectors.ts`):**
- `selectMismatches(state)` — alle mismatches in actieve reis.
- `selectSchaduwkaartenInCel(laneId, maand)` — schaduwkaarten die in déze cel horen.
- `selectActiviteitenInCel(laneId, maand)` — echte kaarten in déze cel.

**Laag 3 — Rendering:**
- `ActiviteitCel` rendert beide lijsten; `Schaduwkaart` heeft eigen variant (gestippelde rand, transparant, mismatch-oranje accent).
- `ActiviteitKaart` met `variant="normal"` waar `idealeMaand !== maand` krijgt een mismatch-indicator (oranje stip in hoek).
- `MismatchPaneel` toont in detail-paneel: "Deze activiteit staat in maart maar zou in november moeten plaatsvinden. *'Wij willen verlengingsoffertes vóór de schooljaarplanning'* — toetscoördinator HAVO."

### Beslis-logica voor mismatch (waar)

- **Detect:** in `domain/mismatch.ts` (pure functie, unit-testbaar).
- **Display-koppeling klantstem:** selector in `store/selectors.ts`, join op `klantstemmen[]`.
- **Edit:** in `ActiviteitDetailPaneel` — dropdown "ideale maand" + textarea/select-klantstem voor `mismatchReden`.

### Anti-patroon: dubbele Activiteit-records

❌ Niet doen: aparte "schaduw-activiteiten" als records.
✅ Wel doen: één Activiteit-record met `maand` (echt) + `idealeMaand` (gewenst). Selectors verzorgen de twee render-paden.

Dit voorkomt:
- Synchronisatie-bugs bij edits (welke versie is canon?).
- Duplicatie in Supabase later.
- Stale schaduwen bij undo van een move.

---

## 12. Testing-strategie

### Drielagig: unit / component / e2e

| Laag | Tool | Wat | Wanneer |
|------|------|-----|---------|
| Unit | Vitest | `domain/` functies, store-actions, selectors | Vanaf Fase A — TDD voor pure functies |
| Component | Vitest + Testing Library | Individuele componenten met store-mock | Vanaf Fase C — per non-trivial component |
| E2E | Playwright | Happy-paths door hele UI | Vanaf Fase D — alleen kritieke flows |

### Wat te testen waar

**Unit (`tests/unit/`):**
- `validateKlantstap("De klant doet X")` → invalid (geen 1e persoon).
- `validateKlantstap("Ik doe X")` → valid.
- `detectMismatches(journey)` → lijst klopt bij verschillende journey-shapes.
- `selectSchaduwkaartenInCel(laneA, 3)` → bevat activiteit met `idealeMaand=3, maand=7`.
- Store-actions: `addActiviteit` mutateert correct, `Command.revert()` reverteert exact.

**Component (`tests/component/`):**
- `InlineEdit`: typen + Enter committeert; Escape discardt; blur committeert; geen commit bij identieke waarde.
- `ActiviteitCel`: rendert correct aantal echte vs schaduwkaarten op basis van store-state.
- `ActiviteitDetailPaneel`: opent/sluit, alle velden editable, mist-toevoegen werkt.
- `DMURij`: rendert ALTIJD in volgorde beslisser → beïnvloeder → gebruiker (invariant uit CLAUDE.md).
- `KlantCitaat`: rendert in Source Serif 4 italic (snapshot of style-assertion).

**E2E (`tests/e2e/`):**
- Happy-path 1: open app → tab switchen tussen 3 reizen → klik activiteit → detail-paneel opent.
- Happy-path 2: voeg activiteit toe → typ titel → close → verschijnt in cel.
- Happy-path 3: zet `idealeMaand` op activiteit → schaduwkaart verschijnt in juiste cel.
- Happy-path 4: voeg lane toe via StructuurEditor → nieuwe lege lane verschijnt.
- Happy-path 5: open AggregaatBlokkersView → alle mist-items zichtbaar gegroepeerd.

**Niet testen (bewust):**
- localStorage-persistentie zelf (browser-API, vertrouwen we).
- Tailwind/CSS rendering (visual regression hoort bij Chromatic of Percy, overkill nu).
- Cross-browser (Playwright runt Chromium, dat is genoeg voor MT-demo).

### Test-piramide-ratio voor dit project

- ~60% unit (snel, domain is rijk)
- ~30% component (UI heeft veel interactie-logica)
- ~10% e2e (alleen kritieke paden — duur om te onderhouden)

### Setup-snippets

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',           // voor component-tests
    setupFiles: ['./tests/setup.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});

// tests/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);

// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'pnpm dev', port: 5173 },
});
```

---

## 13. Scaling considerations

| Schaal | Architectuur-aanpassingen |
|--------|--------------------------|
| 1 user (deze milestone) | localStorage volstaat. Geen sync, geen conflicts. |
| ≤10 users (MT-pilot, volgende milestone) | Supabase + naïef last-write-wins. Polling of basale realtime channel volstaat. |
| 10–100 users (Cito-breed) | Optimistic UI verplicht. Conflict-detectie via `updated_at`. Eventueel field-level locking voor activiteit-edits. |
| 100+ users | Niet realistisch voor dit instrument — MT-tool, geen end-user-app. |

### Wat breekt eerst

1. **Schaal-bottleneck 1 — render-performance bij veel activiteiten.** 60 lanes × 12 maanden × 5 activiteiten = 3600 nodes. Mitigatie: virtualisatie via `react-window` voor lanes als > 20, of CSS `content-visibility: auto`. Pas relevant ver na MT-pilot.
2. **Schaal-bottleneck 2 — bundle-size.** Inter + Source Serif + Tailwind CDN groot. Mitigatie: zelf-hosten via Next.js (`next/font`), Tailwind JIT in build (geen CDN).
3. **Schaal-bottleneck 3 — concurrency in Supabase.** Twee users editen zelfde activiteit. Mitigatie: optimistic concurrency token (`if-match: updated_at`).

---

## 14. Anti-patterns

### Anti-pattern 1: Tweedeling als data-veld op elke rij

❌ **Wat mensen doen:** `position: 'klant' | 'organisatie'` op elke entry — denken: "dan kunnen we alles uniform renderen."

❌ **Waarom fout:** Mengt twee verschillende dataconcepten in één bag. Klantstap heeft andere velden dan een activiteit. Generieke renderlogica wordt instable. Bovendien: tweedeling is een UI-contract, niet een data-eigenschap.

✅ **In plaats van:** `rows` (klantstap/dmu/kanaal/emotie) en `activiteiten[]` zijn aparte velden op `Journey`. Tweedeling = welk component je gebruikt om ze te renderen.

### Anti-pattern 2: Hard-coded 5 lanes

❌ **Wat mensen doen:** `const LANES = ['marketing','sales','pm','toetstekunde','cs']` en overal switch-statements op die strings.

❌ **Waarom fout:** Direct conflict met de scope: "lanes toevoegen/verwijderen zonder code-aanpassing." Wordt een refactor-bom zodra MT vraagt om een 6e lane.

✅ **In plaats van:** `lanes: Lane[]` op Journey. Default seed met 5 lanes, maar volledig data-driven.

### Anti-pattern 3: Schaduwkaart als duplicate Activiteit-record

❌ **Wat mensen doen:** Bij mismatch een tweede Activiteit aanmaken met `type: 'schaduw'` en een `parent_id`.

❌ **Waarom fout:** Sync-bugs (welke van de twee is canon bij edit?), duplicatie in Supabase, complexe cascade bij delete.

✅ **In plaats van:** Eén Activiteit met `idealeMaand`. Schaduwkaart = renderkeuze in `ActiviteitCel`.

### Anti-pattern 4: Inline edit via `contentEditable`

❌ **Wat mensen doen:** `<div contentEditable>{value}</div>` voor inline editing.

❌ **Waarom fout:** Onhandelbaar bij undo, copy-paste van rich text geeft HTML-injectie, geen controlled input. Lijkt elegant, wordt drama.

✅ **In plaats van:** `<input>` / `<textarea>` met `useState`-staging (zie Pattern 2).

### Anti-pattern 5: Store-mutaties vanuit useEffect

❌ **Wat mensen doen:** `useEffect(() => { if (x) store.update(y); }, [x])` voor afgeleide state.

❌ **Waarom fout:** Render-loops, dubbele updates, race-conditions bij Strict Mode. Plus: het is geen afgeleide state — het is gewoon een selector.

✅ **In plaats van:** Selectors voor afgeleide data; event-handlers voor mutaties; `useEffect` alleen voor pure side-effects (focus, scroll-into-view).

### Anti-pattern 6: Modal-state in URL bij SPA zonder routing

❌ **Wat mensen doen:** `?detail=activiteit-123` als modal-state, zonder Next.js router.

❌ **Waarom fout:** Werkt in dev maar bij refresh (deze milestone heeft geen server) verliest user state. Plus: voegt complexiteit toe zonder waarde — geen deep-links nodig voor MT-demo.

✅ **In plaats van:** Modal-state in store (`overlay`, `selectedActivityId`). URL pas relevant in Next.js-milestone.

### Anti-pattern 7: Mengen van Tailwind-classes en CSS-modules voor 4-kleuren-paletvoorschrift

❌ **Wat mensen doen:** Soms `text-orange-500`, soms `text-mismatch`, soms `className={mismatch ? '...' : '...'}`.

❌ **Waarom fout:** De editorial designtaal staat of valt bij consistentie. Random Tailwind-kleuren = bandbreedte-creep. Volgende week zit er rood ergens dat niet "blokkerend" betekent.

✅ **In plaats van:** CSS-vars `--cito-blauw`, `--mismatch-oranje`, `--blokker-rood` op één plek. Componenten gebruiken alléén tokens. `KleurAccent`-primitive forceert dit via prop `intent: 'accent' | 'mismatch' | 'blokker'`.

### Anti-pattern 8: ActiviteitDetailPaneel als child van ActiviteitCel

❌ **Wat mensen doen:** Detail-paneel als `<Modal>` binnen elke `ActiviteitKaart`-render.

❌ **Waarom fout:** Per cel duplicate modal-instances. Re-renders van de timeline triggeren modal-recreates. Scroll-position lost, focus-traps breken.

✅ **In plaats van:** Eén `ActiviteitDetailPaneel` op KlantreisApp-niveau. Opent via store (`selectedActivityId`). Rendert via `createPortal` op `document.body`.

---

## 15. Integratiepunten

### Externe services

| Service | Integratie-patroon | Wanneer | Gotchas |
|---------|-------------------|---------|---------|
| localStorage | Direct via `LocalStorageAdapter` | Deze milestone | Quota ~5MB — ruim voor 3 reizen × paar honderd activiteiten |
| Supabase (PostgREST) | Via `SupabaseAdapter` + TanStack Query | Volgende milestone | RLS configureren ZELFS al is auth out-of-scope — anders is alles publiek read+write |
| Supabase Realtime | `supabase.channel().on('postgres_changes')` | Latere milestone (multi-user) | Conflicten + ordering nog onbeslist |
| Inter / Source Serif 4 | `next/font` zelf-hosten | Deze milestone via CDN, Next-milestone self-hosted | CDN-version pinnen om FOUT bij version-bumps te vermijden |

### Interne grenzen

| Grens | Communicatie | Notities |
|-------|--------------|----------|
| Component ↔ Store | Hooks (`useJourneyStore(selector)`) + actions | Componenten kennen geen store-internals |
| Store ↔ Persistence | Adapter-interface | Adapter zelf is async — store-write is sync |
| Domain ↔ Store | Domain biedt pure functies; store consumeert | Geen omgekeerde dependency — domain weet niets van store |
| Components ↔ Components | Props (parent → child); store voor distant communicatie | Geen prop-drilling > 2 levels |
| Overlay ↔ Timeline | Beide lezen store, geen directe coupling | Portal-rendering voorkomt timeline-rerenders bij overlay-toggle |

---

## 16. Open beslissingen voor volgende milestone

Deze beslissingen blijven nu open omdat ze relevant worden bij Supabase-overstap:

- **Conflict-resolutie** bij multi-user editing: last-write-wins vs CRDT vs field-locking.
- **Wijzigingshistorie**: aparte audit-table vs Postgres temporal extension.
- **Auth-koppeling Cito-SSO**: SAML, OIDC, of magic-link initieel.
- **Realtime granulariteit**: per-record subscriptions vs journey-level subscription.
- **Migratie-tooling**: Supabase CLI migrations vs handgeschreven SQL files.

Deze hoeven nu niet beslist — als de architectuur hier voldoet aan de invarianten (adapter-pattern, command-pattern, domain-isolatie), is geen van deze beslissingen blokkerend voor de huidige bouw.

---

## Sources

- **React docs** — component-architectuur, portals, hooks-best-practices. [react.dev](https://react.dev)
- **Zustand docs** — store-patterns, selectors, middleware. [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)
- **zundo** (Zustand undo middleware). [github.com/charkour/zundo](https://github.com/charkour/zundo)
- **Supabase docs** — Postgres schema, RLS, realtime. [supabase.com/docs](https://supabase.com/docs)
- **Customer Journey Mapping (Nielsen Norman Group)** — CJM-componenten en boven/onder-de-lijn-discipline.
- **Service Blueprint (This is Service Design Thinking)** — backstage/frontstage onderverdeling, swim-lanes per afdeling.
- **3sides klantreis-toolkit** — methodologie referentie uit Project_Klantreis_VO.md.
- **CLAUDE.md** — harde regels voor klantstap-vorm (1e persoon), DMU-volgorde, kleurregels, platformnamen.
- **Project_Klantreis_VO.md** — scope en functionaliteit op hoofdlijnen.
- **PROJECT.md** — Active/Out-of-Scope/Constraints van deze milestone.

---

*Architecture research voor: interactief klantreis-visualisatie-instrument (Cito VO)*
*Onderzocht: 2026-05-14*
*Volgende milestone: Next.js + Supabase — migratiepad in Sectie 7*
