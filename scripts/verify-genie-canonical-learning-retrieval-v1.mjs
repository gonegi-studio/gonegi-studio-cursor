import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCanonicalHistoryByProblem, retrieveCanonicalLearning } from '../services/genieCanonicalLearningRetrieval.mjs';
import { readCaptureState } from '../services/genieOjtCaptureEnforcement.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = () => ['project_brain/story_scenario_intelligence', 'project_brain/antigravity_agent_trial_v1']
  .flatMap(dir => readdirSync(join(root, dir), { recursive: true }).map(file => join(root, dir, file)))
  .filter(file => statSync(file).isFile()).sort()
  .map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]);
const before = snapshot();
// In-memory source doubles only. No fixture episodes, Candidates or knowledge are saved.
const experience = (id, links = {}) => ({ experience_id: id, experience_kind: 'partial_progress',
  decision: {}, links: { goal_ref: 'GOAL_LESS', capability_refs: [], ...links } });
const fixture = {
  state: { records: [experience('exp_fixture_current', { assignment_ref: 'fixture/assignment.json',
    verifies_external_experience_id: 'fixture_candidate' })], documents: [] },
  loaded: { ok: true, errors: [], candidates: [{ candidate_id: 'fixture_candidate',
    links: { provenance_source: 'EXTERNAL', external_source: { query_evidence_ref: 'fixture/query.json' } } }] },
  registry: { registry_id: 'fixture_registry', principle: { principle_id: 'fixture_principle',
    domains_validated: ['fixture_domain'], provenance_experience_ids: ['exp_fixture_current'] } },
};
const q = { kind: 'experience', key: 'assignment_ref', value: 'fixture/assignment.json' };
let checks = 0;
function run(edit = () => {}, query = q, expected = 'OK') {
  const data = structuredClone(fixture);
  edit(data);
  const frozenBefore = JSON.stringify(data);
  const result = retrieveCanonicalLearning(query, { canonical: () => data.state,
    candidates: () => data.loaded, principle: () => data.registry });
  assert.equal(result.status, expected, JSON.stringify(result));
  assert.equal(JSON.stringify(data), frozenBefore, 'Retrieval mutated input');
  if (!result.ok) assert.deepEqual(result.results, []);
  for (const hit of result.results) {
    assert.equal(hit.verification.knowledge_verified, false);
    assert.equal(hit.verification.promotion_authorized, false);
    assert.equal(hit.verification.substantive_evidence, 'NOT_EVALUATED');
  }
  checks++;
  return result;
}
assert.equal(run().results[0].resolved_references[0].id, 'fixture_candidate');
run(d => { delete d.state.records[0].links.verifies_external_experience_id; });
run(d => { d.state.records[0].links.verifies_external_experience_id = 'fixture_missing'; }, q, 'DANGLING_REFERENCE');
for (const value of [null, '', ' ', 1]) {
  run(d => { d.state.records[0].links.verifies_external_experience_id = value; }, q, 'INVALID_REFERENCE');
}
run(d => { d.loaded.candidates[0].links.provenance_source = 'OJT'; }, q, 'INVALID_REFERENCE');
run(d => { d.loaded.candidates.push(structuredClone(d.loaded.candidates[0])); }, q, 'AMBIGUOUS_REFERENCE');
run(d => { d.state.records.push(structuredClone(d.state.records[0])); }, q, 'AMBIGUOUS_REFERENCE');
run(d => { d.state.records.push(experience('fixture_candidate')); }, q, 'AMBIGUOUS_REFERENCE');
run(d => { d.loaded.ok = false; }, q, 'INVALID_SOURCE');
run(d => { d.loaded.errors = [{ error: 'INVALID_TUTOR_CANDIDATE' }]; }, q, 'INVALID_SOURCE');
run(d => { d.loaded.errors = [{ error: 'DUPLICATE_CANDIDATE_ID' }]; }, q, 'AMBIGUOUS_REFERENCE');
run(d => { d.registry.principle.provenance_experience_ids = ['exp_missing']; }, q, 'DANGLING_REFERENCE');
run(d => { d.registry.principle.provenance_experience_ids.push('exp_fixture_current'); }, q, 'AMBIGUOUS_REFERENCE');
run(d => { d.state.records[0].decision.corrects_experience_id = 'exp_missing'; }, q, 'DANGLING_REFERENCE');
run(d => { d.state.records[0].decision.corrects_experience_id = 'exp_fixture_current'; }, q, 'INVALID_REFERENCE');
run(d => { d.state.records.push(experience('exp_external', { provenance_source: 'EXTERNAL' }));
  d.state.records[0].links.verifies_external_experience_id = 'exp_external'; });
