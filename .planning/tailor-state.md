---
project: app-dev-os-tailoring
status: in_progress
created: 2026-04-27
---

# Tailor State

phases:
  1_dev_ethos: completed
  2_user_profile: completed
  3_conventions: completed
  4_architecture: completed
  5_runbook: completed
  6_brand_context: completed
  7_skills: completed
  8_hooks: completed
  9_permissions: completed
  10_cron_jobs: completed

## Notes
- Started: 2026-04-27
- Edits applied per phase will be appended below.

### Phase 1 — DEV_ETHOS (completed 2026-04-27)
Rewrote `context/DEV_ETHOS.md` with the following changes:

**Core Truths (8 — content adjusted, structure kept):**
- Truth 5 changed from "tests when risky" → "test everything that has behavior" (user picked option A: always test)
- Truth 7 flipped from "be opinionated" → "lay out options, ask context first" (user prefers neutral with fallback)
- Truths 6 + 8 reworded in plain language for non-senior reader
- Truths 2 + 3 expanded with reasoning-out-loud cues

**Behaviour Rules (6 → 17 — substantial expansion of high-signal rules):**
Added: explain-what-and-why, confirm-risky-or-costly, quality-over-speed,
no question limit, debug-locally-before-deploy, natural GitHub flow,
errors-should-teach, correct-user-when-wrong, check-in-periodically,
no-refactor-with-feature, no-tracking-without-approval, README-stays-current.

Kept: never-push-main, no-secrets/lockfiles, lint/typecheck/test before done,
ask-stack/version, post-deliverable reflection.

**Cuts** (from longer first proposal): generic-good-engineer rules dropped
(code-for-humans, take-concrete-tasks, show-changes, comments-why, no-orphan-TODOs,
one-thing-at-a-time) — Claude defaults already cover them.

**Sections kept unchanged:** Boundaries, Continuity.

**Final length:** ~110 lines (vs ~80 original, vs ~150 first proposal). Selected
Option B from the quality-vs-bloat trade-off discussion.

**Memos saved this phase:**
- `feedback_language.md` — NL conversation, EN file output
- `user_level.md` — non-senior; explain jargon
- `feedback_question_first.md` — question first, recommend on demand
- `feedback_local_first.md` — local debugging before Vercel deploys
- `project_stack.md` — Vercel + GitHub, solo dev

### Phase 2 — USER profile (completed 2026-04-27)
Rewrote `context/USER.md` from placeholder to populated profile.

**About:**
- Pim, GitHub `gamingsixttie`, VS Code on Windows 11

**Stack (all "kies jij" → recommended Vercel-indie stack, user accepted all doubts):**
- TypeScript primary, Python secondary (scripts/AI)
- Next.js (App Router) — Vercel-native
- pnpm (over npm — modern default)
- Vitest (TS) + Pytest (Python)
- Biome (over ESLint+Prettier — one tool, less config hell for non-senior)
- TypeScript strict mode
- Supabase (Postgres + Auth + Storage) via supabase-js SDK only — no separate ORM yet
- Vercel + Supabase hosting

**Working style:**
- write-test-after, pragmatic — logic/utils get tests, UI components do not (option B chosen explicitly)
- self-standard code review (one read-through before commit; no second reviewer = solo)
- continuous-on-merge-to-main (Vercel auto-deploys on `dev → main` PR)
- no on-call (solo)
- dev + main branch policy (locked in by branch-guard hook)
- small PRs (~100 lines, max ~300)
- Conventional commits with cheat sheet in Notes section (user explicitly requested cheat sheet)

