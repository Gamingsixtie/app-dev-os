# Coding Conventions

**Analysis Date:** 2026-04-13

## Naming Patterns

**Files:**
- Follow kebab-case for most TypeScript, TSX, Bash, and PowerShell files. Representative files: `projects/briefs/command-centre/src/components/layout/app-shell.tsx`, `projects/briefs/command-centre/src/components/board/task-create-input.tsx`, `projects/briefs/command-centre/src/hooks/use-sse.ts`, `scripts/add-client.sh`, `scripts/test-windows-notify.ps1`.
- Keep Next App Router framework entry files in the framework naming scheme: `projects/briefs/command-centre/src/app/page.tsx`, `projects/briefs/command-centre/src/app/layout.tsx`, `projects/briefs/command-centre/src/app/global-error.tsx`, and `projects/briefs/command-centre/src/app/api/tasks/route.ts`.
- Python files use snake_case module names. Representative files: `scripts/select-skills.py`, `.claude/skills/str-trending-research/scripts/lib/openai_reddit.py`, `.claude/skills/viz-nano-banana/scripts/test_generate_image.py`.

**Functions:**
- Use camelCase for TypeScript helpers and store actions: `getDb`, `resolveAgenticOsRoot`, `fetchTasks`, `createTask`, `handleSave`.
- Use PascalCase for React components and exported UI units: `AppShell`, `MarkdownEditor`, `ContentViewer`, `GlobalError`.
- Export uppercase HTTP verb handlers in route files: `GET`, `POST`, `PATCH`, and `DELETE` in files such as `projects/briefs/command-centre/src/app/api/tasks/route.ts` and `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`.
- Use snake_case or short lowercase helper names in Bash: `create_client_agents_file`, `create_client_cron_proxy_scripts`, `ok`, `warn`, `fail` in `scripts/add-client.sh`, `scripts/setup.sh`, and `scripts/test-update.sh`.
- Use PowerShell verb-style PascalCase function names in PowerShell modules: `Invoke-InWindowsPowerShell`, `Assert-AllowedValue`, `Resolve-TemplateText` in `scripts/windows-notify.ps1`.

**Variables:**
- Use camelCase for local variables and state in TypeScript: `selectedClientId`, `retryDelay`, `initialStatus`, `workspaceDir`.
- Use UPPER_SNAKE_CASE for shared constants and sets: `IMAGE_EXTENSIONS`, `BINARY_EXTENSIONS`, `REAP_INTERVAL_MS`, `FIXED_TIME_RE`, `WORKDAY_TOKENS`.
- Use a leading underscore for mutable module-private caches when the code wants to signal “internal only”: `_recentlyCreatedIds` and `_pendingCreates` in `projects/briefs/command-centre/src/store/task-store.ts`.
- Use uppercase variable names for shell script paths and environment constants: `PROJECT_DIR`, `CLIENT_DIR`, `TEST_ROOT`, `MAIN_REPO` in `scripts/add-client.sh` and `scripts/test-update.sh`.

**Types:**
- Use PascalCase for interfaces and type aliases: `Task`, `TaskStore`, `TaskCreateInput`, `PermissionMode`, `ClientStore` in `projects/briefs/command-centre/src/types/task.ts` and `projects/briefs/command-centre/src/store/client-store.ts`.
- Prefer literal unions over enum declarations for status-like values: `TaskStatus`, `TaskLevel`, `PermissionMode` in `projects/briefs/command-centre/src/types/task.ts`.
- Keep display labels and help text beside the type in uppercase `Record` maps: `LEVEL_LABELS`, `LEVEL_HINTS`, `PERMISSION_MODE_LABELS`, `PERMISSION_MODE_HINTS` in `projects/briefs/command-centre/src/types/task.ts`.

## Code Style

