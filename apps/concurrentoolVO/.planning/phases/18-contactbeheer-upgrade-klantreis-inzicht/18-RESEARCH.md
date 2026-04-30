# Phase 18: Contactbeheer Upgrade & Klantreis-inzicht - Research

**Researched:** 2026-03-25
**Domain:** DMU role model upgrade, customer journey timeline, dashboard integration
**Confidence:** HIGH

## Summary

Phase 18 upgrades the existing contact management with a richer DMU role model (6 roles replacing 4) and adds customer journey visibility through a chronological timeline. The codebase is well-structured for this upgrade: DMU positions are defined centrally in `src/models/school.ts`, the Supabase `contacts.dmu_position` column is a plain `string` (no DB-level enum constraint), and all consumers reference the centralized constants. This means the role migration is a code-level change with a one-time data migration query -- no Supabase schema changes required.

The customer journey timeline aggregates existing data (conversations + system events) into a chronological view, with a new "blokkade" event type for manually registered blockades. The existing `system_events` table already supports custom event types and metadata, making blokkade storage straightforward. The dashboard integration adds a compact summary card above the existing DmuMatrix.

A UI-SPEC has already been approved (18-UI-SPEC.md) with detailed layout, color, and component specifications. The implementation should follow this spec closely.

**Primary recommendation:** Start with the data model changes (new DMU_POSITIONS, migration mapping), then update all consuming components, then build the timeline and dashboard features.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Huidige DMU_POSITIONS (`coordinator`, `mt`, `finance`, `overig`) worden vervangen door een uitgebreider rolmodel: `beslisser`, `adviseur`, `gebruiker`, `inkoper`, `beinvloeder`, `overig`
- **D-02:** Het nieuwe rolmodel beschrijft de beslisbevoegdheid van de contactpersoon in het aankoopproces, niet de functietitel -- functietitel blijft een apart vrij tekstveld
- **D-03:** DMU-positie wordt eenmalig per contactpersoon ingesteld via het bestaande ContactForm en is daarna overal beschikbaar (contacten-tab, dashboard DmuMatrix, exports, gesprekken)
- **D-04:** Migratie van bestaande data: `coordinator` -> `gebruiker`, `mt` -> `beslisser`, `finance` -> `inkoper`, `overig` -> `overig` -- met mogelijkheid om handmatig bij te werken
- **D-05:** Contacten-tab toont contactpersonen gegroepeerd per DMU-rol met visuele hierarchie: beslisser bovenaan, gevolgd door inkoper, adviseur, gebruiker, beinvloeder, overig
- **D-06:** Elke DMU-rol krijgt een eigen kleur/icoon zodat de hierarchie direct herkenbaar is
- **D-07:** Per contactpersoon is de engagement-status (uit Phase 15) zichtbaar naast de DMU-rol
- **D-08:** Klantreis-tijdlijn is geintegreerd in de bestaande contacten-tab als een chronologische view naast de DMU-groepering (toggle of aparte subsectie)
- **D-09:** Tijdlijn toont chronologisch: eerste contact -> vervolgcontacten -> interne overleggen -> blokkades -- gekoppeld aan de bestaande gesprekken en systeemevents
- **D-10:** Per tijdlijn-entry is zichtbaar: datum, contactpersoon (met DMU-rol badge), type interactie, en eventuele blokkade of wachtpunt
- **D-11:** Blokkades kunnen handmatig worden geregistreerd met een korte beschrijving
- **D-12:** Bestaande DmuMatrix op het dashboard wordt uitgebreid met de nieuwe DMU-rollen en een extra kolom voor contactvolgorde
- **D-13:** Dashboard toont een compacte klantreis-samenvatting als visueel blok boven of naast de DmuMatrix
- **D-14:** Klantreis-voortgang wordt uitgedrukt als "X van Y DMU-leden bereikt" met visuele indicator

### Claude's Discretion
- Exacte kleurcodes en iconen per DMU-rol (aansluiten bij bestaande design tokens)
- Layout van de klantreis-tijdlijn binnen de contacten-tab
- Toggle-mechanisme tussen DMU-groepering en chronologische tijdlijn
- Blokkade-registratie UI (inline formulier, modal, of expandable section)
- Klantreis-samenvatting design op dashboard
- Contactvolgorde-kolom implementatie in DmuMatrix
- Responsive gedrag op tablet

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands) -- labels, tooltips, error messages
- Code comments and variable names in English
- Never change price data in `src/data/default-prices.ts` without approval
- Forms: always use react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes (`src/engine/__tests__/`)
- Path alias `@` = `/src`
- After approved changes: automatically commit AND push to remote
- Run `npm run build` before finishing -- must succeed without errors

