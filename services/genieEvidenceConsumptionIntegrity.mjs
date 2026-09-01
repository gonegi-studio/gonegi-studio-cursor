// Direct-support declarations only; no crawling, inference, writes or promotion.
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const check = (ok, detail) => { if (!ok) throw new Error(`EVIDENCE_CONSUMPTION_INVALID: ${detail}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;

/** Optional decision.direct_support_evidence entries use the CR-13/15
 * reference + SHA + RFC6901 pattern. quote is the resolved JSON value, not a
 * coerced string or summary. Strings retain all whitespace; arrays retain order.
 * scope_claim and used remain author assertions, never proof of comprehension.
 */
export function validateEvidenceConsumption(decision, readEvidence) {
  if (decision == null || !Object.hasOwn(decision, 'direct_support_evidence')) return;
  const entries = decision.direct_support_evidence;
  check(Array.isArray(entries), 'direct_support_evidence must be an array');
  for (const entry of entries) {
    check(entry && typeof entry === 'object' && !Array.isArray(entry), 'direct-support entry');
    const fields = ['evidence_ref', 'evidence_sha256', 'evidence_location', 'quote', 'scope_claim', 'used'];
    check(fields.every(k => Object.hasOwn(entry, k)) && Object.keys(entry).every(k => fields.includes(k)), 'exact entry fields required');
    check(text(entry.evidence_ref) && typeof entry.evidence_sha256 === 'string' &&
      /^[a-f0-9]{64}$/.test(entry.evidence_sha256), 'reference/SHA');
    const pointer = entry.evidence_location;
    check(typeof pointer === 'string' && (pointer === '' || pointer.startsWith('/')) &&
      !/~(?:[^01]|$)/.test(pointer), 'RFC6901 pointer');
    check(text(entry.scope_claim), 'scope_claim must be non-empty');
    check(typeof entry.used === 'boolean', 'used must be explicitly boolean');
    // Same contained repository reader as CR-13/15, supplied by the consumer.
    const bytes = readEvidence(entry.evidence_ref);
    check(createHash('sha256').update(bytes).digest('hex') === entry.evidence_sha256, 'evidence SHA mismatch');
    let value = JSON.parse(bytes.toString());
    for (const token of pointer === '' ? [] : pointer.slice(1).split('/')) {
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
      check(value !== null && typeof value === 'object' && Object.hasOwn(value, key), 'evidence location missing');
      value = value[key];
    }
    check(isDeepStrictEqual(entry.quote, value), 'quote must exactly match resolved JSON value');
    // used:false still requires faithful evidence; neither boolean value is inferred.
  }
  // Empty/absent declarations assert no coverage. No claim of completeness,
  // understanding, valid scope, changed judgment or verified Knowledge is produced.
}
