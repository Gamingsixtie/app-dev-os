# Phase 2: Quiet Windows Background Execution - Research

**Researched:** 2026-04-14
**Domain:** Windows cron daemon launch, hidden scheduled execution, and failure surfacing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Everything that belongs to Windows cron background execution should stay hidden. This includes daemon-driven execution and scheduled task execution.
- `start-crons.ps1` on Windows should return immediately instead of keeping a terminal attached while the daemon runs.
- Restoring hidden behavior must not depend on the user keeping a PowerShell window open.
- When a hidden Windows cron run fails, the failure must appear in cron table/status, logs, and desktop notifications.
- Desktop notifications are required not only for normal task failures, but for any execution-blocking error that prevents the task from moving forward.
- If Windows hidden launch fails, the system should retry hidden launch once.
- If hidden launch still cannot start correctly after that retry, the task should fail clearly rather than falling back to a visible PowerShell window.
- The new `CLAUDE_CODE_GIT_BASH_PATH` failure is treated as a regression in the current Windows cron path, not as a new setup step for the user.
- Phase 2 should restore behavior where scheduled cron execution works with the user's existing Git Bash install if it already worked before, instead of expecting the user to manually repair PATH or set a new environment variable as the normal fix.
- If execution is still blocked after the runtime has used the intended detection or launch path, the failure should be explicit in status, logs, and desktop notifications.

### the agent's Discretion
- The planner may choose whether the hidden retry happens in the launcher script, the runtime wrapper, or a shared helper, as long as it stays hidden and does not open visible fallback windows.
- The planner may choose the best place to trigger desktop notifications, as long as execution-blocking failures are not silently lost.

### Deferred Ideas (OUT OF SCOPE)
- Client-only workspace visibility and write containment remain Phase 3 work.
- Full baseline preservation and end-to-end regression validation remain Phase 4 work.
- Broader cron UX polish outside the required Windows visibility and failure surfaces can wait unless it becomes necessary to complete `WIN-01` through `WIN-03`.
</user_constraints>

<research_summary>
## Summary

The Phase 2 regressions are concentrated in one place: Windows cron execution now has a special launch path that the trusted reference folders did not use. Both `pre-merge` and `pr-cron-hardening` launched scheduled cron prompts through the normal `spawn(claudeCommand, claudeArgs, { windowsHide: true })` path. The current branch added `run-hidden-command.ps1` plus `spawnClaudeRunViaHiddenWindowsWrapper(...)`, which routes every Windows scheduled cron run through a separate PowerShell wrapper before Claude starts.

That new wrapper is the biggest code-path drift for Phase 2. It is also the strongest explanation for why Windows cron behavior regressed while other Claude-driven flows in the project kept working. The user's new Git Bash error appeared only after this newer Windows cron path landed. Even though an interactive local probe showed the wrapper can work from the current shell, that does not clear it: the failure can still be specific to the daemon or background runtime environment. The important planning fact is that the current cron path is no longer the same as the proven reference path.

The good news is that the base daemon path is already close to correct. `cron-daemon.cjs start` already spawns the daemon detached with `windowsHide: true`, and the root Windows scripts for status, logs, and stop are thin wrappers that already preserve observability. The start script mainly has stale messaging that still says the terminal stays attached. So Phase 2 should focus more on fixing scheduled execution and failure surfaces than on rewriting the daemon architecture.

Desktop notifications are not actually wired into cron execution today. The notification script and config exist, cron jobs have a `notify` field, and the README says cron jobs notify on finish, but the current `cron-runtime.js` execution path never calls `scripts/windows-notify.ps1`. That directly matches the user's report that the Git Bash failure did not trigger a notification.

**Primary recommendation:** Plan Phase 2 in two steps. First, restore a Windows cron launch path that matches the trusted behavior and remove the new user-facing Git Bash setup burden. Second, route all execution-blocking cron outcomes through one failure/success finalization path that updates status, logs, and desktop notifications together.
</research_summary>

<confirmed_architecture>
## Confirmed Architecture

### Windows daemon start path
- `scripts/start-crons.ps1` calls `node projects/briefs/command-centre/scripts/cron-daemon.cjs start`.
- `cron-daemon.cjs start` already spawns a detached background daemon with:
  - `detached: true`
  - `windowsHide: true`
  - `stdio` redirected to the daemon log file
- The daemon start command already prints the daemon PID and log path, then exits.

### Windows scheduled execution path
- `executeCronTask(...)` in `cron-runtime.js` calls `spawnClaudeRun(...)`.
- In the current branch only, `spawnClaudeRun(...)` sends Windows runs through `spawnClaudeRunViaHiddenWindowsWrapper(...)` whenever `run-hidden-command.ps1` exists.
- The wrapper then launches a separate `powershell.exe` process, which launches Claude through `System.Diagnostics.ProcessStartInfo`.

