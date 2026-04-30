# /start-here

The onboarding entry point for first-time users of **App-Dev OS**.

## Guard

Check whether `code_context/` and `brand_context/` contain populated `.md` files (beyond the seed templates that ship with the install).
- **Both already filled** → respond "You're already set up. What are we building today?" and **stop**. Do not continue to any steps below.
- **At least one is empty/seed-only** → continue to First-Run Mode below.

**Skill selection check:** Read `.claude/skills/_catalog/installed.json`. If `selection_pending` is `true` (or the field is missing), the user hasn't chosen optional skills yet. Run Step 8 before finishing.

## Always (both modes)

Optionally write today's session-log per CLAUDE.md (secondary memory store; git log + ADRs + learnings.md is the primary). If the user wants a session log, append a `## Session — {HH:MM}` block to `context/memory/{YYYY-MM-DD}.md`.

---

## First-Run Mode

### Step 0: GitHub Backup Check

**Run this every session, before anything else.**

Check whether the user's data is backed up to their own GitHub repo:
1. First, check `.env` for `IS_TEMPLATE_MAINTAINER=true`. If set, **skip this step**.
2. Run `git remote -v` and inspect `origin`.
3. If `origin` contains the upstream template OR there is no `origin` at all → not configured.

**If not configured:**
> "Before we start — your code, app data, and learnings live locally right now. Let's back them up to a private GitHub repo."

Guide them:
- If `gh` is available and authed: `gh repo create my-app-dev-os --private --source=. --remote=origin`, rename old origin to `upstream`, push.
- Manual: create private repo on GitHub, then `git remote rename origin upstream && git remote add origin <url> && git push -u origin main` (or `dev`).

**If already configured:** skip silently.

### Step 1: Workspace Scan + Intro

Check what exists:
- `code_context/` files (which are populated, which are seed-only?)
- `brand_context/` files (relevant for apps with UI)
- `context/USER.md` (populated or template?)
- `.claude/skills/` (which skills are installed)
- `.git` (is this a git repo?)

**Detect if this is an app workspace:** Check if cwd is inside `apps/` (path contains `/apps/`). If so, read the local `AGENTS.md` for the app name from the `# App: {name}` header.

**App workspace intro (if inside apps/):**
- You're inside **{app name}**'s workspace — one of the apps managed by the parent App-Dev OS
- The parent at the root holds shared skills, methodology, and scripts
- Each app gets its own `code_context/`, `brand_context/`, memory, and outputs
- We're setting up **{app name}**'s code-conventions, architecture, runbook (and microcopy if it has UI)

**Standard intro (if NOT inside apps/):**
Brief explanation (4-6 sentences):
- App-Dev OS = Claude Code template for app-development (sister to Agentic OS for marketing)
- It learns your stack, conventions, architecture across sessions
- Memory lives in git log + ADRs + learnings.md (not a daily journal)
- We'll answer a few questions, then pick which skills to keep

End with the first question.

### Step 2: Core Questions (ONE AT A TIME)

Ask up to 4-5 questions sequentially. Wait for each answer.
**Skip any question whose answer was already given.**

**Question 1:** "What are you building? One sentence."
→ Wait for answer.

**Question 2:** "What's your stack? Languages, frameworks, package manager, test runner — name a few."
→ Wait. Captures `code_context/conventions.md` and `architecture.md` foundation.

**Question 3:** "Where does it deploy? Vercel / Fly / Railway / your own infra?"
→ Wait. Foundation for `code_context/runbook.md`.

**Question 4:** "Branch policy and deploy cadence — how do you ship? E.g. trunk-based, dev+main, gitflow. Continuous deploy or manual?"
→ Wait. Goes into `context/USER.md` § Working style.

**Question 5 (only if app has user-facing UI):** "Does this app have user-facing copy — error messages, onboarding, button labels? If yes: how should it sound?"
→ Wait. Foundation for `brand_context/voice-profile.md`. Skip for backend-only services.

Capture all answers. You'll use them to fill `code_context/`, `brand_context/` (if applicable), and `context/USER.md`.

### Step 3: Existing Repo Scan (Optional)

If we're inside a git repo with code already:

