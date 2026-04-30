# AGENTS.md

Shared project instructions for **App-Dev OS**.

`AGENTS.md` is the canonical instruction file for this repository. Codex reads it directly. Claude Code reads it through `CLAUDE.md` via `@AGENTS.md`.

---

## What This Project Is

App-Dev OS is a Claude Code project template that turns Claude into an intelligent senior-engineer pair-programmer. It is **agent-first**: ethos lives in `context/DEV_ETHOS.md`, developer profile in `context/USER.md`, session continuity in `context/memory/`, accumulated learnings in `context/learnings.md`, app-microcopy in `brand_context/`, code-conventions/architecture/runbook in `code_context/`, and capabilities in `.claude/skills/`.

App-Dev OS is the **broer-template van Agentic OS**. Same proven foundation (skills, reconciliation, Context Matrix, lazy loading, markdown-only), different domain (app-development instead of marketing/sales). Web-development gets its own future template.

Claude is the primary runtime interface. `AGENTS.md` exists so the shared operating rules also work cleanly in Codex and other tools that support the standard file.

---

## Operating Rules

### Skill & MCP Reconciliation

Compare what is on disk against what is registered in this file. Fix additions silently. Confirm removals with the user.

**Skills — compare `.claude/skills/` folders vs the Skill Registry and Context Matrix tables in `AGENTS.md`:**

1. **New skill on disk, not in AGENTS.md?**
   - Read its YAML frontmatter and full `SKILL.md`
   - Add a row to the **Skill Registry**
   - Add a row to the **Context Matrix**
   - Add a `## {folder-name}` section to `context/learnings.md`
   - Add the skill to README skill tables and the file structure diagram
   - Scan for external service dependencies
   - Tell the user: "Registered `{skill-name}` — added to AGENTS.md, README.md, and context/learnings.md."

2. **Skill in AGENTS.md but folder missing from disk?**
   - Ask the user: "`{skill-name}` is registered in AGENTS.md but the folder is gone. Remove it from AGENTS.md, README.md, and context/learnings.md?"

**MCPs — compare `.claude/settings.json` MCP server entries vs README documentation:**

3. **New MCP server in settings.json or `.mcp.json`, not documented?**
   - Add it to README.md under a Connected Tools section
   - Tell the user what was added

4. **Documented MCP removed?**
   - Ask the user: "`{mcp-name}` is documented but no longer configured. Remove it from README.md?"

### Task Routing

When the user asks a question or requests a task:
1. Check **Built-in Operations** first. If it matches, execute directly.
2. Search installed skills by checking `.claude/skills/` frontmatter for a matching skill.
3. If a skill exists, invoke it. Always prefer the dedicated skill over base knowledge.
4. If no skill matches, say so explicitly and offer either:
   - Find or build a skill so the system handles the task well every time
   - Handle it now with base knowledge

Never silently fall back to base knowledge when a skill exists. Never silently handle a task without making the skill gap explicit.

### Built-in Operations

| User says | Action |
|-----------|--------|
| "tailor the template", "optimize for my stack", "customize app-dev-os", "make this fit my project", "deeply tailor" | Run `/tailor-os` slash command |
| "add an app", "new app", "set up an app" | Run `bash scripts/add-app.sh "{name}"` |
| "remove a skill", "uninstall {skill}" | Run `bash scripts/remove-skill.sh {skill-name}` |
| "add a skill", "install {skill}" | Run `bash scripts/add-skill.sh {skill-name}` |
| "list skills", "what skills are installed" | Run `bash scripts/list-skills.sh` |
| "start crons", "start scheduled jobs" | Run `bash scripts/start-crons.sh` |
| "stop crons", "stop scheduled jobs" | Run `bash scripts/stop-crons.sh` |
| "cron status" | Run `bash scripts/status-crons.sh` |
| "cron logs" | Run `bash scripts/logs-crons.sh` |

### Add App Flow

