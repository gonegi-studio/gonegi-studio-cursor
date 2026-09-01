// Optional post-consultation evaluation. No scoring, capture, dispatch or promotion.
import { createHash } from 'node:crypto';
import { validateTutorCandidate } from './genieExternalTutorConsultationContract.mjs';

export const TUTOR_OUTCOME_ENUMS = Object.freeze({
  validation_assessment: Object.freeze(['CONFIRMED_CORRECT', 'CONFIRMED_INCORRECT', 'PARTIALLY_CORRECT', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']),
  missing_knowledge_assessment: Object.freeze(['WAS_USEFUL', 'WAS_NOT_USEFUL', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']),
  alternative_reasoning_assessment: Object.freeze(['IMPROVED_OUTCOME', 'DID_NOT_IMPROVE', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']),
  overall_consultation_outcome: Object.freeze(['SUCCESS', 'FAILURE', 'MIXED', 'UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']),
});
const unresolved = new Set(['UNKNOWN', 'PENDING', 'INSUFFICIENT_EVIDENCE']);
const check = (ok, field) => { if (!ok) throw new Error(`TUTOR_OUTCOME_INVALID: ${field}`); };
const text = v => typeof v === 'string' && v.trim().length > 0;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function validateTutorOutcomeEvaluation(record, readEvidence, canonicalExperiences = []) {
  const evaluation = record.links?.tutor_outcome_evaluation;
  if (evaluation === undefined) return; // No migration or default.
  check(evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation), 'evaluation object');
  const allowed = new Set([...Object.keys(TUTOR_OUTCOME_ENUMS), 'candidate_ref', 'candidate_sha256',
    'outcome_evidence_ref', 'outcome_evidence_sha256']);
  check(Object.keys(evaluation).every(k => allowed.has(k)), 'unknown field/provider/model/score duplication');
  for (const [key, values] of Object.entries(TUTOR_OUTCOME_ENUMS)) check(values.includes(evaluation[key]), key);
  const read = (ref, sha) => {
    check(text(ref) && typeof sha === 'string' && /^[a-f0-9]{64}$/.test(sha), 'evidence ref/SHA');
    const bytes = readEvidence(ref);
    check(digest(bytes) === sha, 'evidence SHA mismatch');
    return bytes;
  };
  const candidate = JSON.parse(read(evaluation.candidate_ref, evaluation.candidate_sha256).toString());
  validateTutorCandidate(candidate, readEvidence);
  // Provider/model belong exclusively to this immutable original Candidate provenance.
  const source = candidate.links.external_source;
  const excludedRefs = new Set([evaluation.candidate_ref, source.query_evidence_ref, source.response_evidence_ref]);
  const excludedHashes = new Set([evaluation.candidate_sha256, source.query_evidence_sha256, source.response_evidence_sha256]);
  const independent = (ref, sha) => {
    check(!excludedRefs.has(ref) && !excludedHashes.has(sha), 'Tutor/self-score is not outcome evidence');
    return read(ref, sha);
  };
  const correction = record.decision?.corrects_experience_id;
  if (correction != null) {
    const earlier = canonicalExperiences.find(e => e.experience_id === correction);
    check(earlier && correction !== record.experience_id, 'CR-06 correction reference');
    check(Number.isFinite(Date.parse(earlier.generated_at)) && Number.isFinite(Date.parse(record.generated_at)) &&
      Date.parse(earlier.generated_at) < Date.parse(record.generated_at), 'CR-06 earlier Experience');
    check(earlier.links?.tutor_outcome_evaluation?.candidate_ref === evaluation.candidate_ref &&
      earlier.links.tutor_outcome_evaluation.candidate_sha256 === evaluation.candidate_sha256,
      'correction must preserve original Candidate provenance (CR-11/13)');
  }
  const hasEvidence = evaluation.outcome_evidence_ref !== undefined || evaluation.outcome_evidence_sha256 !== undefined;
  const definitive = Object.keys(TUTOR_OUTCOME_ENUMS).some(k => !unresolved.has(evaluation[k]));
  check(!definitive || hasEvidence, 'definitive assessment requires actual outcome evidence');
  if (!hasEvidence) return; // UNKNOWN/PENDING/INSUFFICIENT_EVIDENCE are valid observations.
  const outcome = JSON.parse(independent(evaluation.outcome_evidence_ref, evaluation.outcome_evidence_sha256).toString());
  check(outcome.candidate_id === candidate.candidate_id && text(outcome.verifier_ref), 'independent outcome lineage');
  // A separate verifier and its completed execution evidence are required, not a Tutor self-score.
  independent(outcome.verifier_ref, outcome.verifier_sha256);
  const execution = JSON.parse(independent(outcome.execution_evidence_ref, outcome.execution_evidence_sha256).toString());
  check(new Set([evaluation.outcome_evidence_ref, outcome.verifier_ref, outcome.execution_evidence_ref]).size === 3 &&
    new Set([evaluation.outcome_evidence_sha256, outcome.verifier_sha256, outcome.execution_evidence_sha256]).size === 3,
    'independent artifacts must be distinct');
  check(execution.candidate_id === candidate.candidate_id && execution.verifier_ref === outcome.verifier_ref &&
    execution.verifier_sha256 === outcome.verifier_sha256 && execution.real_or_simulated === 'real' && text(execution.command) &&
    Number.isFinite(Date.parse(execution.completed_at)) && Number.isInteger(execution.exit_code), 'completed verifier execution');
  for (const key of Object.keys(TUTOR_OUTCOME_ENUMS)) {
    check(outcome[key] === evaluation[key] && execution[key] === evaluation[key], `outcome evidence mismatch: ${key}`);
  }
  if (evaluation.overall_consultation_outcome === 'SUCCESS') {
    check(candidate.consultation_status === 'RECEIVED' && execution.exit_code === 0, 'SUCCESS requires successful actual verification');
  }
  // No aggregation formula and no CR-12 authorization is produced by this contract.
}