> "Want me to scan the existing code and propose draft `code_context/conventions.md` and `architecture.md` based on what you've built?"

If yes:
- Read `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` for stack
- List top-level `src/` structure
- Detect lint config, test runner, formatter
- Propose drafts; user reviews before save

If no: write minimal templates with answers from Step 2 only.

### Step 3b: Environment Check

Scan `.env.example` for documented API keys. Check which are configured in `.env`.

If any are missing, mention once (not as a blocker):
> "A few optional integrations are available. You can add to `.env` anytime:"
> - List relevant keys with one-line description per

If all present, skip silently.

### Step 4: Build code_context/ + brand_context/

Use answers from Steps 2-3 to populate:
- `code_context/conventions.md` — naming, lint, formatter, type system, file layout
- `code_context/architecture.md` — stack, components, data flow, key invariants
- `code_context/runbook.md` — environments, deploy, rollback, secrets
- `brand_context/voice-profile.md` — only if Q5 answered (app has UI-copy)

Skip `brand_context/positioning.md` and `icp.md` until they become relevant — these are optional for App-Dev OS.

### Step 5: Update context/USER.md

Populate based on answers:
- Stack preferences (languages, frameworks, package manager, test runner, lint, type system)
- Working style (testing style, code review depth, deploy cadence, branch policy)
- Risk posture (default to "low" if not stated)

### Step 6: Show Results

Show actual excerpts:

```
Here's what I built:

**Stack:** [from architecture.md]
**Conventions:** [naming + key banned patterns]
**Deploy:** [from runbook.md]

[If UI-copy:]
**Voice:** [excerpt from voice-profile.md]

Everything's saved in code_context/ and brand_context/. Skills load these lazily.
```

**IMPORTANT: Proceed to Step 7 in the SAME response.**

### Step 7: Skill Selection

Briefly explain skill categories for THIS stack:

```
Now let's pick which skills to keep. Default selection covers the basics — adjust if needed.

For a [stack] app:
- **code** — feature build, refactor, review
- **test** — unit, e2e, coverage audits
- **db** — migrations, schema design (if you have a DB)
- **infra** — Docker, CI pipeline (when you start)
- **sec** — secret scan, dep audit, threat model
- **deploy** — release, rollback, env-promotion
- **docs** — READMEs, ADRs, API reference

Foundation skills (always installed): meta-skill-creator, meta-wrap-up, ops-cron, mkt-brand-voice (for UI-copy).
```

Read `.claude/skills/_catalog/catalog.json` and list available optional skills as a numbered checklist. Wait for user's selection.

Run `python3 scripts/select-skills.py --remove "..."` based on their answer.

### Step 8: How It Works Primer

> "Quick orientation:
>
> **Memory** — git log + ADRs + `context/learnings.md` are where dev-knowledge lives. Daily memory file is secondary.
>
> **Branching** — `main`/`master` is hard-blocked for writes. Work on `dev` or `feature/*`.
>
> **Guards** — pre-commit hooks block secrets, dangerous bash, lockfile edits, and protect main/master. They're strict on purpose.
>
> **Skills** — say what you're building, I'll route to the right skill or tell you a skill is missing.
>
> **Multi-app** — say 'add an app' to spin up a sibling workspace. See `docs/multi-client-guide.md` (still applies — clients/ is now apps/).
>
> **Cron** — schedule recurring jobs (dep audits, etc.) via markdown files in `cron/jobs/`."

### Step 9: First Recommendation

ONE recommendation based on their context:
> "Given you're building [thing] on [stack], I'd start with [skill] — [reason]."

Do NOT present a menu. Recommend.

---

## Anti-Patterns

1. Never ask more than 5 questions before doing work
2. Never present all questions at once — ask one, wait, then ask the next
3. Never present a skill menu and ask them to pick a starting task — recommend
4. Never rebuild `code_context/` or `brand_context/` without explicitly asking first
5. Never give generic recommendations — tie them to the specific stack
6. Never silently produce generic output when context is missing — note the gap
7. Never use a hardcoded skill list — always scan `.claude/skills/` dynamically
8. Frame gaps as opportunities, not failures
