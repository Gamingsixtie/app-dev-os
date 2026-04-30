# Phase 15: DMU Klantreis Registratie - Research

**Researched:** 2026-03-23
**Domain:** Contact engagement tracking, decision-network visualization, Supabase schema extension
**Confidence:** HIGH

## Summary

Phase 15 adds per-contact engagement status tracking to the existing CRM-lite system. The core feature is a 6-status engagement flow (Nog niet benaderd, In gesprek, Positief, Wacht op intern, Akkoord, Afgehaakt) per DMU contact, with a "Wacht op" link between contacts, stagnation detection (30+ days), and a DMU decision matrix on the school dashboard. The feature also extends the school overview with DMU-status filtering and compact DMU indicators on school cards and kanban cards.

This is a UI-heavy phase with a moderate database schema extension. All patterns are well-established in the codebase: the `setPipelineStatus` + system event pattern for status changes, `LostDealDialog` for mandatory reason collection, `PipelineBadge` for status badges, `FilterBar` for chip-based filtering, and React Query hooks for data fetching. The new engagement status column on `contacts` and the `engagement_status_log` table are the only schema additions.

**Primary recommendation:** Follow the established `setPipelineStatus` pattern exactly -- add `engagement_status` and `waiting_for_contact_id` columns to contacts, create a `setEngagementStatus()` operation that logs to system_events, and build UI components by extending existing ContactCard, SchoolCard, and FilterBar patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 6 statussen per contactpersoon: Nog niet benaderd -> In gesprek -> Positief -> Wacht op intern -> Akkoord -> Afgehaakt
- **D-02:** Vrij heen en weer -- elke fase-overgang is toegestaan zonder restricties
- **D-03:** Bij "Afgehaakt": verplichte reden opgeven (vergelijkbaar met school-pipeline "Verloren")
- **D-04:** Bij "Wacht op intern": mogelijkheid om te registreren bij WIE binnen de school (link naar andere contactpersoon)
- **D-05:** Elke statuswijziging wordt automatisch gelogd als systeemevent in de school-tijdlijn met datum en optionele notitie
- **D-06:** School-pipeline en contactpersoon-status zijn onafhankelijk beheerd, maar bij mismatch toont het systeem een suggestie
- **D-07:** DMU-beslissingsoverzicht als matrix/tabel op de bestaande Overzicht-tab (dashboard) -- geen nieuwe tab
- **D-08:** Matrix-kolommen: Naam | DMU-rol | Bevoegdheid | Status | Wacht op
- **D-09:** "Wacht op" kolom toont de naam van de contactpersoon waar de DMU op wacht (link naar andere contact), of "--" als niet van toepassing
- **D-10:** Compacte DMU-voortgangsindicator op schoolkaarten in het overzicht
- **D-11:** Zelfde mini DMU-indicator ook op kanban-kaarten in de Pipeline Kanban-view
- **D-12:** Stagnatie-drempel: 30 dagen in dezelfde fase
- **D-13:** Inline oranje waarschuwingsbadge naast de contactpersoon in de DMU-matrix en op de schoolkaart
- **D-14:** Extra filterrij onder de bestaande pipeline-filter in het schooloverzicht: "Toon scholen met DMU in: [status]"
- **D-15:** Pipeline-filter en DMU-status-filter zijn combineerbaar (AND-logica)

### Claude's Discretion
- Exacte kleurcodes per engagement-status (aansluiten bij bestaande statusbadge-patronen)
- Layout en spacing van de DMU-matrix op het dashboard
- Design van de mini DMU-indicator op school- en kanban-kaarten
- UX voor het instellen van "Wacht op" (dropdown van bestaande contactpersonen)
- Mismatch-suggestie UI (toast, inline banner, of badge)
- Stagnatie-badge design en positie
- DMU-filter UI-patroon (chips, dropdown, of checkbox-filter)
- Empty state wanneer school geen contactpersonen heeft

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands) -- labels, tooltips, error messages
- Code comments and variable names in English
- Never modify price data in `src/data/default-prices.ts`
- Forms: always react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context or prop drilling
- Tests required for engine changes -- `src/engine/__tests__/`
- Path alias `@` = `/src`
- Run `npm run build` before done -- must succeed without errors
- Use `z.input<typeof schema>` for CRUD function params (Zod v4 pattern)

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.3 | Database operations, schema migration | Already in use for all CRM data |
| @tanstack/react-query | ^5.94.5 | Data fetching hooks with cache invalidation | Established pattern for all Supabase data |
| react-hook-form | ^7.71.2 | Form handling for status change dialogs | All forms use this + Zod |
| zod | ^4.3.6 | Schema validation | Established for all form schemas |
| zustand | ^5.0.12 | Store hydration (school-profile store) | CRM fields hydrated via store |
| tailwindcss | ^4.2.2 | Styling for all new UI components | Project standard |