When the user asks to add an app:
1. Ask for the app name if it was not provided.
2. Run `bash scripts/add-app.sh "{name}"`.
3. Explain the resulting structure:
   - `apps/{slug}/AGENTS.md` stores app-specific instructions
   - `apps/{slug}/CLAUDE.md` imports the app `AGENTS.md` for Claude Code
   - `apps/{slug}/brand_context/` for in-app microcopy (UI, errors, onboarding)
   - `apps/{slug}/code_context/` for conventions, architecture, runbook
   - `apps/{slug}/{context,projects,cron}/` stay app-specific
   - Skills, scripts, and shared methodology stay rooted at the main install
4. Tell them how to switch:
   - `cd {absolute path}/apps/{slug} && claude`

### Branching Policy

| Zone | Paths | On `dev` | On `feature/*` |
|------|-------|----------|----------------|
| **Code** | `src/**`, `tests/**`, runtime JS/TS/Py | Strong nudge: use `/new-feature` | Commit directly |
| **Config** | `.claude/skills/*/SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `.env.example`, `scripts/*.sh`, `.claude/settings.json` | Advisory: consider feature branch | Commit directly |
| **Context** | `code_context/`, `brand_context/`, `context/`, `cron/jobs/`, `apps/*/`, `projects/` | Commit directly | Commit directly |

**`main` and `master` are HARD-BLOCKED for writes/commits/pushes** by `branch-guard.js` hook. Force pushes denied by permissions. CI required to merge.

**`dev` is the working branch.** Feature branches merge back to `dev`, then `dev` is promoted to `main` via PR.

### Before Major Deliverables

- Load the relevant `code_context/` and (if UI-copy involved) `brand_context/` files per the Context Matrix below
- Check `context/learnings.md` for the current skill's section
- Run lint + typecheck + tests before declaring done

### After Major Deliverables

- Ask: "Shipped clean? Any gotchas?"
- Log feedback to `context/learnings.md` under the skill's section
- If gaps were spotted, mention once with opportunity framing

---

## Multi-App Architecture

App-Dev OS supports multiple apps from a single install. The root folder holds shared methodology, shared skills, and shared scripts. Each app gets a subfolder under `apps/` with its own `brand_context/`, `code_context/`, memory, projects, and learnings.

```text
app-dev-os/
├── AGENTS.md                     <- canonical shared methodology
├── CLAUDE.md                     <- Claude wrapper that imports AGENTS.md
├── apps/
│   ├── my-app/
│   │   ├── AGENTS.md             <- app-specific instructions
│   │   ├── CLAUDE.md             <- Claude wrapper importing local AGENTS.md
│   │   ├── brand_context/        <- UI-copy / microcopy / app-stem
│   │   ├── code_context/         <- conventions / architecture / runbook
│   │   ├── context/
│   │   ├── projects/
│   │   └── .claude/skills/
│   └── another-app/
│       └── ...
├── brand_context/                <- root: template microcopy
├── code_context/                 <- root: template conventions
├── context/
└── .claude/skills/
```

- `bash scripts/add-app.sh "App Name"` creates the app workspace
- Each app has its own `brand_context/`, `code_context/`, `context/memory/`, `context/learnings.md`, `USER.md`, `projects/`, and `cron/jobs/`
- One managed cron runtime per workspace schedules root + every `apps/*` job
- Shared skills are edited at root level; app-only skills live in that app's `.claude/skills/`

---

## Three-Layer Architecture

| Layer | Files | Purpose |
|-------|-------|---------|
| **Agent Identity** | `AGENTS.md`, `CLAUDE.md`, `context/DEV_ETHOS.md`, `context/USER.md` | Shared operating rules + Claude-specific runtime |
| **Skills Pack** | `.claude/skills/{category}-{name}/` | Capabilities that grow over time |
| **Context (two-layer)** | `code_context/` + `brand_context/` | Code conventions/architecture/runbook **+** UI-copy/microcopy |
| **Memory (three-source)** | `git log` + `ADR/` + `context/learnings.md` | Audit trail + immutable decisions + skill/phase learnings |

`.env`, `.mcp.json`, user data dirs (`context/memory/`, `projects/`, `brand_context/*.md`, `code_context/*.md`) are gitignored.

---

## Memory model (dev-specific)

App-Dev OS keeps memory in **three authoritative sources**, not in a daily journal:

1. **`git log` + commit messages** — the actual audit trail of *what changed when*. Use `git log --oneline`, `git blame`, `git show` instead of re-reading old session notes.
2. **`ADR/000X-*.md`** — immutable architecture decisions with reasoning. Never edit; supersede with new ADR (`0042-supersedes-0017.md`).
3. **`context/learnings.md`** — split into three sections:
   - `# General` — cross-skill insights
   - `# Per Phase` — lessons extracted at end of each GSD phase
   - `# Per Skill (category)` — feedback per skill, exact pattern from Agentic OS

`context/memory/{date}.md` exists as folder/mechanism for compatibility with Agentic OS skills (`meta-wrap-up`, etc.) but is **not the canonical memory store** for dev. Skills should read git log + ADRs + learnings.md before reaching for daily memory files.

**Why this is different from Agentic OS:** code has structured audit trails (commits, PRs, ADRs) that don't exist in marketing work. Marketing needs the daily journal because outputs aren't versioned in git. Code is.

---

## Skill Categories

Every skill and its output folder uses a category prefix.

| Prefix | Domain | Examples |
|--------|--------|----------|
| `code` | Feature implementation, refactor, review | `code-feature-build`, `code-refactor`, `code-review` |
| `test` | Unit, e2e, coverage | `test-write-unit`, `test-e2e-playwright`, `test-coverage-audit` |
| `db` | Schema, migrations, queries | `db-migration`, `db-schema-design`, `db-query-tune` |
| `infra` | IaC, containers, CI | `infra-dockerize`, `infra-ci-pipeline` |
| `sec` | Secrets, deps, threat model | `sec-secret-scan`, `sec-dep-audit`, `sec-threat-model` |
| `deploy` | Release, rollback, env-promotion | `deploy-release`, `deploy-rollback` |
| `docs` | Code docs, ADRs, READMEs | `docs-readme`, `docs-adr`, `docs-api-reference` |
| `ops` | Repo automation, branching | `ops-new-feature`, `ops-release`, `ops-cron` |
| `meta` | System / meta | `meta-skill-creator`, `meta-wrap-up` |
| `tool` | Utility / integration | `tool-github`, `tool-sentry` |
| `mkt` | App microcopy (kept for in-app text) | `mkt-brand-voice` |

**Rules:**
- Skill folder name = `{category}-{name}` in kebab-case
- YAML frontmatter `name` field must match the folder name exactly
- Output folders use the same category prefix: `projects/{category}-{type}/`
- Learnings sections in `context/learnings.md` use `## {folder-name}`

---

## Skill Registry

### Meta Skills

| Skill | Triggers on |
|-------|-------------|
| `meta-skill-creator` | "create a skill", "build a skill", "new skill", "make a skill" |
| `meta-wrap-up` | "wrap up", "close session", "end session", "we're done" |

### Code Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `code-feature-build` | "build a feature", "implement", "add new endpoint", "create component for", "ship a feature" | `src/**`, `tests/**`, `code_context/architecture.md` (when shape shifts) |
| `code-review` | "review this", "code review", "check this PR", "spot bugs", "lgtm?" | inline PR comments or `REVIEW.md` |

### Test Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `test-write-unit` | "write a test", "add tests for", "unit test this", "TDD this" | `tests/**` |

### Documentation Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `docs-adr` | "write an ADR", "log a decision", "this needs an ADR", "promote this to an ADR", "supersede ADR-XXXX", "architecture decision" | `ADR/{NNNN}-{slug}.md`, `context/learnings.md` § ADRs Index, `code_context/architecture.md` § ADR-equivalent (promote mode only) |

### Microcopy Skills (kept from Agentic OS for in-app text)

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `mkt-brand-voice` | "brand voice", "writing style", "in-app voice", "microcopy tone", "how should errors sound" | `brand_context/voice-profile.md`, `brand_context/samples.md` |

### Operations Skills

| Skill | Triggers on |
|-------|-------------|
| `ops-cron` | "schedule a job", "cron job", "automate daily", "recurring task", "list jobs", "start crons", "stop crons" |
| `ops-new-feature` (when added) | "new feature", "start feature", "merge feature", "feature done" |
| `ops-release` (when added) | "release", "cut a release", "bump version", "ship it" |

*Optional skills are auto-registered by reconciliation when their folders appear on disk. Install with `bash scripts/add-skill.sh <name>`.*

---

## Context Matrix

Load only the listed files for each skill. **Six columns** — three from `brand_context/` (UI-copy), three from `code_context/` (code).

| Skill | voice-profile | positioning | icp | conventions | architecture | runbook | learnings |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `code-feature-build` | tone-only* | — | — | full | full | summary | `## code-feature-build` |
| `code-review` | — | — | — | full | summary | — | `## code-review` |
| `test-write-unit` | — | — | — | tone-only | summary | — | `## test-write-unit` |
| `mkt-brand-voice` | **writes** | summary | — | — | — | — | `## mkt-brand-voice` |
| `docs-adr` | — | — | — | tone-only | full (§ ADR-equivalent) | — | `## docs-adr` |
| `meta-skill-creator` | — | — | — | tone-only | summary | — | `## meta-skill-creator` |
| `meta-wrap-up` | — | — | — | — | — | — | `## meta-wrap-up` |
| `ops-cron` | — | — | — | — | — | summary | `## ops-cron` |

*tone-only on voice-profile = load only when the skill produces UI-copy strings (error messages, button labels). Pure backend code skips it.*

**Matrix key:** `writes` = creates file | `full` = entire file | `summary` = 1-2 sentences | `tone-only` = tone + vocabulary | `— ` = skip | `## skill-name` = read only that section from `context/learnings.md`

**Learnings rule:** Every skill reads and writes to its own section in `context/learnings.md`. Cross-skill insights go under `# General`. Skill-specific entries go under `# Individual Skills` → `## {folder-name}`.

---

## Output Standards

- **Single tasks (Level 1):** Save to `projects/{category}-{type}/`
- **Planned/GSD projects (Level 2/3):** Save all outputs inside `projects/briefs/{project-name}/`
- Filename format: `{YYYY-MM-DD}_{descriptive-name}.{ext}`
- Folders are created on first use by the skill
- After major deliverables: ask for feedback and log to `context/learnings.md`

### Projects

| Level | Name | When | Where |
|-------|------|------|-------|
| **1** | Single task | Ad-hoc fix, oneliner script, single PR | `projects/{category}-{type}/` |
| **2** | Planned project | Feature with multi-deliverable scope | `projects/briefs/{project-name}/` (with `brief.md`) |
| **3** | GSD project | Complex multi-phase build with dependencies | `projects/briefs/{project-name}/` + `.planning/` |

**Level 3 rule:** Each Level 3 project owns its own `.planning/` inside `projects/briefs/{slug}/`. Multiple GSD projects can be active in parallel across different apps.

**Project containment:** The App-Dev OS root is the operating system, not a place for project source code. App source lives inside `apps/{slug}/` or in a separate repo entirely.

### No Humanizer Gate

Unlike Agentic OS, App-Dev OS does **not** apply a humanizer-gate to outputs. Code, tests, docs, and ADRs go through `lint`, `typecheck`, and `tests` as their gates instead. The humanizer would saboteer technical text.

For UI-copy / microcopy in `brand_context/`, the user can manually invoke `mkt-brand-voice` to refine tone — but no automatic post-processor.

---

## Building New Skills

Always ask for reference skills first. Never guess at methodology.

### Skill structure

```text
.claude/skills/{category}-{name}/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

### YAML frontmatter rules

- `name` (required, exact folder match)
- `description` (required, ≤1024 chars, includes triggers + negative-triggers)
- Extra fields (`allowed-tools`, `model`, `agent`, etc.) only when concretely needed — not as default checklist
- About 100 words for description, under 1024 characters total

### Skill Dependencies

Declare dependencies in a `## Dependencies` section in `SKILL.md`.

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| Example | Optional | … | Fallback … |

**Rules:**
- Required dependencies must be installed for the skill to function
- Optional dependencies must declare their fallback
- Utility (`tool-`) skills never depend on execution skills

### Registration checklist

- [ ] Folder name matches `{category}-{name}`
- [ ] Frontmatter `name` matches the folder name exactly
- [ ] Add the skill to the Skill Registry above
- [ ] Add a row to the Context Matrix above
- [ ] Frontmatter stays under 1024 chars
- [ ] `SKILL.md` stays under 200 lines
- [ ] References are self-contained
- [ ] Output folders use the same category prefix
- [ ] External services are registered in `AGENTS.md`, `.env.example`, and README.md

---

## Graceful Degradation

Skills work at all context levels:
- **No `code_context/`:** ask what's needed, produce solid generic output, suggest building it
- **No `brand_context/`:** if UI-copy needed, ask once how to sound; otherwise skip
- **Partial context:** use what exists, default the rest
- **Full context:** personalise fully

Context enhances output. It never gates functionality.

---

## External Services & API Keys

Some skills use external services for enhanced functionality. API keys are stored in `.env` (gitignored). `.env.example` documents available keys.

### Service Registry

| Service | API Key | Used by | What it enables | Without it |
|---------|---------|---------|-----------------|------------|
| _Add as skills with external dependencies are installed_ | | | | |

### Rules for Skills Using External Services

1. Check for the required key before using any external API
2. Tell the user clearly what the service does, what they lose without it, where to sign up, where to put the key
3. Always define a fallback whenever possible
4. Do not block work when the fallback produces usable output
5. Update `.env.example` when adding a new external service

---

## Permissions

`.claude/settings.json` is broad-by-default with hard blocks only for destructive/irreversible actions. **Design principle: self-learning over pre-emptive scoping** — capabilities stay broad; mistakes get logged in `context/learnings.md` § General instead of being pre-empted by tighter scope. Functional spec decisions (stack, conventions, architecture invariants, ADRs, voice rules) are *not* subject to this principle and remain authoritative.

**Allowed without prompt:**
- Package managers — pnpm primary (`pnpm run|test|install|remove|dlx|exec|tsc|biome`), npm/yarn/bun also kept for self-learning ergonomics
- Project CLIs — `supabase *`, `vercel *`, `gh pr|issue|repo view|release view|release list|auth status`, `sentry-cli *`
- Build tooling — `biome *`, `node *`, `npx *`
- Test runners — `pytest`, `python -m pytest`, `go test|build|run`, `uv run`, `poetry run`
- Git read+commit ops + read-only extras (`remote`, `tag --list`, `config --get`, `rev-list`)
- `Read(*)` (with sensitive denies below) + `Read(.env.example)` explicit
- `Edit`/`Write` scoped to project paths (incl. `.claude/**` for skill/hook self-modification, root `*.md|json|toml|yaml|yml`)

**Hard-denied:**
- Destructive: `rm -rf` (root/home/cwd/dot), `git push --force`, push to `main/master/production`, `git reset --hard origin/main|master`, `chmod 777 *`
- Package uninstalls: `npm/yarn/pip uninstall|remove` (note: `pnpm remove *` IS allowed)
- Network: `curl *`, `wget *`, `ssh *`, `scp *` (read/write goes via SDK, not raw HTTP)
- Secrets: `Read`/`Edit`/`Write` of `.env`, `.env.local`, `.env.production`, `.env.development.local`, `.env.test.local`, anything matching `**/secrets/**`, `*credential*`, `*.pem|key|p12|pfx`
- Lockfile direct edits: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `poetry.lock`, `uv.lock`, `Cargo.lock` (use `pnpm install` instead)

**Deliberately not in ALLOW (prompts but not blocked):**
- `gh release create|delete`, `gh pr close`, `gh issue close` — onomkeerbaar én extern-zichtbaar
- `vercel rm *`, `vercel domains rm *` — verwijdert deploys/domains
- General `git push *` (only the destructive variants are denied; ordinary push prompts)

Hooks add behavioural guards on top of permissions:
- `branch-guard.js` — BLOCKS writes/commits/pushes on `main`/`master`/`production`
- `secret-scan.js` — BLOCKS secrets in file content or bash commands
- `dangerous-bash.js` — BLOCKS high-blast-radius commands (verifies `supabase db reset` does NOT trigger — only `git reset --hard` literal does)
- `lockfile-guard.js` — BLOCKS direct edits to lockfiles
- `typecheck-guard.js` — Advisory at edit-time; commit-time strict gate via `scripts/git-hooks/pre-commit` (one-time install via `bash scripts/install-git-hooks.sh`). Edit-time block via `TYPECHECK_GUARD_BLOCK=1` env var if friction emerges.
