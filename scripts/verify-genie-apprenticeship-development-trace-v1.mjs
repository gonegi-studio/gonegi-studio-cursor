// In-memory contract fixtures only: never materialized as real development/OJT.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateDevelopmentTrace, appendDevelopmentTraceEvent, materializeDevelopmentTrace }
  from '../services/genieApprenticeshipDevelopmentTrace.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const files = new Map();
const put = (ref, value) => {
  const bytes = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
  files.set(ref, bytes);
  return { ref, sha256: digest(bytes) };
};
const reader = ref => { assert.ok(files.has(ref), `Missing: ${ref}`); return files.get(ref); };
const assignment = put('fixture/assignment.json', { task: 'Contract fixture only' });
const common = { assignment_ref: assignment.ref, assignment_sha256: assignment.sha256 };
const t = '2026-08-31T00:00:00.000Z';
const t1 = '2026-08-31T00:00:01.000Z';
const before = put('fixture/before.txt', 'before');
const after = put('fixture/after.txt', 'after');
const stdout = put('fixture/stdout.bin', 'fixture output');
const stderr = put('fixture/stderr.bin', '');
const observations = [
  { ...common, timestamp: t, judgment: 'Explicit public fixture judgment.' },
  { ...common, timestamp: t, file: 'services/fixture.mjs', before, after },
  { ...common, command: 'fixture-command', started_at: t, completed_at: t1,
    exit_code: 0, signal: null, spawn_error: null, real_or_simulated: 'real',
    stdout_ref: stdout.ref, stdout_sha256: stdout.sha256, stderr_ref: stderr.ref, stderr_sha256: stderr.sha256 },
];
const kinds = ['EXPLICIT_JUDGMENT', 'FILE_CHANGE', 'COMMAND'];
const trace = { trace_id: 'fixture-only', assignment, mode: 'APPRENTICESHIP', events: observations.map((o, i) => ({
  event_id: `event-${i}`, timestamp: i === 2 ? t1 : t, kind: kinds[i], evidence: put(`fixture/event-${i}.json`, o),
})) };
let checks = 0;
function run(edit = () => {}, expected = true) {
  const value = structuredClone(trace);
  edit(value);
  const original = JSON.stringify(value);
  const result = validateDevelopmentTrace(value, reader);
  assert.equal(result.ok, expected, JSON.stringify(result));
  assert.equal(result.knowledge_verified, false);
  assert.equal(result.promotion_authorized, false);
  assert.equal(JSON.stringify(value), original);
  checks++;
}
function source(index, edit, expected = false) {
  run(value => {
    const o = structuredClone(observations[index]); edit(o);
    value.events[index].evidence = put('fixture/mutated.json', o);
  }, expected);
}
run();
run(v => { v.events = []; }); // In-progress is legal, not evidence of completion.
run(v => { v.events = [v.events[0]]; }); // No forced failure or Outcome.
run(v => { v.mode = 'COORDINATOR'; }, false);
run(v => { v.overall_consultation_outcome = 'SUCCESS'; }, false);
run(v => { v.assignment.sha256 = '0'.repeat(64); }, false);
run(v => { v.assignment.ref = '../outside'; }, false);
run(v => { v.events[1].event_id = v.events[0].event_id; }, false);
run(v => { v.events.reverse(); }, false);
run(v => { v.events[0].timestamp = '2026-02-30T00:00:00.000Z'; }, false);
run(v => { v.events[0].kind = 'CHAIN_OF_THOUGHT'; }, false);
run(v => { v.events[0].evidence.ref = 'fixture/missing'; }, false);
run(v => { v.events[0].evidence.sha256 = 'f'.repeat(64); }, false);
source(0, o => { o.assignment_ref = 'another-assignment'; });
source(0, o => { o.assignment_sha256 = '0'.repeat(64); });
source(0, o => { o.judgment = ''; });
source(0, o => { o.private_reasoning = 'not permitted'; });
source(0, o => { o.timestamp = t1; });
source(1, o => { o.before = null; }, true); // Creation.
source(1, o => { o.after = null; }, true); // Deletion.
source(1, o => { o.before = null; o.after = null; });
source(1, o => { delete o.before; });
source(1, o => { o.after = o.before; });
source(1, o => { o.before.sha256 = '0'.repeat(64); });
source(1, o => { o.file = '../outside'; });
source(2, o => { o.exit_code = 1; }, true); // Failure only if supplied, never auto-created.
source(2, o => { o.exit_code = null; o.spawn_error = 'fixture spawn failure'; }, true);
source(2, o => { o.exit_code = null; });
source(2, o => { o.exit_code = '0'; });
source(2, o => { o.real_or_simulated = 'simulated'; });
source(2, o => { delete o.stdout_ref; });
source(2, o => { o.stderr_sha256 = '0'.repeat(64); });
source(2, o => { o.started_at = '2026-08-31T00:00:02.000Z'; });
source(2, o => { o.completed_at = t; });
const original = JSON.stringify(trace);
const empty = { ...trace, events: [] };
let built = empty;
for (const event of trace.events) built = appendDevelopmentTraceEvent(built, event, reader);
assert.deepEqual(built, trace);
assert.deepEqual(empty.events, []);
assert.throws(() => appendDevelopmentTraceEvent(built, trace.events[0], reader));
const io = { readEvidence: reader, writeEvidence(ref, bytes) {
  assert.equal(files.has(ref), false, 'append-only evidence'); files.set(ref, bytes);
} };
const saved = materializeDevelopmentTrace(built, 'fixture/trace-v1.json', io);
assert.equal(saved.sha256, digest(files.get(saved.ref)));
assert.deepEqual(JSON.parse(files.get(saved.ref)), built);
assert.throws(() => materializeDevelopmentTrace(built, saved.ref, io));
assert.throws(() => materializeDevelopmentTrace(built, assignment.ref, io));
assert.throws(() => materializeDevelopmentTrace(built, '../trace.json', io));
assert.throws(() => materializeDevelopmentTrace(built, 'fixture/no-reader.json', { writeEvidence: io.writeEvidence }));
assert.throws(() => materializeDevelopmentTrace(built, 'fixture/no-writer.json', { readEvidence: reader }));
assert.equal(JSON.stringify(trace), original);
console.log(JSON.stringify({ status: 'PASS', validation_fixtures: checks, append_and_materialization: 'PASS',
  real_development_traces_created: 0, real_capture: 'DEFERRED', external_calls: 0, experiences_created: 0 }));
