# Plan 02-01 Summary

## Outcome

Wave 1 restored the normal hidden Windows cron launch path for the common Claude case and removed the misleading start-script message that implied the PowerShell window had to stay open.

## What Changed

- `scripts/start-crons.ps1`
  - Updated the Windows start message to say the daemon returns control immediately.
- `projects/briefs/command-centre/src/lib/cron-runtime.js`
  - Added `resolveGitBashPath(...)` so detached cron runs can reuse an existing Git Bash install automatically.
  - Added `resolveWindowsClaudeLaunchPlan(...)` so plain `claude` and `.exe` commands use the direct hidden spawn path again.
  - Narrowed the PowerShell wrapper fallback to script-like command paths such as `.cmd`, `.bat`, and `.ps1`.
  - Passed explicit env overrides to the wrapper fallback for `AGENTIC_OS_DIR` and `CLAUDE_CODE_GIT_BASH_PATH`.
- `projects/briefs/command-centre/scripts/run-hidden-command.ps1`
  - Added `EnvironmentBase64` support and applied decoded values to `ProcessStartInfo.EnvironmentVariables`.
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
  - Added regression tests for direct-vs-wrapper launch selection and Git Bash path discovery.

## Verification

- `cd projects/briefs/command-centre && npm run test:cron`
- Result: pass (`12/12`)

## Commits

- `2f303a6` `fix(cron): restore direct hidden Windows launch path`
- `2763a36` `test(cron): cover Windows launch selection and git bash discovery`

## Notes

- This plan does not yet wire desktop notifications or the unified cron finalization path. That remains Wave 2 (`02-02`).
