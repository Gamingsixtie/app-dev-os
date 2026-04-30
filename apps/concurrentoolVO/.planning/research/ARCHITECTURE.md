# Architecture Research: v2.0 Sales Intelligence Integration

**Domain:** Sales intelligence features integrating into existing React price comparison SPA
**Researched:** 2026-03-21
**Confidence:** HIGH (based on direct codebase analysis, not external research)

## Current Architecture Snapshot

The v1.0 app is a stateless, client-side SPA with this shape:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Wizard   │  │ Intake   │  │ Compare  │  │ Migration│       │
│  │ (5 steps)│  │ Panel    │  │ Pages    │  │ Page     │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
├───────┴──────────────┴──────────────┴──────────────┴────────────┤
│                      View Router (useState in App.tsx)           │
├─────────────────────────────────────────────────────────────────┤
│                      State Layer (Zustand + persist)            │
│  ┌───────────────────────┐  ┌────────────────────────────┐     │
│  │ useSchoolProfileStore │  │ usePriceComparisonStore    │     │
│  │ wizard inputs, levels,│  │ results, overrides,        │     │
│  │ modules, moduleSetups │  │ migration settings         │     │
│  └───────────┬───────────┘  └──────────┬─────────────────┘     │
├──────────────┴──────────────────────────┴───────────────────────┤
│                      Engine Layer (pure functions)               │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐        │
│  │ price-       │  │ current-vs-    │  │ migration.ts │        │
│  │ comparison.ts│  │ proposed.ts    │  │              │        │
│  └──────────────┘  └────────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer (static imports)                │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐     │
│  │ default- │  │ cito-    │  │ jij-license│  │ differ-  │     │
│  │ prices.ts│  │ migration│  │ -tiers.ts  │  │ entiators│     │
│  └──────────┘  └──────────┘  └────────────┘  └──────────┘     │
├─────────────────────────────────────────────────────────────────┤
│                      External: Anthropic API (intake only)      │
│  ┌────────────────────────────────────────┐                     │
│  │ Claude Haiku 4.5 — structured output   │                     │
│  └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### What Currently Exists (Inventory)

| Layer | Component | File(s) | Status |
|-------|-----------|---------|--------|
| **Router** | View state | `App.tsx` — `useState<View>` | Working, 5 views |
| **Store** | School profile | `features/school-profile/store.ts` | Working, persist to `rekentool-school-profile` |
| **Store** | Price comparison | `features/price-comparison/store.ts` | Working, persist to `rekentool-price-comparison` |
| **Engine** | Market comparison | `engine/price-comparison.ts` | Pure, tested |
| **Engine** | Current vs proposed | `engine/current-vs-proposed.ts` | Pure, tested |
| **Engine** | Migration | `engine/migration.ts` | Pure, tested |
| **Data** | Prices | `data/default-prices.ts` | 15 PriceRecord entries, static |
| **Data** | Modules | `models/modules.ts` | 6 modules, 2 categories |
| **AI** | Intake extraction | `lib/ai-intake.ts` | Single-shot extraction |
| **UI** | Wizard | 5 steps + shell | Working |
| **UI** | Intake panel | `features/intake/IntakePanel.tsx` | Working, basic |
| **UI** | Comparison pages | 3 page components | Working |

### Key Architectural Properties

1. **Single-school assumption.** Both stores hold data for exactly one school. There is no school ID, no list, no switching.
2. **Static prices.** `DEFAULT_PRICES` is a build-time constant. The override system (`draftOverrides` / `appliedOverrides`) patches at runtime but does not persist separately from the calculation store.
3. **View routing is flat.** `useState<View>` in `App.tsx` — no URL routing, no history, no nested views.
4. **Cross-store coupling.** `usePriceComparisonStore` reads from `useSchoolProfileStore` via `getState()` — a deliberate choice to avoid stale closures, but it creates an implicit dependency.
5. **AI intake is fire-and-forget.** One text input, one API call, one structured output. No conversation history, no iterative refinement.

---

