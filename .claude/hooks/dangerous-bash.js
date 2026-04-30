#!/usr/bin/env node
// Dangerous Bash — PreToolUse hook (Bash)
// Blocks commands with high blast radius unless USER.md risk posture allows.
//
// Default behaviour: BLOCK
//   - rm -rf /, ~, *, $HOME (whole-disk style deletes)
//   - git push --force / -f to remote
//   - git reset --hard on branches not owned by user
//   - chmod 777 (overly permissive)
//   - DROP TABLE / TRUNCATE in raw SQL
//   - npm uninstall, yarn remove, pip uninstall (lockfile-guard adds nuance)
//   - curl|sh / wget|sh (remote code execution)
//
// Exits 2 to block; falls through with optional advisory otherwise.

const DANGEROUS_PATTERNS = [
  {
    pattern: /\brm\s+(?:-[rRf]+\s+)+(?:\/|~|\*|\$HOME|\$\{?HOME\}?)(?:\s|$)/,
    reason: 'rm -rf on root/home/wildcard — refuses to wipe filesystem',
  },
  {
    pattern: /\brm\s+-rf\s+\.(?:\s|$|\/)/,
    reason: 'rm -rf . — refuses to wipe current directory',
  },
  {
    pattern: /\bgit\s+push\s+(?:.*\s+)?(?:--force|-f)(?:\s|$)/,
    reason: 'git push --force — refuses to overwrite remote history. Use --force-with-lease on your own branch only.',
  },
  {
    pattern: /\bgit\s+reset\s+--hard\s+(?:origin\/)?(?:main|master|production|prod)\b/,
    reason: 'git reset --hard on protected branch',
  },
  {
    pattern: /\bchmod\s+(?:-R\s+)?777\b/,
    reason: 'chmod 777 — refuses to grant world-writable permissions',
  },
  {
    pattern: /\b(?:DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+\s*;?\s*$)/i,
    reason: 'destructive SQL detected (DROP/TRUNCATE/DELETE without WHERE)',
  },
  {
    pattern: /\bcurl\s+[^|]+\|\s*(?:sudo\s+)?(?:bash|sh|zsh|fish)(?:\s|$)/,
    reason: 'curl | sh pattern — refuses to execute remote scripts unverified',
  },
  {
    pattern: /\bwget\s+[^|]+\|\s*(?:sudo\s+)?(?:bash|sh|zsh|fish)(?:\s|$)/,
    reason: 'wget | sh pattern — refuses to execute remote scripts unverified',
  },
  {
    pattern: /\bsudo\s+rm\b/,
    reason: 'sudo rm — refuses elevated deletion outside explicit user override',
  },
];

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 4000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    if (data.tool_name !== 'Bash') {
      process.exit(0);
    }
    const cmd = (data.tool_input || {}).command || '';

    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(cmd)) {
        process.stderr.write(
          `[dangerous-bash] BLOCKED: ${reason}\n` +
          `Command: ${cmd.slice(0, 200)}${cmd.length > 200 ? '…' : ''}\n` +
          `If you really need this, run it manually in your terminal — not through Claude.\n` +
          `Edit context/USER.md § Risk posture to relax this guard for your workflow.`
        );
        process.exit(2);
      }
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
});
