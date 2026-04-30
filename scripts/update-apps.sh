#!/usr/bin/env bash
# Sync skills and scripts from the root to all app workspaces.
# Run this after update.sh to push the latest methodology to all apps.
# Usage: bash scripts/update-apps.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APPS_DIR="${PROJECT_DIR}/apps"

create_app_agents_file() {
  local target="$1"
  local app_name="$2"
  cat > "$target" <<EOF
# App: ${app_name}

Add app-specific instructions here. These layer on top of the root AGENTS.md instructions — they don't replace them.

## App-Specific Instructions

-

## Stack overrides

-

## Notes

-
EOF
}

create_app_claude_wrapper() {
  local target="$1"
  cat > "$target" <<'EOF'
# CLAUDE.md

This file keeps Claude Code compatible with the app-specific instructions in `AGENTS.md`.

@AGENTS.md
EOF
}

create_app_cron_proxy_scripts() {
  local scripts_dir="$1"

  cat > "${scripts_dir}/start-crons.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DEV_OS_DIR="$ROOT_PROJECT_DIR" bash "$ROOT_PROJECT_DIR/scripts/start-crons.sh" "$@"
EOF

  cat > "${scripts_dir}/stop-crons.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DEV_OS_DIR="$ROOT_PROJECT_DIR" bash "$ROOT_PROJECT_DIR/scripts/stop-crons.sh" "$@"
EOF

  cat > "${scripts_dir}/status-crons.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DEV_OS_DIR="$ROOT_PROJECT_DIR" bash "$ROOT_PROJECT_DIR/scripts/status-crons.sh" "$@"
EOF

  cat > "${scripts_dir}/logs-crons.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DEV_OS_DIR="$ROOT_PROJECT_DIR" bash "$ROOT_PROJECT_DIR/scripts/logs-crons.sh" "$@"
EOF

  cat > "${scripts_dir}/run-job.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_SLUG="$(basename "$(cd "$(dirname "$0")/.." && pwd)")"
APP_DEV_OS_DIR="$ROOT_PROJECT_DIR" bash "$ROOT_PROJECT_DIR/scripts/run-job.sh" "$@" --app "$APP_SLUG"
EOF

  cat > "${scripts_dir}/start-crons.ps1" <<'EOF'
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RootProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$RootScript = Join-Path $RootProjectDir "scripts\start-crons.ps1"
$env:APP_DEV_OS_DIR = $RootProjectDir

& $RootScript @Arguments
EOF

  cat > "${scripts_dir}/stop-crons.ps1" <<'EOF'
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RootProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$RootScript = Join-Path $RootProjectDir "scripts\stop-crons.ps1"
$env:APP_DEV_OS_DIR = $RootProjectDir

& $RootScript @Arguments
EOF

  cat > "${scripts_dir}/status-crons.ps1" <<'EOF'
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RootProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$RootScript = Join-Path $RootProjectDir "scripts\status-crons.ps1"
$env:APP_DEV_OS_DIR = $RootProjectDir

& $RootScript @Arguments
EOF

  cat > "${scripts_dir}/logs-crons.ps1" <<'EOF'
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RootProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$RootScript = Join-Path $RootProjectDir "scripts\logs-crons.ps1"
$env:APP_DEV_OS_DIR = $RootProjectDir

& $RootScript @Arguments
EOF

  cat > "${scripts_dir}/run-job.ps1" <<'EOF'
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RootProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$AppSlug = Split-Path -Leaf (Split-Path -Parent $PSScriptRoot)
$RootScript = Join-Path $RootProjectDir "scripts\run-job.ps1"
$env:APP_DEV_OS_DIR = $RootProjectDir

$ForwardedArguments = @()
if ($Arguments) {
    $ForwardedArguments += $Arguments
}
$ForwardedArguments += @("--app", $AppSlug)

& $RootScript @ForwardedArguments
EOF

  chmod +x \
    "${scripts_dir}/start-crons.sh" \
    "${scripts_dir}/stop-crons.sh" \
    "${scripts_dir}/status-crons.sh" \
    "${scripts_dir}/logs-crons.sh" \
    "${scripts_dir}/run-job.sh"
}

is_claude_wrapper() {
  local file="$1"
  [[ -f "$file" ]] || return 1
  grep -qx '@AGENTS.md' "$file"
}

get_app_display_name() {
  local file="$1"
  head -n 1 "$file" | tr -d '\r' | sed 's/^# App: //'
}

