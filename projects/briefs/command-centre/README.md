# Command Centre — minimal scripts

This folder hosts the **minimal cron runtime** for App-Dev OS.

The full Agentic OS Command Centre (web UI, SQLite task tracking, deliverable indexing, the whole launcher) is **not installed** in this workspace. Only the pieces required by `scripts/start-crons.sh`, `scripts/stop-crons.sh`, `scripts/status-crons.sh`, `scripts/logs-crons.sh`, and `scripts/run-job.sh` live here.

## Files

- `scripts/cron-daemon.cjs` — Node.js daemon. Reads `cron/jobs/*.md`, schedules active jobs by `time` + `days`, invokes `claude --print` when a job fires.

## What this daemon does NOT do

- No SQLite state (the Command Centre UI uses it; not needed for headless scheduling)
- No deliverable indexing (`scripts/lib/cron-db.py` is unused without SQLite)
- No web UI / launcher integration
- No multi-host failover (single CLI host, no Command Centre lock contention)

## Usage

All access is through the wrapper scripts at the repo root:

```bash
bash scripts/start-crons.sh    # start daemon (blocks terminal)
bash scripts/stop-crons.sh     # stop daemon
bash scripts/status-crons.sh   # show daemon state + next fire times
bash scripts/logs-crons.sh     # tail daemon log
bash scripts/run-job.sh <slug> # invoke one job manually (ignores active flag)
bash scripts/run-job.sh        # list all jobs (active + inactive)
```

State files live in `.command-centre/` (gitignored):
- `cron-daemon.pid` — current daemon PID
- `cron-runtime.lock` — host metadata
- `cron-daemon.log` — append-only run history

## Replacing this with the full Command Centre

If you ever install the upstream Agentic OS Command Centre, drop its `cron-daemon.cjs` into `scripts/` and it should work — the wrapper scripts in `scripts/` only call this entry point. The state directory layout is compatible.
