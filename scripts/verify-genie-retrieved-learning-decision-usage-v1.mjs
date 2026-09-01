import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCanonicalLearning } from '../services/genieCanonicalLearningRetrieval.mjs';
import { buildRetrievedLearningDecisionInput } from '../services/genieRetrievedLearningDecisionUsage.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const snapshot = () => ['project_brain/story_scenario_intelligence', 'project_brain/antigravity_agent_trial_v1']
  .flatMap(dir => readdirSync(join(root, dir), { recursive: true }).map(f => join(root, dir, f)))
  .filter(f => statSync(f).isFile()).sort().map(f => [f, digest(readFileSync(f))]);
const before = snapshot();
const judgment = { status: 'provisional', text: 'Keep the supplied judgment exactly unchanged.', evidence_refs: ['fixture-source'] };
const bytes = Buffer.from(JSON.stringify({ provisional_judgment: judgment }));
const input = { structural_key: { kind: 'experience', key: 'assignment_ref', value: 'fixture-assignment' },
  provisional_judgment_reference: { ref: 'fixture-query', sha256: digest(bytes), location: '/provisional_judgment' } };
const hit = { kind: 'experience', id: 'exp_fixture_usage',
  record: { experience_id: 'exp_fixture_usage', lesson: '  원문 "lesson"\n줄바꿈과 공백 유지.  ',
    links: { provenance_source: 'OJT' }, evidence: { evidence_kind: 'hard_pass', evidence_source: 'fixture-source' } },
  provenance_source: 'OJT', resolved_references: [], matched_key: 'assignment_ref', matched_value: 'fixture-assignment',
  verification: { canonical_membership: true, substantive_evidence: 'NOT_EVALUATED',
    knowledge_verified: false, promotion_authorized: false, reference_integrity: 'RESOLVED' } };
const retrieval = { ok: true, status: 'OK', canonical_count: 1, results: [hit], errors: [] };
let checks = 0;
function run(edit = () => {}, expected = 'OK') {
  const data = { input: structuredClone(input), retrieval: structuredClone(retrieval), bytes: Buffer.from(bytes) };
  edit(data);
  const unchanged = JSON.stringify(data);
  const result = buildRetrievedLearningDecisionInput(data.input, {
    retrieve: key => { assert.deepEqual(key, data.input.structural_key); return data.retrieval; },
    readEvidence: ref => { assert.equal(ref, data.input.provisional_judgment_reference.ref); return data.bytes; },
  });
  assert.equal(result.status, expected, JSON.stringify(result));
  assert.equal(JSON.stringify(data), unchanged);
  assert.equal(result.judgment_changed, false);
  assert.equal(result.automatic_adoption, false);
  assert.equal(result.promotion_authorized, false);
  if (!result.ok) {
    assert.deepEqual(result.related_learning, []);
    assert.equal(result.provisional_judgment_input, null);
  }
  checks++;
  return result;
}
const exact = run();
assert.equal(exact.related_learning[0].lesson, hit.record.lesson);
assert.deepEqual(exact.related_learning[0].source_links, hit.record.links);
assert.deepEqual(exact.related_learning[0].evidence, hit.record.evidence);
assert.deepEqual(exact.related_learning[0].verification, hit.verification);
assert.deepEqual(exact.provisional_judgment_input.judgment, judgment);
assert.equal(exact.provisional_judgment_input.related_learning_references[0].source_experience_id, hit.id);
const unknown = run(d => { delete d.retrieval.results[0].record.links.provenance_source;
  d.retrieval.results[0].provenance_source = null; delete d.retrieval.results[0].record.evidence; });
