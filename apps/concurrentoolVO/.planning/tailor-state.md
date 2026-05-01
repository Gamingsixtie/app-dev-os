---
project: concurrentoolVO-per-app-tailoring
status: completed
created: 2026-04-30
completed: 2026-05-01
imported_from: https://github.com/Gamingsixtie/concurrentie-rekentool-VO
imported_via: git subtree add --squash (upstream commit 814ec61)
imported_at: 2026-04-30
parent_template_state: ../../../.planning/tailor-state.md
---

# Per-App Tailor State — concurrentoolVO

App-Dev OS template is fully tailored (Phase 1-10 of `/tailor-os`, see [app-dev-os/.planning/tailor-state.md](../../../.planning/tailor-state.md)). This file tracks the **second tailoring round**: making concurrentoolVO usable INSIDE App-Dev OS by filling in the app-specific context layer.

---

## Current state

| | Status |
|---|---|
| Source imported via `git subtree add --squash` to `apps/concurrentoolVO/` | done 2026-04-30 |
| Vercel deploy untouched (still deploys from upstream GitHub repo) | done 2026-04-30 |
| App-Dev OS skeleton in `apps/concurrentoolVO/` | **pending** |
| Per-app `AGENTS.md`, `brand_context/`, `code_context/`, `context/`, `.claude/skills/`, `ADR/` | **pending** |
| Vercel reconfig to deploy from monorepo root-dir `apps/concurrentoolVO/` | deferred (separate decision, requires App-Dev OS to be on GitHub first) |

---

## Three conflicts to resolve in next round (do NOT forget)

These are pre-existing rekentool artifacts that conflict with App-Dev OS conventions. They were left untouched during the subtree-import — resolution belongs in Phase 1 / 4 / 5 below.

