// Explicit in-memory contract fixtures, never consultations or canonical Experience records.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDecisionStatus, validateTutorCandidate, repositoryEvidenceReader } from '../services/genieExternalTutorConsultationContract.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'project_brain/story_scenario_intelligence');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const snapshot = () => readdirSync(directory).filter(f => f.endsWith('.json')).sort().map(f =>
  [f, sha(readFileSync(join(directory, f)))]);
const before = snapshot();
let checks = 0;
function fixture() {
  const files = new Map();
  const put = (ref, obj) => { const bytes = Buffer.from(JSON.stringify(obj)); files.set(ref, bytes); return sha(bytes); };
  const sourceHash = put('fixture/basis.json', { fixture_only: true, problem: 'Fixture problem',
    action: { action_type: 'investigation' }, cause: { cause_type: 'evidence_misapplication' } });
  const query = { candidate_id: 'fixture_candidate_1', provider: 'fixture_provider', model: 'fixture_model',
    query: 'CONTRACT TEST ONLY', selection_reason: 'Fixture selection, not a real ranking',
    problem_context: { problem: 'Fixture problem', source_ref: 'fixture/basis.json', source_sha256: sourceHash,
      source_field_location: '', action_type: 'investigation', cause_type: 'evidence_misapplication' },
    provisional_judgment: { status: 'provisional', text: 'Fixture provisional judgment', evidence_refs: ['fixture/basis.json'] } };
  const queryHash = put('fixture/query.json', query);
  const response = { candidate_id: query.candidate_id, provider: query.provider, model: query.model,
    status: 'RECEIVED', query_evidence_sha256: queryHash,
    validation: 'Fixture validation claim', missing_knowledge: 'Fixture unresolved evidence', alternative_reasoning: 'Fixture alternative' };
  const responseHash = put('fixture/response.json', response);
  const candidate = { record_type: 'CANDIDATE', candidate_id: query.candidate_id,
    decision: { status: 'provisional' }, knowledge_status: 'CANDIDATE_ONLY', automatic_fallback: false,
    consultation_kind: 'FIRST', consultation_status: 'RECEIVED',
    selected_tutor: { provider: query.provider, model: query.model },
    links: { provenance_source: 'EXTERNAL', external_source: { provider: query.provider, model: query.model,
      selection_reason: query.selection_reason, query_evidence_ref: 'fixture/query.json', query_evidence_sha256: queryHash,
      response_evidence_ref: 'fixture/response.json', response_evidence_sha256: responseHash,
      validation: response.validation, missing_knowledge: response.missing_knowledge, alternative_reasoning: response.alternative_reasoning } } };
  return { candidate, query, response, put, files, read: ref => { assert.ok(files.has(ref), `Missing evidence: ${ref}`); return files.get(ref); } };
}
const f = fixture();
const original = JSON.stringify(f.candidate);
assert.deepEqual(validateTutorCandidate(f.candidate, f.read), { contract_valid: true,
  knowledge_status: 'CANDIDATE_ONLY', independent_verification: false, promotion_authorized: false });
assert.equal(JSON.stringify(f.candidate), original);
for (const status of [undefined, 'provisional', 'final']) { validateDecisionStatus({ status }); checks++; }
for (const status of [null, '', 'FINAL', true]) { assert.throws(() => validateDecisionStatus({ status })); checks++; }
const reject = mutate => { const f = fixture(); mutate(f); assert.throws(() => validateTutorCandidate(f.candidate, f.read)); checks++; };
reject(f => { f.candidate.automatic_fallback = true; });
reject(f => { f.candidate.selected_tutor.model = 'other'; });
reject(f => { f.candidate.links.provenance_source = 'OJT'; });
reject(f => { f.candidate.record_type = 'PRINCIPLE'; });
reject(f => { f.candidate.independent_verification = true; });
reject(f => { f.candidate.promotion_authorized = true; });
reject(f => { f.candidate.links.external_source.query_evidence_sha256 = '0'.repeat(64); });
reject(f => { f.files.delete('fixture/response.json'); });
for (const key of ['validation', 'missing_knowledge', 'alternative_reasoning', 'selection_reason']) {
  reject(f => { delete f.candidate.links.external_source[key]; });
}
reject(f => { f.response.model = 'other'; f.candidate.links.external_source.response_evidence_sha256 = f.put('fixture/response.json', f.response); });
reject(f => { f.query.provisional_judgment.status = 'final'; f.candidate.links.external_source.query_evidence_sha256 = f.put('fixture/query.json', f.query); });
function followup(condition, previousStatus = 'RECEIVED') {
  const f = fixture();
  const previous = structuredClone(f.candidate);
  previous.candidate_id = 'fixture_previous'; previous.consultation_status = previousStatus;
  f.candidate.previous_candidate_ref = 'fixture/previous.json';
  f.candidate.previous_candidate_sha256 = f.put('fixture/previous.json', previous);
  f.candidate.consultation_kind = 'SECOND_OPINION';
  f.candidate.second_opinion = { condition, evidence_ref: 'fixture/reason.json',
    evidence_sha256: f.put('fixture/reason.json', { condition, previous_candidate_id: previous.candidate_id,
      detail: 'Fixture reason only', repository_evidence_refs: ['fixture/basis.json'] }) };
  return f;
}
for (const condition of ['REPOSITORY_EVIDENCE_CONFLICT', 'UNRESOLVED_CORE_EVIDENCE']) {
  const f = followup(condition); validateTutorCandidate(f.candidate, f.read); checks++;
}
for (const condition of ['TRANSPORT_FAILURE', 'CONSENSUS', '', null]) {
  const f = followup(condition); assert.throws(() => validateTutorCandidate(f.candidate, f.read)); checks++;
}
const retry = followup('UNRESOLVED_CORE_EVIDENCE', 'FAILED');
assert.throws(() => validateTutorCandidate(retry.candidate, retry.read)); checks++;
retry.candidate.consultation_kind = 'RECONSULTATION'; delete retry.candidate.second_opinion;
validateTutorCandidate(retry.candidate, retry.read); checks++;
const failed = fixture();
failed.candidate.consultation_status = failed.response.status = 'FAILED'; failed.response.error = 'Fixture transport error';
for (const key of ['validation', 'missing_knowledge', 'alternative_reasoning']) {
  delete failed.response[key]; delete failed.candidate.links.external_source[key];
}
failed.candidate.links.external_source.response_evidence_sha256 = failed.put('fixture/response.json', failed.response);
validateTutorCandidate(failed.candidate, failed.read); checks++;
const readReal = repositoryEvidenceReader(root);
assert.ok(readReal('project_brain/story_scenario_intelligence/project-brain-experience-model-schema-v1.json').length);
for (const ref of ['../outside.json', 'C:/outside.json', 'project_brain/']) { assert.throws(() => readReal(ref)); checks++; }
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({ verdict: 'EXTERNAL_TUTOR_CONSULTATION_CONTRACT_INTEGRATED',
  fixture_checks: checks, external_calls: 0, consultation_records_created: 0,
  fixtures: 'IN_MEMORY_ONLY_NOT_CANONICAL', json_files_modified: 0, promotion_authorized: false }, null, 2));
