#!/usr/bin/env bash
# Install version-controlled git hooks.
#
# Points git at `scripts/git-hooks/` instead of `.git/hooks/`. This way the
# hooks live in version control and survive every clone — not in the per-clone
# `.git/` folder.
#
# Run this once per clone, after `git init` (or after cloning a fresh app):
#   bash scripts/install-git-hooks.sh
#
# Hooks installed:
#   - pre-commit  →  runs `pnpm tsc --noEmit` (typecheck) before every commit

set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "[install-git-hooks] git not found in PATH. Install git first." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[install-git-hooks] Not inside a git repo. Run \`git init\` first." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_DIR="$REPO_ROOT/scripts/git-hooks"

if [[ ! -d "$HOOK_DIR" ]]; then
  echo "[install-git-hooks] Expected hooks at $HOOK_DIR but folder is missing." >&2
  exit 1
fi

# Make hooks executable (no-op on Windows, but git respects the file mode in the index)
chmod +x "$HOOK_DIR"/* 2>/dev/null || true

# Tell git to use this folder for hooks
git config core.hooksPath "scripts/git-hooks"

echo "[install-git-hooks] Done. Git will now use scripts/git-hooks/ for all hooks."
echo "[install-git-hooks] Active hooks:"
ls -1 "$HOOK_DIR" | sed 's/^/  - /'
