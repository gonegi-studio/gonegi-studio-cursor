import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

type Status = 'SUCCESS' | 'CLI_ERROR' | 'CODEX_FAILURE' | 'TIMEOUT';

interface CodexEvent {
  type: string;
  [key: string]: unknown;
}

interface RateLimitWindow {
  usedPercent: number;
  windowMinutes: number;
  resetsAt: string;
}

interface CodexUsage {
  status: 'VERIFIED' | 'UNKNOWN';
  reason?: string;
  observedAt?: string;
  planType?: string | null;
  shortTerm?: RateLimitWindow | null;
  weekly?: RateLimitWindow | null;
}

interface BridgeResult {
  status: Status;
  exitCode: number | null;
  command: string[];
  cwd: string;
  agentMessage: string | null;
  lastMessage: string | null;
  tokenUsage: Record<string, number> | null;
  threadId: string | null;
  stderr: string;
  error: string | null;
  codexUsage: CodexUsage;
}

// Codex logs real rate_limits (short-term + weekly, with resets_at) as a
// token_count event, but only in its own session rollout file — never in
// `codex exec --json` stdout. That file is only written when --ephemeral is
// NOT set. So: run without --ephemeral, read the one real usage snapshot
// back out of the file it was forced to create, then delete that file
// ourselves — no session persists past this function returning.
function extractCodexUsage(threadId: string | null): CodexUsage {
  if (!threadId) {
    return { status: 'UNKNOWN', reason: 'no threadId (task did not reach thread.started)' };
  }

  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const sessionsDir = join(codexHome, 'sessions', yyyy, mm, dd);

  let rolloutPath: string | null = null;
  try {
    const match = readdirSync(sessionsDir).find((f) => f.endsWith(`-${threadId}.jsonl`));
    if (match) rolloutPath = join(sessionsDir, match);
  } catch {
    return { status: 'UNKNOWN', reason: `session directory not readable: ${sessionsDir}` };
  }

  if (!rolloutPath) {
    return { status: 'UNKNOWN', reason: `no rollout file found for thread ${threadId} under ${sessionsDir}` };
  }

  try {
    const raw = readFileSync(rolloutPath, 'utf8');
    let lastRateLimits: Record<string, unknown> | null = null;
    for (const line of raw.split('\n')) {
      if (!line.trim() || !line.includes('rate_limits')) continue;
      try {
        const obj = JSON.parse(line) as { payload?: { type?: string; rate_limits?: Record<string, unknown> } };
        if (obj.payload?.type === 'token_count' && obj.payload.rate_limits) {
          lastRateLimits = obj.payload.rate_limits;
        }
      } catch { /* non-JSON or unrelated line, skip */ }
    }

    if (!lastRateLimits) {
      return { status: 'UNKNOWN', reason: 'rollout file found but contained no token_count/rate_limits event' };
    }

    const toWindow = (w: unknown): RateLimitWindow | null => {
      const win = w as { used_percent?: number; window_minutes?: number; resets_at?: number } | null | undefined;
      if (!win || typeof win.used_percent !== 'number' || typeof win.resets_at !== 'number') return null;
      return {
        usedPercent: win.used_percent,
        windowMinutes: win.window_minutes ?? -1,
        resetsAt: new Date(win.resets_at * 1000).toISOString(),
      };
    };

    return {
      status: 'VERIFIED',
      observedAt: now.toISOString(),
      planType: (lastRateLimits.plan_type as string | undefined) ?? null,
      shortTerm: toWindow(lastRateLimits.primary),
      weekly: toWindow(lastRateLimits.secondary),
    };
  } catch (err) {
    return { status: 'UNKNOWN', reason: `failed to read/parse rollout file: ${(err as Error).message}` };
  } finally {
    try { unlinkSync(rolloutPath); } catch { /* best-effort cleanup, not fatal if it fails */ }
  }
}

function readStdinIfPiped(): string {
  if (process.stdin.isTTY) return '';
  try {
    return readFileSync(0, 'utf8').trim();
  } catch {
    return '';
  }
}

