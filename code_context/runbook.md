# Runbook

> Foundation file. Every deploy/ops-skill loads this to know where output lands. Equivalent to `icp.md` for marketing — but for stakeholders + environments.

## First-time setup per app

After `git init` (or after cloning a fresh app), run once:

```bash
bash scripts/install-git-hooks.sh
```

This points git at `scripts/git-hooks/` (version-controlled hooks instead of per-clone `.git/hooks/`). Currently installs:

- **`pre-commit`** — runs `pnpm tsc --noEmit` before every commit. Blocks commit on typecheck failure. Skips gracefully if no `tsconfig.json` yet.

To bypass for an emergency commit (use sparingly): `git commit --no-verify`.

This is the strict gate — the Claude-side `typecheck-guard.js` hook stays advisory (no per-edit friction).

## GitHub branch protection setup (one-time per repo)

> Required step to make the OTAP framework actually enforce the merge gate. Without this, CI runs but PRs can still be merged with red checks. Cannot be scripted on free-tier accounts — apply once via the GitHub web UI.

Open the App-Dev OS repository on GitHub → **Settings** → **Branches** → **Add branch protection rule**.

Apply this rule to `main`:

| Setting | Value | Why |
|---|---|---|
| Branch name pattern | `main` | The production branch — the one we're protecting |
| Require a pull request before merging | ✓ Enabled | Forces every change through a PR (you cannot merge a direct commit) |
| → Require approvals | 0 (or 1 if a reviewer is set up) | Solo dev: 0 is fine. Set to 1 once a reviewer is added |
| Require status checks to pass before merging | ✓ Enabled | The actual gate |
| → Require branches to be up to date before merging | ✓ Enabled | Forces rebase against latest `main` before merge — catches conflicts early |
| → Status checks required | `CI` | This is the `ci-success` summary job from `.github/workflows/ci.yml`. Add it after the workflow has run at least once so GitHub knows the check name |
| Require conversation resolution before merging | ✓ Enabled (optional) | All PR comments must be resolved before merge |
| Require linear history | ✓ Enabled (recommended) | Prevents merge commits — keeps `main` history clean |
| Do not allow bypassing the above settings | ✓ Enabled | Owner cannot push directly to `main`, even by accident |
| Restrict who can push to matching branches | ✓ Enabled, empty list | Nobody can push directly — only PR merges |

Apply the same rule to `dev` if you want CI to gate merges into `dev` as well (recommended — keeps `dev` always-green).

**Verification:** open a test PR with a deliberate type error in any app under `apps/`. The PR page should show the `CI` check as red and the **Merge** button as disabled. Close the PR without merging once verified.

**If you ever need to bypass (true emergency):** temporarily disable the rule, merge, re-enable. This action is logged in the repo audit log — visible to other contributors. Use only for actual production incidents where the deploy must land in seconds, not minutes.

---

## Environments

OTAP letter mapping per environment — see [`otap.md`](otap.md) and [ADR-0005](../ADR/0005-otap-framework.md) for the full framework rationale.

| OTAP | Env | URL | Database | Branch | Auto-deploy |
|---|---|---|---|---|---|
| **O** | Local | `http://localhost:3000` | Supabase **dev** project (remote) — env-vars from `.env.local` | `feature/*` | — |
| **T** | Local + CI | (no URL — runs in terminal + GitHub Actions) | Same as Local | `feature/*` (on PR) | — |
| **A** | Preview | `{app-slug}-{branch}.vercel.app` | Supabase **dev** project — env-vars from Vercel "Preview" environment | `feature/*` | yes, on push |
| **P** | Production | `{your-domain}.com` | Supabase **prod** project — env-vars from Vercel "Production" environment | `main` | yes, via PR merge `dev` → `main` |

> Template shape only — per-app URLs filled in under `apps/{slug}/code_context/runbook.md`.

**Two Supabase projects per app — never one.** Each app has a `<slug>-dev` Supabase project (used by Local + Preview) and a `<slug>-prod` Supabase project (used by Production only). Same env-var names (e.g. `VITE_SUPABASE_URL`) — different values per Vercel environment scope. This is what makes OTAP actually safe: a local migration cannot reach production by accident because the connection strings differ.

**Why Local + Preview share the dev Supabase (and not a Docker-local one):**
- Solo dev — no parallel developers means no schema-conflicts on the shared dev DB
- Avoids Docker overhead for local development
- Preview deploys behave identically to Local (same DB, same data)

Triggers to split Local off into its own Supabase (via `supabase start` Docker stack):
- Second developer joins the project
- Local seed data keeps getting clobbered by migrations on the shared dev DB
- You want to test a schema change without affecting any preview deploy
- Preview deploys break because Local is mid-migration on the shared DB

**External APIs and `localhost`.** OAuth callbacks, webhooks (Stripe, Supabase Auth redirects, etc.), and any third-party service that calls *back* into your app need a public HTTPS URL. `localhost` does not work for these. Two options:

