# Skill Quality Plan — refactor backlog

> Generated 2026-05-01 during Phase 5 of `/tailor-os` per-app round for `concurrentoolVO`. Source: methodology audit of 5 skills imported from upstream rekentool repo.

---

## TL;DR

4 skills migrated from `apps/concurrentoolVO/skills/` (wrong location, no category prefix) to `.claude/skills/` (root, with App-Dev OS conventions applied to naming). Their **internal structure still violates** meta-skill-creator standards (canonical sections missing, oversized SKILL.md, no negative-triggers, no output paths).

**Decision**: do NOT refactor proactively. Trigger refactor per skill only when **evidence of use** appears.

---

## Status of all 5 imported skills

| Skill | Old location | New location | Refactor needed? |
|---|---|---|---|
| `ops-competitor-intel` | `apps/concurrentoolVO/.claude/skills/ops-competitor-intel/` | _unchanged — already correct_ | **No.** Methodologically sound. |
| `frontend-design` | `apps/concurrentoolVO/skills/frontend-design/` | `.claude/skills/code-frontend-design/` | **Yes — minor (~30 min)** |
| `interface-design` | `apps/concurrentoolVO/skills/interface-design/` | `.claude/skills/code-interface-design/` | **Yes — major (~1.5 hour)** |
| `ui-design-system` | `apps/concurrentoolVO/skills/ui-design-system/` | `.claude/skills/code-ui-design-system/` | **Yes — major (~1 hour)** |
| `web-asset-generator` | `apps/concurrentoolVO/skills/web-asset-generator/` | `.claude/skills/tool-web-asset-generator/` | **Yes — minor (~30 min)** |

Total potential effort: ~3.5 hours across 4 skills. Defer until each skill earns its keep.

---

## Refactor-trigger rules (when to invest)

For each non-compliant skill, **start refactor only if ANY of these conditions are met**:

1. **Active use signal — content**: skill's section in `context/learnings.md` (`## code-frontend-design`, `## code-interface-design`, etc.) has **≥3 entries**, indicating Pim has used the skill at least 3 times and noted feedback.
2. **Active use signal — output**: `projects/{skill-folder-name}/` has **≥3 date-stamped files**, indicating output-producing skill ran ≥3 times.
3. **Active friction**: Pim explicitly notes the skill produced unreliable / confusing / hallucinated output during use. (Manual signal — no automation needed; surfaces in conversation.)

If NONE of the above apply for a given skill in **60 days**: consider dropping the skill instead of refactoring. An unused broken skill costs only disk space; refactoring costs 1-1.5 hours and produces a polished version of something nobody uses.

---

## Audit results per skill — compliance issues

### `code-frontend-design` (renamed from `frontend-design`)

**Used for**: distinctive frontend interfaces, design philosophy, anti-AI-slop aesthetics.
**Content quality**: HIGH (concise design philosophy, valuable principles)
**SKILL.md length**: 43 lines ✅

| Issue | What needs fixing |
|---|---|
| ❌ No category prefix | _**Fixed** in migration → `code-frontend-design`_ |
| ❌ Description vague + no negative-triggers | Add: "Triggered by: 'distinctive design', 'creative frontend', 'avoid AI slop'. Does NOT trigger for: dashboards/SaaS UI (use `code-interface-design`), design tokens (use `code-ui-design-system`), favicons (use `tool-web-asset-generator`)." |
| ❌ Missing canonical sections | Add `## Outcome`, `## Context Needs`, optionally `## Skill Relationships` (point at `code-interface-design`). |
| ❌ Non-standard `license:` field in frontmatter | Remove or move into a separate `LICENSE.txt` reference. |
| ❌ No output path | Add explicit "Save Output" step: `projects/code-frontend-design/{YYYY-MM-DD}_{name}.md` (or component file path inside the app being designed for). |

**Total refactor effort**: ~30 min

### `code-interface-design` (renamed from `interface-design`)

**Used for**: dashboards, admin panels, SaaS apps, tools, interactive products. Intent-first, defaults-aware, signature-driven design methodology.
**Content quality**: VERY HIGH (best of the four, deeply considered)
**SKILL.md length**: 392 lines ❌ (2x over 200-line limit)

| Issue | What needs fixing |
|---|---|
| ❌ No category prefix | _**Fixed** in migration → `code-interface-design`_ |
| ❌ SKILL.md 2x too long | Split: keep core in SKILL.md (~150 lines), move craft-foundations + design-principles + avoid-list to `references/principles.md`. The skill already references `references/principles.md`, `references/validation.md`, `references/critique.md` — ensure those files exist with the moved content. |
| ❌ Mixed heading levels (`#` and `##`) | Normalize to `##` for top-level sections per canonical spec. |
| ❌ Missing canonical sections | Add `## Outcome`, `## Context Needs`, `## Dependencies`, `## Skill Relationships`. |
| ⚠️ Description vague on negative-triggers | Tighten: "Does NOT trigger for: marketing/landing pages (use `code-frontend-design`), design system / token generation (use `code-ui-design-system`), favicons / social images (use `tool-web-asset-generator`)." |
| ❌ No output path | Add explicit "Save Output" step. |
| ⚠️ References `.interface-design/system.md` (legacy path) | Update to `.claude/skills/code-interface-design/system.md` or move to `apps/{slug}/projects/code-interface-design/system.md`. |

**Total refactor effort**: ~1.5 hours (substantive; content surgery on a long well-written file)

### `code-ui-design-system` (renamed from `ui-design-system`)

**Used for**: design tokens, color palettes, typography scales, component systems, developer handoff. Workflow-driven with Python script (`scripts/design_token_generator.py`).
**Content quality**: HIGH (functional, well-organized, has scripts)
**SKILL.md length**: 380 lines ❌ (2x over 200-line limit)