### No New Dependencies Needed
This phase requires zero new npm packages. All patterns can be implemented with the existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
  models/
    school.ts                          # Add ENGAGEMENT_STATUSES, EngagementStatus type
  db/
    types.ts                           # Extend Contact interface with engagementStatus, waitingForContactId, engagementStatusUpdatedAt
    operations.ts                      # Add setEngagementStatus(), engagement_status_changed event type
  hooks/
    useContacts.ts                     # Already exists -- no changes needed (contacts re-fetched on invalidation)
  features/
    school-profile/
      schemas/
        engagement-status.schema.ts    # Zod schema for status change form (reason field)
      components/
        EngagementBadge.tsx            # Status badge component (like PipelineBadge)
        EngagementStatusSelect.tsx     # Dropdown to change engagement status inline
        DropOffReasonDialog.tsx        # Dialog for "Afgehaakt" reason (like LostDealDialog)
        WaitingForSelect.tsx           # Dropdown to pick "Wacht op" contact
        DmuMatrix.tsx                  # Table component for dashboard
        DmuMismatchBanner.tsx          # Inline suggestion when pipeline/DMU mismatch
      tabs/
        DashboardTab.tsx               # Extend with DmuMatrix section
    school-overview/
      components/
        DmuProgressIndicator.tsx       # Compact indicator "DMU 3/5" for cards
        DmuStatusFilter.tsx            # Second filter row for DMU status
      SchoolCard.tsx                   # Extend with DmuProgressIndicator
      SchoolOverviewPage.tsx           # Add DmuStatusFilter and filtering logic
      PipelineKanbanView.tsx           # Add DmuProgressIndicator to kanban cards
  supabase/
    migrations/
      005_engagement_status.sql        # Schema migration
```

### Pattern 1: Engagement Status as Contact Column (not separate table)
**What:** Add `engagement_status`, `waiting_for_contact_id`, `engagement_status_updated_at`, and `drop_off_reason` columns directly to the `contacts` table.
**When to use:** When status is a 1:1 property of an entity, not a many-to-many relationship.
**Why:** Follows the existing pattern where `pipeline_status` lives on the `schools` table. Avoids unnecessary joins. The status history is captured via `system_events` (just like pipeline changes).

```sql
-- Migration 005_engagement_status.sql
ALTER TABLE contacts
  ADD COLUMN engagement_status TEXT NOT NULL DEFAULT 'nog-niet-benaderd',
  ADD COLUMN waiting_for_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN engagement_status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN drop_off_reason TEXT;

