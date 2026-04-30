# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**Local Agent Runtime:**
- Claude CLI - The command centre runs Claude as a local subprocess for tasks, replies, and cron jobs
  - SDK/Client: local CLI process spawned from `projects/briefs/command-centre/src/lib/process-manager.ts` and `projects/briefs/command-centre/src/lib/cron-runtime.js`
  - Auth: local Claude CLI login; no repo env var was detected for this integration

**Web Scraping & Research:**
- Firecrawl - Used by the scraping utility skill and brand-voice workflows for JavaScript-heavy site scraping
  - SDK/Client: `firecrawl-py` and `@mendable/firecrawl-js`, referenced in `.claude/skills/tool-firecrawl-scraper/SKILL.md`
  - Auth: `FIRECRAWL_API_KEY` documented in `AGENTS.md` and `.env.example`
- OpenAI Responses API - Used by the trending research skill for Reddit-oriented research flows
  - SDK/Client: direct HTTPS calls in `.claude/skills/str-trending-research/scripts/lib/openai_reddit.py`
  - Auth: `OPENAI_API_KEY` documented in `AGENTS.md` and `.env.example`
- xAI Responses API - Used by the trending research skill for X / Twitter search flows
  - SDK/Client: direct HTTPS calls in `.claude/skills/str-trending-research/scripts/lib/xai_x.py`
  - Auth: `XAI_API_KEY` documented in `AGENTS.md` and `.env.example`
- YouTube Data API v3 - Used by the YouTube utility skill for channel lookups and recent uploads
  - SDK/Client: direct HTTPS calls in `.claude/skills/tool-youtube/scripts/digest.py`
  - Auth: `YOUTUBE_API_KEY` documented in `AGENTS.md` and `.env.example`

**Generative Media & Design:**
- Google Gemini - Used for image generation in the Nano Banana visual skill
  - SDK/Client: `google.genai` in `.claude/skills/viz-nano-banana/scripts/generate_image.py`
  - Auth: `GEMINI_API_KEY` documented in `AGENTS.md` and `.env.example`
- HeyGen - Used for avatar video generation in the HeyGen visual skill
  - SDK/Client: direct API or MCP usage described in `.claude/skills/viz-ugc-heygen/SKILL.md` and `.claude/skills/viz-ugc-heygen/references/api-reference.md`
  - Auth: `HEYGEN_API_KEY` documented in `AGENTS.md`, `.env.example`, and `.mcp.example.json`
- Google Stitch - Used for UI design generation and export
  - SDK/Client: MCP-based workflow documented in `.claude/skills/tool-stitch/SKILL.md` and `.claude/skills/viz-stitch-design/SKILL.md`
  - Auth: gcloud authentication, documented in `AGENTS.md`

**Workspace / Productivity Tooling:**
- Google Workspace CLI credentials - Optional OAuth credentials are documented for Workspace-related skills
  - SDK/Client: repo-level Workspace tooling documented in `.env.example`
  - Auth: `GOOGLE_WORKSPACE_CLI_CLIENT_ID` and `GOOGLE_WORKSPACE_CLI_CLIENT_SECRET`

## Data Storage

**Databases:**
- SQLite via a local file database
  - Connection: workspace-local file at `.command-centre/data.db`, resolved by `projects/briefs/command-centre/src/lib/config.ts`
  - Client: `better-sqlite3` in `projects/briefs/command-centre/src/lib/db.ts` and `projects/briefs/command-centre/src/lib/cron-runtime.js`

**File Storage:**
- Local filesystem only
  - Project outputs are written under `projects/`
  - Workspace settings are read and updated through `projects/briefs/command-centre/src/app/api/settings/env/route.ts`, `projects/briefs/command-centre/src/app/api/settings/mcp/route.ts`, and `projects/briefs/command-centre/src/app/api/settings/claude-settings/route.ts`
  - Uploaded files are stored through `projects/briefs/command-centre/src/app/api/files/upload/route.ts`

**Caching:**
- None detected as a separate cache service in the inspected repo files

## Authentication & Identity

**Auth Provider:**
- No app-level user authentication provider was detected in `projects/briefs/command-centre/src/app/api/` or the inspected app configuration files
  - Implementation: the command centre behaves like a local single-workspace tool; external services authenticate through API keys in `.env`, MCP config in `.mcp.json`, gcloud auth for Stitch, or OAuth client credentials for Google Workspace tooling

## Monitoring & Observability

**Error Tracking:**
- None detected; no checked-in Sentry, Datadog, or similar service configuration was found in the inspected files

**Logs:**
- Local task and cron execution history is stored in SQLite tables created from `projects/briefs/command-centre/src/lib/schema.sql`
- Runtime event streaming is exposed through the internal SSE endpoint `projects/briefs/command-centre/src/app/api/events/route.ts`
- Cron runtime control and log access are exposed through `scripts/start-crons.sh`, `scripts/stop-crons.sh`, `scripts/status-crons.sh`, and `scripts/logs-crons.sh`

## CI/CD & Deployment

**Hosting:**
- Local or self-hosted Next.js runtime launched from `projects/briefs/command-centre/`
- The documented local entry point is the `centre` launcher described in `README.md` and implemented by `scripts/centre.ps1`

**CI Pipeline:**
- None detected in the inspected repo files
- No checked-in GitHub Actions workflow, container definition, or deployment manifest was found during the repo-wide config scan

## Environment Configuration

**Required env vars:**
- `FIRECRAWL_API_KEY` for Firecrawl-based scraping, documented in `AGENTS.md` and `.env.example`
- `OPENAI_API_KEY` for OpenAI-backed research flows, documented in `AGENTS.md` and `.env.example`
- `XAI_API_KEY` for xAI-backed X search flows, documented in `AGENTS.md` and `.env.example`
- `YOUTUBE_API_KEY` for YouTube Data API access, documented in `AGENTS.md` and `.env.example`
- `GEMINI_API_KEY` for Gemini image generation, documented in `AGENTS.md` and `.env.example`
- `HEYGEN_API_KEY` for HeyGen video generation, documented in `AGENTS.md`, `.env.example`, and `.mcp.example.json`
- `GOOGLE_WORKSPACE_CLI_CLIENT_ID` and `GOOGLE_WORKSPACE_CLI_CLIENT_SECRET` for Google Workspace CLI auth, documented in `.env.example`
- `AGENTIC_OS_DIR` is optional for the command centre and documented in `projects/briefs/command-centre/.env.example`

**Secrets location:**
- Root service secrets are expected in the workspace `.env` file, which exists but was not read
- MCP-related secrets are expected in `.mcp.json`; the example structure is documented in `.mcp.example.json`

## Webhooks & Callbacks

**Incoming:**
- No active third-party webhook receiver was detected in the inspected command-centre app routes
- `scripts/admin/n8n-webhook-template.json` is a template for external automation, not an active application endpoint

**Outgoing:**
- External HTTP requests are implemented inside skill-layer scripts such as `.claude/skills/str-trending-research/scripts/lib/openai_reddit.py`, `.claude/skills/str-trending-research/scripts/lib/xai_x.py`, and `.claude/skills/tool-youtube/scripts/digest.py`
- The command centre app itself is centered on local filesystem, SQLite, and local subprocess orchestration; direct external API calls were not detected in the app files inspected under `projects/briefs/command-centre/src/`

---

*Integration audit: 2026-04-13*
