---
name: docs-adr
description: >
  Create immutable Architecture Decision Records (ADRs) under `ADR/` following App-Dev OS memory-model conventions. Triggers on: "write an ADR", "log a decision", "this needs an ADR", "promote this to an ADR", "supersede ADR-XXXX", "we should record this decision", "architecture decision". Three modes: (1) **create** — interview-driven new ADR from scratch, (2) **promote** — turn an existing decision-bullet (from `architecture.md` § ADR-equivalent or `learnings.md`) into a full ADR and replace the bullet with a pointer, (3) **supersede** — write a new ADR that replaces an old one and add a status banner to the old file. Auto-numbers, writes the file, and updates the ADRs Index in `learnings.md`. Does NOT trigger for: regular docs (use `docs-readme` when it exists), code conventions (edit `conventions.md` directly), or ephemeral decisions that don't warrant immutability.
---

# docs-adr

Create immutable Architecture Decision Records — one decision per file, never edited, superseded with a new ADR.

ADRs are project-level **memory**. They explain *why* a decision was made, what was on the table, and what we accepted as trade-off. The point is reversibility: in two years, when someone (probably future-you) wonders "why is this done this way?", the answer is in the file — not in someone's head and not in a Slack thread that has long since rotted away.

## Outcome

- New file `ADR/{NNNN}-{kebab-slug}.md` (zero-padded 4-digit number)
- Row added to `context/learnings.md` § ADRs Index
- For **promote** mode: source bullet in `code_context/architecture.md` § ADR-equivalent (or `apps/{slug}/code_context/architecture.md`) replaced with a one-line pointer to the new ADR
- For **supersede** mode: old ADR's `## Status` updated to `Superseded by ADR-NNNN ({YYYY-MM-DD})`; old file is otherwise untouched

## Context Needs

| File | Load level | Purpose |
|---|---|---|
| `ADR/` (folder list) | full | Determine next ADR number; check for the ADR being superseded |
| `ADR/README.md` § Index | full | The canonical ADRs index — append the new row here |
| `code_context/architecture.md` § ADR-equivalent | full | Source of bullets for **promote** mode; check the new ADR is consistent with stated invariants |
| `context/learnings.md` § docs-adr | full | Skill-specific past feedback |
| `references/adr-template.md` | full | The mandated ADR structure — mirrors `ADR/README.md` § Template — read before writing the file |

## Skill Relationships

- **Upstream**: `gsd-extract-learnings` and `meta-wrap-up` surface decisions worth promoting to ADRs. The ADR-equivalent bullets in `architecture.md` are the most common input.
- **Downstream**: every code skill via `code_context/architecture.md` invariants — once an ADR is accepted, follow-up skills must respect it. Add a one-line invariant to `architecture.md` if the ADR introduces a hard rule.
- **Trigger conflicts**: avoid firing when the user wants `code_context/conventions.md` updated (a code convention is not an ADR) or when they want a generic README (`docs-readme`). If the decision is small enough to fit in one bullet without alternatives or trade-offs, it belongs in `architecture.md` § ADR-equivalent — not a full ADR.

## Before You Start: pick a mode

Ask if not obvious from the user's phrasing:

1. **create** — brand-new decision, no prior bullet anywhere
2. **promote** — there's already a one-line decision somewhere (architecture.md, learnings.md, the conversation we're in) that needs full write-up
3. **supersede** — replacing an existing ADR with a new direction

If the user names a specific bullet ("promote the Supabase one"), default to **promote**. If they reference an ADR number ("supersede ADR-0007"), default to **supersede**. Otherwise ask.

## Step 1: gather inputs

For all modes:
- Read `ADR/` to determine the next number. If folder is empty or missing, start at `0001`. Read existing ADR filenames so the slug doesn't collide.
- Read `references/adr-template.md` so you know the exact structure before interviewing.
- Read `context/learnings.md` § docs-adr for prior feedback.

For **promote** mode:
- Read `code_context/architecture.md` § ADR-equivalent (or wherever the bullet lives — the user might reference a learnings.md entry or a Phase-N section). Identify the bullet by its date + first-clause match. If the user named "the Supabase bullet" but there are two, ask which.

For **supersede** mode:
- Read the old ADR file. Capture its title and current status. If already superseded, ask the user whether they want to chain (NEW supersedes 0017 supersedes 0008) or supersede the original directly.

## Step 2: interview the user

Ask short questions, one at a time. Keep it tight — the user is busy and the value is the structure, not the length. Use the format in `references/adr-template.md` as the schema.