sync_app_instruction_files() {
  local app_dir="$1"
  local app_name="$2"
  local agents_path="${app_dir}/AGENTS.md"
  local claude_path="${app_dir}/CLAUDE.md"

  if [[ ! -f "$agents_path" ]]; then
    if [[ -f "$claude_path" ]] && ! is_claude_wrapper "$claude_path"; then
      cp "$claude_path" "$agents_path"
      echo "  Seeded AGENTS.md from existing CLAUDE.md"
      echo "  Preserved existing CLAUDE.md (manual cleanup recommended)"
    else
      create_app_agents_file "$agents_path" "$app_name"
      echo "  Created AGENTS.md"
    fi
  fi

  if [[ ! -f "$claude_path" ]]; then
    create_app_claude_wrapper "$claude_path"
    echo "  Created CLAUDE.md wrapper"
  fi
}

if [[ ! -d "$APPS_DIR" ]]; then
  echo "No apps/ directory found. Nothing to sync."
  echo "Create an app first: bash scripts/add-app.sh \"App Name\""
  exit 0
fi

# Find app folders (any directory directly under apps/)
APP_COUNT=0
SYNCED=0

for APP_DIR in "${APPS_DIR}"/*/; do
  [[ -d "$APP_DIR" ]] || continue
  APP_NAME=$(basename "$APP_DIR")
  APP_COUNT=$((APP_COUNT + 1))

  echo "Syncing ${APP_NAME}..."

  sync_app_instruction_files "$APP_DIR" "$APP_NAME"

  # Sync skills — copy root skills over, but preserve app-only skills
  if [[ -d "${PROJECT_DIR}/.claude/skills" ]]; then
    mkdir -p "${APP_DIR}/.claude/skills"

    for root_skill in "${PROJECT_DIR}/.claude/skills"/*/; do
      [[ -d "$root_skill" ]] || continue
      skill_name=$(basename "$root_skill")
      rm -rf "${APP_DIR}/.claude/skills/${skill_name}"
      cp -R "$root_skill" "${APP_DIR}/.claude/skills/${skill_name}"
    done

    if [[ -d "${PROJECT_DIR}/.claude/skills/_catalog" ]]; then
      rm -rf "${APP_DIR}/.claude/skills/_catalog"
      cp -R "${PROJECT_DIR}/.claude/skills/_catalog" "${APP_DIR}/.claude/skills/_catalog"
    fi

    APP_ONLY=0
    for app_skill in "${APP_DIR}/.claude/skills"/*/; do
      [[ -d "$app_skill" ]] || continue
      skill_name=$(basename "$app_skill")
      [[ "$skill_name" == "_catalog" ]] && continue
      if [[ ! -d "${PROJECT_DIR}/.claude/skills/${skill_name}" ]]; then
        APP_ONLY=$((APP_ONLY + 1))
      fi
    done

    if [[ $APP_ONLY -gt 0 ]]; then
      echo "  Skills synced (${APP_ONLY} app-only skill(s) preserved)"
    else
      echo "  Skills synced"
    fi
  fi

  if [[ -f "${PROJECT_DIR}/.claude/settings.json" ]]; then
    cp "${PROJECT_DIR}/.claude/settings.json" "${APP_DIR}/.claude/settings.json"
    echo "  Settings synced"
  fi

  if [[ -d "${PROJECT_DIR}/.claude/hooks_info" ]]; then
    rm -rf "${APP_DIR}/.claude/hooks_info"
    cp -R "${PROJECT_DIR}/.claude/hooks_info" "${APP_DIR}/.claude/hooks_info"
    echo "  Hooks info synced"
  fi

  if [[ -d "${PROJECT_DIR}/.claude/hooks" ]]; then
    rm -rf "${APP_DIR}/.claude/hooks"
    cp -R "${PROJECT_DIR}/.claude/hooks" "${APP_DIR}/.claude/hooks"
    echo "  Hooks synced"
  fi

  rm -rf "${APP_DIR}/scripts"
  cp -R "${PROJECT_DIR}/scripts" "${APP_DIR}/scripts"
  create_app_cron_proxy_scripts "${APP_DIR}/scripts"
  echo "  Scripts synced"

  if [[ -d "${PROJECT_DIR}/cron/templates" ]]; then
    mkdir -p "${APP_DIR}/cron/templates"
    cp -R "${PROJECT_DIR}/cron/templates/." "${APP_DIR}/cron/templates/"
    echo "  Cron templates synced"
  fi

  SYNCED=$((SYNCED + 1))
  echo ""
done

if [[ $APP_COUNT -eq 0 ]]; then
  echo "No app folders found in apps/."
  echo "Create an app first: bash scripts/add-app.sh \"App Name\""
else
  echo "Done. Synced ${SYNCED} app(s)."
  echo ""
  echo "What was synced: app instruction files, skills, scripts, settings, hooks, cron templates."
  echo "What was NOT touched: brand_context, code_context, memory, learnings, projects, .env, cron jobs."
fi
