// CR-15 contract only: cause evidence reference-resolution integrity, prospective.
// Reuses the exact read+SHA+RFC6901-pointer pattern already used for problem_context
// (genieExternalTutorConsultationContract.mjs) -- no new resolution mechanism.
// Never judges cause_type correctness, never requires cause_type<->action/result
// consistency, never infers/generates a missing reference, never migrates existing
// records. Absence of the optional evidence sub-object is always valid and is a no-op.
import { createHash } from 'node:crypto';

const requireContract = (ok, field) => { if (!ok) throw new Error(`CAUSAL_EVIDENCE_INVALID: ${field}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;

/**
 * cause: { root_cause_summary, cause_type, evidence_ref?, evidence_sha256?, evidence_location? }
 * readEvidence: repositoryEvidenceReader(root)-shaped function (ref) => Buffer
 *
 * Only validates that a CITED reference resolves uniquely and really exists.
 * Does not validate, infer, or assert anything about cause_type's correctness.
 */
export function validateCauseEvidence(cause, readEvidence) {
  if (cause === undefined || cause === null) return; // no cause field at all: not this contract's concern
  requireContract(typeof cause === 'object' && !Array.isArray(cause), 'cause');

  const present = ['evidence_ref', 'evidence_sha256', 'evidence_location']
    .filter((key) => Object.hasOwn(cause, key));
  if (present.length === 0) return; // no evidence cited: valid, no-op, nothing to enforce

  // All-or-nothing: a partially-specified reference is never inferred/completed.
  requireContract(present.length === 3, 'cause evidence reference must be fully specified or fully absent');

  requireContract(text(cause.evidence_ref), 'cause.evidence_ref');
  requireContract(typeof cause.evidence_sha256 === 'string' && /^[a-f0-9]{64}$/.test(cause.evidence_sha256),
    'cause.evidence_sha256');
  requireContract(typeof cause.evidence_location === 'string' &&
    (cause.evidence_location === '' || cause.evidence_location.startsWith('/')) &&
    !/~(?:[^01]|$)/.test(cause.evidence_location), 'cause.evidence_location JSON Pointer');

  // Real, exact resolution only -- never a similar/near-match filename substitution.
  const bytes = readEvidence(cause.evidence_ref);
  requireContract(createHash('sha256').update(bytes).digest('hex') === cause.evidence_sha256,
    'cause.evidence_sha256 mismatch');

  let node = JSON.parse(bytes.toString());
  const pointer = cause.evidence_location;
  for (const token of pointer === '' ? [] : pointer.slice(1).split('/')) {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    requireContract(node !== null && typeof node === 'object' && Object.hasOwn(node, key),
      'cause.evidence_location does not resolve in the cited source');
    node = node[key];
  }
  // Resolution existing is sufficient; the resolved value's relationship to
  // root_cause_summary/cause_type is deliberately NOT checked (no correctness claim).
}
