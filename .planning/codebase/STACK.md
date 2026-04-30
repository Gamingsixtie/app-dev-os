# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.9.3 - Main application language for the command centre in `projects/briefs/command-centre/src/`, with configuration in `projects/briefs/command-centre/tsconfig.json` and dependency pinning in `projects/briefs/command-centre/package.json`

**Secondary:**
- TSX / JSX via React 19.2.4 - UI components in `projects/briefs/command-centre/src/components/` and route files in `projects/briefs/command-centre/src/app/`
- Bash - Workspace setup, install, client management, and cron control in `scripts/install.sh`, `scripts/setup.sh`, `scripts/start-crons.sh`, and related shell scripts under `scripts/`
- PowerShell - Windows launch and cron control in `scripts/centre.ps1`, `scripts/start-crons.ps1`, `scripts/stop-crons.ps1`, and `scripts/status-crons.ps1`
- Python - External-service helper scripts inside skills, including `.claude/skills/str-trending-research/scripts/lib/openai_reddit.py`, `.claude/skills/tool-youtube/scripts/digest.py`, and `.claude/skills/viz-nano-banana/scripts/generate_image.py`
- JavaScript (CommonJS / ESM) - Runtime and build helpers in `projects/briefs/command-centre/scripts/next-run.cjs`, `projects/briefs/command-centre/scripts/cron-daemon.cjs`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, and `projects/briefs/command-centre/postcss.config.mjs`
- SQL - SQLite schema and migrations driven from `projects/briefs/command-centre/src/lib/schema.sql`

## Runtime

**Environment:**
- Node.js - Main runtime for the command centre app and repo automation. The app is started through `projects/briefs/command-centre/package.json` scripts and wrapper scripts such as `projects/briefs/command-centre/scripts/next-run.cjs`
- Python 3 - Required by `scripts/install.sh` and used by multiple skill scripts under `.claude/skills/*/scripts/`
- Shell / PowerShell - Used for platform-specific repo operations in `scripts/`

**Package Manager:**
- npm - Application dependencies are managed in `projects/briefs/command-centre/package.json`
- Lockfile: present in `projects/briefs/command-centre/package-lock.json`

## Frameworks

**Core:**
- Next.js 16.2.1 - App framework for the command centre UI and API routes in `projects/briefs/command-centre/src/app/`
- React 19.2.4 - UI layer for components in `projects/briefs/command-centre/src/components/`
- Tailwind CSS 4.2.2 - Styling system configured through `projects/briefs/command-centre/postcss.config.mjs` and imported in the app styles under `projects/briefs/command-centre/src/app/`

**Testing:**
- Node built-in test runner - Used by the `test:cron` script in `projects/briefs/command-centre/package.json` to run `projects/briefs/command-centre/src/lib/cron-runtime.test.cjs` and `projects/briefs/command-centre/src/lib/queue-watcher.test.cjs`

**Build/Dev:**
- Turbopack - Forced for `dev` and `build` inside `projects/briefs/command-centre/scripts/next-run.cjs`
- TypeScript 5.9.3 - Compiler and type system configured in `projects/briefs/command-centre/tsconfig.json`
- PostCSS with `@tailwindcss/postcss` - Configured in `projects/briefs/command-centre/postcss.config.mjs`
- ESLint 9.39.4 with `eslint-config-next` 16.2.1 - Declared in `projects/briefs/command-centre/package.json`

## Key Dependencies

**Critical:**
- `better-sqlite3` 12.8.0 - Embedded database client used in `projects/briefs/command-centre/src/lib/db.ts` and `projects/briefs/command-centre/src/lib/cron-runtime.js`
- `chokidar` 5.0.0 - Filesystem watching for project outputs in `projects/briefs/command-centre/src/lib/file-watcher.ts`
- `gray-matter` 4.0.3 - Frontmatter parsing for skill metadata and cron jobs in `projects/briefs/command-centre/src/lib/file-service.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, and `projects/briefs/command-centre/src/app/api/skills/route.ts`
- `zustand` 5.0.12 - Client-side state stores in `projects/briefs/command-centre/src/store/`
- `react-markdown` 10.1.0 and `remark-gfm` 4.0.1 - Markdown rendering in UI components under `projects/briefs/command-centre/src/components/`

**Infrastructure:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` - Drag-and-drop interactions in `projects/briefs/command-centre/src/components/board/feed-card.tsx`
- `lucide-react` 1.7.0 - Icon system used throughout `projects/briefs/command-centre/src/components/`
- Local Claude CLI subprocess orchestration - The repo depends on the installed `claude` CLI through `projects/briefs/command-centre/src/lib/process-manager.ts`, `projects/briefs/command-centre/src/lib/cron-runtime.js`, and the cron scripts in `scripts/`

## Configuration

**Environment:**
- Root environment variables are documented in `.env.example`; the real `.env` file exists in the workspace root but was not read
- Command-centre-specific environment discovery is documented in `projects/briefs/command-centre/.env.example`
- MCP server example configuration lives in `.mcp.example.json`
- Claude runtime settings live in `.claude/settings.json`
- Root path detection for the app is handled in `projects/briefs/command-centre/src/lib/config.ts` through `AGENTIC_OS_DIR` or by walking up to `AGENTS.md` / `CLAUDE.md`

**Build:**
- Next.js build/runtime config: `projects/briefs/command-centre/next.config.ts`
- TypeScript config: `projects/briefs/command-centre/tsconfig.json`
- PostCSS config: `projects/briefs/command-centre/postcss.config.mjs`
- App scripts: `projects/briefs/command-centre/package.json`
- Local Next launcher: `projects/briefs/command-centre/scripts/next-run.cjs`

## Platform Requirements

**Development:**
- `git`, `bash`, `node`, and `python3` are checked by `scripts/install.sh`
- `uv`, `yt-dlp`, and `ffmpeg` are installed when missing by `scripts/setup.sh`
- The command centre expects a local Claude CLI for task execution and cron automation, as shown in `projects/briefs/command-centre/src/lib/process-manager.ts` and `projects/briefs/command-centre/src/lib/cron-runtime.js`
- Windows support is explicit through PowerShell wrappers in `scripts/`; Unix-like support is explicit through Bash scripts in `scripts/`

**Production:**
- The checked-in app is designed as a local or self-hosted Next.js workspace tool launched from `projects/briefs/command-centre/`
- A deployment platform manifest, container definition, or checked-in CI pipeline was not detected in the repo files inspected

---

*Stack analysis: 2026-04-13*
