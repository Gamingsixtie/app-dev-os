# ADR-0005: OTAP framework as App-Dev OS root-template

- **Status**: Partially superseded by [ADR-0007](0007-single-branch-no-pr-workflow.md) on 2026-05-08
- **Date**: 2026-05-07
- **Decider(s)**: pim
- **Supersedes**: —

> **Status note (2026-05-08):** ADR-0007 supersedes the workflow decisions
> in this ADR (PR gates, two test layers, single shared CI workflow,
> feature → dev → main promotion path). The Supabase-isolation, env-var
> naming, manual production migration, and branch-prefix decisions in this
> ADR remain in force. See ADR-0007 for the new single-branch model.

## Context

The user identified a behavioral risk: working directly in the production
environment instead of locally, after weeks of moving fast. After OTAP
training (Ontwikkeling, Test, Acceptatie, Productie), the question became
how to install OTAP discipline as a structural property of App-Dev OS
rather than a habit to remember.

State at decision time:
- `branch-guard.js` hook hard-blocks pushes to `main`/`master` (good baseline)
- `dev` is the working branch; `feature/*` branches for code changes
- `scripts/add-app.sh` scaffolds new apps but creates no environment isolation
- No shared CI workflow at root; no required checks on PRs
- No documented rollback procedure
- `apps/concurrentoolVO/.env.local` likely points to a single Supabase
  project that is also the production database — the actual mechanism
  enabling direct-to-prod work

Constraints:
- Solo developer; no QA team; no formal acceptance cycle
- Free-tier hosting (Vercel + Supabase + GitHub Actions) is the budget
- App-Dev OS is multi-app: anything decided here applies to every future
  app added via `scripts/add-app.sh`

## Decision

Install OTAP as a root-template framework in App-Dev OS. The four letters
map to:

| Letter | Stage | Concrete tooling |
|--------|-------|------------------|
| **O** — Ontwikkeling | Local development | `npm run dev` (Vite) on a `feature/*` branch |
| **T** — Test | Local verification + automated CI | `npm run build` + Vitest + Playwright; GitHub Actions on PR |
| **A** — Acceptatie | Pre-production preview | Vercel preview deployment per PR (auto, free) |
| **P** — Productie | Live for users | `main` branch → Vercel production + production Supabase |

Plus seven implementation choices (locked in the SPEC):

1. **Two Supabase projects per app** — one for local/dev, one for production
2. **Single env-var name + Vercel environment scoping** — not `_PROD`/`_DEV` suffixes
3. **PR gates** — build + typecheck + vitest + Vercel preview status (Playwright nightly, not PR gate)
4. **Manual production migrations** — `supabase db push` after merge, never automatic
5. **Branch prefixes** — `feature/`, `fix/`, `chore/`, `hotfix/`
6. **Two test layers** — pre-commit (local, fast) + GitHub Actions CI (authoritative)
7. **Single shared CI workflow** — path-filtered per app, not per-app workflows

## Alternatives considered

### Per-app OTAP setup vs. root-template
- **Per-app**: each app decides its own OTAP shape during onboarding.
  - Pros: flexibility, app teams can deviate when justified.
  - Cons: re-litigation for every new app; drift between apps; the user
    is the only "team" so flexibility has no payoff.
- **Root-template (chosen)**: App-Dev OS itself owns the OTAP definition;
  apps inherit by default.
  - Pros: one decision, applies forever; new apps onboard with discipline
    pre-installed; aligned with App-Dev OS multi-app architecture.
  - Cons: harder to deviate per-app (acceptable trade-off — deviations
    require explicit ADR).

### Acceptance environment shape
- **Standing acceptance environment** with own URL, own Supabase, always-on:
  - Pros: closest to formal OTAP; clear separation; klant-acceptatie ready.
  - Cons: third Supabase project per app; ongoing maintenance; ceremony
    without a user (solo dev has nobody to run formal UAT).
- **Vercel preview-per-branch (chosen)**: every PR gets an automatic
  preview URL.
  - Pros: free; automatic; real production build on real Vercel runtime;
    shareable URL for occasional consultant review.
  - Cons: no standing URL between PRs (acceptable — no real demand for it).
