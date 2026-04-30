# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Workspace-centered, file-system-first local application with an embedded Next.js control panel.

**Key Characteristics:**
- Use the workspace itself as the source of truth. Shared instructions, skills, briefs, cron jobs, and client data live in regular files under `AGENTS.md`, `context/`, `brand_context/`, `.claude/skills/`, `projects/`, `cron/`, and `clients/`.
- Treat the web app in `projects/briefs/command-centre/` as a local operator console, not as an isolated product backend. It reads and writes the surrounding Agentic OS workspace directly through `projects/briefs/command-centre/src/lib/config.ts` and `projects/briefs/command-centre/src/lib/file-service.ts`.
- Keep runtime state local. Durable operational state goes to SQLite in `.command-centre/data.db` through `projects/briefs/command-centre/src/lib/db.ts`; live updates use the in-memory event bus in `projects/briefs/command-centre/src/lib/event-bus.ts`.

## Layers

**Shared Workspace Layer:**
- Purpose: Hold the canonical operating rules, persona, skills, docs, outputs, and scheduled jobs.
- Location: `AGENTS.md`, `CLAUDE.md`, `context/`, `brand_context/`, `.claude/`, `docs/`, `projects/`, `cron/`.
- Contains: Shared methodology, Claude wrappers, memory files, learnings, skill packs, project briefs, deliverables, cron templates, and root jobs.
- Depends on: Plain filesystem structure.
- Used by: `scripts/*.sh`, `scripts/*.ps1`, and the Command Centre service layer in `projects/briefs/command-centre/src/lib/`.

**Client Workspace Layer:**
- Purpose: Isolate per-client instructions and data while keeping shared methodology synchronized.
- Location: `clients/{slug}/`.
- Contains: Client-local `AGENTS.md`, `CLAUDE.md`, `brand_context/`, `context/`, `projects/`, `cron/`, copied `.claude/skills/`, and copied `scripts/`.
- Depends on: Root provisioning and sync scripts such as `scripts/add-client.sh` and `scripts/update-clients.sh`.
- Used by: `projects/briefs/command-centre/src/lib/clients.ts`, `projects/briefs/command-centre/src/lib/config.ts`, and every API route that accepts `clientId`.

**Presentation Layer:**
- Purpose: Render the local dashboard and route-specific screens.
- Location: `projects/briefs/command-centre/src/app/`, `projects/briefs/command-centre/src/components/`, `projects/briefs/command-centre/src/hooks/`, `projects/briefs/command-centre/src/store/`.
- Contains: App Router pages such as `src/app/page.tsx`, section routes like `src/app/cron/page.tsx`, feature components under `src/components/{feature}/`, hooks like `src/hooks/use-sse.ts`, and Zustand stores like `src/store/task-store.ts`.
- Depends on: Fetch calls to `src/app/api/**`, SSE from `src/app/api/events/route.ts`, and type definitions in `src/types/`.
- Used by: The browser only.

**API Layer:**
- Purpose: Translate UI actions into workspace reads/writes and runtime actions.
- Location: `projects/briefs/command-centre/src/app/api/`.
- Contains: Route handlers for tasks, files, chat, projects, cron, settings, context, skills, dashboard, and GSD.
- Depends on: `projects/briefs/command-centre/src/lib/` helpers plus SQLite.
- Used by: Client stores, hooks, and view components.

**Runtime Services Layer:**
- Purpose: Centralize backend behavior that should not live inside route handlers.
- Location: `projects/briefs/command-centre/src/lib/`.
- Contains: Workspace discovery in `config.ts`, SQLite bootstrapping in `db.ts`, queue orchestration in `queue-watcher.ts`, Claude CLI management in `process-manager.ts`, cron wrappers in `cron-service.ts`, scheduler leadership in `cron-scheduler.ts`, file operations in `file-service.ts`, file-output detection in `file-watcher.ts`, and GSD parsing in `gsd-parser.ts`.
- Depends on: Node filesystem/process APIs, `better-sqlite3`, `chokidar`, and the surrounding Agentic OS workspace.
- Used by: API routes and `src/instrumentation.ts`.

**Persistence and Runtime State Layer:**
- Purpose: Store durable local state and coordination metadata.
- Location: `.command-centre/`, `projects/briefs/command-centre/src/lib/schema.sql`, `cron/logs/`, `cron/status/`.
- Contains: SQLite tables for tasks, outputs, logs, conversations, decisions, projects, and cron runs; runtime port file; cron leadership lock/heartbeat; generated logs and status files.
- Depends on: `projects/briefs/command-centre/src/lib/db.ts` and root or client workspace paths.
- Used by: Queue watcher, process manager, cron runtime, dashboard summary routes, and task/chat flows.

