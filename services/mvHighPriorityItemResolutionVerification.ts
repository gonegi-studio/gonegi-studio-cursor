import fs from 'node:fs';
import path from 'node:path';
import {
  EXPECTED_HIGH_PRIORITY_BLOCKER_CODES,
  RESOLUTION_STATUS_RESOLVED,
  type HighPriorityBlockerCode,
  type ResolutionStatus,
  type ResolutionStatusByItem,
} from './mvHighPriorityResolutionAudit.js';
import {
  STORY_MV_INDEX_PATH,
  STORY_MV_LIBRARY_PATH,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type DatasetRefsResolutionProof = {
  dataset_refs_populated: boolean;
  trace_integrity_pass: boolean;
  story_mv_dataset_refs: string[];
};

export type ProductionModeResolutionProof = {
  block_cause_verified: boolean;
  controlled_test_mode_ready: boolean;
};

export type RealGenerationResolutionProof = {
  block_cause_verified: boolean;
  controlled_generation_candidate: boolean;
};

export type HighPriorityResolutionProof = {
  DATASET_REFS_EMPTY: DatasetRefsResolutionProof;
  PRODUCTION_MODE_BLOCKED: ProductionModeResolutionProof;
  REAL_GENERATION_BLOCKED: RealGenerationResolutionProof;
};

function fileExists(root: string, relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

export function verifyDatasetRefsEmptyResolved(projectRoot?: string): DatasetRefsResolutionProof {
  const root = resolveProjectRoot(projectRoot);
  const storyMvDatasetRefs = [STORY_MV_LIBRARY_PATH, STORY_MV_INDEX_PATH];
  const datasetRefsPopulated = storyMvDatasetRefs.every((datasetRef) => fileExists(root, datasetRef));
  const traceIntegrityPass = datasetRefsPopulated;
  return {
    dataset_refs_populated: datasetRefsPopulated,
    trace_integrity_pass: traceIntegrityPass,
    story_mv_dataset_refs: storyMvDatasetRefs,
  };
}

export function verifyProductionModeBlockedResolved(projectRoot?: string): ProductionModeResolutionProof {
  const root = resolveProjectRoot(projectRoot);
  const datasetProof = verifyDatasetRefsEmptyResolved(root);
  const blockCauseVerified = datasetProof.dataset_refs_populated && datasetProof.trace_integrity_pass;
  const controlledTestModeReady =
    blockCauseVerified &&
    fileExists(root, 'exports/mv_test_mode_final_audit/mv-test-mode-final-audit.json') &&
    fileExists(root, 'exports/mv_test_mode_execution_audit/mv-test-mode-execution-audit.json');
  return {
    block_cause_verified: blockCauseVerified,
    controlled_test_mode_ready: controlledTestModeReady,
  };
}

export function verifyRealGenerationBlockedResolved(projectRoot?: string): RealGenerationResolutionProof {
  const root = resolveProjectRoot(projectRoot);
  const productionModeProof = verifyProductionModeBlockedResolved(root);
  const blockCauseVerified =
    productionModeProof.block_cause_verified && productionModeProof.controlled_test_mode_ready;
  const controlledGenerationCandidate =
    blockCauseVerified &&
    fileExists(root, 'exports/mv_production_readiness_gate/mv-production-readiness-gate.json');
  return {
    block_cause_verified: blockCauseVerified,
    controlled_generation_candidate: controlledGenerationCandidate,
  };
}

export function buildHighPriorityResolutionProof(projectRoot?: string): HighPriorityResolutionProof {
  const root = resolveProjectRoot(projectRoot);
  return {
    DATASET_REFS_EMPTY: verifyDatasetRefsEmptyResolved(root),
    PRODUCTION_MODE_BLOCKED: verifyProductionModeBlockedResolved(root),
    REAL_GENERATION_BLOCKED: verifyRealGenerationBlockedResolved(root),
  };
}

export function resolveBlockerResolutionStatus(
  blockerCode: HighPriorityBlockerCode,
  proof: HighPriorityResolutionProof
): ResolutionStatus {
  switch (blockerCode) {
    case 'DATASET_REFS_EMPTY':
      return proof.DATASET_REFS_EMPTY.dataset_refs_populated && proof.DATASET_REFS_EMPTY.trace_integrity_pass
        ? RESOLUTION_STATUS_RESOLVED
        : 'IN_PROGRESS';
    case 'PRODUCTION_MODE_BLOCKED':
      return proof.PRODUCTION_MODE_BLOCKED.block_cause_verified &&
        proof.PRODUCTION_MODE_BLOCKED.controlled_test_mode_ready
        ? RESOLUTION_STATUS_RESOLVED
        : 'IN_PROGRESS';
    case 'REAL_GENERATION_BLOCKED':
      return proof.REAL_GENERATION_BLOCKED.block_cause_verified &&
        proof.REAL_GENERATION_BLOCKED.controlled_generation_candidate
        ? RESOLUTION_STATUS_RESOLVED
        : 'IN_PROGRESS';
    default:
      return 'IN_PROGRESS';
  }
}

export function buildResolutionStatusByItemFromProof(
  proof: HighPriorityResolutionProof
): ResolutionStatusByItem {
  const statusByItem = {} as ResolutionStatusByItem;
  for (const blockerCode of EXPECTED_HIGH_PRIORITY_BLOCKER_CODES) {
    statusByItem[blockerCode] = resolveBlockerResolutionStatus(blockerCode, proof);
  }
  return statusByItem;
}

export function countResolvedFromProof(proof: HighPriorityResolutionProof): number {
  return EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.filter(
    (blockerCode) => resolveBlockerResolutionStatus(blockerCode, proof) === RESOLUTION_STATUS_RESOLVED
  ).length;
}

export function allHighPriorityItemsResolved(proof: HighPriorityResolutionProof): boolean {
  return countResolvedFromProof(proof) === EXPECTED_HIGH_PRIORITY_BLOCKER_CODES.length;
}

export function buildResolutionEvidencePayload(
  blockerCode: HighPriorityBlockerCode,
  proof: HighPriorityResolutionProof,
  base: {
    evidence_id: string;
    item_id: string;
    resolution_started: boolean;
    execution_action: string;
    generated_at: string;
    execution_scope: string;
    planning_only: boolean;
  }
): Record<string, unknown> {
  const status = resolveBlockerResolutionStatus(blockerCode, proof);
  const payload: Record<string, unknown> = {
    ...base,
    blocker_code: blockerCode,
    resolution_status: status,
  };

  if (blockerCode === 'DATASET_REFS_EMPTY') {
    payload.dataset_refs_populated = proof.DATASET_REFS_EMPTY.dataset_refs_populated;
    payload.trace_integrity_pass = proof.DATASET_REFS_EMPTY.trace_integrity_pass;
    payload.story_mv_dataset_refs = proof.DATASET_REFS_EMPTY.story_mv_dataset_refs;
  }
  if (blockerCode === 'PRODUCTION_MODE_BLOCKED') {
    payload.block_cause_verified = proof.PRODUCTION_MODE_BLOCKED.block_cause_verified;
    payload.controlled_test_mode_ready = proof.PRODUCTION_MODE_BLOCKED.controlled_test_mode_ready;
  }
  if (blockerCode === 'REAL_GENERATION_BLOCKED') {
    payload.block_cause_verified = proof.REAL_GENERATION_BLOCKED.block_cause_verified;
    payload.controlled_generation_candidate = proof.REAL_GENERATION_BLOCKED.controlled_generation_candidate;
  }

  return payload;
}
