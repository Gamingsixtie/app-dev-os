# Testing Patterns

**Analysis Date:** 2026-04-13

## Test Framework

**Runner:**
- The only app-level automated suite wired into `projects/briefs/command-centre/package.json` is Node’s built-in test runner through `node --test`.
- Config: no dedicated `jest.config.*`, `vitest.config.*`, or `playwright.config.*` file was detected. The active test entry is the `test:cron` script in `projects/briefs/command-centre/package.json`.
- Windows wrapper: `scripts/test-crons.ps1` changes into `projects/briefs/command-centre/` and runs the same `npm run test:cron` command.
- Current execution check: `npm run test:cron` passed 5/5 tests on 2026-04-13 inside `projects/briefs/command-centre/`.

**Assertion Library:**
- `node:assert/strict` is used in `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- `pytest` style assertions appear in `.claude/skills/viz-nano-banana/scripts/test_generate_image.py`, but that test is standalone and not connected to the main workspace scripts.

**Run Commands:**
```bash
cd projects/briefs/command-centre && npm run test:cron   # Wired Node cron suite
powershell -File scripts\test-crons.ps1                  # Windows wrapper for the same suite
pytest .claude/skills/viz-nano-banana/scripts/test_generate_image.py  # Standalone skill test
bash scripts/test-update.sh                              # Interactive shell harness for update logic
powershell -File scripts/test-windows-notify.ps1         # Manual PowerShell smoke test
# Watch mode: Not configured
# Coverage: Not configured
```

## Test File Organization

**Location:**
- Co-locate the Node tests beside the module they exercise inside `projects/briefs/command-centre/src/lib/`.
- Keep repo-level smoke/manual tests under `scripts/`.
- Keep skill-specific Python tests beside the script they validate inside the skill folder.

**Naming:**
- Node tests use `.test.cjs`: `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`, `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- Shell and PowerShell smoke tests use `test-*.sh` and `test-*.ps1`: `scripts/test-update.sh`, `scripts/test-crons.ps1`, `scripts/test-windows-notify.ps1`.
- Python uses `test_*.py`: `.claude/skills/viz-nano-banana/scripts/test_generate_image.py`.

**Structure:**
```text
projects/briefs/command-centre/src/lib/
  cron-runtime.js
  cron-runtime.test.cjs
  queue-watcher.ts
  queue-watcher.test.cjs

scripts/
  test-update.sh
  test-crons.ps1
  test-windows-notify.ps1

.claude/skills/viz-nano-banana/scripts/
  generate_image.py
  test_generate_image.py
```

## Test Structure

**Suite Organization:**
```javascript
const assert = require("node:assert/strict");
const test = require("node:test");

test("behavior stays correct", async () => {
  const result = subjectUnderTest();
  assert.equal(result.status, "expected");
});
```

**Patterns:**
- Create temporary workspaces or DBs inside the test file instead of using shared fixture libraries. Representative helpers: `makeTempWorkspace()` and `cleanupTempWorkspace()` in `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- Wrap setup and teardown in `try/finally` so temp folders, DB handles, and patched globals are always restored. Representative files: `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- Assert exact DB rows, status flags, and recovery metadata rather than using snapshots. Representative files: `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- Use shell helper functions to build disposable environments for bigger workflow checks. Representative file: `scripts/test-update.sh` with `create_test_env`, `reset_demo`, `reset_main`, and `push_from_main`.

## Mocking

**Framework:** No dedicated mocking framework was detected.

**Patterns:**
```javascript
const { initQueueWatcher } = loadQueueWatcherModule({
  "./db": { getDb: () => db },
  "./event-bus": {
    emitTaskEvent: () => {},
    onTaskEvent: (listener) => listeners.push(listener),
  },
  "./process-manager": {
    processManager: {
      executeTask: async (taskId) => executeCalls.push(taskId),
      hasActiveSession: () => false,
    },
  },
});
```
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` transpiles `queue-watcher.ts` with `typescript.transpileModule(...)` and injects manual stubs through a custom `localRequire`.
- Globals are patched directly when needed. Example: `global.setInterval` is replaced in `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` and restored in `finally`.
- Shell and PowerShell tests simulate real environments instead of using a unit-test mocking library.