run(d => { d.state.records.push(experience('exp_external', { provenance_source: 'OJT' }));
  d.state.records[0].links.verifies_external_experience_id = 'exp_external'; }, q, 'INVALID_REFERENCE');
run(() => {}, { ...q, value: 'not_present' }, 'NOT_FOUND');
run(() => {}, { ...q, value: ' fixture/assignment.json ' }, 'NOT_FOUND');
run(() => {}, { ...q, key: 'semantic_query' }, 'INVALID_QUERY');
run(() => {}, { ...q, score: 1 }, 'INVALID_QUERY');
run(() => {}, { kind: 'candidate', key: 'candidate_id', value: 'fixture_candidate' });
run(() => {}, { kind: 'principle', key: 'domain', value: 'fixture_domain' });
// E1-E3-shaped documents and stale index contents cannot introduce membership or duplicates.
const historical = run(d => {
  d.state.documents = [
    { ref: 'historical-e1.json', value: { experiences: [experience('exp_historical_only')] } },
    { ref: 'historical-e2.json', value: { live_capture: { experience: experience('exp_historical_only') } } },
    { ref: 'historical-e3-index.json', value: { by_goal_less: { 'fixture/assignment.json': ['exp_historical_only'] } } },
  ];
});
assert.deepEqual(historical.results.map(r => r.id), ['exp_fixture_current']);
run(d => { d.state.documents = [{ value: { experiences: [experience('exp_historical_only')] } }]; },
  { kind: 'experience', key: 'experience_id', value: 'exp_historical_only' }, 'NOT_FOUND');
const ordered = run(d => {
  delete d.state.records[0].links.verifies_external_experience_id;
  d.state.records.push(experience('exp_fixture_a', { assignment_ref: 'fixture/assignment.json' }));
});
assert.deepEqual(ordered.results.map(r => r.id), ['exp_fixture_a', 'exp_fixture_current']);
const failedRead = retrieveCanonicalLearning(q, { canonical: () => { throw new Error('OJT_DUPLICATE_EXPERIENCE_ID'); } });
assert.equal(failedRead.status, 'AMBIGUOUS_REFERENCE');
assert.deepEqual(failedRead.results, []);
checks++;

// Cross-context History uses a literal problem phrase and existing explicit
// reference fields only. Fixtures are in-memory and never become Experience.
const historyDocument = Buffer.from(JSON.stringify({ generated_at: '2026-07-01T00:00:00.000Z', finding: 'fixture history' }));
const historySha = createHash('sha256').update(historyDocument).digest('hex');
const historyReaders = {
  canonical: () => ({ records: [
    { ...experience('exp_fixture_history', { assignment_ref: 'fixture_history_assignment' }),
      problem: 'Full-project TypeScript OOM during compile',
      decision: { source_experience_id: 'exp_fixture_source' },
      context: { retrieval_ref: 'fixture/retrieval.json' } },
    { ...experience('exp_fixture_source', { goal_ref: 'goal_historical_mismatch' }),
      problem: 'Historical source', decision: {} },
    { ...experience('exp_fixture_assignment_peer', { assignment_ref: 'fixture_history_assignment',
      goal_ref: 'goal_historical_mismatch' }), problem: 'Assignment peer', decision: {} },
    { ...experience('exp_fixture_unrelated'), problem: 'Unrelated incident', decision: {} },
  ] }),
  evidence: ref => {
    if (ref === 'fixture/retrieval.json') return Buffer.from(JSON.stringify({
      original_evidence_followed: [{ ref: 'fixture/july-history.json', sha256: historySha }],
    }));
    if (ref === 'fixture/july-history.json') return historyDocument;
    throw new Error(`missing fixture evidence: ${ref}`);
  },
};
const historyFixture = retrieveCanonicalHistoryByProblem({ problem: 'TypeScript OOM' }, historyReaders);
assert.equal(historyFixture.status, 'OK');
assert.deepEqual(historyFixture.results.map(r => r.experience_id), ['exp_fixture_history']);
assert.ok(historyFixture.results[0].history.some(h => h.ref === 'fixture/july-history.json' && h.sha256 === historySha));
assert.deepEqual(historyFixture.results[0].historical_experience_bridge.map(e => e.experience_id),
  ['exp_fixture_assignment_peer', 'exp_fixture_source']);