## v2.0 Integration Architecture

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      View Layer                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │SchoolList│ │SchoolDtl │ │Wizard    │ │Compare   │          │
│  │  (NEW)   │ │  (NEW)   │ │(exists)  │ │(exists)  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Intake    │ │Export    │ │Price     │ │Migration │          │
│  │Enhanced  │ │Preview   │ │Admin     │ │(exists)  │          │
│  │(MODIFY)  │ │  (NEW)   │ │  (NEW)   │ │          │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
├───────┴──────────────┴──────────┴──────────────┴────────────────┤
│               Router (upgrade to state machine or TanStack)     │
├─────────────────────────────────────────────────────────────────┤
│                      State Layer                                 │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │useSchoolDB  │ │usePriceComp  │ │useExport     │            │
│  │  (NEW)      │ │  (MODIFY)    │ │Store (NEW)   │            │
│  │multi-school │ │school-scoped │ │DMU config    │            │
│  │persistence  │ │calculations  │ │render state  │            │
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘            │
│  ┌─────────────┐ ┌──────────────┐                              │
│  │useSchool    │ │usePriceData  │                              │
│  │Profile      │ │Store (NEW)   │                              │
│  │(MODIFY)     │ │mutable prices│                              │
│  │+schoolId    │ │+verification │                              │
│  └──────┬──────┘ └──────┬───────┘                              │
├─────────┴───────────────┴───────────────────────────────────────┤
│                      Engine Layer (pure functions — KEEP)        │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐        │
│  │ price-       │  │ current-vs-    │  │ migration.ts │        │
│  │ comparison.ts│  │ proposed.ts    │  │              │        │
│  └──────────────┘  └────────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌────────────────┐                           │
│  │ export-      │  │ intake-        │                           │
│  │ renderer.ts  │  │ pipeline.ts    │                           │
│  │ (NEW)        │  │ (NEW)          │                           │
│  └──────────────┘  └────────────────┘                           │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐                    │
│  │ default- │  │ school   │  │ price      │                    │
│  │ prices.ts│  │ profiles │  │ updates    │                    │
│  │ (static) │  │ (indexed │  │ (indexed   │                    │
│  │          │  │  DB/NEW) │  │  DB/NEW)   │                    │
│  └──────────┘  └──────────┘  └────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                      External Services                           │
│  ┌────────────────┐  ┌──────────────────┐                       │
│  │ Claude Haiku   │  │ Browser print /  │                       │
│  │ 4.5 (enhanced) │  │ html2canvas+     │                       │
│  │                │  │ jsPDF            │                       │
│  └────────────────┘  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points: What Changes, What Stays, What's New

### 1. Multi-School Persistence (BIGGEST architectural change)

**Current state:** One school in `useSchoolProfileStore` + localStorage. Opening a new school overwrites the old one.

**Required change:** The app needs to manage multiple school profiles with independent calculation results.

**Recommended approach: IndexedDB via Dexie.js**

localStorage is a poor fit for structured multi-record data. Dexie.js wraps IndexedDB with a clean, typed API that works well with Zustand.

```
┌─────────────────────────────────────────────────────┐
│ Dexie Database: "rekentool-db"                      │
│                                                      │
│ schools                                              │
│   id: string (uuid)                                  │
│   name: string                                       │
│   createdAt: Date                                    │
│   updatedAt: Date                                    │
│   profile: SchoolProfile (levels, counts, modules)   │
│   moduleSetups: ModuleCurrentSetup[]                 │
│   scenario: Scenario                                 │
│   notes: string[]                                    │
│   tags: string[]                                     │
│                                                      │
│ priceOverrides                                       │
│   id: string                                         │
│   schoolId: string (index)                           │
│   moduleId: string                                   │
│   provider: string                                   │
│   amount: number                                     │
│   source: 'intake' | 'manual' | 'document'          │
│   verifiedAt: Date                                   │
│                                                      │
│ conversations                                        │
│   id: string                                         │
│   schoolId: string (index)                           │
│   rawNotes: string                                   │
│   extraction: IntakeExtraction                       │
│   createdAt: Date                                    │
│                                                      │
│ priceUpdates (global, not per-school)                │
│   id: string                                         │
│   moduleId: string                                   │
│   provider: string                                   │
│   amount: number                                     │
│   source: PriceSource                                │
│   sourceLabel: string                                │
│   verifiedAt: Date                                   │
│   status: 'pending' | 'verified' | 'rejected'       │
└─────────────────────────────────────────────────────┘
```

**Impact on existing stores:**