| # | What | Conflict | Resolution phase |
|---|---|---|---|
| **C1** | `apps/concurrentoolVO/CLAUDE.md` already exists (rekentool's pre-existing Claude config) | App-Dev OS expects per-app CLAUDE.md to be a thin wrapper that imports `@AGENTS.md`. Current file has rekentool-specific runtime rules instead. | Phase 4 — preserve runtime rules + add `@AGENTS.md` import + drop conflicts |
| **C2** | `apps/concurrentoolVO/skills/` exists at top-level (not at `.claude/skills/`) | App-Dev OS convention is `.claude/skills/{category}-{name}/`. Skill `ops-competitor-intel` already auto-registered by reconciliation but lives in the wrong location. | Phase 5 — per skill: migrate to `.claude/skills/` (App-Dev OS convention) OR keep at top-level if rekentool-only and explicitly outside the App-Dev OS skill registry |
| **C3** | No `apps/concurrentoolVO/AGENTS.md`, no `code_context/`, no `brand_context/`, no `context/`, no `ADR/`, no `.planning/` (this file is creating `.planning/`) | App-Dev OS multi-app architecture expects each `apps/<slug>/` to have its own context layer for inheritance + override. None of these exist for concurrentoolVO yet. | Phase 1 — bootstrap skeleton (mkdirs + stubs) |

**Why this matters:** without resolving C1+C2, Claude sessions inside `apps/concurrentoolVO/` will read rekentool's CLAUDE.md and skills WITHOUT inheriting the App-Dev OS root context (DEV_ETHOS, USER profile, root skills, hooks). The app would be functionally outside the App-Dev OS umbrella despite living in the folder structure.

---

## Sources of truth for filling

When the next tailoring session runs, read in this order:

1. **Primary**: [app-dev-os/TRAINING-CONTEXT.md](../../../TRAINING-CONTEXT.md) — full stack description, hard-coded providers (Cito/DIA/JIJ), locked files (`src/data/default-prices.ts`, `cito-migration-prices.ts`), language convention (NL UI / EN code), three pure-function engines, PWA setup, Vercel 60s timeout.
2. **Secondary**: actual code in `apps/concurrentoolVO/src/`, `api/`, `supabase/migrations/`, `package.json`, `vite.config.ts`, `vercel.json`.
3. **Existing-needs-review**: `apps/concurrentoolVO/CLAUDE.md` (rekentool's own pre-existing config — needs merge), `apps/concurrentoolVO/skills/` (rekentool's own skills — need review).
4. **Inheritance principle**: app inherits root template defaults unless overridden. Only **deviations** from the root template need writing — don't duplicate what's already in `app-dev-os/code_context/` or `app-dev-os/brand_context/`.

---

## Phases planned (~3 hours total, splitable across sessions)

| # | Phase | Effort | Where to run |
|---|---|---|---|
| 1 | **Bootstrap skeleton** — mkdir `brand_context/`, `code_context/`, `context/`, `.claude/skills/`, `ADR/`, `projects/`, `cron/jobs/`. Create stub `AGENTS.md` (CLAUDE.md reconcile is Phase 4, deferred). | **completed 2026-05-01** | from `app-dev-os/` root |
| 2 | **code_context override** — `architecture.md` (Vite 8 + React 19 + TanStack Router/Query + Zustand + Tailwind v4 + Vercel Functions + Supabase + Dexie + PWA), `conventions.md` (NL-UI / EN-code rule, locked files, ESLint config still in repo despite Biome decision in template — note as override), `runbook.md` (real Vercel URLs, real Supabase project, deploy flow). | **completed 2026-05-01** | from `apps/concurrentoolVO/` |
| 3 | **brand_context override** — voice (likely Cito-formal, deviates from template neutral default), ICP (scholen/docenten/leerlingen), positioning (concurrentie-vergelijkings-tool met drie providers Cito/DIA/JIJ). | **completed 2026-05-01** | from `apps/concurrentoolVO/` |
| 4 | **Reconcile pre-existing `CLAUDE.md`** — preserve rekentool runtime rules, add `@AGENTS.md` import at top, drop anything that conflicts with App-Dev OS root rules. | **completed 2026-05-01** | `apps/concurrentoolVO/CLAUDE.md` |
| 5 | **Review existing `skills/`** — migrate to `.claude/skills/` (App-Dev OS convention) or leave at top-level (current state). Decide per skill: app-specific stays per-app, generic-useful gets promoted to root. | **completed 2026-05-01** | 5 skills audited + 4 promoted to root + 1 kept per-app + refactor-plan deferred to `projects/ops-skill-refactor/` |
| 6 | **Promote app-specific decisions to ADRs** — Vite-not-Next.js, Zustand-not-Redux, three engines as pure functions, Supabase RLS-on, locked-files pattern, structured-output AI via Zod, NL/EN language convention. | **completed 2026-05-01** | 3 ADRs written (Vite, three-providers, pure-engines). Other 9 candidates listed in `ADR/README.md` for promotion-on-trigger. AI-only-intake flagged as borderline → promote if pricing-AI feature ever requested. |

After phase 6: `status: completed` here, log entry per phase, ready for daily work in this app with full App-Dev OS context.

---

## How to resume in a future session

In a fresh Claude session at `app-dev-os/` root, paste:

> "Resume per-app tailoring for concurrentoolVO from `apps/concurrentoolVO/.planning/tailor-state.md`. Read the file, TRAINING-CONTEXT.md, and existing `apps/concurrentoolVO/CLAUDE.md`, then start at the first `pending` phase."

Claude will pick up cold — this file plus TRAINING-CONTEXT.md is enough self-contained context.

---

## Multi-app pattern (durable — for any future app)

This same flow applies whenever you add another app to App-Dev OS.

### Pattern A — Import existing repo (like concurrentoolVO)

```bash
# from app-dev-os/
git subtree add --prefix=apps/<slug>/ <github-url> main --squash
```

Then create a per-app `apps/<slug>/.planning/tailor-state.md` (use this file as template) and run the 6 phases above for that app.

### Pattern B — Create new app from scratch

```bash
# from app-dev-os/
bash scripts/add-app.sh "<App Name>"
```

Skeleton (phase 1) is auto-generated → start at phase 2. Source code goes into `apps/<slug>/src/` etc. as you build it.

### What automatically applies to ALL apps under `apps/*/`

| Mechanism | What it covers |
|---|---|
| `weekly-dep-audit` cron | Loops over root + every `apps/*/` with a `package.json` — runs `pnpm audit` |
| `weekly-dep-update-check` cron | Same loop — flags major-version updates |
| `weekly-stale-branches` cron (currently inactive) | Loops over `apps/*/.git/` if/when activated |
| Claude-side hooks | `branch-guard`, `secret-scan`, `dangerous-bash`, `lockfile-guard`, `typecheck-guard` apply repo-wide |
| Permissions | All `.claude/settings.json` allow/deny rules apply repo-wide |
| Foundation skills | All 8 root skills available from any subdirectory |

### What does NOT auto-inherit (must be filled per app)

| Item | Where to fill |
|---|---|
| App-specific code conventions, architecture, runbook | `apps/<slug>/code_context/*.md` |
| App-specific voice, ICP, positioning | `apps/<slug>/brand_context/*.md` |
| App-specific ADRs (decisions only relevant to that app) | `apps/<slug>/ADR/*.md` |
| App-specific skills (rare — usually generic skills go in root) | `apps/<slug>/.claude/skills/*` |
| App-specific cron jobs (rare — root jobs scan apps/* already) | `apps/<slug>/cron/jobs/*.md` |

### Open meta-question — DEFERRED (decision: 2026-05-01)

The root pre-commit typecheck (`scripts/git-hooks/pre-commit`) only checks `tsconfig.json` at repo root. Per-app `tsconfig.json` files (like `apps/concurrentoolVO/tsconfig.json`) are NOT checked at commit-time. If type-errors slip into a per-app commit, that's the trigger to extend the pre-commit hook to walk into changed `apps/*/tsconfig.json` files.

**Decision (2026-05-01):** keep deferred per `feedback_breadth_over_preemptive_scope` memory rule. During the full basis-fix sweep on `feature/fix-basis-checks` (16 commits across rules-of-hooks, set-state-in-effect, vitest failures, npm audit, ESLint cleanup, bundle optimization), TypeScript was clean before and after every phase. No type-errors slipped through, so no concrete trigger has fired. Until one does, trust per-app dev-time iteration + Vercel build (which DOES fail loudly on broken types).

**Concrete trigger to revisit:** a `git push` to a feature branch that produces a Vercel build failure with type-errors that would have been caught by `npx tsc -b` inside `apps/<slug>/`. When that happens, extend `scripts/git-hooks/pre-commit` to detect changed `apps/*/tsconfig.json` files and run `npx tsc -b` per affected app.

### Vercel deploy migration (per app, separate decision)

Currently each imported app's Vercel deploy still points at its own upstream GitHub repo. To migrate Vercel to deploy from the App-Dev OS monorepo:

1. Push App-Dev OS itself to a new GitHub repo (`origin` is currently unset)
2. In Vercel project settings: change connected repo + set root directory to `apps/<slug>/`
3. First deploy from new source = ~15 min validate that it matches old deploy

Defer until App-Dev OS is git-pushed and you're ready to flip. The subtree import doesn't require this — it's only needed if you want App-Dev OS itself to be the deployment source.