**Formatting:**
- No repo-level Prettier or Biome config was detected at the workspace root or inside `projects/briefs/command-centre/`.
- TypeScript and TSX under `projects/briefs/command-centre/src/` are consistently written with double quotes, semicolons, and 2-space indentation. Representative files: `projects/briefs/command-centre/src/app/api/tasks/route.ts`, `projects/briefs/command-centre/src/lib/db.ts`, `projects/briefs/command-centre/src/store/client-store.ts`.
- Wrapped argument lists and object literals keep trailing commas in multiline form. Representative files: `projects/briefs/command-centre/src/lib/subprocess.ts` and `projects/briefs/command-centre/src/app/api/tasks/route.ts`.
- React UI files favor inline `style={{ ... }}` objects instead of CSS modules or utility-class-heavy markup. Representative files: `projects/briefs/command-centre/src/components/layout/app-shell.tsx`, `projects/briefs/command-centre/src/components/shared/markdown-editor.tsx`, and `projects/briefs/command-centre/src/components/context/content-viewer.tsx`.
- Bash and PowerShell scripts favor banner comments, setup blocks, and small local helper functions instead of sourcing a formatting tool. Representative files: `scripts/setup.sh`, `scripts/add-client.sh`, `scripts/windows-notify.ps1`.

**Linting:**
- The only wired lint command is `npm run lint` in `projects/briefs/command-centre/package.json`, which currently runs `next lint`.
- No checked-in ESLint config file was found in `projects/briefs/command-centre/`, so lint behavior depends on Next defaults and inline suppressions.
- Inline ESLint suppressions are used when the current code intentionally breaks a framework rule:
- `react-hooks/exhaustive-deps` is disabled inline in `projects/briefs/command-centre/src/components/context/context-file-list.tsx`, `projects/briefs/command-centre/src/components/modal/task-modal.tsx`, and `projects/briefs/command-centre/src/components/modal/modal-summary-tab.tsx`.
- `@next/next/no-img-element` is disabled inline in `projects/briefs/command-centre/src/components/context/content-viewer.tsx`, `projects/briefs/command-centre/src/components/board/task-create-input.tsx`, `projects/briefs/command-centre/src/components/board/file-preview-modal.tsx`, `projects/briefs/command-centre/src/components/modal/modal-file-preview.tsx`, and `projects/briefs/command-centre/src/components/panel/panel-outputs.tsx`.
- Current observed state: running `npm run lint` inside `projects/briefs/command-centre/` fails with `Invalid project directory provided ...\\lint`, so lint exists as a script but is not a working quality gate right now.

## Import Organization

**Order:**
1. Import framework and external packages first. Common examples: `react`, `next/server`, `next/navigation`, `lucide-react`, `zustand`, `better-sqlite3`, and Node built-ins. Representative files: `projects/briefs/command-centre/src/hooks/use-sse.ts`, `projects/briefs/command-centre/src/components/board/feed-view.tsx`, `projects/briefs/command-centre/src/lib/db.ts`.
2. Import workspace alias modules from `@/` next. Representative files: `projects/briefs/command-centre/src/components/context/content-viewer.tsx`, `projects/briefs/command-centre/src/app/api/tasks/route.ts`, `projects/briefs/command-centre/src/store/task-store.ts`.
3. Import relative sibling modules last when the dependency is local to the same feature folder. Representative files: `./client-store` in `projects/briefs/command-centre/src/store/task-store.ts`, `./scope-bar` in `projects/briefs/command-centre/src/components/layout/app-shell.tsx`, and `../shared/markdown-preview` in `projects/briefs/command-centre/src/components/modal/modal-file-preview.tsx`.

**Path Aliases:**
- `@/*` maps to `projects/briefs/command-centre/src/*` via `projects/briefs/command-centre/tsconfig.json`.
- The codebase mixes alias imports and relative imports. Alias imports are preferred for cross-feature references; relative imports are still common for close siblings.
- `import type` is used often to separate type-only dependencies from runtime imports. Representative files: `projects/briefs/command-centre/src/store/task-store.ts`, `projects/briefs/command-centre/src/types/task.ts`, and `projects/briefs/command-centre/src/components/gsd/phase-pipeline.tsx`.

