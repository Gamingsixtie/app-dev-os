#!/usr/bin/env node
// Lockfile Guard — PreToolUse hook (Edit|Write)
// Blocks direct edits to package lockfiles outside `tool-` skills.
//
// Lockfiles are generated artefacts. Hand-editing them invites:
//   - merge-conflict pain
//   - dependency-graph corruption
//   - cache invalidation bugs
//
// Use the package manager (npm install, pnpm add, etc.) instead.
// To bypass: invoke a `tool-`-prefixed skill which is whitelisted.

const LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'poetry.lock',
  'uv.lock',
  'Pipfile.lock',
  'Cargo.lock',
  'Gemfile.lock',
  'composer.lock',
];

function isLockfile(filePath) {
  if (!filePath) return false;
  const basename = filePath.split(/[\\/]/).pop();
  return LOCKFILES.includes(basename);
}

function calledFromToolSkill() {
  // Heuristic: look at SKILL_PATH env var if Claude Code provides it,
  // otherwise check stack via parent dirs of the tool — safer to deny by default.
  const skillPath = process.env.SKILL_NAME || process.env.CLAUDE_SKILL_NAME || '';
  return /^tool-/.test(skillPath);
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
    if (!isLockfile(filePath)) {
      process.exit(0);
    }
    if (calledFromToolSkill()) {
      process.exit(0);
    }
    process.stderr.write(
      `[lockfile-guard] BLOCKED: direct edit to ${filePath}\n` +
      `Lockfiles are generated. Use the package manager:\n` +
      `  npm install <pkg>     pnpm add <pkg>     yarn add <pkg>\n` +
      `  bun add <pkg>         poetry add <pkg>   uv add <pkg>\n` +
      `If you genuinely need to hand-edit, invoke a tool- skill or run the command in a terminal.`
    );
    process.exit(2);
  } catch {
    process.exit(0);
  }
});
