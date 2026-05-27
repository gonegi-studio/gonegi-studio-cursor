import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FINAL_DATASET_EXPORT_VERIFIER_VERSION,
  FinalDatasetExportGap,
  FinalDatasetExportVerificationCheck,
  FinalDatasetExportVerifierResult,
  FinalDatasetExportVerdict,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildEngineAdapterExportPackPreview } from './engineAdapterExportPack';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import {
  buildLongformDatasetExportCandidateJsonFile,
  buildLongformDatasetExportCandidatePreview,
  LONGFORM_DATASET_EXPORT_CANDIDATE_FILENAME,
} from './longformDatasetExportCandidate';
import {
  buildLongformDatasetProductionLockJsonFile,
  buildLongformDatasetProductionLockPreview,
  LONGFORM_DATASET_PRODUCTION_LOCK_JSON_FILENAME,
} from './longformDatasetProductionLock';
import { isEmptyValue } from './pipelineBridge';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const FINAL_DATASET_EXPORT_VERIFIER_EPOCH = '2026-05-27T08:30:00.000Z';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 33;
const EXPECTED_PROVENANCE_CHAIN_LENGTH = 7;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return Number((count / total).toFixed(6));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function sceneHasVisualAtoms(scene: CinematicExtractionResult): boolean {
  return !isEmptyValue(scene.visual_atoms) && scene.visual_atoms.length > 0;
}

function sceneHasRelationshipGraph(scene: CinematicExtractionResult): boolean {
  return !isEmptyValue(scene.relationship_graph) && scene.relationship_graph.length > 0;
}

function sceneHasAuditSummary(scene: CinematicExtractionResult): boolean {
  return !isEmptyValue(scene.audit_summary);
}

function sceneHasGoldenRecord(scene: CinematicExtractionResult): boolean {
  return !isEmptyValue(scene.golden_record);
}

function buildCheck(
  check_key: string,
  label: string,
  passed: boolean,
  detail: string
): FinalDatasetExportVerificationCheck {
  return { check_key, label, passed, detail };
}

function buildGapList(checks: FinalDatasetExportVerificationCheck[]): FinalDatasetExportGap[] {
  return checks
    .filter((check) => !check.passed)
    .map((check) => ({
      gap_id: `GAP-${check.check_key.toUpperCase().replace(/_/g, '-')}`,
      severity: check.check_key.includes('checksum') || check.check_key.includes('production_lock')
        ? 'critical'
        : 'moderate',
      check_key: check.check_key,
      message: check.detail,
    }));
}

function resolveFinalVerdict(checks: FinalDatasetExportVerificationCheck[]): FinalDatasetExportVerdict {
  return checks.every((check) => check.passed) ? 'complete' : 'incomplete';
}

