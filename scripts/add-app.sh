#!/usr/bin/env bash
# Create a new app workspace under apps/.
# Usage: bash scripts/add-app.sh "App Name"

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/add-app.sh \"App Name\""
  echo ""
  echo "Creates an app workspace under apps/ with skills, scripts,"
  echo "and empty directories for brand_context, code_context, memory, and projects."
  exit 1
fi

APP_NAME="$1"

# Convert to slug: lowercase, spaces to hyphens, strip non-alphanumeric
APP_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

APP_DIR="${PROJECT_DIR}/apps/${APP_SLUG}"

if [[ -d "$APP_DIR" ]]; then
  echo "Error: App folder already exists: apps/${APP_SLUG}/"
  echo "To start over, remove it first and re-run this script."
  exit 1
fi

echo "Creating app workspace: apps/${APP_SLUG}/"

create_app_agents_file() {
  local target="$1"
  local app_name="$2"
  cat > "$target" <<EOF
# App: ${app_name}

Add app-specific instructions here. These layer on top of the root AGENTS.md instructions — they don't replace them.

## App-Specific Instructions

-

## Stack overrides

_If this app's stack differs from the workspace default, document it here._

-

## OTAP framework

This app inherits the App-Dev OS OTAP framework. See:
- [\`../../code_context/otap.md\`](../../code_context/otap.md) — operational reference (daily workflow, branch prefixes, gates, env-vars)
- [\`../../ADR/0005-otap-framework.md\`](../../ADR/0005-otap-framework.md) — architecture decision and rationale
- [\`../../code_context/runbook.md\`](../../code_context/runbook.md) — migration sync, rollback procedure, branch protection setup

**Per-app OTAP setup checklist** (manual, one-time):
- [ ] Create local Supabase project named \`${APP_SLUG}-dev\`
- [ ] Create production Supabase project named \`${APP_SLUG}-prod\`
- [ ] Copy local Supabase URL + anon key into \`.env.local\` (template at \`.env.local.example\`)
- [ ] Add production Supabase URL + anon key to Vercel project under "Production" environment
- [ ] Add local Supabase URL + anon key to Vercel project under "Preview" environment
- [ ] Add an entry to root \`.github/workflows/ci.yml\` (\`detect-changes.filters\` and a parallel build job)
- [ ] Configure GitHub branch protection on \`main\` (one-time, repo-level — see runbook)

## Notes

-
EOF
}

create_app_env_local_example() {
  local target="$1"
  local app_slug="$2"
  cat > "$target" <<EOF
# Local environment variables for ${app_slug}
# Copy this file to .env.local (gitignored) and fill in dev-Supabase credentials.
#
# OTAP framework env-var pattern (single name, scoped values per Vercel environment):
#   - Local development reads from .env.local (this file's real version).
#   - Vercel "Preview" environment uses the same dev-Supabase values.
#   - Vercel "Production" environment uses prod-Supabase values (set in Vercel dashboard).
#
# DO NOT use _PROD/_DEV suffix variants — that scatters truth across multiple variables.
# See code_context/otap.md § "Environment variables" for the full pattern.

# --- Supabase (dev project: ${app_slug}-dev) ---
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# --- Anthropic (Claude API) ---
# If this app uses Claude API directly, add the key here.
# Production keys go into Vercel "Production" environment, not here.
VITE_ANTHROPIC_API_KEY=

# --- Sentry (optional, error tracking) ---
# Same DSN can be used across environments — Sentry tags by Vercel env automatically.
SENTRY_DSN=
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

# Create directory structure (BOTH brand_context AND code_context)
mkdir -p "${APP_DIR}/brand_context"
mkdir -p "${APP_DIR}/code_context/samples"
mkdir -p "${APP_DIR}/code_context/assets"
mkdir -p "${APP_DIR}/context/memory"
mkdir -p "${APP_DIR}/projects"
mkdir -p "${APP_DIR}/cron/jobs"
mkdir -p "${APP_DIR}/cron/logs"
mkdir -p "${APP_DIR}/cron/status"
mkdir -p "${APP_DIR}/cron/templates"

# Copy skills from root
if [[ -d "${PROJECT_DIR}/.claude/skills" ]]; then
  mkdir -p "${APP_DIR}/.claude"
  cp -R "${PROJECT_DIR}/.claude/skills" "${APP_DIR}/.claude/skills"
  echo "  Copied skills"
fi

# Copy Claude Code settings if they exist
if [[ -f "${PROJECT_DIR}/.claude/settings.json" ]]; then
  cp "${PROJECT_DIR}/.claude/settings.json" "${APP_DIR}/.claude/settings.json"
  echo "  Copied Claude Code settings"
fi

# Copy hooks_info if it exists
if [[ -d "${PROJECT_DIR}/.claude/hooks_info" ]]; then
  cp -R "${PROJECT_DIR}/.claude/hooks_info" "${APP_DIR}/.claude/hooks_info"
  echo "  Copied hooks_info"
fi

# Copy hooks if they exist
if [[ -d "${PROJECT_DIR}/.claude/hooks" ]]; then
  cp -R "${PROJECT_DIR}/.claude/hooks" "${APP_DIR}/.claude/hooks"
  echo "  Copied hooks"
fi

# Copy scripts from root
cp -R "${PROJECT_DIR}/scripts" "${APP_DIR}/scripts"
create_app_cron_proxy_scripts "${APP_DIR}/scripts"
echo "  Copied scripts"

# Copy cron templates if they exist
if [[ -d "${PROJECT_DIR}/cron/templates" ]]; then
  cp -R "${PROJECT_DIR}/cron/templates/." "${APP_DIR}/cron/templates/"
  echo "  Copied cron templates"
fi

# Seed code_context templates from root
if [[ -d "${PROJECT_DIR}/code_context" ]]; then
  cp "${PROJECT_DIR}/code_context/conventions.md" "${APP_DIR}/code_context/conventions.md" 2>/dev/null || true
  cp "${PROJECT_DIR}/code_context/architecture.md" "${APP_DIR}/code_context/architecture.md" 2>/dev/null || true
  cp "${PROJECT_DIR}/code_context/runbook.md" "${APP_DIR}/code_context/runbook.md" 2>/dev/null || true
  echo "  Seeded code_context/ from root templates"
fi

# Seed brand_context templates from root
if [[ -d "${PROJECT_DIR}/brand_context" ]]; then
  cp "${PROJECT_DIR}/brand_context/voice-profile.md" "${APP_DIR}/brand_context/voice-profile.md" 2>/dev/null || true
  cp "${PROJECT_DIR}/brand_context/positioning.md" "${APP_DIR}/brand_context/positioning.md" 2>/dev/null || true
  cp "${PROJECT_DIR}/brand_context/icp.md" "${APP_DIR}/brand_context/icp.md" 2>/dev/null || true
  cp "${PROJECT_DIR}/brand_context/samples.md" "${APP_DIR}/brand_context/samples.md" 2>/dev/null || true
  echo "  Seeded brand_context/ from root templates"
fi

# Create app instruction files
create_app_agents_file "${APP_DIR}/AGENTS.md" "${APP_NAME}"
echo "  Created app AGENTS.md"

create_app_claude_wrapper "${APP_DIR}/CLAUDE.md"
echo "  Created app CLAUDE.md wrapper"

create_app_env_local_example "${APP_DIR}/.env.local.example" "${APP_SLUG}"
echo "  Created .env.local.example (OTAP two-Supabase template)"

# Seed learnings from root
if [[ -f "${PROJECT_DIR}/context/learnings.md" ]]; then
  cp "${PROJECT_DIR}/context/learnings.md" "${APP_DIR}/context/learnings.md"
  echo "  Seeded learnings.md from root (will diverge per-app from here)"
else
  cat > "${APP_DIR}/context/learnings.md" <<LEARNINGS
# Learnings

## General

### What works well

### What doesn't work well

## Individual Skills
LEARNINGS
  echo "  Created learnings.md"
fi

# Create .gitkeep files to preserve empty directories
touch "${APP_DIR}/context/memory/.gitkeep"
touch "${APP_DIR}/projects/.gitkeep"
touch "${APP_DIR}/cron/jobs/.gitkeep"

# Copy .env if one exists at root
if [[ -f "${PROJECT_DIR}/.env" ]]; then
  cp "${PROJECT_DIR}/.env" "${APP_DIR}/.env"
  echo "  Copied .env (API keys)"
fi

echo ""
echo "App workspace ready: apps/${APP_SLUG}/"
echo ""
echo "Next steps:"
echo "  cd ${PROJECT_DIR}/apps/${APP_SLUG}"
echo "  claude"
echo "  Claude will automatically walk you through stack setup + microcopy-tone."
