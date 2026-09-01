// Prospective CR-17 requiredness only. Existing index is a frozen exemption
// boundary, NOT a current canonical truth source or a latest-index selector.
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositoryEvidenceReader } from './genieExternalTutorConsultationContract.mjs';
import { validateEvidenceConsumption } from './genieEvidenceConsumptionIntegrity.mjs';

const reader = repositoryEvidenceReader(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const boundaryRef = 'project_brain/story_scenario_intelligence/project-brain-experience-index-v6.json';
const boundarySha = 'b60aae6cc563fff05581419e12057f1e588fba2343124581a0993ea016426498';
const check = (ok, detail) => { if (!ok) throw new Error(`CR17_REQUIREDNESS_INVALID: ${detail}`); };
function historicalIds() {
  const bytes = reader(boundaryRef);
  check(createHash('sha256').update(bytes).digest('hex') === boundarySha, 'historical boundary SHA mismatch');
  const index = JSON.parse(bytes);
  return new Set(Object.values(index.by_experience_kind).flat());
}

/** Exact action declaration only: never infer/normalize an action or generate
 * used/quote/scope values. Other action types retain the original CR-17 behavior.
 * Identity reuse and action mislabeling are not solved by this requiredness rule.
 */
export function validateReverificationEvidence(record, readEvidence = reader) {
  check(record && typeof record.experience_id === 'string' && record.experience_id.trim().length > 0,
    'Experience identity required');
  if (record.action?.action_type === 'reverification' && !historicalIds().has(record.experience_id)) {
    const entries = record.decision?.direct_support_evidence;
    check(Array.isArray(entries) && entries.length > 0,
      'new reverification requires non-empty decision.direct_support_evidence');
  }
  validateEvidenceConsumption(record.decision, readEvidence);
}
