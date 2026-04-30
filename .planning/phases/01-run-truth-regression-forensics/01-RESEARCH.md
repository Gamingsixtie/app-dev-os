# Phase 1: Run Truth & Regression Forensics - Research

**Researched:** 2026-04-13
**Domain:** Existing cron execution flow inside the Command Centre runtime
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- If the same scheduled cron run is picked up more than once, only one underlying prompt execution should proceed. Extra pickups for the same scheduled run should be silently ignored rather than shown as failures or duplicate history items.
- A single scheduled cron trigger must remain the source of truth for one reply sequence in chat history. Phase 1 should favor one real execution over multiple visible bookkeeping events.
- A scheduled cron run may use one automatic recovery retry when a run is interrupted or stuck.
- If the scheduled run still fails after the recovery retry, the system should stop retrying that same prompt and wait for the next normal schedule instead of replaying the prompt again.
- A manual run of the same cron job should always be allowed as its own separate run, even when it happens close to a scheduled run.
- Scheduled-run dedupe rules must not block intentionally separate manual runs.
- The regression explanation only needs to be captured in planning/docs for this phase. No extra log/status surface is required unless it falls out naturally from the fix.

### the agent's Discretion
- The exact documentation location for the traced regression cause can be chosen by the planner as long as it is easy to find from the phase artifacts.
- The planner can decide whether the single recovery retry happens immediately or through the existing recovery path, as long as the same scheduled prompt is not replayed more than once automatically.

### Deferred Ideas (OUT OF SCOPE)
- Hidden Windows background execution remains Phase 2 work.
- Full client-only workspace visibility and write containment remains Phase 3 work.
- Any richer user-facing reporting about duplicate skips or regression tracing can be deferred unless needed by the final Phase 1 fix.
</user_constraints>

<research_summary>
## Summary

The current code already has good building blocks for cron safety. `enqueueCronJob(...)` dedupes scheduled runs by `jobSlug + clientId + scheduledFor`, manual runs already bypass that dedupe on purpose, and `cron-runtime.js` already has a runtime-owned helper for truthful cron-run completion. The Phase 1 problem is not "missing cron infrastructure." It is that actual execution ownership is still loose at start time, and completion ownership drifted away from the runtime helper in one important path.

The strongest duplicate-execution path is the event fan-out between `cron-scheduler.ts`, `queue-watcher.ts`, and `process-manager.ts`. The scheduler emits both `task:created` and `task:status` for the same queued cron task. The queue watcher reacts to both while the task is still `queued`. `process-manager.executeTask(...)` only blocks a second start after it has already progressed deep enough to register an in-memory session, which happens after database writes, file-watcher startup, and prompt building. That makes it possible for two near-simultaneous queue events to start the same scheduled task twice and produce duplicate or triple replies.

There is also a confirmed merge drift against the trusted `pre-merge` folder: current `process-manager.ts` writes `cron_runs` rows and root `cron/status` files directly again, while the `pre-merge` version delegated cron completion to `completeCronRunForTask(...)` from `cron-service.ts`. That means scheduled-run completion no longer has one clear owner, which is risky for run truth, retry accounting, client-aware status files, and later containment work.

**Primary recommendation:** Fix Phase 1 in two steps: first claim queued cron execution before async work can race, then restore runtime-owned cron completion and cap scheduled automatic attempts to exactly two total executions for one scheduled run.
</research_summary>

<confirmed_architecture>
## Confirmed Architecture

### Current scheduled path
- `cron-scheduler.ts` claims leadership, enqueues scheduled jobs through `enqueueCronJob(...)`, and emits both `task:created` and `task:status` for each new queued cron task.
- `queue-watcher.ts` listens to `task:created`, `task:updated`, and `task:status`. Any queued task can trigger `processManager.executeTask(...)`.
- `process-manager.ts` runs Claude for queued tasks, including queued cron tasks, and currently records cron completion on its own.

### Current daemon path
- `scripts/cron-daemon.cjs` claims leadership, enqueues scheduled jobs, and polls queued cron tasks directly.
- The daemon executes cron work through `cronRuntime.executeCronTask(...)`, not through `process-manager.ts`.
- `executeCronTask(...)` already uses runtime-owned completion via `completeCronRunForTask(...)`.

