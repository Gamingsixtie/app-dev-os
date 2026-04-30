---
phase: 21-dmu-export-upgrade
plan: 01
subsystem: export
tags: [dmu, data-layer, types, tag-filter]
dependency_graph:
  requires: []
  provides: [DmuTag, DMU_TAG_MAP, filterByDmuTags, tagSchoolplanOpportunity, DMU_ASSUMPTIONS, CITO_PRODUCT_ADVANTAGES, extended-ExportConfig, extended-ReportData]
  affects: [export-pdf, export-ui, dmu-report-generation]
tech_stack:
  added: []
  patterns: [keyword-based-tag-matching, generic-tag-filter, dmu-role-targeting]
key_files:
  created:
    - src/features/export/utils/dmu-tag-filter.ts
    - src/features/export/utils/__tests__/dmu-tag-filter.test.ts
    - src/data/dmu-assumptions.ts
    - src/data/__tests__/dmu-assumptions.test.ts
    - src/data/cito-product-info.ts
    - src/data/__tests__/cito-product-info.test.ts
  modified:
    - src/features/export/types.ts
key_decisions:
  - "Keyword stem 'betrouwba' instead of full word 'betrouwbaar' for Dutch inflection matching"
  - "Platform-wide advantages (moduleId: 'platform') included alongside module-specific entries"
  - "Default tags [tijdwinst, financieel, strategisch] when no keywords match ensures visibility across major DMU roles"
metrics:
  duration: "6min"
  completed: "2026-03-26T22:13:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
  test_cases_added: 33
requirements:
  - SC-1
  - SC-2
  - SC-4
---

# Phase 21 Plan 01: Data Foundation for DMU-Targeted Exports Summary

Tag-based DMU filtering utility with 6 tags, 4 role-assumption entries with editable Dutch intro text, and 10 Cito product advantages with source citations across 7 modules.

## What Was Built

### Task 1: DMU Tag Filter Utility
- Created `DmuTag` type with 6 values: tijdwinst, financieel, strategisch, dagelijks-gebruik, kwaliteit, compliance
- `DMU_TAG_MAP` maps each of 4 DmuTarget roles to their relevant tags
- `filterByDmuTags<T>` generic filter returns items where at least one tag overlaps with the target role
- `tagSchoolplanOpportunity` assigns tags based on keyword matching in Dutch text (theme + explanation)
- 17 test cases covering all DMU roles, keyword matching, and edge cases

### Task 2: Data Files and Type Extensions
- `DMU_ASSUMPTIONS` with 4 entries (coordinator, mt, finance, generiek) each containing Dutch introText and focusAreas
- `CITO_PRODUCT_ADVANTAGES` with 10 tagged entries covering rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, cognitieve-capaciteiten, and platform
- Extended `ExportConfig` with optional `assumptionOverrides` field
- Extended `ReportData` with optional `dmuAssumptions`, `productAdvantages`, and `tags` on schoolplanOpportunities
- 16 test cases validating data structure, content requirements, and tag validity

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `13a96dc` | feat(21-01): add DMU tag filter utility with tests |
| 2 | `34bc076` | feat(21-01): add DMU assumptions data, product info, and extend export types |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dutch word inflection in keyword matching**
- **Found during:** Task 1
- **Issue:** Keyword "betrouwbaar" does not match inflected form "betrouwbare" because both are 11 characters (differ at last char)
- **Fix:** Used stem "betrouwba" which matches both "betrouwbaar" and "betrouwbare"
- **Files modified:** src/features/export/utils/dmu-tag-filter.ts

## Verification

- All 33 new test cases pass
- `npm run build` passes without type errors
- Full test suite: 2227 passed, 10 pre-existing failures (all in worktree artifacts or unrelated ComparisonChart test)

## Known Stubs

None - all data is populated with real content and all types are fully defined.

## Self-Check: PASSED
