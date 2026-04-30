---
phase: 21-dmu-export-upgrade
plan: 02
subsystem: export-pdf
tags: [dmu, pdf, cover-page, intro-section, product-advantages, react-pdf]
dependency_graph:
  requires:
    - phase: 21-dmu-export-upgrade/01
      provides: [DmuTag, DMU_TAG_MAP, filterByDmuTags, tagSchoolplanOpportunity, DMU_ASSUMPTIONS, CITO_PRODUCT_ADVANTAGES, extended-ExportConfig, extended-ReportData]
  provides:
    - CoverPage PDF component with full A4 layout
    - IntroSection for role-specific intro paragraphs
    - ProductInfoSection with DMU-filtered advantages and source citations
    - SchoolplanSection DMU tag filtering
    - D-07 schoolplan upload prompt
  affects: [export-ui, dmu-report-generation, export-panel]
tech_stack:
  added: []
  patterns: [cover-page-first-in-document, section-injection-after-summary, dmu-tag-filter-in-pdf-sections]
key_files:
  created:
    - src/features/export/pdf/components/CoverPage.tsx
    - src/features/export/pdf/components/IntroSection.tsx
    - src/features/export/pdf/components/ProductInfoSection.tsx
    - src/features/export/pdf/__tests__/CoverPage.test.ts
  modified:
    - src/features/export/pdf/styles.ts
    - src/features/export/pdf/ReportDocument.tsx
    - src/features/export/pdf/components/SchoolplanSection.tsx
key_decisions:
  - "Text fallback for Cito logo on cover page — replace with Image when cito-logo.png is provided"
  - "IntroSection renders only first assumption's introText for clean single-paragraph flow"
  - "ProductInfoSection placed after all report sections but before disclaimer for natural reading flow"
  - "SchoolplanSection generiek target skips filtering to show all opportunities"
patterns-established:
  - "Cover page as separate Page element before content page in react-pdf Document"
  - "Section injection via wrapper View in renderSection switch case"
requirements-completed: [SC-3, SC-5]
metrics:
  duration: 2min
  completed: 2026-03-26T22:17:51Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 3
  test_cases_added: 6
---

# Phase 21 Plan 02: PDF Components for DMU-Targeted Exports Summary

**Cover page with school/DMU branding, role-specific intro section, DMU-filtered product advantages with source citations, and schoolplan DMU filtering wired into ReportDocument.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T22:15:54Z
- **Completed:** 2026-03-26T22:17:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Full A4 cover page with school name, date, DMU target label, report type, and Cito branding (text fallback)
- Role-specific intro paragraph rendered from DMU assumptions after summary section
- Product advantages section with DMU-based filtering and source citations per advantage
- SchoolplanSection extended with DMU tag filtering using filterByDmuTags and tagSchoolplanOpportunity
- D-07 schoolplan upload prompt shown when no schoolplan opportunities exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CoverPage, IntroSection, and ProductInfoSection PDF components** - `eeb3f91` (feat)
2. **Task 2: Wire new components into ReportDocument and extend SchoolplanSection** - `3d05c3a` (feat)

## Files Created/Modified

- `src/features/export/pdf/components/CoverPage.tsx` - Full A4 cover page with logo text fallback, school name, date, DMU target, report type
- `src/features/export/pdf/components/IntroSection.tsx` - Role-specific intro paragraph from DMU assumptions
- `src/features/export/pdf/components/ProductInfoSection.tsx` - DMU-filtered product advantages with source citations
- `src/features/export/pdf/__tests__/CoverPage.test.ts` - Label mapping and text format tests
- `src/features/export/pdf/styles.ts` - Added cover page, intro, and advantage styles
- `src/features/export/pdf/ReportDocument.tsx` - Wired CoverPage as first page, IntroSection after summary, ProductInfoSection before disclaimer
- `src/features/export/pdf/components/SchoolplanSection.tsx` - Added DMU tag filtering with dmuTarget prop

## Decisions Made

- Text fallback for Cito logo — `<Text>Cito</Text>` instead of Image, with comment for future replacement
- IntroSection uses only first assumption's introText for a clean single-paragraph flow
- ProductInfoSection placed after all report sections but before disclaimer for natural reading order
- SchoolplanSection skips DMU filtering when dmuTarget is 'generiek' to show all opportunities

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components render real data from Plan 01 data files. Logo uses text fallback with clear comment for future image replacement.

## Next Phase Readiness

- All PDF components are wired and rendering. Plan 03 (export UI panel) can now build the user-facing export configuration and trigger PDF generation using these components.
- Cover page logo can be upgraded to an image when `src/assets/cito-logo.png` is provided.

## Self-Check: PASSED

- All 4 created files exist on disk
- Commit `eeb3f91` found in git log
- Commit `3d05c3a` found in git log
- 115 export tests pass, build clean

---
*Phase: 21-dmu-export-upgrade*
*Completed: 2026-03-26*
