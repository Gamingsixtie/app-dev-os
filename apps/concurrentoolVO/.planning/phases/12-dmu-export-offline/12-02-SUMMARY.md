---
phase: 12-dmu-export-offline
plan: 02
subsystem: export
tags: [clipboard, clipboard-api, dmu-export, react, typescript]

requires:
  - phase: 12-dmu-export-offline-01
    provides: PDF export infrastructure, ExportTab, ReportData types
provides:
  - Clipboard copy utility with HTML + plain text formatting
  - ClipboardButton component with visual feedback
  - DMU-targeted conclusion text for clipboard content
affects: [export, dmu-export]

tech-stack:
  added: []
  patterns: [ClipboardItem API with writeText fallback, DMU-focused content generation]

key-files:
  created:
    - src/lib/clipboard.ts
    - src/lib/__tests__/clipboard.test.ts
    - src/features/export/components/ClipboardButton.tsx
  modified:
    - src/features/export/ExportTab.tsx

key-decisions:
  - "No external clipboard library - native ClipboardItem API with writeText fallback"
  - "HTML + plain text dual format for rich paste in email/Teams"

patterns-established:
  - "Clipboard content builder pattern: buildClipboardContent returns { html, plain } for dual-format copy"
  - "DMU-focused conclusion switching based on dmuTarget with generic fallback"

requirements-completed: [EXPORT-05]

duration: 3min
completed: 2026-03-24
---

# Phase 12 Plan 02: Clipboard Copy Summary

**Clipboard copy with Dutch-formatted HTML+plain text, DMU-targeted conclusions, and ClipboardButton with visual feedback in ExportTab**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T21:43:37Z
- **Completed:** 2026-03-24T21:46:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- buildClipboardContent produces Dutch-formatted plain text and HTML with school data, provider totals, time savings, and DMU-focused conclusion
- copyToClipboard writes HTML+plain via ClipboardItem with text-only fallback
- ClipboardButton renders in ExportTab with "Gekopieerd!" visual confirmation for 2 seconds
- 10 unit tests covering all DMU targets, provider filtering, and edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Clipboard formatting + copy utility with tests** - `500815b` (feat)
2. **Task 2: ClipboardButton component + wire into ExportTab** - `8c9e755` (feat)

## Files Created/Modified
- `src/lib/clipboard.ts` - buildClipboardContent and copyToClipboard utilities
- `src/lib/__tests__/clipboard.test.ts` - 10 tests for clipboard formatting
- `src/features/export/components/ClipboardButton.tsx` - Copy button with outline style and copied state
- `src/features/export/ExportTab.tsx` - Added ClipboardButton below PdfDownloadButton

## Decisions Made
- Used native ClipboardItem API with writeText fallback instead of external library
- HTML + plain text dual format for rich paste support in email and Teams
- DMU conclusion falls back to generic text when specific data (hours, priceDifference, breakEven) is missing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS18048 breakEven possibly undefined**
- **Found during:** Task 2 (build verification)
- **Issue:** `data.migration?.breakEvenMonth` returns `undefined` when migration is null, but check used `!== null` which doesn't narrow `undefined`
- **Fix:** Changed `breakEven !== null` to `breakEven != null` (loose equality covers both null and undefined)
- **Files modified:** src/lib/clipboard.ts
- **Verification:** Build passes without clipboard-related TS errors
- **Committed in:** 8c9e755 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript strictness fix. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in src/lib/offline-queue.ts (from Phase 12-03) prevent clean `npm run build`. These are out of scope for this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Clipboard functionality complete and tested
- ExportTab now has both PDF download and clipboard copy buttons
- Ready for Phase 12-03 offline support or any further export enhancements

## Self-Check: PASSED

All 5 files verified present. Both task commits (500815b, 8c9e755) verified in git log.

---
*Phase: 12-dmu-export-offline*
*Completed: 2026-03-24*