### Existing runtime-owned helpers
- `enqueueCronJob(...)` creates the queued task plus one `cron_runs` row with `result = 'running'`.
- `completeCronRunForTask(...)` updates the existing running row when present, preserves trigger/client/schedule context, and writes the status file in the right workspace.
- `buildRecoveredCronRunUpdate(...)` already exists for truthful inferred recovery outcomes.

### Manual run path
- `src/app/api/cron/[name]/run/route.ts` calls `enqueueCronJob(...)` with:
  - `trigger: "manual"`
  - `dedupeByMinute: false`
  - `titleSuffix: " (manual run)"`
- Manual runs already have the right separation at queue time. Phase 1 must not break that.
</confirmed_architecture>

<regression_evidence>
## Regression Evidence

### 1. Duplicate start window is real in the current branch

**Observed code path**
- `cron-scheduler.ts` emits both `task:created` and `task:status` for the same queued cron task.
- `queue-watcher.ts` reacts to both event types when `event.task.status === "queued"`.
- `process-manager.ts` checks `this.sessions.has(taskId)` at the top of `executeTask(...)`, but the session is only inserted later in `spawnClaudeTurn(...)`.

**Why this matters**
- Two back-to-back queued events can both enter `executeTask(...)` before either call has registered an in-memory session.
- Each call can then mark the same task as running, build the prompt, and spawn Claude.
- That is consistent with the user-reported symptom: the prompt really ran multiple times, not just the UI showing duplicates.

**Planning implication**
- The "already running" guard must move earlier than prompt-building and file-watcher setup.
- A queue-watcher-only fix is not enough, because the periodic queued-task reaper can also call `executeTask(...)`.
- The safest place for the hard guard is `process-manager.ts`, with queue-watcher adding a second cheap guard on top.

### 2. Cron completion ownership drift is confirmed against `pre-merge`

**Current branch**
- `process-manager.ts` has a local `recordCronRun(...)` that:
  - queries `cron_runs` directly
  - inserts or updates rows directly
  - writes `cron/status/{slug}.json` under the root workspace directly

**Trusted `pre-merge` branch**
- `process-manager.ts` imported `completeCronRunForTask(...)` from `./cron-service`
- cron completion was delegated to the runtime helper instead of being re-implemented locally

**Why this matters**
- The current direct path can drift from the runtime-owned rules for:
  - client-aware status paths
  - trigger preservation (`manual` vs `scheduled`)
  - `scheduledFor` preservation
  - `resultSource` and `completionReason`
- This is a concrete merge difference and is the clearest confirmed regression path in code, even if it is not the only cause of duplicate replies.

### 3. Current `cron-runtime.js` drift is Phase 2, not Phase 1

Compared with both trusted reference folders, the current `cron-runtime.js` differs mainly by the hidden Windows wrapper (`run-hidden-command.ps1` path plus `spawnClaudeRunViaHiddenWindowsWrapper(...)`).

That drift lines up with the popup-window regression, not the duplicate-execution regression. It should stay out of the Phase 1 implementation except where Phase 1 touches the shared completion/retry logic already in `cron-runtime.js`.

### 4. Retry behavior is currently too open-ended for Phase 1 rules

`executeCronTask(...)` currently uses:

`const maxAttempts = Math.max(1, Number(job.retry || 0) + 1);`

That means one scheduled run can execute the same prompt more than twice if `retry` is greater than `1`. The user explicitly locked Phase 1 to one automatic recovery retry at most.

**Planning implication**
- Scheduled executions must cap total attempts at `2` (`initial + one retry`).
- Manual runs should stay separate and may keep their own existing behavior unless Phase 1 explicitly needs to narrow it.
</regression_evidence>

<recommended_direction>
## Recommended Direction

### A. Put the hard duplicate-start claim in `process-manager.ts`
- Add a pre-session claim such as `startingTasks` plus an atomic `queued -> running` transition.
- Treat a task as "active" while it is still being prepared, not only after the child process exists.
- Make `hasActiveSession(...)` include the pre-start state so queue-watcher and reaper can see it too.

### B. Keep queue-watcher as a second layer, not the only guard
- Before calling `executeTask(...)`, check whether the task is already active.
- Apply the same guard in the queued-task reaper path, not only the event handler.
- Do not rely on event order or assume `task:created` or `task:status` is unique.

