# /tailor-os

Interactive walkthrough to optimize App-Dev OS for **THIS** user's stack, workflow, and risk posture. Walks through every layer of the template, asks deep questions per layer, and edits files inline.

## When to run

- After first-run `/start-here` when you want to deeply tailor
- Anytime the template no longer matches your reality
- After joining a new project where the stack/conventions are different
- **Resumable** — progress tracked in `.planning/tailor-state.md`

## Pattern (per layer)

For every layer, follow this strict 3-question pattern. Don't skip questions even if answers seem obvious — surfacing them is the point.

1. **"Are these the right items?"** — read what's there, present, ask
2. **"Does what's in the doc match what we need?"** — surface mismatches with the user's reality
3. **"Or shall we optimize?"** — propose specific edits, get approval, apply

Apply edits via Edit/Write only after explicit user approval. Never silently overwrite.

---

## State

On invocation:
1. Check `.planning/tailor-state.md`. If absent, create with all phases marked `pending`.
2. Find first `in_progress` or `pending` phase. Resume from there.
3. After each phase: mark `completed`, save state, then ask "continue with next phase or pause?"

State format:
```yaml
project: app-dev-os-tailoring
status: in_progress
created: {YYYY-MM-DD}
phases:
  1_dev_ethos: pending|in_progress|completed
  2_user_profile: pending|in_progress|completed
  3_conventions: pending|in_progress|completed
  4_architecture: pending|in_progress|completed
  5_runbook: pending|in_progress|completed
  6_brand_context: pending|in_progress|completed|skipped
  7_skills: pending|in_progress|completed
  8_hooks: pending|in_progress|completed
  9_permissions: pending|in_progress|completed
  10_cron_jobs: pending|in_progress|completed
```

---

## Phase 1 — DEV_ETHOS

**Read:** `context/DEV_ETHOS.md`

**Present:** show all Core Truths, Behaviour Rules, Boundaries verbatim.

**3-question pattern:**
1. "Of these Core Truths, which actually describe how you work? Which feel generic or wrong for you?"
2. "What's missing — engineering principles you live by that aren't here?"
3. "Of these Behaviour Rules — which are negotiable for you (max 4 questions, never push to main, etc.)?"

**Apply:** edit `context/DEV_ETHOS.md` per agreement. Save.

---

## Phase 2 — USER profile

**Read:** `context/USER.md`

**Present:** show empty/placeholder fields.

**Sequential questions (one at a time):**
1. Stack: language + framework + package manager + test runner + lint+format + type system + DB/ORM + hosting
2. Working style: testing-style (TDD/BDD/after-the-fact/none), code-review depth (skim/standard/paranoid), deploy cadence (continuous/weekly/on-tag), branch policy, PR-size preference, commit-style
3. Risk posture: production blast radius tolerance (low/med/high), allowed destructive commands, force-push allowed where, secrets handling
4. Communication: verbosity, code-in-answers preference, questions tolerance

**Apply:** fill `context/USER.md` based on answers. Confirm before save.

---

## Phase 3 — code_context/conventions.md

**Read:** `code_context/conventions.md`

**Present:** sections currently filled vs placeholder.

**3-question pattern:**
1. "What's wrong or generic in this conventions file for YOUR stack?"
2. "What's missing? Naming patterns, banned patterns, project-specific idioms?"
3. "Which sections are irrelevant for your stack and should be removed?"

**Bonus (if existing repo):** offer to scan `package.json` / `pyproject.toml` / `eslint.config.*` and propose draft sections from real config.

**Apply:** rewrite/edit per agreement. Save.

---

## Phase 4 — code_context/architecture.md

**Read:** `code_context/architecture.md`

**Present:** stack table + components list + data flow + invariants.

**3-question pattern:**
1. "Of the components listed, which are real in your project? Which are missing?"
2. "What invariants does your codebase enforce that aren't here?"
3. "Stack table — what's actually used vs placeholder?"

**Apply:** rewrite per real architecture. Save.

---

## Phase 5 — code_context/runbook.md

**Read:** `code_context/runbook.md`

**Present:** environments + deploy + rollback + secrets + on-call sections.

**3-question pattern:**
1. "Environments table — which envs do you actually have? Real URLs?"
2. "Deploy + rollback procedures — does this match what you actually do?"
3. "On-call + observability — relevant for this project, or skip?"

**Apply:** edit. Save.

---

## Phase 6 — brand_context/ (conditional)

**Pre-question:** "Does this app have user-facing UI — error messages, onboarding, button labels?"

- **No** → mark phase as `skipped`. Continue to phase 7.
- **Yes** → continue.

**Read:** `brand_context/voice-profile.md` + `samples.md`. (Skip positioning + icp unless user explicitly wants them.)

