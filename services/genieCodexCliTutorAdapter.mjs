// Dormant adapter: importing this module never invokes Codex or writes evidence.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { repositoryEvidenceReader, validateTutorProblemContext, validateTutorCandidate } from './genieExternalTutorConsultationContract.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const check = (ok, message) => { if (!ok) throw new Error(`CODEX_TUTOR_ADAPTER: ${message}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const fields = ['validation', 'missing_knowledge', 'alternative_reasoning'];

// Caller provisions the evidence directory. Exclusive creation prevents overwriting prior runs.
export function appendOnlyTutorEvidenceStore(root) {
  const base = realpathSync(root);
  return {
    readEvidence: repositoryEvidenceReader(base),
    writeEvidence(ref, bytes) {
      check(text(ref) && !isAbsolute(ref) && !ref.includes(':') && !ref.includes('\\') && !ref.split('/').includes('..'), 'evidence path');
      const destination = resolve(base, ref), parent = realpathSync(dirname(destination));
      const rel = relative(base, parent);
      check(!isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\'), 'evidence containment');
      writeFileSync(destination, bytes, { flag: 'wx' });
    },
  };
}

// Shared by every response shape this adapter supports: exactly one completed
// turn carrying exactly one agent_message, itself a JSON object. What fields
// that object must contain is the caller's concern, not this parser's.
function parseSingleCodexTurnMessage(stdout) {
  const lines = new TextDecoder('utf-8', { fatal: true }).decode(stdout).split(/\r?\n/).filter(s => s.trim());
  check(lines.length > 0, 'empty stdout');
  let started = false, completed = false, thread = false;
  const messages = [];
  for (const line of lines) {
    const event = JSON.parse(line);
    check(event && typeof event === 'object' && !Array.isArray(event) && text(event.type), 'invalid JSONL event');
    check(!completed, 'event after turn.completed');
    if (event.type === 'thread.started') {
      check(!thread && !started && text(event.thread_id), 'thread.started'); thread = true;
    } else if (event.type === 'turn.started') {
      check(!started, 'multiple turns forbidden'); started = true;
    } else if (['item.started', 'item.updated', 'item.completed'].includes(event.type)) {
      check(started && event.item && text(event.item.type), 'item outside turn');
      if (event.type === 'item.completed' && event.item.type === 'agent_message') {
        check(text(event.item.text), 'empty agent_message'); messages.push(event.item.text);
      }
    } else if (event.type === 'turn.completed') {
      check(started, 'completion without turn'); completed = true;
    } else throw new Error(`CODEX_TUTOR_ADAPTER: failure/unsupported event ${event.type}`);
  }
  check(completed && messages.length === 1, 'one completed turn and one agent_message required');
  return JSON.parse(messages[0]);
}

export function parseCodexTutorJsonl(stdout) {
  const answer = parseSingleCodexTurnMessage(stdout);
  check(answer && typeof answer === 'object' && !Array.isArray(answer) &&
    Object.keys(answer).length === fields.length && fields.every(k => text(answer[k])), 'exact three response elements required');
  return answer;
}

const MEMORY_POINTER_SELECTION_REASON = 'NATURAL_LANGUAGE_RETRIEVAL_FALLBACK';

/**
 * CR-18: the response for this reason is exactly one field, selected_experience_id,
 * either the literal string 'NONE' or one of the experience_id values the query's
 * own candidates array offered. No score, rank, or confidence is ever accepted --
 * there is nothing numeric to parse. An id outside the offered set is never
 * accepted as a pointer: it fails closed to 'NONE', with the raw value preserved
 * only for audit, never treated as a match.
 */
export function parseCodexMemoryPointerJsonl(stdout, candidateIds) {
  const answer = parseSingleCodexTurnMessage(stdout);
  check(answer && typeof answer === 'object' && !Array.isArray(answer) &&
    Object.keys(answer).length === 1 && Object.hasOwn(answer, 'selected_experience_id') &&
    text(answer.selected_experience_id), 'exact one response element (selected_experience_id) required');
  const raw = answer.selected_experience_id;
  if (raw === 'NONE' || candidateIds.has(raw)) return { selected_experience_id: raw };
  return { selected_experience_id: 'NONE', hallucinated_raw_value: raw };
}

function captureProcess(executable, args, cwd, stdin, timeoutMs, spawnProcess) {
  return new Promise(resolveResult => {
    const out = [], err = []; let spawnError, inputError, timedOut = false, child;
    try { child = spawnProcess(executable, args, { cwd, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (error) { resolveResult({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), exit_code: null, signal: null, spawn_error: error.message }); return; }
    child.stdout.on('data', chunk => out.push(Buffer.from(chunk)));
    child.stderr.on('data', chunk => err.push(Buffer.from(chunk)));
    child.on('error', error => { spawnError = error.message; });
    child.stdin.on('error', error => { inputError = error.message; });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolveResult({ stdout: Buffer.concat(out), stderr: Buffer.concat(err), exit_code: code,
        signal: signal ?? null, spawn_error: spawnError ?? null, stdin_error: inputError ?? null, timed_out: timedOut });
    });
    child.stdin.end(stdin);
  });
}

export async function runCodexCliTutorAdapter(input, io, spawnProcess = spawn) {
  // 1. Validate the exact query bytes before any subprocess or evidence write.
  const bytes = io.readEvidence(input.query_ref);
  check(/^[a-f0-9]{64}$/.test(input.query_sha256) && sha(bytes) === input.query_sha256, 'query SHA mismatch');
  const query = JSON.parse(bytes.toString());
  check(text(query.candidate_id) && query.provider === 'openai' && query.access_path === 'CLI_SUBSCRIPTION' &&
    text(query.requested_model) && !query.requested_model.startsWith('-') && !/\s|\0/.test(query.requested_model) &&
    query.model === query.requested_model && text(query.selection_reason) && text(query.query), 'query identity');
  check(query.provisional_judgment?.status === 'provisional' && text(query.provisional_judgment.text) &&
    Array.isArray(query.provisional_judgment.evidence_refs) && query.provisional_judgment.evidence_refs.length > 0, 'provisional judgment');
  for (const ref of query.provisional_judgment.evidence_refs) io.readEvidence(ref);
  validateTutorProblemContext(query.problem_context, io.readEvidence);
  check(isAbsolute(input.executable) && isAbsolute(input.cwd) && text(input.evidence_prefix), 'explicit executable/cwd/evidence prefix');
  check(Number.isInteger(input.timeout_ms) && input.timeout_ms > 0, 'explicit timeout required');
  // 2. Fixed argv, explicit provider; no shell, custom extra arguments or implicit provider fallback.
  const args = ['--ask-for-approval', 'never', 'exec', '--json', '--ephemeral', '-s', 'read-only',
    '-m', query.requested_model, '--ignore-user-config', '-c', 'model_provider="openai"', '-'];
  const refs = Object.fromEntries(['invocation.json', 'stdout.bin', 'stderr.bin', 'exit.json', 'response.json'].map(name =>
    [name, `${input.evidence_prefix}/${name}`]));
  check(!Object.values(refs).includes(input.query_ref), 'query/evidence collision');
  // Reserve append-only run evidence before execution. Reusing a prefix fails before spawning.
  const invocation = Buffer.from(JSON.stringify({ candidate_id: query.candidate_id, executable: input.executable,
    args, cwd: input.cwd, query_ref: input.query_ref, query_sha256: input.query_sha256 }));
  io.writeEvidence(refs['invocation.json'], invocation);
  // 3. Exactly one process; stdin is byte-for-byte the SHA-validated query, without appended prompts.
  const raw = await captureProcess(input.executable, args, input.cwd, bytes, input.timeout_ms, spawnProcess);
  // 4. Preserve raw channels and process status even when parsing or execution fails.
  io.writeEvidence(refs['stdout.bin'], raw.stdout); io.writeEvidence(refs['stderr.bin'], raw.stderr);
  const { stdout, stderr, ...exit } = raw;
  const exitBytes = Buffer.from(JSON.stringify(exit)); io.writeEvidence(refs['exit.json'], exitBytes);
  let status = 'RECEIVED', answer, error;
  // 5. Exit success alone is insufficient; JSONL and exact response shape must also pass.
  try {
    check(raw.exit_code === 0 && !raw.signal && !raw.spawn_error && !raw.stdin_error && !raw.timed_out, 'subprocess did not complete successfully');
    answer = parseCodexTutorJsonl(raw.stdout);
  } catch (failure) { status = 'FAILED'; error = failure.message; }
  const response = { candidate_id: query.candidate_id, provider: query.provider, model: query.requested_model,
    access_path: query.access_path, requested_model: query.requested_model, actual_model: 'UNKNOWN',
    query_evidence_sha256: input.query_sha256, status, ...(answer ?? { error }),
    raw_evidence: { stdout_ref: refs['stdout.bin'], stdout_sha256: sha(stdout), stderr_ref: refs['stderr.bin'],
      stderr_sha256: sha(stderr), exit_ref: refs['exit.json'], exit_sha256: sha(exitBytes),
      invocation_ref: refs['invocation.json'], invocation_sha256: sha(invocation) } };
  const responseBytes = Buffer.from(JSON.stringify(response)); io.writeEvidence(refs['response.json'], responseBytes);
  // 6. Existing contract validation. Return only; do not persist Candidate/OJT or infer Outcome.
  const candidate = { record_type: 'CANDIDATE', candidate_id: query.candidate_id, decision: { status: 'provisional' },
    knowledge_status: 'CANDIDATE_ONLY', automatic_fallback: false, consultation_kind: 'FIRST', consultation_status: status,
    selected_tutor: { provider: query.provider, model: query.requested_model },
    links: { provenance_source: 'EXTERNAL', external_source: { provider: query.provider, model: query.requested_model,
      access_path: query.access_path, requested_model: query.requested_model, actual_model: 'UNKNOWN',
      selection_reason: query.selection_reason, query_evidence_ref: input.query_ref, query_evidence_sha256: input.query_sha256,
      response_evidence_ref: refs['response.json'], response_evidence_sha256: sha(responseBytes), ...(answer ?? {}) } } };
  validateTutorCandidate(candidate, io.readEvidence);
  return { candidate, response, raw_evidence: response.raw_evidence };
}

/**
 * CR-18 memory-pointer consultation: reuses every mechanic of
 * runCodexCliTutorAdapter (SHA-validated stdin, fixed argv, append-only
 * evidence, exact-shape parsing, existing validateTutorCandidate contract) --
 * only the query/response shape differs. The caller supplies real
 * {experience_id, problem} candidates already known to exist in the live
 * canonical Experience set (from the unchanged exact-key/literal/bridge
 * retrieval it already ran and that already returned nothing); the query
 * carries no provisional_judgment because this is memory discovery, not a
 * second opinion. This function never itself decides a match is real: the
 * returned selected_experience_id (if not 'NONE') still requires the caller
 * to independently re-resolve it through retrieveCanonicalLearning and the
 * existing evidence/SHA bridge before any decision may cite it.
 */
export async function runCodexCliMemoryPointerAdapter(input, io, spawnProcess = spawn) {
  const bytes = io.readEvidence(input.query_ref);
  check(/^[a-f0-9]{64}$/.test(input.query_sha256) && sha(bytes) === input.query_sha256, 'query SHA mismatch');
  const query = JSON.parse(bytes.toString());
  check(text(query.candidate_id) && query.provider === 'openai' && query.access_path === 'CLI_SUBSCRIPTION' &&
    text(query.requested_model) && !query.requested_model.startsWith('-') && !/\s|\0/.test(query.requested_model) &&
    query.model === query.requested_model && query.selection_reason === MEMORY_POINTER_SELECTION_REASON &&
    text(query.query), 'query identity');
  check(query.provisional_judgment === undefined, 'memory-pointer query must not carry a provisional_judgment');
  check(Array.isArray(query.candidates) && query.candidates.length > 0, 'non-empty candidates array required');
  const candidateIds = new Set();
  for (const entry of query.candidates) {
    check(entry && typeof entry === 'object' && !Array.isArray(entry) &&
      Object.keys(entry).length === 2 && text(entry.experience_id) && text(entry.problem), 'candidate shape');
    check(!candidateIds.has(entry.experience_id), 'duplicate candidate experience_id');
    candidateIds.add(entry.experience_id);
  }
  check(isAbsolute(input.executable) && isAbsolute(input.cwd) && text(input.evidence_prefix), 'explicit executable/cwd/evidence prefix');
  check(Number.isInteger(input.timeout_ms) && input.timeout_ms > 0, 'explicit timeout required');
  const args = ['--ask-for-approval', 'never', 'exec', '--json', '--ephemeral', '-s', 'read-only',
    '-m', query.requested_model, '--ignore-user-config', '-c', 'model_provider="openai"', '-'];
  const refs = Object.fromEntries(['invocation.json', 'stdout.bin', 'stderr.bin', 'exit.json', 'response.json'].map(name =>
    [name, `${input.evidence_prefix}/${name}`]));
  check(!Object.values(refs).includes(input.query_ref), 'query/evidence collision');
  const invocation = Buffer.from(JSON.stringify({ candidate_id: query.candidate_id, executable: input.executable,
    args, cwd: input.cwd, query_ref: input.query_ref, query_sha256: input.query_sha256 }));
  io.writeEvidence(refs['invocation.json'], invocation);
  const raw = await captureProcess(input.executable, args, input.cwd, bytes, input.timeout_ms, spawnProcess);
  io.writeEvidence(refs['stdout.bin'], raw.stdout); io.writeEvidence(refs['stderr.bin'], raw.stderr);
  const { stdout, stderr, ...exit } = raw;
  const exitBytes = Buffer.from(JSON.stringify(exit)); io.writeEvidence(refs['exit.json'], exitBytes);
  let status = 'RECEIVED', answer, error;
  try {
    check(raw.exit_code === 0 && !raw.signal && !raw.spawn_error && !raw.stdin_error && !raw.timed_out, 'subprocess did not complete successfully');
    answer = parseCodexMemoryPointerJsonl(raw.stdout, candidateIds);
  } catch (failure) { status = 'FAILED'; error = failure.message; }
  const response = { candidate_id: query.candidate_id, provider: query.provider, model: query.requested_model,
    access_path: query.access_path, requested_model: query.requested_model, actual_model: 'UNKNOWN',
    query_evidence_sha256: input.query_sha256, status, ...(answer ?? { error }),
    raw_evidence: { stdout_ref: refs['stdout.bin'], stdout_sha256: sha(stdout), stderr_ref: refs['stderr.bin'],
      stderr_sha256: sha(stderr), exit_ref: refs['exit.json'], exit_sha256: sha(exitBytes),
      invocation_ref: refs['invocation.json'], invocation_sha256: sha(invocation) } };
  const responseBytes = Buffer.from(JSON.stringify(response)); io.writeEvidence(refs['response.json'], responseBytes);
  const candidate = { record_type: 'CANDIDATE', candidate_id: query.candidate_id, decision: { status: 'provisional' },
    knowledge_status: 'CANDIDATE_ONLY', automatic_fallback: false, consultation_kind: 'FIRST', consultation_status: status,
    selected_tutor: { provider: query.provider, model: query.requested_model },
    links: { provenance_source: 'EXTERNAL', external_source: { provider: query.provider, model: query.requested_model,
      access_path: query.access_path, requested_model: query.requested_model, actual_model: 'UNKNOWN',
      selection_reason: query.selection_reason, query_evidence_ref: input.query_ref, query_evidence_sha256: input.query_sha256,
      response_evidence_ref: refs['response.json'], response_evidence_sha256: sha(responseBytes),
      ...(status === 'RECEIVED' ? { selected_experience_id: answer.selected_experience_id } : {}) } } };
  validateTutorCandidate(candidate, io.readEvidence);
  return { candidate, response, raw_evidence: response.raw_evidence };
}
