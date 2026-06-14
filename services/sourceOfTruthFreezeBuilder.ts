import { assertApprovedOriginalsPresent } from './approvedOriginalsLoader.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export function ensureSourceOfTruthFrozen(projectRoot?: string): {
  artstyle_count: number;
  character_count: number;
  timesetting_count: number;
  frozen: boolean;
} {
  const result = assertApprovedOriginalsPresent(projectRoot);
  return {
    artstyle_count: result.artstyle_count,
    character_count: result.character_count,
    timesetting_count: result.timesetting_count,
    frozen: result.manifest_locked,
  };
}

export { APPROVED_ORIGINALS_DIR as SOURCE_OF_TRUTH_DIR, approvedOriginalsFilesExist as sourceOfTruthFilesExist } from './approvedOriginalsLoader.js';
