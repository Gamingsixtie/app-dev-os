# Phase 6: Multi-School Data Layer - Research

**Researched:** 2026-03-21
**Domain:** IndexedDB persistence (Dexie), client-side routing (TanStack Router), multi-entity data architecture
**Confidence:** HIGH

## Summary

Phase 6 transforms the single-school SPA into a multi-school application with persistent storage, URL-based routing, and v1 data migration. The core architectural shift is threefold: (1) replace localStorage with IndexedDB via Dexie for multi-school data, (2) replace `useState<View>` in App.tsx with TanStack Router for URL-based navigation with deep linking, and (3) migrate existing v1 localStorage data into the new Dexie schema automatically.

The current codebase has two Zustand stores with `persist` middleware writing to localStorage under keys `rekentool-school-profile` and `rekentool-price-comparison`. These stores hold flat data for a single school. The new architecture uses Dexie as the primary data layer (one database, multiple tables), with Zustand stores serving as in-memory view state loaded from the active school's Dexie record. This avoids the immaturity of `zustand-indexeddb` (v0.1.1) and the async race conditions documented in Zustand+IndexedDB integrations.

**Primary recommendation:** Use Dexie 4.3 as the persistence layer (not Zustand persist), TanStack Router 1.x with code-based routing for URL navigation, and `slugify` for URL-friendly school names. Keep Zustand as in-memory state, hydrated from Dexie on school selection.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Slimme routing bij app-opening: 0 scholen -> direct naar lege schooloverzicht met "Voeg school toe" actie. 1 school -> direct naar die school. 2+ scholen -> schooloverzicht.
- **D-02:** Schooloverzicht is dashboard-achtig: kaarten met mini-samenvatting per school -- schooltype, niveaus, aantal leerlingen, geselecteerde modules, laatst berekend resultaat. Bijna een preview, genoeg om te kiezen zonder te openen.
- **D-03:** Zoekbalk met tekstfilter in het schooloverzicht (simpel filter nu, uitbreiden met pipeline-status badges en sortering in Phase 7 / SCHOOL-06).
- **D-04:** "Nieuwe school toevoegen" is altijd een bewuste actie vanuit het schooloverzicht, nooit vanuit een lopend gesprek of vergelijking. Exacte knop-plaatsing naar Claude's discretie.
- **D-05:** Migratiewizard bij eerste keer openen met v1-data: "We hebben uw data gevonden. Wilt u een naam geven aan dit schoolprofiel?" Gebruiker geeft naam, bevestigt, klaar.
- **D-06:** Schoolnaam bij migratie wordt afgeleid uit bestaande data als suggestie (bijv. "HAVO/VWO-school" op basis van geselecteerde niveaus), gebruiker kan aanpassen.
- **D-07:** Nieuwe gebruikers (geen v1-data) starten met een leeg schooloverzicht met duidelijke "Voeg school toe" actie.
- **D-08:** Bij mislukte migratie (corrupt localStorage): eerlijke foutmelding -- "Uw eerdere gegevens konden niet worden overgezet. U kunt opnieuw beginnen." Geen stille fallback.
- **D-09:** Nieuwe school aanmaken via de volledige 5-staps wizard (bestaande wizard + naamveld erbij). Wizard is de standaard aanmaakroute.
- **D-10:** Bewerken via twee routes: wizard als hoofdroute (school openen -> wizard met ingevulde data), plus snelkoppelingen vanuit de resultaatweergave naar specifieke wizard-stappen (bijv. "modules wijzigen").
- **D-11:** Verwijderen met bevestigingsdialoog: "Weet u zeker dat u [schoolnaam] wilt verwijderen? Dit kan niet ongedaan worden gemaakt." Geen soft delete.
- **D-12:** Automatisch opslaan per wizard-stap. Elke stap slaat tussentijds op naar IndexedDB. Profiel is altijd zo compleet als waar de gebruiker is gekomen. Incompleet profiel verschijnt in de lijst (met indicator).
- **D-13:** Diepe URLs tot wizard-stap niveau: `/scholen/{slug}/wizard/3`, `/scholen/{slug}/vergelijking`, `/scholen/{slug}/migratie` etc.
- **D-14:** Leesbare slugs in URLs afgeleid van schoolnaam: `/scholen/montessori-college-oost/vergelijking`. Slug moet stabiel blijven of updaten bij naamwijziging.
- **D-15:** Echte browser history -- back-button gedrag hangt af van waar je vandaan kwam. Vanuit wizard -> terug naar vorige wizard-stap of overzicht. Vanuit overzicht direct naar school -> back naar overzicht. Browser history bepaalt.
- **D-16:** Niet-bestaande school URL -> redirect naar schooloverzicht met korte melding "Dit schoolprofiel bestaat niet meer."