| Issue | What needs fixing |
|---|---|
| ❌ No category prefix | _**Fixed** in migration → `code-ui-design-system`_ |
| ❌ Frontmatter name was double-quoted (`"ui-design-system"`) | _**Fixed** in migration → `code-ui-design-system` (no quotes)_ |
| ❌ SKILL.md 2x too long | Split: keep workflows + tool reference in SKILL.md (~150 lines), move quick-reference tables (color scale, typography scale, WCAG, style presets) to `references/quick-tables.md`. Move validation checklist to `references/validation.md`. |
| ❌ Missing canonical sections | Add `## Outcome`, `## Context Needs`, `## Dependencies` (Python + Pillow). |
| ⚠️ Description has trigger terms but no negative-triggers | Add: "Does NOT trigger for: app-specific design philosophy (use `code-frontend-design` or `code-interface-design`), favicons / OG images (use `tool-web-asset-generator`)." |
| ❌ No output path declared | Workflows produce design-tokens.css/scss/json — declare output path: `projects/code-ui-design-system/{YYYY-MM-DD}_{name}/`. |
| ⚠️ Has Table-of-Contents at top (unusual for SKILL.md) | Drop ToC — SKILL.md is short enough that a ToC adds noise; tools navigate by `##` sections. |

**Total refactor effort**: ~1 hour

### `tool-web-asset-generator` (renamed from `web-asset-generator`)

**Used for**: favicons, app icons (PWA), social media meta images (Open Graph). Has Python scripts: `generate_favicons.py`, `generate_og_images.py`.
**Content quality**: MEDIUM (functional but heavily AskUserQuestion-driven; 8 question patterns)
**SKILL.md length**: 202 lines ⚠️ (just over limit — minor)

| Issue | What needs fixing |
|---|---|
| ❌ No category prefix | _**Fixed** in migration → `tool-web-asset-generator`_ |
| ❌ Just over 200-line limit | Cut by ~30 lines. The 8 question patterns can be condensed; the dependencies block at the end can move to a `references/dependencies.md`. |
| ❌ Missing canonical sections | Add `## Outcome`, `## Context Needs`, `## Dependencies` (Pillow + pilmoji + emoji libraries). |
| ⚠️ Description has triggers but no negative-triggers | Add: "Does NOT trigger for: full design system tokens (use `code-ui-design-system`), in-app UI components (use `code-frontend-design` or `code-interface-design`), brand voice or copy (use `mkt-brand-voice`)." |
| ❌ Output paths inconsistent + don't match App-Dev OS conventie | Fix: all output to `projects/tool-web-asset-generator/{YYYY-MM-DD}_{batch-name}/` with date-stamped filenames. Replace references to `/home/claude/output`, `/mnt/user-data/outputs/` with the App-Dev OS convention. |
| ⚠️ Question Pattern 6 has malformed emoji (`?`) | Original UTF-8 emoji apparently lost in import — re-source from upstream repo if needed. |

**Total refactor effort**: ~30 min

### `ops-competitor-intel` ✅ keeper, no refactor needed

For reference, this skill is already methodologically sound:
- ✅ Has category prefix (`ops-`)
- ✅ Description has triggers + negative-triggers
- ✅ SKILL.md 150 lines (under limit)
- ✅ Canonical sections (Outcome, Context Needs, Dependencies, Rules, Self-Update)
- ✅ App-specific (references `src/db/pricing-operations.ts`, `src/engine/discount-patterns.ts`)
- ✅ Stays in `apps/concurrentoolVO/.claude/skills/` (correct per-app location)

The only minor improvement would be adding a `## Skill Relationships` section pointing to upstream/downstream skills. Not blocking.

---

## How to track skill activity (the refactor-trigger signal)

Three passive signals already exist in the App-Dev OS infrastructure — no new tooling needed:

1. **`context/learnings.md` per-skill section** — entries appear when skills produce deliverables and Pim gives feedback. Empty after 30+ days = skill not used.
2. **`projects/{skill-folder-name}/` output folder** — date-stamped files indicate skill ran. File count = use frequency.
3. **Manual friction signal** — Pim notices a skill produced confusing output during real work. Surfaces in conversation. No automation needed.

If after 60 days NONE of the four skills above show signal: drop them entirely instead of refactoring.

---

## Optional future enhancement — skill-activity cron

If manual checking the three signals becomes tedious, write a `monthly-skill-activity-audit` cron job similar to the existing `monthly-learnings-health`. Should output:

> *"Skill X — 0 learnings entries + 0 projects files in 30 days → drop candidate."*
> *"Skill Y — 5 learnings entries + 8 projects files → high use, refactor priority."*

Effort to build: ~30 min. **Don't build pre-emptively** — build if/when manual checking feels like work.

---

## Refactor session checklist (when a trigger fires for a specific skill)

When you decide to refactor a specific skill (e.g., evidence shows `code-interface-design` got used 5 times):

1. Read the skill's current `SKILL.md` end-to-end
2. Read `.claude/skills/meta-skill-creator/SKILL.md` for current standards
3. Apply the issues from this plan's "Audit results per skill" section
4. Move long-form content to `references/<topic>.md` files where indicated
5. Add canonical sections (`## Outcome`, `## Context Needs`, etc.)
6. Add negative-triggers to description
7. Declare output path
8. Run skill manually with a small test prompt
9. Compare output against pre-refactor baseline (subjectively — does the skill still feel useful?)
10. Update `AGENTS.md` Skill Registry + Context Matrix if any boundaries shifted
11. Commit

The `meta-skill-creator` skill itself can drive this — invoke it with: *"Improve the `code-interface-design` skill per the issues listed in `projects/ops-skill-refactor/2026-05-01_skill-quality-plan.md`."*