## Standard Stack

### Core (already in project)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| React 19 | UI framework | Project stack |
| TypeScript | Type safety | Project stack |
| Vite 8 | Build tool | Project stack |
| Tailwind CSS 4 | Styling | Project stack, custom tokens |
| Zod | Schema validation | Forms pattern, contact.schema.ts |
| react-hook-form | Form management | ContactForm pattern |
| @tanstack/react-query | Server state | useContacts, useConversations hooks |
| Supabase | Database & auth | Backend |
| Zustand | Client state | useSchoolProfileStore |

### No New Dependencies
This phase requires zero new npm packages. All features are buildable with the existing stack.

## Architecture Patterns

### Recommended Change Sequence
```
1. src/models/school.ts          -- New DMU_POSITIONS, labels, hierarchy order
2. src/features/school-profile/schemas/contact.schema.ts  -- Update Zod enum
3. src/components/ui/DMUBadge.tsx -- New colors per UI-SPEC
4. src/db/operations.ts          -- Data migration function
5. src/features/school-profile/components/ContactForm.tsx  -- New dropdown options
6. src/features/school-profile/tabs/ContactsTab.tsx        -- View toggle + grouping
7. src/features/school-profile/components/ContactGroupHeader.tsx -- NEW
8. src/features/school-profile/components/CustomerJourneyTimeline.tsx -- NEW
9. src/features/school-profile/components/TimelineEntry.tsx -- NEW
10. src/features/school-profile/components/BlockadeForm.tsx -- NEW
11. src/features/school-profile/components/DmuMatrix.tsx   -- New column + roles
12. src/features/school-profile/components/CustomerJourneySummary.tsx -- NEW
13. src/features/school-profile/tabs/DashboardTab.tsx      -- Integrate summary
14. src/features/school-overview/DmuProgressIndicator.tsx  -- Type update
```

### Pattern 1: Central DMU Position Definition
**What:** All DMU role definitions (const array, type, labels, hierarchy order, badge styles) live in `src/models/school.ts`
**When to use:** Always -- this is the single source of truth

```typescript
// src/models/school.ts
export const DMU_POSITIONS = ['beslisser', 'inkoper', 'adviseur', 'gebruiker', 'beinvloeder', 'overig'] as const;
export type DMUPosition = typeof DMU_POSITIONS[number];

export const DMU_POSITION_LABELS: Record<DMUPosition, string> = {
  beslisser: 'Beslisser',
  inkoper: 'Inkoper',
  adviseur: 'Adviseur',
  gebruiker: 'Gebruiker',
  beinvloeder: 'Beinvloeder',
  overig: 'Overig',
};

// Hierarchy order for display sorting (beslisser first)
export const DMU_POSITION_ORDER: Record<DMUPosition, number> = {
  beslisser: 0,
  inkoper: 1,
  adviseur: 2,
  gebruiker: 3,
  beinvloeder: 4,
  overig: 5,
};
```

### Pattern 2: Supabase Data Migration (one-time update)
**What:** Update existing `dmu_position` values in the contacts table
**When to use:** At app startup or as an explicit migration step

```typescript
// Migration function in src/db/operations.ts
export async function migrateDmuPositions(): Promise<void> {
  const MIGRATION_KEY = 'dmu-position-migration-v2';
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

  const mapping: Record<string, string> = {
    coordinator: 'gebruiker',
    mt: 'beslisser',
    finance: 'inkoper',
    // 'overig' stays 'overig'
  };

  for (const [oldPos, newPos] of Object.entries(mapping)) {
    await supabase.from('contacts')
      .update({ dmu_position: newPos })
      .eq('dmu_position', oldPos);
  }

  localStorage.setItem(MIGRATION_KEY, 'true');
}
```

### Pattern 3: Timeline Data Aggregation
**What:** Merge conversations + system events into a single chronological timeline
**When to use:** CustomerJourneyTimeline component

