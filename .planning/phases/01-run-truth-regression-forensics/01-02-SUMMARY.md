---
phase: 01-run-truth-regression-forensics
plan: 02
subsystem: cron
tags: [cron, process-manager, cron-runtime, windows, testing]
requires: [01-01]
provides:
  - Runtime-owned cron completion through the shared cron helper
  - Trigger-aware scheduled retry cap of two total attempts
  - Hidden Windows runner that preserves real cmd/bat exit codes
affects: [02-quiet-windows-background-execution, 04-baseline-preservation-regression-validation]
tech-stack:
  added: []
  patterns:
    - single-owner cron finalization
    - trigger-aware retry limiting
    - hidden Windows process invocation without shell popups
key-files:
  created: []
  modified:
    - projects/briefs/command-centre/src/lib/process-manager.ts
    - projects/briefs/command-centre/src/lib/cron-runtime.js
    - projects/briefs/command-centre/src/lib/cron-runtime.test.cjs
    - projects/briefs/command-centre/src/lib/process-manager.test.cjs
    - projects/briefs/command-centre/scripts/run-hidden-command.ps1
key-decisions:
  - "Process-manager no longer owns a second cron completion path; it now delegates to the shared runtime helper."
  - "Scheduled triggers are capped at one automatic retry, while manual runs keep their separate path."
  - "The hidden Windows runner must preserve real exit codes for cmd/bat commands so retry logic can trust failures."
patterns-established:
  - "Cron run completion is finalized through one helper boundary instead of duplicated SQL writers."
  - "Retry policy depends on trigger type: scheduled is capped, manual keeps explicit operator intent."
  - "Windows hidden execution should use a direct background process with no BOM-prefixed output files."
requirements-completed: [EXEC-03, SAFE-03]
duration: 41min
completed: 2026-04-13
---

# Phase 1: Run Truth & Regression Forensics Summary

**Cron completion now has one owner, scheduled retries stop after one automatic retry, and the Windows hidden runner returns real failure codes again.**

## Performance

- **Duration:** 41 min
- **Started:** 2026-04-13T23:50:01-03:00
- **Completed:** 2026-04-14T00:31:00-03:00
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Re-routed `process-manager.ts` so cron completion now flows through `completeCronRunForTask(...)` instead of a second direct writer.
- Capped scheduled runs at two total attempts for the same queued task while keeping manual runs separate.
- Added regression tests for helper-owned completion and the scheduled retry cap.
- Fixed the Windows hidden runner so failing `.cmd` and `.bat` commands report failure correctly, which keeps retry and status reporting truthful.

## Task Commits

1. **Task 1 and Task 2: runtime-owned completion plus trigger-aware retry cap** - `a3b2605` (`fix`)
2. **Task 3: regression tests for completion ownership and scheduled retry limit** - `d9ab00b` (`test`)

## Files Created/Modified

- `projects/briefs/command-centre/src/lib/process-manager.ts` - delegates cron completion to the shared helper
- `projects/briefs/command-centre/src/lib/cron-runtime.js` - reads trigger type, caps scheduled retries, and passes trigger through finalization
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` - verifies single-row completion and two-attempt scheduled retry cap
- `projects/briefs/command-centre/src/lib/process-manager.test.cjs` - updated harness to match the shared cron helper import
- `projects/briefs/command-centre/scripts/run-hidden-command.ps1` - runs hidden Windows commands through a no-window process path that preserves exit codes and timeout cleanup

## Decisions Made

- Kept manual runs intentionally separate by preserving the existing `dedupeByMinute: false` manual path.
- Used the running `cron_runs` row to recover the active trigger instead of inventing a second retry-tracking store.
- Treated the hidden-runner exit-code bug as part of this phase because retry truth depends on correct failure detection.

## Deviations from Plan

- Added one supporting fix outside the original plan file list: the Windows hidden runner needed a real exit-code fix, otherwise scheduled failures were being marked as success and the retry cap could not be trusted.

## Issues Encountered

- The first retry-cap test exposed that the hidden Windows runner was swallowing `.cmd` failure exit codes and adding a BOM character to stderr output files. Both were fixed in the helper.
- The new cron helper import required a matching stub in `process-manager.test.cjs`.

## User Setup Required

None - no new service keys or local setup steps were introduced.

## Next Phase Readiness

- Phase 1 now leaves Phase 2 with a trustworthy Windows launch baseline instead of a hidden-runner ambiguity.
- The scheduled duplicate-execution path and retry rule are both covered by automated cron tests.

---
*Phase: 01-run-truth-regression-forensics*
*Completed: 2026-04-13*
