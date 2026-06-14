import {
  APPROVED_ORIGINALS_DIR,
  assertApprovedOriginalsPresent,
  approvedOriginalsFilesExist,
} from './approvedOriginalsLoader.js';

export function assertApprovedOriginalsFrozen(projectRoot?: string): {
  artstyle_count: number;
  character_count: number;
  frozen: boolean;
} {
  const result = assertApprovedOriginalsPresent(projectRoot);
  return {
    artstyle_count: result.artstyle_count,
    character_count: result.character_count,
    frozen: result.manifest_locked,
  };
}

/** @deprecated Approved originals are user-managed. Validation only — no writes. */
export const ensureApprovedOriginalsFrozen = assertApprovedOriginalsFrozen;

/** @deprecated Source-of-truth mirror layer removed. Approved originals are the only source. */
export function syncSourceOfTruthFromApprovedOriginals(_projectRoot?: string): void {
  // no-op: approved_originals are user-managed and must not be mirrored or rewritten
}

export { APPROVED_ORIGINALS_DIR, approvedOriginalsFilesExist };