- **No acceptance step**: PR → main → live, with only local + CI gates.
  - Pros: simplest; fastest cycle.
  - Cons: doesn't add a *visible* checkpoint between merge and live —
    misses the behavioral nudge the user wants. Rejected.

### Database isolation
- **Single Supabase project**: local + production share one DB.
  - Pros: simplest; cheapest (already running).
  - Cons: this is the actual problem the user wants to fix. Local
    migrations, seed data, accidental deletes can corrupt production.
    **Hard rejected** — ignoring the trigger would invalidate the
    entire framework.
- **Two Supabase projects per app (chosen)**: local has its own DB with
  seed data; production has the real DB.
  - Pros: full isolation; free tier accommodates two projects per app;
    aligns with the OTAP "T" and "P" environments.
  - Cons: developer must remember to point local to the dev project
    (mitigated via `.env.local.example` template + scaffold).

### CI workflow architecture
- **Per-app CI workflows** in `apps/*/.github/workflows/`:
  - Pros: app-specific tuning; independent failure domains.
  - Cons: duplication; configuration drift; new apps need a fresh
    workflow file; conflicts with monorepo .github/ resolution.
- **Single shared workflow with path filters (chosen)** in root
  `.github/workflows/ci.yml`:
  - Pros: one source of truth; new apps work via path-glob; standard
    monorepo pattern.
  - Cons: harder to apply app-specific tuning (acceptable for now —
    apps are similar in shape; deviation requires ADR amendment).

### Test gate placement
- **Pre-commit only**: rely on local hook to block bad commits.
  - Cons: bypassable (`--no-verify`); doesn't run in clean environment;
    cannot block merges.
- **CI only**: skip local hook entirely.
  - Cons: slow feedback loop; trivially fixable typos require a push
    cycle to surface.
- **Both layers (chosen)**: pre-commit catches typos cheaply; CI is the
  authoritative gate.
  - Pros: each layer plays to its strength.
  - Cons: minor maintenance overhead (worth it).

## Consequences

**Positive:**
- Production-first work becomes structurally harder; lokaal-eerst becomes
  the path of least resistance
- New apps onboard with environment isolation pre-installed
- ADR + runbook + scaffold produce a coherent, repeatable system
- Free-tier costs (Vercel + Supabase + GitHub Actions) cover the entire
  framework — no infrastructure budget required

**Negative:**
- Slight friction added to dev cycle: PR + preview-check before merge
  instead of direct push to a branch that auto-deploys
- Manual production migrations require remembering to run
  `supabase db push` after merge (mitigated via runbook + checklist in
  PR template — separate task)
- Two Supabase projects per app means slightly more dashboard
  navigation when debugging

**Trade-offs accepted:**
- No automated rollback — Vercel "Promote previous deploy" + manual
  migration revert is the documented procedure (acceptable for solo dev,
  low incident frequency)
- No Playwright e2e on PR gate — too slow + flaky for PR cycle, runs
  nightly instead
- No standing acceptance environment — preview-per-branch covers 90%
  of the value at 0% of the cost
- No per-app CI tuning — accepted that all apps share the build/test
  shape; deviation requires explicit ADR amendment
- Manual GitHub branch protection setup — cannot be scripted via CLI for
  free-tier accounts; user applies once via the dashboard, documented
  in runbook

## Links

- Brief: [`projects/briefs/ops-otap-framework/brief.md`](../projects/briefs/ops-otap-framework/brief.md)
- Spec: [`projects/briefs/ops-otap-framework/SPEC.md`](../projects/briefs/ops-otap-framework/SPEC.md)
- Plan: [`projects/briefs/ops-otap-framework/PLAN.md`](../projects/briefs/ops-otap-framework/PLAN.md)
- Exploration note: [`.planning/notes/otap-framework-decisions.md`](../.planning/notes/otap-framework-decisions.md)
- Framework definition: [`code_context/otap.md`](../code_context/otap.md) — *to be created in T1.1*
- Runbook entries: [`code_context/runbook.md`](../code_context/runbook.md) — *to be created in Wave 3*
- Related ADRs: ADR-0001 (Supabase SDK), ADR-0004 (Sentry + Vercel logs)
