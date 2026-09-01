// Only EventEmitter subprocess fixtures and in-memory evidence. Never starts a CLI.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { runCodexCliTutorAdapter, runCodexCliMemoryPointerAdapter } from '../services/genieCodexCliTutorAdapter.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const answer = { validation: 'Fixture validation', missing_knowledge: 'Fixture gap', alternative_reasoning: 'Fixture alternative' };
const events = value => [ { type: 'thread.started', thread_id: 'fixture-thread' }, { type: 'turn.started' },
  { type: 'item.completed', item: { id: 'item_fixture', type: 'agent_message', text: JSON.stringify(value) } },
  { type: 'turn.completed', usage: { input_tokens: 1, output_tokens: 1 } } ];
const jsonl = rows => Buffer.from(rows.map(row => JSON.stringify(row)).join('\n') + '\n');
function fixture(options = {}) {
  const files = new Map(), calls = [];
  const put = (ref, data) => { const b = Buffer.from(JSON.stringify(data)); files.set(ref, b); return sha(b); };
  const basisHash = put('fixture/basis.json', { problem: 'Fixture problem' });
  const query = { candidate_id: 'fixture_cli_candidate', provider: 'openai', model: 'fixture-model',
    access_path: 'CLI_SUBSCRIPTION', requested_model: 'fixture-model', selection_reason: 'Fixture selection',
    query: 'FIXTURE ONLY. Return validation, missing_knowledge, alternative_reasoning as JSON strings.',
    provisional_judgment: { status: 'provisional', text: 'Fixture judgment', evidence_refs: ['fixture/basis.json'] },
    problem_context: { problem: 'Fixture problem', source_ref: 'fixture/basis.json', source_sha256: basisHash, source_field_location: '' } };
  const input = { executable: resolve('fixture-codex.exe'), cwd: resolve('.'), evidence_prefix: 'fixture/run',
    query_ref: 'fixture/query.json', query_sha256: put('fixture/query.json', query), timeout_ms: 1000 };
  const io = { readEvidence: ref => { assert.ok(files.has(ref)); return files.get(ref); },
    writeEvidence: (ref, bytes) => { assert.equal(files.has(ref), false, `Evidence overwrite: ${ref}`); files.set(ref, Buffer.from(bytes)); } };
  const stdout = options.stdout ?? jsonl(events(answer));
  const stderr = options.stderr ?? Buffer.from('fixture models_cache warning\r\n');
  const spawnProcess = (exe, args, config) => {
    calls.push({ exe, args, config });
    if (options.spawnThrow) throw Error('Fixture launch failed');
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.kill = () => { process.nextTick(() => child.emit('close', null, 'SIGTERM')); return true; };
    child.stdin.end = bytes => {
      calls[0].stdin = Buffer.from(bytes);
      process.nextTick(() => {
        child.stdout.emit('data', stdout.subarray(0, 7)); child.stdout.emit('data', stdout.subarray(7));
        child.stderr.emit('data', stderr);
        if (options.processError) child.emit('error', Error('Fixture process error'));
        if (!options.timeout) child.emit('close', options.exitCode ?? 0, options.signal ?? null);
      });
    };
    return child;
  };
  return { files, calls, input, io, spawnProcess, stdout, stderr };
}
let checks = 0;
const good = fixture();
const result = await runCodexCliTutorAdapter(good.input, good.io, good.spawnProcess);
assert.equal(result.candidate.consultation_status, 'RECEIVED');
assert.equal(result.candidate.links.external_source.actual_model, 'UNKNOWN');
assert.equal(result.candidate.links.tutor_outcome_evaluation, undefined);
assert.equal(result.candidate.knowledge_status, 'CANDIDATE_ONLY');
assert.equal(good.calls.length, 1);
assert.deepEqual(good.calls[0].stdin, good.files.get(good.input.query_ref));
assert.deepEqual(good.calls[0].args, ['--ask-for-approval', 'never', 'exec', '--json', '--ephemeral', '-s', 'read-only',
  '-m', 'fixture-model', '--ignore-user-config', '-c', 'model_provider="openai"', '-']);