### Notification surface
- `scripts/windows-notify.ps1` already supports `-Channel cron` with `success`, `timeout`, and `failure` events.
- Cron job files already parse `notify: on_finish | on_failure | silent`.
- `cron-runtime.js` currently stores the `notify` setting in job objects, but it does not use it during task execution.

### Status and logs
- Cron logs are appended through `appendCronLog(...)`.
- Run truth is finalized through `completeCronRunForTask(...)`.
- Status inspection uses `cron-daemon.cjs status` plus `getManagedRuntimeStatus(...)`.
- Stop behavior uses `cron-daemon.cjs stop` and existing runtime lock helpers.
</confirmed_architecture>

<regression_evidence>
## Regression Evidence

### 1. The start script itself did not regress much; the wording did

**Current branch**
- `scripts/start-crons.ps1` still says: `"This terminal stays attached while the daemon is running."`

**Reality in code**
- `cron-daemon.cjs start` already detaches and returns control after launching the daemon.

**Reference folders**
- `pre-merge` and `pr-cron-hardening` use the same start script text.

**Planning implication**
- `WIN-01` does not need a daemon rewrite.
- It does need the Windows start experience to clearly act like fire-and-forget and stop telling the user the opposite.

### 2. The new hidden PowerShell wrapper is the main launch-path drift

**Current branch**
- `cron-runtime.js` defines `WINDOWS_HIDDEN_RUNNER_PATH`
- `spawnClaudeRunViaHiddenWindowsWrapper(...)`
- unconditional Windows wrapper routing when the helper file exists

**Reference folders**
- `pre-merge` and `pr-cron-hardening` do not contain `run-hidden-command.ps1`
- both references call `spawn(claudeCommand, claudeArgs, { shell: useWindowsCmdShell, windowsHide: true })` directly

**Why this matters**
- The user's Git Bash regression appeared after this wrapper path existed.
- This is the clearest code difference tied to the Windows-only regression.
- It also explains why cron broke without proving that all Claude launches on Windows are broken.

### 3. The machine setup is already good in the interactive shell

**Observed locally**
- `Get-Command claude` resolves to `C:\Users\gmsal\.local\bin\claude.exe`
- `where.exe bash` resolves to `C:\Program Files\Git\bin\bash.exe`
- direct `claude --version` works
- direct `claude -p ... --dangerously-skip-permissions` works
- the wrapper also works from the current interactive shell for a simple prompt

**Why this still supports a regression diagnosis**
- The user-reported error is not explained by "Git Bash is missing."
- The likely problem is environment-sensitive: daemon/background cron context versus the current shell.
- Phase 2 should therefore fix the cron launch path itself, not ask the user to repair the machine.

### 4. Cron desktop notifications are not wired into execution

**Current branch**
- `cron-runtime.js` parses and stores the `notify` field
- no cron execution code calls `scripts/windows-notify.ps1`
- no helper exists for `notify: on_finish`, `on_failure`, or `silent`

**Why this matters**
- The user's missing notification report is fully consistent with the code.
- This is not just a UI issue; the runtime is not sending the notification at all.

### 5. Execution-blocking failures are finalized, but not surfaced uniformly

**Current branch**
- Missing job definition, launch exceptions, timeout, containment error, and non-zero exits all end up as task/cron failures
- but those paths do not share one notification-aware finalization helper

**Planning implication**
- Phase 2 should create one outcome surface that handles:
  - log append
  - task finalization
  - cron run completion
  - notification dispatch
- otherwise blocker failures will keep escaping the user-facing surfaces inconsistently
</regression_evidence>

<recommended_direction>
## Recommended Direction

### A. Make Windows start clearly fire-and-forget
- Update `scripts/start-crons.ps1` so it describes immediate return instead of an attached terminal.
- Keep `cron-daemon.cjs start` as the real background launcher because it already detaches cleanly.
- Preserve the current `status`, `logs`, and `stop` command flow.

### B. Stop forcing every Windows cron run through the new PowerShell wrapper
- Restore the trusted behavior for the normal case: direct Claude spawn with `windowsHide: true`.
- Keep a wrapper only as a narrow fallback for explicit `.cmd`, `.bat`, or `.ps1` override paths if that still adds value.
- Avoid a design where the wrapper is the default path for plain `claude` / `claude.exe`.

### C. Carry Git Bash resolution inside the cron runtime, not as user setup
- If `CLAUDE_CODE_GIT_BASH_PATH` is already set, preserve it.
- If it is missing, let the runtime discover an existing Git Bash path from:
  - current PATH / `where bash`
  - `C:\Program Files\Git\bin\bash.exe`
  - `C:\Program Files\Git\usr\bin\bash.exe`
