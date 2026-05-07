---
title: OTAP rollout — concurrentoolVO
slug: ops-otap-rollout-concurrentoolVO
level: 2
created: 2026-05-07
status: code-side-in-progress
related:
  - ../ops-otap-framework/brief.md
  - ../../../ADR/0005-otap-framework.md
  - ../../ops-vercel-flip/2026-05-05_flip-plan.md
---

# OTAP rollout — concurrentoolVO

## What

Apply the OTAP framework (ADR-0005) to the first existing app:
`apps/concurrentoolVO`. Make the per-app config OTAP-aware and document
the manual user actions needed for full activation.

## Why

The OTAP root-template is live (PR #1 merged into main, branch protection
enforced). But `concurrentoolVO` itself was created before OTAP existed,
so its `.env.local.example` and `AGENTS.md` predate the framework. To make
the per-app discipline real, those files need updating and infra needs
provisioning.

## In scope (code-side, this project)

- Update `apps/concurrentoolVO/.env.local.example` — OTAP env-var pattern,
  Supabase as required (not optional), Vercel-scoping documentation
- Update `apps/concurrentoolVO/AGENTS.md` — add OTAP section pointing
  to root framework + per-app checklist with `concurrentoolVO`-specific
  values pre-filled

## Out of scope for this brief (deferred to separate work)

- **Vercel deploy migration** — separate project at
  [`projects/ops-vercel-flip/`](../../ops-vercel-flip/). Production
  Vercel currently deploys from the upstream `Gamingsixtie/concurrentie-rekentool-VO`
  repo, not App-Dev OS. Until flipped, env-vars set in App-Dev OS's
  Vercel project don't affect production. The flip itself is a one-time
  Vercel-dashboard action — see flip plan for steps.
- **Supabase prod project provisioning** — manual user action via
  Supabase dashboard (cannot be scripted). Listed in the manual-actions
  section below.
- **Vercel env-var configuration** — manual user action via Vercel
  dashboard. Listed below.
- **Production database migration** — `apps/concurrentoolVO/supabase/migrations/`
  exist; first migration push to prod-Supabase is a manual `supabase db push`
  per ADR-0005 Q1.

## Manual user actions (deferred — depend on Vercel flip)

These cannot be done in code. User completes via web dashboards. Order matters.

- [ ] **Step 1 — Vercel flip** — execute [`projects/ops-vercel-flip/2026-05-05_flip-plan.md`](../../ops-vercel-flip/2026-05-05_flip-plan.md). Until done, the rest is wasted effort.
- [ ] **Step 2 — Create production Supabase project** named `concurrentool-prod` (or similar; record the actual ref in this brief once known)
- [ ] **Step 3 — Vercel environment variables** for App-Dev OS Vercel project:
  - Production scope: `VITE_SUPABASE_URL` = prod URL, `VITE_SUPABASE_ANON_KEY` = prod key, `VITE_ANTHROPIC_API_KEY` = prod key
  - Preview scope: dev URL, dev key, dev/staging Anthropic key
  - Development scope: leave empty (read from local `.env.local`)
- [ ] **Step 4 — First production migration** via `supabase db push --project-ref <prod-ref>` from current state of `apps/concurrentoolVO/supabase/migrations/`
- [ ] **Step 5 — Smoke-test deploy preview** by opening a trivial PR and verifying the preview URL loads with dev-Supabase data

## Status

- [x] Brief drafted
- [ ] `.env.local.example` update (in progress)
- [ ] `AGENTS.md` OTAP section (pending)
- [ ] Manual actions (deferred — see above)

## Next step

Execute the two code-side updates as atomic commits on `dev`. Manual
actions stay deferred until the user is ready to flip Vercel.
