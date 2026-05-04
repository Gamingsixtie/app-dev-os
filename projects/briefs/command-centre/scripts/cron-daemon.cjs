#!/usr/bin/env node
// Minimal cron daemon for App-Dev OS.
//
// Reads cron/jobs/*.md (YAML frontmatter + prompt body), schedules active
// jobs by time + days, and invokes `claude --print` non-interactively when
// a job fires. State is kept in .command-centre/ (PID file, lock file,
// log file). No SQLite — that integration belongs to the Command Centre UI
// which is not installed in this workspace.
//
// Commands: start | stop | status | logs | run-job <slug>

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const JOBS_DIR = path.join(REPO_ROOT, 'cron', 'jobs');
const STATE_DIR = path.join(REPO_ROOT, '.command-centre');
const PID_FILE = path.join(STATE_DIR, 'cron-daemon.pid');
const LOCK_FILE = path.join(STATE_DIR, 'cron-runtime.lock');
const LOG_FILE = path.join(STATE_DIR, 'cron-daemon.log');

fs.mkdirSync(STATE_DIR, { recursive: true });

// --------------------------------------------------------------------------
// YAML frontmatter parser — supports the small subset our jobs use:
// scalar strings, quoted strings, simple key: value pairs.
// --------------------------------------------------------------------------
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    meta[kv[1]] = value;
  }
  return { meta, body: match[2] };
}

// --------------------------------------------------------------------------
// Schedule parsing
// --------------------------------------------------------------------------
const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_GROUPS = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [1, 2, 3, 4, 5],
  weekends: [0, 6],
};

function parseDays(daysStr) {
  const lower = (daysStr || '').toLowerCase().trim();
  if (DAY_GROUPS[lower]) return DAY_GROUPS[lower];
  return lower
    .split(/[,\s]+/)
    .map((d) => DAY_MAP[d.slice(0, 3)])
    .filter((d) => d !== undefined);
}

function parseTime(timeStr) {
  const m = (timeStr || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

function parseTimeout(s) {
  const m = (s || '30m').match(/^(\d+)\s*([smh]?)$/);
  if (!m) return 30 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2] || 'm';
  if (unit === 's') return n * 1000;
  if (unit === 'h') return n * 3600 * 1000;
  return n * 60 * 1000;
}

function nextFireTime(job, from = new Date()) {
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(job.time.hour, job.time.minute, 0, 0);
    if (candidate <= from) continue;
    if (job.days.includes(candidate.getDay())) return candidate;
  }
  return null;
}

// --------------------------------------------------------------------------
// Job loading
// --------------------------------------------------------------------------
function loadJob(file) {
  const slug = file.replace(/\.md$/, '');
  const content = fs.readFileSync(path.join(JOBS_DIR, file), 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) return null;
  const { meta, body } = parsed;
  const time = parseTime(meta.time);
  const days = parseDays(meta.days);
  return {
    slug,
    name: meta.name || slug,
    active: meta.active === 'true',
    time,
    days,
    timeoutMs: parseTimeout(meta.timeout),
    model: meta.model || 'sonnet',
    description: meta.description || '',
    prompt: body.trim(),
    file,
  };
}

function loadActiveJobs() {
  if (!fs.existsSync(JOBS_DIR)) return [];
  const files = fs.readdirSync(JOBS_DIR).filter((f) => f.endsWith('.md'));
  const jobs = [];
  for (const file of files) {
    const job = loadJob(file);
    if (!job) continue;
    if (!job.active) continue;
    if (!job.time || job.days.length === 0) continue;
    jobs.push(job);
  }
  return jobs;
}

// --------------------------------------------------------------------------
// Logging
// --------------------------------------------------------------------------
function log(line) {
  const ts = new Date().toISOString();
  const message = `[${ts}] ${line}\n`;
  try { fs.appendFileSync(LOG_FILE, message); } catch (err) {
    process.stderr.write(`(log write failed: ${err.message})\n`);
  }
  process.stdout.write(message);
}

// --------------------------------------------------------------------------
// Job execution — spawns `claude --print` with the prompt on stdin
// --------------------------------------------------------------------------
function runJob(job) {
  log(`▶ Starting job: ${job.slug} (${job.name})`);
  const startedAt = Date.now();

  const claudeCmd = process.env.CLAUDE_CMD || 'claude';
  const args = [
    '--print',
    '--model', job.model,
    '--permission-mode', 'bypassPermissions',
  ];

  let child;
  try {
    child = spawn(claudeCmd, args, {
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
  } catch (err) {
    log(`✗ Failed to spawn claude for ${job.slug}: ${err.message}`);
    return;
  }

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });

  const timer = setTimeout(() => {
    log(`✗ Job ${job.slug} timed out after ${Math.round(job.timeoutMs / 1000)}s — killing`);
    try { child.kill('SIGTERM'); } catch {}
  }, job.timeoutMs);

  child.on('error', (err) => {
    clearTimeout(timer);
    log(`✗ claude spawn error for ${job.slug}: ${err.message}`);
  });

  child.on('exit', (code) => {
    clearTimeout(timer);
    const durSec = Math.round((Date.now() - startedAt) / 1000);
    if (code === 0) {
      log(`✓ Job ${job.slug} finished in ${durSec}s`);
      const tail = stdout.split('\n').slice(-6).join('\n').trim();
      if (tail) log(`  output tail:\n${tail}`);
    } else {
      log(`✗ Job ${job.slug} exited with code ${code} after ${durSec}s`);
      const errTail = stderr.split('\n').slice(0, 3).join(' | ').trim();
      if (errTail) log(`  stderr: ${errTail}`);
    }
  });

  try {
    child.stdin.write(job.prompt);
    child.stdin.end();
  } catch (err) {
    log(`✗ Failed to send prompt to ${job.slug}: ${err.message}`);
  }
}

