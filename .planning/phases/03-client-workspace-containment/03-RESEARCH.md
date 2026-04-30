# Phase 3: Client Workspace Containment - Research

**Researched:** 2026-04-14
**Domain:** Client-only cron execution boundary, cross-workspace containment, and mutation detection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Client cron boundary violations must stop immediately and fail.
- Client cron jobs may write anywhere inside their own client folder.
- Client cron jobs must not read root-only workspace files.
- There must be no runtime fallback that quietly reads shared root files during the run.
- If shared material is needed, it must already exist inside the client workspace before the run starts.
- Manual cron runs must remain separate runs, but the same client containment rules still apply to them.

### the agent's Discretion
- The planner may choose the exact enforcement layers as long as the user-visible outcome stays the same:
  - client cron runs stay inside the selected client folder
  - boundary violations stop immediately
  - root fallback stays blocked
- The planner may combine more than one guard if needed, such as launch-time Claude flags plus post-run mutation checks.

### Deferred Ideas (OUT OF SCOPE)
- A shared-material sync system from root to client folders can be designed later if needed.
- Broader non-cron permission cleanup across all Command Centre task types remains out of scope.
- Full root-workspace regression validation remains Phase 4.
</user_constraints>

<research_summary>
## Summary

The client scope is already correct in the UI-facing layers, but the real cron execution path is still soft. `cron-runtime.js` resolves the right client workspace, loads the right client cron job, sets `cwd` to that client workspace, and even prepends a client-only prompt. But the actual Claude launch still uses `--dangerously-skip-permissions`, which means the working directory is only guidance, not a hard boundary. That matches the user's report that client cron jobs can "see the entire codebase again."

The trusted reference branches do not contain a stronger boundary either. Both `pre-merge` and `pr-cron-hardening` already resolved client workspaces correctly, but they still launched cron prompts with the same bypass path and the same limited post-run leak check. So Phase 3 is not a simple revert. It needs a new containment layer that those references never added.

The most important new finding is the actual Claude CLI surface in the current environment. `claude --help` now exposes two options that matter directly for this phase:
- `--permission-mode dontAsk`
- `--add-dir <directories...>`

That gives the project a credible hard-boundary path for non-interactive client cron runs: stop using `--dangerously-skip-permissions` for client cron execution, launch those runs in a non-interactive permission mode, and explicitly allow only the selected client workspace. Root cron jobs can keep their broader behavior because their boundary is the root workspace itself.

There is still a second gap after launch-time containment: the current write-leak detection only snapshots root `projects/`, `brand_context/`, and `context/`. That means a client cron write into root `cron/`, `scripts/`, `clients/other-client/`, or another root file would not be caught today. Because the user wants writes allowed anywhere inside the client folder, the verification layer also needs to move from "safe output folders" to "anything outside this client workspace is a violation."

**Primary recommendation:** Plan Phase 3 in two waves. First, change client cron launches to a client-only Claude boundary using the current CLI flags instead of bypass mode. Second, replace the limited root output leak check with full outside-workspace mutation detection and regression tests.
</research_summary>

<confirmed_architecture>
## Confirmed Architecture

### What is already client-scoped
- `getClientAgenticOsDir(clientId)` in `config.ts` resolves the client workspace directory.
- `/api/files` routes already pass a client-specific `baseDir` into `file-service.ts`.
- `file-service.ts` already prevents path traversal outside that `baseDir`.
- `gather-context.ts` already loads brand and context files from the selected client folder.
- `process-manager.ts` already runs normal client tasks with `cwd = getClientAgenticOsDir(clientId)`.

### What is still not hard-contained
- `enqueueCronJob(...)` stores client cron tasks as `permissionMode: "default"`.
- But `executeCronTask(...)` in `cron-runtime.js` does not use the task permission system at all.
- `spawnClaudeRun(...)` builds raw Claude args itself and still uses:
  - `["-p", job.prompt, "--model", job.model, "--dangerously-skip-permissions"]`
- So client cron runs bypass the only permission system the rest of the app already understands.

### What currently checks for leaks
- Before a client cron run, `executeCronTask(...)` snapshots:
  - the selected client workspace
  - the root workspace
- After the run, it collects:
  - changed files inside the client workspace
  - changed files in the root workspace
- But both snapshot helpers only scan `projects`, `brand_context`, and `context`.

### Why that is not enough
- It can detect some root leaks after the run.
- It cannot prevent bad reads during the run.
- It cannot detect writes outside those three roots, such as:
  - root `cron/`
  - root `scripts/`
  - `clients/other-client/...`
  - top-level files outside the scan roots
</confirmed_architecture>

<regression_evidence>
## Regression Evidence

### 1. The UI containment path is already correct

`file-service.ts` plus the `/api/files` routes already enforce a client-specific base directory. That means the user-facing browser is not the real problem anymore.

**Planning implication**
- Phase 3 should not spend time reworking file API scoping.
- The fix belongs in cron execution itself.

### 2. Client cron execution still bypasses permissions entirely

`spawnClaudeRun(...)` in the current branch still launches cron prompts with `--dangerously-skip-permissions`. This is the strongest direct explanation for why a client cron run can still reach outside its own folder even though `cwd` is correct.

**Planning implication**
- The launch args for client cron runs must change.
- Changing only the prompt text will not be enough.

### 3. The task permission system is bypassed instead of reused

`process-manager.ts` already knows how to launch Claude with:
- `--permission-mode <mode>`
- optional `--allowedTools ...`
- no `--dangerously-skip-permissions` unless the task explicitly asks for bypass mode

