// Read-only contract regression. Extract only loader declarations: never run a
// historical phase's main(), which would capture an Experience/write sidecars.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { repositoryEvidenceReader } from '../services/genieExternalTutorConsultationContract.mjs';
import { validateTutorOutcomeEvaluation } from '../services/genieTutorOutcomeEvaluationContract.mjs';
import { loadTutorCandidates } from '../services/genieTutorCandidateLoader.mjs';
import { validateCauseEvidence } from '../services/genieCausalEvidenceIntegrity.mjs';
import { validateCauseOutcomeFeedback } from '../services/genieCausalOutcomeFeedback.mjs';
import { validateReverificationEvidence } from '../services/genieReverificationEvidenceRequiredness.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'project_brain/story_scenario_intelligence');
const currentFile = 'materializeProjectBrainPhaseS31SelfImprovingStudioIntegrityAssessmentV1.ts';
const read = ref => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const snapshot = () => readdirSync(directory).filter(f => f.endsWith('.json')).sort().map(f => [
  f, createHash('sha256').update(readFileSync(join(directory, f))).digest('hex'),
]);
const before = snapshot();
const selected = new Set(['isExperienceShaped', 'loadCanonicalExperiencesStructurally',
  'validateOptionalCoordinatorFields', 'isValidExperienceGoalLink']);