### Claude's Discretion
- Exacte schoolkaart-design in het overzicht (layout, info-hierarchie, spacing)
- Router library keuze (TanStack Router vs eigen History API wrapper)
- Dexie schema-ontwerp en indexen
- Slug-generatie logica en collision handling
- Migratiewizard UI-ontwerp en stappen
- Indicator-design voor incomplete profielen
- Loading states en skeleton screens
- Exacte plaatsing van "nieuwe school" knop

### Deferred Ideas (OUT OF SCOPE)
- Doorzoekbaar overzicht met pipeline-status badges en sortering -- Phase 7 (SCHOOL-06)
- Contactpersonen, productgebruik, gesprekshistorie per school -- Phase 7
- Offline werking via service worker -- Phase 11 (ARCH-05)
- School data export/import voor overdracht tussen collega's -- FUTURE-04

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Gebruiker kan meerdere schoolprofielen aanmaken, openen en verwijderen -- elk met eigen wizard-data, prijsoverschrijvingen en gesprekshistorie | Dexie `schools` table with auto-increment id, CRUD operations, `useLiveQuery` for reactive UI |
| ARCH-02 | Bestaande v1 localStorage-data wordt automatisch gemigreerd naar v2-structuur zonder dataverlies | One-time migration reads `rekentool-school-profile` and `rekentool-price-comparison` from localStorage, writes to Dexie, clears old keys |
| ARCH-03 | Applicatie gebruikt IndexedDB (Dexie) voor schooldata-persistentie met ondersteuning voor 50+ schoolprofielen | Dexie 4.3 with indexed fields for slug lookup and ordering; IndexedDB handles 50+ records trivially |
| ARCH-04 | Navigatie ondersteunt browser-back-button, deep linking naar specifieke school/view, en URL-state | TanStack Router with code-based routing, `$slug` param routes, browser history integration |
| MODE-01 | Alle UI-tekst in formeel Nederlands (u-vorm) | All new UI components (school overview, migration wizard, delete dialog) use u-vorm Dutch |
| MODE-03 | Applicatie is bruikbaar op tablet met touch | Touch-friendly card layout, minimum 44px tap targets, responsive grid for school overview |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.3.0 | IndexedDB wrapper for school data persistence | De-facto standard for IndexedDB in JS. Mature (10+ years), excellent TypeScript support, Safari workarounds built in, `useLiveQuery` for reactive React |
| dexie-react-hooks | 4.2.0 | React hooks for Dexie (`useLiveQuery`) | Official React integration. Reactive re-renders when IndexedDB data changes |
| @tanstack/react-router | 1.168.1 | URL-based routing with type-safe params | Best-in-class type safety for React SPAs. Full `$slug` param support, browser history, code-based routing without build plugin |
| slugify | 1.6.8 | URL-friendly slug generation from school names | Lightweight, handles Unicode/Dutch characters (e, u-umlaut), configurable |

### Supporting (already installed)

