# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```text
agentic-os/
├── AGENTS.md                              # Canonical shared operating rules
├── CLAUDE.md                              # Claude wrapper that imports `AGENTS.md`
├── .claude/                               # Shared Claude commands, hooks, settings, and skills
├── brand_context/                         # Root brand files for solo/shared workspace use
├── clients/                               # Per-client workspaces that mirror the main data layout
├── context/                               # Root persona, learnings, and daily memory
├── cron/                                  # Root cron jobs, templates, and runtime output folders
├── docs/                                  # Human-facing operational documentation
├── projects/                              # Root deliverables and project briefs
├── scripts/                               # Shared shell, PowerShell, and Python operations
├── .planning/                             # Active GSD workspace for the current root project
└── projects/briefs/command-centre/        # Embedded Next.js dashboard application
```

## Directory Purposes

**`.claude/`:**
- Purpose: Hold Claude-specific commands, hooks, settings, and the shared skills pack.
- Contains: `.claude/commands/`, `.claude/hooks/`, `.claude/hooks_info/`, `.claude/skills/`, `.claude/settings.json`.
- Key files: `.claude/settings.json`, `.claude/commands/start-here.md`, `.claude/skills/{category}-{skill-name}/SKILL.md`.

**`context/`:**
- Purpose: Hold root workspace identity and memory.
- Contains: `SOUL.md`, `USER.md`, `learnings.md`, `memory/*.md`.
- Key files: `context/SOUL.md`, `context/USER.md`, `context/learnings.md`.

**`brand_context/`:**
- Purpose: Hold root brand artifacts used by skills and workflows.
- Contains: Markdown files such as voice, positioning, ICP, and supporting brand notes.
- Key files: `brand_context/voice-profile.md`, `brand_context/positioning.md`, `brand_context/icp.md` when present.

**`clients/`:**
- Purpose: Hold isolated client workspaces.
- Contains: One folder per slug, for example `clients/acme-inc/`, each with its own `AGENTS.md`, `CLAUDE.md`, `.claude/`, `brand_context/`, `context/`, `projects/`, `cron/`, and copied `scripts/`.
- Key files: `clients/acme-inc/AGENTS.md`, `clients/acme-inc/CLAUDE.md`.

**`cron/`:**
- Purpose: Hold root scheduled job definitions and cron templates.
- Contains: `jobs/`, `templates/`, plus generated `logs/` and `status/`.
- Key files: `cron/jobs/*.md`, `cron/templates/schedule-reference.md`.

**`docs/`:**
- Purpose: Hold reference documentation for operators.
- Contains: Setup and usage guides tied to the workspace model.
- Key files: `docs/multi-client-guide.md`, `docs/projects-guide.md`, `docs/cheat-sheet.md`.

**`projects/`:**
- Purpose: Hold deliverables and brief-based project folders.
- Contains: Level 1 output folders such as `projects/mkt-copywriting/` and brief-based project folders under `projects/briefs/`.
- Key files: `projects/briefs/{project-slug}/brief.md`, `projects/mkt-copywriting/**`.

**`scripts/`:**
- Purpose: Hold shared operational commands for install, updates, client provisioning, cron control, and notifications.
- Contains: Top-level launch/update scripts, `scripts/admin/`, `scripts/lib/`, and `scripts/assets/`.
- Key files: `scripts/install.sh`, `scripts/centre.ps1`, `scripts/add-client.sh`, `scripts/start-crons.sh`, `scripts/lib/cron-db.py`.

**`.planning/`:**
- Purpose: Hold the active GSD planning workspace for the current root project.
- Contains: GSD analysis and execution artifacts such as `ROADMAP.md`, `phases/`, and now `.planning/codebase/`.
- Key files: `.planning/ROADMAP.md`, `.planning/phases/`, `.planning/codebase/`.

**`projects/briefs/command-centre/`:**
- Purpose: Hold the local dashboard application that operates on the rest of the workspace.
- Contains: Nested Next.js app with `src/`, local app scripts, and Node package manifests.
- Key files: `projects/briefs/command-centre/package.json`, `projects/briefs/command-centre/src/app/`, `projects/briefs/command-centre/src/lib/`.

## Key File Locations

**Entry Points:**
- `AGENTS.md`: Shared operating rules for the whole workspace.
- `CLAUDE.md`: Claude runtime wrapper for the root workspace.
- `clients/{slug}/AGENTS.md`: Client-specific instruction overlay.
- `scripts/centre.sh` and `scripts/centre.ps1`: Launch the Command Centre from the root workspace.
- `projects/briefs/command-centre/src/instrumentation.ts`: Starts queue and cron runtime on app boot.
- `projects/briefs/command-centre/src/app/page.tsx`: Main dashboard page.

**Configuration:**
- `.claude/settings.json`: Claude tool permissions and hooks.
- `.env.example`: Documented environment variables for optional integrations.
- `projects/briefs/command-centre/package.json`: App dependencies and scripts.
- `projects/briefs/command-centre/tsconfig.json`: TypeScript config with the `@/*` alias.
- `projects/briefs/command-centre/next.config.ts`: Next.js configuration for the embedded app.
- `projects/briefs/command-centre/postcss.config.mjs`: Tailwind/PostCSS wiring.

**Core Logic:**
- `projects/briefs/command-centre/src/lib/`: Shared backend/runtime helpers.
- `projects/briefs/command-centre/src/app/api/`: Route handlers for tasks, chat, files, cron, settings, projects, and GSD.
- `projects/briefs/command-centre/src/store/`: Browser-side Zustand stores.
- `scripts/`: Shared workspace operations outside the web app.

**Testing:**
- `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs`: Cron runtime tests.
- `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`: Queue watcher tests.
- `scripts/test-update.sh`, `scripts/test-crons.ps1`, `scripts/test-windows-notify.ps1`: Script-level checks.

## Naming Conventions

**Files:**
- Use `page.tsx`, `layout.tsx`, `route.ts`, and `global-error.tsx` for Next.js route files inside `projects/briefs/command-centre/src/app/`.
- Use kebab-case for most component, script, and utility filenames, for example `client-switcher.tsx`, `task-store.ts`, `add-client.sh`, and `start-crons.ps1`.
- Use `use-*.ts` for hooks in `projects/briefs/command-centre/src/hooks/`.
- Use `*-store.ts` for Zustand stores in `projects/briefs/command-centre/src/store/`.
- Use singular domain files in `projects/briefs/command-centre/src/types/`, for example `task.ts`, `client.ts`, `cron.ts`.
- Use `brief.md` as the fixed file name for project briefs under `projects/briefs/{project-slug}/`.
- Use `YYYY-MM-DD_descriptive-name.ext` for saved outputs inside `projects/` folders.

**Directories:**
- Use category-prefixed kebab-case skill folders under `.claude/skills/`, for example `.claude/skills/mkt-brand-voice/` and `.claude/skills/ops-cron/`.
- Use slug-style client folder names under `clients/`, for example `clients/acme-inc/`.
- Group Command Centre UI by feature under `projects/briefs/command-centre/src/components/{feature}/`.
- Group API routes by domain under `projects/briefs/command-centre/src/app/api/{domain}/`.
- Use descriptive project slugs under `projects/briefs/`, for example `projects/briefs/command-centre/` and `projects/briefs/cron-jobs-hardening/`.

## Where to Add New Code

**New Shared Skill:**
- Implementation: `.claude/skills/{category}-{skill-name}/SKILL.md`
- Supporting assets/scripts: `.claude/skills/{category}-{skill-name}/references/`, `scripts/`, or `assets/`
- Client-only variant: `clients/{slug}/.claude/skills/{category}-{skill-name}/`

**New Client-Specific Data or Output:**
- Client instructions: `clients/{slug}/AGENTS.md`
- Client brand files: `clients/{slug}/brand_context/`
- Client memory/learnings: `clients/{slug}/context/`
- Client deliverables: `clients/{slug}/projects/`
- Client cron jobs: `clients/{slug}/cron/jobs/`

**New Command Centre Page or View:**
- Route file: `projects/briefs/command-centre/src/app/{route}/page.tsx`
- Shared page shell/layout pieces: `projects/briefs/command-centre/src/components/layout/`
- Feature-specific UI: `projects/briefs/command-centre/src/components/{feature}/`

**New Command Centre API Endpoint:**
- Route handler: `projects/briefs/command-centre/src/app/api/{domain}/.../route.ts`
- Shared backend helper: `projects/briefs/command-centre/src/lib/{feature}.ts`
- Shared types: `projects/briefs/command-centre/src/types/{domain}.ts`

**New Browser State or Client Hook:**
- Shared state store: `projects/briefs/command-centre/src/store/{feature}-store.ts`
- Shared data hook: `projects/briefs/command-centre/src/hooks/use-{feature}.ts`

**New Shared Script or Admin Helper:**
- Top-level command: `scripts/{name}.sh` and/or `scripts/{name}.ps1`
- Shared helper code: `scripts/lib/`
- Admin-only operations: `scripts/admin/`

**New Project Work:**
- Brief-based project: `projects/briefs/{project-slug}/brief.md`
- Single-task output: `projects/{category}-{type}/`
- GSD planning artifacts: `.planning/`

## Special Directories

**`.command-centre/`:**
- Purpose: Runtime state for the local dashboard.
- Generated: Yes.
- Committed: No. It is ignored through `**/.command-centre/` in `.gitignore`.

**`.planning/`:**
- Purpose: Active GSD project workspace plus generated codebase analysis docs.
- Generated: Yes, but user-facing and actively edited.
- Committed: Yes in the current repo workflow.

**`cron/logs/` and `cron/status/`:**
- Purpose: Generated runtime output for scheduled jobs.
- Generated: Yes.
- Committed: No. Both are ignored in `.gitignore`.

**`projects/briefs/command-centre/node_modules/` and `projects/briefs/command-centre/.next/`:**
- Purpose: Local dependency and build output for the embedded Next.js app.
- Generated: Yes.
- Committed: No. Both are ignored via `**/node_modules/` and `**/.next/`.

---

*Structure analysis: 2026-04-13*
