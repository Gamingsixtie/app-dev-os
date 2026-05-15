#!/usr/bin/env bash
# Create a new feature worktree.
# Usage: bash scripts/new-worktree.sh <feature-name>
#
# Creates branch feature/<feature-name> off the current HEAD and adds a
# sibling worktree at ../<project>-<feature-name>, where <project> is the
# repo's top-level directory name.

set -euo pipefail

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "Usage: bash scripts/new-worktree.sh <feature-name>"
  echo ""
  echo "Example: bash scripts/new-worktree.sh prijs-editor"
  echo "  -> branch  feature/prijs-editor"
  echo "  -> path    ../app-dev-os-prijs-editor (sibling of repo root)"
  exit 1
fi

FEATURE="$1"

# Slug the feature name: lowercase, spaces -> hyphens, strip anything not [a-z0-9-/]
FEATURE_SLUG=$(echo "$FEATURE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-/')

if [[ -z "$FEATURE_SLUG" ]]; then
  echo "Error: feature name slugged to empty string. Use [a-z0-9-]." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT="$(basename "$REPO_ROOT")"
BRANCH="feature/${FEATURE_SLUG}"
WORKTREE_PATH="${REPO_ROOT}/../${PROJECT}-${FEATURE_SLUG}"

# Refuse if branch or path already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "Error: branch '${BRANCH}' already exists." >&2
  exit 1
fi

if [[ -e "$WORKTREE_PATH" ]]; then
  echo "Error: path '${WORKTREE_PATH}' already exists." >&2
  exit 1
fi

cd "$REPO_ROOT"
git worktree add -b "$BRANCH" "$WORKTREE_PATH"

echo ""
echo "✓ Worktree created"
echo "  path:   $WORKTREE_PATH"
echo "  branch: $BRANCH"
echo ""
echo "Next:"
echo "  cd \"$WORKTREE_PATH\""
echo "  # optional: set a per-worktree Vite dev port"
echo "  echo 'VITE_DEV_PORT=3001' >> apps/concurrentoolVO/.env.local"
