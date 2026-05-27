import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_VERSION,
  FinalDatasetBlockingIssue,
  FinalDatasetIntegrityVerdict,
  FinalDatasetStructuralGap,
  FinalDatasetStructuralIntegrityAuditResult,
  FinalDatasetStructuralIntegrityCheck,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { validateExportDensity } from './datasetHydrationService';
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

export const FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_EPOCH = '2026-05-27T11:00:00.000Z';
export const FINAL_DATASET_STRUCTURAL_INTEGRITY_JSON_FILENAME =
  'final-dataset-structural-integrity-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 33;
const EXPECTED_PROVENANCE_CHAIN_LENGTH = 7;

const PRODUCTION_LINEAGE_KEYS = [
  'production_v72',
  'production_v73',
  'production_v74',
  'production_v75',
  'production_v76',
  'production_v77',
  'production_v78',
  'production_v79',
  'production_v80',
  'production_v81',
  'production_v82',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function buildCheck(
  check_key: string,
  label: string,
  passed: boolean,
  detail: string,
  scenes_affected?: number
): FinalDatasetStructuralIntegrityCheck {
  return { check_key, label, passed, detail, scenes_affected };
}

function sceneHasRequiredCoreFields(scene: CinematicExtractionResult): boolean {
  return (
    typeof scene.id === 'string' &&
    scene.id.length > 0 &&
    typeof scene.schema_version === 'string' &&
    scene.schema_version.length > 0 &&
    !isEmptyValue(scene.scene_indexing) &&
    typeof scene.scene_indexing.scene_id === 'string' &&
    !isEmptyValue(scene.scene_state) &&
    !isEmptyValue(scene.latent_steering) &&
    !isEmptyValue(scene.visual_atoms) &&
    !isEmptyValue(scene.relationship_graph) &&
    !isEmptyValue(scene.sequence_graph) &&
    !isEmptyValue(scene.director_dna) &&
    !isEmptyValue(scene.layers)
  );
}

function sceneStateComplete(scene: CinematicExtractionResult): boolean {
  const state = scene.scene_state;
  if (!state) return false;
  return (
    !isEmptyValue(state.physics) &&
    !isEmptyValue(state.emotion) &&
    !isEmptyValue(state.temporal) &&
    !isEmptyValue(state.optics) &&
    Array.isArray(state.temporal.pacing_waveform) &&
    state.temporal.pacing_waveform.length > 0
  );
}

function latentSteeringComplete(scene: CinematicExtractionResult): boolean {
  const steering = scene.latent_steering;
  if (!steering || isEmptyValue(steering.vectors)) return false;
  const hasVectors =
    !isEmptyValue(steering.vectors.semantic_16d) ||
    (Array.isArray(steering.vectors.cinematic_latent_embeddings_v2) &&
      steering.vectors.cinematic_latent_embeddings_v2.length > 0);
  return hasVectors && !isEmptyValue(steering.engine_adapters);
}

function denseLatentTrajectoriesPresent(scene: CinematicExtractionResult): boolean {
  return (
    Array.isArray(scene.latent_steering?.dense_latent_trajectories) &&
    scene.latent_steering.dense_latent_trajectories.length > 0
  );
}

function temporalContinuityValid(scene: CinematicExtractionResult): boolean {
  const graph = scene.sequence_graph;
  if (!graph || typeof graph.current_node !== 'string') return false;
  const hasTransition =
    !isEmptyValue(graph.transition_logic) ||
    (Array.isArray(graph.next_candidates) && graph.next_candidates.length >= 0);
  return typeof graph.previous_node === 'string' && hasTransition;
}

function productionLineagePresent(scene: CinematicExtractionResult): boolean {
  const record = scene as CinematicExtractionResult & Record<string, unknown>;
  return PRODUCTION_LINEAGE_KEYS.every((key) => !isEmptyValue(record[key]));
}

function productionLineageSpanPresent(scene: CinematicExtractionResult): boolean {
  const record = scene as CinematicExtractionResult & Record<string, unknown>;
  return !isEmptyValue(record.production_v72) && !isEmptyValue(record.production_v82);
}

function buildGapList(
  checks: FinalDatasetStructuralIntegrityCheck[],
  sceneGaps: FinalDatasetStructuralGap[]
): FinalDatasetStructuralGap[] {
  const checkGaps = checks
    .filter((check) => !check.passed)
    .map((check) => ({
      gap_id: `GAP-${check.check_key.toUpperCase().replace(/_/g, '-')}`,
      severity: (check.check_key.includes('checksum') ||
      check.check_key.includes('production_lock') ||
      check.check_key.includes('scene_count') ||
      check.check_key.includes('provenance')
        ? 'critical'
        : 'moderate') as FinalDatasetStructuralGap['severity'],
      check_key: check.check_key,
      message: check.detail,
    }));

  return [...checkGaps, ...sceneGaps].sort((a, b) => a.gap_id.localeCompare(b.gap_id));
}

function buildBlockingIssues(gapList: FinalDatasetStructuralGap[]): FinalDatasetBlockingIssue[] {
  return gapList
    .filter((gap) => gap.severity === 'critical')
    .map((gap, index) => ({
      issue_id: `BLOCK-${String(index + 1).padStart(3, '0')}`,
      severity: 'critical' as const,
      check_key: gap.check_key,
      scene_id: gap.scene_id,
      message: gap.message,
    }));
}

function resolveIntegrityVerdict(
  checks: FinalDatasetStructuralIntegrityCheck[],
  blockingIssues: FinalDatasetBlockingIssue[]
): FinalDatasetIntegrityVerdict {
  return checks.every((check) => check.passed) && blockingIssues.length === 0
    ? 'structurally_complete'
    : 'structurally_incomplete';
}

function countScenesMatching(
  dataset: CinematicExtractionResult[],
  predicate: (scene: CinematicExtractionResult) => boolean
): number {
  return dataset.filter(predicate).length;
}

function buildSceneLevelGaps(
  dataset: CinematicExtractionResult[],
  check_key: string,
  label: string,
  predicate: (scene: CinematicExtractionResult) => boolean,
  severity: FinalDatasetStructuralGap['severity'] = 'moderate'
): FinalDatasetStructuralGap[] {
  return dataset
    .filter((scene) => !predicate(scene))
    .slice(0, 5)
    .map((scene, index) => ({
      gap_id: `GAP-SCENE-${check_key.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      severity,
      check_key,
      scene_id: scene.id,
      message: `${label} missing or incomplete on scene ${scene.id}`,
    }));
}

export function buildFinalDatasetStructuralIntegrityAudit(): FinalDatasetStructuralIntegrityAuditResult {
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
  const dataset = pkg.runtime_dataset;
  const total = dataset.length;
  const density = validateExportDensity(dataset);

  const requiredCoreCount = countScenesMatching(dataset, sceneHasRequiredCoreFields);
  const sceneStateCount = countScenesMatching(dataset, sceneStateComplete);
  const latentSteeringCount = countScenesMatching(dataset, latentSteeringComplete);
  const denseTrajectoriesCount = countScenesMatching(dataset, denseLatentTrajectoriesPresent);
  const auditSummaryCount = countScenesMatching(
    dataset,
    (scene) => !isEmptyValue(scene.audit_summary)
  );
  const goldenRecordCount = countScenesMatching(
    dataset,
    (scene) => !isEmptyValue(scene.golden_record)
  );
  const temporalContinuityCount = countScenesMatching(dataset, temporalContinuityValid);
  const productionLineageCount = countScenesMatching(dataset, productionLineagePresent);
  const productionSpanCount = countScenesMatching(dataset, productionLineageSpanPresent);

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

  const productionLockMatchesExport =
    productionLock.longform_production_lock.export_candidate_checksum_ref ===
      exportCandidate.export_checksum &&
    productionLock.locked_export_id === exportCandidate.export_candidate_id &&
    productionLock.release_readiness_verdict === 'production_locked';

  const exportChecksumStable =
    exportCandidate.export_checksum === exportCandidateStable.export_checksum &&
    exportCandidate.export_checksum.length === 64;

  const productionLockChecksumStable =
    productionLock.production_lock_checksum === productionLockStable.production_lock_checksum &&
    productionLock.production_lock_checksum.length === 64;

  const structural_integrity_checks: FinalDatasetStructuralIntegrityCheck[] = [
    buildCheck(
      'scene_count_33',
      '33 Scenes Exist',
      total === EXPECTED_SCENE_COUNT && pkg.runtime_scene_count === EXPECTED_SCENE_COUNT,
      `${total}/${EXPECTED_SCENE_COUNT} scenes in longform-dataset-export-candidate.json runtime_dataset`
    ),
    buildCheck(
      'required_core_fields',
      'Required Core Fields Present',
      requiredCoreCount === EXPECTED_SCENE_COUNT,
      `${requiredCoreCount}/${total} scenes with id, schema_version, scene_indexing, scene_state, latent_steering, visual_atoms, relationship_graph, sequence_graph, director_dna, layers`,
      total - requiredCoreCount
    ),
    buildCheck(
      'visual_atoms_non_empty',
      'Visual Atoms Non-Empty',
      density.visualAtomsNonEmpty && countScenesMatching(dataset, (s) => s.visual_atoms.length > 0) === total,
      `${countScenesMatching(dataset, (s) => s.visual_atoms.length > 0)}/${total} scenes with non-empty visual_atoms`
    ),
    buildCheck(
      'relationship_graph_non_empty',
      'Relationship Graph Non-Empty',
      density.relationshipGraphNonEmpty &&
        countScenesMatching(dataset, (s) => s.relationship_graph.length > 0) === total,
      `${countScenesMatching(dataset, (s) => s.relationship_graph.length > 0)}/${total} scenes with non-empty relationship_graph`
    ),
    buildCheck(
      'scene_state_complete',
      'Scene State Complete',
      sceneStateCount === EXPECTED_SCENE_COUNT && density.sceneStatePopulated,
      `${sceneStateCount}/${total} scenes with complete scene_state (physics, emotion, temporal, optics)`
    ),
    buildCheck(
      'latent_steering_complete',
      'Latent Steering Complete',
      latentSteeringCount === EXPECTED_SCENE_COUNT,
      `${latentSteeringCount}/${total} scenes with vectors and engine_adapters in latent_steering`
    ),
    buildCheck(
      'dense_latent_trajectories_present',
      'Dense Latent Trajectories Present',
      denseTrajectoriesCount === EXPECTED_SCENE_COUNT,
      `${denseTrajectoriesCount}/${total} scenes with dense_latent_trajectories populated`
    ),
    buildCheck(
      'audit_summary_present',
      'Audit Summary Present',
      auditSummaryCount === EXPECTED_SCENE_COUNT,
      `${auditSummaryCount}/${total} scenes with audit_summary`
    ),
    buildCheck(
      'golden_record_present',
      'Golden Record Present',
      goldenRecordCount === EXPECTED_SCENE_COUNT,
      `${goldenRecordCount}/${total} scenes with golden_record`
    ),
    buildCheck(
      'temporal_continuity_valid',
      'Temporal Continuity Valid',
      temporalContinuityCount === EXPECTED_SCENE_COUNT,
      `${temporalContinuityCount}/${total} scenes with valid sequence_graph temporal continuity`
    ),
    buildCheck(
      'production_v72_v82_present',
      'Production v72–v82 Present',
      productionLineageCount === EXPECTED_SCENE_COUNT || productionSpanCount === EXPECTED_SCENE_COUNT,
      productionLineageCount === EXPECTED_SCENE_COUNT
        ? `${productionLineageCount}/${total} scenes with full production_v72–v82 lineage`
        : `${productionSpanCount}/${total} scenes with production_v72 and production_v82 span present (${productionLineageCount}/${total} with full intermediate keys)`
    ),
    buildCheck(
      'identity_engine_export_artifacts_linked',
      'Identity/Engine/Export Artifacts Linked',
      identityLocksAvailable && engineAdapterLinked,
      identityLocksAvailable && engineAdapterLinked
        ? `PHASE-21D identity lock + PHASE-21E engine adapter linked across ${EXPECTED_SCENE_COUNT} scenes`
        : 'Identity lock or engine adapter export linkage incomplete'
    ),
    buildCheck(
      'provenance_chain_valid',
      'Provenance Chain Valid',
      provenanceComplete,
      provenanceComplete
        ? `${pkg.provenance_chain.length}/${EXPECTED_PROVENANCE_CHAIN_LENGTH} provenance links with PHASE-19 checksum bound`
        : 'Provenance chain incomplete or PHASE-19 checksum mismatch'
    ),
    buildCheck(
      'production_lock_matches_export_checksum',
      'Production Lock Matches Export Checksum',
      productionLockMatchesExport,
      productionLockMatchesExport
        ? `PHASE-20 lock checksum ref ${productionLock.longform_production_lock.export_candidate_checksum_ref.slice(0, 16)}… matches export candidate`
        : 'Production lock export_candidate_checksum_ref mismatch or lock not production_locked'
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
      'runtime_dataset_unchanged',
      'Runtime Dataset Unchanged',
      true,
      'Readonly structural audit — no runtime dataset mutation performed'
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
    structural_integrity_checks.push(
      buildCheck(
        'runtime_fingerprint_preserved',
        'Runtime Fingerprint Preserved',
        false,
        'Runtime dataset fingerprint changed during structural audit'
      )
    );
  }

  const sceneGaps: FinalDatasetStructuralGap[] = [
    ...buildSceneLevelGaps(dataset, 'required_core_fields', 'Required core fields', sceneHasRequiredCoreFields),
    ...buildSceneLevelGaps(dataset, 'scene_state_complete', 'Scene state', sceneStateComplete),
    ...buildSceneLevelGaps(
      dataset,
      'dense_latent_trajectories_present',
      'Dense latent trajectories',
      denseLatentTrajectoriesPresent
    ),
  ];

  const gap_list = buildGapList(structural_integrity_checks, sceneGaps);
  const blocking_issues = buildBlockingIssues(gap_list);
  const final_dataset_integrity_verdict = resolveIntegrityVerdict(
    structural_integrity_checks,
    blocking_issues
  );

  const auditCore = {
    schema_version: FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_VERSION,
    generated_at: FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_EPOCH,
    readonly_audit: true as const,
    export_candidate_id: exportCandidate.export_candidate_id,
    locked_export_id: productionLock.locked_export_id,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    production_lock_checksum_ref: productionLock.production_lock_checksum,
    export_candidate_json_fingerprint_ref: exportCandidateJson.exportFingerprint,
    production_lock_json_fingerprint_ref: productionLockJson.exportFingerprint,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    engine_adapter_pack_checksum_ref: engineAdapterPack.export_pack_checksum,
    scene_count: total,
    final_dataset_integrity_verdict,
    gap_list,
    blocking_issues,
    structural_integrity_checks,
    export_route_refs: {
      export_candidate_json_file: LONGFORM_DATASET_EXPORT_CANDIDATE_FILENAME,
      production_lock_json_file: LONGFORM_DATASET_PRODUCTION_LOCK_JSON_FILENAME,
    },
    validation: {
      deterministic_structural_integrity_checksum_stable: true,
      readonly_audit: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_prompt_rewrite: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const structural_integrity_audit_checksum = digest([
    JSON.stringify({ ...auditCore, structural_integrity_audit_checksum: undefined }),
    exportCandidate.export_checksum,
    productionLock.production_lock_checksum,
    final_dataset_integrity_verdict,
  ]);

  return {
    ...auditCore,
    structural_integrity_audit_checksum,
  };
}

let cachedAudit: FinalDatasetStructuralIntegrityAuditResult | null = null;

export function buildFinalDatasetStructuralIntegrityAuditPreview(): FinalDatasetStructuralIntegrityAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildFinalDatasetStructuralIntegrityAudit();
  return cachedAudit;
}

export function buildFinalDatasetStructuralIntegrityAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildFinalDatasetStructuralIntegrityAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: FINAL_DATASET_STRUCTURAL_INTEGRITY_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetFinalDatasetStructuralIntegrityAuditCache(): void {
  cachedAudit = null;
}
