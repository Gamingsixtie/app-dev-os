# Prompt Tags

Reusable prompt snippets that can be inlined into any task prompt by typing `@<tag-name>` in the goal bar or reply input. Sections are delimited by H2 headings (`## tag-name`). An optional frontmatter line right after the heading can mark a tag as a starter chip with `starter: true`.

## brand-voice
starter: true

Use the in-app voice defined in `brand_context/voice-profile.md`. Match tone, vocabulary, sentence rhythm. Used for UI-copy, error messages, empty states, onboarding text. If voice-profile.md is missing, ask the user once how they want in-app text to sound.

## conventions
starter: true

Follow `code_context/conventions.md` strictly: naming, imports, formatter, lint, type-system rules, banned patterns. If conventions.md is missing or outdated for the current language/framework, surface it before writing code.

## architecture
starter: true

Read `code_context/architecture.md` for system shape, stack, components, data flow, and key invariants before designing anything. Treat invariants as non-negotiable unless the user explicitly waives one.

## runbook

Consult `code_context/runbook.md` for environments, deploy targets, secrets handling, on-call, and rollback procedures. Required reading for any deploy/ops/database-migration work.

## brief
starter: true

Read the active project brief at `projects/briefs/{project-slug}/brief.md` for the current task's project before doing anything else. Treat the brief as the source of truth for goal, deliverables, and acceptance criteria. Only deviate from it after asking the user.

## recent-decisions

Skim today's and yesterday's `context/memory/{date}.md` files for any "Decisions" entries that touch this work. Carry those decisions forward — do not relitigate them unless the user explicitly asks.

## style-guide

Follow `brand_context/style-guide.md` if present (formatting, capitalisation, banned phrases for in-app text). For code style, use `code_context/conventions.md` instead.

## risk-posture

Check `context/USER.md` § Risk posture before proposing destructive operations (rm -rf, force push, DROP, schema changes touching prod data). Match your suggestion to the user's stated tolerance.
