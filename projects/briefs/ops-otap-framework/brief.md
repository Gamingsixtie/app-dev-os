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
- [ ] Execute Wave 1 (foundation docs)
- [ ] Execute Waves 2–4 (CI, runbook, scaffolding)
- [ ] Execute Wave 5 (verification + learnings)
- [ ] Per-app rollout to `concurrentoolVO` (separate follow-up project)

## Next step

Review `PLAN.md`. If approved, execute Wave 1 in parallel:
T1.1 (`code_context/otap.md`), T1.2 (ADR), T1.3 (`AGENTS.md` update).
