#!/usr/bin/env node
// Typecheck Guard — PreToolUse hook (Edit) on TS/TSX/PY edits
// Advisory by default: emits a reminder to run typecheck before commit.
// Set TYPECHECK_GUARD_BLOCK=1 to escalate to a hard block when typecheck
// fails on the changed file (slower but stricter — opt-in per workspace).

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TYPED_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.py'];

function isTyped(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  return TYPED_EXTENSIONS.includes(ext);
}

function findRepoRoot(start) {
  let dir = path.resolve(start);
  while (dir !== path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'pyproject.toml')) ||
      fs.existsSync(path.join(dir, '.git'))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

function detectTypechecker(repoRoot, filePath) {
  if (!repoRoot) return null;
  const ext = path.extname(filePath).toLowerCase();
  if (['.ts', '.tsx', '.mts', '.cts'].includes(ext)) {
    if (fs.existsSync(path.join(repoRoot, 'tsconfig.json'))) {
      return { tool: 'tsc', cmd: 'npx tsc --noEmit' };
    }
  }
  if (ext === '.py') {
    if (fs.existsSync(path.join(repoRoot, 'pyproject.toml'))) {
      const pyproject = fs.readFileSync(path.join(repoRoot, 'pyproject.toml'), 'utf8');
      if (/\[tool\.mypy\]/.test(pyproject)) {
        return { tool: 'mypy', cmd: 'mypy --no-error-summary' };
      }
    }
  }
  return null;
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 4000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    if (toolName !== 'Edit' && toolName !== 'Write') {
      process.exit(0);
    }
    const filePath = (data.tool_input || {}).file_path || '';
    if (!isTyped(filePath)) {
      process.exit(0);
    }

    const repoRoot = findRepoRoot(filePath);
    const checker = detectTypechecker(repoRoot, filePath);
    if (!checker) {
      // No typechecker config; advisory only.
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: `[typecheck-guard] Editing typed file (${path.basename(filePath)}). No project typechecker config detected — skip.`,
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Advisory: remind to run typecheck.
    const advisory = `[typecheck-guard] Reminder: run \`${checker.cmd}\` before declaring this done. ${checker.tool} catches what your IDE doesn't.`;

    if (process.env.TYPECHECK_GUARD_BLOCK === '1') {
      // Strict mode: actually run typecheck and block on failure.
      try {
        execSync(`${checker.cmd} ${JSON.stringify(filePath)}`, {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000,
        });
        process.exit(0);
      } catch (err) {
        const stderr = (err.stderr || err.stdout || '').toString().slice(0, 1000);
        process.stderr.write(
          `[typecheck-guard] BLOCKED: ${checker.tool} failed on ${filePath}\n${stderr}`
        );
        process.exit(2);
      }
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: advisory,
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch {
    process.exit(0);
  }
});
