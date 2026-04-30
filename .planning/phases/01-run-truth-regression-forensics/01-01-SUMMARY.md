---
phase: 01-run-truth-regression-forensics
plan: 01
subsystem: cron
tags: [cron, queue-watcher, process-manager, scheduled-tasks, testing]
requires: []
provides:
  - Early queued-task claim before prompt execution starts
  - Queue-watcher guard for duplicate queued cron dispatch
  - Regression tests for duplicate queue-event execution
affects: [01-02, quiet-windows-background-execution, client-workspace-containment]
tech-stack:
  added: []
  patterns:
    - in-memory pre-session execution claim
    - queued-to-running atomic status claim
    - duplicate queue-event regression testing
key-files:
  created:
    - projects/briefs/command-centre/src/lib/process-manager.test.cjs
  modified:
    - projects/briefs/command-centre/src/lib/process-manager.ts
    - projects/briefs/command-centre/src/lib/queue-watcher.ts
    - projects/briefs/command-centre/src/lib/queue-watcher.test.cjs
    - projects/briefs/command-centre/package.json
key-decisions:
  - "Queued task ownership is claimed before file watching, prompt building, or Claude spawn."
  - "Duplicate queue events are ignored silently once a task is already active."
  - "The cron test command now covers process-manager duplicate-start behavior."
patterns-established:
  - "Process-manager owns the earliest duplicate-start barrier through startingTasks plus an atomic queued->running update."
  - "Queue-watcher must check hasActiveSession before dispatching queued events."
requirements-completed: [EXEC-01, EXEC-02]
duration: 12min
completed: 2026-04-13
---

# Phase 1: Run Truth & Regression Forensics Summary

**Queued cron tasks now claim execution once at the boundary, with watcher-level dedupe and regression tests covering duplicate queue events.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-13T23:37:54-03:00
- **Completed:** 2026-04-13T23:50:01-03:00
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added an early `startingTasks` claim in `process-manager.ts` so the same queued cron task cannot enter the start path twice.
- Added a second guard in `queue-watcher.ts` so duplicate `task:created` and `task:status` events do not both dispatch execution.
- Added automated tests for both the process-manager race and the watcher double-event path.

## Task Commits

1. **Task 1 and Task 2: queued task claim plus watcher guard** - `ace8d3c` (`fix`)
2. **Task 3: duplicate queue dispatch regression tests** - `2dd199c` (`test`)

## Files Created/Modified

- `projects/briefs/command-centre/src/lib/process-manager.ts` - claims queued execution before async setup starts
- `projects/briefs/command-centre/src/lib/queue-watcher.ts` - skips queued events for tasks already being claimed or executed
- `projects/briefs/command-centre/src/lib/process-manager.test.cjs` - covers near-simultaneous `executeTask` calls
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` - covers `task:created` plus `task:status` double dispatch
- `projects/briefs/command-centre/package.json` - includes the new process-manager cron test in `test:cron`

## Decisions Made

- Used both an in-memory claim and a database claim so duplicate starts are blocked before the prompt can run.
- Kept the watcher guard even though the process-manager claim is the hard barrier, because it reduces noisy duplicate dispatch attempts.
- Added a focused `process-manager` test instead of trying to prove the behavior only through watcher tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The new process-manager test initially logged a harmless missing-module warning for `file-diff`; this was fixed by stubbing the snapshot helper in the test harness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 1 is ready for Wave 2 to restore single-owner cron completion and the scheduled retry cap.
- The duplicate-start regression now has automated coverage, so later cron changes can be checked quickly.

---
*Phase: 01-run-truth-regression-forensics*
*Completed: 2026-04-13*
