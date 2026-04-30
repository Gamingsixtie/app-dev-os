# Phase 19: Gesprekken-tab & Acties Upgrade - Research

**Researched:** 2026-03-25
**Domain:** React UI upgrade — speech-to-text, form simplification, kanban enhancement, confirmation dialogs
**Confidence:** HIGH

## Summary

This phase upgrades two existing sections of the school profile: the Gesprekken (Conversations) tab and the Acties (Actions) kanban board. The work is primarily UI-focused with one browser API integration (Web Speech API for Dutch speech-to-text) and a Supabase schema migration (adding `type` and `due_date` columns to the `actions` table).

The codebase already has strong foundations: `ConversationForm.tsx` already has the AI intake code to hide, `ActionKanban.tsx` already has an inline add form (behind a button click), and dialog patterns exist throughout the app (PipelineReasonDialog, LostDealDialog, DropOffReasonDialog). The contact dropdown with DMU badges and engagement status can reuse existing `DMUBadge` and `EngagementBadge` components.

**Primary recommendation:** This is a UI enhancement phase. No new libraries needed. Web Speech API is native browser API. The main risk is the speech API's browser support (Chrome/Edge only) — handle gracefully with disabled state per D-04.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Microfoon-icoon naast het notitie-tekstveld in ConversationForm. Klik = start opname, klik nogmaals = stop. Tekst verschijnt live in het veld via Web Speech API.
- **D-02:** Spraak wordt direct in het bestaande notitie-tekstveld ingevoegd (live transcriptie, geen preview-stap). Gebruiker kan daarna handmatig bijwerken.
- **D-03:** Taal is vast ingesteld op Nederlands (`lang='nl-NL'`).
- **D-04:** Als de browser geen Web Speech API ondersteunt: microfoonknop wordt getoond maar uitgeschakeld (disabled state) met tooltip "Spraakherkenning niet ondersteund in deze browser".
- **D-05:** AI-intake gerelateerde code (IntakeModeToggle, StreamingExtraction, DiffView) wordt verborgen maar niet verwijderd uit ConversationForm. AI-modus toggle wordt hidden — het formulier opent standaard in handmatige modus zonder zichtbare keuze.
- **D-06:** Contactpersoon-selectie via dropdown met DMU-rol badge en engagement-status per contactpersoon. Bijv: "Jan de Vries -- Beslisser -- In gesprek".
- **D-07:** Contactpersoon is een verplicht veld bij het vastleggen van een gesprek. Elk gesprek is met iemand.
- **D-08:** Formulier blijft inline in de pagina (huidige stijl) — verschijnt boven de tijdlijn wanneer je op "+ Gesprek vastleggen" klikt.
- **D-09:** Altijd zichtbaar invoerveld onderaan de 'Te doen' kolom in het kanban-bord. Typ titel + Enter = actie aangemaakt in 'Te doen' status. Geen extra klikken nodig (Trello-stijl).
- **D-10:** Vrije tekst titel + optioneel type-label per actie. Actietypes als labels/chips: bellen, mailen, offerte, intern overleg (of vrije tekst). Type wordt na aanmaak ingesteld, niet tijdens inline invoer.
- **D-11:** Nieuwe actie kan optioneel aan een gesprek worden gekoppeld via dropdown met recente gesprekken. Bestaand `conversationId` veld in ActionItem wordt hergebruikt.
- **D-12:** Klik op actietitel in de kaart -> wordt een bewerkbaar tekstveld. Bewerkingen worden direct opgeslagen (auto-save). Minimale UI-overhead.
- **D-13:** Optioneel deadline-veld per actie (datumpicker). Verlopen deadlines worden visueel gemarkeerd (rode rand of badge).
- **D-14:** Modale bevestigingsdialoog bij verwijderen van gesprekken en acties. "Weet u het zeker?" tekst met "Annuleren" en "Verwijderen" knoppen (verwijderen in rood). Consistent met bestaande dialog guards.
- **D-15:** Bevestiging alleen bij verwijderen — statuswijzigingen (drag-and-drop in kanban) zonder bevestiging, die zijn makkelijk omkeerbaar.
- **D-16:** Subtiele verbeteringen: betere spacing, kolomkoppen met iconen, actiekaartjes met datum en gekoppeld-gesprek-indicator, hover-states. Bouwt voort op bestaand design zonder complete redesign.