| Library | Version | Purpose | Role in Phase 6 |
|---------|---------|---------|-----------------|
| zustand | 5.0.12 | In-memory state management | Keeps current pattern for active school state -- but removes `persist` middleware. Hydrates from Dexie instead |
| zod | 4.3.6 | Schema validation | New schema for school name field. Existing wizard schemas unchanged |
| react-hook-form | 7.71.2 | Form handling | Used in wizard (existing) and new school name input, delete confirmation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Router | Custom History API wrapper | Simpler initial code, but no type-safe params, no `<Link>`, manual URL parsing. TanStack is better for D-13/D-14/D-15/D-16 requirements |
| TanStack Router | wouter (lightweight) | 2KB vs ~30KB. But wouter lacks type-safe params, search params, and route-level data loading. Given the deep URL requirements (D-13), TanStack is worth the size |
| TanStack Router (code-based) | TanStack Router (file-based) | File-based requires Vite plugin and restructured file tree. Code-based is simpler for this project's ~8 routes and avoids build tooling changes |
| Dexie | idb-keyval | idb-keyval is key-value only -- no queries, no indexing, no `useLiveQuery`. Insufficient for 50+ school profiles with search/filter |
| Dexie | Raw IndexedDB API | Verbose, error-prone, no TypeScript types, no reactive hooks. Dexie abstracts the pain |
| slugify | Custom slug function | Edge cases with Dutch characters (ij, e-accent), collision handling, empty strings. Not worth hand-rolling |

**Installation:**
```bash
npm install dexie dexie-react-hooks @tanstack/react-router slugify
```

**Version verification:** All versions verified against npm registry on 2026-03-21.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── db/
│   ├── database.ts          # Dexie database class + schema definition
│   ├── migrations.ts         # v1 localStorage -> Dexie migration logic
│   └── types.ts              # SchoolRecord, PriceOverrideRecord types
├── router/
│   ├── routes.ts             # All route definitions (code-based)
│   ├── router.ts             # createRouter + route tree
│   └── guards.ts             # Route guards (school exists check, smart redirect)
├── features/
│   ├── school-overview/
│   │   ├── SchoolOverviewPage.tsx   # Dashboard with school cards
│   │   ├── SchoolCard.tsx           # Mini-summary card per school
│   │   └── SearchBar.tsx            # Text filter
│   ├── school-profile/
│   │   ├── store.ts                 # Zustand store (NO persist, hydrates from Dexie)
│   │   ├── components/
│   │   │   ├── WizardShell.tsx      # Updated: school-aware, auto-saves to Dexie
│   │   │   └── WizardStep*.tsx      # Existing steps, mostly unchanged
│   │   └── schemas/                 # Existing + new name-schema.ts
│   ├── price-comparison/
│   │   └── store.ts                 # Zustand store (NO persist, loads from Dexie per school)
│   └── migration-wizard/
│       └── MigrationWizard.tsx      # v1 data migration UI (D-05/D-06/D-08)
├── lib/
│   └── slugify.ts                   # Slug generation + collision resolution
└── App.tsx                          # RouterProvider wrapper (replaces view state)
```

### Pattern 1: Dexie as Primary Data Layer, Zustand as View State

**What:** Dexie owns all persistent school data. Zustand stores hold the currently-active school's data in memory for fast UI reads. On school selection, data is loaded from Dexie into Zustand. On wizard-step completion, data is written to both Zustand (immediate UI) and Dexie (persistence).

**When to use:** Always. This replaces the current `persist` middleware pattern.

**Example:**
```typescript
// src/db/database.ts
import Dexie, { type EntityTable } from 'dexie';

export interface SchoolRecord {
  id?: number;                    // Auto-increment primary key
  slug: string;                   // URL-friendly name
  name: string;                   // Display name
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;            // All wizard steps completed
  completedSteps: number[];       // Which steps are done

  // Wizard data (same shape as current store)
  levels: string[];
  studentCounts: Record<string, Record<number, number>>;
  selectedModules: string[];
  moduleSetups: Array<{
    moduleId: string;
    currentProvider: string;
    pricePerStudent: number | null;
    customProviderName?: string;
  }>;
  scenario: 'A' | 'B' | null;

  // Price comparison data
  appliedOverrides: Array<{
    moduleId: string;
    provider: string;
    amount: number;
  }>;
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;
}

class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;

  constructor() {
    super('rekentool-vo');
    this.version(1).stores({
      schools: '++id, slug, name, updatedAt'
    });
  }
}

