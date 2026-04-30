# Codebase Concerns

**Analysis Date:** 2026-04-13

## Tech Debt

**Command Centre validation is partially disabled:**
- Issue: `projects/briefs/command-centre/package.json` wires linting to `next lint`, while `projects/briefs/command-centre/next.config.ts` sets `typescript.ignoreBuildErrors = true`.
- Files: `projects/briefs/command-centre/package.json`, `projects/briefs/command-centre/next.config.ts`
- Impact: the main web app has no reliable repo-wired static validation gate. Broken linting and skipped type errors make refactors riskier, especially in task execution and cron flows.
- Fix approach: replace `next lint` with a working `eslint` command, turn type-check failures back on, and make one command the required validation gate before merges or releases.

**Critical runtime logic is concentrated in oversized files:**
- Issue: the largest files combine orchestration, recovery, parsing, rendering, and side effects in single modules. The highest-risk examples are `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, `projects/briefs/command-centre/src/components/board/feed-view.tsx`, `projects/briefs/command-centre/src/components/modal/modal-summary-tab.tsx`, `projects/briefs/command-centre/src/components/board/task-create-input.tsx`, and `projects/briefs/command-centre/src/components/tasks/tasks-view.tsx`.
- Files: `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, `projects/briefs/command-centre/src/components/board/feed-view.tsx`, `projects/briefs/command-centre/src/components/modal/modal-summary-tab.tsx`, `projects/briefs/command-centre/src/components/board/task-create-input.tsx`, `projects/briefs/command-centre/src/components/tasks/tasks-view.tsx`
- Impact: changes have wide blast radius. Small fixes in session handling, board behavior, or modal state are more likely to create regressions in unrelated flows.
- Fix approach: split by responsibility first. Extract session state, subprocess control, recovery logic, and board subviews into smaller modules before adding more features.

**Subtask dependency logic is stored inside human-editable descriptions:**
- Issue: dependency metadata is parsed from a trailing token like `[depends_on: 0,2,3]` inside the task description, and dependency order is mapped through sibling `columnOrder`.
- Files: `projects/briefs/command-centre/src/app/api/tasks/[id]/route.ts`, `projects/briefs/command-centre/src/lib/process-manager.ts`
- Impact: scheduling behavior depends on mutable prose. Editing the description, changing sibling order, or rewriting task text can silently change execution order.
- Fix approach: move dependency data into structured columns or a join table, then keep the description field purely user-facing.

**The update path is a large stateful shell flow with destructive recovery:**
- Issue: `scripts/update.sh` handles backup, pull, merge conflict recovery, skill reconciliation, and restore logic in one script, and its fallback path uses `git reset --hard origin/main`.
- Files: `scripts/update.sh`, `README.md`
- Impact: update behavior is hard to reason about, hard to test, and high-risk when local changes or edge cases are present.
- Fix approach: break the script into smaller testable functions and isolate the destructive recovery branch behind stronger validation and clearer dry-run checks.

## Known Bugs

**The main lint command is broken:**
- Symptoms: running `npm run lint` inside `projects/briefs/command-centre/` fails immediately with `Invalid project directory provided, no such directory: ...\\command-centre\\lint`.
- Files: `projects/briefs/command-centre/package.json`, `projects/briefs/command-centre/next.config.ts`
- Trigger: any normal lint run in the Command Centre app.
- Workaround: no repo-wired lint fallback is detected. `npm run build` currently runs, but it skips TypeScript validation because `projects/briefs/command-centre/next.config.ts` ignores build errors.

**The events route starts background polling during module import:**
- Symptoms: `npm run build` for `projects/briefs/command-centre/` logs `[cron-task-sync] Started polling every 3000 ms`, showing that background work starts as soon as the events route module is imported.
- Files: `projects/briefs/command-centre/src/app/api/events/route.ts`, `projects/briefs/command-centre/src/lib/cron-task-sync.ts`
- Trigger: importing `projects/briefs/command-centre/src/app/api/events/route.ts`, including during build-time analysis.
- Workaround: no code-level workaround is present. Restarting the process clears the interval, but the import side effect remains.