**3-question pattern (voice-profile):**
1. "Tone settings — which match how the app should sound? Which are off?"
2. "Words you USE / AVOID — what's missing for your product?"
3. "Error-message style examples — fit your voice or rewrite?"

**Apply:** edit voice-profile.md + samples.md. Save. Mark `completed`.

---

## Phase 7 — Skills selection

**Read:** `.claude/skills/` (folder list).

**Present:**
- Currently installed: meta-skill-creator, meta-wrap-up, mkt-brand-voice, ops-cron, code-feature-build, code-review, test-write-unit
- Available to add per `.claude/skills/_catalog/catalog.json`

**3-question pattern:**
1. "Of foundation skills installed — which actually fit your work? Any to remove?"
2. "Which categories do you need from db/infra/sec/deploy/docs? List 2-3 skills per chosen category."
3. "Any skill that DOESN'T exist yet that you wish did? Build with meta-skill-creator."

**Apply:**
- Remove unwanted: `bash scripts/remove-skill.sh {name}`
- Add wanted (if catalog): `bash scripts/add-skill.sh {name}`
- Build new: invoke `meta-skill-creator` skill, return to this phase after.

Update `AGENTS.md` Skill Registry + Context Matrix per change. Reconciliation should auto-handle most of this — verify.

---

## Phase 8 — Hooks

**Read:** `.claude/settings.json` hooks block + actual hook files in `.claude/hooks/`.

**Present:**
- 4 dev-foundation hooks (secret-scan, dangerous-bash, lockfile-guard, typecheck-guard)
- branch-guard set to BLOCK on main/master
- gsd-* + session-sync* + run-ccnotify (inherited)

**3-question pattern:**
1. "branch-guard blocks writes/commits/pushes on main/master — keep strict or downgrade to advisory?"
2. "secret-scan + dangerous-bash + lockfile-guard — any false positives expected in your workflow? (project-specific lockfile-edits, unusual deploy scripts, etc.)"
3. "typecheck-guard is advisory by default — escalate to block via `TYPECHECK_GUARD_BLOCK=1` env var?"

**Apply:** edit hook source or settings.json registration as needed.

---

## Phase 9 — Permissions

**Read:** `.claude/settings.json` permissions block (allow + deny).

**Present:** counts + scoped patterns.

**3-question pattern:**
1. "Anything in DENY that you actually need to do regularly? (e.g., curl for a specific health check, npm uninstall for cleanup)"
2. "Anything in ALLOW that should be tighter for this project? (e.g., scope Edit to specific subdirs only)"
3. "Project-specific Bash commands that should be allowed without prompting? (custom scripts, build tools, etc.)"

**Apply:** edit `.claude/settings.json`. Validate JSON parses.

---

## Phase 10 — Cron jobs

**Read:** `cron/jobs/*.md`. All currently `active: 'false'`.

**Present:** 6 jobs:
- `monthly-learnings-health` (inherited)
- `weekly-activity-digest` (inherited)
- `skill-update-check` (inherited)
- `weekly-dep-audit` (dev)
- `weekly-dep-update-check` (dev)
- `weekly-stale-branches` (dev)

**3-question pattern:**
1. "Which jobs should run for you? Which are useful for your workflow?"
2. "What schedule for each — time + days? (consider your timezone, working hours)"
3. "Notification preference per job: on_finish (default), on_failure (errors only), silent?"

**Apply:** edit each chosen job's frontmatter (`active: 'true'`, `time:`, `days:`, `notify:`). Suggest `bash scripts/start-crons.sh` to start daemon.

---

## Wrap-up

After all 10 phases:

1. Show summary diff: "Here's what changed in this tailoring session" (list of edited files).
2. Ask: "Commit these changes? Suggested message: `chore: tailor App-Dev OS template to {project-name}`"
3. If yes, run `git add` + `git commit` (will respect branch-guard — must be on dev or feature branch).
4. Update `context/learnings.md` § General with **3 most surprising tailoring decisions** for future reference.
5. Update `.planning/tailor-state.md` to `status: completed`.
6. Final message: "Template tailored. Run `/start-here` again anytime, or re-run `/tailor-os` if your project shifts."

---

## Anti-patterns

1. **Don't dump all questions at once** — sequential, one phase at a time, one question at a time within a phase
2. **Don't auto-edit without confirmation** — always show proposed edit, get explicit yes
3. **Don't skip the 3-question pattern** even if user seems sure — the structure surfaces things they didn't think about
4. **Don't proceed past a phase** until file is saved + state updated
5. **Don't lose progress** — `.planning/tailor-state.md` updates after every phase
6. **Don't forget to ask "continue or pause?"** between phases — long sessions burn out
7. **Don't recommend a skill / hook / setting that contradicts USER.md risk posture** — re-read USER.md if in doubt