assert.equal(good.calls[0].config.shell, false); assert.equal(good.calls[0].config.windowsHide, true);
assert.deepEqual(good.files.get(result.raw_evidence.stdout_ref), good.stdout);
assert.deepEqual(good.files.get(result.raw_evidence.stderr_ref), good.stderr); checks++;
await assert.rejects(() => runCodexCliTutorAdapter(good.input, good.io, good.spawnProcess));
assert.equal(good.calls.length, 1); checks++;
for (const options of [
  { exitCode: 1 }, { signal: 'SIGTERM' }, { spawnThrow: true }, { processError: true },
  { stdout: Buffer.alloc(0) }, { stdout: Buffer.from('not JSON\n') },
  { stdout: Buffer.from([0xff]) }, { stdout: jsonl(events(answer).slice(0, -1)) },
  { stdout: jsonl([{ type: 'turn.started' }, { type: 'turn.failed', error: { message: 'fixture failure' } }]) },
  { stdout: jsonl([...events(answer), { type: 'error', message: 'late failure' }]) },
  { stdout: jsonl([...events(answer).slice(0, -1), events(answer)[2], events(answer)[3]]) },
  { stdout: jsonl(events({ validation: 'Only one field' })) },
  { stdout: jsonl(events({ ...answer, validation: '' })) },
  { stdout: jsonl(events({ ...answer, overall_consultation_outcome: 'SUCCESS' })) },
  { stdout: jsonl([{ type: 'turn.completed' }]) },
  { stdout: jsonl([{ type: 'turn.started' }, { type: 'unsupported' }]) },
  { timeout: true },
]) {
  const f = fixture(options); if (options.timeout) f.input.timeout_ms = 1;
  const r = await runCodexCliTutorAdapter(f.input, f.io, f.spawnProcess);
  assert.equal(r.candidate.consultation_status, 'FAILED');
  assert.equal(r.response.validation, undefined); assert.equal(f.calls.length, 1);
  assert.ok(f.files.has(r.raw_evidence.exit_ref));
  assert.deepEqual(f.files.get(r.raw_evidence.stdout_ref), options.spawnThrow ? Buffer.alloc(0) : f.stdout);
  assert.deepEqual(f.files.get(r.raw_evidence.stderr_ref), options.spawnThrow ? Buffer.alloc(0) : f.stderr);
  checks++;
}
const wrongSha = fixture(); wrongSha.input.query_sha256 = '0'.repeat(64);
await assert.rejects(() => runCodexCliTutorAdapter(wrongSha.input, wrongSha.io, wrongSha.spawnProcess));
assert.equal(wrongSha.calls.length, 0); assert.equal(wrongSha.files.size, 2); checks++;

// CR-18 memory-pointer adapter: same fixture mechanics, a disjoint query/response shape.
const pointerCandidates = [
  { experience_id: 'exp_fixture_alpha', problem: 'Fixture alpha problem' },
  { experience_id: 'exp_fixture_beta', problem: 'Fixture beta problem' },
];
function pointerFixture(options = {}) {
  const files = new Map(), calls = [];
  const put = (ref, data) => { const b = Buffer.from(JSON.stringify(data)); files.set(ref, b); return sha(b); };
  const query = { candidate_id: 'fixture_pointer_candidate', provider: 'openai', model: 'fixture-model',
    access_path: 'CLI_SUBSCRIPTION', requested_model: 'fixture-model', selection_reason: 'NATURAL_LANGUAGE_RETRIEVAL_FALLBACK',
    query: 'FIXTURE ONLY natural-language description', candidates: options.candidates ?? pointerCandidates };
  const input = { executable: resolve('fixture-codex.exe'), cwd: resolve('.'), evidence_prefix: 'fixture/pointer-run',
    query_ref: 'fixture/pointer-query.json', query_sha256: put('fixture/pointer-query.json', query), timeout_ms: 1000 };
  const io = { readEvidence: ref => { assert.ok(files.has(ref)); return files.get(ref); },
    writeEvidence: (ref, bytes) => { assert.equal(files.has(ref), false, `Evidence overwrite: ${ref}`); files.set(ref, Buffer.from(bytes)); } };
  const stdout = options.stdout ?? jsonl(events({ selected_experience_id: options.selected ?? 'NONE' }));
  const stderr = Buffer.alloc(0);
  const spawnProcess = (exe, args, config) => {
    calls.push({ exe, args, config });
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.kill = () => { process.nextTick(() => child.emit('close', null, 'SIGTERM')); return true; };
    child.stdin.end = bytes => {
      calls[0].stdin = Buffer.from(bytes);
      process.nextTick(() => {
        child.stdout.emit('data', stdout); child.stderr.emit('data', stderr);
        child.emit('close', 0, null);
      });
    };
    return child;
  };
  return { files, calls, input, io, spawnProcess, query };
}