- **Preview deploy (default)** — push to a `feature/*` branch, point the external service at the auto-generated `*.vercel.app` URL. No extra tooling, clean logs, reproducible test runs.
- **Tunnel** — `cloudflared tunnel` or `ngrok` exposes localhost over a public HTTPS URL. Adds setup overhead and dirties local state.

**Default: preview deploy.** Switch to tunnel only when actively debugging a callback path that needs sub-minute iteration cycles — not as the first suggestion. Confirm with the user before setting up a tunnel.

## Deploy

### Production (`dev` → `main` via PR)

`main` is hard-blocked by the branch-guard hook — direct pushes denied. Production deploys go via PR:

1. Feature work merged into `dev` via PR (green CI required).
2. On `dev`, open a PR to `main`:
   ```bash
   gh pr create --base main --head dev --title "release: <summary>"
   ```
3. Merge via GitHub UI or `gh pr merge --merge` (or `--squash` per project preference).
4. Vercel auto-deploys `main` (~2 min).
5. Verify the production URL responds; check the Vercel Deployments dashboard for build logs.

No manual `git tag` step. Vercel tracks each deploy with its own immutable ID. Add tags only if the project starts publishing release notes.

### Preview

- Push to a `feature/*` branch → Vercel posts the preview URL in PR comments automatically.
- One preview deploy per branch; updates on every push.

## Rollback

Two paths. Use the fast one to stop bleeding, then the source-sync one to keep git and production aligned.

### 1. Fast rollback (~30 sec, no git)

Vercel dashboard → **Deployments** → pick the last good deploy → **Promote to Production**. Production restores to that earlier build immediately. Git is still at the broken state — fixed in step 2.

Use when: production is broken and seconds matter.

### 2. Source-sync rollback (~5 min, within 24 h of step 1)

Bring git in line with what is actually live:

```bash
git checkout dev
git checkout -b revert/<short-name>
git revert -m 1 <merge-sha-on-main>   # the merge that broke prod
git push origin revert/<short-name>
gh pr create --base dev --title "revert: <short-name>"
```

Merge the revert PR into `dev`, then open a follow-up `dev → main` PR. Once that lands, git and the deployed Vercel build match again.

Skipping step 2 means git drifts from production — two deploys later someone re-promotes the broken build by accident.

## Secrets

- **Local dev**: `.env.local` (gitignored).
- **Preview / Production**: Vercel Environment Variables (per-env scoped).
- **Rotation cadence**: every 90 days for high-blast-radius keys (Supabase service-role key, third-party API tokens).
- **Never in code**, never in `.env.example`, never in docs.

## On-call

Solo dev — owner is sole responder. No on-call rotation.

Triggers to expand: a second developer joins, or the project takes on a customer SLA. At that point: add an on-call sub-section with primary/escalation/hours/notification, and decide on a paging tool (PagerDuty, OpsGenie, or Slack-based).

## Health checks

- `/api/health` returns 200 if Supabase is reachable.
- Cron `daily-health-ping.md` pings prod URL daily — alert on non-200. Cron job activated in Phase 10 of `/tailor-os`; currently inactive.

## Logs & observability

- **App logs**: Vercel Functions logs (Vercel dashboard → Project → Logs).
- **Errors**: Sentry (project link added per app once Sentry is set up).
- **DB metrics**: Supabase dashboard (built-in: query performance, connection counts, storage).

Product analytics (Posthog, Plausible, etc.) deferred — add only when a real product question requires it.

## Database operations

Stack: Supabase migrations via the `supabase` CLI. No ORM, no Drizzle.

### Migration (additive)

```bash
supabase migration new <name>     # creates supabase/migrations/<timestamp>_<name>.sql
# edit the generated SQL file
supabase db reset                 # applies to local Docker Postgres
# verify locally
git add supabase/migrations/
git commit -m "migration: add <name>"
# push, open PR → dev. CI applies to dev project on merge (supabase db push).
# dev → main PR applies to prod on merge.
```

### Migration (destructive)

1. Add column/table additive first.
2. Backfill data via script.
3. Switch reads to new column.
4. Switch writes to new column.
5. Drop old column in a later release.

**Never** drop in the same migration as the breaking app change. Stack-independent rule — protects against the partial-rollout window where some clients run the old code and some the new.

### Backups

- Supabase performs daily backups automatically (Free plan: 7-day retention; Pro: 7-day PITR + 30-day daily backups).
- Restore via Supabase dashboard → Database → Backups → "Restore".
- Restore-test cadence: target once per quarter on a non-prod project.

## Stakeholders

Solo dev — only stakeholder is end users. Communicate breaking changes via in-app banner or transactional email. No internal-team or on-call channel needed.

## Disaster scenarios

- **DB unreachable**: app shows maintenance page (load shedding); rollback last deploy if recent.
- **Supabase Auth down**: sessions expire gracefully; show clear error to user.
- **Vercel platform incident**: check `vercel-status.com`; communicate ETA via status page or in-app banner.
- **Supabase platform incident**: check `status.supabase.com`; same response pattern.
- _Add project-specific scenarios under `apps/{slug}/code_context/runbook.md`._

---

*Edit this file once per project + after every incident (with what changed). Skills load it lazily per Context Matrix.*
