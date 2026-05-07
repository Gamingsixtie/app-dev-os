---
title: OTAP Framework Decisions
date: 2026-05-07
context: Exploration session — root-template OTAP setup for App-Dev OS
status: locked-pending-spec
---

# OTAP Framework — Foundational Decisions

## Background

User received OTAP training and identified a behavioral risk: working directly
in production instead of locally. Goal: install OTAP as a root-template
discipline so every app under `apps/*` inherits it automatically.

OTAP letters mapped to this project's tooling:

| Letter | Stage | Concrete tooling |
|--------|-------|------------------|
| **O** — Ontwikkeling | Local development | `npm run dev` (Vite) on a `feature/*` branch |
| **T** — Test | Local verification | `npm run build` + Vitest + Playwright (+ CI on PR) |
| **A** — Acceptatie | Pre-production preview | Vercel preview deployment per branch (auto, free) |
| **P** — Productie | Live for users | `main` branch → Vercel production + production Supabase |

## Locked decisions

These are settled by exploration. Spec phase is allowed to refine *how* but not
revisit *whether*.

1. **Scope** — root-template (`App-Dev OS/` itself), not per-app. Every new app
   added via `scripts/add-app.sh` must inherit OTAP without re-setup.

2. **Database isolation** — two separate Supabase projects per app:
   - one for local development/test (own seed data)
   - one for production (real customer data)
   No shared database between local and production.

3. **Acceptance environment** — Vercel preview deployments per PR. No
   dedicated standing acceptance project. Rationale: solo dev, free tier,
   automatic per-branch URL is enough for self-check + occasional consultant
   review.

4. **Promotion path** — `feature/*` → PR → preview deploy + green CI →
   merge to `main` → automatic production deploy.

5. **`main` is production** — already enforced by `branch-guard` hook. OTAP
   formalizes this rather than adding new gates here.

## Why these decisions (so future-me doesn't drift)

- **Two Supabase projects, not one:** sharing the database is the actual
  problem the user wanted to fix. Local migrations, seed data, and accidental
  deletes must not touch production. Free tier supports two projects.
- **Preview-per-branch over standing acceptance:** the user is solo. No QA
  team, no formal UAT cycle. Standing acceptance would be ceremony without
  a user. Preview-per-branch gives 90% of the value (real production build,
  real Vercel runtime, shareable URL) for ~0% of the setup cost.
- **Root-template scope, not per-app:** App-Dev OS is designed to host
  multiple apps. OTAP per-app would mean re-deciding for every new app.
  Centralizing in root means each new app inherits the discipline by default.

## Out of scope (deliberate)

These came up in exploration and are explicitly *not* part of this framework:

- Standing acceptance/staging environment with its own URL
- Database snapshots/cloning between environments (manual seed data is fine)
- Hotfix bypass branches (use `feature/hotfix-*` and the same flow)
- Multi-region deploys
- Blue/green or canary releases
- Rollback automation beyond Vercel's native "Promote previous deploy" button

If any of these surface as a real need later, add a follow-up note rather
than retrofitting this decision.

## Open questions for spec phase

The exploration session intentionally stopped before these — they belong in
`gsd-spec-phase` because they need concrete artifacts, not directional
choices:

1. **Database migrations** — how does a schema change propagate from local
   Supabase to production Supabase? Manual `supabase db push` per env? Migration
   file format?
2. **Per-environment env vars** — naming convention? `VITE_SUPABASE_URL` vs
   `VITE_SUPABASE_URL_PROD`? Vercel env-var scoping (Production/Preview/Development)?
3. **Promotion gates** — what *must* be green before a PR can merge to `main`?
   `npm run build` + tests + typecheck minimum. Manual preview-check required?
4. **Rollback procedure** — when production breaks, what's the documented
   one-pager? Vercel rollback + Supabase rollback (if migration ran)?
5. **Branch naming** — `feature/X`, `fix/X`, `chore/X`? Aligned with
   existing branching policy in `AGENTS.md`?
6. **CI vs local-only test gate** — does CI run on every PR, or do we trust
   the local typecheck guard + pre-commit hook?
7. **Per-app vs shared CI workflow** — single `.github/workflows/` at root,
   or one per app under `apps/*/.github/workflows/`?

## Trigger that drove this exploration

User self-described: "Ik merkte de laatste tijd dat ik heel snel ging.
Niet lokaal werkte, maar gelijk in de productieomgeving zelf."

This is the single behavior the framework must prevent. Every spec/plan
decision should be evaluated against: *does this make production-first
work harder, and local-first work the path of least resistance?*

## Next step

See `.planning/todos/pending/spec-otap-framework.md` for the concrete
follow-up: spin up a Level 3 GSD project under
`projects/briefs/ops-otap-framework/` and run `gsd-spec-phase`.
