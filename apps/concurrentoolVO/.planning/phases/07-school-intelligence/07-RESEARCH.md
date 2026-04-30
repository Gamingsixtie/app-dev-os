# Phase 7: School Intelligence - Research

**Researched:** 2026-03-21
**Domain:** CRM-lite school profiles with contacts, conversations, pipeline, kanban actions
**Confidence:** HIGH

## Summary

Phase 7 transforms the existing school card overview into a full CRM-lite system. The current codebase has a `SchoolRecord` in Dexie (v1 schema) with wizard data and price overrides. This phase extends that record with contacts, conversations, pipeline status, action items, and tags. It adds a tabbed profile page (dashboard/vergelijking/producten/contacten/gesprekken), a kanban pipeline view in the overview, and a per-school action board.

The entire stack is already in place: Dexie for persistence, Zustand for state, TanStack Router for nested routes, react-hook-form + Zod for forms, useLiveQuery for reactive queries. No new major libraries are needed except a drag-and-drop library for the kanban boards (pipeline view + action list). The primary complexity lies in the Dexie schema migration (v1 to v2), designing the nested data model to avoid performance issues with large embedded arrays, and building the tab-based profile UI with system event logging.

**Primary recommendation:** Extend SchoolRecord with embedded arrays for contacts/conversations/actions (sufficient for the scale of 50-200 schools), use `@dnd-kit/core` + `@dnd-kit/sortable` for kanban drag-and-drop, and add TanStack Router nested routes for profile tabs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dashboard-first layout -- samenvattingsblok bovenaan, horizontale tabs daaronder
- **D-02:** Tab-volgorde: Overzicht (dashboard) | Vergelijking | Producten | Contacten | Gesprekken
- **D-03:** Context-slimme acties passen zich aan op pipeline-status
- **D-04:** Wizard-data inline bewerkbaar in profiel -- geen wizard heropenen
- **D-05:** Vergelijkingsresultaten als geintegreerde tab
- **D-06:** Schoolkaarten configureerbaar: compact of uitgebreid
- **D-07:** Uitgebreide contactvelden: naam, DMU-positie, functietitel, e-mail, telefoon, voorkeurs-communicatiekanaal, beslissingsbevoegdheid, laatste contact datum, notities
- **D-08:** Een primair contactpersoon per school, verschijnt op schoolkaart
- **D-09:** Meerdere contactpersonen per DMU-rol
- **D-10:** Contactpersonen context-gebonden (gesprekken, exports, productoverzicht)
- **D-11:** Verwijderen geblokkeerd als gesprekken gekoppeld
- **D-12:** Cross-school zoeken contactpersonen: niet in Phase 7
- **D-13:** Hybride invoer gesprekken: verplichte metadata + vrij tekstveld
- **D-14:** Tijdlijn chronologisch, nieuwste bovenaan, datum-headers, contactpersoon-initialen
- **D-15:** Tijdlijn bevat systeemgebeurtenissen
- **D-16:** Vrije tags per gesprek
- **D-17:** Gesprekken volledig bewerkbaar na opslaan
- **D-18:** Doorzoekbaar: zoekbalk boven tijdlijn
- **D-19:** Kanban-actielijst per school: te doen | in uitvoering | afgerond
- **D-20:** Lineaire pipeline: Prospect > Contact gelegd > Demo/Presentatie > Offerte > Gewonnen > Verloren
- **D-21:** Statuswijziging via dropdown + drag & drop in kanban-view
- **D-22:** Kanban-view als apart tabblad in schooloverzicht
- **D-23:** Statuswijzigingen gelogd in tijdlijn als systeemevent
- **D-24:** Vooruit vrij, terug met toelichting
- **D-25:** Filterbar: Alle | Prospect | Contact gelegd | Demo | Offerte | Gewonnen | Verloren
- **D-26:** Kleurgecodeerde statusbadges: grijs/blauw/paars/oranje/groen/rood
- **D-27:** Bij Verloren: verplicht concurrent + optionele reden

### Claude's Discretion
- Exacte dashboard-layout en spacing
- Kaart-design voor contactpersonen en gesprekken
- Kanban-board implementatie (drag & drop library keuze)
- Animaties en transities bij tabwisseling
- Responsive gedrag op tablet
- Tijdlijn-styling (iconen, kleuren per event-type)
- Empty states per tab
- Inline-editing UX voor wizard-data

