// In-memory contract fixtures only. No real consultation, Experience or outcome is created.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { TUTOR_OUTCOME_ENUMS, validateTutorOutcomeEvaluation } from '../services/genieTutorOutcomeEvaluationContract.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = {
  validation_assessment: ['CONFIRMED_CORRECT', 'CONFIRMED_INCORRECT', 'PARTIALLY_CORRECT', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE'],
  missing_knowledge_assessment: ['WAS_USEFUL', 'WAS_NOT_USEFUL', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE'],
  alternative_reasoning_assessment: ['IMPROVED_OUTCOME', 'DID_NOT_IMPROVE', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE'],
  overall_consultation_outcome: ['SUCCESS', 'FAILURE', 'MIXED', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE'],
};
assert.deepEqual(TUTOR_OUTCOME_ENUMS, expected);
function fixture() {
  const files = new Map();
  const put = (ref, value) => { const bytes = Buffer.from(JSON.stringify(value)); files.set(ref, bytes); return sha(bytes); };
  const read = ref => { assert.ok(files.has(ref), `Missing fixture: ${ref}`); return files.get(ref); };
  const sourceHash = put('fixture/basis.json', { fixture_only: true, problem: 'Fixture problem' });
  const identity = { candidate_id: 'fixture_candidate', provider: 'fixture_provider', model: 'fixture_model' };
  const qHash = put('fixture/query.json', { ...identity, query: 'TEST ONLY', selection_reason: 'Fixture selection',
    problem_context: { problem: 'Fixture problem', source_ref: 'fixture/basis.json', source_sha256: sourceHash, source_field_location: '' },
    provisional_judgment: { status: 'provisional', text: 'Fixture judgment', evidence_refs: ['fixture/basis.json'] } });
  const answers = { validation: 'Fixture claim', missing_knowledge: 'Fixture gap', alternative_reasoning: 'Fixture alternative' };
  const rHash = put('fixture/response.json', { ...identity, ...answers, status: 'RECEIVED', query_evidence_sha256: qHash });
  const candidate = { record_type: 'CANDIDATE', candidate_id: identity.candidate_id, knowledge_status: 'CANDIDATE_ONLY',
    automatic_fallback: false, consultation_status: 'RECEIVED', consultation_kind: 'FIRST',
    selected_tutor: { provider: identity.provider, model: identity.model },
    links: { provenance_source: 'EXTERNAL', external_source: { provider: identity.provider, model: identity.model,
      selection_reason: 'Fixture selection', query_evidence_ref: 'fixture/query.json', query_evidence_sha256: qHash,
      response_evidence_ref: 'fixture/response.json', response_evidence_sha256: rHash, ...answers } } };
  const evaluation = { candidate_ref: 'fixture/candidate.json', candidate_sha256: put('fixture/candidate.json', candidate),
    validation_assessment: 'CONFIRMED_CORRECT', missing_knowledge_assessment: 'WAS_USEFUL',
    alternative_reasoning_assessment: 'IMPROVED_OUTCOME', overall_consultation_outcome: 'SUCCESS',
    outcome_evidence_ref: 'fixture/outcome.json' };
  const verifierHash = put('fixture/verifier.mjs', { fixture_only: 'stand-in verifier bytes, never executed' });
  const values = () => Object.fromEntries(Object.keys(expected).map(k => [k, evaluation[k]]));
  const execution = { fixture_only: true, candidate_id: identity.candidate_id, verifier_ref: 'fixture/verifier.mjs',
    verifier_sha256: verifierHash, real_or_simulated: 'real', command: 'FIXTURE_ONLY_NOT_EXECUTED',
    completed_at: '2026-08-31T00:00:00.000Z', exit_code: 0, ...values() };
  const outcome = { fixture_only: true, candidate_id: identity.candidate_id, verifier_ref: execution.verifier_ref,
    verifier_sha256: verifierHash, execution_evidence_ref: 'fixture/execution.json', ...values() };
  const refresh = () => {
    outcome.execution_evidence_sha256 = put('fixture/execution.json', execution);
    evaluation.outcome_evidence_sha256 = put('fixture/outcome.json', outcome);
  };
  refresh();
  return { files, read, put, refresh, evaluation, execution, outcome, candidate,
    record: { links: { tutor_outcome_evaluation: evaluation } } };
}
let checks = 0;
const validate = f => validateTutorOutcomeEvaluation(f.record, f.read);
const reject = edit => { const f = fixture(); edit(f); assert.throws(() => validate(f)); checks++; };
const f = fixture(), unchanged = JSON.stringify(f.record);
validate(f); checks++;
assert.equal(JSON.stringify(f.record), unchanged);
validateTutorOutcomeEvaluation({ links: {} }, () => { throw Error('Legacy must not read evidence'); }); checks++;
for (const state of ['UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']) {
  const f = fixture();
  for (const key of Object.keys(expected)) f.evaluation[key] = state;
  delete f.evaluation.outcome_evidence_ref; delete f.evaluation.outcome_evidence_sha256;
  validate(f); checks++;
}
for (const [key, values] of Object.entries(expected)) for (const value of values) {
  const f = fixture(); f.evaluation[key] = f.outcome[key] = f.execution[key] = value; f.refresh(); validate(f); checks++;
}
for (const key of Object.keys(expected)) reject(f => { f.evaluation[key] = 'UNSUPPORTED'; });
reject(f => { delete f.evaluation.outcome_evidence_ref; delete f.evaluation.outcome_evidence_sha256; });
reject(f => { f.evaluation.provider = 'duplicated'; });
reject(f => { f.evaluation.model = 'duplicated'; });
reject(f => { f.evaluation.score = 1; });
reject(f => { f.evaluation.candidate_sha256 = '0'.repeat(64); });
reject(f => { f.files.delete('fixture/verifier.mjs'); });
reject(f => { f.files.delete('fixture/execution.json'); });
reject(f => { f.execution.exit_code = 1; f.refresh(); });
reject(f => { f.execution.real_or_simulated = 'simulated'; f.refresh(); });
reject(f => { f.outcome.candidate_id = 'unrelated'; f.refresh(); });
reject(f => { f.outcome.validation_assessment = 'CONFIRMED_INCORRECT'; f.refresh(); });
reject(f => { f.execution.completed_at = 'not-a-date'; f.refresh(); });
reject(f => { f.evaluation.outcome_evidence_ref = 'fixture/response.json';
  f.evaluation.outcome_evidence_sha256 = f.candidate.links.external_source.response_evidence_sha256; });
reject(f => { f.files.set('fixture/copied-self-score.json', f.files.get('fixture/response.json'));
  f.evaluation.outcome_evidence_ref = 'fixture/copied-self-score.json';
  f.evaluation.outcome_evidence_sha256 = f.candidate.links.external_source.response_evidence_sha256; });
const correction = fixture();
const previous = { experience_id: 'exp_test_fixture_previous', generated_at: '2026-08-30T00:00:00Z', links: structuredClone(correction.record.links) };
correction.record.experience_id = 'exp_test_fixture_correction'; correction.record.generated_at = '2026-08-31T00:00:00Z';
correction.record.decision = { corrects_experience_id: previous.experience_id };
validateTutorOutcomeEvaluation(correction.record, correction.read, [previous]); checks++;
assert.throws(() => validateTutorOutcomeEvaluation(correction.record, correction.read, [])); checks++;
previous.links.tutor_outcome_evaluation.candidate_sha256 = '0'.repeat(64);
assert.throws(() => validateTutorOutcomeEvaluation(correction.record, correction.read, [previous])); checks++;
console.log(JSON.stringify({ verdict: 'TUTOR_OUTCOME_EVALUATION_CONTRACT_INTEGRATED', fixture_checks: checks,
  fixtures: 'IN_MEMORY_ONLY_NOT_CANONICAL', external_calls: 0, experience_records_created: 0,
  scoring_or_promotion_changes: false }, null, 2));