## Data Flow

**Task Execution Flow:**

1. UI state in `projects/briefs/command-centre/src/store/task-store.ts` or `projects/briefs/command-centre/src/store/chat-store.ts` sends requests to routes such as `src/app/api/tasks/route.ts` or `src/app/api/chat/message/route.ts`.
2. The route writes rows into SQLite through `projects/briefs/command-centre/src/lib/db.ts` and emits a task event through `projects/briefs/command-centre/src/lib/event-bus.ts`.
3. `projects/briefs/command-centre/src/instrumentation.ts` initializes `initQueueWatcher()` from `projects/briefs/command-centre/src/lib/queue-watcher.ts`, which listens for queued tasks and calls `processManager.executeTask()`.
4. `projects/briefs/command-centre/src/lib/process-manager.ts` resolves the correct workspace root or client workspace, loads available context files, builds the Claude prompt, and spawns a managed Claude CLI subprocess through `projects/briefs/command-centre/src/lib/subprocess.ts`.
5. Claude stream output is parsed by `projects/briefs/command-centre/src/lib/claude-parser.ts`, persisted through `projects/briefs/command-centre/src/lib/task-logs.ts`, and any new deliverable files are captured by `projects/briefs/command-centre/src/lib/file-watcher.ts`.
6. `projects/briefs/command-centre/src/app/api/events/route.ts` pushes those updates as SSE, and `projects/briefs/command-centre/src/hooks/use-sse.ts` merges them back into the browser stores.

**Workspace File Management Flow:**

1. Tree views and editors call `projects/briefs/command-centre/src/app/api/files/route.ts` and `projects/briefs/command-centre/src/app/api/files/[...path]/route.ts`.
2. Those routes resolve the base directory with `projects/briefs/command-centre/src/lib/config.ts`, optionally switching into `clients/{slug}/`.
3. `projects/briefs/command-centre/src/lib/file-service.ts` validates allowed roots, blocks path traversal, and performs atomic read/write/move/delete operations.
4. The UI refreshes from the same API surface, so file edits stay aligned with the real workspace files.

**GSD Synchronization Flow:**

1. `projects/briefs/command-centre/src/hooks/use-gsd-sync.ts` posts to `projects/briefs/command-centre/src/app/api/gsd/ensure-task/route.ts`.
2. The route reads `.planning/ROADMAP.md`, project briefs under `projects/briefs/*/brief.md`, and phase folders under `.planning/phases/`.
3. `projects/briefs/command-centre/src/lib/gsd-parser.ts` converts roadmap text into structured phase data.
4. The route creates or updates synthetic `gsd` parent tasks and phase subtasks in SQLite, so the board reflects the live GSD project without duplicating the source files.

**State Management:**
- Treat the filesystem and `.planning/` as the source of truth for instructions, briefs, outputs, and cron job definitions.
- Treat SQLite in `.command-centre/data.db` as the source of truth for operational UI state such as task status, chat conversations, logs, outputs, and cron run history.
- Use Zustand stores in `projects/briefs/command-centre/src/store/` as browser-side caches only.
- Use SSE from `projects/briefs/command-centre/src/app/api/events/route.ts` to keep browser caches synchronized with server-side changes.

## Key Abstractions

**Workspace Root Resolution:**
- Purpose: Ensure the web app always acts on the correct Agentic OS workspace.
- Examples: `projects/briefs/command-centre/src/lib/config.ts`, `projects/briefs/command-centre/scripts/next-run.cjs`.
- Pattern: Resolve the repo root by finding `AGENTS.md` or `CLAUDE.md`, then derive `.command-centre/`, `clients/{slug}/`, and workspace-relative paths from there.

**Task as the Central Runtime Unit:**
- Purpose: Represent all executable work, from quick tasks to project containers to GSD parent tasks.
- Examples: `projects/briefs/command-centre/src/types/task.ts`, `projects/briefs/command-centre/src/lib/schema.sql`, `projects/briefs/command-centre/src/app/api/tasks/route.ts`.
- Pattern: Keep status-based orchestration in SQLite and let watchers/process managers react to state transitions.

**Project Brief as the Source of Planning Metadata:**
- Purpose: Keep project scope in markdown rather than hidden database-only metadata.
- Examples: `projects/briefs/*/brief.md`, `projects/briefs/command-centre/src/app/api/projects/route.ts`, `projects/briefs/command-centre/src/app/api/dashboard/summary/route.ts`.
- Pattern: Read project folders from disk, then enrich them with live counts from SQLite.