assert.equal(unknown.related_learning[0].provenance_source, null);
assert.equal(Object.hasOwn(unknown.related_learning[0], 'evidence'), false);
run(d => { d.retrieval = { ok: true, status: 'NOT_FOUND', results: [], errors: [], canonical_count: 1 }; }, 'NOT_FOUND');
for (const status of ['DANGLING_REFERENCE', 'AMBIGUOUS_REFERENCE', 'INVALID_REFERENCE', 'INVALID_SOURCE']) {
  run(d => { d.retrieval = { ok: false, status, results: [hit], errors: [{ code: status }] }; }, status);
}
for (const kind of ['candidate', 'principle']) run(d => { d.input.structural_key.kind = kind; }, 'INVALID_INPUT');
run(d => { d.input.provisional_judgment_reference.sha256 = '0'.repeat(64); }, 'INVALID_REFERENCE');
run(d => { d.input.provisional_judgment_reference.location = '/absent'; }, 'DANGLING_REFERENCE');
run(d => { d.input.provisional_judgment_reference.location = '/bad~escape'; }, 'INVALID_REFERENCE');
run(d => { d.bytes = Buffer.from(JSON.stringify({ provisional_judgment: { status: 'final' } }));
  d.input.provisional_judgment_reference.sha256 = digest(d.bytes); }, 'INVALID_REFERENCE');
for (const lesson of [undefined, null, '', '   ', { text: 'No implicit serialization' }]) {
  run(d => { d.retrieval.results[0].record.lesson = lesson; }, 'INVALID_RETRIEVAL');
}
run(d => { d.retrieval.results.push(structuredClone(hit)); }, 'AMBIGUOUS_REFERENCE');
run(d => { d.retrieval.results[0].record.experience_id = 'exp_different'; }, 'INVALID_RETRIEVAL');
run(d => { d.retrieval.results[0].verification.knowledge_verified = true; }, 'INVALID_RETRIEVAL');
run(d => { d.retrieval.errors.push({ code: 'INVALID_REFERENCE' }); }, 'INVALID_RETRIEVAL');

const queryRef = 'project_brain/antigravity_agent_trial_v1/codex_tutor_20260831T052527969Z_27a4787b/query.json';
const queryBytes = readFileSync(join(root, queryRef));
const query = JSON.parse(queryBytes);
const liveInput = { structural_key: { kind: 'experience', key: 'assignment_ref', value: queryRef },
  provisional_judgment_reference: { ref: queryRef, sha256: digest(queryBytes), location: '/provisional_judgment' } };
const live = buildRetrievedLearningDecisionInput(liveInput);
const retrieved = retrieveCanonicalLearning(liveInput.structural_key);
assert.equal(live.status, 'OK', JSON.stringify(live.errors));
assert.equal(live.canonical_count, retrieved.canonical_count);
assert.deepEqual(live.provisional_judgment_input.judgment, query.provisional_judgment);
assert.deepEqual(buildRetrievedLearningDecisionInput(liveInput), live);
assert.ok(live.related_learning.some(r => r.source_experience_id === 'exp_genie_second_real_tutor_ojt_evidence_capture_v1'));
for (const learning of live.related_learning) {
  const source = retrieved.results.find(r => r.id === learning.source_experience_id);
  assert.equal(learning.lesson, source.record.lesson);
  assert.deepEqual(learning.evidence, source.record.evidence);
  assert.deepEqual(learning.source_links, source.record.links);
  assert.deepEqual(learning.verification, source.verification);
  assert.equal(learning.verification.knowledge_verified, false);
}
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({ verdict: 'RETRIEVED_LEARNING_DECISION_USAGE_INTEGRATED',
  live_verdict: 'FIRST_LIVE_LEARNING_REUSE_PASS', fixture_checks: checks,
  canonical_experiences: live.canonical_count,
  live_experience_ids: live.related_learning.map(r => r.source_experience_id),
  provisional_judgment_reference: liveInput.provisional_judgment_reference,
  lesson_verbatim: true, evidence_and_provenance_preserved: true, judgment_changed: false,
  historical_judgment_reused_as_reference_only: true,
  records_created: 0, json_files_modified: 0, external_calls: 0, promotion_authorized: false }, null, 2));