// --------------------------------------------------------------------------
// PID + lock helpers
// --------------------------------------------------------------------------
function readPid() {
  try { return parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10) || null; }
  catch { return null; }
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; }
  catch { return false; }
}

function isDaemonRunning() {
  return isProcessAlive(readPid());
}

function clearStaleState() {
  for (const f of [PID_FILE, LOCK_FILE]) {
    try { fs.unlinkSync(f); } catch {}
  }
}

// --------------------------------------------------------------------------
// Commands
// --------------------------------------------------------------------------
function cmdStart() {
  if (isDaemonRunning()) {
    console.error(`Daemon already running (PID ${readPid()}). Run 'bash scripts/stop-crons.sh' first.`);
    process.exit(1);
  }
  clearStaleState();

  fs.writeFileSync(PID_FILE, String(process.pid));
  fs.writeFileSync(LOCK_FILE, JSON.stringify({
    host: 'cli-daemon',
    pid: process.pid,
    startedAt: new Date().toISOString(),
  }, null, 2));

  log(`Daemon started (PID ${process.pid})`);

  const jobs = loadActiveJobs();
  log(`Loaded ${jobs.length} active job(s):`);
  for (const j of jobs) {
    const next = nextFireTime(j);
    log(`  - ${j.slug} → next fire: ${next ? next.toISOString() : 'never'}`);
  }

  function scheduleNext(job) {
    const next = nextFireTime(job);
    if (!next) {
      log(`✗ No next fire time for ${job.slug} — skipping`);
      return;
    }
    const delay = next.getTime() - Date.now();
    setTimeout(() => {
      runJob(job);
      scheduleNext(job);
    }, delay);
  }
  for (const j of jobs) scheduleNext(j);

  function shutdown() {
    log('Daemon stopping');
    clearStaleState();
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log('Scheduling complete — daemon attached. Press Ctrl+C to stop.');
}

function cmdStop() {
  const pid = readPid();
  if (!pid || !isProcessAlive(pid)) {
    console.log('No daemon running.');
    clearStaleState();
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Sent SIGTERM to PID ${pid}.`);
  } catch (err) {
    console.error(`Failed to stop PID ${pid}: ${err.message}`);
    process.exit(1);
  }
}

function cmdStatus() {
  const pid = readPid();
  const running = isProcessAlive(pid);
  const jobs = loadActiveJobs();

  if (running) {
    let lock = {};
    try { lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')); } catch {}
    console.log(`Daemon: running (PID ${pid}, host: ${lock.host || '?'}, started: ${lock.startedAt || '?'})`);
  } else {
    console.log('Daemon: not running');
    if (pid) clearStaleState();
  }

  console.log(`Active jobs: ${jobs.length}`);
  for (const j of jobs) {
    const next = nextFireTime(j);
    console.log(`  ${j.slug.padEnd(28)} next: ${next ? next.toISOString() : 'never'}`);
  }
}

function cmdLogs() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No logs yet (daemon never started).');
    return;
  }
  process.stdout.write(fs.readFileSync(LOG_FILE, 'utf8'));
  if (!isDaemonRunning()) return;

  let size = fs.statSync(LOG_FILE).size;
  setInterval(() => {
    try {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size <= size) return;
      const fd = fs.openSync(LOG_FILE, 'r');
      const buf = Buffer.alloc(stat.size - size);
      fs.readSync(fd, buf, 0, buf.length, size);
      fs.closeSync(fd);
      process.stdout.write(buf.toString('utf8'));
      size = stat.size;
    } catch {}
  }, 1000);
}

function cmdRunJob(slug) {
  if (!slug) {
    console.log('Usage: bash scripts/run-job.sh <job-slug>');
    console.log('');
    console.log('Available jobs:');
    if (fs.existsSync(JOBS_DIR)) {
      for (const f of fs.readdirSync(JOBS_DIR)) {
        if (!f.endsWith('.md')) continue;
        const job = loadJob(f);
        if (!job) continue;
        const flag = job.active ? '✓ active' : '○ inactive';
        console.log(`  ${flag}  ${job.slug.padEnd(28)} ${job.name}`);
      }
    }
    return;
  }
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(JOBS_DIR, file))) {
    console.error(`Job not found: ${slug}`);
    process.exit(1);
  }
  const job = loadJob(file);
  if (!job) {
    console.error(`Could not parse ${file}`);
    process.exit(1);
  }
  runJob(job);
}

// --------------------------------------------------------------------------
// Entry
// --------------------------------------------------------------------------
const cmd = process.argv[2];
const rest = process.argv.slice(3);

switch (cmd) {
  case 'start':   cmdStart(); break;
  case 'stop':    cmdStop(); break;
  case 'status':  cmdStatus(); break;
  case 'logs':    cmdLogs(); break;
  case 'run-job': cmdRunJob(rest[0]); break;
  default:
    console.error('Usage: cron-daemon.cjs <start|stop|status|logs|run-job [slug]>');
    process.exit(1);
}