CREATE INDEX idx_contacts_engagement_status ON contacts(school_id, engagement_status);
```

### Pattern 2: setEngagementStatus following setPipelineStatus pattern
**What:** A single operation function that updates the contact status, logs a system event, and handles the "Afgehaakt" reason.
**When to use:** For all engagement status changes.

```typescript
// Source: existing setPipelineStatus in src/db/operations.ts (adapted)
export async function setEngagementStatus(
  schoolId: string,
  contactId: string,
  newStatus: EngagementStatus,
  note?: string,
  dropOffReason?: string,
  waitingForContactId?: string | null,
): Promise<void> {
  const user = await getCurrentUser();

  // Get current status for the event log
  const { data: contact, error: fetchError } = await supabase.from('contacts')
    .select('engagement_status, name')
    .eq('id', contactId)
    .single();
  if (fetchError || !contact) throw fetchError ?? new Error('Contact niet gevonden');

  const oldStatus = contact.engagement_status;

  // Update contact
  const updateData: Record<string, unknown> = {
    engagement_status: newStatus,
    engagement_status_updated_at: new Date().toISOString(),
  };
  if (newStatus === 'afgehaakt' && dropOffReason) {
    updateData.drop_off_reason = dropOffReason;
  }
  if (newStatus === 'wacht-op-intern') {
    updateData.waiting_for_contact_id = waitingForContactId ?? null;
  } else {
    updateData.waiting_for_contact_id = null; // Clear when leaving "wacht op intern"
  }

  const { error } = await supabase.from('contacts')
    .update(updateData)
    .eq('id', contactId);
  if (error) throw error;

  // Log system event
  await supabase.from('system_events').insert({
    school_id: schoolId,
    event_type: 'engagement_status_changed',
    description: `${contact.name}: ${oldStatus} -> ${newStatus}`,
    metadata: {
      contactId,
      oldStatus,
      newStatus,
      ...(note ? { note } : {}),
      ...(dropOffReason ? { dropOffReason } : {}),
    },
    user_id: user.id,
  });
}
```

### Pattern 3: EngagementBadge following PipelineBadge pattern
**What:** Reusable badge component with color-per-status mapping.
**When to use:** Everywhere engagement status is displayed.

```typescript
// Follow PipelineBadge.tsx pattern exactly
const ENGAGEMENT_STATUSES = [
  'nog-niet-benaderd', 'in-gesprek', 'positief',
  'wacht-op-intern', 'akkoord', 'afgehaakt'
] as const;

// Recommended color mapping (aligning with existing badge palette):
const ENGAGEMENT_BADGE_STYLES: Record<EngagementStatus, string> = {
  'nog-niet-benaderd': 'bg-neutral-100 text-neutral-600 border-neutral-300',  // grey - not started
  'in-gesprek':        'bg-blue-50 text-blue-700 border-blue-200',             // blue - active
  'positief':          'bg-emerald-50 text-emerald-700 border-emerald-200',    // green - positive
  'wacht-op-intern':   'bg-amber-50 text-amber-700 border-amber-200',         // amber - waiting
  'akkoord':           'bg-green-50 text-green-700 border-green-200',          // strong green - agreed
  'afgehaakt':         'bg-red-50 text-red-700 border-red-200',               // red - dropped off
};
```

### Pattern 4: DMU Filter with AND Logic
**What:** Second filter row below the existing pipeline filter, same chip-button pattern.
**When to use:** SchoolOverviewPage filtering.

```typescript
// The filtering logic:
// 1. Apply owner filter (existing)
// 2. Apply pipeline filter (existing)
// 3. Apply DMU status filter (new) -- school passes if ANY of its contacts has the selected engagement status
// AND logic: all active filters must match