### Deferred Ideas (OUT OF SCOPE)
- AI-gestuurde gespreksverwerking -- Phase 8
- Cross-school zoeken contactpersonen -- backlog
- Automatische herinneringen bij vervolgacties -- buiten scope
- Export schoolprofiel als PDF -- Phase 11
- Contractbeheer -- buiten scope
- Activiteiten-dashboard over alle scholen -- buiten scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHOOL-01 | Schoolprofiel aanmaken met basisgegevens (naam, type, leerlingaantallen, regio) | Extend existing SchoolRecord; createSchool already exists, add regio field; inline editing pattern from EditableAssumption |
| SCHOOL-02 | Per school huidige productgebruik vastleggen (modules, aanbieder, prijzen, bron) | Already partially implemented via moduleSetups in SchoolRecord; extend with source/bron field; Producten tab displays this |
| SCHOOL-03 | Contactpersonen per school (naam, rol, DMU-positie) | New Contact interface embedded in SchoolRecord; Zod schema for form validation; delete protection per D-11 |
| SCHOOL-04 | Gespreksnotities per school (datum, contactpersoon, kernpunten) | New Conversation interface with timeline rendering; system events via TimelineEvent union type |
| SCHOOL-05 | Pipeline-status per school (prospect t/m at-risk) | PipelineStatus enum; status field on SchoolRecord; color-coded badges per D-26; kanban overview view |
| SCHOOL-06 | Schooloverzicht met zoekfunctie, gesorteerd op laatst gebruikt, met status-badges | Extend existing SchoolOverviewPage with filter bar, pipeline badges, compact/extended toggle, kanban tab |
| PRIJS-07 | Schoolspecifieke prijsoverschrijvingen apart opgeslagen, niet verward met publicatieprijzen | Already implemented: appliedOverrides in SchoolRecord separate from DEFAULT_PRICES; ensure clear UI labeling |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.3.0 | IndexedDB persistence | Already in use; schema versioning built-in |
| dexie-react-hooks | 4.2.0 | Reactive queries via useLiveQuery | Already in use for school data |
| zustand | 5.0.12 | Client state management | Already in use; hydrate() pattern established |
| @tanstack/react-router | 1.168.1 | Routing with nested routes | Already in use; extend with tab routes |
| react-hook-form | 7.71.2 | Form handling | Already in use for wizard forms |
| zod | 4.3.6 | Schema validation | Already in use; Zod v4 |
| tailwindcss | 4.2.2 | Styling | Already in use |

### New (to install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop primitives | Pipeline kanban view + action board |
| @dnd-kit/sortable | 10.0.0 | Sortable containers | Items within kanban columns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | @hello-pangea/dnd (18.0.1) | hello-pangea is simpler for list-based DnD, but dnd-kit is more flexible for cross-container kanban + is framework-agnostic. dnd-kit also has better React 19 support |
| @dnd-kit | pragmatic-drag-and-drop | Atlassian's new lib, but heavier API surface for this use case |
| Embedded arrays in SchoolRecord | Separate Dexie tables for contacts/conversations | Separate tables would be more normalized but adds complexity; at 50-200 schools with <50 contacts each, embedded arrays perform fine and simplify the hydrate() pattern |

