// Explicit evidence capture only. No hooks, commands, private reasoning or promotion.
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositoryEvidenceReader } from './genieExternalTutorConsultationContract.mjs';

const readDefault = repositoryEvidenceReader(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const text = x => typeof x === 'string' && x.trim().length > 0;
const check = (ok, message) => { if (!ok) throw new Error(`DEVELOPMENT_TRACE_INVALID: ${message}`); };
const path = x => text(x) && !x.startsWith('/') && !/[\\:]/.test(x) && !x.split('/').some(p => ['..', '.', ''].includes(p));
const time = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) &&
  Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;
function keys(value, allowed) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'object required');
  check(Object.keys(value).every(k => allowed.includes(k)), 'unsupported field');
}
function read(reference, reader) {
  keys(reference, ['ref', 'sha256']);
  check(path(reference.ref) && /^[a-f0-9]{64}$/.test(reference.sha256), 'repository ref/SHA required');
  const bytes = reader(reference.ref);
  check(hash(bytes) === reference.sha256, `SHA mismatch: ${reference.ref}`);
  return bytes;
}

/** Evidence JSON is an explicit public observation, not a transcript or hidden reasoning.
 * SHA integrity establishes byte identity, not independent proof of the author's claims.
 * Event order is supplied by the caller; never silently sorted or backfilled.
 */
export function validateDevelopmentTrace(trace, readEvidence = readDefault) {
  try {
    keys(trace, ['trace_id', 'assignment', 'mode', 'events']);
    check(text(trace.trace_id) && trace.mode === 'APPRENTICESHIP', 'identity/mode');
    read(trace.assignment, readEvidence);
    check(Array.isArray(trace.events), 'events required');
    const ids = new Set();
    let last = -Infinity;
    for (const event of trace.events) {
      keys(event, ['event_id', 'timestamp', 'kind', 'evidence']);
      check(text(event.event_id) && !ids.has(event.event_id), 'duplicate/missing event id');
      ids.add(event.event_id);
      check(time(event.timestamp) && Date.parse(event.timestamp) >= last, 'event chronology');
      last = Date.parse(event.timestamp);
      const source = JSON.parse(read(event.evidence, readEvidence).toString());
      check(source.assignment_ref === trace.assignment.ref && source.assignment_sha256 === trace.assignment.sha256,
        'event assignment mismatch');
      const common = ['assignment_ref', 'assignment_sha256'];
      if (event.kind === 'EXPLICIT_JUDGMENT') {
        keys(source, [...common, 'timestamp', 'judgment']);
        check(time(source.timestamp) && source.timestamp === event.timestamp && text(source.judgment), 'explicit judgment');
      } else if (event.kind === 'FILE_CHANGE') {
        keys(source, [...common, 'timestamp', 'file', 'before', 'after']);
        check(time(source.timestamp) && source.timestamp === event.timestamp && path(source.file), 'file change');
        // null denotes absence for real creation/deletion only; never a guessed hash.
        check(source.before !== undefined && source.after !== undefined &&
          !(source.before === null && source.after === null), 'before/after required');
        for (const side of ['before', 'after']) if (source[side] !== null) read(source[side], readEvidence);
        check(source.before?.sha256 !== source.after?.sha256, 'no file change');
      } else if (event.kind === 'COMMAND') {
        keys(source, [...common, 'command', 'started_at', 'completed_at', 'exit_code', 'signal',
          'spawn_error', 'real_or_simulated', 'stdout_ref', 'stdout_sha256', 'stderr_ref', 'stderr_sha256']);
        check(text(source.command) && time(source.started_at) && time(source.completed_at) &&
          source.completed_at === event.timestamp && source.started_at <= source.completed_at, 'command/time');
        check(source.real_or_simulated === 'real', 'real execution required');
        check((Number.isInteger(source.exit_code) || source.exit_code === null) &&
          (source.signal === null || text(source.signal)) && (source.spawn_error === null || text(source.spawn_error)), 'exit fields');
        check(source.exit_code !== null || text(source.signal) || text(source.spawn_error), 'unexplained absent exit');
        read({ ref: source.stdout_ref, sha256: source.stdout_sha256 }, readEvidence);
        read({ ref: source.stderr_ref, sha256: source.stderr_sha256 }, readEvidence);
      } else {
        check(false, 'unsupported event kind');
      }
    }
    return { ok: true, errors: [], event_count: trace.events.length, knowledge_verified: false, promotion_authorized: false };
  } catch (error) {
    return { ok: false, errors: [error.message], knowledge_verified: false, promotion_authorized: false };
  }
}

/** Returns a new version only; previous events and source bytes remain unchanged. */
export function appendDevelopmentTraceEvent(trace, event, readEvidence = readDefault) {
  const previous = validateDevelopmentTrace(trace, readEvidence);
  check(previous.ok, previous.errors.join('; '));
  const next = structuredClone(trace);
  next.events.push(structuredClone(event));
  const result = validateDevelopmentTrace(next, readEvidence);
  check(result.ok, result.errors.join('; '));
  return next;
}

/** Reuse the Adapter's explicit append-only evidence I/O contract.
 * Caller supplies writeEvidence(ref, bytes), which MUST reject an existing ref.
 * No implicit writes, command execution, loader registration or OJT creation.
 */
export function materializeDevelopmentTrace(trace, ref, io) {
  check(path(ref) && ref.endsWith('.json'), 'trace evidence path');
  check(typeof io?.readEvidence === 'function' && typeof io?.writeEvidence === 'function', 'explicit evidence I/O required');
  const result = validateDevelopmentTrace(trace, io.readEvidence);
  check(result.ok, result.errors.join('; '));
  check(![trace.assignment.ref, ...trace.events.map(e => e.evidence.ref)].includes(ref), 'source overwrite');
  const bytes = Buffer.from(JSON.stringify(trace, null, 2) + '\n');
  io.writeEvidence(ref, bytes);
  return { ref, sha256: hash(bytes), ...result };
}
