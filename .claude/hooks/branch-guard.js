#!/usr/bin/env node
// Branch Guard — PreToolUse hook
// Single-branch workflow (per ADR-0007 superseding ADR-0005's branching model):
//   - feature/<slug> branches are the working space
//   - main is the deploy branch (Vercel auto-deploys on push)
//   - merge is direct (squash), no PR ceremony, no CI gate
//
// This hook is now ADVISORY only — it never blocks. It prints a warning when
// the user is about to write/commit/push directly on main, so accidental
// edits on the wrong branch are visible but not stopped.

const { execSync } = require('child_process');

// Zone classification patterns
const CODE_PATTERNS = [
  /projects\/briefs\/command-centre\/src\//,
  /\.claude\/hooks\/.*\.(js|ts)$/,
];

const CONFIG_PATTERNS = [
  /\.claude\/skills\/.*\/SKILL\.md$/,
  /^AGENTS\.md$/,
  /^CLAUDE\.md$/,
  /^\.env\.example$/,
  /^scripts\/.*\.sh$/,
];

const CONTENT_PATTERNS = [
  /^projects\//,
  /^brand_context\//,
  /^context\//,
  /^cron\/jobs\//,
  /^clients\//,
];

function classifyFile(filePath) {
  // Normalize to repo-relative path
  const rel = filePath.replace(/^.*?(?=projects\/|brand_context\/|context\/|cron\/|clients\/|\.claude\/|AGENTS\.md|CLAUDE\.md|\.env\.example|scripts\/)/, '');

  for (const p of CODE_PATTERNS) {
    if (p.test(rel)) return 'code';
  }
  for (const p of CONFIG_PATTERNS) {
    if (p.test(rel)) return 'config';
  }
  for (const p of CONTENT_PATTERNS) {
    if (p.test(rel)) return 'content';
  }
  return 'unknown';
}

function classifyFiles(files) {
  let highest = 'content';
  for (const f of files) {
    const zone = classifyFile(f);
    if (zone === 'code') return 'code';
    if (zone === 'config') highest = 'config';
  }
  return highest;
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', timeout: 3000 }).trim();
  } catch {
    return 'unknown';
  }
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8', timeout: 3000 }).trim();
    return output ? output.split('\n') : [];
  } catch {
    return [];
  }
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
    const toolInput = data.tool_input || {};

    const branch = getCurrentBranch();

    // feature/* and worktree-* branches: always allow
    if (branch.startsWith('feature/') || branch.startsWith('worktree-')) {
      process.exit(0);
    }

    let zone = 'unknown';
    let filePath = '';

    if (toolName === 'Write' || toolName === 'Edit') {
      filePath = toolInput.file_path || '';
      zone = classifyFile(filePath);
    } else if (toolName === 'Bash') {
      const cmd = toolInput.command || '';

      // Only inspect git commit and git push commands
      if (!/git\s+(commit|push)/.test(cmd)) {
        process.exit(0);
      }

      if (/git\s+commit/.test(cmd)) {
        const staged = getStagedFiles();
        if (staged.length === 0) {
          process.exit(0);
        }
        zone = classifyFiles(staged);
      } else if (/git\s+push/.test(cmd)) {
        // For push, warn if on main regardless
        zone = 'code';
      }
    } else {
      process.exit(0);
    }

    // Advisory warning on main/master/production — never block.
    // Per ADR-0007: single-branch workflow allows direct work on main, but the
    // user explicitly opted in to a manual pre-merge test discipline. Surface a
    // reminder without stopping the action.
    if (branch === 'main' || branch === 'master' || branch === 'production') {
      const message =
        `[branch-guard] You are working directly on '${branch}'. ` +
        `Per ADR-0007 this is allowed, but the manual pre-merge test ritual ` +
        `(npm run build + npx vitest run on the source feature branch) is your ` +
        `responsibility — there is no CI gate. A push to main triggers a Vercel ` +
        `production deploy.`;

      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: message,
        },
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // Other branches (feature/*, worktree-*, anything else): no message.
    process.exit(0);
  } catch {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});
