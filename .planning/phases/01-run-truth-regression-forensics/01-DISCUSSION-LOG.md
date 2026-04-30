# Phase 1: Run Truth & Regression Forensics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 01-Run Truth & Regression Forensics
**Areas discussed:** Duplicate handling, interrupted or stuck scheduled runs, root-cause visibility, manual run policy

---

## Duplicate Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Silently ignore | Keep one real execution and drop extra pickups for the same scheduled run | ✓ |
| Record as skipped duplicate | Keep an audit trace of the duplicate pickup without running the prompt twice | |
| Show as failure | Surface the duplicate pickup as an error | |

**User's choice:** Silently ignore
**Notes:** The user remembered an older "lock" behavior between the CLI daemon and the UI. For duplicate prompt execution itself, the user wants extra pickups silently ignored.

---

## Interrupted or Stuck Scheduled Runs

| Option | Description | Selected |
|--------|-------------|----------|
| Never auto-run again | Do not retry automatically; wait only for the next normal schedule | |
| Allow one automatic recovery retry | One retry is allowed; if it still fails, stop retrying and wait for the next schedule | ✓ |
| Keep retrying until success | Continue automatic retries beyond one recovery attempt | |

**User's choice:** Allow one automatic recovery retry
**Notes:** The user explicitly wants one recovery retry, then a stop. If both attempts fail, the system should wait for the next normal schedule instead of replaying again.

---

## Root-Cause Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Planning/docs only | Capture the regression cause in the phase artifacts with no extra user-facing surface | ✓ |
| Logs/status only | Surface the traced cause in runtime logs or status outputs only | |
| Both docs and logs/status | Record the traced cause in both planning artifacts and user-facing surfaces | |

**User's choice:** User left this to the agent
**Notes:** The user did not care where the explanation lives. The agent chose planning/docs only to keep Phase 1 focused on restoring execution truth rather than adding more UI or log surface area.

---

## Manual Run Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Always allow a separate manual run | Manual runs stay separate even when close to a scheduled run | ✓ |
| Block while active | Do not allow a manual run while another run of the same job is active | |
| Only after scheduled run ends | Manual run is allowed only after the scheduled run fully completes | |

**User's choice:** Always allow a separate manual run
**Notes:** Manual runs are intentional and must not be swallowed by scheduled-run dedupe.

---

## the agent's Discretion

- Exact documentation placement for the traced regression cause inside the phase artifacts
- Whether the single recovery retry happens immediately or through the existing recovery path, as long as auto-replay is capped at one retry

## Deferred Ideas

- Hidden Windows background execution belongs to Phase 2
- Full client workspace containment belongs to Phase 3
- Richer user-facing duplicate or forensics reporting can wait unless Phase 1 fix work requires it