function extractLoader(file) {
  const text = readFileSync(join(directory, file), 'utf8');
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const declarations = parsed.statements.filter(s => ts.isFunctionDeclaration(s) && selected.has(s.name?.text));
  if (!declarations.some(s => s.name?.text === 'loadCanonicalExperiencesStructurally')) return null;
  const js = ts.transpileModule(declarations.map(s => s.getText(parsed)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = vm.createContext({
    readFileSync, readdirSync, existsSync, statSync, join, PB_SSI: directory, REPO_ROOT: root,
  });
  vm.runInContext(js, context, { timeout: 10000 });
  const result = vm.runInContext('loadCanonicalExperiencesStructurally()', context, { timeout: 10000 });
  return { result: JSON.parse(JSON.stringify(result)), validate: context.validateOptionalCoordinatorFields,
    validGoalLink: context.isValidExperienceGoalLink };
}
const current = extractLoader(currentFile);
assert.ok(current?.validate);
const records = current.result.experiences;
const legacyRecords = records.filter(e => e.links.goal_ref !== 'GOAL_LESS');
const goalLessRecords = records.filter(e => e.links.goal_ref === 'GOAL_LESS');
assert.ok(records.length > 0);
assert.equal(legacyRecords.length + goalLessRecords.length, records.length);
assert.deepEqual(current.result.crossFileDuplicates, []);
assert.equal(new Set(records.map(e => e.experience_id)).size, records.length);
assert.ok(records.every(e => !e.experience_id.includes('test_fixture')));
assert.ok(legacyRecords.every(e => !Object.hasOwn(e.decision, 'decided_by') && !Object.hasOwn(e.links, 'assignment_ref')));
const normalize = entries => JSON.stringify([...entries].sort((a, b) => a.experience_id.localeCompare(b.experience_id)));
let legacyLoaders = 0;
for (const file of readdirSync(directory).filter(f => f.endsWith('.ts') && f !== currentFile)) {
  const loaded = extractLoader(file);
  if (!loaded) continue;
  assert.equal(normalize(loaded.result.experiences), normalize(records), `Loader regression: ${file}`);
  assert.deepEqual(loaded.result.crossFileDuplicates, [], file);
  legacyLoaders++;
}
assert.ok(legacyLoaders > 0);

// Reuse the existing integrity axes against every real record, not invented examples.
const goalIds = new Set(read('datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json').goal_model.goals.map(g => g.goal_id));
const trace = read('project_brain/story_scenario_intelligence/project-brain-goal-gap-dependency-trace-v16.json');
const gapIds = new Set(trace.chains.map(c => c.gap_id));
const dependencyIds = new Set(trace.chains.map(c => c.dependency_id));
const capabilityIds = new Set([
  ...read('project_brain/story_scenario_intelligence/project-brain-lpm-capability-functional-status-overlay-v6.json').capabilities,
  ...read('datasets/project_brain/lpm_v1/living-project-model-v1.json').capabilities,
].map(c => c.capability_id));
const experienceIds = new Set(records.map(e => e.experience_id));
// CR-14 supplements Candidate references only; CR-11 Experience targets are unchanged.
function validateTutorExternalReference(links, loaded, canonicalIds) {
  assert.equal(loaded.ok, true, 'CR-14: Candidate loader failed');
  assert.deepEqual(loaded.errors, [], 'CR-14: Candidate loader errors');
  if (!Object.hasOwn(links, 'verifies_external_experience_id')) return false;
  const ref = links.verifies_external_experience_id;
  assert.ok(typeof ref === 'string' && ref.trim().length > 0, 'CR-14: invalid reference');
  const matches = loaded.candidates.filter(c => c.candidate_id === ref);
  if (canonicalIds.has(ref)) {
    assert.equal(matches.length, 0, 'CR-14: ambiguous Experience/Candidate namespace');
    return false; // Existing CR-11 namespace, not reclassified as a Candidate.
  }
  assert.equal(matches.length, 1, 'CR-14: reference must resolve to exactly one Candidate');
  assert.equal(matches[0].links?.provenance_source, 'EXTERNAL', 'CR-14: non-EXTERNAL Candidate');
  return true; // Reference integrity only, never independent verification or promotion.
}
// Field-only fixtures and loader-result doubles; never persisted as real records.
const fixtureCandidate = { candidate_id: 'fixture_external_reference', links: { provenance_source: 'EXTERNAL' } };
const fixtureLoaded = { ok: true, errors: [], candidates: [fixtureCandidate] };
const fixtureLinks = { verifies_external_experience_id: fixtureCandidate.candidate_id };
let externalReferenceFixtureChecks = 0;
const referencePass = (links, loaded = fixtureLoaded, ids = new Set()) => {
  assert.doesNotThrow(() => validateTutorExternalReference(links, loaded, ids));
  externalReferenceFixtureChecks++;
};
const referenceFail = (links, loaded = fixtureLoaded, ids = new Set()) => {
  assert.throws(() => validateTutorExternalReference(links, loaded, ids), /CR-14:/);
  externalReferenceFixtureChecks++;
};
referencePass(fixtureLinks);
referencePass({});
referenceFail({ verifies_external_experience_id: 'fixture_missing' });
referenceFail(fixtureLinks, { ...fixtureLoaded, candidates: [{ ...fixtureCandidate, links: { provenance_source: 'OJT' } }] });
referenceFail(fixtureLinks, { ...fixtureLoaded, candidates: [fixtureCandidate, fixtureCandidate] });
referenceFail(fixtureLinks, { ...fixtureLoaded, ok: false });
referenceFail(fixtureLinks, { ...fixtureLoaded, errors: [{ error: 'INVALID_TUTOR_CANDIDATE' }] });
for (const ref of [undefined, null, '', '   ', 1]) referenceFail({ verifies_external_experience_id: ref });
referenceFail({ verifies_external_experience_id: ` ${fixtureCandidate.candidate_id} ` }); // No normalization.
referencePass({ verifies_external_experience_id: 'exp_existing' }, fixtureLoaded, new Set(['exp_existing']));
referenceFail(fixtureLinks, fixtureLoaded, new Set([fixtureCandidate.candidate_id]));
const tutorCandidates = loadTutorCandidates(root);
assert.equal(tutorCandidates.ok, true, 'CR-14: Candidate loader failed');
assert.deepEqual(tutorCandidates.errors, [], 'CR-14: Candidate loader errors');

// CR-15 fixtures: reference-resolution integrity only, never correctness of cause_type.
// A prospective no-op check: none of the 108 pre-existing records carry this sub-object.
let causalEvidenceFixtureChecks = 0;
const causePass = (cause, reader = repositoryEvidenceReader(root)) => {
  assert.doesNotThrow(() => validateCauseEvidence(cause, reader));
  causalEvidenceFixtureChecks++;
};
const causeFail = (cause, reader = repositoryEvidenceReader(root)) => {
  assert.throws(() => validateCauseEvidence(cause, reader), /CAUSAL_EVIDENCE_INVALID:/);
  causalEvidenceFixtureChecks++;
};
causePass(undefined);
causePass(null);
causePass({ root_cause_summary: 'x', cause_type: 'code_data_wiring_bug' }); // no evidence cited: valid no-op
causeFail({ evidence_ref: 'project_brain/story_scenario_intelligence/project-brain-experience-connection-rules-v1.json' }); // partial (missing sha/location)
causeFail({ evidence_sha256: '0'.repeat(64) }); // partial
causeFail({ evidence_location: '/rules/0/id' }); // partial
causeFail({ // wrong SHA -- never a similar-filename substitution or inferred fix
  evidence_ref: 'project_brain/story_scenario_intelligence/project-brain-experience-connection-rules-v1.json',
  evidence_sha256: '0'.repeat(64), evidence_location: '/rules/0/id',
});
{ // dangling ref -- fails inside the shared repositoryEvidenceReader, not this contract's own prefix
  const cause = { evidence_ref: 'project_brain/story_scenario_intelligence/does-not-exist.json',
    evidence_sha256: '0'.repeat(64), evidence_location: '' };
  assert.throws(() => validateCauseEvidence(cause, repositoryEvidenceReader(root)));
  causalEvidenceFixtureChecks++;
}
{
  const rulesRef = 'project_brain/story_scenario_intelligence/project-brain-experience-connection-rules-v1.json';
  const rulesBytes = readFileSync(join(root, rulesRef));
  const rulesSha = createHash('sha256').update(rulesBytes).digest('hex');
  causePass({ evidence_ref: rulesRef, evidence_sha256: rulesSha, evidence_location: '/rules/0/id' }); // real, existing, unique resolution
  causeFail({ evidence_ref: rulesRef, evidence_sha256: rulesSha, evidence_location: '/rules/999/id' }); // location does not resolve
}

let tutorExternalReferencesChecked = 0;
// CR-16 field-only fixtures with existing real identities/timestamps. No synthetic
// Experience or correction is created, persisted, or treated as observed evidence.
const realCorrection = records.find(e => e.decision?.corrects_experience_id);
assert.ok(realCorrection);
const realPrior = records.find(e => e.experience_id === realCorrection.decision.corrects_experience_id);
assert.ok(realPrior);
let causalFeedbackFixtureChecks = 0;
function feedbackCase(decision, valid, pool = records, id = realCorrection.experience_id, timestamp = realCorrection.generated_at) {
  const beforeInput = JSON.stringify({ decision, pool });
  const call = () => validateCauseOutcomeFeedback(decision, id, timestamp, pool);
  if (valid) assert.doesNotThrow(call); else assert.throws(call, /CAUSAL_FEEDBACK_INVALID:/);
  assert.equal(JSON.stringify({ decision, pool }), beforeInput);
  causalFeedbackFixtureChecks++;
}
feedbackCase({}, true);
feedbackCase({ intervention_tested_claimed_cause: false }, true);
feedbackCase({ intervention_tested_claimed_cause: true }, true);
const reviewFields = { cause_review_note: 'Contract field validation only, not a real reassessment.',
  corrects_experience_id: realPrior.experience_id };
feedbackCase(reviewFields, true);
feedbackCase({ ...reviewFields, intervention_tested_claimed_cause: false }, true);
feedbackCase({ ...reviewFields, intervention_tested_claimed_cause: true }, true);
for (const bad of [undefined, null, '', '   ', 0, false, [], {}]) feedbackCase({ ...reviewFields, cause_review_note: bad }, false);
for (const bad of [undefined, null, 0, 1, 'true', 'false', [], {}]) feedbackCase({ intervention_tested_claimed_cause: bad }, false);
for (const bad of [undefined, null, '', ` ${realPrior.experience_id} `, realCorrection.experience_id]) {
  feedbackCase({ ...reviewFields, corrects_experience_id: bad }, false);
}
feedbackCase(reviewFields, false, records.filter(e => e.experience_id !== realPrior.experience_id));
feedbackCase(reviewFields, false, [...records, realPrior]);
feedbackCase(reviewFields, false, records, realCorrection.experience_id, realPrior.generated_at);
feedbackCase(reviewFields, false, records, realCorrection.experience_id, 'invalid-time');
let causalFeedbackRecordsChecked = 0;
let causalEvidenceReferencesChecked = 0;
const dedupKeys = new Set();
for (const e of records) {
  if (validateTutorExternalReference(e.links, tutorCandidates, experienceIds)) tutorExternalReferencesChecked++;
  validateTutorOutcomeEvaluation(e, repositoryEvidenceReader(root), records);
  validateCauseEvidence(e.cause, repositoryEvidenceReader(root));
  validateCauseOutcomeFeedback(e.decision, e.experience_id, e.generated_at, records);
  validateReverificationEvidence(e, repositoryEvidenceReader(root));
  if (['cause_review_note', 'intervention_tested_claimed_cause'].some(k => Object.hasOwn(e.decision, k))) causalFeedbackRecordsChecked++;
  if (e.cause && ['evidence_ref', 'evidence_sha256', 'evidence_location'].some((k) => Object.hasOwn(e.cause, k))) {
    causalEvidenceReferencesChecked++;
  }
  assert.ok(current.validGoalLink(e.links, goalIds), `CR-01/CR-08: ${e.experience_id}`);
  assert.ok(!e.links.gap_ref || gapIds.has(e.links.gap_ref), e.experience_id);
  assert.ok(!e.links.dependency_ref || dependencyIds.has(e.links.dependency_ref), e.experience_id);
  assert.ok((e.links.capability_refs ?? []).every(id => capabilityIds.has(id)), e.experience_id);
  assert.ok(!e.decision.corrects_experience_id || experienceIds.has(e.decision.corrects_experience_id), e.experience_id);
  const key = `${e.links.goal_ref}::${e.phase}::${e.experience_kind}::${typeof e.problem === 'string' ? e.problem : ''}`;
  assert.ok(!dedupKeys.has(key), `Duplicate experience key: ${e.experience_id}`);
  dedupKeys.add(key);
}

const schema = read('project_brain/story_scenario_intelligence/project-brain-experience-model-schema-v1.json');
assert.ok(schema.fields.decision.includes('decided_by?: string'));
assert.ok(schema.fields.decision.includes('cause_review_note?: string'));
assert.ok(schema.fields.decision.includes('direct_support_evidence?: Array'));
assert.ok(schema.fields.decision.includes('intervention_tested_claimed_cause?: boolean'));
assert.ok(schema.fields.links.includes('assignment_ref?: string'));
assert.ok(schema.fields.cause.includes('evidence_ref?: string'));
// Field fragments only: no experience_id, no fabricated episode, no persistence.
assert.doesNotThrow(() => current.validate({}, {}));
for (const bad of [null, 0, false, '', '   ', [], {}]) {
  assert.throws(() => current.validate({ decided_by: bad }, {}), /EXPERIENCE_OPTIONAL_FIELD_INVALID/);
  assert.throws(() => current.validate({}, { assignment_ref: bad }), /EXPERIENCE_OPTIONAL_FIELD_INVALID/);
}
assert.throws(() => current.validate({}, { assignment_ref: '../' }), /EXPERIENCE_ASSIGNMENT_REF_INVALID/);
assert.throws(() => current.validate({}, { assignment_ref: 'project_brain/' }), /EXPERIENCE_ASSIGNMENT_REF_INVALID/);

const assignmentRef = 'project_brain/antigravity_agent_trial_v1/antigravity-agent-trial-task-brief-v1.json';
const scorecard = read('project_brain/antigravity_agent_trial_v1/antigravity-agent-trial-comparison-scorecard-v1.json');
const brief = read(assignmentRef);
assert.equal(scorecard.task_brief_ref, assignmentRef);
assert.equal(scorecard.task_id, brief.task_definition.task_id);
const fragment = { decision: {}, links: { assignment_ref: scorecard.task_brief_ref } };
const fragmentBefore = JSON.stringify(fragment);
current.validate(fragment.decision, fragment.links);
assert.equal(JSON.stringify(fragment), fragmentBefore);
assert.equal(Object.hasOwn(fragment.decision, 'decided_by'), false); // executor != decision maker
const phase430 = goalLessRecords.find(e => e.experience_id === 'exp_phase430_antigravity_agent_trial_claude_baseline_01');
assert.ok(phase430);
assert.equal(phase430.phase, 'PHASE-430');
assert.equal(phase430.experience_id, 'exp_phase430_antigravity_agent_trial_claude_baseline_01');
assert.equal(phase430.links.assignment_ref, assignmentRef);
assert.equal(phase430.user_decision, null);
assert.equal(phase430.final_outcome, null);
assert.equal(Object.hasOwn(phase430.decision, 'decided_by'), false);
assert.equal(goalIds.has('GOAL_LESS'), false);
// Real assignment reference and field-only negative cases; no episodes created.
const goalLessLinks = { goal_ref: 'GOAL_LESS', assignment_ref: assignmentRef, capability_refs: [] };
assert.equal(current.validGoalLink(goalLessLinks, goalIds), true);
for (const bad of [undefined, null, '', '../', 'project_brain/', 'missing-assignment.json']) {
  assert.equal(current.validGoalLink({ ...goalLessLinks, assignment_ref: bad }, goalIds), false);
}
for (const bad of [undefined, null, {}, '', ['cap_project_brain_intelligence']]) {
  assert.equal(current.validGoalLink({ ...goalLessLinks, capability_refs: bad }, goalIds), false);
}
for (const bad of [undefined, null, '', 'goal_less', 'unknown_goal']) {
  assert.equal(current.validGoalLink({ ...goalLessLinks, goal_ref: bad }, goalIds), false);
}
assert.equal(current.validGoalLink({ ...goalLessLinks, goal_ref: 'goal_project_brain_operational' }, goalIds), true);
const rules = read('project_brain/story_scenario_intelligence/project-brain-experience-connection-rules-v1.json');
// Additive rules must not make this legacy contract check reject a valid extension.
assert.deepEqual(rules.rules.slice(0, 8).map(r => r.id), Array.from({ length: 8 }, (_, i) => `CR-0${i + 1}`));
assert.equal(new Set(rules.rules.map(r => r.id)).size, rules.rules.length);
assert.equal(rules.rules.filter(r => r.id === 'CR-14').length, 1);
assert.equal(rules.rules.filter(r => r.id === 'CR-15').length, 1);
assert.equal(rules.rules.filter(r => r.id === 'CR-16').length, 1);
assert.equal(rules.rules.filter(r => r.id === 'CR-17').length, 1);
const index = read('project_brain/story_scenario_intelligence/project-brain-experience-index-v8.json');
assert.equal(index.total_experiences_indexed, records.length);
assert.equal(Object.hasOwn(index.by_goal, 'GOAL_LESS'), false);
assert.ok(Object.values(index.by_goal).flat().every(id => id !== phase430.experience_id));
const expectedGoalLessIndex = {};
for (const e of goalLessRecords) (expectedGoalLessIndex[e.links.assignment_ref] ??= []).push(e.experience_id);
assert.deepEqual(index.by_goal_less, expectedGoalLessIndex);
// Recompute every existing index axis from live canonical records.
for (const [axis, keys] of Object.entries({
  by_goal: e => e.links.goal_ref === 'GOAL_LESS' ? [] : [e.links.goal_ref],
  by_gap: e => e.links.gap_ref ? [e.links.gap_ref] : [],
  by_dependency: e => e.links.dependency_ref ? [e.links.dependency_ref] : [],
  by_capability: e => e.links.capability_refs,
  by_experience_kind: e => [e.experience_kind],
})) {
  const expected = {};
  for (const e of records) for (const key of keys(e)) (expected[key] ??= []).push(e.experience_id);
  assert.deepEqual(index[axis], expected, `Index currency: ${axis}`);
}
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({
  verdict: 'GOAL_LESS_EXPERIENCE_CONTRACT_INTEGRATED',
  legacy_canonical_experiences: legacyRecords.length, goal_less_experiences: goalLessRecords.length,
  canonical_experiences: records.length, legacy_loaders_equivalent: legacyLoaders,
  index_version: index.index_id, goal_less_assignment_refs: Object.keys(index.by_goal_less).length,
  duplicate_ids: 0, duplicate_keys: 0, dangling_refs: 0,
  tutor_external_reference_rule: 'CR-14', tutor_external_references_checked: tutorExternalReferencesChecked,
  tutor_candidates_loaded: tutorCandidates.candidates.length, external_reference_fixture_checks: externalReferenceFixtureChecks,
  causal_evidence_rule: 'CR-15', causal_evidence_references_checked: causalEvidenceReferencesChecked,
  causal_evidence_fixture_checks: causalEvidenceFixtureChecks, causal_correctness_proven: false,
  causal_feedback_rule: 'CR-16', causal_feedback_fixture_checks: causalFeedbackFixtureChecks,
  causal_feedback_records_checked: causalFeedbackRecordsChecked,
  causal_feedback_verdict: 'CAUSAL_OUTCOME_FEEDBACK_INTEGRATED',
  autonomous_causal_reassessment: 'NOT_PROVEN',
  optional_fields_absent_in_all_existing_records: true,
  phase430_assignment_reference_representable: true,
  phase430_decision_maker: 'UNKNOWN_NOT_INFERRED',
  experience_records_created: 0, json_files_modified_by_verifier: 0,
}, null, 2));
