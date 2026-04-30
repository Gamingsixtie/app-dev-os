# CLAUDE.md

This file keeps Claude Code compatible with the shared `AGENTS.md` guidance and adds Claude-only runtime behavior for **App-Dev OS**.

@AGENTS.md

---

## Claude Runtime

### Session Type Detection

Scan `code_context/` and `brand_context/` for populated `.md` files (ls, not read).
- **Both empty** → first-run → run `/start-here`
- **At least one populated** → returning mode → silent startup (below)

### Returning Mode (silent — zero output)

Do these steps silently. Do NOT output anything — no greeting, no recap, no capabilities list.

1. Read `context/DEV_ETHOS.md` (~3 KB). Fall back to `../../context/DEV_ETHOS.md` if not in the current folder.
2. Read `context/USER.md` (~1.5 KB). Fall back to `../../context/USER.md`.
3. Scan `.claude/skills/` silently (ls only).
4. **If a previous session left a memory block today**, read it for `### Open threads`. Otherwise skip — daily memory is not the canonical memory store for dev (see Memory Model below).

**What NOT to do at startup (deferred to wrap-up or on-demand):**
- Do NOT read `code_context/` or `brand_context/` files — skills lazy-load per Context Matrix
- Do NOT read `context/learnings.md` in full — only the relevant section per skill
- Do NOT read `git log` proactively — pull when relevant
- Do NOT read ADRs proactively — load when architecture is in scope
- Do NOT run reconciliation — deferred to wrap-up
- Do NOT check cron dispatcher status — only if user asks
- Do NOT auto-run `/start-here`
- Do NOT output anything

**GitHub backup check (once per day):** Only on the first session of the day. First check `.env` for `IS_TEMPLATE_MAINTAINER=true` — if set, skip entirely. Otherwise, if `origin` still points to the upstream template repo, warn once. Otherwise silent.

**Git hooks check (once per session):** If `git rev-parse --is-inside-work-tree` succeeds AND `scripts/git-hooks/pre-commit` exists AND `git config --get core.hooksPath` is empty (or not `scripts/git-hooks`), warn once visibly:

> ⚠️ Git hooks niet geïnstalleerd. Run één keer: `bash scripts/install-git-hooks.sh` — dit activeert de pre-commit typecheck guard die `pnpm tsc --noEmit` draait vóór elke commit.

Otherwise silent. This is the only "loud" startup check besides the GitHub backup one — both fire only when something is actually wrong.

### Greeting Behaviour

- Don't greet proactively — wait for the user to speak
- If the user greets casually and there are recent uncommitted changes (`git status`) or open threads from the most recent memory, mention them in one line
- If the user states a task, begin immediately — no preamble, no scope prompt

### Checkpoint Behaviour

After completing a major deliverable (commit pushed, feature merged, skill built/modified, ADR added), ask: "Shipped clean? Any gotchas?"

Don't checkpoint quick answers, research, or small edits.

---

## Memory Model

Memory lives in **three authoritative sources**, not in a daily journal:

1. **`git log` + commit messages** — actual audit trail of what changed when. Pull via `git log --oneline -20`, `git blame`, `git show <sha>` rather than re-reading old session notes.
2. **`ADR/000X-*.md`** — immutable architecture decisions. Read when architecture is in scope. Never edit; supersede with a new ADR.
3. **`context/learnings.md`** — split sections:
   - `# General` (cross-skill insights)
   - `# Per Phase` (lessons at end of each GSD phase)
   - `# Per Skill (category)` (per-skill feedback, Agentic OS pattern)

**Daily memory file (`context/memory/{YYYY-MM-DD}.md`):** still maintained for compatibility with Agentic OS skills (e.g., `meta-wrap-up`), but **secondary**. Use it for transient session-state, not as long-term memory. For dev, prefer git log + ADRs + learnings.md.

### Auto-Tracking (silent — never announce)

Track these events as they happen during the session. Never say "I've logged that to memory."

- File created/modified in `src/`, `tests/`, `docs/` → no logging needed (git tracks it)
- ADR created in `ADR/` → log entry in `context/learnings.md` § ADRs Index
- Skill created/modified in `.claude/skills/` → reconciliation registers it in AGENTS.md
- User makes a directional decision worth keeping → propose adding to:
  - `code_context/conventions.md` if it's a code convention
  - `code_context/architecture.md` § ADR-equivalent if it's an architecture decision
  - `ADR/{NNNN}-{slug}.md` if it warrants a full ADR
  - `context/learnings.md` § General if it's a cross-skill insight
- Phase closes → run `gsd-extract-learnings` to populate `context/learnings.md` § Per Phase

### Session End

- Detect common sign-off messages and run the full `meta-wrap-up` skill automatically
- `meta-wrap-up` consolidates: feedback into learnings.md, gotchas into appropriate spot per promotion path, and offers ADRs for any architecture decisions made in the session
- Keep entries concise and skimmable

---

## Promotion path for learnings

```
Tijdens coderen ontdekt:
  ↓ "dit is een gotcha"
context/learnings.md (per-skill section, # Per Skill)
  ↓ blijkt herhaald patroon
docs/gotchas.md (categorieën, optioneel)
  ↓ wordt project-norm
code_context/conventions.md (afdwingbare regel)
  ↓ raakt architectuur
ADR/{NNNN}-*.md (immutable beslissing met alternatieven + reden)
```

Niet elke learning hoeft door alle stappen — maar dit is het pad als 'm zwaarder wordt.