export const db = new RekenToolDB();
```

### Pattern 2: Code-Based TanStack Router

**What:** Define all routes programmatically in a single file. No file-based routing plugin needed.

**When to use:** For this project's ~8 routes. Code-based is simpler and avoids Vite plugin dependency.

**Example:**
```typescript
// src/router/routes.ts
import { createRootRoute, createRoute } from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const scholenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen',
  component: SchoolOverviewPage,
});

const schoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen/$slug',
  component: SchoolLayout,
});

const wizardRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
  component: WizardPage,
});

const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
  component: PriceComparisonPage,
});

// etc.

const routeTree = rootRoute.addChildren([
  scholenRoute,
  schoolRoute.addChildren([
    wizardRoute,
    vergelijkingRoute,
    // ...more school sub-routes
  ]),
]);
```

### Pattern 3: Smart Redirect at Root

**What:** The root `/` route checks Dexie for school count and redirects per D-01 logic.

**Example:**
```typescript
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const count = await db.schools.count();
    if (count === 0) throw redirect({ to: '/scholen' });
    if (count === 1) {
      const school = await db.schools.toCollection().first();
      throw redirect({ to: '/scholen/$slug/wizard/1', params: { slug: school!.slug } });
    }
    throw redirect({ to: '/scholen' });
  },
});
```

### Pattern 4: Auto-Save Per Wizard Step to Dexie

**What:** Each wizard step saves to both Zustand (for immediate UI reactivity) and Dexie (for persistence). The `stepRef.current.submit()` call in WizardShell triggers a Dexie write.

**Example:**
```typescript
// In WizardShell handleNext:
const handleNext = useCallback(async () => {
  if (!stepRef.current) return;
  const isValid = await stepRef.current.submit();
  if (!isValid) return;

  // Save to Dexie
  const state = useSchoolProfileStore.getState();
  await db.schools.update(activeSchoolId, {
    levels: state.levels,
    studentCounts: state.studentCounts,
    // ... all wizard fields
    completedSteps: [...completedSteps, currentStep],
    updatedAt: new Date(),
  });

  // Navigate
  if (currentStep < TOTAL_STEPS - 1) {
    navigate({ to: '/scholen/$slug/wizard/$step', params: { slug, step: String(currentStep + 2) } });
  } else {
    // Route to appropriate results view
  }
}, [activeSchoolId, currentStep, slug, navigate]);
```

### Pattern 5: v1 Migration on First Load

**What:** On app initialization, check localStorage for v1 keys. If found, show migration wizard (D-05). If corrupt, show error (D-08). If absent, show empty overview (D-07).

**Example:**
```typescript
// src/db/migrations.ts
export interface V1MigrationResult {
  success: boolean;
  schoolRecord?: Partial<SchoolRecord>;
  suggestedName?: string;
  error?: string;
}

export function detectV1Data(): boolean {
  return localStorage.getItem('rekentool-school-profile') !== null;
}

export function extractV1Data(): V1MigrationResult {
  try {
    const raw = localStorage.getItem('rekentool-school-profile');
    if (!raw) return { success: false };

    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state || !state.levels) {
      return { success: false, error: 'Corrupt data structure' };
    }

    // Derive suggested name from levels (D-06)
    const levelLabels = state.levels.map((l: string) =>
      l.toUpperCase().replace('VMBO-', 'VMBO ')
    );
    const suggestedName = levelLabels.join('/') + '-school';

    return {
      success: true,
      schoolRecord: {
        levels: state.levels,
        studentCounts: state.studentCounts,
        selectedModules: state.selectedModules,
        moduleSetups: state.moduleSetups,
        scenario: state.scenario,
      },
      suggestedName,
    };
  } catch {
    return { success: false, error: 'Data kon niet worden gelezen' };
  }
}