function schoolHasDmuStatus(school: SchoolRecord, dmuFilter: EngagementStatus): boolean {
  return school.contacts.some(c => c.engagementStatus === dmuFilter);
}
```

**Important:** The `useSchools` hook fetches schools WITHOUT contacts (contacts are loaded separately per school). For the DMU filter to work on the overview page, contacts need to be available. Two options:
- **Option A (recommended):** Extend `getAllSchools()` to join contacts in the query. This is efficient since RLS already scopes to team.
- **Option B:** Add a separate hook to fetch all contacts for the team and merge client-side.

Option A is recommended because it follows the existing pattern where `SchoolCard` already reads `school.contacts` for primary contact display (the `mapSchoolRow` sets `contacts: []` but SchoolCard checks it).

### Pattern 5: Stagnation Detection (computed, not stored)
**What:** Calculate days-in-current-status client-side from `engagement_status_updated_at`.
**When to use:** Display stagnation warnings in DMU matrix and school cards.

```typescript
function isStagnating(contact: Contact, thresholdDays: number = 30): boolean {
  if (!contact.engagementStatusUpdatedAt) return false;
  if (contact.engagementStatus === 'akkoord' || contact.engagementStatus === 'afgehaakt') return false;
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(contact.engagementStatusUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceUpdate >= thresholdDays;
}
```

### Pattern 6: Mismatch Detection (computed)
**What:** Compare school pipeline status against DMU engagement statuses and suggest action.
**When to use:** Displayed as inline banner on dashboard.

```typescript
// Example mismatch rules:
// - Most DMU members are "Akkoord" but school pipeline is before "Offerte" -> suggest advancing pipeline
// - School is "Gewonnen" but DMU members still in early stages -> suggest updating DMU statuses
// - School is in "Demo/Presentatie" but no DMU contacts in "In gesprek" or later -> suggest updating

interface MismatchSuggestion {
  message: string;
  type: 'advance-pipeline' | 'update-dmu';
}
```

### Anti-Patterns to Avoid
- **Separate engagement_status_log table for history:** Don't create a separate log table. System events already serve this purpose (D-05). The Timeline component already renders system events.
- **Storing stagnation as a boolean column:** Don't store computed state. Calculate from `engagement_status_updated_at` client-side. It changes every render anyway.
- **Adding engagement status to the school-profile Zustand store:** Contacts are already fetched via React Query hooks (`useContacts`). The engagement status is a property of the contact, not separate store state. Use mutations that invalidate the contacts query key.
- **Creating a new tab for DMU overview:** Decision D-07 explicitly says no new tab -- add to existing Overzicht/Dashboard tab.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status badge rendering | Custom styled spans | EngagementBadge component following PipelineBadge pattern | Consistent styling, reusable across matrix/cards/kanban |
| Mandatory reason dialog | Inline text input | DropOffReasonDialog following LostDealDialog pattern | Modal with proper UX, cancel support, validation |
| Status change + event logging | Two separate API calls | Single `setEngagementStatus()` operation | Atomicity, consistent with `setPipelineStatus` pattern |
| Date difference calculation | Manual Date arithmetic | `Math.floor((now - date) / (ms per day))` utility | Already used elsewhere, simple enough without library |

## Common Pitfalls

### Pitfall 1: Contacts Not Available on School Overview
**What goes wrong:** The `getAllSchools()` function returns schools with `contacts: []` (empty). SchoolCard currently accesses `school.contacts` but this works because the data was pre-loaded in some views. For DMU filtering and the progress indicator, contacts MUST be loaded.
**Why it happens:** `mapSchoolRow` explicitly sets `contacts: []` with comment "Loaded separately via hooks". But on the overview page, individual school hooks aren't called.
**How to avoid:** Modify `getAllSchools()` to join contacts via Supabase query: `.select('*, owner:users!owner_id(name), contacts(*)')` and map them in `mapSchoolRow`.
**Warning signs:** DMU progress indicator always shows "DMU 0/0" on school cards, DMU filter has no effect.

### Pitfall 2: waitingForContactId Becomes Dangling Reference
**What goes wrong:** Contact A has `waiting_for_contact_id = B`. Contact B is deleted. Contact A now points to a deleted contact.
**Why it happens:** The FK constraint uses `ON DELETE SET NULL` which is correct, but the UI must handle `null` gracefully even when the status is still "wacht-op-intern".
**How to avoid:** Always check both `waitingForContactId !== null` AND the referenced contact exists in the loaded contacts array before displaying the name. Show "Onbekend contact" or clear the field if the reference is gone.
**Warning signs:** "Wacht op" column shows empty or crashes when a referenced contact was deleted.

### Pitfall 3: SystemEvent eventType Union Not Updated
**What goes wrong:** TypeScript type for `SystemEvent.eventType` is a union: `'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created'`. Adding `'engagement_status_changed'` without updating the type causes type errors or silent failures.
**Why it happens:** The type is defined in `src/db/types.ts` as a string literal union.
**How to avoid:** Add `'engagement_status_changed'` to the `SystemEvent.eventType` union. Also update the Timeline dot color mapping to include the new event type.
**Warning signs:** TypeScript compilation errors, or timeline events showing wrong dot color.

### Pitfall 4: Engagement Status Default for Existing Contacts
**What goes wrong:** Existing contacts in the database get `'nog-niet-benaderd'` as default, but `engagement_status_updated_at` defaults to `now()` (the migration time). This means stagnation detection would incorrectly calculate 0 days for all existing contacts.
**Why it happens:** The `DEFAULT now()` in the migration sets the timestamp to when the migration runs, not when the contact was created.
**How to avoid:** Set the default for existing rows to the contact's `created_at` timestamp in the migration:
```sql
ALTER TABLE contacts ADD COLUMN engagement_status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- Then backfill:
UPDATE contacts SET engagement_status_updated_at = created_at;
```
**Warning signs:** All existing contacts immediately show stagnation warnings after deployment.

### Pitfall 5: DMU Filter Performance with Many Schools
**What goes wrong:** Filtering by DMU status requires iterating over all contacts for each school.
**Why it happens:** Client-side filtering with nested arrays.
**How to avoid:** Since the scale is 50-200 schools (per Phase 7 decision), this is not a real performance concern. Simple `.some()` is fast enough. Do NOT over-engineer with server-side filtering.
**Warning signs:** N/A at this scale.

## Code Examples

### DmuMatrix Component Structure
```typescript
// Source: follows existing table patterns in the codebase
interface DmuMatrixProps {
  contacts: Contact[];
  allContacts: Contact[]; // For "Wacht op" name resolution
  onStatusChange: (contactId: string, newStatus: EngagementStatus) => void;
  schoolId: string;
}

// Matrix columns per D-08:
// Naam | DMU-rol | Bevoegdheid | Status | Wacht op
// Each row shows stagnation warning inline (D-13) when applicable
```

### DmuProgressIndicator for SchoolCard
```typescript
// Compact indicator per D-10: "DMU 3/5 checkmark" or colored dots
interface DmuProgressIndicatorProps {
  contacts: Contact[];
}

function DmuProgressIndicator({ contacts }: DmuProgressIndicatorProps) {
  if (contacts.length === 0) return null;

  const positive = contacts.filter(c =>
    c.engagementStatus === 'positief' ||
    c.engagementStatus === 'akkoord'
  ).length;

  const hasStagnation = contacts.some(c => isStagnating(c));

  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-neutral-500">
      <span>DMU {positive}/{contacts.length}</span>
      {hasStagnation && (
        <span className="w-2 h-2 rounded-full bg-orange-400" title="Stagnatie gedetecteerd" />
      )}
    </span>
  );
}
```

### Extending getAllSchools with Contacts Join
```typescript
// In operations.ts -- modify getAllSchools:
export async function getAllSchools(): Promise<SchoolRecord[]> {
  const { data, error } = await supabase.from('schools')
    .select('*, owner:users!owner_id(name), contacts(*)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    ...mapSchoolRow(row),
    contacts: (row.contacts ?? []).map(mapContactRow),
  }));
}
```

### DropOffReasonDialog (following LostDealDialog)
```typescript
// Source: adapted from src/features/school-profile/components/LostDealDialog.tsx
interface DropOffReasonDialogProps {
  contactName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}
