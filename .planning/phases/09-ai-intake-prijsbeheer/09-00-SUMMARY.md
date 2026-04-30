---
phase: 09-ai-intake-prijsbeheer
plan: 00
subsystem: test-infrastructure
tags: [test-stubs, vitest, wave-0]
dependency_graph:
  requires: []
  provides: [test-stubs-intake, test-stubs-pricing, test-stubs-streaming]
  affects: [09-01, 09-02, 09-03, 09-04]
tech_stack:
  added: []
  patterns: [it.todo() stubs for TDD RED phase preparation]
key_files:
  created:
    - src/models/__tests__/price-deviation.test.ts
    - src/features/school-profile/schemas/__tests__/intake-extraction.test.ts
    - src/features/school-profile/__tests__/diff-view-logic.test.ts
    - src/features/school-profile/__tests__/intake-merge.test.ts
    - src/hooks/__tests__/useSchoolPrices.test.ts
    - api/__tests__/extract-document.test.ts
    - src/features/school-profile/__tests__/document-extraction.test.ts
    - src/lib/__tests__/ai-intake-v2.test.ts
  modified: []
decisions: []
metrics:
  duration: 96s
  completed: "2026-03-22T20:50:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 09 Plan 00: Test Stub Scaffolding Summary

8 vitest stub files with 39 it.todo() tests covering price deviation, intake extraction schema, diff view, merge logic, school price hooks, document extraction, and AI streaming v2.

## What Was Done

### Task 1: Foundation layer test stubs (Plan 01 coverage)

Created 2 test stub files for the foundation layer features:

- **price-deviation.test.ts** (8 todos): Tests for `checkPriceDeviation` (deviation detection, threshold, missing pub price) and `getSchoolPriceStatus` (stale, manual, verified, unknown states)
- **intake-extraction.test.ts** (5 todos): Tests for `IntakeExtractionSchemaV2` validation (contactPersonen, actiePunten, pipelineSignaal, v1 compatibility, optional fields)

**Commit:** `198302c`

### Task 2: UI logic, hooks, and streaming test stubs (Plans 02-04 coverage)

Created 6 test stub files covering the remaining plan features:

- **diff-view-logic.test.ts** (5 todos): Diff computation for new/existing/conflict items, defaults, and editing
- **intake-merge.test.ts** (4 todos): Append-only merge for modules, contacts, actions, and moduleSetups
- **useSchoolPrices.test.ts** (4 todos): School price CRUD hooks (list, create, activate, delete)
- **extract-document.test.ts** (5 todos): Document text extraction (PDF, Excel, Word, plain text, unsupported)
- **document-extraction.test.ts** (4 todos): Extraction preview logic (new, conflict, deviation warning, confirm)
- **ai-intake-v2.test.ts** (4 todos): SSE streaming and v2 schema parsing with Dutch error messages

**Commit:** `56e656a`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

All 8 files are intentionally stub-only with `it.todo()` tests. This is the plan's explicit goal: Plans 01-04 will populate these stubs with real assertions as they implement the corresponding features.

## Verification

- `npx vitest run` on all 8 files: 39 todo tests, 0 failures, 0 errors
- All test files placed in correct `__tests__/` directories adjacent to their future source modules
- All source imports commented out to prevent import errors until source files exist

## Self-Check: PASSED

- All 8 test stub files confirmed on disk
- Commits `198302c` and `56e656a` verified in git log