**Installation:**
```bash
npm install @dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── database.ts          # Dexie v2 schema with new indexes
│   ├── types.ts             # Extended SchoolRecord + Contact, Conversation, ActionItem types
│   └── operations.ts        # Extended CRUD + contact/conversation/action operations
├── models/
│   ├── school.ts            # Extended with PipelineStatus, DMUPosition enums
│   └── timeline.ts          # NEW: TimelineEvent union type (conversation + system event)
├── features/
│   ├── school-overview/
│   │   ├── SchoolOverviewPage.tsx  # Extended with filter bar + view toggle (list/pipeline)
│   │   ├── SchoolCard.tsx          # Extended with pipeline badge + compact/extended modes
│   │   ├── PipelineKanbanView.tsx  # NEW: kanban columns by pipeline status
│   │   ├── FilterBar.tsx           # NEW: status filter buttons
│   │   └── ViewToggle.tsx          # NEW: list/pipeline view switch
│   ├── school-profile/
│   │   ├── store.ts                # Extended with contacts, conversations, pipeline, actions
│   │   ├── tabs/
│   │   │   ├── DashboardTab.tsx    # NEW: summary + context-smart actions
│   │   │   ├── ComparisonTab.tsx   # NEW: wraps existing comparison pages
│   │   │   ├── ProductsTab.tsx     # NEW: module usage overview with inline edit
│   │   │   ├── ContactsTab.tsx     # NEW: contact list + CRUD
│   │   │   └── ConversationsTab.tsx # NEW: timeline + kanban actions
│   │   ├── components/
│   │   │   ├── ProfileHeader.tsx   # NEW: school name + pipeline dropdown + smart actions
│   │   │   ├── TabNavigation.tsx   # NEW: horizontal tab bar
│   │   │   ├── ContactForm.tsx     # NEW: react-hook-form + Zod
│   │   │   ├── ConversationForm.tsx # NEW: react-hook-form + Zod
│   │   │   ├── Timeline.tsx        # NEW: chronological event list
│   │   │   ├── TimelineEntry.tsx   # NEW: single conversation/system event
│   │   │   ├── ActionKanban.tsx    # NEW: per-school 3-column kanban
│   │   │   ├── PipelineBadge.tsx   # NEW: color-coded status badge
│   │   │   └── LostDealDialog.tsx  # NEW: competitor + reason on "Verloren"
│   │   └── schemas/
│   │       ├── contact.schema.ts   # NEW: Zod v4 schema
│   │       ├── conversation.schema.ts # NEW: Zod v4 schema
│   │       └── action.schema.ts    # NEW: Zod v4 schema
│   └── price-comparison/
│       └── store.ts                # Unchanged -- already handles school-specific overrides
├── components/
│   ├── routing/
│   │   └── SchoolLayout.tsx        # Extended with tab navigation
│   └── ui/
│       └── PipelineBadge.tsx       # NEW: reusable across overview + profile
├── router/
│   └── routes.ts                   # Extended with tab nested routes
```

### Pattern 1: Dexie Schema Migration (v1 to v2)
**What:** Upgrade the database schema to add new fields to existing SchoolRecord
**When to use:** When extending the data model with contacts, conversations, pipeline status
**Example:**
```typescript
// Source: Dexie docs - Version.upgrade()
class RekenToolDB extends Dexie {
  schools!: EntityTable<SchoolRecord, 'id'>;

  constructor() {
    super('rekentool-vo');

    this.version(1).stores({
      schools: '++id, slug, name, updatedAt',
    });

    this.version(2).stores({
      schools: '++id, slug, name, updatedAt, pipelineStatus',
    }).upgrade(tx => {
      return tx.table('schools').toCollection().modify(school => {
        school.contacts = school.contacts ?? [];
        school.conversations = school.conversations ?? [];
        school.actions = school.actions ?? [];
        school.tags = school.tags ?? [];
        school.pipelineStatus = school.pipelineStatus ?? 'prospect';
        school.viewPreference = school.viewPreference ?? 'compact';
        school.region = school.region ?? '';
      });
    });
  }
}
```

### Pattern 2: Embedded Arrays with UUID-based IDs
**What:** Store contacts/conversations as arrays inside SchoolRecord, each with a unique ID
**When to use:** When data is always accessed in the context of a single school
**Example:**
```typescript
// Use crypto.randomUUID() for stable references between contacts and conversations
export interface Contact {
  id: string; // crypto.randomUUID()
  name: string;
  dmuPosition: DMUPosition;
  jobTitle: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'telefoon' | 'teams' | 'overig';
  authority: 'adviserend' | 'beslissend' | 'budgethouder';
  lastContactDate: string | null; // ISO date
  notes: string;
  isPrimary: boolean;
  createdAt: string; // ISO date
}
```

### Pattern 3: Timeline Union Type for Mixed Events
**What:** A discriminated union that handles both user conversations and system events
**When to use:** The timeline (D-14, D-15) shows both conversation entries and system-generated events
**Example:**
```typescript
export type TimelineEvent =
  | { type: 'conversation'; data: Conversation }
  | { type: 'system'; data: SystemEvent };

export interface SystemEvent {
  id: string;
  timestamp: string; // ISO date
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated';
  description: string;
  metadata?: Record<string, string>; // e.g., { from: 'Prospect', to: 'Contact gelegd' }
}

// Merge and sort for display:
function buildTimeline(conversations: Conversation[], systemEvents: SystemEvent[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...conversations.map(c => ({ type: 'conversation' as const, data: c })),
    ...systemEvents.map(e => ({ type: 'system' as const, data: e })),
  ];
  return events.sort((a, b) => {
    const dateA = a.type === 'conversation' ? a.data.date : a.data.timestamp;
    const dateB = b.type === 'conversation' ? b.data.date : b.data.timestamp;
    return new Date(dateB).getTime() - new Date(dateA).getTime(); // newest first
  });
}
```