## Security Considerations

**Sensitive local config is exposed through unauthenticated HTTP endpoints:**
- Risk: `projects/briefs/command-centre/src/app/api/settings/env/route.ts` reads and writes the workspace `.env` file, `projects/briefs/command-centre/src/app/api/settings/claude-settings/route.ts` reads and writes `.claude/settings.json`, and `projects/briefs/command-centre/src/app/api/files/[...path]/route.ts` allows editing `context`, `brand_context`, `docs`, `projects`, `.planning`, `.claude/skills`, and root instruction files.
- Files: `projects/briefs/command-centre/src/app/api/settings/env/route.ts`, `projects/briefs/command-centre/src/app/api/settings/claude-settings/route.ts`, `projects/briefs/command-centre/src/app/api/files/[...path]/route.ts`, `README.md`, `projects/briefs/command-centre/brief.md`
- Current mitigation: the documented operating model is local-only on `http://localhost:3000` with no accounts.
- Recommendations: add a local auth boundary, same-origin protection, and a separate privileged mode for `.env`, `.claude/settings.json`, and root-file mutations.

**Path boundary checks are inconsistent and weaker in download/preview/upload routes:**
- Risk: `projects/briefs/command-centre/src/lib/file-service.ts` uses a safe root-plus-separator check, but `projects/briefs/command-centre/src/app/api/files/download/route.ts`, `projects/briefs/command-centre/src/app/api/files/preview/route.ts`, and `projects/briefs/command-centre/src/app/api/files/upload/route.ts` only check `resolvedPath.startsWith(config.agenticOsDir)`.
- Files: `projects/briefs/command-centre/src/lib/file-service.ts`, `projects/briefs/command-centre/src/app/api/files/download/route.ts`, `projects/briefs/command-centre/src/app/api/files/preview/route.ts`, `projects/briefs/command-centre/src/app/api/files/upload/route.ts`
- Current mitigation: the routes reject `..` path segments.
- Recommendations: replace all route-local path checks with the shared validation approach from `projects/briefs/command-centre/src/lib/file-service.ts`. This matters on Windows, where sibling paths can still share the same string prefix.

**The UI can trigger destructive root scripts without a server-side privilege boundary:**
- Risk: `projects/briefs/command-centre/src/lib/script-registry.ts` exposes `update.sh` as a destructive script, and `projects/briefs/command-centre/src/app/api/settings/scripts/run/route.ts` executes registered scripts with `bash`.
- Files: `projects/briefs/command-centre/src/lib/script-registry.ts`, `projects/briefs/command-centre/src/app/api/settings/scripts/run/route.ts`, `scripts/update.sh`
- Current mitigation: the route only prevents duplicate concurrent runs with an in-memory `runningScripts` set, and the registry marks destructive scripts with metadata.
- Recommendations: add server-side confirmation requirements, restrict script execution to explicitly approved actions, and log every privileged run.

**Client creation duplicates secrets into each workspace:**
- Risk: `scripts/add-client.sh` copies the root `.env` file into every new client workspace.
- Files: `scripts/add-client.sh`
- Current mitigation: no selective copy or secret scoping is present.
- Recommendations: move shared secrets to one source of truth or copy only the keys each client actually needs.

## Performance Bottlenecks

**Each running task can create a recursive filesystem watcher:**
- Problem: `FileWatcher` keeps one watcher per task, scopes it to a project when possible, and falls back to watching the broader `projects/` tree recursively.
- Files: `projects/briefs/command-centre/src/lib/file-watcher.ts`
- Cause: per-task watcher creation with `chokidar.watch(...)` and recursive directory scanning.
- Improvement path: use a shared watcher per workspace or project, then route detected files to tasks using metadata instead of one watcher per task.