function emit(result: BridgeResult): never {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'SUCCESS' ? 0 : 1);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      task: { type: 'string' },
      'task-file': { type: 'string' },
      cwd: { type: 'string' },
      model: { type: 'string' },
      effort: { type: 'string' },
      sandbox: { type: 'string', default: 'read-only' },
      'timeout-ms': { type: 'string', default: '120000' },
    },
  });

  let task = values.task ?? '';
  if (!task && values['task-file']) task = readFileSync(values['task-file'], 'utf8');
  if (!task) task = readStdinIfPiped();

  const cwd = values.cwd ?? process.cwd();

  if (!task.trim()) {
    emit({
      status: 'CLI_ERROR',
      exitCode: null,
      command: [],
      cwd,
      agentMessage: null,
      lastMessage: null,
      tokenUsage: null,
      threadId: null,
      stderr: '',
      error: 'No task provided. Use --task "<text>", --task-file <path>, or pipe stdin.',
      codexUsage: { status: 'UNKNOWN', reason: 'task never ran' },
    });
  }

  const sandbox = values.sandbox ?? 'read-only';
  const timeoutMs = Number(values['timeout-ms'] ?? '120000');

  const tmpDir = mkdtempSync(join(tmpdir(), 'agent-bridge-codex-'));
  const lastMessageFile = join(tmpDir, 'last-message.txt');

  // --skip-git-repo-check: bridge must work from any cwd, not just inside a git repo.
  // (No --ephemeral: this is still a single call, not a session/queue — but Codex's real
  // rate_limits only ever get written to its rollout file, which --ephemeral would suppress.
  // extractCodexUsage() reads that file back once we're done, then deletes it.)
  const args = [
    'exec',
    '--skip-git-repo-check',
    '--json',
    '-o', lastMessageFile,
    '--sandbox', sandbox,
    '-C', cwd,
  ];
  if (values.model) args.push('-m', values.model);
  if (values.effort) args.push('-c', `model_reasoning_effort=${values.effort}`);
  args.push(task);

  const result: BridgeResult = {
    status: 'CLI_ERROR',
    exitCode: null,
    command: ['codex', ...args],
    cwd,
    agentMessage: null,
    lastMessage: null,
    tokenUsage: null,
    threadId: null,
    stderr: '',
    error: null,
    codexUsage: { status: 'UNKNOWN', reason: 'not yet checked' },
  };

  await new Promise<void>((resolve) => {
    let stdoutBuf = '';
    let stderrBuf = '';
    let settled = false;

    // shell:false — task text goes straight into argv, never through a shell parser.
    // stdin:'ignore' — codex checks for piped stdin even with a prompt arg; an open,
    // unwritten pipe there makes it block waiting for EOF that never comes.
    const child = spawn('codex', args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      result.status = 'TIMEOUT';
      result.error = `codex exec exceeded ${timeoutMs}ms timeout`;
      result.codexUsage = { status: 'UNKNOWN', reason: 'task timed out before usage could be read' };
      child.kill('SIGKILL');
      resolve();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { stdoutBuf += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderrBuf += chunk.toString(); });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      result.status = 'CLI_ERROR';
      result.error = `Failed to spawn codex: ${err.message}`;
      result.stderr = stderrBuf;
      result.codexUsage = { status: 'UNKNOWN', reason: 'codex process never started' };
      resolve();
    });

    // 'exit' (process terminated) rather than 'close' (stdio streams closed): codex spawns
    // its own sandbox subprocess, which can keep the stdout/stderr pipes open on Windows
    // even after codex.exe itself is gone, so 'close' may never fire.
    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      result.exitCode = code;
      result.stderr = stderrBuf;

      const events: CodexEvent[] = [];
      for (const line of stdoutBuf.split('\n').map((l) => l.trim()).filter(Boolean)) {
        try { events.push(JSON.parse(line)); } catch { /* non-JSON line from codex, skip */ }
      }

      const started = events.find((e) => e.type === 'thread.started');
      if (started) result.threadId = (started.thread_id as string) ?? null;

      const agentMsg = [...events].reverse().find(
        (e) => e.type === 'item.completed' && (e.item as { type?: string } | undefined)?.type === 'agent_message',
      );
      if (agentMsg) result.agentMessage = ((agentMsg.item as { text?: string }).text) ?? null;

      const turnCompleted = events.find((e) => e.type === 'turn.completed');
      if (turnCompleted?.usage) result.tokenUsage = turnCompleted.usage as Record<string, number>;

      const turnFailed = events.find((e) => e.type === 'turn.failed' || e.type === 'error');

      try {
        result.lastMessage = readFileSync(lastMessageFile, 'utf8').trim();
      } catch { /* codex did not write the file (crash before completion) */ }

      if (code === 0 && result.agentMessage) {
        result.status = 'SUCCESS';
      } else if (events.length === 0) {
        result.status = 'CLI_ERROR';
        result.error = `codex exec exited ${code} before producing any JSON events. stderr: ${stderrBuf.slice(0, 2000)}`;
      } else {
        result.status = 'CODEX_FAILURE';
        result.error = turnFailed
          ? `Codex turn failed: ${JSON.stringify(turnFailed)}`
          : `codex exec exited ${code} with no agent_message (possible refusal or empty turn).`;
      }

      result.codexUsage = extractCodexUsage(result.threadId);

      resolve();
    });
  });

  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best-effort cleanup */ }

  emit(result);
}

main();