export function extractV1PriceOverrides(): { appliedOverrides: any[]; migrationHourlyRate: number; migrationTimeSavingOverrides: Record<string, number> } | null {
  try {
    const raw = localStorage.getItem('rekentool-price-comparison');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      appliedOverrides: parsed?.state?.appliedOverrides ?? [],
      migrationHourlyRate: parsed?.state?.migrationHourlyRate ?? 50,
      migrationTimeSavingOverrides: parsed?.state?.migrationTimeSavingOverrides ?? {},
    };
  } catch {
    return null;
  }
}
```

### Pattern 6: Slug Generation with Collision Handling

**What:** Generate URL-friendly slugs from Dutch school names. Handle collisions by appending a counter.

**Example:**
```typescript
// src/lib/slugify.ts
import slugifyLib from 'slugify';
import { db } from '@/db/database';

export function generateSlug(name: string): string {
  return slugifyLib(name, { lower: true, strict: true, locale: 'nl' });
}

export async function uniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await db.schools.where('slug').equals(candidate).first();
    if (!existing || existing.id === excludeId) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
}
```

### Anti-Patterns to Avoid

- **Zustand persist with async IndexedDB storage:** Race conditions are well-documented. The `persist` middleware fires synchronously on init, but IndexedDB is async. This leads to empty-store overwrites. Use Dexie directly instead.
- **Storing Dexie db instance in React state or context:** The db is a module-level singleton. Never create it inside a component.
- **Using `useLiveQuery` for the active school's wizard data:** `useLiveQuery` re-runs on every IndexedDB write. For high-frequency wizard interactions, use Zustand in-memory state and batch-write to Dexie on step completion. Reserve `useLiveQuery` for the school overview list.
- **File-based routing for this project:** Adds Vite plugin dependency, forces file restructuring, and the app has only ~8 routes. Code-based is simpler.
- **Mixing v1 localStorage persist and v2 Dexie persist:** After migration, remove Zustand `persist` middleware entirely. The two systems must not co-exist.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD + transactions | Raw IndexedDB API wrapper | Dexie 4.3 | IndexedDB API is notoriously verbose and error-prone. Dexie handles transactions, versioning, Safari quirks |
| Reactive IndexedDB queries in React | Custom subscription/polling | `useLiveQuery` from dexie-react-hooks | Handles observable subscriptions, cleanup, re-rendering. Tested across browsers |
| URL routing + history | Custom History API + URL parsing | TanStack Router | Back-button, deep linking, typed params, redirects, 404 handling -- all built-in |
| Slug generation | Custom regex replace chain | `slugify` npm package | Unicode handling, Dutch characters, locale support, edge cases (empty strings, special chars) |
| Schema migration (Dexie versions) | Manual IndexedDB version management | Dexie's `version().stores().upgrade()` | Declarative schema versioning with upgrade functions. Handles version bumps automatically |

**Key insight:** The combination of IndexedDB quirks (async, transactions, Safari bugs) and URL routing edge cases (back-button, deep linking, 404s) makes hand-rolling either of these a multi-week effort with ongoing browser-specific bugs. Dexie and TanStack Router have years of browser-specific fixes baked in.

## Common Pitfalls

### Pitfall 1: Zustand Persist + IndexedDB Race Condition
**What goes wrong:** Zustand's `persist` middleware initializes state synchronously, then asynchronously loads from storage. With IndexedDB (async), the empty initial state gets written back to IndexedDB before the real data loads, effectively deleting it.
**Why it happens:** `persist` was designed for synchronous localStorage. IndexedDB is inherently async.
**How to avoid:** Don't use Zustand `persist` with IndexedDB. Use Dexie as the data layer and hydrate Zustand manually on school selection.
**Warning signs:** Data disappears on page refresh. Works locally but breaks in production.

### Pitfall 2: Safari Private Browsing IndexedDB Limits
**What goes wrong:** Safari private browsing has IndexedDB available but with severe quota limits (as low as a few MB). Large datasets may fail silently.
**Why it happens:** Safari implements private browsing by restricting storage, not blocking it.
**How to avoid:** Wrap Dexie operations in try/catch. On `QuotaExceededError`, show a user-facing message: "Uw browser beperkt de opslagcapaciteit. Gebruik normaal browsen voor volledige functionaliteit." The STATE.md already flags this as a known concern.
**Warning signs:** Works on desktop Chrome/Firefox, fails on iPad Safari in private mode.

### Pitfall 3: Slug Instability on School Rename
**What goes wrong:** User renames school. Slug changes. Old bookmarked URLs break. Browser history entries become dead links.
**Why it happens:** Slug is derived from name. Name changes = slug changes.
**How to avoid:** Two options: (a) keep original slug forever (URL doesn't match name), or (b) update slug on rename but also store the Dexie `id` as the canonical identifier. For D-14 ("slug moet stabiel blijven of updaten bij naamwijziging"), option (b) is better: update the slug, and use `id` internally. Old URLs become 404s, which D-16 already handles with redirect + message.
**Warning signs:** Users bookmark school URLs and find them broken after editing the name.

### Pitfall 4: Migration Wizard Not Cleaning Up localStorage
**What goes wrong:** v1 data stays in localStorage after migration. On next visit, migration wizard shows again.
**Why it happens:** Forgot to delete old localStorage keys after successful Dexie write.
**How to avoid:** After confirmed migration, call `localStorage.removeItem('rekentool-school-profile')` and `localStorage.removeItem('rekentool-price-comparison')`. Only delete after Dexie write is confirmed.
**Warning signs:** Migration wizard keeps appearing on every visit.

### Pitfall 5: TanStack Router Bundle Size
**What goes wrong:** The full @tanstack/react-router package adds ~30-40KB gzipped to the bundle.
**Why it happens:** It's a full-featured router with type generation, search params, etc.
**How to avoid:** This is acceptable for this use case. The trade-off is justified by D-13/D-14/D-15/D-16 requirements. Tree-shaking removes unused features. Monitor with `vite build --report`.
**Warning signs:** Bundle size exceeds expectations. Check if route-level code splitting is needed.

### Pitfall 6: Forgetting to Update School `updatedAt` on Every Change
**What goes wrong:** School overview shows incorrect "laatst berekend" because `updatedAt` wasn't set on price recalculation or override changes.
**Why it happens:** Multiple code paths modify school data (wizard steps, price overrides, migration settings).
**How to avoid:** Create a single `saveSchoolData(id, partialData)` helper that always sets `updatedAt: new Date()`. All writes go through this function.
**Warning signs:** School cards show stale timestamps.

## Code Examples

### Complete Dexie Database Setup
```typescript
// src/db/database.ts
// Source: Dexie 4.3 docs (https://dexie.org/docs/Tutorial/React)
import Dexie, { type EntityTable } from 'dexie';

