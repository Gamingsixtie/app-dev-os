#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_PATH="$REPO_ROOT/projects/briefs/command-centre/scripts/cron-daemon.cjs"
source "$REPO_ROOT/scripts/lib/cron-ui.sh"

agentic_os_cron_banner \
    "Starting managed cron daemon" \
    "This terminal stays attached while the daemon is running."
agentic_os_cron_info "Launching the shared cron runtime..."

if node "$SCRIPT_PATH" start "$@"; then
    agentic_os_cron_success "Managed cron daemon is running."
    agentic_os_cron_note "Use 'bash scripts/status-crons.sh' to check state or 'bash scripts/logs-crons.sh' to follow logs."
else
    exit_code=$?
    agentic_os_cron_fail "Failed to start the managed cron daemon."
    exit "$exit_code"
fi