// Same modal pattern: overlay + centered card, textarea for reason, required field
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (bundled with Vite) |
| Config file | vite.config.ts (vitest config inline) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | 6 engagement statuses defined with correct labels | unit | `npx vitest run src/models/__tests__/engagement-status.test.ts -x` | -- Wave 0 |
| D-02 | All status transitions allowed (no validation blocking) | unit | `npx vitest run src/models/__tests__/engagement-status.test.ts -x` | -- Wave 0 |
| D-03 | "Afgehaakt" requires reason field | unit | `npx vitest run src/features/school-profile/schemas/__tests__/engagement-status.test.ts -x` | -- Wave 0 |
| D-05 | Status change creates system event | unit | `npx vitest run src/db/__tests__/engagement-operations.test.ts -x` | -- Wave 0 |
| D-12 | Stagnation detected after 30 days | unit | `npx vitest run src/models/__tests__/engagement-status.test.ts -x` | -- Wave 0 |
| D-14/D-15 | DMU filter with AND logic on school overview | unit | `npx vitest run src/features/school-overview/__tests__/dmu-filter.test.ts -x` | -- Wave 0 |
| D-06 | Mismatch detection between pipeline and DMU statuses | unit | `npx vitest run src/models/__tests__/engagement-status.test.ts -x` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npm run build`
- **Phase gate:** Full suite green + build succeeds before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/models/__tests__/engagement-status.test.ts` -- covers D-01, D-02, D-12, D-06
- [ ] `src/features/school-profile/schemas/__tests__/engagement-status.test.ts` -- covers D-03
- [ ] `src/db/__tests__/engagement-operations.test.ts` -- covers D-05
- [ ] `src/features/school-overview/__tests__/dmu-filter.test.ts` -- covers D-14, D-15

## Database Schema Design

### Migration: 005_engagement_status.sql