### Claude's Discretion
- Exacte microfoon-icoon styling en animatie tijdens opname
- Web Speech API implementation details (SpeechRecognition configuratie, interim results)
- Hoe het type-label veld eruitziet in de actiekaart (chip, badge, of tekst)
- Deadline-veld UI in de actiekaart (inline datumpicker of klik-om-toe-te-voegen)
- Exacte styling van de bevestigingsdialoog
- Hoe disabled microfoonknop eruit ziet
- ActionItem model uitbreiding voor `type` en `dueDate` velden

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core (already installed, no additions needed)

| Library | Purpose | Why Standard |
|---------|---------|--------------|
| React 19 + TypeScript | UI framework | Project standard |
| react-hook-form + Zod | Form handling + validation | CLAUDE.md mandated |
| @tanstack/react-query | Data fetching | Project standard for all Supabase data |
| @dnd-kit/core + @dnd-kit/sortable | Kanban drag-and-drop | Already used in ActionKanban |
| Tailwind CSS v4 | Styling | Project standard with Cito design tokens |
| Supabase | Backend / database | Project standard |
| Vitest + jsdom | Testing | Project standard |

### Browser API (no install)

| API | Purpose | Browser Support |
|-----|---------|----------------|
| Web Speech API (SpeechRecognition) | Dutch speech-to-text for conversation notes | Chrome 33+, Edge 79+. NOT supported in Firefox or Safari. |

**No new npm packages required.** Everything needed is already installed or is a native browser API.

## Architecture Patterns

### Current File Structure (files to modify)

```
src/
  features/school-profile/
    tabs/ConversationsTab.tsx          # Orchestrator — minor changes
    components/
      ConversationForm.tsx             # MAJOR: hide AI, add speech, upgrade contact dropdown
      IntakeModeToggle.tsx             # HIDE: rendered conditionally (never)
      StreamingExtraction.tsx          # HIDE: remains importable but never shown
      DiffView.tsx                     # HIDE: remains importable but never shown
      ActionKanban.tsx                 # MAJOR: always-visible input, visual refinements
      ActionItem.tsx                   # MAJOR: inline edit, type label, deadline, modal delete
    schemas/
      conversation.schema.ts           # No changes needed (contactId already required)
      action.schema.ts                 # EXTEND: add type, dueDate
  db/
    types.ts                           # EXTEND: ActionItem + type + dueDate
    operations.ts                      # EXTEND: addAction/updateAction for new fields, add deleteConversation
  hooks/
    useActions.ts                      # UPDATE: pass new fields through mutations
    useConversations.ts                # ADD: useDeleteConversation hook
  components/ui/
    DMUBadge.tsx                       # REUSE as-is in contact dropdown
    EngagementBadge.tsx                # REUSE as-is in contact dropdown
```

### New Files to Create

```
src/
  hooks/useSpeechRecognition.ts        # Custom hook wrapping Web Speech API
  components/ui/ConfirmDialog.tsx       # Reusable modal confirmation dialog
```

### Pattern 1: Web Speech API Hook (`useSpeechRecognition`)

**What:** Custom React hook that encapsulates SpeechRecognition lifecycle.
**When to use:** In ConversationForm, next to the content textarea.

```typescript
// src/hooks/useSpeechRecognition.ts
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  lang = 'nl-NL',
  onResult,
  onInterimResult,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Feature detection
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;       // Keep listening until stopped
    recognition.interimResults = true;   // Show partial results live
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final && onResult) onResult(final);
      if (interim && onInterimResult) onInterimResult(interim);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, lang, onResult, onInterimResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  return { isSupported, isListening, start, stop };
}
```

**Key decisions:**
- `continuous: true` — user talks until they click stop, not just one sentence
- `interimResults: true` — live preview of transcription in the textarea (D-02)
- `onResult` appends finalized text to the textarea value
- `onInterimResult` shows gray/italic preview of current recognition (discretion area)

### Pattern 2: Reusable ConfirmDialog

