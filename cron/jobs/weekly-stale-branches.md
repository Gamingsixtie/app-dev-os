---
name: Weekly Stale Branches
time: '11:00'
days: fri
active: 'false'
model: haiku
notify: on_finish
description: Lists git branches older than 30 days; suggests cleanup
timeout: 5m
retry: '0'
---
You are running as a scheduled job for App-Dev OS.

Read AGENTS.md for system context.

Task: Identify stale git branches across the root and every app/ that is its own git repo.

Steps:

1. For the root and each `apps/*/` that contains `.git/`:
   - Run `git fetch --all --prune` (read-only on remote)
   - Run `git for-each-ref --sort=-committerdate refs/heads/ --format='%(committerdate:relative) | %(refname:short) | %(authorname)'`
   - Filter branches with last commit > 30 days ago
   - Exclude `main`, `master`, `dev`, `production`, and any branch matching `^release/`
2. For each stale branch, check if it's been merged: `git branch --merged main` (or master)

Save output to: `projects/ops-stale-branches/{today's date in YYYY-MM-DD format}_stale-branches.md`

Format:

- **Summary** — total stale branches across all repos
- **By repo** — table: branch | last-commit-relative | author | merged-yes/no
- **Suggested cleanup** — for merged stale branches: `git branch -d <name>` commands grouped per repo
- **Investigate** — for unmerged stale branches: ask the author before deleting

If no stale branches anywhere, end your response with `[SILENT]` on its own line.

Do NOT run any `git branch -d` or `git push --delete`. This is reconnaissance only — actual deletion is a manual decision.