```sql
-- Add engagement tracking columns to contacts table
ALTER TABLE contacts
  ADD COLUMN engagement_status TEXT NOT NULL DEFAULT 'nog-niet-benaderd',
  ADD COLUMN waiting_for_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN engagement_status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN drop_off_reason TEXT;

-- Backfill: set engagement_status_updated_at to contact creation time for existing rows
UPDATE contacts SET engagement_status_updated_at = created_at;

-- Index for filtering by engagement status within a school
CREATE INDEX idx_contacts_engagement_status ON contacts(school_id, engagement_status);
```

### RLS Consideration
The existing RLS policies on `contacts` (team-scoped access) already cover the new columns. No new RLS policies needed since we're adding columns, not tables.

### Type Additions to src/models/school.ts

```typescript
export const ENGAGEMENT_STATUSES = [
  'nog-niet-benaderd', 'in-gesprek', 'positief',
  'wacht-op-intern', 'akkoord', 'afgehaakt'
] as const;
export type EngagementStatus = typeof ENGAGEMENT_STATUSES[number];

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  'nog-niet-benaderd': 'Nog niet benaderd',
  'in-gesprek': 'In gesprek',
  'positief': 'Positief',
  'wacht-op-intern': 'Wacht op intern',
  'akkoord': 'Akkoord',
  'afgehaakt': 'Afgehaakt',
};
```

### Type Extension to src/db/types.ts

```typescript
// Extend Contact interface:
export interface Contact {
  // ... existing fields ...
  engagementStatus: EngagementStatus;
  waitingForContactId: string | null;
  engagementStatusUpdatedAt: string;
  dropOffReason: string | null;
}

// Extend SystemEvent eventType:
eventType: 'pipeline_changed' | 'comparison_created' | 'prices_updated' | 'school_created' | 'engagement_status_changed';
```

## Open Questions

1. **SchoolCard contacts data loading**
   - What we know: `getAllSchools()` currently returns `contacts: []`. SchoolCard reads `school.contacts` for primary contact display but this appears to work in extended mode because the data is somehow available.
   - What's unclear: Need to verify whether contacts are actually populated on SchoolCard via a different mechanism, or if primary contact display on SchoolCard is currently broken.
   - Recommendation: Inspect runtime behavior. If contacts ARE populated, the join already exists somewhere. If not, add contacts join to `getAllSchools()`.

2. **Supabase migration deployment**
   - What we know: Migrations live in `supabase/migrations/`. Currently at 004.
   - What's unclear: Whether migrations are applied automatically via Supabase CLI or manually.
   - Recommendation: Create `005_engagement_status.sql` following the existing naming pattern. The planner should include a note about applying the migration.

## Sources

### Primary (HIGH confidence)
- `src/db/types.ts` -- Contact interface, SystemEvent type (lines 10-48)
- `src/db/operations.ts` -- setPipelineStatus pattern (lines 430-469), addSystemEvent (lines 471-483)
- `src/models/school.ts` -- PIPELINE_STATUSES, DMU_POSITIONS, AUTHORITY_LEVELS patterns
- `src/components/ui/PipelineBadge.tsx` -- Badge style pattern
- `src/features/school-profile/components/LostDealDialog.tsx` -- Mandatory reason dialog pattern
- `src/features/school-overview/FilterBar.tsx` -- Filter chip pattern
- `src/features/school-overview/SchoolOverviewPage.tsx` -- Filtering + view composition
- `src/features/school-profile/tabs/DashboardTab.tsx` -- Dashboard tab structure (integration point for DMU matrix)
- `src/features/school-overview/SchoolCard.tsx` -- School card structure (integration point for DMU indicator)
- `src/features/school-overview/PipelineKanbanView.tsx` -- Kanban card structure (integration point for DMU indicator)
- `src/hooks/useContacts.ts` -- React Query hooks pattern for contacts
- `supabase/migrations/001_initial_schema.sql` -- Contacts table schema

### Secondary (MEDIUM confidence)
- `src/features/school-profile/components/ContactCard.tsx` -- Contact card with DMUBadge usage
- `src/models/timeline.ts` -- Timeline event building pattern
- `src/features/school-profile/components/Timeline.tsx` -- Timeline rendering with event type dot colors

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all patterns exist in codebase
- Architecture: HIGH - direct extension of existing Contact/Pipeline/Timeline patterns
- Pitfalls: HIGH - identified through code reading, all verifiable
- Database schema: HIGH - simple ALTER TABLE with column additions, follows existing convention

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable patterns, no external dependency changes expected)