| Store | Change | Details |
|-------|--------|---------|
| `useSchoolProfileStore` | MODIFY | Add `schoolId` field. Load/save via Dexie instead of Zustand persist. Keep Zustand for in-memory reactive state, but sync to/from DB on school switch. |
| `usePriceComparisonStore` | MODIFY | Make `initialize()` and `recalculate()` school-aware. Results become per-school (cached in DB). |
| `useSchoolDBStore` (NEW) | CREATE | Manages school list: CRUD, search, current active school ID. Thin Zustand store that orchestrates Dexie reads/writes. |
| `usePriceDataStore` (NEW) | CREATE | Global mutable price database. Starts from `DEFAULT_PRICES`, augmented by price updates. Replaces the static import in `usePriceComparisonStore.initialize()`. |
| `useExportStore` (NEW) | CREATE | DMU target, export format, render state for export preview. |

**Migration from v1:** On first load, check if `rekentool-school-profile` exists in localStorage. If so, create one school record in Dexie and clear localStorage. One-time, transparent.

### 2. Enhanced AI Intake (MODIFY existing)

**Current state:** `lib/ai-intake.ts` does a single extraction: notes in, structured `IntakeExtraction` out. No conversation history, no price capture, no deal context.

**What changes:**

The extraction schema needs to expand, and the intake flow needs to support iterative refinement (add more notes, re-extract, merge).

```typescript
// Enhanced extraction schema additions
const EnhancedIntakeSchema = IntakeExtractionSchema.extend({
  // Price intelligence captured from conversation
  pricesMentioned: z.array(z.object({
    moduleId: z.enum(MODULE_IDS).nullable(),
    provider: z.string(),
    amount: z.number(),
    unit: z.enum(['per-student', 'total-year', 'unknown']),
    confidence: z.enum(['explicit', 'inferred']),
    context: z.string(), // "school betaalt nu..."
  })),

  // Deal context
  dealContext: z.object({
    currentContractEnd: z.string().nullable(),
    decisionTimeline: z.string().nullable(),
    keyStakeholders: z.array(z.string()),
    objections: z.array(z.string()),
    positiveSignals: z.array(z.string()),
  }).nullable(),

  // Conversation metadata
  conversationType: z.enum(['phone', 'meeting', 'email', 'other']),
});
```

**Integration with multi-school:**
- Intake creates or updates a school profile, not just fills the wizard
- Each intake becomes a `conversations` record linked to schoolId
- Price mentions flow into `priceOverrides` with source='intake'

**Files affected:**
- `lib/ai-intake.ts` — Expand schema, add multi-turn context
- `features/intake/IntakePanel.tsx` — School selector, conversation history sidebar, richer preview
- System prompt in `ai-intake.ts` — Expand to capture prices and deal context

**Files NOT affected:**
- Engine files — They receive prices as input, do not care about source
- Wizard steps — Continue to work as-is for manual input

### 3. DMU-Targeted Export (NEW feature)

**Current state:** No export functionality exists. Results are screen-only.

**Architecture for export:**

```
[User selects DMU target] → [ExportStore] → [ExportRenderer engine]
                                                     │
                            ┌────────────────────────┤
                            ↓                        ↓
                    [Screen preview]          [PDF generation]
                    (React component)         (html2canvas + jsPDF
                                               OR @react-pdf/renderer)
```

**Three DMU perspectives on the same data:**

| DMU | Content Focus | Visual Focus |
|-----|---------------|--------------|
| Coordinator | Module-level detail, feature comparison, remediering | Detailed tables, differentiators |
| MT (Rector) | Executive summary, total costs, strategic value | Summary cards, one-page overview |
| Finance | Per-student costs, multi-year projection, ROI | Cost tables, trend charts, disclaimers |

**Recommended approach: @react-pdf/renderer**

Use `@react-pdf/renderer` because:
- React components define the PDF layout (matches existing skill set)
- Works client-side (no backend needed)
- Supports Cito brand colors, custom fonts
- Better control over print layout than html2canvas screenshots

**New files:**

```
src/
  features/export/
    ExportPreviewPage.tsx      # Screen preview of what will be exported
    DMUSelector.tsx            # Pick target audience
    store.ts                   # Export configuration state
    templates/
      coordinator.tsx          # PDF template: coordinator perspective
      mt.tsx                   # PDF template: MT perspective
      finance.tsx              # PDF template: finance perspective
    components/
      PDFHeader.tsx            # Reusable Cito-branded header
      CostSummaryTable.tsx     # Shared cost table for PDF
      DisclaimerBlock.tsx      # Price source disclaimers
  engine/
    export-renderer.ts         # Pure function: data → export-ready structure
```

