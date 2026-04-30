---
phase: "19"
plan: "01"
subsystem: school-profile-conversations-actions
tags: [speech-to-text, kanban, conversation-form, action-items, confirm-dialog]
dependency_graph:
  requires: [phase-09-conversations-infra, phase-18-contactbeheer-upgrade]
  provides: [speech-input, conversation-delete, action-type-labels, action-deadlines, confirm-dialog-pattern]
  affects: [ConversationsTab, ActionKanban, ActionItemCard, ConversationForm, TimelineEntry]
tech_stack:
  added: [Web Speech API]
  patterns: [ConfirmDialog modal, useSpeechRecognition hook, inline-edit pattern, action type chips]
key_files:
  created:
    - src/components/ui/ConfirmDialog.tsx
    - src/hooks/useSpeechRecognition.ts
  modified:
    - src/db/types.ts
    - src/db/operations.ts
    - src/hooks/useConversations.ts
    - src/hooks/useActions.ts
    - src/features/school-profile/schemas/action.schema.ts
    - src/features/school-profile/components/ConversationForm.tsx
    - src/features/school-profile/components/ActionItem.tsx
    - src/features/school-profile/components/ActionKanban.tsx
    - src/features/school-profile/components/Timeline.tsx
    - src/features/school-profile/components/TimelineEntry.tsx
    - src/features/school-profile/tabs/ConversationsTab.tsx
    - src/features/school-overview/__tests__/filter.test.ts
    - src/features/school-profile/schemas/__tests__/crm-schemas.test.ts
decisions:
  - "IntakeModeToggle import kept but never rendered (D-05 hide-not-delete strategy)"
  - "Web Speech API with graceful degradation for unsupported browsers"
  - "ConfirmDialog as reusable component with configurable cancel labels per IC-07"
  - "Action type as free-text field with preset suggestions (bellen, mailen, offerte, intern overleg)"
  - "Always-visible inline input replaces toggle-based add form in kanban todo column"
metrics:
  duration: "~15 min"
  completed: "2026-03-25"
---

# Phase 19 Plan 01: Gesprekken-tab & Acties Upgrade Summary

Gesprekken-tab vereenvoudigd (AI-intake verborgen, spraak-naar-tekst, DMU contactdropdown) en acties kanban volledig uitgebreid met inline bewerking, type labels, deadlines en modale verwijder-bevestiging.

## What Was Built

### Data Layer (Task 1)
- Extended `ActionItem` interface with `type: string | null` and `dueDate: string | null`
- Updated action schema, `mapActionRow`, `addAction`, `updateAction` for new fields
- Added `deleteConversation` function to `operations.ts`
- Added `useDeleteConversation` hook

### Reusable Components (Task 2)
- **ConfirmDialog**: Modal confirmation with configurable title, body, confirm/cancel labels, backdrop click dismiss, Escape key handling
- **useSpeechRecognition**: Web Speech API hook for Dutch (`nl-NL`) speech-to-text with `isSupported`, `isListening`, `start`, `stop`

### ConversationForm Upgrade (Task 3)
- AI intake mode toggle hidden (code kept, never rendered per D-05)
- Microphone button next to "Inhoud" label for speech-to-text input
- Contact dropdown shows "Name -- DMU-positie -- Engagement-status" per IC-02
- Speech error handling with user-friendly Dutch message

### ActionItemCard Upgrade (Task 4)
- Inline title editing: click to edit, blur/Enter saves, Escape cancels
- Action type as colored chip (bellen=blue, mailen=purple, offerte=amber, intern overleg=neutral)
- Type setter dropdown with preset options + custom free text
- Deadline field with calendar icon, overdue visual (red border + bold red date)
- Delete uses ConfirmDialog modal instead of inline confirmation

### ActionKanban Upgrade (Task 5)
- Always-visible inline input at bottom of "Te doen" column (Trello-style, no toggle)
- Column header icons (clipboard, play-circle, check-circle)
- Per-column contextual empty state messages per UI spec
- Passes schoolId to ActionItemCard for inline mutations

### ConversationsTab Integration (Task 6)
- Conversation deletion via ConfirmDialog in timeline entries
- Removed redundant top-level "+ Actie toevoegen" button (replaced by always-visible kanban input)
- Delete button added to TimelineEntry with trash icon

### Build Verification (Task 7)
- Fixed JSX namespace reference in ActionKanban
- Suppressed unused IntakeModeToggle import
- Updated test fixtures with new ActionItem fields
- `npm run build` passes clean

## Commits

| Hash | Message |
|------|---------|
| d3e0fa1 | feat(19-01): extend ActionItem data layer with type, dueDate, deleteConversation |
| 99f75ec | feat(19-01): add ConfirmDialog component and useSpeechRecognition hook |
| 9911df7 | feat(19-01): upgrade ConversationForm with speech-to-text and DMU contact dropdown |
| 59e7d7c | feat(19-01): upgrade ActionItemCard with inline edit, type labels, deadline, modal delete |
| 399d967 | feat(19-01): upgrade ActionKanban with always-visible input, column icons, empty states |
| 9034c59 | feat(19-01): integrate conversation deletion and remove redundant action button |
| 4d179df | fix(19-01): resolve TypeScript errors from ActionItem type extension |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all features are fully wired with real data sources and mutations.

## Self-Check: PASSED

All 12 key files verified present. All 7 commit hashes verified in git log.
