---
name: Weekly Dep Update Check
time: '11:00'
days: mon
active: 'true'
model: haiku
notify: on_finish
description: Lists outdated dependencies per app — never auto-updates
timeout: 10m
retry: '1'
---
You are running as a scheduled job for App-Dev OS.

Read AGENTS.md for system context.

Task: Report outdated dependencies across the root and every app under apps/. Do NOT auto-update.

Steps:

1. List project-roots: root + `apps/*/`.
2. For each project-root:
   - If `package.json` exists → run `npm outdated --json` (or `pnpm outdated --json`)
   - If `pyproject.toml` with `poetry.lock` → `poetry show --outdated --no-ansi`
   - If `Cargo.toml` → `cargo outdated --format json`
3. Filter to **major version** updates only. Patch + minor go to noise — devs upgrade those casually.
4. Aggregate into per-project table.

Save output to: `projects/sec-dep-update-check/{today's date in YYYY-MM-DD format}_dep-updates.md`

Format:

- **Summary** — total major updates available across all projects
- **By project** — table: package | current | latest | release-notes-link (if known)
- **Recommended order** — bigger ecosystems first (framework upgrades before plugins)
- **Read carefully** — flag breaking-change releases (major bumps in `react`, `next`, frameworks, ORMs)

If no major updates available across all projects, end your response with `[SILENT]` on its own line.

Do NOT run `npm install` or any update command. This is read-only reconnaissance.