assert.equal(historyFixture.results[0].historical_experience_bridge.every(e =>
  e.original_goal_ref === 'goal_historical_mismatch'), true);
assert.equal(historyFixture.results[0].historical_experience_bridge.some(e =>
  e.experience_id === 'exp_fixture_unrelated'), false);
assert.equal(historyFixture.results[0].verification.semantic_search_used, false);
assert.equal(historyFixture.results[0].verification.vector_search_used, false);
assert.equal(historyFixture.results[0].verification.rag_used, false);
checks++;
assert.equal(retrieveCanonicalHistoryByProblem({ problem: 'not present' }, historyReaders).status, 'NOT_FOUND');
checks++;
const badHistory = retrieveCanonicalHistoryByProblem({ problem: 'TypeScript OOM' }, {
  ...historyReaders,
  evidence: ref => ref === 'fixture/retrieval.json' ? Buffer.from(JSON.stringify({
    original_evidence_followed: [{ ref: 'fixture/july-history.json', sha256: '0'.repeat(64) }],
  })) : historyDocument,
});
assert.equal(badHistory.status, 'INVALID_REFERENCE');
checks++;

// Legacy (path-separator-free) evidence_source/ref resolution: fixtures only,
// no hardcoded real filename or incident. One unresolved legacy reference
// must fail closed for itself, never for the whole call or a sibling that
// does resolve.
const legacyDoc = Buffer.from(JSON.stringify({ generated_at: '2026-01-01T00:00:00.000Z', finding: 'legacy fixture' }));
const legacyDocSha = createHash('sha256').update(legacyDoc).digest('hex');
const legacyExperience = (id, evidenceSource) => ({
  ...experience(id, { assignment_ref: `fixture_${id}_assignment` }),
  problem: `Legacy reference fixture for ${id}`,
  context: { legacy_ref: evidenceSource },
});

// Positive: bare filename absent at repo-root-as-written, uniquely present
// only under the canonical History document directory, SHA consistent.
const legacyResolved = retrieveCanonicalHistoryByProblem({ problem: 'Legacy reference fixture for exp_legacy_resolved' }, {
  canonical: () => ({ records: [legacyExperience('exp_legacy_resolved', 'legacy-fallback-fixture.json')] }),
  evidence: (ref) => {
    if (ref === 'project_brain/story_scenario_intelligence/legacy-fallback-fixture.json') return legacyDoc;
    throw new Error(`missing fixture evidence: ${ref}`);
  },
});
assert.equal(legacyResolved.status, 'OK', JSON.stringify(legacyResolved.errors));
const legacyResolvedHistory = legacyResolved.results[0].history.find((h) => h.ref === 'legacy-fallback-fixture.json');
assert.equal(legacyResolvedHistory.resolved, true);
assert.equal(legacyResolvedHistory.resolution, 'CANONICAL_HISTORY_DIRECTORY_FALLBACK');
assert.equal(legacyResolvedHistory.sha256, legacyDocSha);
assert.equal(legacyResolved.results[0].unresolved_legacy_reference_count, 0);
checks++;