**Cron-task sync polls SQLite every 3 seconds even when idle:**
- Problem: the cron sync service polls for recent cron-linked tasks on a fixed interval and keeps a long-lived timer in memory.
- Files: `projects/briefs/command-centre/src/lib/cron-task-sync.ts`, `projects/briefs/command-centre/src/app/api/events/route.ts`
- Cause: polling-based SSE refresh rather than event-driven updates from the task lifecycle itself.
- Improvement path: start polling only while subscribers exist, or replace polling with explicit task/cron event emission.

**Build tracing still reaches beyond the clean app boundary:**
- Problem: the current build emits tracing warnings that the whole project is being traced unintentionally.
- Files: `projects/briefs/command-centre/README.md`, `projects/briefs/command-centre/next.config.ts`, `projects/briefs/command-centre/src/lib/db.ts`, `projects/briefs/command-centre/src/lib/file-watcher.ts`, `projects/briefs/command-centre/src/lib/process-manager.ts`
- Cause: runtime code reads and watches workspace files dynamically, which keeps pulling more of the repository into server tracing.
- Improvement path: narrow dynamic filesystem access behind explicit server-only adapters and remove import-time work from routes.

## Fragile Areas

**Process/session orchestration is split between memory and SQLite state:**
- Files: `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/app/api/tasks/[id]/reply/route.ts`, `projects/briefs/command-centre/src/lib/queue-watcher.ts`
- Why fragile: `ProcessManager` keeps session maps and waiting-for-reply state in memory, while reply and recovery routes fall back to DB state when memory is stale. `queue-watcher.ts` already compensates for lost process references by moving orphaned tasks to review.
- Safe modification: add focused tests around reply, resume, orphan recovery, and queue transitions before changing session ownership or process cleanup paths.
- Test coverage: no automated tests are detected for `projects/briefs/command-centre/src/lib/process-manager.ts` or `projects/briefs/command-centre/src/app/api/tasks/[id]/reply/route.ts`.

**Dependency-aware task scheduling is brittle:**
- Files: `projects/briefs/command-centre/src/app/api/tasks/[id]/route.ts`, `projects/briefs/command-centre/src/lib/process-manager.ts`
- Why fragile: the scheduler depends on parsing a description suffix and mapping dependency numbers onto sibling ordering. Reordering or rewriting tasks can change execution semantics.
- Safe modification: do not add more scheduling features on top of the current string format. Add structured dependency storage first, then migrate existing parsing logic behind one compatibility layer.
- Test coverage: no automated tests are detected for dependency parsing, sibling unblocking, or phase auto-queue behavior.

**The main board UI is hard to change safely:**
- Files: `projects/briefs/command-centre/src/components/board/feed-view.tsx`, `projects/briefs/command-centre/src/components/modal/modal-summary-tab.tsx`, `projects/briefs/command-centre/src/components/board/task-create-input.tsx`, `projects/briefs/command-centre/src/components/tasks/tasks-view.tsx`
- Why fragile: large UI files mix rendering, drag-and-drop, task mutation, modal state, and optimistic client behavior.
- Safe modification: extract one view-model or hook at a time and verify the core flows manually after each extraction.
- Test coverage: no component tests or end-to-end tests are detected for the board, modal, or task creation flows.

**Update automation carries high recovery risk:**
- Files: `scripts/update.sh`, `scripts/test-update.sh`
- Why fragile: the update flow mixes interactive prompts, git state handling, backup and restore behavior, and a hard reset fallback in one shell script.
- Safe modification: treat the destructive branch as its own subsystem. Add more scripted test scenarios before changing merge, backup, or restore logic.
- Test coverage: `scripts/test-update.sh` exists as a manual harness, but no repo-wired automated shell test suite is detected.

## Scaling Limits