**Data flow:** Engine results (already calculated) → `export-renderer.ts` transforms for DMU perspective → React PDF component renders → Download or print.

### 4. Price Intelligence Pipeline (NEW feature)

**Current state:** Prices are hardcoded in `data/default-prices.ts`. The override system in `usePriceComparisonStore` is per-session (persisted, but not a proper price database).

**What changes:**

Prices become a mutable data layer that can be updated from three sources:

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ AI Intake      │  │ Document       │  │ Manual         │
│ (conversation) │  │ (price list    │  │ (admin UI)     │
│                │  │  upload/paste) │  │                │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────────┐
│              Price Update Queue                          │
│  status: pending | verified | rejected                  │
│  Each update has: source, amount, confidence, date      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Verification Workflow                        │
│  Auto-verify: publication prices from known sources     │
│  Manual verify: AI-extracted or document-parsed prices  │
│  Consultant reviews pending → verify or reject          │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Active Price Database (Dexie)               │
│  Engines read from this instead of DEFAULT_PRICES       │
│  DEFAULT_PRICES remains as fallback / seed data         │
└─────────────────────────────────────────────────────────┘
```

**New files:**

```
src/
  features/price-admin/
    PriceAdminPage.tsx         # View/edit all prices, see staleness
    PriceUpdateQueue.tsx       # Review pending price updates
    store.ts                   # usePriceDataStore
  lib/
    price-pipeline.ts          # Parse price documents, create update records
```

**Key design decision:** `DEFAULT_PRICES` stays as the seed/fallback. The `usePriceDataStore` loads defaults, then overlays any verified updates from IndexedDB. This means the engines do not change — they still receive `PriceRecord[]` as input. The store layer handles the merge.

### 5. View Management (MODIFY App.tsx)

**Current state:** `useState<View>` with 5 views. No URL routing, no back button support, no nested views.

**Problem:** v2.0 needs ~10 views. `useState` becomes unwieldy, and lack of URL routing means users cannot bookmark or share school profiles.

**Recommended approach: Keep it simple — expand the state machine, do NOT add a router library.**

Rationale:
- This is an internal tool, not a public website. URLs are not user-facing.
- No SEO needed.
- Adding React Router or TanStack Router for an internal tool adds complexity without proportional value.
- A well-structured state machine (or just a larger union type) handles this fine.

```typescript
type View =
  // Existing
  | 'wizard'
  | 'intake'
  | 'comparison'
  | 'current-vs-proposed'
  | 'migration'
  // New
  | 'school-list'        // Dashboard: all schools
  | 'school-detail'      // Single school overview (history, notes, last calc)
  | 'export-preview'     // DMU export configuration + preview
  | 'price-admin'        // Global price management
  ;
```

**Navigation structure:**

```
school-list ──→ school-detail ──→ wizard ──→ comparison / current-vs-proposed / migration
                     │                              │
                     │                              ↓
                     ├──→ intake ──────────────→ wizard (pre-filled)
                     │
                     └──→ export-preview ──→ (download PDF)

price-admin (accessible from any view via nav)
```

**Impact on App.tsx:**
- Replace inline `if (view === '...')` chain with a `switch` or view map
- Add a navigation context or simple `viewHistory` stack for back-button behavior
- Add a persistent top nav bar with school name + quick actions

```typescript
// Simple navigation stack for back behavior
const [viewStack, setViewStack] = useState<View[]>(['school-list']);
const currentView = viewStack[viewStack.length - 1];

