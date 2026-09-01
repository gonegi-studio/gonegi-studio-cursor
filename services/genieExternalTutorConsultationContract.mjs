// CR-13 contract only: no provider dispatch, fallback, capture or promotion.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

const requireContract = (ok, field) => { if (!ok) throw new Error(`TUTOR_CONTRACT_INVALID: ${field}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;
export function validateDecisionStatus(decision) {
  requireContract(decision?.status === undefined || ['provisional', 'final'].includes(decision.status), 'decision.status');
}
// source_field_location is an RFC 6901 JSON Pointer (empty string selects the root).
// Copy source values exactly: this validates provenance, never classifies a problem.
export function validateTutorProblemContext(context, readEvidence) {
  requireContract(context && typeof context === 'object' && !Array.isArray(context), 'problem_context');
  requireContract(text(context.problem) && text(context.source_ref) &&
    typeof context.source_sha256 === 'string' && /^[a-f0-9]{64}$/.test(context.source_sha256), 'problem context source/SHA');
  const bytes = readEvidence(context.source_ref);
  requireContract(createHash('sha256').update(bytes).digest('hex') === context.source_sha256, 'problem context source SHA');
  const pointer = context.source_field_location;
  requireContract(typeof pointer === 'string' && (pointer === '' || pointer.startsWith('/')) &&
    !/~(?:[^01]|$)/.test(pointer), 'source_field_location JSON Pointer');
  let source = JSON.parse(bytes.toString());
  for (const token of pointer === '' ? [] : pointer.slice(1).split('/')) {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    requireContract(source !== null && typeof source === 'object' && Object.hasOwn(source, key), 'source field missing');
    source = source[key];
  }
  requireContract(context.problem === (typeof source === 'string' ? source : source?.problem), 'problem must match source');
  for (const key of ['action_type', 'cause_type']) {
    if (!Object.hasOwn(context, key)) continue;
    const parent = key === 'action_type' ? 'action' : 'cause';
    const direct = source && typeof source === 'object' && Object.hasOwn(source, key) ? source[key] : undefined;
    const nested = source?.[parent] && Object.hasOwn(source[parent], key) ? source[parent][key] : undefined;
    requireContract(text(context[key]) && (context[key] === direct || context[key] === nested), `${key} must exist in source`);
  }
  requireContract(Object.keys(context).every(k => ['problem', 'source_ref', 'source_sha256',
    'source_field_location', 'action_type', 'cause_type'].includes(k)), 'unsupported problem classification field');
}
// Fixtures may inject an in-memory reader. Production reading stays within the repository,
// including symlink resolution; credentials and network clients are never accessed.
export function repositoryEvidenceReader(root) {
  const base = realpathSync(root);
  return ref => {
    requireContract(text(ref) && !isAbsolute(ref) && !ref.includes('\\') && !ref.includes(':') &&
      !ref.split('/').includes('..'), 'repository evidence path');
    const absolute = realpathSync(resolve(base, ref));
    const rel = relative(base, absolute);
    requireContract(rel && !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') &&
      !rel.startsWith('..\\') && statSync(absolute).isFile(), 'repository evidence containment');
    return readFileSync(absolute);
  };
}

export function validateTutorCandidate(candidate, readEvidence) {
  const c = candidate;
  requireContract(c?.record_type === 'CANDIDATE' && text(c.candidate_id) && !('experience_id' in c), 'candidate identity');
  validateDecisionStatus(c.decision);
  requireContract(c.links?.provenance_source === 'EXTERNAL', 'external provenance');
  requireContract(c.knowledge_status === 'CANDIDATE_ONLY', 'candidate-only knowledge');
  requireContract(c.independent_verification !== true && c.promotion_authorized !== true &&
    c.links.verifies_external_experience_id === undefined, 'Tutor Validation is not independent verification');
  requireContract(c.automatic_fallback === false, 'automatic fallback forbidden');
  const s = c.links.external_source;
  requireContract(s && text(s.provider) && text(s.model) && text(s.selection_reason), 'selection');
  requireContract(c.selected_tutor?.provider === s.provider && c.selected_tutor?.model === s.model,
    'pinned provider/model');
  const read = (ref, hash) => {
    requireContract(text(ref) && typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash), 'evidence ref/SHA');
    const bytes = readEvidence(ref);
    requireContract(createHash('sha256').update(bytes).digest('hex') === hash, 'evidence SHA mismatch');
    return JSON.parse(bytes.toString());
  };
  const query = read(s.query_evidence_ref, s.query_evidence_sha256);
  // CR-18: additive memory-pointer scope only; every other selection_reason keeps the
  // original problem_context/provisional_judgment/3-field contract unchanged below.
  const isMemoryPointer = s.selection_reason === 'NATURAL_LANGUAGE_RETRIEVAL_FALLBACK';
  if (isMemoryPointer) {
    requireContract(query.provisional_judgment === undefined, 'memory-pointer query carries no provisional_judgment');
    requireContract(Array.isArray(query.candidates) && query.candidates.length > 0, 'memory-pointer candidates required');
    for (const entry of query.candidates) {
      requireContract(entry && typeof entry === 'object' && !Array.isArray(entry) &&
        Object.keys(entry).length === 2 && text(entry.experience_id) && text(entry.problem), 'candidate shape');
    }
  } else {
    validateTutorProblemContext(query.problem_context, readEvidence);
  }
  const response = read(s.response_evidence_ref, s.response_evidence_sha256);
  // Additive model provenance: legacy API records keep their existing model semantics.
  if (s.access_path !== undefined) requireContract(text(s.access_path), 'access_path');
  if (s.requested_model !== undefined) requireContract(text(s.requested_model), 'requested_model');
  if (s.access_path === 'CLI_SUBSCRIPTION') {
    requireContract(text(s.requested_model) && s.requested_model === s.model,
      'CLI model is the requested_model compatibility field');
    requireContract(text(s.actual_model), 'CLI actual_model must be explicit (UNKNOWN allowed)');
    for (const evidence of [query, response]) {
      requireContract(evidence.access_path === s.access_path && evidence.requested_model === s.requested_model,
        'CLI access/request provenance must match query/response evidence');
    }
  }
  if (s.actual_model === undefined || s.actual_model === 'UNKNOWN') {
    requireContract(s.actual_model_evidence === undefined, 'no evidence claim for unknown actual model');
  } else {
    requireContract(text(s.actual_model), 'actual_model');
    const proof = s.actual_model_evidence;
    requireContract(proof && typeof proof === 'object' && !Array.isArray(proof), 'actual_model_evidence');
    requireContract(proof.ref !== s.query_evidence_ref && proof.sha256 !== s.query_evidence_sha256,
      'requested model is not serving model evidence');
    const modelEvidence = read(proof.ref, proof.sha256);
    requireContract(modelEvidence.candidate_id === c.candidate_id && modelEvidence.provider === s.provider &&
      modelEvidence.query_evidence_sha256 === s.query_evidence_sha256, 'actual model evidence execution lineage');
    const pointer = proof.location;
    requireContract(!(s.access_path === 'CLI_SUBSCRIPTION' && proof.sha256 === s.response_evidence_sha256 && pointer === '/model'),
      'CLI response model alias is only requested_model');
    requireContract(typeof pointer === 'string' && pointer.startsWith('/') && !/~(?:[^01]|$)/.test(pointer),
      'actual model evidence JSON Pointer');
    let value = modelEvidence;
    for (const token of pointer.slice(1).split('/')) {
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
      requireContract(!['requested_model', 'validation', 'missing_knowledge', 'alternative_reasoning', 'content'].includes(key) && value !== null && typeof value === 'object' &&
        Object.hasOwn(value, key), 'actual model evidence location');
      value = value[key];
    }
    requireContract(value === s.actual_model, 'actual model must equal cited evidence');
  }
  requireContract(s.query_evidence_ref !== s.response_evidence_ref, 'distinct query/response evidence');
  for (const [name, evidence] of [['query', query], ['response', response]]) {
    requireContract(evidence.candidate_id === c.candidate_id && evidence.provider === s.provider &&
      evidence.model === s.model, `${name} identity`);
  }
  requireContract(text(query.query) && query.selection_reason === s.selection_reason, 'pre-query identity');
  if (isMemoryPointer) {
    requireContract(query.provisional_judgment === undefined, 'memory-pointer query carries no provisional_judgment');
  } else {
    requireContract(query.provisional_judgment?.status === 'provisional' && text(query.provisional_judgment.text),
      'pre-query judgment');
    requireContract(Array.isArray(query.provisional_judgment.evidence_refs) &&
      query.provisional_judgment.evidence_refs.length > 0, 'judgment evidence');
    for (const ref of query.provisional_judgment.evidence_refs) { requireContract(text(ref), 'judgment ref'); readEvidence(ref); }
  }
  requireContract(response.query_evidence_sha256 === s.query_evidence_sha256, 'response/query linkage');
  requireContract(['RECEIVED', 'FAILED'].includes(c.consultation_status) &&
    response.status === c.consultation_status, 'response status');
  if (isMemoryPointer) {
    for (const field of ['validation', 'missing_knowledge', 'alternative_reasoning']) {
      requireContract(s[field] === undefined && response[field] === undefined, `no fabricated ${field}`);
    }
    if (c.consultation_status === 'RECEIVED') {
      requireContract(text(s.selected_experience_id) && s.selected_experience_id === response.selected_experience_id &&
        (s.selected_experience_id === 'NONE' || query.candidates.some((entry) => entry.experience_id === s.selected_experience_id)),
        'selected_experience_id must be NONE or an offered candidate');
    } else {
      requireContract(s.selected_experience_id === undefined && response.selected_experience_id === undefined,
        'no fabricated selected_experience_id');
    }
  } else {
    for (const field of ['validation', 'missing_knowledge', 'alternative_reasoning']) {
      if (c.consultation_status === 'RECEIVED') {
        requireContract(text(s[field]) && s[field] === response[field], field);
      } else requireContract(s[field] === undefined && response[field] === undefined, `no fabricated ${field}`);
    }
  }
  if (c.consultation_status === 'FAILED') requireContract(text(response.error), 'failure evidence');
  requireContract(['FIRST', 'RECONSULTATION', 'SECOND_OPINION'].includes(c.consultation_kind), 'consultation kind');
  if (c.consultation_kind === 'FIRST') {
    requireContract(c.previous_candidate_ref === undefined && c.previous_candidate_sha256 === undefined &&
      c.second_opinion === undefined, 'first consultation lineage');
  } else {
    const previous = read(c.previous_candidate_ref, c.previous_candidate_sha256);
    requireContract(previous.record_type === 'CANDIDATE' && text(previous.candidate_id) &&
      previous.candidate_id !== c.candidate_id && previous.links?.provenance_source === 'EXTERNAL', 'separate candidate');
    if (c.consultation_kind === 'SECOND_OPINION') {
      const reason = c.second_opinion;
      requireContract(reason && ['REPOSITORY_EVIDENCE_CONFLICT', 'UNRESOLVED_CORE_EVIDENCE'].includes(reason.condition),
        'second opinion condition');
      requireContract(previous.consultation_status === 'RECEIVED', 'second opinion requires received first response');
      const basis = read(reason.evidence_ref, reason.evidence_sha256);
      requireContract(basis.condition === reason.condition && basis.previous_candidate_id === previous.candidate_id &&
        text(basis.detail) && Array.isArray(basis.repository_evidence_refs) && basis.repository_evidence_refs.length > 0,
        'second opinion evidence');
      for (const ref of basis.repository_evidence_refs) { requireContract(text(ref), 'second opinion ref'); readEvidence(ref); }
    } else requireContract(c.second_opinion === undefined && previous.consultation_status === 'FAILED',
      'reconsultation retries failure; a received answer requires second opinion gate');
  }
  // Validation is attributed Tutor text, never proof for CR-12 or a promotion authorization.
  return Object.freeze({ contract_valid: true, knowledge_status: 'CANDIDATE_ONLY',
    independent_verification: false, promotion_authorized: false });
}