// Negative: missing at both candidate locations -> unresolved, call still OK.
const legacyMissing = retrieveCanonicalHistoryByProblem({ problem: 'Legacy reference fixture for exp_legacy_missing' }, {
  canonical: () => ({ records: [legacyExperience('exp_legacy_missing', 'legacy-nowhere-fixture.json')] }),
  evidence: () => { throw new Error('nowhere'); },
});
assert.equal(legacyMissing.status, 'OK', JSON.stringify(legacyMissing.errors));
const legacyMissingHistory = legacyMissing.results[0].history.find((h) => h.ref === 'legacy-nowhere-fixture.json');
assert.equal(legacyMissingHistory.resolved, false);
assert.equal(legacyMissingHistory.resolution_reason, 'UNRESOLVED_MISSING');
assert.equal(legacyMissing.results[0].unresolved_legacy_reference_count, 1);
checks++;

// Negative: a real, distinct file answers to the bare name at BOTH candidate
// locations -> ambiguous, never silently picked.
const legacyAmbiguous = retrieveCanonicalHistoryByProblem({ problem: 'Legacy reference fixture for exp_legacy_ambiguous' }, {
  canonical: () => ({ records: [legacyExperience('exp_legacy_ambiguous', 'legacy-ambiguous-fixture.json')] }),
  evidence: (ref) => {
    if (ref === 'legacy-ambiguous-fixture.json') return legacyDoc;
    if (ref === 'project_brain/story_scenario_intelligence/legacy-ambiguous-fixture.json') return Buffer.from(JSON.stringify({ finding: 'different file' }));
    throw new Error(`missing fixture evidence: ${ref}`);
  },
});
assert.equal(legacyAmbiguous.status, 'OK', JSON.stringify(legacyAmbiguous.errors));
const legacyAmbiguousHistory = legacyAmbiguous.results[0].history.find((h) => h.ref === 'legacy-ambiguous-fixture.json');
assert.equal(legacyAmbiguousHistory.resolved, false);
assert.equal(legacyAmbiguousHistory.resolution_reason, 'UNRESOLVED_AMBIGUOUS');
checks++;

// Negative: uniquely resolves via fallback, but a declared SHA-256 disagrees
// -> unresolved, not silently accepted.
const legacyWrongSha = retrieveCanonicalHistoryByProblem({ problem: 'Legacy reference fixture for exp_legacy_wrong_sha' }, {
  canonical: () => ({ records: [{
    ...legacyExperience('exp_legacy_wrong_sha', 'legacy-wrong-sha-fixture.json'),
    context: { retrieval_ref: 'legacy-wrong-sha-pointer.json' },
  }] }),
  evidence: (ref) => {
    if (ref === 'legacy-wrong-sha-pointer.json') return Buffer.from(JSON.stringify({
      ref: 'legacy-wrong-sha-fixture.json', sha256: '0'.repeat(64),
    }));
    if (ref === 'project_brain/story_scenario_intelligence/legacy-wrong-sha-fixture.json') return legacyDoc;
    throw new Error(`missing fixture evidence: ${ref}`);
  },
});
assert.equal(legacyWrongSha.status, 'OK', JSON.stringify(legacyWrongSha.errors));
const legacyWrongShaHistory = legacyWrongSha.results[0].history.find((h) => h.ref === 'legacy-wrong-sha-fixture.json');
assert.equal(legacyWrongShaHistory.resolved, false);
assert.equal(legacyWrongShaHistory.resolution_reason, 'UNRESOLVED_SHA_MISMATCH');
checks++;

