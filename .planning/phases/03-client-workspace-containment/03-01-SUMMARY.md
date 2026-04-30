# Plan 03-01 Summary

## Outcome

Wave 1 turned client cron containment into a real runtime boundary instead of a prompt-only rule.

## What Changed

- `projects/briefs/command-centre/src/lib/cron-runtime.js`
  - Added `buildCronClaudeArgs(...)` so root and client cron runs now build different Claude launch args.
  - Kept root cron runs on the existing broad bypass path.
  - Switched client cron runs to `--permission-mode dontAsk` with `--add-dir <client-workspace>`.
  - Updated `spawnClaudeRun(...)` to receive the resolved workspace and use the new helper for both scheduled and manual cron runs.
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
  - Added regression tests for the root launch contract and the client launch contract.

## Verification

- `cd projects/briefs/command-centre && npm run test:cron`
- Result: pass (`18/18`)

## Commits

- `e8d338e` `fix(cron): contain client cron workspaces`

## Notes

- This wave establishes the client-only launch boundary.
- The outside-workspace mutation check is completed in Wave 2 (`03-02`).
