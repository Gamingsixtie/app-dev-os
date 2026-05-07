# Phase 1: OTAP Framework Foundations — Specification

**Created:** 2026-05-07
**Status:** Locked — all decisions confirmed by user 2026-05-07
**Project:** ops-otap-framework (Level 3)
**Requirements:** 9 locked
**Decisions:** 7 locked (Q1–Q7 below)

---

## Goal

Every app added to App-Dev OS via `scripts/add-app.sh` automatically
inherits an OTAP-aligned workflow: separate dev/prod Supabase projects,
preview deployments per PR, automated CI gates that block merges to
`main` on red checks, and a documented rollback procedure.

## Background

App-Dev OS today:
- `branch-guard.js` hook hard-blocks pushes to `main`/`master` ✓
- `dev` is the working branch, `feature/*` for code changes ✓
- `scripts/add-app.sh` scaffolds new apps but does NOT scaffold
  per-environment Supabase config or CI workflows ✗
- No shared `.github/workflows/` for app CI ✗
- No documented rollback runbook ✗
- `apps/concurrentoolVO/.env.local` likely points to a single Supabase
  project shared with production (the user-flagged risk) ✗
- `apps/concurrentoolVO/AGENTS.md` already documents a deferred
  "Vercel deploy migration" — relevant context, not blocked by this work

The gap: the *culture* of OTAP exists in `AGENTS.md` (branching policy +
DEV_ETHOS) but the *plumbing* (gates, preview deploys, isolated DBs,
rollback) is absent. This phase installs the plumbing.

## Requirements

1. **Branch-to-environment mapping documented**
   - Current: branching policy in `AGENTS.md` is generic; no link to OTAP letters
   - Target: `code_context/otap.md` exists at root and maps O/T/A/P to concrete tooling
   - Acceptance: file exists, references the 4 letters, links from `AGENTS.md`

2. **CI workflow blocks merge to `main` on red checks**
   - Current: no CI workflow at root; no required checks on PR
   - Target: `.github/workflows/ci.yml` runs on PR; required checks configured on `main` branch protection
   - Acceptance: opening a PR with a deliberate type error fails CI; merge is blocked until fixed

3. **CI workflow scoped per app via path filters**
   - Current: no shared workflow; would need duplication per app
   - Target: single workflow uses `paths:` filter to only run for the changed app's files
   - Acceptance: changing only `apps/concurrentoolVO/src/**` does NOT trigger CI for unrelated apps

4. **Two Supabase projects per app, gitignored credentials**
   - Current: `apps/concurrentoolVO/.env.local` likely shared between local and prod
   - Target: documented split — local Supabase project + production Supabase project, with separate URLs/keys; `.env.local` (local), Vercel env vars (prod)
   - Acceptance: `.env.local.example` documents both URLs as separate variables OR documents the split via Vercel environment scoping; `add-app.sh` scaffold mentions the split

5. **Vercel preview deployments per PR are functional**
   - Current: Vercel preview is default behavior but not validated end-to-end for App-Dev OS apps
   - Target: opening a PR for any app in `apps/*` produces a working preview URL within 3 minutes
   - Acceptance: test PR for `concurrentoolVO` shows the wizard at the preview URL with local Supabase data

6. **Database migrations have a documented sync workflow**
   - Current: no documented migration flow between local and production Supabase
   - Target: `code_context/runbook.md` § "Database migrations" documents the create → test → apply-to-prod flow
   - Acceptance: a developer following the runbook can create a migration locally and apply it to production without losing data

7. **Rollback procedure exists as a 1-pager**
   - Current: no documented rollback steps
   - Target: `code_context/runbook.md` § "Production incident rollback" — 5 numbered steps, max 1 page
   - Acceptance: in a fire drill (simulated), a developer can rollback Vercel deploy in <2 minutes following only the runbook

8. **`add-app.sh` scaffolds OTAP-aware app skeleton**
   - Current: `add-app.sh` creates `AGENTS.md`, `CLAUDE.md`, `brand_context/`, `code_context/`, `context/`, `projects/`, `cron/`
   - Target: also creates `.env.local.example` with two-Supabase template, optional `vercel.json` reminder, and an `OTAP.md` pointer in app's `AGENTS.md`
   - Acceptance: running `bash scripts/add-app.sh "Test App"` produces a folder with the additions present