const navigate = (view: View) => setViewStack(prev => [...prev, view]);
const goBack = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
```

---

## Recommended Project Structure (v2.0)

```
src/
├── app/
│   ├── App.tsx                    # Root component + view router (MODIFY)
│   ├── Navigation.tsx             # Top nav bar with school context (NEW)
│   └── ViewRouter.tsx             # Switch on view state (NEW, extracted from App.tsx)
│
├── components/
│   ├── ui/                        # Existing: PriceBadge, EditableAssumption, etc.
│   └── wizard/                    # Existing: WizardShell, ProgressBar, etc.
│
├── data/
│   ├── default-prices.ts          # Static seed prices (KEEP, read-only)
│   ├── default-assumptions.ts     # KEEP
│   ├── differentiators.ts         # KEEP
│   ├── cito-migration-prices.ts   # KEEP
│   ├── jij-license-tiers.ts       # KEEP
│   └── school-profiles.ts         # KEEP (presets)
│
├── db/
│   ├── schema.ts                  # Dexie database definition (NEW)
│   ├── migrations.ts              # DB version migrations (NEW)
│   └── seed.ts                    # Migrate from localStorage (NEW)
│
├── engine/
│   ├── price-comparison.ts        # KEEP UNTOUCHED
│   ├── current-vs-proposed.ts     # KEEP UNTOUCHED
│   ├── migration.ts               # KEEP UNTOUCHED
│   ├── types.ts                   # KEEP, extend if needed
│   ├── index.ts                   # KEEP
│   └── export-renderer.ts         # NEW: transform calc results for DMU export
│
├── features/
│   ├── school-profile/
│   │   ├── store.ts               # MODIFY: add schoolId awareness
│   │   ├── types.ts               # MODIFY: add school identity fields
│   │   ├── schemas/               # KEEP
│   │   └── components/            # KEEP
│   │
│   ├── school-list/               # NEW
│   │   ├── SchoolListPage.tsx     # School dashboard
│   │   ├── SchoolCard.tsx         # Individual school summary
│   │   └── SchoolSearch.tsx       # Filter/search schools
│   │
│   ├── school-detail/             # NEW
│   │   ├── SchoolDetailPage.tsx   # Single school overview
│   │   ├── ConversationHistory.tsx # Past intake conversations
│   │   └── SchoolActions.tsx      # Quick actions (new calc, export, etc.)
│   │
│   ├── intake/
│   │   ├── IntakePanel.tsx        # MODIFY: multi-turn, school-linked
│   │   └── ConversationCard.tsx   # NEW: display past conversation
│   │
│   ├── price-comparison/
│   │   ├── store.ts               # MODIFY: school-scoped, reads from PriceDataStore
│   │   └── [pages + components]   # KEEP
│   │
│   ├── price-admin/               # NEW
│   │   ├── PriceAdminPage.tsx     # Global price management
│   │   ├── PriceUpdateQueue.tsx   # Pending updates review
│   │   └── store.ts               # usePriceDataStore
│   │
│   └── export/                    # NEW
│       ├── ExportPreviewPage.tsx   # Preview + download
│       ├── DMUSelector.tsx         # Pick audience
│       ├── store.ts               # Export config state
│       └── templates/
│           ├── coordinator.tsx     # PDF layout: coordinator
│           ├── mt.tsx              # PDF layout: MT
│           └── finance.tsx         # PDF layout: finance
│
├── lib/
│   ├── ai-intake.ts               # MODIFY: expanded schema + context
│   ├── price-pipeline.ts          # NEW: document parsing for prices
│   ├── date-utils.ts              # KEEP
│   └── format.ts                  # KEEP
│
├── models/
│   ├── school.ts                  # MODIFY: add SchoolRecord type
│   ├── pricing.ts                 # MODIFY: add PriceUpdate type
│   ├── modules.ts                 # KEEP
│   ├── assumptions.ts             # KEEP
│   ├── migration.ts               # KEEP
│   └── conversation.ts            # NEW: conversation/intake record type
│
└── main.tsx                       # MODIFY: initialize Dexie DB on startup
```

---

## Architectural Patterns

### Pattern 1: DB-Backed Zustand (for multi-school persistence)

**What:** Zustand stores remain the reactive in-memory layer, but sync to/from Dexie for persistence. The store does not use `persist` middleware for data that lives in Dexie.

**When to use:** Any data that spans multiple school records or needs to survive beyond a single session.

**Trade-offs:** More complexity than pure Zustand persist, but necessary for multi-record data. localStorage persist is fine for UI preferences (e.g., last active view, sidebar collapsed).

```typescript
// Pattern: Zustand store that syncs with Dexie
interface SchoolDBState {
  schools: SchoolRecord[];
  activeSchoolId: string | null;
  isLoading: boolean;