// Positive: a real offered candidate is selected and survives the contract untouched.
const pointerPositive = pointerFixture({ selected: 'exp_fixture_alpha' });
const positiveResult = await runCodexCliMemoryPointerAdapter(pointerPositive.input, pointerPositive.io, pointerPositive.spawnProcess);
assert.equal(positiveResult.candidate.consultation_status, 'RECEIVED');
assert.equal(positiveResult.response.selected_experience_id, 'exp_fixture_alpha');
assert.equal(positiveResult.candidate.links.external_source.selected_experience_id, 'exp_fixture_alpha');
assert.equal(positiveResult.candidate.knowledge_status, 'CANDIDATE_ONLY');
assert.equal(positiveResult.candidate.links.provenance_source, 'EXTERNAL');
checks++;

// Positive: NONE is a first-class, equally valid answer.
const pointerNone = pointerFixture({ selected: 'NONE' });
const noneResult = await runCodexCliMemoryPointerAdapter(pointerNone.input, pointerNone.io, pointerNone.spawnProcess);
assert.equal(noneResult.candidate.consultation_status, 'RECEIVED');
assert.equal(noneResult.response.selected_experience_id, 'NONE');
checks++;

// Negative: an id outside the offered candidates fails closed to NONE, never accepted as a pointer.
const pointerHallucinated = pointerFixture({ selected: 'exp_never_offered_hallucination' });
const hallucinatedResult = await runCodexCliMemoryPointerAdapter(pointerHallucinated.input, pointerHallucinated.io, pointerHallucinated.spawnProcess);
assert.equal(hallucinatedResult.candidate.consultation_status, 'RECEIVED');
assert.equal(hallucinatedResult.response.selected_experience_id, 'NONE');
assert.equal(hallucinatedResult.response.hallucinated_raw_value, 'exp_never_offered_hallucination');
assert.equal(hallucinatedResult.candidate.links.external_source.selected_experience_id, 'NONE');
checks++;

// Negative: a malformed response (score/extra field instead of the one allowed field) fails the whole consultation.
for (const malformed of [
  jsonl(events({ selected_experience_id: 'exp_fixture_alpha', score: 0.9 })),
  jsonl(events({ selected_experience_id: 'exp_fixture_alpha', rank: 1 })),
  jsonl(events({})),
  jsonl(events({ selected_experience_id: '' })),
]) {
  const f = pointerFixture({ stdout: malformed });
  const r = await runCodexCliMemoryPointerAdapter(f.input, f.io, f.spawnProcess);
  assert.equal(r.candidate.consultation_status, 'FAILED');
  assert.equal(r.response.selected_experience_id, undefined);
  checks++;
}

// Negative: duplicate candidate experience_id in the query itself is rejected before any subprocess runs.
const duplicateCandidates = pointerFixture({ candidates: [pointerCandidates[0], pointerCandidates[0]] });
await assert.rejects(() => runCodexCliMemoryPointerAdapter(duplicateCandidates.input, duplicateCandidates.io, duplicateCandidates.spawnProcess));
assert.equal(duplicateCandidates.calls.length, 0); checks++;

// Negative: an empty candidates array is rejected before any subprocess runs.
const emptyCandidates = pointerFixture({ candidates: [] });
await assert.rejects(() => runCodexCliMemoryPointerAdapter(emptyCandidates.input, emptyCandidates.io, emptyCandidates.spawnProcess));
assert.equal(emptyCandidates.calls.length, 0); checks++;

console.log(JSON.stringify({ verdict: 'CODEX_CLI_TUTOR_ADAPTER_INTEGRATED', fixture_checks: checks,
  real_cli_calls: 0, actual_candidates_created: 0, ojt_records_created: 0,
  fixture_storage: 'IN_MEMORY_ONLY', automatic_retry: false, outcome_success_assumed: false,
  memory_pointer_positive: 'PASS', memory_pointer_none: 'PASS', memory_pointer_hallucination_fails_closed: 'PASS',
  memory_pointer_malformed_response_fails: 'PASS', memory_pointer_duplicate_candidate_rejected: 'PASS' }, null, 2));