### Pattern 4: TanStack Router Nested Tab Routes
**What:** Profile tabs as nested routes under /scholen/$slug/
**When to use:** Each tab should have its own URL for deep linking (ARCH-04)
**Example:**
```typescript
// Tab routes as children of schoolRoute
export const schoolDashboardRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/',
  component: DashboardTab,
});

export const schoolProductsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/producten',
  component: ProductsTab,
});

export const schoolContactsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/contacten',
  component: ContactsTab,
});

export const schoolConversationsRoute = createRoute({
  getParentRoute: () => schoolRoute,
  path: '/gesprekken',
  component: ConversationsTab,
});

// SchoolLayout renders tab navigation + <Outlet />
```

### Pattern 5: Context-Smart Actions (D-03)
**What:** Action buttons that adapt based on pipeline status
**When to use:** Dashboard tab shows relevant next steps per school status
**Example:**
```typescript
const SMART_ACTIONS: Record<PipelineStatus, SmartAction[]> = {
  prospect: [
    { label: 'Contact opnemen', icon: 'phone', action: 'add-contact' },
    { label: 'Vergelijking maken', icon: 'chart', action: 'go-comparison' },
  ],
  'contact-gelegd': [
    { label: 'Demo inplannen', icon: 'calendar', action: 'set-demo' },
    { label: 'Gesprek vastleggen', icon: 'note', action: 'add-conversation' },
  ],
  gewonnen: [
    { label: 'Producten bijwerken', icon: 'edit', action: 'go-products' },
  ],
  verloren: [
    { label: 'Laatste gesprek bekijken', icon: 'history', action: 'last-conversation' },
  ],
  // ... etc
};
```

### Anti-Patterns to Avoid
- **Separate Dexie tables for contacts/conversations:** At this scale (50 schools, <50 contacts each), embedding in SchoolRecord is simpler and avoids join complexity. Do NOT normalize into separate tables.
- **Storing system events in a separate table:** Keep them in the SchoolRecord alongside conversations for atomic reads. The timeline merge is cheap in-memory.
- **Using persist middleware on the school-profile Zustand store:** The store already uses hydrate() from Dexie. Adding persist would create dual sources of truth. Keep the current pattern: Dexie is source of truth, Zustand is runtime cache.
- **Re-implementing existing comparison pages for the tab:** Wrap them in a ComparisonTab component that embeds the existing PriceComparisonPage/CurrentVsProposedPage/MigrationPage. Do not duplicate logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag & drop kanban | Custom mousedown/touchstart handlers | @dnd-kit/core + @dnd-kit/sortable | Touch support, accessibility, keyboard navigation, collision detection, smooth animations |
| UUID generation | Custom ID generator | crypto.randomUUID() | Browser-native, RFC 4122 compliant, available in all modern browsers |
| Date formatting | Custom date string formatting | Intl.DateTimeFormat('nl-NL') | Already used in SchoolCard; handles locale-specific formatting correctly |
| Slug generation | Custom slug function | slugify (already installed) | Already in use via uniqueSlug(); handles edge cases |
| Form validation | Manual field checks | react-hook-form + Zod resolver | Already established pattern; handles dirty tracking, error messages, submit prevention |

**Key insight:** This phase is about extending existing patterns, not introducing new ones. The wizard steps, form handling, badge rendering, and store hydration patterns are all established. Follow them.

## Common Pitfalls

### Pitfall 1: Dexie Schema Migration Breaking Existing Data
**What goes wrong:** Existing v1 SchoolRecords lack new fields (contacts, pipelineStatus, etc.), causing runtime errors when code assumes they exist.
**Why it happens:** Dexie.upgrade() only runs on existing databases being opened after the schema change. If the upgrade function misses a field, TypeScript won't catch it at runtime.
**How to avoid:** The upgrade() function must set defaults for ALL new fields. Additionally, add runtime fallbacks in the hydrate() function: `school.contacts ?? []`.
**Warning signs:** `TypeError: Cannot read properties of undefined` when opening an existing school.