```typescript
// Timeline entry union type
interface TimelineEntry {
  id: string;
  date: string;
  type: 'conversation' | 'blokkade' | 'status_change' | 'first_contact';
  contactId?: string;
  contactName?: string;
  contactDmuPosition?: DMUPosition;
  description: string;
  metadata?: Record<string, string>;
}

// Aggregate from existing data sources
function buildTimeline(
  conversations: Conversation[],
  systemEvents: SystemEvent[],
  contacts: Contact[],
): TimelineEntry[] {
  // Map conversations to timeline entries
  // Map system events (engagement_changed, pipeline_changed) to timeline entries
  // Filter blokkade events separately
  // Sort chronologically (newest first)
  // Mark first contact per school
}
```

### Pattern 4: Blokkade as System Event
**What:** Store blokkades in the existing `system_events` table with a new event type
**When to use:** BlockadeForm submission

```typescript
// New event type needed in SystemEvent interface
eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created' | 'engagement_changed' | 'blokkade_registered';

// Blokkade metadata structure
metadata: {
  contactId?: string;
  contactName?: string;
  description: string;
  resolved?: 'true' | 'false';
}
```

### Pattern 5: View Toggle with localStorage Persistence
**What:** Toggle between DMU-overzicht and Klantreis views
**When to use:** ContactsTab

```typescript
// Following the existing viewPreference pattern (D-07 from Phase 7)
const [viewMode, setViewMode] = useState<'dmu' | 'timeline'>(() => {
  return (localStorage.getItem('contacts-view-mode') as 'dmu' | 'timeline') ?? 'dmu';
});

const handleViewChange = (mode: 'dmu' | 'timeline') => {
  setViewMode(mode);
  localStorage.setItem('contacts-view-mode', mode);
};
```

### Anti-Patterns to Avoid
- **New Zustand store for view toggle:** Use localStorage directly, not persist middleware -- this is a simple UI preference
- **Separate API for blokkades:** Use existing system_events table and addSystemEvent function
- **Hardcoding DMU colors in multiple places:** Keep all DMU badge styles in DMUBadge.tsx, consuming the centralized DMU_POSITIONS type
- **Modifying Supabase DB schema:** The dmu_position column is already a plain string -- no ALTER TABLE needed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timeline date formatting | Custom date formatter | `Intl.DateTimeFormat('nl-NL', ...)` | Already used in ContactCard.tsx, consistent locale support |
| Contact order calculation | Complex sorting logic | Simple sort by earliest conversation date | Existing conversations data has dates, just `Math.min` over dates |
| View state persistence | Zustand store slice | `localStorage.getItem/setItem` | Matches existing `viewPreference` pattern, no need for reactive store |
| Blokkade storage | New Supabase table | `system_events` with `blokkade_registered` event type | Existing table, existing CRUD, existing React Query hooks |

## Common Pitfalls

### Pitfall 1: DMU Position Type Mismatch After Migration
**What goes wrong:** TypeScript complains because old position values (`coordinator`, `mt`, `finance`) still exist in the database but the type no longer accepts them
**Why it happens:** The Zod schema and TypeScript type are updated before all DB records are migrated
**How to avoid:** Run the data migration function before the app renders contact data. Add a fallback in `mapContactRow` that maps unknown positions to `overig`
**Warning signs:** Runtime errors when loading contacts, TypeScript errors in `DMUBadge`

### Pitfall 2: System Event Type Union Not Updated
**What goes wrong:** Adding `blokkade_registered` to system events fails because the `eventType` union in `SystemEvent` interface doesn't include it
**Why it happens:** The type is defined in `src/db/types.ts` as a string union
**How to avoid:** Update the `SystemEvent.eventType` union AND the `mapSystemEventRow` function. Also update any switch/if-else that filters on event type
**Warning signs:** Supabase inserts succeed but the type assertion in mapSystemEventRow breaks

### Pitfall 3: Contact Order Reactivity
**What goes wrong:** Contact order numbers don't update when a conversation is added or deleted
**Why it happens:** The order calculation is memoized or cached without proper dependency tracking
**How to avoid:** Compute contact order inside the component using `useMemo` with `conversations` as dependency (React Query already handles invalidation via useConversations)
**Warning signs:** Stale order numbers that only update on page refresh