**The current runtime is designed for one local workspace and one server process:**
- Current capacity: the Command Centre brief explicitly targets SQLite persistence, local-only operation, and no accounts, while runtime ownership is split across a single local SQLite file plus in-memory maps and sets.
- Files: `projects/briefs/command-centre/brief.md`, `projects/briefs/command-centre/src/lib/db.ts`, `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/app/api/settings/scripts/run/route.ts`
- Limit: multi-user access, remote deployment, multiple app instances, or process restarts break assumptions around session ownership, privileged settings mutation, and script execution control.
- Scaling path: move runtime ownership, locks, and reply state into durable shared storage; add authentication; and separate agent execution from the UI process.

## Dependencies at Risk

**The installed Next.js toolchain is already out of sync with the lint command:**
- Risk: the app depends on `next` `^16.2.1`, but the repo still uses `next lint` as the lint script even though it no longer works in the current setup.
- Impact: linting drops out of the normal developer workflow, leaving code quality regressions invisible until runtime.
- Migration plan: replace the lint script in `projects/briefs/command-centre/package.json` with a direct `eslint` command and restore strict type-checking in `projects/briefs/command-centre/next.config.ts`.

## Missing Critical Features

**There is no authentication or privilege separation for the web UI:**
- Problem: the app exposes settings editing, file mutation, and script execution through HTTP while the brief still frames the product as local-only and account-free.
- Blocks: safe LAN use, remote access, hardened deployment, and any future multi-user support.

**There is no single repo-wired verification gate for the Command Centre:**
- Problem: `projects/briefs/command-centre/package.json` has no general `test` script, only a narrow `test:cron` script; `npm run lint` is broken; and `projects/briefs/command-centre/next.config.ts` skips type-check failures during build.
- Blocks: safe refactors of scheduler, subprocess, and file-management code because the highest-risk paths are not covered by one required validation command.

## Test Coverage Gaps

**Only the cron runtime and queue watcher have wired app-level automated tests:**
- What's not tested: most of the task execution, settings, file-management, and UI surface of the Command Centre.
- Files: `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`, `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`, `projects/briefs/command-centre/package.json`
- Risk: the repo can show a green test result while critical user-facing flows remain unverified.
- Priority: High

**Task execution and resume flows are untested:**
- What's not tested: subprocess spawning, session persistence, reply handling, resume behavior, and process recovery.
- Files: `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/app/api/tasks/[id]/reply/route.ts`, `projects/briefs/command-centre/src/lib/subprocess.ts`
- Risk: task continuation and recovery bugs can ship unnoticed, especially after restart or stale in-memory state.
- Priority: High

**Privileged settings and file APIs are untested:**
- What's not tested: `.env` editing, `.claude/settings.json` editing, file path validation, upload, download, and preview behavior.
- Files: `projects/briefs/command-centre/src/app/api/settings/env/route.ts`, `projects/briefs/command-centre/src/app/api/settings/claude-settings/route.ts`, `projects/briefs/command-centre/src/app/api/files/[...path]/route.ts`, `projects/briefs/command-centre/src/app/api/files/download/route.ts`, `projects/briefs/command-centre/src/app/api/files/preview/route.ts`, `projects/briefs/command-centre/src/app/api/files/upload/route.ts`
- Risk: security regressions, Windows path bugs, or accidental destructive writes can reach users without detection.
- Priority: High

**Task dependency scheduling is untested:**
- What's not tested: parsing `[depends_on: ...]`, mapping dependency indices to siblings, and auto-queue behavior when subtasks complete.
- Files: `projects/briefs/command-centre/src/app/api/tasks/[id]/route.ts`, `projects/briefs/command-centre/src/lib/process-manager.ts`
- Risk: GSD and project-level task orchestration can behave differently from what the board shows, especially after edits or reorder operations.
- Priority: High

**Update and client bootstrap scripts are not part of an enforced automated suite:**
- What's not tested: new-client bootstrap, update conflict recovery, and launcher behavior across shell environments.
- Files: `scripts/add-client.sh`, `scripts/update.sh`, `scripts/centre.sh`, `scripts/centre.ps1`, `scripts/test-update.sh`
- Risk: install and upgrade failures remain operational surprises instead of caught regressions.
- Priority: Medium

---

*Concerns audit: 2026-04-13*
