# Phase 2: Quiet Windows Background Execution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 02-Quiet Windows Background Execution
**Areas discussed:** Windows visibility policy, failure surfacing, hidden-launch fallback, daemon start behavior, Git Bash regression handling, notification scope

---

## Windows Visibility Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Only background daemon and scheduled runs | Keep hidden mode limited to the existing background paths | |
| Every Windows cron run | Hide everything related to Windows cron execution | ✓ |
| Background-only with visible terminal-started runs | Leave some terminal-driven runs visible | |

**User's choice:** Every Windows cron run
**Notes:** The user wants the Windows cron experience fully hidden again rather than a mixed visible and hidden setup.

---

## Failure Surfacing

| Option | Description | Selected |
|--------|-------------|----------|
| Cron table/status plus logs, no popup | Keep failures visible only inside the product surfaces | |
| Cron table/status, logs, and desktop notification | Surface failures in runtime views and with a desktop notification | ✓ |
| Logs/status only with minimal UI noise | Prefer low-noise reporting | |

**User's choice:** Cron table/status, logs, and desktop notification
**Notes:** The user also expanded this to include any execution-blocking error, not just ordinary task failures.

---

## Hidden-Launch Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Fail clearly and do not open visible PowerShell | No visible fallback | |
| Fall back to visible window so the job still runs | Visible fallback is allowed | |
| Retry hidden once, then fail clearly | One hidden retry, no visible fallback | ✓ |

**User's choice:** Retry hidden once, then fail clearly
**Notes:** The user does not want visible PowerShell windows returning as the fallback behavior.

---

## Daemon Start Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep terminal attached | `start-crons.ps1` stays open while daemon runs | |
| Return immediately | Start the daemon and give the terminal back right away | ✓ |

**User's choice:** Return immediately
**Notes:** The user confirmed that starting crons on Windows should not require keeping a terminal window open.

---

## Git Bash Regression Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Treat as required new setup | Expect the user to set `CLAUDE_CODE_GIT_BASH_PATH` or repair PATH manually | |
| Treat as regression to fix in code path | Restore the previous working behavior without adding a new user setup burden | ✓ |

**User's choice:** Treat as regression to fix in code path
**Notes:** The user explicitly pushed back on the idea that this should now require manual setup because it worked before.

---

## Notification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Only normal task failures | Notify only when the task itself fails during normal execution | |
| Any execution-blocking error | Notify whenever the task cannot continue, including setup/runtime blockers | ✓ |

**User's choice:** Any execution-blocking error
**Notes:** This includes errors like the new Git Bash failure if they stop the task from moving forward.

---

## the agent's Discretion

- Exact placement of the hidden retry logic between launcher script, runtime wrapper, or shared helper
- Exact notification trigger point, as long as execution-blocking failures are not silently missed

## Deferred Ideas

- Client workspace containment remains Phase 3
- Full baseline validation remains Phase 4
- Broader Windows cron UX polish is deferred unless needed to complete this phase
