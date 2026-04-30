---
phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking
plan: 03
subsystem: ai, ui
tags: [ai-advice, retention, scenario-c, comparison-table, streaming, prompt-engineering]

# Dependency graph
requires:
  - phase: 17-01
    provides: "Scenario C types, old-platform price helper, engine support"
  - phase: 17-02
    provides: "ScenarioDetector choice UI, wizard store Scenario C, ComparisonTab routing"
provides:
  - "RETENTION_SYSTEM_PROMPT for Scenario C AI advice with three-layer framing (prijs/verlies/zachte deal)"
  - "buildRetentionAdvicePayload and streamRetentionAdvice functions"
  - "ComparisonTable 'Huidig Cito' column label for Scenario C"
  - "WizardStep3Advice retention-specific generate button and streaming"
affects: [price-comparison, ai-advice, school-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Branched system prompt pattern: scenarioType selects between acquisition and retention prompts"
    - "Retention payload extends base payload via spread + additional context fields"

key-files:
  created: []
  modified:
    - api/ai-advice.ts
    - src/lib/ai-advice.ts
    - src/lib/__tests__/ai-advice.test.ts
    - src/features/price-comparison/wizard/WizardStep3Advice.tsx
    - src/features/price-comparison/ComparisonTable.tsx
    - src/features/school-profile/components/WizardStep5.tsx
    - src/features/school-profile/tabs/ComparisonTab.tsx

key-decisions:
  - "Retention prompt uses three explicit categories: prijs (what you pay now), bezwaar (what you lose), meerwaarde (what you gain by staying)"
  - "Migration path framed as soft deal in AI advice: free platform upgrade next school year"
  - "buildAdvicePayload exported for reuse by buildRetentionAdvicePayload"
  - "ComparisonTable uses getProviderLabel helper for dynamic column headers based on scenario"

patterns-established:
  - "Scenario-branched system prompts: scenarioType field routes to different AI prompt strategies"
  - "Retention vs acquisition framing: same JSON output structure, different prompt perspective"

requirements-completed: [SC17-02, SC17-03, SC17-04]

# Metrics
duration: 45min
completed: 2026-03-25
---

# Phase 17 Plan 03: AI Retention Advice & Table Labels Summary

**Three-layer retention AI advice (prijs/verlies/zachte deal) for Scenario C with RETENTION_SYSTEM_PROMPT, buildRetentionAdvicePayload, and 'Huidig Cito' column label in ComparisonTable**

## Performance

- **Duration:** ~45 min (across multiple executor sessions)
- **Started:** 2026-03-25T16:30:00Z
- **Completed:** 2026-03-25T18:54:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 7

## Accomplishments
- AI advice endpoint branches on scenarioType with dedicated RETENTION_SYSTEM_PROMPT for existing Cito customers
- Retention prompt uses three-layer framing: prijs (cost comparison), bezwaar (what you lose by switching), meerwaarde (migration path as soft deal)
- buildRetentionAdvicePayload wraps base payload with scenarioType, schoolplanOpportunities, and migrationContext
- ComparisonTable dynamically shows "Huidig Cito" column header for Scenario C
- Complete end-to-end Scenario C flow verified by user: choice UI, wizard steps, AI retention advice, table with correct labels

## Task Commits

Each task was committed atomically:

1. **Task 1: AI advice retentie-frame for Scenario C** - `a908580` (test: RED), `58edf01` (feat: GREEN) - TDD flow
2. **Task 2: ComparisonTable column label override for Scenario C** - `3b2c2ee` (feat)
3. **Task 3: Visual verification of complete Scenario C flow** - checkpoint:human-verify (approved)

### Additional Orchestrator Fixes (during checkpoint)

4. **ComparisonTab choice UI fix** - `1ebba6a` (fix) - Show choice UI when all modules are cito-oud
5. **WizardStep5 Scenario C option** - `c81018d` (fix) - Show Scenario C option when all modules are cito-oud

## Files Created/Modified
- `api/ai-advice.ts` - Branched system prompt with RETENTION_SYSTEM_PROMPT for Scenario C
- `src/lib/ai-advice.ts` - Exported buildAdvicePayload, added buildRetentionAdvicePayload and streamRetentionAdvice
- `src/lib/__tests__/ai-advice.test.ts` - Unskipped and passing tests for buildRetentionAdvicePayload
- `src/features/price-comparison/wizard/WizardStep3Advice.tsx` - Retention advice streaming and "Genereer retentie-advies" button for Scenario C
- `src/features/price-comparison/ComparisonTable.tsx` - getProviderLabel with "Huidig Cito" for Scenario C
- `src/features/school-profile/tabs/ComparisonTab.tsx` - Fixed choice UI display for all-cito-oud scenario
- `src/features/school-profile/components/WizardStep5.tsx` - Fixed Scenario C option visibility

## Decisions Made
- Retention prompt uses three explicit categories (prijs/bezwaar/meerwaarde) matching the same JSON output structure as the acquisition prompt for UI compatibility
- buildAdvicePayload explicitly exported (not extracted to separate helper) for simplicity and reuse
- Migration path positioned as "soft deal" in AI advice: free platform upgrade next school year with continued data access
- ComparisonTable uses a getProviderLabel helper function for clean conditional column headers

## Deviations from Plan

### Auto-fixed Issues (by orchestrator during checkpoint)

**1. [Rule 1 - Bug] ComparisonTab not showing choice UI for all-cito-oud scenario**
- **Found during:** Task 3 (visual verification)
- **Issue:** ComparisonTab did not display the migration vs competitor choice UI when all modules were set to cito-oud
- **Fix:** Updated ComparisonTab routing logic to detect all-cito-oud scenario and show choice UI
- **Files modified:** src/features/school-profile/tabs/ComparisonTab.tsx
- **Committed in:** 1ebba6a

**2. [Rule 1 - Bug] WizardStep5 not showing Scenario C option**
- **Found during:** Task 3 (visual verification)
- **Issue:** Wizard step 5 did not offer Scenario C option when all modules were cito-oud
- **Fix:** Updated WizardStep5 to show Scenario C option when all modules use cito-oud provider
- **Files modified:** src/features/school-profile/components/WizardStep5.tsx
- **Committed in:** c81018d

---

**Total deviations:** 2 auto-fixed (2 bugs found during visual verification)
**Impact on plan:** Both fixes were necessary for the complete Scenario C flow to work end-to-end. No scope creep.

## UX Feedback (Noted for Future Phases)

User provided UX feedback during visual verification (not blockers, logged for future work):
- DIA/JIJ package selection UX needs improvement (package vs per-module selection unclear)
- Some comparison output shows JSON instead of readable text
- Results should be saved/persisted
- AI advice should integrate schoolplan data more prominently

## Issues Encountered
None - plan executed as designed with two minor routing bugs caught during visual verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 is now complete: all 3 plans executed, all success criteria met
- Scenario C (huidig Cito-platform vs concurrent) fully operational
- Ready for next phase or backlog items
- UX feedback items logged above can inform future phase planning

## Self-Check: PASSED

All 5 commits verified present in git history. All 7 key files verified on disk (WizardStep5 path corrected to src/features/school-profile/components/).

---
*Phase: 17-huidig-cito-platform-vs-concurrent-prijsvergelijking*
*Completed: 2026-03-25*
