# Phase 1: Run Truth & Regression Forensics - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase restores trustworthy scheduled cron execution in the current workspace. It covers duplicate prompt execution, duplicate reply history, interrupted-run retry policy, and tracing the concrete regression path against trusted references. It does not yet implement the Windows popup fix or full client-workspace containment, except where reading those code paths is needed to understand the duplicate-execution bug.

</domain>

<decisions>
## Implementation Decisions

### Duplicate Scheduled Execution
- **D-01:** If the same scheduled cron run is picked up more than once, only one underlying prompt execution should proceed. Extra pickups for the same scheduled run should be silently ignored rather than shown as failures or duplicate history items.
- **D-02:** A single scheduled cron trigger must remain the source of truth for one reply sequence in chat history. Phase 1 should favor one real execution over multiple visible bookkeeping events.

### Interrupted and Recovery Behavior
- **D-03:** A scheduled cron run may use one automatic recovery retry when a run is interrupted or stuck.
- **D-04:** If the scheduled run still fails after the recovery retry, the system should stop retrying that same prompt and wait for the next normal schedule instead of replaying the prompt again.

### Manual Run Separation
- **D-05:** A manual run of the same cron job should always be allowed as its own separate run, even when it happens close to a scheduled run.
- **D-06:** Scheduled-run dedupe rules must not block intentionally separate manual runs.

### Regression Trace Output
- **D-07:** The regression explanation only needs to be captured in planning/docs for this phase. No extra log/status surface is required unless it falls out naturally from the fix.

### the agent's Discretion
- The exact documentation location for the traced regression cause can be chosen by the planner as long as it is easy to find from the phase artifacts.
- The planner can decide whether the single recovery retry happens immediately or through the existing recovery path, as long as the same scheduled prompt is not replayed more than once automatically.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and acceptance
- `.planning/PROJECT.md` — project intent, trusted reference folders, and baseline-preservation constraints
- `.planning/REQUIREMENTS.md` — `EXEC-01`, `EXEC-02`, `EXEC-03`, and `SAFE-03`
- `.planning/ROADMAP.md` — Phase 1 goal, scope boundary, and success criteria
- `.planning/STATE.md` — current blockers and confirmed project decisions

### Current execution paths
- `projects/briefs/command-centre/src/lib/cron-runtime.js` — current scheduled/manual enqueue rules, cron run bookkeeping, workspace resolution, and cron execution wrapper
- `projects/briefs/command-centre/src/lib/queue-watcher.ts` — queued-task auto-execution, daemon leadership checks, orphan recovery, and cron reaper behavior
- `projects/briefs/command-centre/src/lib/process-manager.ts` — task execution path, reply continuation flow, and extra cron completion bookkeeping that may overlap with runtime-owned cron state

### Trusted reference behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/cron-runtime.js` — pre-merge reference for known-good cron execution behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/queue-watcher.ts` — pre-merge reference for queued cron execution and recovery behavior
- `../AgenticOS - backup 2026-04-13 pre-merge/projects/briefs/command-centre/src/lib/process-manager.ts` — pre-merge reference for task execution and cron bookkeeping behavior
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/cron-runtime.js` — cron-hardening reference for dedupe, containment-related runtime work, and hidden Windows execution behavior
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/queue-watcher.ts` — cron-hardening reference for queue leadership and recovery handling
- `../AgenticOS - pr-cron-hardening/projects/briefs/command-centre/src/lib/process-manager.ts` — cron-hardening reference for current execution ownership expectations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `enqueueCronJob(...)` in `cron-runtime.js` already has a scheduled-run dedupe path keyed by `jobSlug`, `clientId`, and minute-normalized `scheduledFor`.
- `runCronJobNow(...)` in `cron-runtime.js` already treats manual runs as separate by passing `dedupeByMinute: false`.
- `buildRecoveredCronRunUpdate(...)` and `completeCronRunForTask(...)` in `cron-runtime.js` already provide a runtime-owned way to reconcile interrupted cron runs.
- `getCronSystemStatus(...)` plus daemon leadership checks in `queue-watcher.ts` already provide a place to enforce one active execution owner for queued cron tasks.

### Established Patterns
- Cron run truth is split across `tasks` rows and `cron_runs` rows; duplicate execution can happen if more than one path reacts to the same queued cron task.
- `queue-watcher.ts` reacts to `task:status`, `task:updated`, and `task:created` events for queued tasks, and it also has a periodic reaper that can execute queued cron tasks again when the daemon is not leader.
- `process-manager.ts` still writes cron completion data and root `cron/status` files directly, which may overlap with `cron-runtime.js` ownership and create drift in cron state handling.
- Workspace resolution already exists in `cron-runtime.js`; Phase 1 should use it as context but not expand scope into full containment redesign.

### Integration Points
- Scheduled cron entry: scheduler or daemon code eventually calls `enqueueCronJob(...)` in `cron-runtime.js`.
- Queued cron execution handoff: `queue-watcher.ts` decides when a queued cron task turns into a real `processManager.executeTask(...)` call.
- Manual execution path: `runCronJobNow(...)` in `cron-runtime.js`.
- Completion and recovery path: `cron-runtime.js` cron run updates plus `queue-watcher.ts` reconciliation and `process-manager.ts` cron recording.

</code_context>

<specifics>
## Specific Ideas

- The user remembers a previous "lock" behavior between the CLI daemon and the UI. Phase 1 should verify whether that ownership guard regressed and whether duplicate prompt execution now comes from more than one execution path picking up the same queued cron task.
- The user cares more about the real prompt being executed once than about showing duplicate-detection messages in the UI.
- Manual reruns are intentionally separate and should not be swallowed by scheduled-run dedupe.

</specifics>

<deferred>
## Deferred Ideas

- Hidden Windows background execution remains Phase 2 work.
- Full client-only workspace visibility and write containment remains Phase 3 work.
- Any richer user-facing reporting about duplicate skips or regression tracing can be deferred unless needed by the final Phase 1 fix.

</deferred>

---

*Phase: 01-run-truth-regression-forensics*
*Context gathered: 2026-04-13*
