---
title: OTAP Framework — Root-Template Rollout
slug: ops-otap-framework
level: 3
created: 2026-05-07
status: spec-locked
related:
  - .planning/notes/otap-framework-decisions.md
  - .planning/todos/pending/spec-otap-framework.md
---

# OTAP Framework — Root-Template Rollout

## What

Install OTAP (Ontwikkeling, Test, Acceptatie, Productie) as a root-template
discipline in App-Dev OS so every app under `apps/*` inherits it
automatically. Concretely: branching policy, CI gates, environment
isolation, preview deployments, rollback runbook, and an ADR.

## Why

User self-described the trigger: *"Ik merkte de laatste tijd dat ik heel
snel ging. Niet lokaal werkte, maar gelijk in de productieomgeving zelf."*

This framework formalizes the lokaal-eerst principle from
`MEMORY.md → feedback_local_first.md` and adds a structural vangnet
between "I just tested it on my laptop" and "it's live for users".

## Approach (high-level)

Two-tier environment model that maps to OTAP letters:

- **O**ntwikkeling — local Vite dev server on `feature/*` branch
- **T**est — local `npm run build` + Vitest + Playwright + CI on PR
- **A**cceptatie — Vercel preview deployment per PR (auto, free)
- **P**roductie — `main` branch → Vercel production + production Supabase

Per-app database isolation via two separate Supabase projects (one for
local/dev, one for production). No shared database between environments.

## Scope

**In scope:** root-template (`App-Dev OS/` itself). Output lands in
shared `code_context/`, `AGENTS.md`, root `.github/workflows/`,
`scripts/`, and an ADR.

**Out of scope for this project:**
- Per-app rollout to `apps/concurrentoolVO` (separate follow-up)
- Standing acceptance environment with own URL
- Hotfix bypass branches
- Multi-region or canary deploys

## Status

- [x] Exploration done — decisions locked in [.planning/notes/otap-framework-decisions.md](../../.planning/notes/otap-framework-decisions.md)
- [x] Spec locked — see `SPEC.md` in this folder (9 requirements + 7 decisions confirmed 2026-05-07)
- [x] Plan drafted — see `PLAN.md` in this folder (13 tasks across 5 waves)
- [x] Execute Wave 1 (foundation docs) — ADR-0005, otap.md, AGENTS.md
- [x] Execute Wave 2 (CI workflow + branch protection runbook section)
- [x] Execute Wave 3 (runbook updates: environments, migrations, rollback)
- [x] Execute Wave 4 (add-app.sh OTAP-aware, README.md updated)
- [x] Execute Wave 5 partial (T5.1 smoke test + T5.4 learnings) — T5.2/T5.3 deferred (require GitHub remote + branch protection set up)
- [ ] Per-app rollout to `concurrentoolVO` (separate follow-up project)
- [ ] Out-of-band manual actions per app (Supabase prod project, branch protection, Vercel env-vars) — see PLAN.md

## Status

**Root-template work: complete.** OTAP framework is installed at template
level. Future apps added via `add-app.sh` inherit the framework structurally.

**Pending for full activation:**
- App-Dev OS repo needs to live on GitHub for branch protection + CI to actually
  run (currently no remote configured)
- For each app: manual Supabase project creation + Vercel env-var setup
- Per-app rollout work tracked separately