### Pitfall 4: DMU Migration Runs on Every Page Load
**What goes wrong:** The migration function runs an UPDATE query on every page load, causing unnecessary DB writes
**Why it happens:** No guard check for whether migration has already run
**How to avoid:** Use a localStorage flag (`dmu-position-migration-v2`) checked before running any queries
**Warning signs:** Slow initial loads, unnecessary Supabase API calls in network tab

### Pitfall 5: Grouped Contacts with Empty Groups Showing
**What goes wrong:** Empty DMU role groups show with "0 contacten" headers
**Why it happens:** Iterating over all DMU_POSITIONS instead of only those with contacts
**How to avoid:** Filter groups: only render groups where `contacts.filter(c => c.dmuPosition === role).length > 0` (per UI-SPEC: "Empty groups: hidden entirely")
**Warning signs:** Visual clutter with empty section headers

### Pitfall 6: Blokkade Form Saving Without schoolId
**What goes wrong:** Blokkade system event inserted without schoolId
**Why it happens:** The BlockadeForm component doesn't receive schoolId from parent
**How to avoid:** Pass schoolId through from ContactsTab which gets it from useSchoolProfileStore
**Warning signs:** System event appears but isn't associated with any school

## Code Examples

### DMU Badge Update (from UI-SPEC)
```typescript
// src/components/ui/DMUBadge.tsx
import type { DMUPosition } from '@/models/school';
import { DMU_POSITION_LABELS } from '@/models/school';

const DMU_BADGE_STYLES: Record<DMUPosition, string> = {
  beslisser: 'bg-purple-100 text-purple-800',
  inkoper: 'bg-green-100 text-green-800',
  adviseur: 'bg-sky-100 text-sky-800',
  gebruiker: 'bg-blue-100 text-blue-800',
  beinvloeder: 'bg-amber-100 text-amber-800',
  overig: 'bg-neutral-100 text-neutral-700',
};
```

### Contact Schema Update
```typescript
// src/features/school-profile/schemas/contact.schema.ts
import { DMU_POSITIONS } from '@/models/school';

export const contactSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  dmuPosition: z.enum(DMU_POSITIONS, { error: 'DMU-positie is verplicht' }),
  // ... rest unchanged
});
```

### Contact Grouping Logic
```typescript
// In ContactsTab.tsx for DMU-overzicht view
import { DMU_POSITIONS, DMU_POSITION_ORDER } from '@/models/school';

const groupedContacts = DMU_POSITIONS
  .filter(role => contacts.some(c => c.dmuPosition === role))
  .map(role => ({
    role,
    contacts: contacts.filter(c => c.dmuPosition === role),
  }));
// Already sorted by DMU_POSITIONS array order (beslisser first)
```

