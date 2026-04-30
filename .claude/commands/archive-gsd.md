# /archive-gsd

Mark a GSD project as complete. Each Level 3 project owns its own `.planning/`
folder inside `projects/briefs/{slug}/`, so archiving is now a simple
frontmatter flip — nothing moves on disk.

## What This Does

1. Finds an active GSD project by scanning `projects/briefs/*/brief.md` for
   a brief with `level: 3` and `status: active`.
2. Updates that brief's frontmatter from `status: active` to `status: complete`.
3. Leaves `projects/briefs/{slug}/.planning/` exactly where it is, as a
   self-contained historical record.

Multiple GSD projects can be active in parallel, so this command only
affects the one you choose.

## Steps

### Step 1: Find active GSD projects

Scan `projects/briefs/*/brief.md` for files with `level: 3` and
`status: active` in YAML frontmatter.

- **Found none** → tell the user: "No active GSD project found — nothing to archive."
- **Found one** → continue to Step 2 with that project.
- **Found multiple** → ask the user which one to archive.

### Step 2: Confirm with the user

> "I'll mark the GSD project **{project-name}** as complete:"
> - Update `projects/briefs/{project-name}/brief.md` → `status: complete`
> - `projects/briefs/{project-name}/.planning/` stays in place
>
> "Go ahead?"

Wait for confirmation before proceeding.

### Step 3: Flip the status

Edit the brief's YAML frontmatter: change `status: active` to
`status: complete`. Do not touch `.planning/` or anything else.

### Step 4: Report

> "Done. **{project-name}** is archived."
>
> - Brief: `projects/briefs/{project-name}/brief.md` (status: complete)
> - Planning: `projects/briefs/{project-name}/.planning/` (unchanged)
>
> "Other GSD projects are unaffected. Start a new one any time with `/gsd:new-project`."

## Anti-Patterns

- Never move `.planning/` — it already lives in the right place.
- Never delete anything — only the frontmatter field changes.
- Never archive without user confirmation.
- Never assume there's only one active GSD project — always check.