## Error Handling

**Patterns:**
- Wrap API route handlers in `try/catch`, log the failure, and return a JSON error payload with a status code. Representative files: `projects/briefs/command-centre/src/app/api/tasks/route.ts`, `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`, `projects/briefs/command-centre/src/app/api/chat/message/route.ts`.
- Handle validation and missing-resource cases with early `400` or `404` returns instead of throwing. Representative files: `projects/briefs/command-centre/src/app/api/tasks/route.ts` and `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`.
- Throw plain `Error` objects inside client stores and UI helpers on non-OK fetch responses, then catch and store a readable message in component or store state. Representative files: `projects/briefs/command-centre/src/store/task-store.ts`, `projects/briefs/command-centre/src/store/client-store.ts`, `projects/briefs/command-centre/src/components/context/content-viewer.tsx`, `projects/briefs/command-centre/src/components/brand/brand-detail-panel.tsx`.
- Throw directly from low-level library modules for invalid paths, missing files, or bad environment assumptions, and let the caller translate that into UI or HTTP behavior. Representative files: `projects/briefs/command-centre/src/lib/file-service.ts`, `projects/briefs/command-centre/src/lib/config.ts`, `projects/briefs/command-centre/src/lib/clients.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`.
- Use silent catches only for intentionally ignored failures, such as malformed SSE payloads in `projects/briefs/command-centre/src/hooks/use-sse.ts` or schema-path fallback in `projects/briefs/command-centre/src/lib/db.ts`.

## Logging

**Framework:** `console`

**Patterns:**
- Prefix log lines with a subsystem tag when the module emits operational logs. Representative tags: `[queue-watcher]` in `projects/briefs/command-centre/src/lib/queue-watcher.ts`, `[process-manager]` in `projects/briefs/command-centre/src/lib/process-manager.ts`, `[event-bus]` in `projects/briefs/command-centre/src/lib/event-bus.ts`, and `[cron-scheduler]` in `projects/briefs/command-centre/src/lib/cron-scheduler.ts`.
- Keep API route logging mostly failure-only. The common pattern is `console.error("METHOD /api/... error:", error)` inside the route file. Representative files: `projects/briefs/command-centre/src/app/api/tasks/route.ts`, `projects/briefs/command-centre/src/app/api/cron/system-status/route.ts`, `projects/briefs/command-centre/src/app/api/projects/route.ts`.
- Use small output helpers instead of a logging library in Bash. Representative files: `scripts/setup.sh` with `ok`, `warn`, `fail`, and `scripts/test-update.sh` with `info`, `ok`, `warn`, `err`, `header`.
- Use strict mode plus thrown exceptions in PowerShell, then surface result text to the caller. Representative files: `scripts/windows-notify.ps1` and `scripts/test-windows-notify.ps1`.

## Comments

**When to Comment:**
- Comment when the code is handling recovery logic, migrations, cross-platform behavior, or framework-specific edge cases. Good examples:
- Recovery policy explanation in `projects/briefs/command-centre/src/lib/queue-watcher.ts`
- SQLite migration notes in `projects/briefs/command-centre/src/lib/db.ts`
- Windows-specific process behavior in `projects/briefs/command-centre/src/lib/subprocess.ts`
- Non-blocking setup rationale in `scripts/setup.sh`
- UI files use fewer explanatory comments; they mostly keep short intent comments for sections such as `/* Sticky header */` in `projects/briefs/command-centre/src/components/layout/app-shell.tsx`.

**JSDoc/TSDoc:**
- Short JSDoc-style block comments are present around utility functions and service helpers, especially in `projects/briefs/command-centre/src/lib/file-service.ts` and `projects/briefs/command-centre/src/lib/queue-watcher.ts`.
- Most components, stores, and route files do not use formal TSDoc. Clear naming plus inline comments is the dominant pattern.
- Root scripts prefer top-of-file usage headers and section banners over per-function documentation. Representative files: `scripts/add-client.sh`, `scripts/test-update.sh`, `scripts/setup.sh`.

