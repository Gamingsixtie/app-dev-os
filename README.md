# App-Dev OS

Turn Claude Code into your senior-engineer pair-programmer.

App-Dev OS is the **broer-template van Agentic OS** — same proven foundation (skills, reconciliation, Context Matrix, lazy loading, markdown-only), targeted at **app-development** instead of marketing/sales. Web-development gets its own future template.

Three parallel Claude Code workflows in eindstaat:
- **Agentic OS** — marketing / sales / content
- **App-Dev OS** (this repo) — app-development
- **Web-Dev OS** (future) — websites + web-builds

---

## What you get

Three layers — same as Agentic OS, dev-targeted:

1. **Agent Identity** — `AGENTS.md` (cross-tool methodology) + `CLAUDE.md` (Claude runtime) + `context/DEV_ETHOS.md` (engineering ethos) + `context/USER.md` (your stack, working style, risk posture).

2. **Skills Pack** — `code-`, `test-`, `db-`, `infra-`, `sec-`, `deploy-`, `docs-` skills, plus `meta-`, `tool-`, `ops-` from Agentic OS. `mkt-brand-voice` kept for in-app microcopy. Skills lazy-load only the context they need (Context Matrix).

3. **Two-layer context**:
   - `code_context/` — `conventions.md` + `architecture.md` + `runbook.md` (the foundation your code-skills load)
   - `brand_context/` — voice / positioning / icp / samples (for in-app UI-copy, errors, onboarding)

Plus:
- `ADR/` — immutable Architecture Decision Records
- `context/learnings.md` — three-way split (General + Per Phase + Per Skill) + ADRs index
- Daily memory (`context/memory/{date}.md`) — secondary; **git log + ADRs + learnings.md is primary** for dev

---

## Why a separate template (and not just Agentic OS for code)?

Agentic OS is opinionated for **marketing**: brand voice, humanizer-gate, daily journal, content levels. Those don't fit code:
- Humanizer-gate **saboteurs** technical text
- Daily memory journal is redundant when you have `git log` + ADRs
- Brand-context-only doesn't cover code conventions or architecture
- Marketing skills (`mkt-copywriting`, `viz-*`, `str-*`) are dead weight

App-Dev OS keeps the **mechanism** (skills engine, reconciliation, Context Matrix, hooks, multi-tenant folders) and replaces the **decoration** with dev-equivalents.

---

## Quickstart

```bash
git clone <your-fork>.git app-dev-os
cd app-dev-os
bash scripts/centre.sh
```

On Windows: `powershell -File scripts\centre.ps1`

First launch runs guided bootstrap. Open Claude Code in the folder; it auto-detects first-run and walks you through:
- Stack interview (languages, frameworks, package manager, test runner, type system)
- Deploy target (Vercel / Fly.io / Railway / self-hosted)
- Branch policy + deploy cadence
- Optional: in-app microcopy tone (only if your app has user-facing UI)

Then it populates `code_context/conventions.md` + `architecture.md` + `runbook.md` and (if applicable) `brand_context/voice-profile.md`.

---

## Foundation skills (always installed)

| Skill | What it does |
|-------|--------------|
| `code-feature-build` | Build a feature end-to-end with tests + docs |
| `code-review` | Severity-classified bug + security + convention findings |
| `test-write-unit` | Focused unit tests for risky / reused logic |
| `docs-adr` | Write immutable Architecture Decision Records (create / promote / supersede) |
| `meta-skill-creator` | Build new skills for your project |
| `meta-wrap-up` | End-of-session memory + learnings capture |
| `mkt-brand-voice` | Build / refine voice profile for in-app microcopy |
| `ops-cron` | Schedule recurring tasks |

Optional skills (install per workspace) cover: refactor, e2e tests, coverage audits, migrations, schema design, dockerizing, CI pipelines, secret scans, dep audits, threat models, releases, rollbacks, README generation, API docs.

---

## Workflow per feature (default — non-trivial work)

```
/gsd-spec-phase       ← WAT moet de fase opleveren (locked requirements)
  ↓
/gsd-plan-phase       ← HOE bouwen we het (research + tasks + verification)
  ↓
/gsd-execute-phase    ← atomic commits per plan
  ↓
/gsd-verify-work      ← goal-backward: levert de code wat de fase belooft?
  ↓
/gsd-code-review      ← REVIEW.md met severity-classified findings
  ↓
/gsd-secure-phase     ← threat model verificatie
  ↓
/gsd-ship             ← PR + review + merge + deploy
```

Trivial fixes (single PR, < 50 lines): use `/gsd-quick` or just write code directly.

---

## Memory model (dev-specific)

| Source | What's there |
|---|---|
| `git log` + commits | Audit trail of what changed when |
| `ADR/000X-*.md` | Immutable architecture decisions with reasoning |
| `context/learnings.md` | General + Per Phase + Per Skill feedback |
| `context/memory/{date}.md` | Secondary session-state (compatibility with Agentic OS skills) |

**Promotion path** for learnings:
```
learnings.md (per-skill) → docs/gotchas.md → code_context/conventions.md → ADR/{NNNN}.md
```

Niet elke learning hoeft door alle stappen — alleen als 'm zwaarder wordt.

---

## Permissions & guards

