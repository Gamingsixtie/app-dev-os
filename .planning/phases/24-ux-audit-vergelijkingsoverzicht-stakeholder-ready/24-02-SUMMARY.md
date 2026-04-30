---
phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready
plan: 02
subsystem: ui
tags: [react, collapse-expand, progressive-disclosure, ai-hero, schoolplan]

# Dependency graph
requires:
  - phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready (plan 01)
    provides: SectionBand layout, alternating color bands, section reorder
provides:
  - Collapsible AI hero with samenvatting preview and SchoolplanBanner integration
  - onAnalysisComplete callback pattern from AnalysisPanel to parent
  - SchoolplanContextCard encouraging upload state
affects: [ai-advies, price-comparison-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [lift-state-up via onAnalysisComplete callback, collapsible hero with progressive disclosure]

key-files:
  created: []
  modified:
    - src/features/price-comparison/ai-advies/AiAdviesSection.tsx
    - src/features/price-comparison/AnalysisPanel.tsx
    - src/features/price-comparison/ai-advies/SchoolplanContextCard.tsx

key-decisions:
  - "Lifted analysis summary state via onAnalysisComplete callback prop instead of shared store"
  - "SchoolplanContextCard renders encouraging purple card with upload link when no schoolplan exists"
  - "AI analyse button visible in collapsed state so users can trigger analysis without expanding"

patterns-established:
  - "onAnalysisComplete callback: AnalysisPanel notifies parent when analysis finishes, enabling summary preview in collapsed state"
  - "Collapsible hero pattern: collapsed shows summary + action button, expanded shows full content"

requirements-completed: [D-01, D-09, D-10, D-11, D-14]

# Metrics
duration: 45min
completed: 2026-03-29
---

# Phase 24 Plan 02: AI Hero Restructure Summary

**Collapsible AI hero section with samenvatting preview, integrated SchoolplanBanner, and encouraging schoolplan upload card**

## Performance

- **Duration:** ~45 min (including 3 iteration fixes after visual verification)
- **Started:** 2026-03-28T23:25:00Z
- **Completed:** 2026-03-28T23:49:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- AiAdviesSection restructured as collapsible AI hero: collapsed by default with 2-3 line samenvatting preview
- SchoolplanBanner integrated inside AiAdviesSection (no separate banner above page)
- AnalysisPanel exposes onAnalysisComplete callback for parent components to receive analysis results
- SchoolplanContextCard shows encouraging purple card with upload link when no schoolplan exists
- "Open AI Advies" button visible in collapsed state so analysis can be triggered without expanding

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure AiAdviesSection as collapsible AI hero** - `63df5aa` (feat)
2. **Task 2: Visual verification** - approved by user after 3 iteration fixes:
   - `d8765e8` (fix) - Restore AI analyse access with expand button in collapsed state
   - `960219f` (fix) - Remove duplicate SchoolplanBanner from AI hero
   - `16a93b4` (fix) - Make SchoolplanContextCard encourage upload when no schoolplan exists

## Files Created/Modified
- `src/features/price-comparison/ai-advies/AiAdviesSection.tsx` - Collapsible AI hero with collapsed summary + expand/collapse toggle + integrated SchoolplanBanner
- `src/features/price-comparison/AnalysisPanel.tsx` - Added onAnalysisComplete callback prop for lifting analysis result to parent
- `src/features/price-comparison/ai-advies/SchoolplanContextCard.tsx` - Encouraging purple card with upload link when no schoolplan exists

## Decisions Made
- Lifted analysis summary state via onAnalysisComplete callback prop instead of a shared Zustand store -- keeps AnalysisPanel backward-compatible
- SchoolplanContextCard renders encouraging purple card with upload link when no schoolplan exists, rather than a passive "not available" message
- AI analyse button visible in collapsed state so users can trigger analysis without needing to expand first

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SchoolplanBanner duplicated in AI hero**
- **Found during:** Task 2 (visual verification)
- **Issue:** SchoolplanBanner was rendered both as top-level banner AND as SchoolplanContextCard inside the hero, causing duplicate content
- **Fix:** Removed the duplicate SchoolplanBanner render; kept SchoolplanContextCard as the single schoolplan context element
- **Files modified:** src/features/price-comparison/ai-advies/AiAdviesSection.tsx
- **Committed in:** `960219f`

**2. [Rule 1 - Bug] AI analyse button hidden behind expand**
- **Found during:** Task 2 (visual verification)
- **Issue:** Users could not trigger AI analysis from collapsed state -- the button was only visible when expanded
- **Fix:** Added "Open AI Advies" button visible in collapsed state
- **Files modified:** src/features/price-comparison/ai-advies/AiAdviesSection.tsx
- **Committed in:** `d8765e8`

**3. [Rule 2 - Missing Critical] SchoolplanContextCard too passive without schoolplan**
- **Found during:** Task 2 (visual verification)
- **Issue:** When no schoolplan exists, the card showed passive placeholder text that did not guide the user toward uploading
- **Fix:** Upgraded to encouraging purple card with upload link text
- **Files modified:** src/features/price-comparison/ai-advies/SchoolplanContextCard.tsx
- **Committed in:** `16a93b4`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All fixes were necessary for correct UX behavior. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AI hero section complete with progressive disclosure
- All D-01 through D-17 decisions implemented across Plan 01 and Plan 02
- Phase 24 remaining plans (03+) can build on this restructured page layout

## Self-Check: PASSED

- All 4 commits verified in git log (63df5aa, d8765e8, 960219f, 16a93b4)
- All 3 key files exist on disk

---
*Phase: 24-ux-audit-vergelijkingsoverzicht-stakeholder-ready*
*Completed: 2026-03-29*
