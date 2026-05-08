# ADR-0006: Supabase MCP server for development-environment access

- **Status**: Accepted
- **Date**: 2026-05-08
- **Decider(s)**: pim
- **Supersedes**: —

## Context

After OTAP rollout (ADR-0005), the agent has no direct path to act on
either Supabase project. Mutations require copy-pasting SQL into the
Supabase dashboard SQL Editor. This is fine for one-off changes but
becomes a friction tax on tasks the agent could otherwise own:

- Bootstrap/seed dev data after schema changes
- Verify schema state when debugging auth, RLS, or storage flows
- Inspect actual table contents during incident triage on dev
- Run idempotent setup queries that today require human relay

State at decision time:
- `.claude/settings.json` hard-denies reads of `.env*` files —
  intentional to prevent secret leakage via the agent's context
- `curl`/`wget` are hard-denied at the Bash level — the agent cannot
  make raw HTTP calls
- Two Supabase projects exist per OTAP: `concurrentool-dev`
  (`xxpvreojihjtgiwrqbqn`) and `concurrentool-prod`
  (`upbucffkzvzzflvyzpld`)
- The Supabase CLI is referenced in the project but not installed
  on the developer's machine

Constraints:
- Production must remain structurally unreachable for the agent —
  this is the OTAP-discipline guarantee
- Solo developer, no team — credentials live on one machine
- Free-tier accounts; no enterprise SSO/SCIM features available

## Decision

Adopt the official Supabase MCP server
(`@supabase/mcp-server-supabase`) as a dedicated tool layer for the
agent, scoped at config-time to the `concurrentool-dev` project only.

Concrete configuration:

| Aspect | Choice |
|--------|--------|
| MCP server | `@supabase/mcp-server-supabase` (official, Supabase-published) |
| Scope | `--project-ref=xxpvreojihjtgiwrqbqn` (dev only) |
| Permissions | Read-write (no `--read-only` flag) |
| Credential type | Personal Access Token (PAT) from the developer's Supabase account |
| Credential storage | Plain string in `.mcp.json` — file is in `.gitignore`. A committable template `.mcp.example.json` documents the structure without credentials |
| Audit trail | Every MCP call appears in the agent's tool-call log visible in the Claude Code UI |
| Revocation | One click on https://supabase.com/dashboard/account/tokens — instantly removes agent access without affecting any other workflow |

The `.mcp.json` lives at the App-Dev OS root and is loaded by Claude
Code at startup. The `--project-ref` flag is the lock that prevents
the agent from touching any other Supabase project under the same PAT,
including `concurrentool-prod`.

## Alternatives considered

### Production access (rejected)
- **Add a second MCP entry for prod** (`supabase-prod`):
  - Pros: agent could verify prod state directly during incidents.
  - Cons: violates OTAP-discipline at the structural level. Production
    is a place the agent can advise about, not act on. The whole point
    of ADR-0005 is to make prod-edits structurally impossible.
  - Hard rejected — would invalidate ADR-0005.

### Read-only vs. read-write (read-write chosen, with revisit clause)
- **Read-only** (`--read-only` flag):
  - Pros: agent can inspect dev state but never mutate it; safer
    default; matches the conservative posture of App-Dev OS
    permissions.
  - Cons: 60–80% of the value (bootstrap-data, idempotent fixes, seed
    scripts) requires writes. Read-only would mean the agent still
    relays SQL through the user for every mutation.
- **Read-write (chosen)**:
  - Pros: covers the full set of dev-environment automations (data
    bootstrap, RLS testing, ad-hoc fixes, schema introspection); dev
    is intentionally disposable.
  - Cons: agent can technically delete data on dev. Mitigation: dev is
    leeg-met-schema by design (per OTAP-rollout brief); destructive
    mistakes are recoverable via re-running migrations + re-seeding.
  - **Revisit clause**: if the agent demonstrates a write-related
    incident on dev, downgrade to `--read-only` and write a learnings
    entry. The principle is broad-by-default with self-learning, per
    the App-Dev OS permissions ethos.

