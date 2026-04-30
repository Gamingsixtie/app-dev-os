# Changelog

All notable changes to App-Dev OS will be documented in this file. Written for humans, not machines.

## Unreleased

_Nothing yet — use `/new-feature` to start something._

## v0.1.0-app-dev-os — 2026-04-27

Initial release. Forked from Agentic OS v0.1.0 and re-targeted for **app-development**. Web-development gets its own future template.

### Added
- **Three-layer architecture** parallel to Agentic OS (Identity / Skills / Context)
- **`code_context/`** layer alongside `brand_context/` — `conventions.md` + `architecture.md` + `runbook.md` foundation templates
- **`brand_context/`** kept for in-app microcopy (UI-copy, errors, onboarding) — distinct from marketing copy
- **`ADR/`** folder for immutable Architecture Decision Records with template + index
- **`context/DEV_ETHOS.md`** replaces `SOUL.md` — dev-focused ethos (defensive coding, fail loud, type-safety, never push to main)
- **`context/USER.md`** rewritten with dev fields (stack preferences, testing style, deploy cadence, risk posture)
- **`context/learnings.md`** split into three sections: General + Per Phase + Per Skill (category) + ADRs Index
- **Memory model** redefined: git log + ADRs + learnings.md as primary; daily memory file is secondary
- **`apps/`** replaces `clients/` — multi-app workspace isolation
- **Skill categories**: `code`, `test`, `db`, `infra`, `sec`, `deploy`, `docs` (new); `ops`, `meta`, `tool`, `mkt-brand-voice` (kept from Agentic OS)
- **Foundation skills**: `code-feature-build`, `code-review`, `test-write-unit`
- **Dev-foundation hooks** (PreToolUse):
  - `secret-scan.js` — blocks API keys, private keys, .env content in writes/bash
  - `dangerous-bash.js` — blocks `rm -rf /`, `git push --force`, `chmod 777`, etc.
  - `lockfile-guard.js` — blocks direct edits to lockfiles outside `tool-` skills
  - `typecheck-guard.js` — advisory by default; opt-in block via `TYPECHECK_GUARD_BLOCK=1`
- **`branch-guard.js`** tightened to **block** writes/commits/pushes on `main`/`master`/`production` (was advisory)
- **Strict permissions** in `.claude/settings.json` — denies `git push origin main`, `npm uninstall`, `curl/wget/ssh`, `.env*` reads, lockfile edits
- **Dev cron jobs**: `weekly-dep-audit`, `weekly-dep-update-check`, `weekly-stale-branches`
- **`scripts/add-app.sh`** + **`update-apps.sh`** — multi-app lifecycle (renamed from `add-client.sh`, body adjusted to seed both `brand_context/` and `code_context/`)
- **`/start-here`** rewritten for dev-onboarding (stack-interview, deploy-target, branch policy, optional UI-microcopy tone)
- **Promotion path** for learnings: `learnings.md` → `docs/gotchas.md` → `code_context/conventions.md` → `ADR/{NNNN}-*.md`

### Changed
- `mkt-brand-voice` skill **kept** for app-microcopy work (tone of in-app text)
- `prompt-tags.md` extended with `@conventions`, `@architecture`, `@runbook`, `@risk-posture`; `@brand-voice` retained for UI-copy

### Removed (vs Agentic OS)
- Marketing skills: `mkt-copywriting`, `mkt-content-repurposing`, `mkt-positioning`, `mkt-icp`, `mkt-ugc-scripts`
- Visual skills: `viz-*` (excalidraw, nano-banana, stitch, heygen, interface-design)
- Strategy skills: `str-*` (trending-research, ai-seo)
- Tool skills: `tool-humanizer` (saboteurs technical text), `tool-stitch`, `tool-firecrawl-scraper`, `tool-youtube`
- **Humanizer-gate** as automatic post-processor — code uses lint/typecheck/tests as gates instead
- Marketing cron jobs (e.g., `youtube-newsletter`)

### Foundation that didn't change (Agentic OS-respect)
- `AGENTS.md` + `CLAUDE.md` import-pattern (cross-tool methodology)
- Skills as primary capability primitive (no `.claude/agents/` in foundation)
- Reconciliation pattern (skills-on-disk vs registry)
- Context Matrix per skill (lazy-loading, now with 6 columns: 3 brand + 3 code)
- `/start-here` first-run flow (slot kept; questions changed)
- `meta-wrap-up` end-of-session ritual
- `ops-cron` job-format (markdown + YAML frontmatter)
- Multi-tenant via folders (`clients/` → `apps/`, same mechanism)
- `.gitignore` carve-outs for user data
- `.mcp.example.json` as separate file (Agentic OS-pattern)
- Project levels (L1 single, L2 brief, L3 GSD `.planning/`)
