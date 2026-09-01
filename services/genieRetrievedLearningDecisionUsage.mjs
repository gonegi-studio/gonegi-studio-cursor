// E4's verbatim lesson + source-Experience pattern only; no historical E4 data or decision policy.
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCanonicalLearning } from './genieCanonicalLearningRetrieval.mjs';
import { repositoryEvidenceReader } from './genieExternalTutorConsultationContract.mjs';
import { validateEvidenceConsumption } from './genieEvidenceConsumptionIntegrity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaults = { retrieve: retrieveCanonicalLearning, readEvidence: repositoryEvidenceReader(root) };
const text = v => typeof v === 'string' && v.trim().length > 0;
const check = (ok, status, detail) => {
  if (!ok) throw Object.assign(new Error(detail), { status });
};

/** Build an advisory input envelope, never a revised judgment. Dependencies are fixture seams.
 * input = { structural_key: { kind: 'experience', key, value },
 *           provisional_judgment_reference: { ref, sha256, location } }
 */
export function buildRetrievedLearningDecisionInput(input, dependencies = defaults) {
  try {
    check(input && input.structural_key?.kind === 'experience', 'INVALID_INPUT', 'Experience structural key required');
    const reference = input.provisional_judgment_reference;
    check(reference && text(reference.ref) && /^[a-f0-9]{64}$/.test(reference.sha256) &&
      typeof reference.location === 'string' && (reference.location === '' || reference.location.startsWith('/')) &&
      !/~(?:[^01]|$)/.test(reference.location), 'INVALID_REFERENCE', 'Provisional judgment ref/SHA/JSON Pointer required');
    const bytes = dependencies.readEvidence(reference.ref);
    check(createHash('sha256').update(bytes).digest('hex') === reference.sha256,
      'INVALID_REFERENCE', 'Provisional judgment SHA mismatch');
    let judgment = JSON.parse(bytes.toString());
    for (const part of reference.location === '' ? [] : reference.location.slice(1).split('/')) {
      const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
      check(judgment !== null && typeof judgment === 'object' && Object.hasOwn(judgment, key),
        'DANGLING_REFERENCE', 'Provisional judgment location missing');
      judgment = judgment[key];
    }
    check(judgment && typeof judgment === 'object' && !Array.isArray(judgment) && judgment.status === 'provisional',
      'INVALID_REFERENCE', 'Referenced judgment must already be provisional; no default or conversion');
    validateEvidenceConsumption(judgment, dependencies.readEvidence);
    const retrieval = dependencies.retrieve(input.structural_key);
    if (retrieval?.ok !== true) return {
      ok: false, status: retrieval?.status ?? 'INVALID_RETRIEVAL', related_learning: [],
      provisional_judgment_input: null, errors: structuredClone(retrieval?.errors ?? [{ detail: 'Retrieval failed' }]),
      judgment_changed: false, automatic_adoption: false, promotion_authorized: false,
    };
    check(Array.isArray(retrieval.results) && Array.isArray(retrieval.errors) && retrieval.errors.length === 0,
      'INVALID_RETRIEVAL', 'No partial retrieval results permitted');
    const ids = new Set();
    const related = retrieval.results.map(hit => {
      check(hit.kind === 'experience' && text(hit.id) && hit.id === hit.record?.experience_id,
        'INVALID_RETRIEVAL', 'Source Experience identity mismatch');
      check(!ids.has(hit.id), 'AMBIGUOUS_REFERENCE', 'Duplicate source Experience');
      ids.add(hit.id);
      check(text(hit.record.lesson), 'INVALID_RETRIEVAL', 'Verbatim lesson unavailable; no generated substitute');
      check(hit.verification?.knowledge_verified === false && hit.verification?.promotion_authorized === false,
        'INVALID_RETRIEVAL', 'Retrieval must not authorize knowledge or promotion');
      return {
        source_experience_id: hit.id,
        quoted_lesson_source_experience_id: hit.id,
        lesson: hit.record.lesson, // Exact text, including whitespace; no templates or interpretation.
        source_links: structuredClone(hit.record.links),
        ...(Object.hasOwn(hit.record, 'evidence') ? { evidence: structuredClone(hit.record.evidence) } : {}),
        provenance_source: hit.provenance_source,
        resolved_references: structuredClone(hit.resolved_references),
        verification: structuredClone(hit.verification),
        matched_key: hit.matched_key, matched_value: hit.matched_value,
        usage: 'REFERENCE_ONLY',
      };
    });
    return {
      ok: true, status: retrieval.status, canonical_count: retrieval.canonical_count,
      structural_key: structuredClone(input.structural_key),
      related_learning: related,
      provisional_judgment_input: {
        reference: structuredClone(reference),
        judgment: structuredClone(judgment), // Keep the original judgment separate and unchanged.
        related_learning_references: related.map(r => ({ source_experience_id: r.source_experience_id, usage: 'REFERENCE_ONLY' })),
      },
      errors: [], judgment_changed: false, automatic_adoption: false, promotion_authorized: false,
    };
  } catch (error) {
    return { ok: false, status: error.status ?? 'INVALID_REFERENCE', related_learning: [],
      provisional_judgment_input: null, errors: [{ detail: error.message }],
      judgment_changed: false, automatic_adoption: false, promotion_authorized: false };
  }
}