// Fail-closed means for THIS reference only: a resolvable sibling reference
// on the very same Experience must still resolve cleanly and completely,
// uncontaminated by the unresolved one.
const legacyMixed = retrieveCanonicalHistoryByProblem({ problem: 'Legacy reference fixture for exp_legacy_mixed' }, {
  canonical: () => ({ records: [{
    ...legacyExperience('exp_legacy_mixed', 'legacy-mixed-missing-fixture.json'),
    context: { legacy_ref: 'legacy-mixed-missing-fixture.json', retrieval_ref: 'legacy-mixed-ok-fixture.json' },
  }] }),
  evidence: (ref) => {
    if (ref === 'project_brain/story_scenario_intelligence/legacy-mixed-ok-fixture.json') return legacyDoc;
    if (ref === 'legacy-mixed-missing-fixture.json' || ref === 'project_brain/story_scenario_intelligence/legacy-mixed-missing-fixture.json') throw new Error('nowhere');
    throw new Error(`missing fixture evidence: ${ref}`);
  },
});
assert.equal(legacyMixed.status, 'OK', JSON.stringify(legacyMixed.errors));
const legacyMixedResult = legacyMixed.results[0];
assert.equal(legacyMixedResult.unresolved_legacy_reference_count, 1);
const okSibling = legacyMixedResult.history.find((h) => h.ref === 'legacy-mixed-ok-fixture.json');
assert.equal(okSibling.resolved, true);
assert.equal(okSibling.sha256, legacyDocSha);
const missingSibling = legacyMixedResult.history.find((h) => h.ref === 'legacy-mixed-missing-fixture.json');
assert.equal(missingSibling.resolved, false);
checks++;

const canonical = readCaptureState().records;
const liveQuery = { kind: 'experience', key: 'assignment_ref',
  value: 'project_brain/antigravity_agent_trial_v1/codex_tutor_20260831T052527969Z_27a4787b/query.json' };
const live = retrieveCanonicalLearning(liveQuery);
assert.equal(live.ok, true, JSON.stringify(live.errors));
assert.equal(live.canonical_count, canonical.length);
const expected = canonical.filter(e => e.links.assignment_ref === liveQuery.value).map(e => e.experience_id).sort();
assert.deepEqual(live.results.map(r => r.id), expected);
assert.ok(expected.includes('exp_genie_second_real_tutor_ojt_evidence_capture_v1'));
assert.deepEqual(retrieveCanonicalLearning(liveQuery), live, 'Same sources/query must return identical output');
for (const r of live.results) assert.equal(r.verification.knowledge_verified, false);
const candidate = retrieveCanonicalLearning({ kind: 'candidate', key: 'candidate_id', value: 'codex_tutor_20260831T052527969Z_27a4787b' });
assert.equal(candidate.status, 'OK');
assert.equal(candidate.results[0].verification.knowledge_verified, false);
const principle = retrieveCanonicalLearning({ kind: 'principle', key: 'principle_id',
  value: 'principle_search_existing_artifacts_verify_substance_reuse_before_new_work_v1' });
assert.equal(principle.status, 'OK');
assert.equal(principle.results[0].verification.knowledge_verified, false);
const oomHistory = retrieveCanonicalHistoryByProblem({ problem: 'full-project TypeScript OOM' });
assert.equal(oomHistory.status, 'OK', JSON.stringify(oomHistory.errors));
assert.equal(oomHistory.canonical_count, canonical.length);
assert.ok(oomHistory.results.some(result => result.experience_id ===
  'exp_genie_persistent_memory_real_world_ojt_continuation_v1'));
const julyOom = oomHistory.results.flatMap(result => result.history).find(history =>
  history.ref === 'reports/repository_intelligence/SOURCE_VIDEO_DNA_SCHEMA_SYNCHRONIZATION_V1_REPORT.json');
assert.ok(julyOom, 'July OOM History must resolve without a supplied location');
assert.equal(julyOom.generated_at, '2026-07-28T01:27:21.587Z');
assert.equal(julyOom.sha256, '912733732e8d76c66bb6ac408f23625f0aa62fbfd8415b33fff254a04dcd6b9d');
assert.match(julyOom.document.typecheck_verification.caveat, /8GB heap/);
assert.equal(oomHistory.results.every(r => r.verification.knowledge_verified === false), true);
checks++;
// Real Incident #2: the newer classifier assessment and the initial
// reverification use different Experience identities but the same real assignment.
const incident2 = retrieveCanonicalHistoryByProblem({ problem: 'counted only registered verify:* direct imports' });
assert.equal(incident2.status, 'OK', JSON.stringify(incident2.errors));
const incident2Bridge = incident2.results.find(r =>
  r.experience_id === 'exp_genie_verify_coverage_classifier_accuracy_assessment_v1')?.historical_experience_bridge ?? [];