**Client Scope as a Path Switch, Not a Separate Deployment:**
- Purpose: Reuse one app and one shared methodology across many clients.
- Examples: `clients/acme-inc/`, `projects/briefs/command-centre/src/lib/clients.ts`, `projects/briefs/command-centre/src/store/client-store.ts`.
- Pattern: Pass `clientId`, resolve a different base directory, then reuse the same API/service code.

**Cron Job as a Markdown Artifact:**
- Purpose: Keep scheduled work human-editable and workspace-native.
- Examples: `cron/jobs/*.md`, `clients/{slug}/cron/jobs/*.md`, `projects/briefs/command-centre/src/lib/cron-service.ts`, `scripts/lib/cron-db.py`.
- Pattern: Define jobs in markdown, queue executions into SQLite tasks, and reconcile runtime state through shared cron runtime metadata.

## Entry Points

**Shared Instructions Entry Point:**
- Location: `AGENTS.md`
- Triggers: Codex and other tools that read repo instructions.
- Responsibilities: Define shared operating rules, skill registry, context matrix, service registry, project structure, and routing behavior.

**Claude Runtime Wrapper Entry Point:**
- Location: `CLAUDE.md`
- Triggers: Claude Code sessions launched from the root workspace.
- Responsibilities: Import `AGENTS.md`, add Claude-specific startup behavior, memory handling, and session rules.

**Client Workspace Entry Point:**
- Location: `clients/{slug}/AGENTS.md` and `clients/{slug}/CLAUDE.md`
- Triggers: Tool sessions started inside a client folder.
- Responsibilities: Layer client-specific instructions on top of the root workspace behavior.

**Command Centre Launcher Entry Point:**
- Location: `scripts/centre.sh`, `scripts/centre.ps1`, `projects/briefs/command-centre/scripts/next-run.cjs`
- Triggers: `centre`, `powershell -File scripts\centre.ps1`, or direct `npm run dev|build|start` inside `projects/briefs/command-centre/`.
- Responsibilities: Verify dependencies, locate the workspace root, set `AGENTIC_OS_DIR`, and start the local Next.js app.

**App Bootstrap Entry Point:**
- Location: `projects/briefs/command-centre/src/instrumentation.ts`, `projects/briefs/command-centre/src/app/layout.tsx`, `projects/briefs/command-centre/src/app/page.tsx`
- Triggers: Next.js server startup and browser navigation.
- Responsibilities: Start queue watcher and in-process cron scheduler, register file-watcher cleanup, wrap the app in the SSE provider, and render the main dashboard surface.

**Script and Cron Entry Points:**
- Location: `scripts/add-client.sh`, `scripts/start-crons.sh`, `scripts/start-crons.ps1`, `scripts/run-job.sh`, `scripts/lib/cron-db.py`
- Triggers: CLI operations and cron daemon/runtime execution.
- Responsibilities: Provision client workspaces, manage the managed cron runtime, and convert cron runs into task/cron_run/task_output records.

## Error Handling

**Strategy:** Fail locally, return explicit JSON errors, and recover long-running work through status transitions rather than silent background assumptions.

**Patterns:**
- Return structured API errors with HTTP status codes from routes in `projects/briefs/command-centre/src/app/api/**/route.ts`.
- Validate file access centrally in `projects/briefs/command-centre/src/lib/file-service.ts` before any filesystem mutation.
- Use optimistic browser updates in `projects/briefs/command-centre/src/store/task-store.ts`, but revert state when the server rejects a change.
- Reconcile orphaned tasks, dead PIDs, and stuck cron runs in `projects/briefs/command-centre/src/lib/queue-watcher.ts` instead of trying to auto-resume everything.
- Move interactive failures into review/needs-input states in `projects/briefs/command-centre/src/lib/process-manager.ts` so the user can continue explicitly.

## Cross-Cutting Concerns

**Logging:** Use `console` for server diagnostics, `task_logs` in SQLite through `projects/briefs/command-centre/src/lib/task-logs.ts` for task timelines, and `cron/logs/` plus `.command-centre/` files for scheduler diagnostics.

**Validation:** Use route-level body checks, path validation in `projects/briefs/command-centre/src/lib/file-service.ts`, workspace detection in `projects/briefs/command-centre/src/lib/config.ts`, and cron schedule validation through `projects/briefs/command-centre/src/lib/cron-service.ts`.

**Authentication:** No application-level auth is present. The boundary is local machine access to the workspace and the user’s ability to run the local CLI/scripts.

---

*Architecture analysis: 2026-04-13*