### Pitfall 2: Circular References in Contact-Conversation Linking
**What goes wrong:** Contacts reference conversations and conversations reference contacts by ID. Deleting a contact with linked conversations (D-11) requires checking both directions.
**Why it happens:** Embedded arrays don't have foreign key constraints like a relational DB.
**How to avoid:** Implement a `canDeleteContact(schoolId, contactId)` guard that checks if any conversation references this contactId. Show clear UI messaging: "Deze contactpersoon is gekoppeld aan N gesprekken."
**Warning signs:** Orphaned conversation references or silent data inconsistency.

### Pitfall 3: Pipeline Status Regression Without Reason (D-24)
**What goes wrong:** User accidentally moves a school backwards in the pipeline, losing the audit trail.
**Why it happens:** No validation on status transitions.
**How to avoid:** Implement a `validatePipelineTransition(from, to)` function. Forward transitions are always allowed. Backward transitions must return `{ requiresReason: true }`. The UI should show a modal asking for a reason before committing.
**Warning signs:** Pipeline statuses changing without timeline entries.

### Pitfall 4: Large SchoolRecord Slowing Down useLiveQuery
**What goes wrong:** With many conversations and system events, the SchoolRecord becomes large. useLiveQuery re-triggers on any change to the record.
**Why it happens:** All data is in one Dexie row; any update to any field triggers a re-render of all components using useLiveQuery on that school.
**How to avoid:** Use selective state reads from Zustand store (the hydrate pattern already does this). Only hydrate when `school.updatedAt` changes. For the overview page, useLiveQuery should NOT load full records -- use a lightweight projection if Dexie supports it, or accept the trade-off at this scale.
**Warning signs:** Noticeable lag when typing in a conversation form while the timeline is open.

### Pitfall 5: Lost Deal Dialog Missing Competitor Selection (D-27)
**What goes wrong:** User selects "Verloren" but the competitor field is not enforced, resulting in incomplete competitive intelligence data.
**Why it happens:** The status dropdown fires onChange immediately without intercepting the "Verloren" case.
**How to avoid:** Intercept pipeline status changes. When new status is "verloren", open LostDealDialog BEFORE committing the status change. Only commit if the user provides a competitor (required) and optionally a reason.
**Warning signs:** Schools with "Verloren" status but no competitor recorded.

### Pitfall 6: Tab Route Conflicts with Existing Wizard Route
**What goes wrong:** The existing `/scholen/$slug/wizard/$step` route and new tab routes like `/scholen/$slug/` (dashboard) conflict or create ambiguous matches.
**Why it happens:** TanStack Router needs clear route hierarchy. The wizard is a child route of schoolRoute, same as the new tabs.
**How to avoid:** Keep wizard as a distinct path (`/wizard/$step`). New tab routes are separate siblings: `/`, `/vergelijking`, `/producten`, `/contacten`, `/gesprekken`. The SchoolLayout should show tab navigation only when NOT on the wizard path. Detect this via `useMatches()` or a route context flag.
**Warning signs:** Tab navigation appearing on wizard pages, or wizard rendering inside tab layout.

## Code Examples

### SchoolRecord Extension (types.ts)
```typescript
// Source: Extending existing src/db/types.ts
export type PipelineStatus =
  | 'prospect'
  | 'contact-gelegd'
  | 'demo-presentatie'
  | 'offerte'
  | 'gewonnen'
  | 'verloren';

export type DMUPosition = 'coordinator' | 'mt' | 'finance' | 'overig';
export type Authority = 'adviserend' | 'beslissend' | 'budgethouder';
export type CommChannel = 'email' | 'telefoon' | 'teams' | 'overig';

export interface Contact {
  id: string;
  name: string;
  dmuPosition: DMUPosition;
  jobTitle: string;
  email: string;
  phone: string;
  preferredChannel: CommChannel;
  authority: Authority;
  lastContactDate: string | null;
  notes: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  date: string;          // ISO date
  contactId: string;     // references Contact.id
  content: string;       // free text (D-13)
  tags: string[];        // user-created tags (D-16)
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created';
  description: string;
  metadata?: Record<string, string>;
}

export type ActionStatus = 'todo' | 'in-progress' | 'done';

export interface ActionItem {
  id: string;
  title: string;
  status: ActionStatus;
  conversationId: string | null; // linked conversation (D-19)
  createdAt: string;
  updatedAt: string;
}

export interface LostDealInfo {
  competitor: 'dia' | 'jij' | 'overig';
  competitorName?: string; // when 'overig'
  reason?: string;
}

export interface SchoolRecord {
  id?: number;
  slug: string;
  name: string;
  region: string;             // NEW (SCHOOL-01)
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  completedSteps: number[];

  // Wizard data (existing)
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  moduleSetups: ModuleCurrentSetup[];
  scenario: Scenario | null;

  // Price comparison (existing)
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;

  // CRM data (NEW)
  pipelineStatus: PipelineStatus;
  contacts: Contact[];
  conversations: Conversation[];
  systemEvents: SystemEvent[];
  actions: ActionItem[];
  tags: string[];             // all user-created tags across conversations
  lostDealInfo?: LostDealInfo;

  // View preferences (NEW)
  viewPreference: 'compact' | 'extended';
}
```