9. **ADR records the framework decision**
   - Current: no ADR exists for OTAP
   - Target: `ADR/{NNNN}-otap-framework.md` records: scope (root-template), 4-letter mapping, two-Supabase rationale, preview-per-branch rationale, alternatives rejected
   - Acceptance: ADR file exists with required sections (Context, Decision, Alternatives, Consequences); referenced from `code_context/otap.md`

## Boundaries

**In scope:**
- Root-template files: `code_context/otap.md`, `.github/workflows/ci.yml`, `ADR/NNNN-otap-framework.md`
- Updates to `AGENTS.md` branching policy referencing OTAP
- Updates to `scripts/add-app.sh` for OTAP-aware scaffolding
- `code_context/runbook.md` sections for migrations + rollback
- `.env.local.example` shape at root and per-app template

**Out of scope (and why):**
- Per-app rollout to `apps/concurrentoolVO` — separate follow-up project once root-template lands
- Setting up the production Supabase project for any specific app — user-driven action, not automatable
- Setting up Vercel projects for any specific app — already exists for concurrentoolVO; new apps onboard manually
- Standing acceptance environment with own URL — preview-per-branch was decided sufficient
- Hotfix bypass branches — same flow as `feature/`, just higher prio
- Multi-region, canary, blue/green — solo dev, not justified
- Automated rollback — out of scope, manual is acceptable for solo dev
- Migration tooling beyond Supabase CLI — Supabase native is sufficient

## Constraints

- Must respect existing `branch-guard.js` hook — it already blocks `main` pushes; OTAP layers on top, doesn't replace
- Must not break the deferred Vercel deploy migration documented in `apps/concurrentoolVO/AGENTS.md` § "Vercel deploy migration"
- CI workflow must not require GitHub Actions paid features (free tier only — this is a personal project)
- Two Supabase projects per app must fit in Supabase free tier (each app needs ≤2 projects total)
- Pre-commit hook (`scripts/git-hooks/pre-commit`) is advisory; CI is authoritative — pre-commit can be bypassed (`--no-verify`), CI cannot

## Acceptance Criteria

- [ ] `code_context/otap.md` exists and links from `AGENTS.md`
- [ ] `.github/workflows/ci.yml` exists with build + typecheck + vitest jobs and path filters
- [ ] PR with deliberate type error fails CI and is blocked from merging to `main`
- [ ] PR for any `apps/*` change produces working Vercel preview URL within 3 minutes
- [ ] `code_context/runbook.md` contains "Database migrations" + "Production incident rollback" sections
- [ ] `scripts/add-app.sh` produces `.env.local.example` with two-Supabase template
- [ ] ADR exists at `ADR/NNNN-otap-framework.md` with all required sections
- [ ] `AGENTS.md` branching policy references OTAP

---

## Locked Decisions (Q1–Q7)

These resolve the 7 open questions from `.planning/notes/otap-framework-decisions.md`.
All confirmed by user on 2026-05-07. Treated as locked input by plan-phase.

### Q1 — Database migration sync workflow

**Proposal:** Use Supabase CLI with migration files committed to git.

- Migration files live in `apps/<app>/supabase/migrations/<timestamp>_<slug>.sql`
- Local development: `supabase db reset` rebuilds local DB from migrations
- Production deploy: **manual** `supabase db push --project-ref <prod-ref>` after PR merges to `main`
- No automated CI step for production migrations — deliberate friction so the developer is conscious of schema changes hitting prod

**Why manual prod migration:** automated migrations on `main` merge increase blast radius (every PR could mutate prod schema). For solo dev, "merge → I deploy migration myself" is safer.

### Q2 — Per-environment env vars naming

**Proposal:** Single variable name per concept, scoped via Vercel environments.

- One name (e.g. `VITE_SUPABASE_URL`), three values: Production / Preview / Development in Vercel dashboard
- Locally: `.env.local` (gitignored) holds the dev-Supabase values
- No `_PROD`/`_DEV` suffix variants — that scatters truth across multiple variables

**Why:** Vercel's environment scoping is purpose-built for exactly this. Suffix conventions duplicate state.

### Q3 — Promotion gates (PR → main)

**Proposal:** Three required CI checks, two manual checks.

