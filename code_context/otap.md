# OTAP — App-Dev OS Framework Definition

> Operational reference. Architecture decision lives in [ADR-0005](../ADR/0005-otap-framework.md).
> Runbook procedures (migrations, rollback, branch protection setup) live in [`runbook.md`](runbook.md).

---

## TL;DR

OTAP is the discipline of separating where you write code from where users
see it. App-Dev OS installs four named stages with concrete tooling per
stage. Every app under `apps/*` follows this — no app may deviate without
a superseding ADR.

The single rule: **never edit code that runs against the production
database**. Period. The whole framework exists to make that rule
structurally enforced rather than personally remembered.

---

## The four letters

| Letter | Stage | Where | What runs there |
|--------|-------|-------|-----------------|
| **O** — Ontwikkeling | Local development | Your laptop | `npm run dev` (Vite) on a `feature/*` branch, pointing at the local Supabase project |
| **T** — Test | Local + automated verification | Your laptop + GitHub Actions | `npm run build` + Vitest + Playwright locally; build + typecheck + vitest in CI on every PR |
| **A** — Acceptatie | Pre-production preview | Vercel preview deployment | Auto-built per PR; unique URL per branch; uses local-Supabase env values from Vercel "Preview" environment |
| **P** — Productie | Live for users | Vercel main + production Supabase | What the world sees. Reachable only via merge to `main` after green CI + preview check |

---

## Daily workflow

### Adding a feature

```text
1. git checkout -b feature/<short-slug>     ← O starts
2. npm run dev                              ← O: build the feature
3. npm run build && npx vitest run          ← T: verify locally
4. git push -u origin feature/<short-slug>  ← T: trigger CI
5. Open PR on GitHub                        ← A: Vercel posts preview URL
6. Click preview URL, walk through change   ← A: visual + behavioral check
7. Merge PR (only possible if CI green)     ← P: live within ~2 min
8. supabase db push (if migration ran)      ← P: schema sync (manual)
```

If any step fails:
- **CI red?** Fix locally, push again to the same branch — preview re-builds, CI re-runs
- **Preview broken but CI green?** Build-vs-runtime mismatch — fix, push, repeat. Don't merge.
- **Live broken after merge?** See [Production incident rollback](runbook.md#production-incident-rollback) in `runbook.md`

### Branch prefixes

Four prefixes, kebab-case slug:

| Prefix | When |
|--------|------|
| `feature/` | New functionality |
| `fix/` | Bug fix |
| `chore/` | Non-code change (deps, config, docs) |
| `hotfix/` | Production incident — same flow, higher priority |

No `refactor/`, `style/`, `docs/`, scope codes. Four prefixes covers
100% of cases without forcing classification calls.

---

## Per-app setup checklist (one-time)

Run once per app when adding it to App-Dev OS. The first three are manual
user actions on web dashboards — they cannot be scripted on free-tier
accounts.

- [ ] **Create local Supabase project** — name it `<app-slug>-dev`
- [ ] **Create production Supabase project** — name it `<app-slug>-prod`
- [ ] **Copy local Supabase URL + anon key** into `apps/<slug>/.env.local`
- [ ] **Add production Supabase URL + anon key** to Vercel project under "Production" environment
- [ ] **Add local-Supabase URL + anon key** to Vercel project under "Preview" environment (so preview deploys hit the dev DB, not prod)
- [ ] **Configure GitHub branch protection** on `main` per [runbook.md § GitHub branch protection setup](runbook.md#github-branch-protection-setup)
- [ ] **Verify** by opening a test PR with a deliberate type error — CI should block merge

The first six are documented in `runbook.md` with screenshots.
The seventh is the smoke test that confirms the setup landed.

---

## Promotion gates (PR → main)

These are the automated checks that must be green before a PR can merge:

| Gate | Tool | Required? |
|------|------|-----------|
| Production build succeeds | `npm run build` (CI) | ✓ blocks merge |
| Type check passes | `tsc --noEmit` (CI) | ✓ blocks merge |
| Unit tests pass | `vitest run` (CI) | ✓ blocks merge |
| Vercel preview deploys | Vercel auto | ✓ blocks merge (Vercel posts status) |
| E2E tests | `playwright test` | ✗ runs nightly, not on PR |
| Manual preview walkthrough | Human | ✗ checklist in PR template |

Pre-commit hook (`scripts/git-hooks/pre-commit`) runs `tsc --noEmit`
locally before commit. It's a friction-reducer, not a gate — it can be
bypassed with `--no-verify`. CI is the authoritative gate.

---

## Environment variables

Single name per concept; values vary per Vercel environment.

```text
                            Production    Preview       Development
VITE_SUPABASE_URL           prod-url      dev-url       (read from .env.local)
VITE_SUPABASE_ANON_KEY      prod-key      dev-key       (read from .env.local)
VITE_ANTHROPIC_API_KEY      prod-key      dev-key       (read from .env.local)
SENTRY_DSN                  prod-dsn      prod-dsn      (read from .env.local)
```

Set values in the Vercel dashboard under Project Settings → Environment
Variables. Do **not** use `_PROD`/`_DEV` suffixes in variable names —
that scatters the same concept across multiple variables.

`.env.local` is gitignored. `.env.local.example` documents the required
variable names without the values.

---

## What this framework explicitly does NOT do

These were considered and rejected. See [ADR-0005](../ADR/0005-otap-framework.md)
§ Alternatives considered for full reasoning.

- No standing acceptance environment with own URL — preview-per-branch covers it
- No automated production migrations — `supabase db push` is manual after merge
- No automated rollback — Vercel "Promote previous deploy" is one click
- No e2e tests on PR gate — too slow, runs nightly instead
- No per-app CI workflows — single shared workflow with path filters
- No multi-region or canary deploys — solo dev, not justified

If any of these become relevant later, supersede ADR-0005 with a new ADR.

---

## Cross-references

- Architecture decision: [ADR-0005](../ADR/0005-otap-framework.md)
- Runbook procedures: [runbook.md § Database migrations](runbook.md#database-migrations), [§ Production incident rollback](runbook.md#production-incident-rollback), [§ GitHub branch protection setup](runbook.md#github-branch-protection-setup)
- Branching policy: [`AGENTS.md` § Branching Policy](../AGENTS.md#branching-policy)
- Per-app application: each app's `apps/<slug>/AGENTS.md` may add
  app-specific deviations under "App-specific overrides"