**What:** Modal confirmation dialog matching existing app patterns.
**When to use:** Delete conversations and actions (D-14).

```typescript
// src/components/ui/ConfirmDialog.tsx
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Pattern source:** Follows exact structure of `PipelineReasonDialog.tsx` — fixed overlay with z-50, white card, flex justify-end buttons. Danger variant uses red bg for confirm button.

### Pattern 3: Always-Visible Inline Input (Trello-style)

**What:** The "add action" input is always visible at the bottom of the 'Te doen' column, not behind a button click.
**Current state:** ActionKanban already has an inline input, but it's hidden behind a `showAddForm` state toggle with a "+ Actie toevoegen" button.
**Change:** Remove the toggle — always show the input. Remove the button that opens the form.

### Pattern 4: Inline Title Editing (D-12)

**What:** Click on action title in the card to edit it in-place.
**Pattern:** Same as `EditableField` component mentioned in STATE.md (Phase 11 decision). Click to activate edit mode, auto-save on blur or Enter, cancel on Escape.

### Pattern 5: Contact Dropdown with Badges (D-06)

**What:** Enhanced `<select>` or custom dropdown showing contact name + DMU position + engagement status.
**Limitation:** Native `<select>` elements cannot render React components (badges) inside `<option>`. Two options:
1. **Simple approach (recommended):** Native `<select>` with text-only options: "Jan de Vries -- Beslisser -- In gesprek"
2. **Rich approach:** Custom dropdown using a div-based listbox with actual DMUBadge and EngagementBadge components

**Recommendation:** Use approach 1 (text-based) for the `<select>` in the form, but render the selected contact's badges below/beside the dropdown as a visual confirmation. This avoids custom dropdown complexity while still showing status information.

### Anti-Patterns to Avoid
- **Custom dropdown from scratch:** Don't build a full custom select component — native `<select>` with enriched text labels is sufficient
- **Removing AI code:** D-05 explicitly says HIDE, not DELETE. Keep all imports and components, just never render them
- **Adding speech library:** Web Speech API is native — don't install `react-speech-recognition` or similar wrappers
- **Inline edit without auto-save:** D-12 requires auto-save on blur — don't add a "save" button to inline edits

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech-to-text | External speech library | Web Speech API (native) | Browser-native, no bundle size, supports nl-NL |
| Confirmation dialog | One-off confirm() calls | Reusable ConfirmDialog component | D-14 needs it for both conversations AND actions |
| Drag-and-drop | New DnD library | @dnd-kit (already installed) | Already working in ActionKanban |
| Date picker | Custom date picker | Native `<input type="date">` | Consistent with existing date inputs in ConversationForm |

## Common Pitfalls

### Pitfall 1: Web Speech API TypeScript Types
**What goes wrong:** TypeScript does not include SpeechRecognition types by default. Build errors on `window.SpeechRecognition`.
**Why it happens:** SpeechRecognition is non-standard (prefixed in Chrome as `webkitSpeechRecognition`).
**How to avoid:** Add type declarations in the hook file or in a `.d.ts` file:
```typescript
// In the hook or in src/types/speech.d.ts
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
```
**Warning signs:** "Property 'SpeechRecognition' does not exist on type 'Window'" at build time.

### Pitfall 2: SpeechRecognition Auto-Stop
**What goes wrong:** Chrome stops the recognition after a few seconds of silence.
**Why it happens:** `continuous: true` helps but Chrome still auto-stops after ~5-10 seconds of silence.
**How to avoid:** In the `onend` handler, if the user hasn't clicked stop, restart recognition. Track intentional vs unintentional stop via a ref.
**Warning signs:** User is talking, recognition stops mid-sentence.

### Pitfall 3: Missing deleteConversation
**What goes wrong:** D-14 requires delete confirmation for conversations, but there is NO `deleteConversation` function in `operations.ts` and NO `useDeleteConversation` hook.
**Why it happens:** Conversations were never deletable before this phase.
**How to avoid:** Must create `deleteConversation` in `operations.ts` AND `useDeleteConversation` in `useConversations.ts` before implementing the confirmation dialog.
**Warning signs:** Trying to wire up delete button with no backend function.

### Pitfall 4: Supabase Migration for New ActionItem Fields
**What goes wrong:** Adding `type` and `due_date` columns requires a Supabase migration AND updating `mapActionRow` in operations.ts.
**Why it happens:** The `actions` table in Supabase has no `type` or `due_date` columns currently.
**How to avoid:** Create a new SQL migration file, update `mapActionRow`, update `addAction`/`updateAction` to handle new fields, and update the ActionItem interface in `types.ts`.
**Warning signs:** Supabase errors on insert/update with unknown columns.

### Pitfall 5: Hiding AI Intake Without Breaking Imports
**What goes wrong:** Simply removing the IntakeModeToggle render breaks if other parts of the code depend on the state flow.
**Why it happens:** ConversationForm has complex state management around `intakeMode`, `isAnalyzing`, `extractionResult`, etc.
**How to avoid:** Keep all AI state and imports. Simply hard-code `intakeMode = 'manual'` and remove the IntakeModeToggle render. The AI code paths become dead code but remain compilable.
**Warning signs:** Build errors from removing imports too aggressively.

### Pitfall 6: ActionKanban Inline Input Loses Focus on Re-render
**What goes wrong:** The always-visible input field loses focus when actions list updates (React Query invalidation triggers re-render).
**Why it happens:** Uncontrolled input in a component that re-renders on data changes.
**How to avoid:** Use a `useRef` for the input and manage focus explicitly. Consider optimistic updates or debounced invalidation.
**Warning signs:** User types, action is created, input loses focus.

## Code Examples

### Hiding AI Intake (D-05)

In `ConversationForm.tsx`, replace the IntakeModeToggle render with nothing and force manual mode:

```typescript
// Remove this render (keep the import):
// {!isEditing && (
//   <IntakeModeToggle mode={intakeMode} onChange={setIntakeMode} />
// )}