assert.ok(incident2Bridge.some(e => e.experience_id ===
  'exp_genie_projectbrain_verify_coverage_reverification_v1' &&
  e.bridge_path.some(step => step.relation === 'SHARED_ASSIGNMENT_REF')));
checks++;
// Real Incident #3: natural current context follows an explicit source edge,
// then the same assignment edge to the initial differently-keyed Experience.
const incident3 = retrieveCanonicalHistoryByProblem({ problem: 'ProjectBrainAdaptiveLearningEngine remains classified as missing verification' });
assert.equal(incident3.status, 'OK', JSON.stringify(incident3.errors));
const incident3Bridge = incident3.results.find(r => r.experience_id ===
  'exp_genie_persistent_memory_real_ojt_v2')?.historical_experience_bridge ?? [];
assert.ok(incident3Bridge.some(e => e.experience_id ===
  'exp_genie_projectbrain_verify_coverage_reverification_v1'));
checks++;
// Negative control: an unrelated canonical Experience has neither provenance
// nor assignment identity connecting it to either historical incident.
const negative = retrieveCanonicalHistoryByProblem({ problem: 'GPU/ComfyUI server reachable yet' });
assert.equal(negative.status, 'OK', JSON.stringify(negative.errors));
assert.deepEqual(negative.results.flatMap(r => r.historical_experience_bridge), []);
checks++;
// Real Incident A positive control, re-verified: a pre-CR-15 canonical
// Experience's bare-filename evidence_source (no directory) previously threw
// INVALID_SOURCE and killed the whole call; it must now resolve uniquely via
// the canonical History document directory with a verified SHA-256.
const legacyLive = retrieveCanonicalHistoryByProblem({ problem: '72.6% of all LPM entities' });
assert.equal(legacyLive.status, 'OK', JSON.stringify(legacyLive.errors));
const legacyLiveResult = legacyLive.results.find(r =>
  r.experience_id === 'exp_phase942_semantic_quality_capability_overapplication_01');
assert.ok(legacyLiveResult, 'Real legacy evidence_source Experience must still literal-match');
const legacyLiveHistory = legacyLiveResult.history.find(h =>
  h.ref === 'project-brain-cap-dataset-management-concentration-rootcause-v1.json');
assert.ok(legacyLiveHistory, 'Real legacy bare-filename reference must appear in History');
assert.equal(legacyLiveHistory.resolved, true);
assert.equal(legacyLiveHistory.resolution, 'CANONICAL_HISTORY_DIRECTORY_FALLBACK');
assert.equal(legacyLiveHistory.sha256, '18ca34ba022e60af3d3c3326483fca59972d25a88837212b6db7905eac87a8db');
assert.equal(legacyLiveResult.unresolved_legacy_reference_count, 0);
checks++;
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({ verdict: 'CANONICAL_LEARNING_RETRIEVAL_INTEGRATED',
  live_verdict: 'FIRST_LIVE_OJT_RETRIEVAL_PASS', fixture_checks: checks, canonical_experiences: canonical.length,
  live_experience_ids: expected, live_candidate_found: candidate.results.length,
  live_principle_found: principle.results.length, historical_snapshot_membership_ignored: true,
  cross_context_history_problem_only: 'PASS', july_oom_history_resolved: julyOom.ref,
  historical_key_mismatch_bridge_incident_2: 'PASS', historical_key_mismatch_bridge_incident_3: 'PASS',
  unrelated_experience_negative_control: 'PASS',
  legacy_evidence_reference_incident_a_live_resolved: legacyLiveHistory.ref,
  legacy_evidence_reference_missing_negative_control: 'PASS',
  legacy_evidence_reference_ambiguous_negative_control: 'PASS',
  legacy_evidence_reference_wrong_sha_negative_control: 'PASS',
  legacy_evidence_reference_mixed_no_contamination_control: 'PASS',
  cross_context_semantic_vector_rag_used: false,
  records_created: 0, json_files_modified: 0, external_calls: 0, knowledge_promoted: false }, null, 2));