### Pipeline Badge Component
```typescript
// Source: Following existing PriceBadge pattern from src/components/ui/PriceBadge.tsx
const PIPELINE_COLORS: Record<PipelineStatus, { bg: string; text: string; border: string }> = {
  'prospect':          { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-300' },
  'contact-gelegd':    { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  'demo-presentatie':  { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
  'offerte':           { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
  'gewonnen':          { bg: 'bg-green-50',    text: 'text-green-700',   border: 'border-green-200' },
  'verloren':          { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200' },
};

const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  'prospect': 'Prospect',
  'contact-gelegd': 'Contact gelegd',
  'demo-presentatie': 'Demo/Presentatie',
  'offerte': 'Offerte',
  'gewonnen': 'Gewonnen',
  'verloren': 'Verloren',
};
```

### Zod v4 Contact Schema
```typescript
// Source: Following Zod v4 pattern from existing schemas
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  dmuPosition: z.enum(['coordinator', 'mt', 'finance', 'overig']),
  jobTitle: z.string().default(''),
  email: z.email('Ongeldig e-mailadres').or(z.literal('')),
  phone: z.string().default(''),
  preferredChannel: z.enum(['email', 'telefoon', 'teams', 'overig']).default('email'),
  authority: z.enum(['adviserend', 'beslissend', 'budgethouder']).default('adviserend'),
  notes: z.string().default(''),
  isPrimary: z.boolean().default(false),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

### dnd-kit Kanban Column Pattern
```typescript
// Source: @dnd-kit/core + @dnd-kit/sortable docs
import { DndContext, closestCorners, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function ActionKanban({ actions, onMove }: Props) {
  const columns: Record<ActionStatus, ActionItem[]> = {
    'todo': actions.filter(a => a.status === 'todo'),
    'in-progress': actions.filter(a => a.status === 'in-progress'),
    'done': actions.filter(a => a.status === 'done'),
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    // Determine target column from over.id prefix or data attribute
    const targetStatus = determineTargetColumn(over);
    if (targetStatus) {
      onMove(active.id as string, targetStatus);
    }
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {(['todo', 'in-progress', 'done'] as const).map(status => (
          <KanbanColumn key={status} status={status} items={columns[status]} />
        ))}
      </div>
    </DndContext>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @hello-pangea/dnd | 2023 (rbd deprecated) | Use @dnd-kit for new projects; rbd is unmaintained |
| Zod v3 z.string().email() | Zod v4 z.email() | 2025 (Zod v4) | Project already uses Zod v4; use new API |
| Separate localStorage stores | Dexie IndexedDB with schema versioning | Phase 6 (current project) | Already migrated; extend v2 schema |

**Deprecated/outdated:**
- react-beautiful-dnd: Unmaintained since 2023; @hello-pangea/dnd is the community fork but @dnd-kit is preferred for new code
- Zod v3 API: Project uses Zod v4; use v4 API patterns (z.email() not z.string().email())

## Open Questions

1. **Vergelijking tab routing**
   - What we know: Existing routes are `/vergelijking`, `/huidig-vs-cito`, `/migratie` as children of schoolRoute. The Vergelijking tab (D-05) needs to embed these.
   - What's unclear: Should the tab wrap all three views with a sub-navigation, or should it auto-detect the scenario and show the right view?
   - Recommendation: Auto-detect based on school's scenario field. If scenario is A with moduleSetups -> show CurrentVsProposed. If scenario is A without -> show Comparison. If scenario is B -> show Migration. Keep existing routes as-is for direct URL access, and add a `/scholen/$slug/vergelijking` redirect that auto-picks.

2. **System events storage granularity**
   - What we know: System events (D-15, D-23) must appear in the timeline alongside conversations.
   - What's unclear: How many system events per school over time? Could grow unbounded.
   - Recommendation: Store in SchoolRecord.systemEvents array. At 50 schools with typical usage, this stays manageable. If it becomes a concern later, add a max cap (e.g., keep last 200 system events per school).

3. **viewPreference scope (D-06)**
   - What we know: User can toggle compact/extended school cards in the overview.
   - What's unclear: Is this a per-user global preference or per-school?
   - Recommendation: Store as a global preference in a small Zustand store (not per-school). All cards show in the same mode. Persist in localStorage since it is a UI preference, not school data.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHOOL-01 | Create school with region, name, type, counts | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | Exists (extend) |
| SCHOOL-02 | Store module usage with source/bron per school | unit | `npx vitest run src/db/__tests__/operations.test.ts -x` | Exists (extend) |
| SCHOOL-03 | CRUD contacts with delete protection | unit | `npx vitest run src/features/school-profile/__tests__/contacts.test.ts -x` | Wave 0 |
| SCHOOL-04 | CRUD conversations with contactId link | unit | `npx vitest run src/features/school-profile/__tests__/conversations.test.ts -x` | Wave 0 |
| SCHOOL-05 | Pipeline status transitions + backward requires reason | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | Wave 0 |
| SCHOOL-06 | Filter schools by pipeline status + search | unit | `npx vitest run src/features/school-overview/__tests__/filter.test.ts -x` | Wave 0 |
| PRIJS-07 | School overrides separate from publication prices | unit | `npx vitest run src/features/price-comparison/__tests__/store.test.ts -x` | Exists (verify) |
| D-11 | Cannot delete contact with linked conversations | unit | `npx vitest run src/features/school-profile/__tests__/contacts.test.ts -x` | Wave 0 |
| D-24 | Backward pipeline requires reason, forward is free | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | Wave 0 |
| D-27 | Lost deal requires competitor selection | unit | `npx vitest run src/features/school-profile/__tests__/pipeline.test.ts -x` | Wave 0 |
| DB Migration | v1 to v2 upgrade preserves data | unit | `npx vitest run src/db/__tests__/database.test.ts -x` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npm run build`
- **Phase gate:** Full suite green + build succeeds before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/school-profile/__tests__/contacts.test.ts` -- covers SCHOOL-03, D-11
- [ ] `src/features/school-profile/__tests__/conversations.test.ts` -- covers SCHOOL-04
- [ ] `src/features/school-profile/__tests__/pipeline.test.ts` -- covers SCHOOL-05, D-24, D-27
- [ ] `src/features/school-overview/__tests__/filter.test.ts` -- covers SCHOOL-06
- [ ] `src/db/__tests__/schema-migration.test.ts` -- covers v1-to-v2 Dexie upgrade

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/db/database.ts`, `src/db/types.ts`, `src/db/operations.ts` -- current Dexie v1 schema and CRUD patterns
- Existing codebase: `src/features/school-profile/store.ts` -- Zustand hydrate() pattern
- Existing codebase: `src/router/routes.ts` -- TanStack Router nested route pattern
- Existing codebase: `src/components/ui/PriceBadge.tsx` -- badge component pattern
- Existing codebase: `src/components/ui/EditableAssumption.tsx` -- inline edit pattern
- Existing codebase: `src/features/price-comparison/store.ts` -- price override pattern (PRIJS-07)
- npm registry: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0 -- verified via `npm view`

### Secondary (MEDIUM confidence)
- [Puck blog: Top 5 DnD libraries 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) -- dnd-kit recommendation
- [LogRocket: Build Kanban with dnd-kit](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) -- kanban implementation patterns

### Tertiary (LOW confidence)
- None -- all findings verified against existing code or npm registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use or verified via npm registry
- Architecture: HIGH -- patterns directly observed in existing codebase
- Pitfalls: HIGH -- derived from concrete code analysis (Dexie schema migration, embedded arrays, route conflicts)
- Drag-and-drop library: MEDIUM -- @dnd-kit v6 is well-established but major version jump from prior @dnd-kit/sortable; verify API compatibility

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable stack, no fast-moving dependencies)