// Hard-code manual mode — AI state remains but is never activated:
const [intakeMode] = useState<'manual' | 'ai'>('manual');
// Remove setIntakeMode since it's never called
```

### Contact Dropdown with Status (D-06)

```typescript
<select {...register('contactId')} className="...">
  {contacts.length === 0 && (
    <option value="">Geen contactpersonen</option>
  )}
  {contacts.map(c => (
    <option key={c.id} value={c.id}>
      {c.name} — {DMU_POSITION_LABELS[c.dmuPosition]} — {ENGAGEMENT_STATUS_LABELS[c.engagementStatus]}
    </option>
  ))}
</select>
```

### Supabase Migration (new columns)

```sql
-- Add type and due_date columns to actions table
ALTER TABLE actions ADD COLUMN type TEXT DEFAULT NULL;
ALTER TABLE actions ADD COLUMN due_date DATE DEFAULT NULL;
```

### Updated ActionItem Interface

```typescript
export interface ActionItem {
  id: string;
  schoolId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  type: string | null;          // NEW: bellen, mailen, offerte, intern overleg, or custom
  dueDate: string | null;       // NEW: ISO date string
  conversationId: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Updated Action Schema

```typescript
export const actionSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  type: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  conversationId: z.string().nullable().default(null),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.confirm()` | Modal dialog component | Modern React | Better UX, consistent styling |
| External speech libraries | Web Speech API native | Chrome 33+ (2014) | No bundle size, native performance |
| ActionItem inline confirm text | Modal ConfirmDialog | This phase (D-14) | Current ActionItem uses inline "Verwijderen?" text — upgrade to modal |

**Note on current delete UX:** ActionItem.tsx currently has an inline confirm pattern (click X -> shows "Verwijderen?" text -> auto-resets after 3 seconds). D-14 upgrades this to a proper modal dialog.

## Project Constraints (from CLAUDE.md)

- All UI text in Dutch (Nederlands) -- labels, tooltips, error messages
- Code comments and variable names in English
- Forms: always react-hook-form + Zod schema
- State via Zustand + persist middleware -- no new React Context
- `@` path alias = `/src`
- After approved changes: commit AND push automatically
- Run `npm run build` before completion -- must succeed without errors
- Never modify price data in `src/data/default-prices.ts`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| useSpeechRecognition hook returns isSupported=false when API missing | unit | `npx vitest run src/hooks/__tests__/useSpeechRecognition.test.ts -x` | Wave 0 |
| Contact dropdown shows name + DMU + engagement in ConversationForm | unit | `npx vitest run src/features/school-profile/__tests__/conversation-form.test.tsx -x` | Wave 0 |
| AI intake toggle is not rendered in ConversationForm | unit | `npx vitest run src/features/school-profile/__tests__/conversation-form.test.tsx -x` | Wave 0 |
| ActionItem inline edit saves on blur | unit | `npx vitest run src/features/school-profile/__tests__/action-item.test.tsx -x` | Wave 0 |
| ConfirmDialog renders with correct labels and fires callbacks | unit | `npx vitest run src/components/ui/__tests__/ConfirmDialog.test.tsx -x` | Wave 0 |
| Action schema accepts type and dueDate fields | unit | `npx vitest run src/features/school-profile/schemas/__tests__/action-schema.test.ts -x` | Wave 0 |
| Overdue deadline gets red visual marker | unit | `npx vitest run src/features/school-profile/__tests__/action-item.test.tsx -x` | Wave 0 |
| deleteConversation operation works | unit | existing `conversations.test.ts` can be extended | Partial |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npm run build`
- **Phase gate:** Full suite green + build clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useSpeechRecognition.test.ts` -- speech hook unit tests (mock window.SpeechRecognition)
- [ ] `src/features/school-profile/__tests__/conversation-form.test.tsx` -- ConversationForm tests for hidden AI, contact dropdown
- [ ] `src/features/school-profile/__tests__/action-item.test.tsx` -- ActionItem inline edit, type label, deadline display
- [ ] `src/components/ui/__tests__/ConfirmDialog.test.tsx` -- ConfirmDialog renders and fires events
- [ ] `src/features/school-profile/schemas/__tests__/action-schema.test.ts` -- Updated action schema validation

## Open Questions

1. **SpeechRecognition TypeScript declarations scope**
   - What we know: Need `webkitSpeechRecognition` type declarations for Chrome support
   - What's unclear: Whether to extend global Window interface in a `.d.ts` file or inline in the hook
   - Recommendation: Create `src/types/speech-recognition.d.ts` for clean separation. The hook itself should not contain global type augmentations.

2. **Supabase migration deployment**
   - What we know: The project has a `supabase/migrations/001_initial_schema.sql` file
   - What's unclear: Whether migrations are applied manually or via CI. No additional migration files exist beyond 001.
   - Recommendation: Create `supabase/migrations/002_action_type_deadline.sql` with ALTER TABLE statements. Document that it needs manual application.

3. **Custom dropdown vs native select for contact picker**
   - What we know: Native `<select>` cannot render React component badges inside options
   - What's unclear: Whether text-only representation ("Naam -- Rol -- Status") meets the user's visual expectation from D-06
   - Recommendation: Start with native select + text representation. If user wants richer UI, upgrade to a custom listbox in a follow-up.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files listed in canonical_refs were read directly
- `src/db/types.ts` -- Current ActionItem interface (no type/dueDate fields)
- `src/db/operations.ts` -- Current CRUD operations (no deleteConversation exists)
- `supabase/migrations/001_initial_schema.sql` -- Current DB schema for actions table
- `src/features/school-profile/components/PipelineReasonDialog.tsx` -- Dialog pattern reference

### Secondary (MEDIUM confidence)
- [MDN SpeechRecognition docs](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) -- API reference
- [Can I Use: Speech Recognition](https://caniuse.com/speech-recognition) -- Browser support data

### Tertiary (LOW confidence)
- Chrome auto-stop behavior after silence -- based on developer community reports, not official docs. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, everything already installed
- Architecture: HIGH -- all files read, patterns clear, existing code well understood
- Pitfalls: HIGH -- identified 6 concrete pitfalls from codebase analysis (missing deleteConversation, TypeScript types, etc.)
- Web Speech API behavior: MEDIUM -- browser API specifics may vary, especially auto-stop and Dutch accuracy

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain, no fast-moving dependencies)
