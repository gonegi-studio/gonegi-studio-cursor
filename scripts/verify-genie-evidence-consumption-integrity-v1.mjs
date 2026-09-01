// Field-only contract fixtures against existing real files. No evidence/Experience writes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositoryEvidenceReader } from '../services/genieExternalTutorConsultationContract.mjs';
import { validateEvidenceConsumption } from '../services/genieEvidenceConsumptionIntegrity.mjs';
import { buildRetrievedLearningDecisionInput } from '../services/genieRetrievedLearningDecisionUsage.mjs';
import { readCaptureState } from '../services/genieOjtCaptureEnforcement.mjs';
import { validateReverificationEvidence } from '../services/genieReverificationEvidenceRequiredness.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reader = repositoryEvidenceReader(root);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ref = 'project_brain/real_generation/NEXT_PRIORITY_ROADMAP.json';
const bytes = reader(ref), source = JSON.parse(bytes);
const entry = { evidence_ref: ref, evidence_sha256: hash(bytes), evidence_location: '/real_gen_status/status',
  quote: source.real_gen_status.status, scope_claim: 'Contract fixture: records the declared development/validation distinction, not current executability.', used: false };
let checks = 0;
function run(value, valid) {
  const before = JSON.stringify(value);
  if (valid) assert.doesNotThrow(() => validateEvidenceConsumption(value, reader));
  else assert.throws(() => validateEvidenceConsumption(value, reader));
  assert.equal(JSON.stringify(value), before); checks++;
}
function test(edit = () => {}, valid = false) { const e = structuredClone(entry); edit(e); run({ direct_support_evidence: [e] }, valid); }
run({}, true); run({ direct_support_evidence: [] }, true);
test(() => {}, true); test(e => { e.used = true; }, true);
for (const bad of [undefined, null, {}, '', false]) run({ direct_support_evidence: bad }, false);
for (const field of Object.keys(entry)) test(e => { delete e[field]; });
for (const bad of [undefined, null, 0, 1, 'false', 'true']) test(e => { e.used = bad; });
for (const bad of [null, '', '   ', {}, false]) test(e => { e.scope_claim = bad; });
test(e => { e.quote += ' '; });
test(e => { e.quote = 'PENDING'; });
test(e => { e.evidence_sha256 = '0'.repeat(64); });
test(e => { e.evidence_ref = '../outside.json'; });
test(e => { e.evidence_ref = 'project_brain/real_generation/does-not-exist.json'; });
test(e => { e.evidence_location = '/does-not-exist'; });
test(e => { e.evidence_location = '/bad~escape'; });
test(e => { e.extra_inferred_field = true; });
// Existing object, boolean, number, array and root values: no new source evidence.
for (const [location, quote] of [['/real_gen_status', source.real_gen_status],
  ['/real_gen_status/development_complete', source.real_gen_status.development_complete],
  ['/highest_priority_level_2_target/priority', source.highest_priority_level_2_target.priority],
  ['/real_gen_status/resume_real_gen_only_after', source.real_gen_status.resume_real_gen_only_after], ['', source]]) {
  test(e => { e.evidence_location = location; e.quote = quote; }, true);
}
test(e => { e.evidence_location = '/real_gen_status/development_complete'; e.quote = 'true'; });
test(e => { e.evidence_location = '/real_gen_status/resume_real_gen_only_after'; e.quote = [...source.real_gen_status.resume_real_gen_only_after].reverse(); });
// In-memory judgment fragment tests the real consumer gate; never an episode or stored evidence.
for (const valid of [true, false]) {
  const support = structuredClone(entry); if (!valid) support.quote = 'incorrect quotation';
  const judgmentBytes = Buffer.from(JSON.stringify({ status: 'provisional', direct_support_evidence: [support] }));
  let retrievalCalls = 0;
  const result = buildRetrievedLearningDecisionInput({ structural_key: { kind: 'experience', key: 'experience_id', value: 'unused-fixture-key' },
    provisional_judgment_reference: { ref: 'fixture-judgment', sha256: hash(judgmentBytes), location: '' } }, {
    readEvidence: r => r === 'fixture-judgment' ? judgmentBytes : reader(r),
    retrieve: () => { retrievalCalls++; return { ok: true, status: 'NOT_FOUND', results: [], errors: [] }; },
  });
  assert.equal(result.ok, valid);
  assert.equal(retrievalCalls, valid ? 1 : 0);
  assert.equal(result.judgment_changed, false);
  assert.equal(result.promotion_authorized, false); checks++;
}
const records = readCaptureState().records;
for (const e of records) validateEvidenceConsumption(e.decision, reader);
// Field fragments only: no canonical-shaped synthetic Experience, no persistence.
// Reproduce the real_generation omission: a status-only judgment, with its
// existing real roadmap citation omitted/empty, must not pass as new reverification.
let requirednessChecks = 0;
function requiredness(decision, valid, actionType = 'reverification', id = 'requiredness-field-fragment') {
  const fragment = { experience_id: id, action: { action_type: actionType }, decision };
  const before = JSON.stringify(fragment);
  const call = () => validateReverificationEvidence(fragment, reader);
  if (valid) assert.doesNotThrow(call); else assert.throws(call);
  assert.equal(JSON.stringify(fragment), before); requirednessChecks++;
}
requiredness(undefined, false);
requiredness({ decision_summary: source.real_gen_status.production_validation }, false);
requiredness({ direct_support_evidence: [] }, false);
for (const bad of [undefined, null, {}, '', false]) requiredness({ direct_support_evidence: bad }, false);
requiredness({ direct_support_evidence: [entry] }, true);
requiredness({ direct_support_evidence: [{ ...entry, used: true }] }, true);
requiredness({ direct_support_evidence: [{ ...entry, quote: 'PENDING' }] }, false);
requiredness({ direct_support_evidence: [{ ...entry, evidence_sha256: '0'.repeat(64) }] }, false);
requiredness({ direct_support_evidence: [{ ...entry, scope_claim: '' }] }, false);
requiredness({ direct_support_evidence: [{ ...entry, used: undefined }] }, false);
for (const actionType of ['investigation', 'code_fix', 'REVERIFICATION', 'reverification ', 'undeclared_other']) {
  requiredness({}, true, actionType); // No enum enforcement or mislabel-bypass claim.
  requiredness({ direct_support_evidence: [] }, true, actionType);
  requiredness({ direct_support_evidence: [{ ...entry, quote: 'wrong' }] }, false, actionType);
}
const historical = records.find(e => e.action?.action_type === 'reverification');
assert.ok(historical);
requiredness({}, true, 'reverification', historical.experience_id);
requiredness({ direct_support_evidence: [] }, true, 'reverification', historical.experience_id);
requiredness({ direct_support_evidence: [{ ...entry, quote: 'wrong' }] }, false, 'reverification', historical.experience_id);
for (const e of records) validateReverificationEvidence(e, reader);
assert.equal(hash(reader(ref)), entry.evidence_sha256);
console.log(JSON.stringify({ verdict: 'EVIDENCE_CONSUMPTION_INTEGRITY_INTEGRATED', fixture_checks: checks,
  canonical: records.length, live_direct_support_declarations: records.filter(e => Object.hasOwn(e.decision, 'direct_support_evidence')).length,
  requiredness_verdict: 'CR17_REVERIFICATION_REQUIREDNESS_INTEGRATED', requiredness_fixture_checks: requirednessChecks,
  action_type_declarative_bypass: 'NOT_RESOLVED',
  evidence_comprehension: 'NOT_PROVEN', records_created: 0, external_calls: 0 }));
