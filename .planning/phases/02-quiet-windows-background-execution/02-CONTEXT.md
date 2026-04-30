# Phase 2: Quiet Windows Background Execution - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase restores hidden Windows cron behavior in the current workspace. It covers starting the cron daemon without leaving visible PowerShell windows attached, keeping scheduled cron execution hidden while it runs, preserving logs and status, and surfacing failures through both runtime status and desktop notifications. It also covers the new Git Bash regression introduced by the current Windows execution path because that error now blocks scheduled tasks from running at all.

This phase does not yet solve client workspace containment. It also does not broaden into a full cron UX redesign beyond the notification and visibility behavior needed to restore the broken Windows path.

</domain>

<decisions>
## Implementation Decisions

### Windows Visibility Policy
- **D-01:** Everything that belongs to Windows cron background execution should stay hidden. This includes daemon-driven execution and scheduled task execution.
- **D-02:** `start-crons.ps1` on Windows should return immediately instead of keeping a terminal attached while the daemon runs.
- **D-03:** Restoring hidden behavior must not depend on the user keeping a PowerShell window open.

### Failure Surfacing
- **D-04:** When a hidden Windows cron run fails, the failure must appear in cron table/status, logs, and desktop notifications.
- **D-05:** Desktop notifications are required not only for normal task failures, but for any execution-blocking error that prevents the task from moving forward.

### Hidden Launch Fallback
- **D-06:** If Windows hidden launch fails, the system should retry hidden launch once.
- **D-07:** If hidden launch still cannot start correctly after that retry, the task should fail clearly rather than falling back to a visible PowerShell window.

### Git Bash Regression Handling
- **D-08:** The new `CLAUDE_CODE_GIT_BASH_PATH` failure is treated as a regression in the current Windows cron path, not as a new setup step for the user.
- **D-09:** Phase 2 should restore behavior where scheduled cron execution works with the user's existing Git Bash install if it already worked before, instead of expecting the user to manually repair PATH or set a new environment variable as the normal fix.
- **D-10:** If execution is still blocked after the runtime has used the intended detection or launch path, the failure should be explicit in status, logs, and desktop notifications.

### the agent's Discretion
- The planner may choose whether the hidden retry happens in the launcher script, the runtime wrapper, or a shared helper, as long as it stays hidden and does not open visible fallback windows.
- The planner may choose the best place to trigger desktop notifications, as long as execution-blocking failures are not silently lost.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and acceptance
- `.planning/PROJECT.md` — project intent, trusted references, and baseline-preservation rule
- `.planning/REQUIREMENTS.md` — `WIN-01`, `WIN-02`, `WIN-03`, plus overall recovery constraints
- `.planning/ROADMAP.md` — Phase 2 goal, scope boundary, and success criteria
- `.planning/STATE.md` — current phase, blockers, and execution state
- `.planning/phases/01-run-truth-regression-forensics/01-CONTEXT.md` — Phase 1 decisions that remain locked

### Current Windows cron execution paths
- `scripts/start-crons.ps1` — current Windows start flow and attached-terminal behavior
- `scripts/status-crons.ps1` — current Windows status inspection entry
- `scripts/logs-crons.ps1` — current Windows log inspection entry
- `scripts/lib/cron-windows.ps1` — shared Windows process helpers and no-window patterns
- `projects/briefs/command-centre/scripts/cron-daemon.cjs` — daemon detach/start behavior
- `projects/briefs/command-centre/src/lib/cron-runtime.js` — scheduled/manual runtime execution and Windows hidden wrapper path
- `projects/briefs/command-centre/scripts/run-hidden-command.ps1` — current hidden-run wrapper used by scheduled execution
- `scripts/windows-notify.ps1` — desktop notification surface for cron outcomes
- `projects/briefs/command-centre/src/lib/subprocess.ts` — Claude CLI subprocess launch path that may affect Windows environment handling

### Trusted reference behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/scripts/start-crons.ps1` — pre-merge reference for known-good Windows cron start behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/cron-runtime.js` — pre-merge reference for Windows cron execution behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/subprocess.ts` — pre-merge reference for Claude CLI launch behavior
- `../AgenticOS - pr-cron-hardening/scripts/start-crons.ps1` — cron-hardening reference for Windows start behavior if it diverged after merge work
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/cron-runtime.js` — cron-hardening reference for hidden Windows execution
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/subprocess.ts` — cron-hardening reference for Windows Claude launch handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cron-daemon.cjs` already has a detached `startDaemon()` path that can return control to the caller once the daemon is launched.
- `scripts/lib/cron-windows.ps1` already contains Windows-specific process helpers and no-window launch patterns that can be reused instead of inventing another launcher path.
- `run-hidden-command.ps1` already preserves exit codes and timeout cleanup from the Phase 1 fix, so Phase 2 should build on that rather than replace it blindly.
- `scripts/windows-notify.ps1` already has cron-related notification copy for success, timeout, and failure.

### Established Patterns
- Windows cron behavior is currently split between outer CLI scripts (`scripts/*.ps1`) and the per-task runtime wrapper inside `cron-runtime.js`.
- The daemon start path and the scheduled task hidden-run path are separate, so fixing only one of them will leave the other regression in place.
- The current scheduled path now throws a Git Bash requirement error that blocks work and also appears to miss the expected desktop notification.
- Phase 1 already centralized cron completion truth, so Phase 2 should preserve that work instead of reintroducing duplicate ownership around failure reporting.

### Integration Points
- Daemon start entry: `scripts/start-crons.ps1`
- Daemon lifecycle and detach behavior: `cron-daemon.cjs`
- Hidden scheduled execution wrapper: `spawnClaudeRunViaHiddenWindowsWrapper(...)` in `cron-runtime.js`
- Hidden command bridge: `run-hidden-command.ps1`
- Notification surface: `scripts/windows-notify.ps1` plus whichever runtime path records cron failures

</code_context>

<specifics>
## Specific Ideas

- The user wants Windows cron behavior to feel fully backgrounded again, not "mostly hidden" with occasional popup windows.
- The user does not accept the new Git Bash path error as normal behavior because scheduled tasks worked before these recent changes.
- Any execution-blocking error should create a visible signal through desktop notifications in addition to logs and status, so silent background failures do not get missed.

</specifics>

<deferred>
## Deferred Ideas

- Client-only workspace visibility and write containment remain Phase 3 work.
- Full baseline preservation and end-to-end regression validation remain Phase 4 work.
- Broader cron UX polish outside the required Windows visibility and failure surfaces can wait unless it becomes necessary to complete `WIN-01` through `WIN-03`.

</deferred>

---

*Phase: 02-quiet-windows-background-execution*
*Context gathered: 2026-04-14*