### Direct database connection via `psql` (rejected)
- **Add `psql` to allowed Bash commands** with DATABASE_URL from `.env.local`:
  - Pros: lower-level, no MCP-server dependency.
  - Cons: would require lifting the `.env*` deny — undoing the secret-
    protection layer. Plus: no audit trail beyond raw shell output;
    no scoping by Supabase product (auth, storage, etc.). Bypasses
    the structured-tool advantage of MCP.
- Hard rejected — same reason as ADR-0005's "single Supabase project"
  rejection: undoing a structural protection makes the entire framework
  meaningless.

### Generic Postgres MCP server (rejected for now)
- **`@modelcontextprotocol/server-postgres`** with the dev DATABASE_URL:
  - Pros: simpler; not Supabase-specific; could be reused for any
    Postgres elsewhere.
  - Cons: misses Supabase-specific tools (auth admin, storage, RLS
    introspection, edge-function management). For an app whose stack
    is built on Supabase, the generic version is strictly less useful.
- Rejected for the dev-Supabase use case. May be reconsidered if a
  non-Supabase Postgres ever joins the App-Dev OS surface.

### Per-task seed scripts (kept as fallback)
- **Write Node scripts the developer runs locally**, e.g.
  `apps/<app>/supabase/seed-dev-bootstrap.ts`:
  - Pros: no agent access required; the developer's own process reads
    `.env.local`; explicit, versioned, reviewable.
  - Cons: every new task requires writing a script first; high
    friction for one-off operations; doesn't scale across apps.
- Kept as a complementary pattern, not a replacement. The existing
  `apps/concurrentoolVO/supabase/seed-pricing-data.ts` is an example
  of where this pattern fits — large, structured, recurring data
  loads. MCP fits ad-hoc and exploratory work.

## Consequences

**Positive:**
- Bootstrap and seeding tasks on dev complete in one round-trip without
  developer relay
- The agent can verify schema state (table list, RLS policies, row
  counts) when reasoning about auth, storage, or pricing flows
- Production remains structurally locked behind ADR-0005's separation
- Security posture stays multilayered: `.gitignore` protects against
  accidental commit, `.claude/settings.json` deny on `.env*` protects
  against context leak, `--project-ref` flag protects against scope
  creep, PAT revocation gives one-click kill switch

**Negative:**
- New external dependency: requires `npx` access at agent startup to
  fetch the Supabase MCP package (and on every restart unless cached)
- New onboarding step per developer machine: generate PAT, paste into
  `.mcp.json` — currently undocumented in `runbook.md` (separate task)
- New revocation hygiene: PATs don't auto-expire; if the developer
  leaves a PAT lying around indefinitely it becomes a security risk
  worth periodic review

**Trade-offs accepted:**
- PAT scope at the Supabase account level is broader than ideal — the
  same PAT could in principle access prod. Mitigated by the
  `--project-ref` flag at MCP-config time. Tighter scoping (per-project
  PATs) is not currently a Supabase-platform feature on free tier.
- Read-write means the agent can corrupt dev data through bugs.
  Accepted because dev is disposable; the cost of recovery is one
  re-run of migrations and seed scripts.
- `.mcp.json` storing the PAT in plaintext relies on filesystem
  permissions for protection. Acceptable on a single-developer
  workstation; would need encryption-at-rest if this ever reached a
  shared environment.

## Links

- ADR-0005: OTAP framework — defines the dev/prod isolation this ADR
  builds on top of
- Supabase MCP docs:
  https://github.com/supabase-community/supabase-mcp
- Supabase PAT management:
  https://supabase.com/dashboard/account/tokens
- App-Dev OS permissions ethos: [`AGENTS.md` § Permissions](../AGENTS.md#permissions)
- Brief: [`projects/briefs/ops-supabase-mcp-dev/`](../projects/briefs/ops-supabase-mcp-dev/) — *to be created if rollout grows beyond this ADR*
