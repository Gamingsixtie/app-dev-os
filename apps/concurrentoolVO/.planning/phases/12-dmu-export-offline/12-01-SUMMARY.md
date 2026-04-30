---
phase: 12-dmu-export-offline
plan: 01
subsystem: export
tags: [react-pdf, svg, bar-chart, schoolplan, dmu, pdf-generation]

requires:
  - phase: 11-waarde-voorbij-prijs
    provides: "MigrationResult with timeSavings, multiYear, breakEven data"
  - phase: 14-schoolplan-analyse
    provides: "SchoolplanAnalysisRow with opportunities and annotations"
provides:
  - "PdfBarChart SVG component for visual cost comparison in PDF"
  - "SchoolplanSection for optional schoolplan opportunities in PDF"
  - "DMU-targeted section ordering with schoolplan support"
  - "Multi-page PDF wrap support for long reports"
  - "Testable pure functions: calculateBarLayout, getSummaryBullets"
affects: [12-02, 12-03, export]

tech-stack:
  added: []
  patterns: ["Pure function extraction for react-pdf component testing", "SVG bar chart via @react-pdf/renderer primitives"]

key-files:
  created:
    - src/features/export/pdf/components/PdfBarChart.tsx
    - src/features/export/pdf/components/SchoolplanSection.tsx
    - src/features/export/pdf/__tests__/PdfBarChart.test.ts
    - src/features/export/pdf/__tests__/dmu-filters.test.ts
    - src/features/export/pdf/__tests__/SummarySection.test.ts
  modified:
    - src/features/export/types.ts
    - src/features/export/pdf/styles.ts
    - src/features/export/pdf/dmu-filters.ts
    - src/features/export/pdf/ReportDocument.tsx
    - src/features/export/ExportTab.tsx
    - src/features/export/pdf/components/SummarySection.tsx

key-decisions:
  - "Pure calculateBarLayout function extracted from PdfBarChart for unit testing without react-pdf renderer"
  - "Schoolplan section placed last in all DMU reorder arrays as supplementary context"
  - "View wrap on content container for multi-page overflow instead of fixed page breaks"

patterns-established:
  - "Extract pure calculation functions from react-pdf components for testability"
  - "Provider chart colors as shared constant (PROVIDER_CHART_COLORS)"

requirements-completed: [EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04]

duration: 6min
completed: 2026-03-24
---

# Phase 12 Plan 01: DMU Export Enhancement Summary

**SVG bar chart for provider cost comparison, SchoolplanSection for optional opportunities, DMU-targeted summaries, and multi-page wrap support in PDF reports**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T21:23:22Z
- **Completed:** 2026-03-24T21:29:01Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- PdfBarChart renders proportional SVG bars from provider cost data with nl-NL EUR formatting
- SchoolplanSection conditionally renders schoolplan opportunities with status badges
- DMU-targeted section ordering extended with schoolplan as supplementary section
- ReportDocument supports multi-page content overflow via wrap prop
- 23 unit tests covering bar layout calculations, DMU filter logic, and summary bullet generation

## Task Commits

Each task was committed atomically:

1. **Task 1: PdfBarChart SVG component + SchoolplanSection + extended types and tests** - `ee4c7a6` (feat, TDD)
2. **Task 2: Wire PdfBarChart + SchoolplanSection into ReportDocument with multi-page support** - `edd9a9b` (feat)

## Files Created/Modified
- `src/features/export/pdf/components/PdfBarChart.tsx` - SVG bar chart with pure calculateBarLayout function
- `src/features/export/pdf/components/SchoolplanSection.tsx` - Optional schoolplan opportunities section
- `src/features/export/pdf/__tests__/PdfBarChart.test.ts` - 6 tests for bar layout calculations
- `src/features/export/pdf/__tests__/dmu-filters.test.ts` - 10 tests for DMU section ordering
- `src/features/export/pdf/__tests__/SummarySection.test.ts` - 7 tests for summary bullet generation
- `src/features/export/types.ts` - Added schoolplanOpportunities to ReportData
- `src/features/export/pdf/styles.ts` - Added chartContainer and chartTitle styles
- `src/features/export/pdf/dmu-filters.ts` - Added schoolplan SectionId and reorder entries
- `src/features/export/pdf/ReportDocument.tsx` - Integrated PdfBarChart, SchoolplanSection, wrap support
- `src/features/export/ExportTab.tsx` - Fetches schoolplan data via useSchoolplanAnalysis hook
- `src/features/export/pdf/components/SummarySection.tsx` - Exported getSummaryBullets for testing

## Decisions Made
- Extracted pure `calculateBarLayout` function from PdfBarChart to enable unit testing without react-pdf renderer dependencies
- Placed schoolplan section last in all DMU reorder arrays since it is supplementary context
- Used `<View wrap>` on content container for multi-page overflow (Page already wraps by default in react-pdf v4)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `as const` type assertion on ternary expression**
- **Found during:** Task 2 (ExportTab schoolplan mapping)
- **Issue:** TypeScript `erasableSyntaxOnly` does not allow `as const` on ternary expressions
- **Fix:** Changed `(annotation?.status ?? 'open') as const` to explicit union type assertion
- **Files modified:** src/features/export/ExportTab.tsx
- **Verification:** Build passes for ExportTab changes
- **Committed in:** edd9a9b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript syntax fix. No scope creep.

## Issues Encountered
- Pre-existing build errors (49 TypeScript errors across multiple files from prior phases) unrelated to this plan's changes. The calculateComparison API signature change from Phase 10.2 affects ExportTab line 50 but is identical to errors in 4 other files -- out of scope for this plan.

## Known Stubs
None -- all components render real data from existing hooks and engines.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PdfBarChart and SchoolplanSection ready for use in DMU-specific PDF templates (plan 12-02)
- Multi-page wrap support enables longer combined reports
- Test infrastructure established for PDF component testing

## Self-Check: PASSED

All 6 key files found. Both task commits (ee4c7a6, edd9a9b) verified in git log.

---
*Phase: 12-dmu-export-offline*
*Completed: 2026-03-24*
