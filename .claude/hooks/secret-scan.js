#!/usr/bin/env node
// Secret Scan — PreToolUse hook (Write|Edit|Bash)
// Blocks attempts to write/edit secrets or run commands that expose them.
//
// Detects: API keys, private keys, .env values, common token formats.
// Exits 2 with stderr message to block the operation.

const SECRET_PATTERNS = [
  // Generic API key assignments (keys with optional dollar quoted strings, etc.)
  /\b[A-Z][A-Z0-9_]*(?:_API_KEY|_SECRET|_TOKEN|_PASSWORD|_PRIVATE_KEY)\s*=\s*["']?[A-Za-z0-9_+/=\-]{16,}/,
  // PEM private keys
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
  // AWS access key id
  /\bAKIA[0-9A-Z]{16}\b/,
  // GitHub tokens
  /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/,
  // OpenAI keys
  /\bsk-(?:proj-)?[A-Za-z0-9_\-]{32,}\b/,
  // Anthropic keys
  /\bsk-ant-[A-Za-z0-9_\-]{40,}\b/,
  // Slack tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  // Generic 40+ char tokens after key= or token=
  /\b(?:apikey|api_key|access_token|auth_token|bearer)["':\s=]+["']?[A-Za-z0-9_\-+/=]{32,}/i,
];

function scanContent(content) {
  if (!content) return null;
  for (const pattern of SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const sample = match[0].slice(0, 40);
      return `Pattern matched: ${sample}…`;
    }
  }
  return null;
}

function scanForEnvFileRead(cmd) {
  // Block reads of .env files via cat, grep, head, etc.
  if (/(?:^|[\s|;&])(?:cat|less|more|head|tail|grep|awk|sed)\s+[^|]*\.env(?:\.[a-z]+)?(?:\s|$|>|\|)/.test(cmd)) {
    return '.env file read attempt detected';
  }
  // Block git commands that would commit .env
  if (/git\s+add\s+.*\.env(?:\.[a-z]+)?(?:\s|$)/.test(cmd) && !/\.env\.example/.test(cmd)) {
    return 'git add of .env file detected';
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
    const toolInput = data.tool_input || {};

    let reason = null;

    if (toolName === 'Write' || toolName === 'Edit') {
      const content = toolInput.content || toolInput.new_string || '';
      reason = scanContent(content);
    } else if (toolName === 'Bash') {
      const cmd = toolInput.command || '';
      reason = scanForEnvFileRead(cmd) || scanContent(cmd);
    }

    if (reason) {
      process.stderr.write(
        `[secret-scan] BLOCKED: ${reason}\n` +
        `Refusing to proceed. Move secrets to .env (gitignored) and reference via env var.\n` +
        `If this is a false positive, edit .claude/hooks/secret-scan.js to refine patterns.`
      );
      process.exit(2);
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
});