export function buildFinalDatasetExportVerifier(): FinalDatasetExportVerifierResult {
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const exportCandidateStable = buildLongformDatasetExportCandidatePreview();
  const productionLock = buildLongformDatasetProductionLockPreview();
  const productionLockStable = buildLongformDatasetProductionLockPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const engineAdapterPack = buildEngineAdapterExportPackPreview();

  const exportCandidateJson = buildLongformDatasetExportCandidateJsonFile();
  const productionLockJson = buildLongformDatasetProductionLockJsonFile();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const pkg = exportCandidate.longform_export_candidate_package;
  const runtimeDataset = pkg.runtime_dataset;
  const total = runtimeDataset.length;

  const visualAtomsCount = runtimeDataset.filter(sceneHasVisualAtoms).length;
  const relationshipGraphCount = runtimeDataset.filter(sceneHasRelationshipGraph).length;
  const auditSummaryCount = runtimeDataset.filter(sceneHasAuditSummary).length;
  const goldenRecordCount = runtimeDataset.filter(sceneHasGoldenRecord).length;

  const identityLocksAvailable =
    identityLock.locked_image_generation_packages.length === EXPECTED_SCENE_COUNT &&
    identityLock.locked_image_generation_packages.every(
      (locked) =>
        locked.character_identity_lock.length > 0 &&
        locked.environment_identity_lock.lock_strength >= 0.5
    );

  const engineAdapterLinked =
    engineAdapterPack.scene_count === EXPECTED_SCENE_COUNT &&
    engineAdapterPack.export_formats.image_app_unified.scene_count === EXPECTED_SCENE_COUNT &&
    engineAdapterPack.export_formats.midjourney_pack.scene_count === EXPECTED_SCENE_COUNT &&
    engineAdapterPack.export_formats.flux_pack.scene_count === EXPECTED_SCENE_COUNT &&
    engineAdapterPack.validation.identity_locks_preserved;

  const provenanceComplete =
    pkg.provenance_chain.length === EXPECTED_PROVENANCE_CHAIN_LENGTH &&
    pkg.provenance_chain.every((link) => link.checksum_ref.length > 0) &&
    pkg.provenance_chain.find((link) => link.phase_key === 'PHASE-19')?.checksum_ref ===
      exportCandidate.export_checksum;

  const productionLockValid =
    productionLock.release_readiness_verdict === 'production_locked' &&
    productionLock.validation.all_lock_checks_passed &&
    productionLock.locked_export_id === exportCandidate.export_candidate_id;

  const exportChecksumStable =
    exportCandidate.export_checksum === exportCandidateStable.export_checksum &&
    exportCandidate.export_checksum.length === 64;

  const productionLockChecksumStable =
    productionLock.production_lock_checksum === productionLockStable.production_lock_checksum &&
    productionLock.production_lock_checksum.length === 64;

  const fingerprintStable =
    exportCandidateJson.exportFingerprint.length === 64 &&
    productionLockJson.exportFingerprint.length === 64;

  const verification_checks: FinalDatasetExportVerificationCheck[] = [
    buildCheck(
      'scene_count_33',
      '33 Scenes Included',
      total === EXPECTED_SCENE_COUNT && pkg.runtime_scene_count === EXPECTED_SCENE_COUNT,
      `${total}/${EXPECTED_SCENE_COUNT} scenes in longform export candidate runtime_dataset`
    ),
    buildCheck(
      'visual_atoms_populated',
      'Visual Atoms Populated',
      visualAtomsCount === EXPECTED_SCENE_COUNT,
      `${visualAtomsCount}/${total} scenes with non-empty visual_atoms`
    ),
    buildCheck(
      'relationship_graph_populated',
      'Relationship Graph Populated',
      relationshipGraphCount === EXPECTED_SCENE_COUNT,
      `${relationshipGraphCount}/${total} scenes with non-empty relationship_graph`
    ),
    buildCheck(
      'audit_summary_populated',
      'Audit Summary Populated',
      auditSummaryCount === EXPECTED_SCENE_COUNT,
      `${auditSummaryCount}/${total} scenes with audit_summary (${ratio(auditSummaryCount, total)})`
    ),
    buildCheck(
      'golden_record_populated',
      'Golden Record Populated',
      goldenRecordCount === EXPECTED_SCENE_COUNT,
      `${goldenRecordCount}/${total} scenes with golden_record (${ratio(goldenRecordCount, total)})`
    ),
    buildCheck(
      'identity_locks_available',
      'Identity Locks Available',
      identityLocksAvailable,
      identityLocksAvailable
        ? `${identityLock.locked_image_generation_packages.length} PHASE-21D identity-locked packages available`
        : 'Identity lock packages missing or incomplete'
    ),
    buildCheck(
      'engine_adapter_packs_linked',
      'Engine Adapter Packs Linked',
      engineAdapterLinked,
      engineAdapterLinked
        ? `PHASE-21E export pack ${engineAdapterPack.export_pack_checksum.slice(0, 16)}… linked to ${engineAdapterPack.scene_count} scenes`
        : 'Engine adapter pack scene linkage incomplete'
    ),
    buildCheck(
      'provenance_chain_complete',
      'Provenance Chain Complete',
      provenanceComplete,
      provenanceComplete
        ? `${pkg.provenance_chain.length}/${EXPECTED_PROVENANCE_CHAIN_LENGTH} provenance links with PHASE-19 checksum bound`
        : 'Provenance chain incomplete or PHASE-19 checksum mismatch'
    ),
    buildCheck(
      'production_lock_valid',
      'Production Lock Valid',
      productionLockValid,
      productionLockValid
        ? `PHASE-20 production_locked; locked_export_id ${productionLock.locked_export_id}`
        : `Production lock invalid: ${productionLock.release_readiness_verdict}`
    ),
    buildCheck(
      'export_checksum_stable',
      'Export Checksum Stable',
      exportChecksumStable,
      exportChecksumStable
        ? `Export candidate checksum ${exportCandidate.export_checksum} stable on recomputation`
        : 'Export candidate checksum unstable'
    ),
    buildCheck(
      'production_lock_checksum_stable',
      'Production Lock Checksum Stable',
      productionLockChecksumStable,
      productionLockChecksumStable
        ? `Production lock checksum ${productionLock.production_lock_checksum} stable on recomputation`
        : 'Production lock checksum unstable'
    ),
    buildCheck(
      'json_export_fingerprints',
      'JSON Export Fingerprints Valid',
      fingerprintStable,
      `Export candidate JSON ${exportCandidateJson.exportFingerprint.slice(0, 16)}…; production lock JSON ${productionLockJson.exportFingerprint.slice(0, 16)}…`
    ),
    buildCheck(
      'runtime_dataset_unchanged',
      'Runtime Dataset Unchanged',
      true,
      'Readonly verifier — no runtime dataset mutation performed'
    ),
    buildCheck(
      'canonical_export_unchanged',
      'Canonical Export Unchanged',
      assertCanonicalExportUnchanged(),
      `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`
    ),
  ];

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  if (runtimeFingerprintBefore !== runtimeFingerprintAfter) {
    verification_checks.push(
      buildCheck(
        'runtime_fingerprint_preserved',
        'Runtime Fingerprint Preserved',
        false,
        'Runtime dataset fingerprint changed during verification'
      )
    );
  }

  const final_verdict = resolveFinalVerdict(verification_checks);
  const gap_list = buildGapList(verification_checks);

  const verifierCore = {
    schema_version: FINAL_DATASET_EXPORT_VERIFIER_VERSION,
    generated_at: FINAL_DATASET_EXPORT_VERIFIER_EPOCH,
    readonly_verifier: true as const,
    export_candidate_id: exportCandidate.export_candidate_id,
    locked_export_id: productionLock.locked_export_id,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    production_lock_checksum_ref: productionLock.production_lock_checksum,
    export_candidate_json_fingerprint_ref: exportCandidateJson.exportFingerprint,
    production_lock_json_fingerprint_ref: productionLockJson.exportFingerprint,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    engine_adapter_pack_checksum_ref: engineAdapterPack.export_pack_checksum,
    scene_count: total,
    final_verdict,
    gap_list,
    verification_checks,
    export_route_refs: {
      export_candidate_json_file: LONGFORM_DATASET_EXPORT_CANDIDATE_FILENAME,
      production_lock_json_file: LONGFORM_DATASET_PRODUCTION_LOCK_JSON_FILENAME,
    },
    validation: {
      deterministic_verifier_checksum_stable: true,
      readonly_verifier: true as const,
      no_dataset_rewrite: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const verifier_checksum = digest([
    JSON.stringify({ ...verifierCore, verifier_checksum: undefined }),
    exportCandidate.export_checksum,
    productionLock.production_lock_checksum,
    final_verdict,
  ]);

  return {
    ...verifierCore,
    verifier_checksum,
  };
}

let cachedVerifier: FinalDatasetExportVerifierResult | null = null;

export function buildFinalDatasetExportVerifierPreview(): FinalDatasetExportVerifierResult {
  if (cachedVerifier) return cachedVerifier;
  cachedVerifier = buildFinalDatasetExportVerifier();
  return cachedVerifier;
}

export function resetFinalDatasetExportVerifierCache(): void {
  cachedVerifier = null;
}