## Function Design

**Size:** Current practice is mixed by layer.
- Keep simple helpers compact and single-purpose in utility modules such as `projects/briefs/command-centre/src/lib/subprocess.ts`, `projects/briefs/command-centre/src/hooks/use-client-id.ts`, and `projects/briefs/command-centre/src/types/*.ts`.
- Allow orchestration-heavy modules to grow large when they own a full workflow. Representative large files: `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, `projects/briefs/command-centre/src/store/task-store.ts`, and `projects/briefs/command-centre/src/components/context/content-viewer.tsx`.

**Parameters:**
- Use explicit TypeScript parameter types and inline object typing where the function is closely tied to one caller. Representative files: `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`, `projects/briefs/command-centre/src/lib/file-service.ts`, `projects/briefs/command-centre/src/lib/subprocess.ts`.
- Prefer optional arguments or options objects over overloads. Examples: `listDirectory(relativePath, options?)` in `projects/briefs/command-centre/src/lib/file-service.ts` and `spawnManagedTaskProcess(command, args, options?)` in `projects/briefs/command-centre/src/lib/subprocess.ts`.
- Root scripts use positional CLI arguments and validate them immediately with usage output. Representative files: `scripts/add-client.sh` and `scripts/test-update.sh`.

**Return Values:**
- Return `NextResponse.json(...)` directly from route handlers instead of wrapping responses in a shared responder layer. Representative files: `projects/briefs/command-centre/src/app/api/tasks/route.ts` and `projects/briefs/command-centre/src/app/api/cron/[name]/run/route.ts`.
- Return `Promise<void>` from Zustand store actions and write results into store state rather than returning fetched payloads to callers. Representative files: `projects/briefs/command-centre/src/store/task-store.ts`, `projects/briefs/command-centre/src/store/client-store.ts`, `projects/briefs/command-centre/src/store/cron-store.ts`.
- Return typed objects or `void` from low-level libraries and throw on failure. Representative files: `projects/briefs/command-centre/src/lib/config.ts`, `projects/briefs/command-centre/src/lib/file-service.ts`, `projects/briefs/command-centre/src/lib/db.ts`.
- Use exit codes plus printed output for shell and PowerShell scripts instead of structured return data.

## Module Design

**Exports:** Named exports are the default.
- Representative named exports: `getDb` in `projects/briefs/command-centre/src/lib/db.ts`, `useTaskStore` in `projects/briefs/command-centre/src/store/task-store.ts`, `AppShell` in `projects/briefs/command-centre/src/components/layout/app-shell.tsx`, and `ContentViewer` in `projects/briefs/command-centre/src/components/context/content-viewer.tsx`.
- Default exports are rare and mostly limited to framework entrypoints such as `projects/briefs/command-centre/src/app/page.tsx` and `projects/briefs/command-centre/src/app/global-error.tsx`.
- Keep TypeScript types and related label maps together in the same module. Representative file: `projects/briefs/command-centre/src/types/task.ts`.
- Use CommonJS for runtime/test glue around cron and launcher code. Representative files: `projects/briefs/command-centre/src/lib/cron-runtime.js`, `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`, `projects/briefs/command-centre/scripts/next-run.cjs`.

**Barrel Files:** Not detected.
- No barrel files were found under `projects/briefs/command-centre/src/`.
- Imports usually point to the concrete module path, which keeps dependencies explicit. Representative examples appear throughout `projects/briefs/command-centre/src/components/**`, `src/store/**`, and `src/lib/**`.
- Root scripts follow the same direct-import pattern and only source small shared helpers such as `scripts/lib/python.sh`.

---

*Convention analysis: 2026-04-13*