export interface SchoolRecord {
  id?: number;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  completedSteps: number[];

  // School profile (wizard data)
  levels: string[];
  studentCounts: Record<string, Record<number, number>>;
  selectedModules: string[];
  moduleSetups: Array<{
    moduleId: string;
    currentProvider: string;
    pricePerStudent: number | null;
    customProviderName?: string;
  }>;
  scenario: 'A' | 'B' | null;

  // Price comparison state
  appliedOverrides: Array<{
    moduleId: string;
    provider: string;
    amount: number;
  }>;
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;
}

class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;

  constructor() {
    super('rekentool-vo');
    this.version(1).stores({
      // Only indexed fields go here. Non-indexed fields are stored automatically.
      schools: '++id, slug, name, updatedAt'
    });
  }
}

export const db = new RekenToolDB();
```

### School Overview with useLiveQuery
```typescript
// Source: dexie-react-hooks docs (https://dexie.org/docs/dexie-react-hooks/useLiveQuery())
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

function SchoolOverviewPage() {
  const schools = useLiveQuery(
    () => db.schools.orderBy('updatedAt').reverse().toArray()
  );

  if (!schools) return <SchoolOverviewSkeleton />;
  if (schools.length === 0) return <EmptyStateWithAddButton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schools.map(school => (
        <SchoolCard key={school.id} school={school} />
      ))}
    </div>
  );
}
```

### TanStack Router Setup (Code-Based)
```typescript
// src/router/router.ts
// Source: TanStack Router docs (https://tanstack.com/router/latest/docs/routing/code-based-routing)
import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router';
import { db } from '@/db/database';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const count = await db.schools.count();
    if (count === 1) {
      const school = await db.schools.toCollection().first();
      throw redirect({ to: '/scholen/$slug', params: { slug: school!.slug } });
    }
    throw redirect({ to: '/scholen' });
  },
});

const scholenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen',
  component: SchoolOverviewPage,
});

const schoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scholen/$slug',
  beforeLoad: async ({ params }) => {
    const school = await db.schools.where('slug').equals(params.slug).first();
    if (!school) {
      // D-16: redirect with message
      throw redirect({ to: '/scholen', search: { error: 'not-found' } });
    }
  },
  component: SchoolLayout,
});

const wizardStepRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/wizard/$step',
  component: WizardPage,
});

const vergelijkingRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/vergelijking',
  component: PriceComparisonPage,
});

const huidigVsCitoRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/huidig-vs-cito',
  component: CurrentVsProposedPage,
});

const migratieRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/migratie',
  component: MigrationPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  scholenRoute,
  schoolRoute.addChildren([
    wizardStepRoute,
    vergelijkingRoute,
    huidigVsCitoRoute,
    migratieRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Type registration for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### School CRUD Operations
```typescript
// src/db/operations.ts
import { db, type SchoolRecord } from './database';
import { uniqueSlug } from '@/lib/slugify';

export async function createSchool(name: string): Promise<SchoolRecord> {
  const slug = await uniqueSlug(name);
  const now = new Date();
  const id = await db.schools.add({
    slug,
    name,
    createdAt: now,
    updatedAt: now,
    isComplete: false,
    completedSteps: [],
    levels: [],
    studentCounts: {},
    selectedModules: [],
    moduleSetups: [],
    scenario: null,
    appliedOverrides: [],
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},
  });
  return (await db.schools.get(id))!;
}

export async function updateSchoolData(
  id: number,
  data: Partial<SchoolRecord>
): Promise<void> {
  await db.schools.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteSchool(id: number): Promise<void> {
  await db.schools.delete(id);
}

export async function getSchoolBySlug(slug: string): Promise<SchoolRecord | undefined> {
  return db.schools.where('slug').equals(slug).first();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand persist + localStorage | Dexie as data layer + Zustand as view state | This phase | Enables multi-school, larger data, indexed queries |
| useState<View> routing | TanStack Router with URL params | This phase | Enables deep linking, back button, bookmarks |
| Single implicit school | Explicit SchoolRecord with id/slug/name | This phase | Foundation for all v2 features (CRM, export, intake) |
| React Router (v5/v6) | TanStack Router 1.x | 2024-2025 ecosystem shift | Type-safe routing is now the standard for new React projects |
| Dexie 3.x | Dexie 4.x | 2024 | EntityTable types, Safari fixes, Suspense hooks |

**Deprecated/outdated:**
- `zustand-indexeddb` (v0.1.1): Too immature (9 GitHub stars, pre-1.0). Don't use.
- Zustand `persist` middleware with async storage: Documented race conditions. Don't use for IndexedDB.

## Open Questions

1. **Slug update strategy on school rename**
   - What we know: D-14 says "slug moet stabiel blijven of updaten bij naamwijziging"
   - What's unclear: Whether to keep old slug (stable URLs but misleading) or update (clean URLs but breaks old bookmarks)
   - Recommendation: Update slug on rename. D-16 already handles "school not found" gracefully. This is the simpler and cleaner approach. If needed later, a slug history table can be added for redirects.

2. **Where does the school name field go in the wizard?**
   - What we know: D-09 says "naamveld erbij" in the wizard, and the specifics section says "als eerste stap van de wizard, niet als apart scherm ervoor"
   - What's unclear: Is it a new step 0, or added to the current step 1 (Niveaus)?
   - Recommendation: Add the name field to step 1 (Niveaus) at the top. This avoids changing TOTAL_STEPS from 5 to 6 and keeps the wizard compact. The name is contextually related to "what school is this."

3. **Should the price comparison store stay separate from the school record?**
   - What we know: Currently two stores with two localStorage keys. In Dexie, all data could be in one `schools` table row.
   - What's unclear: Whether to merge into one Zustand store or keep two.
   - Recommendation: One Dexie record per school (merged). Two Zustand stores in memory (keep separation for clean code). The price comparison store still reads school profile via `getState()` -- this pattern works fine.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | CRUD operations on school records in Dexie | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | Wave 0 |
| ARCH-02 | v1 localStorage migration extracts and writes data correctly | unit | `npx vitest run src/db/__tests__/migrations.test.ts -x` | Wave 0 |
| ARCH-03 | Dexie schema supports 50+ records, indexed queries work | unit | `npx vitest run src/db/__tests__/database.test.ts -x` | Wave 0 |
| ARCH-04 | Route definitions resolve to correct components, params parsed | unit | `npx vitest run src/router/__tests__/routes.test.ts -x` | Wave 0 |
| ARCH-04 | Smart redirect at root based on school count | unit | `npx vitest run src/router/__tests__/guards.test.ts -x` | Wave 0 |
| MODE-01 | UI text uses formal Dutch (u-vorm) | manual-only | Visual inspection -- no automated linguistic check | N/A |
| MODE-03 | Touch targets >= 44px, responsive layout | manual-only | Visual inspection on tablet viewport | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/db/__tests__/operations.test.ts` -- covers ARCH-01 (CRUD)
- [ ] `src/db/__tests__/migrations.test.ts` -- covers ARCH-02 (v1 migration)
- [ ] `src/db/__tests__/database.test.ts` -- covers ARCH-03 (schema, indexing)
- [ ] `src/router/__tests__/routes.test.ts` -- covers ARCH-04 (route resolution)
- [ ] `src/router/__tests__/guards.test.ts` -- covers ARCH-04 (smart redirect)
- [ ] `fake-indexeddb` devDependency needed -- jsdom does not include IndexedDB. Use `fake-indexeddb` for Dexie tests in Vitest.

**Note:** Vitest + jsdom environment does not include IndexedDB. Install `fake-indexeddb` as devDependency and import in test setup:
```bash
npm install -D fake-indexeddb
```
```typescript
// In test setup or individual test files:
import 'fake-indexeddb/auto';
```

## Sources

### Primary (HIGH confidence)
- [Dexie.js 4.3.0](https://dexie.org/) - Database class, schema versioning, useLiveQuery, Safari compatibility
- [dexie-react-hooks 4.2.0](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) - useLiveQuery API
- [TanStack Router 1.168.1](https://tanstack.com/router/latest/docs/routing/code-based-routing) - Code-based routing, createRoute, path params
- [npm registry](https://www.npmjs.com/) - Version verification for all packages (2026-03-21)

### Secondary (MEDIUM confidence)
- [Zustand + IndexedDB discussions](https://github.com/pmndrs/zustand/discussions/1721) - Race condition documentation, why not to use persist middleware with async storage
- [slugify npm](https://www.npmjs.com/package/slugify) - API, locale support, Dutch character handling
- [TanStack Router SPA patterns](https://dev.to/kiran_ravi_092a2cfcf60389/tanstack-router-setup-in-our-react-saas-template-2026-4b67) - Real-world SPA setup patterns

### Tertiary (LOW confidence)
- [Safari IndexedDB private browsing](https://dexie.org/docs/IndexedDB-on-Safari) - Dexie docs mention workarounds but exact quota limits in Safari 18+ need real-device testing
- [zustand-indexeddb v0.1.1](https://github.com/zustandjs/zustand-indexeddb) - Evaluated and rejected (too immature)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified on npm, mature libraries with active maintenance
- Architecture: HIGH - Patterns derived from official docs and established community practices. Dexie+React and TanStack Router code-based routing are well-documented
- Pitfalls: HIGH - Race condition in Zustand+IndexedDB is extensively documented. Safari issues documented by Dexie maintainers
- Migration strategy: MEDIUM - v1 localStorage structure inferred from current code, not from production data dumps. Edge cases possible with corrupt data

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable libraries, no breaking changes expected)
