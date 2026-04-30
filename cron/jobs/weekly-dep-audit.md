---
name: Weekly Dep Audit
time: '09:00'
days: mon
active: 'true'
model: haiku
notify: on_finish
description: Runs npm/pnpm/cargo audit per app and summarises high-severity findings
timeout: 10m
retry: '1'
---
You are running as a scheduled job for App-Dev OS.

Read AGENTS.md for system context.

Task: Run dependency audit on the root and every app under apps/.

Steps:

1. List `apps/*/` and the root for project-roots that contain a `package.json`, `pyproject.toml`, or `Cargo.toml`.
2. For each detected project-root:
   - If `package.json` exists → run `npm audit --json` (or `pnpm audit --json` if `pnpm-lock.yaml` is present)
   - If `pyproject.toml` exists with `poetry.lock` → run `poetry run safety check --json` if available
   - If `Cargo.toml` exists → run `cargo audit --json`
3. Parse output for high/critical findings. Skip low/moderate unless count > 10.
4. Aggregate into a summary table: `<project> | <severity> | <package> | <vuln-id> | <fixed-in>`.

Save output to: `projects/sec-dep-audit/{today's date in YYYY-MM-DD format}_dep-audit.md`

Format:

- **Summary** — total high+critical across all projects
- **By project** — table per project, blockers first
- **Action items** — proposed `npm install pkg@x.y.z` commands per high finding

If no high or critical findings across all projects, end your response with `[SILENT]` on its own line. This suppresses the desktop notification — clean weeks don't need pings.

Do NOT auto-update dependencies. This skill reports only. Updates are a manual decision.