### C. Restore one owner for cron completion
- `process-manager.ts` should stop writing `cron_runs` and status files directly.
- Route all cron completion back through `completeCronRunForTask(...)`.
- That keeps trigger, client, schedule, recovery metadata, and status-file location in one place.

### D. Cap scheduled automatic replay to one retry
- Use the existing runtime execution path in `executeCronTask(...)`.
- Determine whether the current queued task is `scheduled` or `manual` from the linked `cron_runs` row or equivalent preserved state.
- For scheduled runs, cap total attempts to `2`.
- Keep retries inside the same queued task and same `cron_runs` row; do not re-enqueue a second scheduled task for the same `scheduledFor`.
</recommended_direction>

<test_strategy>
## Test Strategy

### Regression cases to add
1. **Duplicate queue events do not double-start**
   - Simulate `task:created` followed by `task:status` for the same queued cron task.
   - Assert that only one execution claim is accepted.

2. **Concurrent `executeTask(...)` calls only spawn once**
   - Call `processManager.executeTask(taskId)` twice before the first call finishes setup.
   - Assert that Claude spawn happens once and the task only enters one live execution path.

3. **Runtime helper updates the existing running row**
   - Create a running `cron_runs` row for a task.
   - Finalize through `completeCronRunForTask(...)`.
   - Assert that the existing row is updated instead of inserting a second completion row.

4. **Scheduled retry cap is exactly two attempts**
   - Use a fake Claude command that records how many times it was invoked.
   - Run a scheduled cron task with `retry > 1`.
   - Assert that the fake command is called at most twice.

### Existing command to keep using
- `cd projects/briefs/command-centre && npm run test:cron`

If a new `process-manager` test file is added, extend `test:cron` to include it.
</test_strategy>

<open_questions>
## Open Questions

1. **Why does the user remember `pr-cron-hardening` as good if `process-manager.ts` matches current there?**
   - What we know: current `process-manager.ts` is effectively the same as `pr-cron-hardening`, but differs from `pre-merge`.
   - What is unclear: whether the duplicate symptom in the trusted folder was avoided by surrounding runtime code, by database state, or by changes that were never committed into the copied folder.
   - Recommendation: treat the concrete `pre-merge` completion-ownership drift as confirmed, and treat the duplicate-start race as the main execution hypothesis to prove with tests during execution.

2. **Should manual runs keep the existing configurable `retry` value?**
   - What we know: the user only locked the scheduled path to one automatic recovery retry, and manual runs must stay separate.
   - What is unclear: whether manual runs should keep the job-configured retry count or also be capped for consistency.
   - Recommendation: keep manual runs separate and preserve current behavior unless the implementation shows a shared retry path that would otherwise force a simpler global cap.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-run-truth-regression-forensics/01-CONTEXT.md`
- `projects/briefs/command-centre/src/lib/cron-runtime.js`
- `projects/briefs/command-centre/src/lib/queue-watcher.ts`
- `projects/briefs/command-centre/src/lib/process-manager.ts`
- `projects/briefs/command-centre/src/lib/cron-scheduler.ts`
- `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`
- `projects/briefs/command-centre/src/lib/cron-service.ts`
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`

### Reference comparisons (HIGH confidence)
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\process-manager.ts`
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\process-manager.ts`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`

### Secondary (MEDIUM confidence)
- `git diff --no-index` comparisons between the current workspace and the trusted reference folders
</sources>

<metadata>
## Metadata

**Research scope:**
- Core runtime files: `cron-runtime.js`, `queue-watcher.ts`, `process-manager.ts`, `cron-scheduler.ts`
- Trigger entry points: scheduler, daemon, manual run API
- Safety focus: duplicate starts, retry cap, completion ownership

**Confidence breakdown:**
- Duplicate-start path: MEDIUM-HIGH - strong code-path evidence, still needs execution proof
- Completion-ownership drift: HIGH - confirmed by direct code diff against `pre-merge`
- Retry-cap gap: HIGH - directly visible in current code

**Research date:** 2026-04-13
**Valid until:** 2026-04-20
</metadata>

---

*Phase: 01-run-truth-regression-forensics*
*Research completed: 2026-04-13*
*Ready for planning: yes*