For **create**:
1. Title (action-oriented, ≤8 words, e.g. "Use Supabase SDK without separate ORM")
2. Context — what problem, what constraints (2-4 sentences)
3. Decision — what we picked (1-3 sentences)
4. Alternatives — 2-4 options + one-line rejection reason each
5. Consequences — what becomes easier, what becomes harder (2-4 bullets)

For **promote**:
- The bullet already gives you Title + Decision (and often a one-line reason). Ask only the gaps: **Context** (what was the situation that forced this), **Alternatives** (what else was on the table), **Consequences** (trade-offs accepted). Skip questions whose answers are already in the bullet — read it first, then ask.
- If the user wants to do multiple bullets in one go, batch the interview: list the bullets, confirm titles, then ask the missing fields per bullet in a structured pass.

For **supersede**:
- Title of new ADR. Why the old one no longer holds. New decision. New consequences. The old ADR's Context is usually still valid — you can summarize it in `## Context` of the new ADR or just link out.

## Step 3: write the ADR file

Use the template in `references/adr-template.md`. Fill every section — if a section truly doesn't apply (e.g., no alternatives for an emergency hotfix decision), write `_n/a — {one-line reason}_` rather than leaving it blank. Empty sections invite later editing of "immutable" content.

Filename: `ADR/{NNNN}-{kebab-slug}.md`. Slug = lowercased title with non-alphanumerics replaced by `-`, max ~50 chars. Examples: `0001-supabase-sdk-no-orm.md`, `0007-revert-from-monorepo.md`.

Save to disk. Always save to disk. This is not optional. After saving, show the user the full absolute file path so they can click it directly.

## Step 4: update the ADRs Index

The canonical index lives in [`ADR/README.md`](../../../ADR/README.md) § Index. Add a row there, newest at bottom. The table format is:

```
| ADR-{NNNN} | {Title} | Accepted | {YYYY-MM-DD} |
```

`context/learnings.md` § ADRs Index is a pointer-only section that links out to `ADR/README.md` — do not duplicate rows there.

For **supersede** mode:
- Edit the old ADR's `**Status**` line to `Superseded by ADR-{NNNN} ({YYYY-MM-DD})`. Do not edit anything else in the old ADR — they are immutable.
- In `ADR/README.md` § Index, update the old row's Status column to `Superseded`.
- Add the new ADR's row as normal.

## Step 5: clean up the source (promote mode only)

Replace the original bullet in `code_context/architecture.md` § ADR-equivalent with a one-line pointer:

```
- **{YYYY-MM-DD}** — {one-clause summary}. Promoted to [ADR-{NNNN}](../ADR/{NNNN}-{slug}.md).
```

Do **not** delete the bullet. Pointers preserve scroll-back context for anyone reading architecture.md top-to-bottom — they shouldn't have to wonder why the file suddenly skips a decision.

If the bullet lives in a per-app architecture file (`apps/{slug}/code_context/architecture.md`), put the ADR in `apps/{slug}/ADR/`, not the root `ADR/`. The pointer link path becomes `../../ADR/{NNNN}-{slug}.md`.

## Step 6: confirm + log feedback

Tell the user: "Wrote ADR-{NNNN} → {full path}. Indexed in learnings.md."

Ask: "Anything to log to learnings? (gotcha, surprise, follow-up)" — if yes, append under `## docs-adr` in `context/learnings.md` with date and one-line context.

## Rules

- ADR files are immutable once accepted. Never edit `## Context` / `## Decision` / `## Alternatives` / `## Consequences` after the file is written. Status changes (Superseded / Deprecated) are the only permitted post-acceptance edits.
- Do not skip the Alternatives section. If the decision had no alternatives, write `_no alternative considered — {reason}_` so future-readers see the reasoning, not a missing field.
- Auto-numbering is non-negotiable: read the `ADR/` folder before assigning a number. Never reuse a number, even for a deleted draft.
- Per-app ADRs live in `apps/{slug}/ADR/`, not the root `ADR/`. Ask which scope when in doubt — the answer is "root" for template-wide decisions, "app" for app-specific decisions.
- ADRs explain *why*, not *how*. Don't include code snippets in the ADR — link to a commit, PR, or `code_context/conventions.md` section instead.

## Self-Update

If the user flags an issue with the output — wrong template structure, wrong index format, missing step, mistaken numbering, scope confusion — update the `## Rules` section above with a dated entry (`- {YYYY-MM-DD}: {rule}`) immediately, before continuing. Don't only log to learnings; fix the skill so the same mistake can't repeat.