| Gate | Type | Required? |
|------|------|-----------|
| `npm run build` succeeds | Automated CI | ✓ blocks merge |
| Vitest unit tests pass | Automated CI | ✓ blocks merge |
| TypeScript typecheck (`tsc --noEmit`) | Automated CI | ✓ blocks merge |
| Vercel preview deploy succeeds | Automated CI | ✓ blocks merge (Vercel posts status check on PR) |
| Playwright e2e | Automated CI | ✗ run nightly, not on PR (too brittle for fast PR cycles) |
| Manual preview check | Human checklist | ✗ checklist in PR template, not enforced |

**Why no e2e gate:** Playwright is slow and flakes on layout-pixel diffs. Better as a nightly canary than a PR blocker.

### Q4 — Rollback procedure

**Proposal:** 1-pager in `code_context/runbook.md`, no automation.

Steps:
1. **Vercel rollback (instant):** Vercel dashboard → Deployments → previous green deploy → "Promote to Production". Resolves 80% of incidents.
2. **If migration ran:** create revert migration locally → test → `supabase db push --project-ref <prod-ref>`
3. **Log Sentry incident** with link to bad deploy
4. **Open `learnings.md` entry** under `## Per Phase` documenting cause + prevention
5. **Communicate** if external users impacted (manual call/message — out of scope for runbook)

**Why no automation:** solo dev, low frequency. The cost of building rollback automation outweighs its expected use.

### Q5 — Branch naming

**Proposal:** Four prefixes, kebab-case slug, no scope codes.

- `feature/<slug>` — new functionality
- `fix/<slug>` — bug fixes
- `chore/<slug>` — non-code changes (deps, configs, docs)
- `hotfix/<slug>` — production incidents (same flow, higher prio)

Rejected: `refactor/`, `style/`, `docs/`, scope prefixes like `concurrentoolVO/feature/...`

**Why minimal:** four prefixes covers 100% of cases without forcing classification calls. Path filters in CI handle per-app scoping; no need to encode app in branch name.

### Q6 — CI vs local-only test gate

**Proposal:** Both layers, with clear authority.

- **Pre-commit hook (local, fast):** `tsc --noEmit` only. Catches typos before commit. Already installed via `scripts/install-git-hooks.sh`. Bypassable with `--no-verify` for emergencies.
- **GitHub Actions CI (PR, authoritative):** build + typecheck + vitest + Vercel preview status. Cannot be bypassed. This is the actual gate.

**Why both:** pre-commit is friction-reducing (catch trivially before pushing), CI is the real gate. Keep them complementary, not redundant.

### Q7 — CI workflow: per-app vs shared

**Proposal:** **One shared workflow** with path filters.

- `.github/workflows/ci.yml` at root
- Job matrix or conditional steps based on `paths:` triggers (`apps/concurrentoolVO/**`, `apps/<future-app>/**`)
- New apps automatically picked up by adding entries to the matrix (or generic glob)

**Why shared:** monorepo pattern. Per-app workflows duplicate config and drift over time. Shared workflow with path filters is the standard solution and means new apps need only an entry, not a full new workflow file.

---

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                  |
|--------------------|-------|------|--------|----------------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | Goal sentence is concrete + measurable |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Explicit out-of-scope list with reasons|
| Constraint Clarity | 0.80  | 0.65 | ✓      | All 7 decisions locked                 |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 8 pass/fail checkboxes                 |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      | SPEC ready for plan-phase              |

## Interview Log

| Source     | Question                                       | Decision locked                              |
|------------|-----------------------------------------------|---------------------------------------------|
| Exploration| Why now?                                       | Direct-to-prod risk identified after training |
| Exploration| Scope: per-app or root-template?              | Root-template (b)                            |
| Exploration| Acceptance environment shape?                  | Vercel preview per branch (a-light)          |
| Exploration| Database isolation?                            | Two separate Supabase projects per app       |
| Spec       | Migrations workflow?                           | ✓ Locked — Q1 above                       |
| Spec       | Env vars naming?                               | ✓ Locked — Q2 above                       |
| Spec       | PR gates?                                      | ✓ Locked — Q3 above                       |
| Spec       | Rollback shape?                                | ✓ Locked — Q4 above                       |
| Spec       | Branch naming?                                 | ✓ Locked — Q5 above                       |
| Spec       | CI vs local gate split?                        | ✓ Locked — Q6 above                       |
| Spec       | CI workflow per-app or shared?                 | ✓ Locked — Q7 above                       |

---

*Project: ops-otap-framework (Level 3)*
*Spec locked: 2026-05-07*
*Next step: plan-phase — translate 9 requirements + 7 decisions into ordered task list*