- Pass that resolved value directly into the cron child environment so detached runs do not depend on shell-specific setup.

### D. Create one notification-aware cron outcome path
- Add a small Windows-only helper in `cron-runtime.js` that dispatches:
  - `success`
  - `timeout`
  - `failure`
- Respect the existing job-level policy:
  - `on_finish`
  - `on_failure`
  - `silent`
- Use the same helper for execution-blocking failures such as:
  - missing job definition
  - hidden launch exception
  - Git Bash detection failure
  - containment error
- Keep status and logs truthful first, with notifications added on top of the same final outcome.
</recommended_direction>

<test_strategy>
## Test Strategy

### Regression cases to add
1. **Windows launch selection matches the trusted path**
   - Add a small exported helper such as `resolveWindowsClaudeLaunchPlan(...)`
   - Assert that plain `claude` / `.exe` resolves to direct spawn mode
   - Assert that `.cmd` / `.bat` / `.ps1` overrides resolve to wrapper mode only when needed

2. **Git Bash path is carried without new user setup**
   - Add a helper such as `resolveGitBashPath(...)`
   - Assert that an existing `CLAUDE_CODE_GIT_BASH_PATH` is preserved
   - Assert that a discovered `bash.exe` path is injected when the env var is missing

3. **Notification policy is enforced**
   - Add a helper such as `shouldSendCronNotification(...)`
   - Assert:
     - `on_finish` sends success/failure/timeout
     - `on_failure` sends failure/timeout only
     - `silent` sends nothing

4. **Execution-blocking failures hit the same surface**
   - Cover at least one blocker path such as missing job definition or launch failure
   - Assert that the task ends in failure, the cron run is finalized, and the notification helper is called with a `failure` event

### Existing command to keep using
- `cd projects/briefs/command-centre && npm run test:cron`
</test_strategy>

<open_questions>
## Open Questions

1. **Should the PowerShell hidden wrapper survive as a narrow fallback or be removed entirely?**
   - What we know: it is the main new Windows drift and the trusted references did not need it.
   - Recommendation: keep it only for explicit script-wrapper cases if Phase 2 still needs it after implementation. Otherwise remove it.

2. **Should cron notifications stay Windows-only in this phase?**
   - What we know: the user asked for desktop notifications in the current Windows problem path, and the existing notifier is Windows-specific.
   - Recommendation: keep the runtime integration Windows-only for Phase 2. Cross-platform notification expansion can stay out of scope.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/02-quiet-windows-background-execution/02-CONTEXT.md`
- `scripts/start-crons.ps1`
- `scripts/status-crons.ps1`
- `scripts/logs-crons.ps1`
- `scripts/stop-crons.ps1`
- `scripts/lib/cron-windows.ps1`
- `projects/briefs/command-centre/scripts/cron-daemon.cjs`
- `projects/briefs/command-centre/scripts/run-hidden-command.ps1`
- `projects/briefs/command-centre/src/lib/cron-runtime.js`
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`
- `projects/briefs/command-centre/src/lib/subprocess.ts`

### Reference comparisons (HIGH confidence)
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\scripts\\start-crons.ps1`
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`
- `..\\AgenticOS - backup 2026-04-13 pre-merge\\projects\\briefs\\command-centre\\src\\lib\\subprocess.ts`
- `..\\AgenticOS - pr-cron-hardening\\scripts\\start-crons.ps1`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\cron-runtime.js`
- `..\\AgenticOS - pr-cron-hardening\\projects\\briefs\\command-centre\\src\\lib\\subprocess.ts`

### Runtime probes (MEDIUM-HIGH confidence)
- `Get-Command claude` → `C:\\Users\\gmsal\\.local\\bin\\claude.exe`
- `where.exe bash` → `C:\\Program Files\\Git\\bin\\bash.exe`
- local wrapper probe with `run-hidden-command.ps1` and a simple Claude prompt
</sources>

<metadata>
## Metadata

**Research scope:**
- Windows daemon start scripts
- Windows scheduled prompt launch path
- failure/status/log surfaces
- notification integration gap

**Confidence breakdown:**
- daemon start behavior: HIGH
- wrapper as main regression drift: HIGH
- Git Bash failure as environment-sensitive cron regression: MEDIUM-HIGH
- notification gap: HIGH

**Research date:** 2026-04-14
**Valid until:** 2026-04-21
</metadata>

---

*Phase: 02-quiet-windows-background-execution*
*Research completed: 2026-04-14*
*Ready for planning: yes*