**Risk posture — key addition: impact-based autonomy (user's own formulation):**
- High impact (deploy-to-main, prod DB migration, force-push, deleting outside git, secrets, dev→main merge) → propose first, wait for explicit OK
- Low impact (local edits, lint/format, dev-deps, local migration, commits on dev/feature, docs, skills) → execute + explain what + why so user can revise and learn
- Other risk fields: low blast tolerance; destructive only in cwd/`/tmp`; force-push own feature branches only; `.env.local` + Vercel env vars, never in git

### Phase 3 — code_context/conventions.md (completed 2026-04-27)
Rewrote `code_context/conventions.md` from generic placeholder to Vercel-indie-stack-specific.

**User pre-confirmed three style choices:**
- Line length: 100 chars (over Biome default 80)
- Quotes: double (Biome default — kept rather than switched to single)
- TypeScript `noUncheckedIndexedAccess: true` enabled (extra strictness — array access returns `T | undefined`)

**Tooling fixes (placeholder → real):**
- Languages & versions: TypeScript 5.x + Python 3.12 + Node 22 + pnpm 9 (concrete versions)
- Formatting + Linting sections rewritten around **Biome** (single tool); ESLint, Prettier, Ruff, golangci-lint references removed

**File layout rewritten for Next.js App Router:**
- `app/` (App Router routes), `src/lib/` (shared utils + Supabase wrappers), `src/components/` (UI), `tests/`, `supabase/migrations/`, `scripts/`, `docs/`
- Removed generic `migrations/ or drizzle/` reference

**Banned patterns expanded with stack-specific rules:**
- `<a href>` for internal nav → use Next.js `<Link>`
- `process.env.X` in components → centralize in `src/lib/env.ts`
- Hard-coded Supabase URLs/keys → env vars only
- Hand-editing `pnpm-lock.yaml` → use `pnpm install`
- Committing `.env*` → gitignored, never in git
- `useEffect` for data fetching where Server Component / native fetch works
- Mixing client + server code without `'use client'` / `'use server'` directive
- `npm install` / `yarn add` in this project → only `pnpm`
- Raw SQL in app code → Supabase SDK; DDL in `supabase/migrations/` only

**Naming additions:**
- React components: PascalCase exports matching filename
- Hooks: `use` prefix
- Server-only files: `.server.ts` suffix when not auto-detected by Next.js

**Type safety additions:**
- `noUncheckedIndexedAccess: true`
- Prefer `unknown` over `any`, narrow at boundary
- Explicit return types on exported public functions

**Sections kept ~unchanged:** Imports (already had `@/` alias guidance), Comments (rules remained sound), Errors (added Vercel stderr-logging note + no-stack-traces-to-client).

**No bonus config-scan possible:** the repo has no `package.json`, `pyproject.toml`, or `biome.json` yet — this template is pure methodology, no code stack files. The conventions are the *target*, not derived from existing config.

**Communication:**
- NL chat, EN files (re-affirmed from memory)
- Moderate verbosity, inline snippets with explanation, full files only on request
- Confidence signals on (flag uncertainty)
- One-liner reasoning ("X because Y") on non-trivial decisions, silent on routine
- No question limit (Phase 1 already locked this)
- Jargon explained in plain language

**Decisions worth re-reading later:**
- Impact-based autonomy rule supersedes the simpler "ask before risky" rule from Phase 1's `confirm-risky-or-costly` — keep this in mind when reviewing DEV_ETHOS for consistency in future tailoring rounds.
- All three "twijfelpunten" in stack block (pnpm/Biome/Supabase-SDK-only) accepted with "de twijfel gaat aan jouw kant op" — these are recommendations, not strong personal preferences; revisit if friction emerges.

### Phase 4 — code_context/architecture.md (completed 2026-04-28)
Rewrote `code_context/architecture.md` from placeholder to Next.js + Supabase template-shape.

**Framing — important:**
- Template-level file describes the *expected shape* of apps, not running code.
- Concrete apps live under `apps/{slug}/` and may override via `apps/{slug}/code_context/architecture.md`.
- A divergence surfaced mid-phase: user's actual current project (rekentool, see `TRAINING-CONTEXT.md`) uses Vite + TanStack Router, not Next.js. User explicitly chose **Option A**: keep Next.js as template default for *future* apps; rekentool will get its own per-app override when imported via `add-app.sh`.

**Stack table (placeholders → locked choices):**
- Frontend: Next.js (App Router) + React + TS 5.x strict (`noUncheckedIndexedAccess`)
- Backend: Next.js Route Handlers (`app/api/*/route.ts`) — no separate backend
- Database: Supabase (Postgres) via `supabase-js` SDK — no separate ORM
- Auth: Supabase Auth
- Storage: Supabase Storage (added as separate row — was missing)
- Hosting: Vercel + Supabase
- Observability: Vercel built-in logs + Sentry (errors). User chose Optie B (recommended baseline). Posthog/Logtail/Datadog deferred.

**Components — chosen shape:**
- `app/`, `src/components/`, `src/lib/supabase/` (browser/server/service-role/types), `src/lib/auth/` (get-session, require-user, middleware.ts at root), `src/lib/env.ts` (Zod-validated), `src/lib/utils/`
- `src/lib/services/` — *optional, on-demand only*. Not pre-created. ADR-equivalent bullet logged: "no mandatory services layer — avoid premature abstraction".

**Database-layer decision (1a):** Optie A — `src/lib/supabase/` with three client wrappers (browser, server, service-role) + auto-generated types. Required pattern for App Router because of Server vs Client Component split.

**Services-layer decision (1c):** Optie C (pragmatisch) — refactor to services only when same Supabase logic duplicates 3+ places, or business rules mix with data access. Aligns with DEV_ETHOS "no premature abstractions".

**Invariants — old vs new:**
- Old #1 (auth on `/api/*` except `/api/health`) → kept, adapted to App Router patterns.
- Old #2 (DB writes via service layer) → replaced with "DB access only via `supabase-js` SDK; no raw SQL in app code; no direct REST calls". Reason: services layer no longer mandatory.
- Old #3 (migrations immutable after merge to main) → kept.
- **Added 5 new invariants:** RLS always on; `service_role_key` server-only; auth via Supabase helpers (no custom JWT parsing); Storage uploads via SDK + signed URLs (never proxied through Vercel function); PII never in client state / localStorage.
- **Not added (already in conventions.md):** env vars only via `src/lib/env.ts`; Server Components default; banned patterns.
- **Not added (rekentool-specific, belongs in app-level architecture.md):** Vercel function 60s timeout (user mentioned upgrade to 300s on Pro plan), locked files (`default-prices.ts`, `cito-migration-prices.ts`).

**Data flow:** Rewrote diagram to reflect Supabase-direct browser uploads (signed URLs bypassing Vercel) + three Supabase client roles (browser/server/service-role).

**Directory structure:** Rewrote to match `apps/{slug}/` per-app shape with `middleware.ts` at root, `supabase/migrations/`, optional `tests/e2e/`.

**ADR-equivalent bullets logged (4):**
1. Supabase via SDK, no ORM
2. Biome over ESLint+Prettier
3. No mandatory services layer
4. Sentry + Vercel built-in for observability; product-analytics tools deferred

**Decisions worth re-reading later:**
- Vite + TanStack stack of rekentool will need a full per-app architecture.md override when `add-app.sh` runs for it. Don't try to retro-fit Next.js patterns onto Vite SPA invariants.
- "No mandatory services layer" trades long-term consistency (predictable layering) for short-term simplicity (no empty folders, no premature abstraction). If same Supabase call appears 3+ places in any app, that's the trigger to refactor — not a code-review style preference.

### Phase 5 — code_context/runbook.md (completed 2026-04-28)
Rewrote `code_context/runbook.md` from generic placeholder to Vercel + Supabase + dev/main flow. Stays as **template-shape** — concrete URLs filled per app under `apps/{slug}/code_context/runbook.md`.

**Environments table reshaped:**
- Local DB: was "local Postgres" → now "Supabase dev project (remote)"
- Preview URL: was `*.vercel.app` → now `{app-slug}-{branch}.vercel.app`
- Production URL: was `your-domain.com` → now `{your-domain}.com` (per-app placeholder)
- Branch column made explicit: `feature/*` → preview; `main` → production via PR-merge from `dev`
- **Decision (1a):** Optie A — keep 3 envs (Local/Preview/Production) with placeholder URLs. Staging deferred until a real customer/SLA need surfaces.
- **Decision (1b):** Optie C — Local + Preview share one Supabase dev project; production has separate Supabase prod project. Logged 4 explicit triggers in the file for when to split Local off (second dev joins, seed data clobbered, schema-change isolation, mid-migration breaks preview).
- **User pain solved:** "API koppeling werkt niet lokaal" — added a callout block explaining `localhost` cannot receive OAuth callbacks/webhooks, with two solutions (preview deploy = default, tunnel = exception) and a decision rule baked into the file: "default preview, switch to tunnel only when sub-minute callback iteration is needed; confirm with user first."

**Deploy section rewritten:**
- Removed direct `git push origin main` flow — would be hard-blocked by branch-guard hook anyway
- New flow: feature → PR to `dev`, then `dev → main` PR via `gh pr create --base main --head dev`, merge through GitHub UI or `gh pr merge --merge`
- Vercel auto-deploys on merge (~2 min)
- **Decision (2a):** Optie A — no manual `git tag` step. Vercel's built-in immutable deploy IDs are sufficient for solo SaaS; tags are only worth adding if the project starts publishing release notes.
- Preview section simplified to one bullet — Vercel posts URL in PR comments automatically.

**Rollback section restructured into two-path procedure:**
- **Decision (2b):** Optie A — Path 1 = Vercel "Promote previous" (~30s, no git, fast bleeding-stop). Path 2 = source-sync via `revert/<name>` branch + PR within 24h, to keep git ↔ production aligned.
- Explicit warning: "skipping path 2 means git drifts from production — two deploys later someone re-promotes the broken build by accident."

**Secrets section tightened:**
- Removed "Vercel / Railway / etc." placeholder → just "Vercel Environment Variables (per-env scoped)" since stack is Vercel-locked.
- Added concrete examples of high-blast-radius keys for the 90-day rotation rule (Supabase service-role key, third-party API tokens).

**On-call section collapsed:**
- **Decision (3a):** Optie A — was 4-line placeholder block (Primary/Escalation/Hours/Notification). Replaced with one line: "Solo dev — owner is sole responder. No on-call rotation."
- Trigger to expand explicitly logged: second developer joins OR customer SLA → re-introduce on-call structure + paging tool decision.

**Logs & observability section pruned:**
- **Decision (3b):** removed Logtail / CloudWatch / Posthog references (never chosen in Phase 4). Kept only what locked in Phase 4: Vercel Functions logs + Sentry + Supabase dashboard for DB metrics.
- Added explicit "Product analytics deferred — add only when a real product question requires it" so future-Pim/Claude doesn't accidentally re-add Posthog without justification.

**Database operations section rewritten:**
- **Decision (3c):** removed Drizzle flow entirely (never chosen). Replaced with `supabase migration new` / `supabase db reset` / `supabase db push` flow.
- Destructive-migration 5-step pattern kept verbatim — stack-independent rule.
- Backups updated with Supabase-specific specifics (Free 7-day retention, Pro 7-day PITR + 30-day daily). Added quarterly restore-test cadence.

**Stakeholders section collapsed:**
- **Decision (3d):** was 3-row table (End users / Internal team / Owner). Replaced with one line: "Solo dev — only stakeholder is end users. Communicate breaking changes via in-app banner or transactional email."

**Disaster scenarios section made stack-specific:**
- Generic "Auth provider" → "Supabase Auth"
- Generic "Hosting platform incident" → split into "Vercel platform incident" (`vercel-status.com`) + "Supabase platform incident" (`status.supabase.com`)
- Closing bullet: per-app additions go under `apps/{slug}/code_context/runbook.md`.

**Decisions worth re-reading later:**
- The "default preview, exception tunnel" rule for API callback testing is baked into the runbook itself — not in DEV_ETHOS or memory. Keep that consistent if other ops decisions follow the same pattern (file-level decision rules vs. global ethos rules).
- All "trigger to expand" callouts (Local-DB split, on-call activation, product-analytics addition, per-app overrides) follow a consistent pattern: the file says "right now we use the simple solution because [reason]; switch to the bigger solution when [trigger]". This pattern could become a meta-convention worth promoting to DEV_ETHOS or a meta-skill if it recurs in Phase 7-10.
- Rekentool's reality (Vite + TanStack, not Next.js) is *not* in this template runbook — when imported via `add-app.sh` it gets its own per-app override. Don't retro-fit Vercel-Functions / Supabase-migrations text onto the rekentool app runbook.

### Phase 6 — brand_context (completed 2026-04-28)
Tuned `brand_context/voice-profile.md` + `samples.md` to a single neutral template-default voice. Per-app overrides remain available for apps that need a different vibe.

**User mental model — A + B combined:**
- Pim builds two distinct app categories: Cito apps (educational/B2B-ish) + personal apps (own indie projects). Both get developed roughly equally.
- Phase 6 decision: pick *one* template default that works for both, override per app only when truly needed.

**Subvraag 6a — default voice owner:**
- User picked "even vaak / weet niet" → went with my recommended fallback: neutral middle ground (no winner, default works for both)

**Subvraag 6b — voice profile chosen:**
- User picked "variant met minste context en kern altijd duidelijk" → translated to:
  - **Register**: friendly-professional (neutral middle — works for Cito-formal AND personal-casual without leaning hard either way)
  - **Personality**: no-nonsense tool (helpful but task-first, not charm-first)
  - **Energy**: quick-and-punchy (short sentences)
  - **Core rule** added: "shortest version that keeps meaning unambiguous; cut aggressively, keep a word the moment cutting it makes the message harder to understand"

**voice-profile.md — 4 sections updated:**
1. **Tone** — placeholders ("friendly-professional / casual / formal / playful") replaced with the locked combo + reasoning.
2. **Vocabulary** — concrete words filled in:
   - Use: "your", "you", "save", "delete", "try again", "check", "fix" + direct verbs over hedged phrasing
   - Avoid: "kindly", "please be advised", "an error has occurred", "unfortunately", "we apologize/regret", corporate filler ("regarding", "in order to", "as per"), excessive cuteness ("oopsie", "whoops!", emoji-as-message)
   - Project-specific: pointed to per-app override location
3. **Sample microcopy** — tightened 5 examples:
   - "Save changes" → "Save"
   - "No new messages. You're all caught up." → "No new messages."
   - "Just a sec…" → "Loading…" (neutraler voor Cito-context)
4. **Per-app override section** added — explicit rule that app-level overrides fully replace this file (no merging).

**samples.md — 3 sections tightened:**
1. **Buttons** — drop verbose variants ("Save changes" → "Save", "Send invite" → "Send", "Skip for now" → "Skip", etc.)
2. **Loading states** — "Just a sec…" → "Loading…", "Saving changes…" → "Saving…", "Building your dashboard…" → "Building dashboard…"
3. **Onboarding** — "I'll do this later" → "Skip"

**Sections explicitly kept unchanged** (already aligned with chosen voice): Sentence patterns (short / active / second-person / contractions), Error-message style (the 3-rule do/don't table is the canonical reference for the voice), Empty states (encouraging tone + show next action).

**Decisions worth re-reading later:**
- The "neutral middle ground" default deliberately doesn't win Cito or personal — both are slightly off-center from the default and may both want overrides eventually. If override is needed too often (>30% of apps), the default itself is wrong and Phase 6 should be re-tailored.
- "kern altijd duidelijk" rule is stronger than the brevity rule — if a user mentions "this error message felt confusing" during dev, that's the trigger to add a word back, not to defend brevity.
- icp.md + positioning.md were skipped per command spec (marketing-only, not for microcopy). They remain as placeholder files — could be removed entirely if you want a leaner brand_context, but cost of leaving them is zero.

### Phase 7 — Skills selection (completed 2026-04-28)
Kept all 7 installed skills as-is + built one new skill (`docs-adr`) + promoted Phase 4's 4 ADR-equivalent bullets to real ADR files.

**Skills kept (7, no changes):**
- `meta-skill-creator`, `meta-wrap-up`, `mkt-brand-voice`, `ops-cron`, `code-feature-build`, `code-review`, `test-write-unit`. User confirmed all 7 fit; no removals.

**Catalog discovery:** `.claude/skills/_catalog/catalog.json` only contains Agentic-OS legacy skills (mkt/viz/str/tool) — none dev-relevant. All dev-skill candidates (`db-*`, `infra-*`, `sec-*`, `deploy-*`, `docs-*`) need to be built via `meta-skill-creator`, not added via `add-skill.sh`. Documented this for future tailoring rounds.

**Strongest gap candidates surfaced (3):**
1. `docs-adr` — promote 4 Phase 4 bulletjes to immutable ADRs; user picked this to build now.
2. `db-migration` — Supabase migration flow already documented in runbook but not enforced; deferred until first migration.
3. `ops-new-feature` — feature-branch flow + conventional-commit cheat sheet; deferred until first feature.

**Borderline candidates skipped:** `sec-dep-audit` (covered by cron), `code-debug` (covered by `feedback_local_first` memory), `tool-sentry`, `code-refactor`, `deploy-rollback` (manual flow already documented in runbook).

**`docs-adr` skill built:**
- `.claude/skills/docs-adr/SKILL.md` (3 modes: create / promote / supersede; auto-numbering; learnings.md feedback loop)
- `.claude/skills/docs-adr/references/adr-template.md` (mirrors `ADR/README.md` § Template)
- Vibe-build (no eval/benchmark loop); deterministic file IO doesn't need quantitative validation

**Conflict caught mid-build (important pattern):**
- ADR/README.md already existed with its own template + own Index. First skill draft used a *different* template (em-dash vs colon, `## Related` vs `## Links`, no Decider field). User accepted recommendation: align skill to existing `ADR/README.md` (it was there first), pick *one* canonical index (`ADR/README.md` § Index), drop Decider(s) field for solo-dev YAGNI.
- Lesson: when building a skill that interacts with an existing folder, read every README/scaffolding file in that folder *before* writing the skill template.

**Registration done:**
- `AGENTS.md` § Skill Registry — added "Documentation Skills" subsection with `docs-adr` row
- `AGENTS.md` § Context Matrix — added `docs-adr` row (architecture.md = full § ADR-equivalent, conventions = tone-only)
- `README.md` § Foundation skills — added `docs-adr` row, removed "ADR scaffolding" from optional list
- `context/learnings.md` § ADRs Index — collapsed to pointer (canonical index = `ADR/README.md` § Index)
- `context/learnings.md` § docs-adr — section already existed (template-prepared)

**ADRs promoted (4, all dated 2026-04-28):**
1. ADR-0001 — Use Supabase SDK without separate ORM
2. ADR-0002 — Use Biome over ESLint + Prettier
3. ADR-0003 — No mandatory services layer
4. ADR-0004 — Sentry for errors + Vercel built-in logs; defer product analytics

Each ADR follows ADR/README.md template (Status / Date / Supersedes — Context — Decision — Alternatives — Consequences — Links). Source bullets in `code_context/architecture.md` § ADR-equivalent replaced with one-line pointer-links (kept for scroll-back continuity, not deleted). ADR/README.md § Index updated with 4 rows.

**Decisions worth re-reading later:**
- The "build skill on-demand, not 'just in case'" principle held: 3 candidates surfaced, only the one with concrete-near-future use case was built. The other 2 (`db-migration`, `ops-new-feature`) are noted as triggers for next time the user starts a real Supabase migration or a feature branch.
- The `docs-adr` skill's Self-Update mechanism is unused so far — first user-flagged issue should add a dated rule to `## Rules` instead of being silently absorbed.
- The dual-index conflict (ADR/README.md vs learnings.md) is the kind of inconsistency a `meta-wrap-up` could catch if it ran a "two indexes, same data?" check across the template. Worth flagging if Phase 7 patterns recur in Phase 8-10.
- Decider(s) field removal is a low-impact bet on solo-dev future; if a second dev ever joins, the field comes back via a superseding ADR-template change (or an updated `references/adr-template.md`).

### Phase 8 — Hooks (completed 2026-04-28)
All 5 dev-foundation hooks ratified as-is. No edits to `.claude/settings.json` or hook source files.

**Hooks reviewed (5):**
- `branch-guard.js` — kept strict: BLOCK on `main`/`master`/`production`, advisory nudge on `dev` for code/config zones, always allow on `feature/*` / `worktree-*`. Matches USER.md never-push-main rule + DEV_ETHOS hard rule + runbook deploy flow exactly.
- `secret-scan.js` — kept strict: blocks AWS/GitHub/OpenAI/Anthropic/Slack tokens, PEM keys, generic `*_API_KEY=…` patterns, `cat .env` reads, `git add .env` commits. Low false-positive risk because user's secrets live in `.env.local` + Vercel env vars (already gitignored + permission-denied).
- `dangerous-bash.js` — kept strict: blocks `rm -rf /` etc., force push, hard reset on protected branches, `chmod 777`, raw destructive SQL (`DROP TABLE`/`TRUNCATE`/`DELETE FROM x;` without WHERE), `curl ... | sh`, `sudo rm`. Verified `supabase db reset` does NOT trigger (pattern requires `git\s+reset\s+--hard` literal).
- `lockfile-guard.js` — kept strict: blocks direct edits to `pnpm-lock.yaml` (and 9 other lockfiles); bypass only via `tool-` skills. Matches `conventions.md` banned-pattern.
- `typecheck-guard.js` — kept advisory (default). Reasoning: TS strict + `noUncheckedIndexedAccess` make type-errors visible fast, and per-edit 30s friction during iterative debugging collides with `feedback_local_first` memory. Strict gate moved one level lower (commit-time, see below).

**Choice on Q3: option C** (advisory-edit + strict-commit). User flipped from A to C mid-phase: "C is op langere termijn beter."

**Files added:**
- `scripts/git-hooks/pre-commit` — bash script: runs `pnpm tsc --noEmit` before every commit, blocks on failure. Skips gracefully if no `tsconfig.json` (template-friendly). Falls back to `npx tsc --noEmit` if pnpm missing. Exit non-zero blocks commit with clear error message.
- `scripts/install-git-hooks.sh` — one-shot installer: runs `git config core.hooksPath scripts/git-hooks` so hooks are version-controlled (not in per-clone `.git/hooks/`). User runs this once per app after `git init`.

**Files updated:**
- `code_context/runbook.md` — added "First-time setup per app" section before Environments, documenting the installer + bypass mechanism (`git commit --no-verify`).

**No changes:** `.claude/settings.json` hooks block + all 5 Claude-side hook files unchanged.

**Decisions worth re-reading later:**
- The two-layer strategy (Claude-side advisory per edit + git pre-commit strict per commit) is the actual choice — not "advisory only" or "strict only". DEV_ETHOS rule "lint/typecheck/test before done" now has a hard gate enforcing it, instead of just being a guideline.
- The pre-commit hook only runs typecheck. Lint (Biome) + tests are still trust-the-developer per DEV_ETHOS. If a real production bug slips through that biome/test would have caught at commit-time, that's the trigger to extend the hook.
- `--no-verify` bypass is documented; abuse-pattern to watch: if commits start regularly using `--no-verify`, the hook is too strict or the typecheck is broken — investigate before normalising the bypass.
- Per-app inheritance: when `add-app.sh` runs and creates `apps/{slug}/`, the app's git repo will need its own `scripts/git-hooks/pre-commit` + `install-git-hooks.sh`. Worth considering whether `add-app.sh` should auto-copy these files or symlink to root. Not solved this phase — flag for a future tailor round.
- Block-mode for the Claude-side `typecheck-guard.js` (`TYPECHECK_GUARD_BLOCK=1`) is still one env-var away if commit-time gating ever feels too late.
- All 5 Claude-side hooks are stack-agnostic enough to inherit unchanged into per-app `apps/{slug}/.claude/`. No per-app override anticipated.

### Phase 9 — Permissions (completed 2026-04-28)
Edited `.claude/settings.json` permissions block. Final state: 91 allow entries (was 73), 44 deny entries (was 46). JSON validated.

**Guiding principle locked mid-phase — overrides everything else:**
User explicitly chose **self-learning over hard pre-emptive rules**. Capabilities stay broad; when something goes wrong it gets noted in `learnings.md` (existing promotion path), not pre-empted by tighter scopes. This applies to permissions AND to behavioral guidance (no memory rules artificially restricting Claude's edit-targets either). Aligns with DEV_ETHOS rule "errors-should-teach" and impact-based-autonomy.

**Vraag 1 — DENY-lijst:**
- `curl *` kept in DENY but two specific allows added: `Bash(curl https://*.vercel.app/*)` + `Bash(curl https://*.supabase.co/*)`. Reason: health-checks against own deploys without prompting; `curl ... | sh` still blocked by dangerous-bash hook.
- `pnpm remove *` moved DENY → ALLOW (matches stack — pnpm-only). `npm/yarn/pip uninstall|remove` stay denied.
- `Read(.env.example)` added to ALLOW explicitly (was already implicitly allowed by `Read(*)` since none of the `.env*` denies match `.env.example`, but made intent visible).

**Vraag 2 — ALLOW-lijst tighter (key reversal mid-phase):**
- Initial proposal: remove `npm/yarn/bun run|test|install` to match conventions banned-pattern. User initially said "akoord" — applied.
- User then introduced self-learning principle: "niet beperkt wordt door te harde regels stellen". Reverted: all 9 npm/yarn/bun entries restored. Reason: pre-emptive removal violates the self-learning principle. If a Stack-Overflow-copy-paste with `npm install` runs and breaks something, that's a learnings.md entry, not a hard rule.
- `npx *` kept (industry standard for scaffolding).
- `*.json|toml|yaml|yml` kept broad (Biome + tsc + branch-guard catch most issues).
- `Edit(.claude/**)` kept broad (was the original trigger for the self-learning principle — user wanted Claude to be ABLE to edit settings.json/hooks, just self-correct via learnings if it goes wrong, instead of being scope-restricted).

**Vraag 3 — project-CLI's added (option A — broad wildcards):**
- **Supabase**: `Bash(supabase *)` — covers migration/db/gen-types/start-stop-status workflow from runbook
- **Vercel**: `Bash(vercel *)` — covers deploy/logs/env/link/dev
- **GitHub CLI**: `Bash(gh pr *)`, `Bash(gh issue *)`, `Bash(gh repo view*)`, `Bash(gh release *)`, `Bash(gh auth status)`. Deliberately scoped per-subcommand-group (not full `gh *`) so destructive `gh pr close *` / `gh issue close *` keep prompting — onomkeerbaar in the repo. `gh release create *` not in ALLOW either (publishes public tag — runbook chose no tags).
- **Sentry**: `Bash(sentry-cli *)` — release tracking + sourcemap uploads per ADR-0004
- **Biome / pnpm extras**: `Bash(biome *)`, `Bash(pnpm biome*)`, `Bash(pnpm tsc*)`, `Bash(pnpm exec *)`, `Bash(node *)`. Note: `pnpm tsc*` matches the pre-commit hook's `pnpm tsc --noEmit` so install-script verification doesn't prompt.
- **Git read-only extras**: `Bash(git remote *)`, `Bash(git tag --list*)`, `Bash(git config --get*)`, `Bash(git rev-list *)`. CLAUDE.md's session-start uses `git config --get core.hooksPath` for the install-warning.
- **Deliberately NOT in ALLOW**: `vercel rm *`, `vercel domains rm *`, `gh release create *`, `gh pr close *`, `gh issue close *`. They stay capable (not in DENY), but prompt per use.

**Decisions worth re-reading later:**
- The mid-phase reversal (npm/yarn/bun back) is a real example of how the self-learning principle conflicts with "match the stack tightly" — and self-learning won. If a future tailor round re-considers this, the trigger to re-tighten would be a real incident (e.g., `npm install` ran and corrupted node_modules in a pnpm workspace), not a "what if" concern.
- `supabase *` / `vercel *` full wildcards are the biggest trust-bet in this phase. `supabase db reset` for example will delete local DB without prompting. The mitigation isn't a tighter permission — it's that Claude reads its own intended command before executing, plus the impact-based-autonomy rule forces "propose first" for destructive operations regardless of permissions.
- The split on `gh` (some subcommands in ALLOW, others not) is the one place I broke the broad-wildcard pattern. Reason: `gh pr close` / `gh release create` are cheap to undo for myself (close it = re-open) but visible to the world (subscribers get notifications). The "self-learning" principle assumes errors are recoverable — public-facing actions break that assumption, so they keep the prompt.
- `Bash(curl https://*.vercel.app/*)` matches **any** Vercel deploy, not just yours. If you're testing against `someone-else.vercel.app` it still won't prompt. Trade-off: explicit vercel-app domains would need updating per app. Left broad for ergonomics; if it ever fires for a wrong target, that's a learnings.md note → tighter scope.

**Post-review fixes (same date, applied after self-audit):**
User asked for a second review. Spotted four issues:

1. **`Bash(gh release *)` was too broad** — matched `gh release create *` which contradicted the design (publishes public tag — should prompt). Replaced with `Bash(gh release view *)` + `Bash(gh release list *)` (read-only). `create`/`delete`/`edit` now prompt.
2. **`Bash(curl https://*.vercel.app/*)` + `Bash(curl https://*.supabase.co/*)` were dead allows** — Claude Code resolves DENY-over-ALLOW on conflict, so the broad `Bash(curl *)` deny would override the specific allows. Removed both allow-entries. Curl now always prompts (via the existing deny). Aligns better with self-learning principle anyway — no pre-emptive scoping.
3. **Inconsistent `*` spacing** — `Bash(pnpm tsc*)`, `Bash(pnpm biome*)`, `Bash(gh repo view*)`, `Bash(git tag --list*)`, `Bash(git config --get*)` had no space before `*`. Standardized all to `Bash(<cmd> *)` with space, matching the rest of the file. Permission-pattern matching may behave differently with vs without space — consistency wins.
4. **Edit-vs-Write asymmetry on root files** (pre-existed, not from this phase): `Edit(*.json|toml|yaml|yml)` allowed but `Write(*.json|toml|yaml|yml)` not. Added the four missing `Write` entries — Claude can now overwrite root configs (`package.json`, `tsconfig.json`, `biome.json`, `vercel.json`) without prompting, matching its already-allowed Edit capability.

**Final counts:** 94 allow / 44 deny. JSON re-validated.

### Phase 10 — Cron jobs (completed 2026-04-30)
Activated 4 of 6 cron jobs with a spread Monday schedule. JSON-equivalent validation: each YAML frontmatter still parses (verified by re-read after edit).

**Jobs activated (4 — all `notify: on_finish`, all root-level so they scan root + every `apps/*/`):**
- `weekly-dep-audit` — `mon 09:00` (no time/days change, only `active: false → true`). Security signal first; `[SILENT]` when no high/critical CVEs.
- `weekly-dep-update-check` — `mon 11:00` (was `10:00`, separated from audit by 2h). Lists major-version updates only; `[SILENT]` when no majors.
- `skill-update-check` — `mon 13:00` (was `weekdays 09:00`). Reduced 5x/week → 1x/week; catalog doesn't change daily, four extra runs were waste. `[SILENT]` when nothing new.
- `monthly-learnings-health` — `mon 15:00` (was `10:00`). Only first Monday of month produces a real report — other Mondays write `Not first Monday — skipping` + `[SILENT]`.

**Jobs left inactive (2 — `active: 'false'` retained, no other edits):**
- `weekly-activity-digest` — solo dev has no audience for a weekly digest, and the prompt body references `context/SOUL.md` (Agentic OS file, doesn't exist in App-Dev OS). Activating would fail the prompt unless that line is rewritten first.
- `weekly-stale-branches` — only useful with multiple feature branches simultaneously; solo dev workflow rarely has more than 1-2 active branches.

**Decisions per question:**
- **Q1 (which jobs):** user surfaced a sharp meta-question ("wat is het risico om nu al aan te zetten ook al heb ik er niks aan?"). Discussion covered notification fatigue, `[SILENT]`-flag mechanics, Anthropic-credit cost (~paar cent per run on haiku), and that the cron-daemon must be started before any job actually fires (so risk is dormant until `bash scripts/start-crons.sh`). Conclusion: 4 jobs aan, met de `[SILENT]`-flag als ruis-mitigatie en de 30-second `active: false` rollback als escape valve.
- **Q2 (schedule):** user koos "verspreiden maar wel op maandag". 2-uur tussenruimte (09/11/13/15). Tijdzone bevestigd door `scripts/start-crons.sh` te lezen → cron-daemon is een lokaal Node-proces (`projects/briefs/command-centre/scripts/cron-daemon.cjs`), gebruikt systeemtijd → 09:00 in YAML = 09:00 Amsterdam.
- **Q3 (notify):** `on_finish` voor alle 4. Werkt samen met `[SILENT]` als effectief "ping alleen wanneer er iets te doen is, ping altijd bij errors". `on_failure` zou actionable success (high CVE gevonden, nieuwe skill in catalog) stilhouden — ongewenst.

**Suggested follow-up:** run `bash scripts/start-crons.sh` to start the daemon. Until then, the 4 enabled jobs are configured but dormant.

**Decisions worth re-reading later:**
- The `weekly-activity-digest` references `context/SOUL.md` which is an Agentic OS artifact not present in App-Dev OS. If this job is ever activated, the prompt body needs an edit to drop or replace that reference (e.g., point at `context/DEV_ETHOS.md` instead).
- All 6 jobs use `[SILENT]` end-of-prompt logic. The `on_finish + [SILENT]` combo is a stronger signal than `on_failure` because it captures both errors AND meaningful successes (high CVE found = success technically, but actionable). Worth keeping in mind when adding new cron jobs: prefer `on_finish + [SILENT]` over `on_failure` for noise-controlled monitoring.
- Per-app inheritance: when `add-app.sh` creates `apps/{slug}/`, those apps don't inherit these specific cron jobs automatically — but the 4 enabled jobs are root-level and already loop over `apps/*/`. So no per-app duplication needed for dep-audit, dep-update-check, or stale-branches when those apps appear. `monthly-learnings-health` and `skill-update-check` are also root-only by design (template-level concerns).
- The `skill-update-check` daily → weekly downgrade is a small example of "don't run jobs more often than the underlying signal changes". The catalog is a versioned file that updates rarely; running it 5x/week was 4 wasted runs per week. Same pattern likely applies to future monitoring jobs — start at the lowest cadence that catches the signal in time.