**What to Mock:**
- Event bus callbacks, process-manager execution, cron runtime ownership, and timers when the test only needs orchestration behavior. Representative file: `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- External command wrappers when a smoke script is testing control flow rather than the external binary itself. Representative file: `scripts/test-windows-notify.ps1`.

**What NOT to Mock:**
- SQLite-backed cron/task state transitions that are central to recovery behavior. `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` and `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` use a real temporary DB from `projects/briefs/command-centre/src/lib/cron-runtime.js`.
- Pure helper logic such as `buildRecoveredCronRunUpdate(...)`; it is exercised directly in `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`.
- Git flow behavior in `scripts/test-update.sh`; that script uses real temp repos under `/tmp/agentic-os-test` instead of mocked git output.

## Fixtures and Factories

**Test Data:**
```javascript
const workspaceDir = makeTempWorkspace();
const db = cronRuntime.getDb(workspaceDir);

db.prepare(`
  INSERT INTO cron_runs (jobSlug, taskId, startedAt, result, trigger, clientId, scheduledFor)
  VALUES (?, ?, ?, 'running', 'scheduled', NULL, ?)
`).run("test-job", taskId, now, now);
```

**Location:**
- Keep small factory helpers inside the test file instead of a shared `test-utils` folder. Representative files: `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`.
- Keep shell test environment factories inside the shell test file. Representative file: `scripts/test-update.sh`.
- Keep the standalone Python import/bootstrap logic inside the test module itself. Representative file: `.claude/skills/viz-nano-banana/scripts/test_generate_image.py`.

## Coverage

**Requirements:** None enforced.
- No coverage target, coverage config, or coverage script was detected.
- No `c8`, `nyc`, Jest coverage config, or Vitest coverage config was found.
- The only wired automated suite covers cron runtime and queue watcher behavior under `projects/briefs/command-centre/src/lib/`.

**View Coverage:**
```bash
# Not configured in this repo
```

## Test Types

**Unit Tests:**
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` checks pure helper and runtime status behavior in `projects/briefs/command-centre/src/lib/cron-runtime.js`.
- `.claude/skills/viz-nano-banana/scripts/test_generate_image.py` checks deterministic resolution-selection helpers in `.claude/skills/viz-nano-banana/scripts/generate_image.py`.

**Integration Tests:**
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs` combines:
- a real temporary workspace
- a real SQLite DB from `projects/briefs/command-centre/src/lib/cron-runtime.js`
- manual stubs for edge modules like the event bus and process manager
- assertions against persisted task and cron-run state
- `scripts/test-update.sh` is an integration-style harness for workspace update behavior. It creates temporary git repos and pushes real upstream changes to exercise many update branches.

**E2E Tests:**
- Not detected for the Next.js UI.
- No Playwright, Cypress, or browser automation config was found in the workspace root or in `projects/briefs/command-centre/`.

## Common Patterns

**Async Testing:**
```javascript
test("queue watcher skips daemon-owned cron tasks", async () => {
  listeners[0]({
    type: "task:status",
    timestamp: new Date().toISOString(),
    task: { id: "task-daemon-skip", status: "queued", cronJobSlug: "test-job" },
  });

  await Promise.resolve();
  assert.deepEqual(executeCalls, []);
});
```
- Async tests usually wait for one microtask turn or a direct awaited helper. No fake clock framework or retry utility was detected.
- Cleanup still happens in `finally`, even for async tests.

**Error Testing:**
```javascript
const recovery = cronRuntime.buildRecoveredCronRunUpdate(
  "recovered_from_stuck_needs_input",
  { durationMs: 4500, costUsd: 2.5 }
);

assert.equal(recovery.result, "failure");
assert.equal(recovery.resultSource, "inferred");
```
- Failure-path testing is state-based. The tests check result flags, recovery reasons, exit codes, and DB status after an error scenario instead of asserting on thrown exception text.
- Shell and PowerShell smoke tests follow the same idea by checking exit codes and output rather than using a shared assertion framework.

## Missing or Partial Coverage

**Current blind spots:**
- No automated tests were found for API routes under `projects/briefs/command-centre/src/app/api/**/route.ts`.
- No automated tests were found for React components under `projects/briefs/command-centre/src/components/**`.
- No automated tests were found for Zustand stores under `projects/briefs/command-centre/src/store/**`.
- Root install and management scripts such as `scripts/add-client.sh`, `scripts/setup.sh`, and `scripts/update.sh` rely on manual or interactive harnesses instead of a unified assertion runner.
- The standalone Python test at `.claude/skills/viz-nano-banana/scripts/test_generate_image.py` is not part of any repo-wide command.
- `npm run lint` is currently broken in `projects/briefs/command-centre/`, so lint is not acting as an automated pre-test quality gate.

---

*Testing analysis: 2026-04-13*
