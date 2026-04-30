---
phase: "19"
plan: "03"
subsystem: school-profile-actions
tags: [action-kanban, inline-edit, type-labels, deadlines, modal-delete]
dependency_graph:
  requires: [19-01]
  provides: [inline-action-input, inline-title-edit, action-type-chips, deadline-overdue-marking, modal-delete-actions]
  affects: [ActionKanban, ActionItem, ConversationsTab]
tech_stack:
  added: []
  patterns: [inline-edit with auto-save, type color map, overdue date detection, ConfirmDialog integration]
key_files:
  created: []
  modified:
    - src/features/school-profile/components/ActionKanban.tsx
    - src/features/school-profile/components/ActionItem.tsx
    - src/features/school-profile/tabs/ConversationsTab.tsx
decisions:
  - "Always-visible inline input replaces toggle-based add form (Trello-style)"
  - "Action type stored as free-text with preset suggestions dropdown"
  - "Overdue detection compares dueDate to today's date string"
  - "Column icons as inline SVGs (clipboard, play-circle, check-circle)"
metrics:
  duration: "included in 19-01 execution"
  completed: "2026-03-25"
---

# Phase 19 Plan 03: ActionKanban & ActionItem Upgrade Summary

Implemented as part of the 19-01 unified execution. All plan 03 features are live.

## What Was Built

### Always-Visible Inline Input (D-09)
- Text input always visible at bottom of "Te doen" column
- Type title + Enter to create action instantly
- Placeholder: "Nieuwe actie..."
- Removed `showAddForm` toggle state entirely

### Inline Title Editing (D-12, IC-04)
- Click action title to enter edit mode
- Auto-saves on blur or Enter
- Cancels on Escape, reverting to original title
- Auto-focus and select-all on edit start

### Type Labels (D-10, IC-05)
- Colored chip display: bellen (blue), mailen (purple), offerte (amber), intern overleg (neutral)
- Type selector dropdown with preset options
- "Type verwijderen" option to clear type
- Custom types fall back to neutral colors

### Deadline Field (D-13, IC-06)
- Calendar icon + formatted date display (nl-NL locale)
- Overdue marking: red card border (`border-red-300`) + red bold date text
- Date picker via native `<input type="date">`
- Clear deadline button with "Deadline verwijderen" aria-label

### Modal Delete (D-14, D-15)
- ConfirmDialog: "Actie verwijderen" / "Actie bewaren"
- Replaced old inline "Verwijderen?" text pattern
- Trash icon visible on card hover

### Visual Refinements (D-16, IC-09)
- Column header icons (clipboard, play-circle, check-circle)
- Per-column empty states with instructive Dutch text
- Created date display on cards
- Hover shadow and border transitions

## Self-Check: PASSED

All features verified in codebase. Build passes.