### Contact Order Calculation
```typescript
// Compute contact order based on earliest conversation date
function getContactOrder(contacts: Contact[], conversations: Conversation[]): Map<string, number> {
  const firstDates = new Map<string, string>();
  for (const conv of conversations) {
    const existing = firstDates.get(conv.contactId);
    if (!existing || conv.date < existing) {
      firstDates.set(conv.contactId, conv.date);
    }
  }

  const sorted = [...firstDates.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b));

  const orderMap = new Map<string, number>();
  sorted.forEach(([contactId], index) => {
    orderMap.set(contactId, index + 1);
  });
  return orderMap;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4 DMU positions (coordinator, mt, finance, overig) | 6 DMU positions (beslisser, inkoper, adviseur, gebruiker, beinvloeder, overig) | Phase 18 | All DMU displays, badges, forms, exports |
| Flat contact list | Grouped by DMU role with hierarchy | Phase 18 | ContactsTab rendering |
| No customer journey view | Chronological timeline from conversations + events | Phase 18 | New view in ContactsTab |
| DmuMatrix without contact order | DmuMatrix with "Nr." column | Phase 18 | Dashboard display |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (bundled with Vite 8) |
| Config file | vitest.config in vite.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | DMU position assignment persists and is available everywhere | unit | `npx vitest run src/features/school-profile/__tests__/contacts.test.ts -x` | Needs update |
| SC-2 | ContactsTab DMU grouping with visual hierarchy | unit | `npx vitest run src/features/school-profile/tabs/__tests__/ContactsTab.test.tsx -x` | Wave 0 |
| SC-3 | Timeline builds correctly from conversations + system events | unit | `npx vitest run src/features/school-profile/components/__tests__/timeline.test.ts -x` | Wave 0 |
| SC-4 | CustomerJourneySummary derives correct data | unit | `npx vitest run src/features/school-profile/components/__tests__/journey-summary.test.ts -x` | Wave 0 |
| SC-5 | DMU position migration maps old -> new correctly | unit | `npx vitest run src/db/__tests__/dmu-migration.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/school-profile/__tests__/contacts.test.ts` -- update existing tests for new DMU positions
- [ ] `src/features/school-profile/components/__tests__/timeline.test.ts` -- timeline aggregation logic
- [ ] `src/features/school-profile/components/__tests__/journey-summary.test.ts` -- summary derivation
- [ ] `src/db/__tests__/dmu-migration.test.ts` -- migration mapping correctness
- [ ] `src/models/__tests__/school-crm.test.ts` -- update existing tests for new DMU type

## Key Integration Points

### Files That Import DMU_POSITIONS / DMUPosition
All of these must be updated when the position array changes:

| File | What Uses It |
|------|-------------|
| `src/models/school.ts` | Definition (source of truth) |
| `src/db/types.ts` | Contact interface type |
| `src/db/operations.ts` | Contact CRUD, mapContactRow |
| `src/db/migrations.ts` | V1 migration (uses old positions, needs guard) |
| `src/features/school-profile/schemas/contact.schema.ts` | Zod validation |
| `src/features/school-profile/components/ContactForm.tsx` | Dropdown options |
| `src/components/ui/DMUBadge.tsx` | Badge styles |
| `src/features/school-profile/components/WaitingForSelect.tsx` | Contact labels |
| `src/features/school-profile/components/DmuMatrix.tsx` | Matrix display |
| `src/models/__tests__/school-crm.test.ts` | Test assertions |
| `src/features/school-profile/__tests__/contacts.test.ts` | Test assertions |

### Supabase Considerations
- `contacts.dmu_position` is type `string` in DB -- no schema migration needed
- Data migration: UPDATE query mapping old values to new values
- No new tables needed -- blokkades go into `system_events`
- The `system_events.event_type` column is also type `string` -- no DB change needed for new event type
- `system_events.metadata` is JSONB -- can store blokkade description

### Data Already Available for Timeline
- **Conversations:** `useConversations(schoolId)` returns all conversations with dates, contactId, content
- **System Events:** `useSystemEvents(schoolId)` (if it exists) or direct Supabase query
- **Contact order:** Derivable from conversations by earliest date per contactId

## Open Questions

1. **System Events Hook**
   - What we know: System events are stored in Supabase and referenced in types, but need to verify if a `useSystemEvents` hook exists
   - What's unclear: May need to create a new React Query hook for system events
   - Recommendation: Check for existing hook; if missing, create `useSystemEvents` following the `useContacts` pattern

2. **Blokkade Resolution**
   - What we know: Blokkades can be registered (D-11), and the dashboard shows "Huidige blokkade" (UI-SPEC)
   - What's unclear: Whether blokkades can be marked as resolved
   - Recommendation: Add a `resolved` field in metadata; show only unresolved blokkades in dashboard summary

## Sources

### Primary (HIGH confidence)
- `src/models/school.ts` -- current DMU_POSITIONS definition, verified line 108
- `src/db/types.ts` -- Contact interface with dmuPosition field, verified line 14
- `src/lib/supabase/types.ts` -- dmu_position stored as string (no DB enum), verified line 150
- `src/db/operations.ts` -- Contact CRUD operations, addSystemEvent function
- `src/features/school-profile/schemas/contact.schema.ts` -- Zod schema using DMU_POSITIONS enum
- `src/components/ui/DMUBadge.tsx` -- Badge styles per position
- `18-CONTEXT.md` -- User decisions D-01 through D-14
- `18-UI-SPEC.md` -- Approved visual specifications

### Secondary (MEDIUM confidence)
- Existing test files (`contacts.test.ts`, `school-crm.test.ts`) -- patterns for test structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, existing patterns well documented
- Architecture: HIGH -- all integration points verified in source code, data model is flexible (string column)
- Pitfalls: HIGH -- based on direct code inspection, known TypeScript/Supabase patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable, internal project)