`.claude/settings.json` is strict by design:
- **Denied**: `rm -rf /`, `git push origin main`, `git push --force`, `npm uninstall`, `curl/wget/ssh`, reading `.env*` / credentials / `.pem` / `.key`, editing lockfiles
- **Allowed**: project `npm/pnpm/yarn run`, basic git read+commit, scoped writes to `src/`, `tests/`, `docs/`, `code_context/`, `brand_context/`

Pre-commit hooks add behavioural guards on top:
- `branch-guard.js` — **blocks** writes/commits/pushes on `main`/`master`/`production`
- `secret-scan.js` — **blocks** secrets in writes or bash commands
- `dangerous-bash.js` — **blocks** high-blast-radius commands
- `lockfile-guard.js` — **blocks** direct edits to lockfiles
- `typecheck-guard.js` — advisory by default; opt-in strict via `TYPECHECK_GUARD_BLOCK=1`

---

## OTAP framework

Every app inherits a four-stage discipline (Ontwikkeling, Test, Acceptatie, Productie) so production-first work becomes structurally hard and lokaal-eerst becomes the path of least resistance.

| Letter | Stage | Tooling |
|---|---|---|
| **O** | Ontwikkeling | `npm run dev` on a `feature/*` branch |
| **T** | Test | local `npm run build` + Vitest, plus GitHub Actions CI on PR |
| **A** | Acceptatie | Vercel preview deployment per PR (auto, free) |
| **P** | Productie | `main` branch → Vercel production + production Supabase |

Each app uses **two Supabase projects** (`<slug>-dev` for Local + Preview, `<slug>-prod` for Production), a single shared CI workflow with path-filters per app, and a manual `supabase db push` for production migrations.

- Operational reference: [`code_context/otap.md`](code_context/otap.md)
- Architecture decision: [`ADR/0005-otap-framework.md`](ADR/0005-otap-framework.md)
- Migration / rollback / branch protection runbook: [`code_context/runbook.md`](code_context/runbook.md)

---

## Multi-app

Run multiple apps from one install:

```bash
bash scripts/add-app.sh "my-saas"
cd apps/my-saas
claude
```

Each app gets its own `brand_context/`, `code_context/`, `context/`, `projects/`, `cron/jobs/`. Skills, scripts, and shared methodology stay at root.

```text
app-dev-os/
├── AGENTS.md            <- shared methodology
├── CLAUDE.md            <- Claude wrapper (imports @AGENTS.md)
├── code_context/        <- root template
├── brand_context/       <- root template
├── ADR/
├── apps/
│   ├── my-saas/         <- own brand_context, code_context, context, projects
│   └── another-app/
└── .claude/skills/
```

---

## Cron jobs (foundation)

Drop a markdown file into `cron/jobs/`:

```markdown
---
name: "Weekly Dep Audit"
time: "09:00"
days: "mon"
active: "true"
model: "haiku"
---
Task: Run npm audit per app, summarise high+critical findings…
```

Foundation jobs included:
- `weekly-dep-audit` — surfaces high+critical CVE findings per project
- `weekly-dep-update-check` — lists major version updates available (no auto-update)
- `weekly-stale-branches` — branches > 30 days, suggests merged-and-stale cleanup
- (Inherited from Agentic OS) `monthly-learnings-health`, `weekly-activity-digest`, `skill-update-check`

---

## File structure

```
app-dev-os/
├── AGENTS.md  CLAUDE.md  README.md  CHANGELOG.md  VERSION
├── .env.example  .mcp.example.json
├── .claude/
│   ├── settings.json     <- strict permissions + 6 hooks
│   ├── commands/         <- /start-here, /archive-gsd
│   ├── hooks/            <- branch-guard, secret-scan, dangerous-bash, lockfile-guard, typecheck-guard, gsd-*, session-sync*
│   ├── skills/           <- code-, test-, meta-, ops-, mkt-brand-voice
│   └── agents/           <- empty (optional; GSD provides agents)
├── ADR/                  <- immutable architecture decisions
├── code_context/         <- conventions.md + architecture.md + runbook.md
├── brand_context/        <- voice-profile.md + positioning.md + icp.md + samples.md
├── context/
│   ├── DEV_ETHOS.md      <- engineering ethos (replaces SOUL.md)
│   ├── USER.md           <- your stack + working style
│   ├── learnings.md      <- General + Per Phase + Per Skill + ADRs index
│   ├── prompt-tags.md    <- @brand-voice, @conventions, @architecture, @runbook, @risk-posture, …
│   └── memory/           <- daily session-log (secondary memory)
├── cron/jobs/            <- scheduled markdown-prompts
├── apps/                 <- multi-app workspaces (was clients/)
├── projects/             <- outputs (Level 1/2/3)
├── docs/                 <- runbook, gotchas (when added), team-facing docs
└── scripts/              <- centre, install, update, add-app, add-skill, start-crons, …
```

---

## What's gitignored (your data is safe)

These are yours and never overwritten by updates:
- `.env` — your API keys
- `code_context/*.md` and `brand_context/*.md` — your project conventions and microcopy
- `context/memory/` and `context/learnings.md` — your accumulated knowledge
- `projects/` and `apps/*/projects/` — your outputs
- `ADR/*.md` (except `README.md`) — your immutable decisions

---

Built on the Agentic OS pattern by Simon Scrapes @ Agentic Academy.