  loadSchools: () => Promise<void>;
  setActiveSchool: (id: string) => Promise<void>;
  createSchool: (name: string) => Promise<string>;
  updateSchool: (id: string, data: Partial<SchoolRecord>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
}

export const useSchoolDBStore = create<SchoolDBState>()((set, get) => ({
  schools: [],
  activeSchoolId: null,
  isLoading: true,

  loadSchools: async () => {
    const schools = await db.schools.toArray();
    set({ schools, isLoading: false });
  },

  setActiveSchool: async (id) => {
    const school = await db.schools.get(id);
    if (!school) return;

    // Hydrate the school profile store with this school's data
    const profileStore = useSchoolProfileStore.getState();
    profileStore.hydrateFromRecord(school);

    set({ activeSchoolId: id });
  },
  // ...
}));
```

### Pattern 2: Engine Isolation (preserve existing contract)

**What:** The three existing engines remain pure functions. New features feed them data differently, but never modify their signatures.

**When to use:** Always. This is the most important architectural invariant.

**Trade-offs:** May require adapter/transformer functions between new data shapes and engine inputs. Worth it for testability and safety.

```typescript
// The engine contract stays the same:
calculateComparison(selectedModules, studentCounts, prices) → ComparisonResult

// What changes is WHERE prices come from:
// v1: static import DEFAULT_PRICES
// v2: usePriceDataStore merges DEFAULT_PRICES + verified updates + school overrides
```

### Pattern 3: Feature Folders with Lazy Loading

**What:** Each new feature (school-list, export, price-admin) is a self-contained folder. Use `React.lazy()` for pages that are not on the initial render path.

**When to use:** For all new page-level components. Keeps the initial bundle small.

```typescript
// In ViewRouter.tsx
const SchoolListPage = lazy(() => import('./features/school-list/SchoolListPage'));
const ExportPreviewPage = lazy(() => import('./features/export/ExportPreviewPage'));
const PriceAdminPage = lazy(() => import('./features/price-admin/PriceAdminPage'));
```

---

## Data Flow Changes

### v1 Data Flow (current)

```
Wizard inputs → useSchoolProfileStore → usePriceComparisonStore.initialize()
                                              │
                                              ↓
                                        calculateComparison(
                                          selectedModules,
                                          studentCounts,
                                          DEFAULT_PRICES  ← static
                                        )
                                              │
                                              ↓
                                        ComparisonResult → UI
```

### v2 Data Flow (target)

```
School selected from list
    │
    ↓
useSchoolDBStore.setActiveSchool(id)
    │
    ├──→ useSchoolProfileStore.hydrateFromRecord(school)
    │
    ├──→ usePriceDataStore.getSchoolPrices(schoolId)
    │       merges: DEFAULT_PRICES + global verified updates + school-specific overrides
    │
    └──→ usePriceComparisonStore.initialize()
              │
              ↓
         calculateComparison(
           selectedModules,
           studentCounts,
           mergedPrices  ← dynamic per school
         )
              │
              ↓
         ComparisonResult
              │
              ├──→ Comparison UI (existing)
              │
              └──→ export-renderer.ts → DMU template → PDF
```

### AI Intake Data Flow (enhanced)

```
Consultant types notes
    │
    ↓
extractIntakeFromNotes(notes, previousConversations?)  ← enhanced
    │
    ↓
EnhancedIntakeExtraction
    │
    ├──→ Create/update school profile in Dexie
    │
    ├──→ Save conversation record in Dexie
    │
    ├──→ Create price update records (status: 'pending')
    │       for any prices mentioned in conversation
    │
    └──→ Hydrate wizard for review/correction
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Putting Dexie in Zustand Persist

**What people do:** Use Zustand persist middleware to write school data to localStorage, then also use Dexie for the same data.

**Why it's wrong:** Two sources of truth. localStorage and IndexedDB can get out of sync. localStorage has a 5-10MB limit that breaks with many schools.

**Do this instead:** Use Dexie as the single persistence layer for school data. Zustand stores are in-memory only (no `persist` for school-related data). On app load, Dexie hydrates Zustand. On save, Zustand writes to Dexie. Keep Zustand `persist` only for UI preferences (sidebar state, last view).

### Anti-Pattern 2: Making Engines Stateful

**What people do:** Pass store references or school IDs into engine functions so they can look up their own data.

**Why it's wrong:** Breaks the pure function guarantee. Makes engines untestable without mocking stores.

**Do this instead:** Always resolve data in the store layer, then pass plain data to engines. The engine never knows about Zustand, Dexie, or school IDs.

### Anti-Pattern 3: Premature URL Routing

**What people do:** Add React Router because "more views = need a router."

**Why it's wrong:** For an internal tool with no SEO, no deep linking requirements, and no server-side rendering, a router adds configuration overhead, history management complexity, and a dependency — all for features nobody needs.

**Do this instead:** Expand the `View` union type and use a simple navigation stack. If deep linking becomes needed later (unlikely for internal tool), add a router at that point.

### Anti-Pattern 4: One Giant Store

**What people do:** Merge all school data, prices, export config, and UI state into one mega-store.

**Why it's wrong:** Every component re-renders on any state change. Slows down the app and makes debugging painful.

**Do this instead:** Keep stores focused. School DB, school profile, price comparison, price data, and export are separate stores. They communicate via `getState()` (already established pattern).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Anthropic API (Claude Haiku 4.5) | Direct SDK call from browser | Already works. Expand prompts for enhanced intake. Keep `dangerouslyAllowBrowser: true` (internal tool). |
| Browser Print API | `window.print()` with `@media print` CSS | Baseline export — free, zero dependencies. Good for quick prints. |
| @react-pdf/renderer | Client-side PDF generation | For branded DMU exports. Adds ~200KB to bundle. Lazy-load the export feature. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| SchoolDB store <-> SchoolProfile store | `getState()` hydration on school switch | SchoolDB is the source of truth. SchoolProfile is the working copy. |
| PriceData store <-> PriceComparison store | PriceData provides merged prices to PriceComparison | Replaces the static `DEFAULT_PRICES` import |
| Intake <-> SchoolDB | Intake creates/updates school records | Conversation records linked by schoolId |
| Export <-> Engine results | Export renderer reads ComparisonResult | No new engine required — just data transformation |

---

## Build Order (dependency-driven)

The features have clear dependencies. Build in this order:

```
Phase 1: Multi-school persistence (foundation for everything else)
   │  - Dexie schema + migrations
   │  - useSchoolDBStore
   │  - Modify useSchoolProfileStore (add schoolId, remove persist for school data)
   │  - SchoolListPage + SchoolDetailPage
   │  - localStorage migration
   │  - Modify App.tsx view management
   │
Phase 2: Enhanced AI intake (depends on multi-school)
   │  - Expand IntakeExtractionSchema
   │  - Update system prompt
   │  - Link intake to school records
   │  - Conversation history storage + display
   │
Phase 3: Price intelligence pipeline (depends on multi-school)
   │  - usePriceDataStore
   │  - Modify usePriceComparisonStore to read from PriceDataStore
   │  - PriceAdminPage + verification workflow
   │  - Connect intake price mentions to price pipeline
   │
Phase 4: DMU-targeted exports (depends on phases 1-3 for full data)
      - Export templates (coordinator, MT, finance)
      - ExportPreviewPage
      - PDF generation with @react-pdf/renderer
      - useExportStore
```

**Why this order:**
1. Multi-school persistence is the foundation — intake, prices, and exports all need school identity.
2. Enhanced intake is high daily-use value and exercises the multi-school system.
3. Price pipeline builds on the intake price capture and the multi-school data layer.
4. Export comes last because it needs all the data to be in place (school context, prices, calculations) to produce meaningful DMU documents.

---

## Scaling Considerations

| Concern | At 10 schools | At 100 schools | At 1000 schools |
|---------|---------------|----------------|-----------------|
| IndexedDB size | Negligible (~1KB/school) | ~100KB total | ~1MB total, still fine |
| School list render | No optimization needed | No optimization needed | Virtualize list (react-window) |
| Price data | Tiny — 6 modules x 3 providers | Same | Same — price data does not scale with schools |
| PDF generation | Fast, <1s | Same (per-school) | Same |
| AI API calls | Rate limits unlikely | Rate limits unlikely | Monitor API costs |

This tool will never have 1000 schools per consultant. The realistic maximum is 50-100. Scaling is not a concern.

---

## Sources

- Direct codebase analysis of all files in `src/` (2026-03-21)
- Zustand documentation — persist middleware, `getState()` pattern
- Dexie.js — IndexedDB wrapper for structured client-side persistence (used by many offline-first React apps)
- @react-pdf/renderer — client-side React-based PDF generation
- Project context from `.planning/PROJECT.md`
- Existing architecture research from `.planning/research/ARCHITECTURE.md` (2026-03-20)

---
*Architecture research for: Rekentool VO v2.0 Sales Intelligence Integration*
*Researched: 2026-03-21*
