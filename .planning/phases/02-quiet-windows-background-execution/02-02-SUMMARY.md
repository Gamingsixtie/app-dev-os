# Plan 02-02 Summary

## Outcome

Wave 2 routed Windows cron completions and failures through one shared outcome path so hidden runs now keep status, logs, and desktop notifications aligned.

## What Changed

- `projects/briefs/command-centre/src/lib/cron-runtime.js`
  - Added `shouldSendCronNotification(...)` to enforce `on_finish`, `on_failure`, and `silent`.
  - Added `maybeSendWindowsCronNotification(...)` to call `scripts/windows-notify.ps1` for cron success, timeout, and failure events on Windows.
  - Added `finalizeCronExecutionOutcome(...)` so cron results now share one finish path for:
    - final log entry
    - task status update
    - cron run completion
    - desktop notification dispatch
  - Moved the missing-job blocker path onto the same shared finalizer instead of handling it separately.
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
  - Added policy tests for `on_finish`, `on_failure`, and `silent`.
  - Added a blocker-path test that proves a missing cron job definition becomes a failed task, a failed cron run, and a failure notification.

## Verification

- `cd projects/briefs/command-centre && npm run test:cron`
- Result: pass (`14/14`)

## Commits

- `b2b845c` `fix(cron): unify Windows cron completion surfaces`
- `b600bcd` `test(cron): cover cron notification policy and blocker failures`

## Notes

- This plan keeps notifications Windows-only, which matches the Phase 2 scope.
- Client-folder containment is still Phase 3 work.