But cron execution never uses that path.

**Planning implication**
- Phase 3 should follow the same design direction as the main task runner: explicit permission mode instead of unconditional bypass.

### 4. The current Claude CLI now exposes containment-friendly flags

Local `claude --help` shows:
- `--add-dir <directories...>` for additional allowed tool-access directories
- `--permission-mode dontAsk` for non-interactive sessions

**Planning implication**
- Client cron runs can be made non-interactive without falling back to full bypass mode.
- This is the best current candidate for a hard client-only launch boundary.

### 5. Root leak detection is narrower than the user's rule

The current post-run check only scans root `projects`, `brand_context`, and `context`.

**Why this matters**
- The user's rule is "anywhere inside the client folder is allowed; outside it is not."
- The current code cannot prove that today.

**Planning implication**
- Phase 3 needs a broader outside-workspace mutation check, not just the existing output-root comparison.
</regression_evidence>

<recommended_direction>
## Recommended Direction

### A. Give client cron runs their own Claude launch spec
- Add a helper in `cron-runtime.js` that builds launch args from `job + workspace`.
- For root cron runs:
  - keep the current full-root behavior
- For client cron runs:
  - keep `cwd` on the client workspace
  - stop using `--dangerously-skip-permissions`
  - use a non-interactive permission mode such as `dontAsk`
  - explicitly pass the client workspace as the allowed directory boundary

### B. Keep manual and scheduled client runs on the same containment path
- `runCronJobNow(...)` already flows through `executeCronTask(...)`.
- That means one launch helper can cover both manual and scheduled client cron runs without changing the Phase 1 rule that manual runs stay separate.

### C. Upgrade leak detection from "safe roots" to "outside this client workspace"
- Replace or extend the current root snapshot logic so client runs fail if they mutate anything outside the selected client folder.
- Keep the allowed write boundary broad inside the client workspace, because the user wants writes allowed anywhere in that folder.

### D. Fail with one clear boundary-violation outcome
- If launch-time access is denied, treat that as a normal execution failure.
- If post-run detection still sees out-of-workspace mutations, treat that as a boundary failure.
- Use the Phase 2 finalization path so the result is visible in task status, cron state, logs, and notifications.

### E. Avoid `--bare` unless the first containment pass proves it is necessary
- `--bare` would disable normal Claude auto-discovery and could change more behavior than this phase needs.
- Recommendation: first try the simpler client launch boundary using explicit permission mode plus allowed directory.
- Only escalate to a more isolated startup mode if the tests prove the simpler path still leaks.
</recommended_direction>

<test_strategy>
## Test Strategy

### Regression cases to add
1. **Client launch args are hard-scoped**
   - Add a helper such as `buildCronClaudeArgs(...)` or `buildCronLaunchSpec(...)`
   - Assert that a client workspace run:
     - does not include `--dangerously-skip-permissions`
     - does include a non-interactive permission mode
     - includes the selected client workspace as the allowed directory boundary

2. **Root launch args stay broad**
   - Assert that a root workspace cron run still keeps the existing broad behavior so Phase 4 can preserve root cron functionality.

3. **Outside-workspace writes are caught**
   - Simulate a client cron command that writes into a root path or another client folder.
   - Assert that the run ends as failure and the offending path appears in the failure detail.

4. **Inside-client writes stay allowed**
   - Simulate a client cron command that writes inside the selected client folder.
   - Assert that the run does not fail containment just because it wrote to a client-local path.

### Existing command to keep using
- `cd projects/briefs/command-centre && npm run test:cron`
</test_strategy>

<open_questions>
## Open Questions

1. **Is `--add-dir` alone enough when the session `cwd` is already the client folder?**
   - What we know: the current bypass mode definitely breaks containment.
   - Recommendation: plan around `cwd + non-bypass permission mode + explicit client add-dir`, then prove it with tests before considering anything heavier.

2. **Does the stronger launch boundary make the old output-root scan obsolete?**
   - What we know: the user still wants immediate failure if anything escapes.
   - Recommendation: keep a broader post-run mutation check as defense in depth even after the launch boundary is tightened.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-client-workspace-containment/03-CONTEXT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `projects/briefs/command-centre/src/lib/config.ts`
- `projects/briefs/command-centre/src/lib/file-service.ts`
- `projects/briefs/command-centre/src/lib/gather-context.ts`
- `projects/briefs/command-centre/src/lib/process-manager.ts`
- `projects/briefs/command-centre/src/lib/cron-runtime.js`
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
- `projects/briefs/command-centre/src/types/task.ts`
- `docs/multi-client-guide.md`
- `.planning/codebase/STRUCTURE.md`

### Reference comparisons (HIGH confidence)
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\process-manager.ts`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\process-manager.ts`

### Runtime probe (HIGH confidence)
- `claude --help`
  - confirmed `--add-dir <directories...>`
  - confirmed `--permission-mode dontAsk`
</sources>

<metadata>
## Metadata

**Research scope:**
- client workspace resolution
- cron launch args
- existing permission system reuse
- outside-workspace mutation detection

**Confidence breakdown:**
- current client cron bypass path: HIGH
- UI/file API scoping already correct: HIGH
- Claude CLI containment flags availability: HIGH
- broader outside-workspace mutation gap: HIGH
- whether `--bare` is needed: MEDIUM

**Research date:** 2026-04-14
**Valid until:** 2026-04-21
</metadata>

---

*Phase: 03-client-workspace-containment*
*Research completed: 2026-04-14*
*Ready for planning: yes*
