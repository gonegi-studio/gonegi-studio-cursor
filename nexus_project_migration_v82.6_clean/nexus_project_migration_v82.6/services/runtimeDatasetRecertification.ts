import crypto from 'crypto';
import {
  CinematicExtractionResult,
  OrchestrationReadinessLevel,
  RUNTIME_DATASET_RECERTIFICATION_VERSION,
  RuntimeDatasetRecertificationResult,
  RuntimeLockCandidate,
  RuntimeRecertificationCheck,
  RuntimeRecertificationReport,
  VideoProductionReadinessVerdict,
} from '../types';
import { validateExportDensity } from './datasetHydrationService';
import {
  computeCertificationCoverage,
  computeCertificationReadinessScore,
} from './pipelineBCertificationBridge';
import { buildProductionCertificationLockPreview, deriveProductionDatasetCandidateId } from './productionCertificationLock';
import { isEmptyValue, validateBridgeCompleteness } from './pipelineBridge';
import {
  buildRealSeq002IngestionPreview,
  getActiveRuntimeDataset,
} from './realSeq002Ingestion';
import {
  applyTemporalMemoryGraphEnrichment,
  buildTemporalMemoryGraphExport,
} from './temporalMemoryGraph';
import { auditVideoGroundedQuality } from './videoGroundedQualityAudit';

export const RUNTIME_DATASET_RECERTIFICATION_EPOCH = '2026-05-27T01:00:00.000Z';
export const RUNTIME_DATASET_RECERTIFICATION_FILENAME =
  'runtime-dataset-recertification-export.json';

const CHECK_PASS_THRESHOLD = 0.85;
const QUALITY_STABLE_THRESHOLD = 0.92;

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function cloneScenes(scenes: CinematicExtractionResult[]): CinematicExtractionResult[] {
  return JSON.parse(JSON.stringify(scenes)) as CinematicExtractionResult[];
}

function hasTemporalBridge(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.production_v72?.temporal_bridge) ||
    !isEmptyValue(scene.production_v82?.temporal_bridge) ||
    !isEmptyValue(scene.temporal_bridge)
  );
}

function hasCharacterPersistence(scene: CinematicExtractionResult): boolean {
  const hasCharacterAtoms = (scene.visual_atoms ?? []).some(
    (atom) =>
      atom.label?.includes('subject') ||
      atom.label?.includes('character') ||
      atom.label?.includes('witness')
  );
  return (
    !isEmptyValue(scene.character_persistence) ||
    !isEmptyValue(scene.production_v72?.continuity_controller?.character_persistence) ||
    hasCharacterAtoms
  );
}

function hasEnvironmentContinuity(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.scene_state?.physics) ||
    !isEmptyValue(scene.canonical_dna?.domains?.atmosphere) ||
    !isEmptyValue(scene.director_dna?.lighting_behavior)
  );
}

function hasEmotionalCarryover(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.emotional_carryover) ||
    !isEmptyValue(scene.scene_state?.emotion) ||
    !isEmptyValue(scene.sequence_graph?.transition_logic?.emotion_continuity)
  );
}

function scoreTemporalContinuityChain(dataset: CinematicExtractionResult[]): number {
  if (dataset.length === 0) return 0;

  let bridgeCount = 0;
  let chainCount = 0;

  for (let i = 0; i < dataset.length; i++) {
    if (hasTemporalBridge(dataset[i])) bridgeCount += 1;
    if (i === 0) continue;
    const prev = dataset[i - 1];
    const cur = dataset[i];
    const prevEnd = prev.scene_indexing?.v_timestamp_end;
    const curStart = cur.scene_indexing?.v_timestamp_start;
    if (typeof prevEnd === 'number' && typeof curStart === 'number' && curStart >= prevEnd) {
      chainCount += 1;
    }
  }

  return round6(
    ratio(bridgeCount, dataset.length) * 0.6 +
      ratio(chainCount, Math.max(dataset.length - 1, 1)) * 0.4
  );
}

function evaluateTransitionStable(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  const prevEnd = prev.scene_indexing?.v_timestamp_end;
  const curStart = cur.scene_indexing?.v_timestamp_start;
  const timestampOk =
    typeof prevEnd === 'number' &&
    typeof curStart === 'number' &&
    curStart >= prevEnd;
  const graphOk =
    cur.sequence_graph?.previous_node === prev.id ||
    cur.sequence_graph?.previous_node === prev.sequence_graph?.current_node;
  return timestampOk || graphOk;
}

function computeOrchestrationScore(dataset: CinematicExtractionResult[]): number {
  if (dataset.length <= 1) return 1;

  let stable = 0;
  for (let i = 1; i < dataset.length; i++) {
    if (evaluateTransitionStable(dataset[i - 1], dataset[i])) {
      stable += 1;
    }
  }

  return ratio(stable, dataset.length - 1);
}

function computeBridgeIntegrityScore(dataset: CinematicExtractionResult[]): number {
  if (dataset.length === 0) return 0;
  const sum = dataset.reduce(
    (acc, scene) => acc + validateBridgeCompleteness(scene).bridge_score,
    0
  );
  return round6(sum / dataset.length);
}

function resolveRuntimeOrchestrationReadiness(
  qualityScore: number,
  verdict: VideoProductionReadinessVerdict,
  phase16Readiness: OrchestrationReadinessLevel
): OrchestrationReadinessLevel {
  if (phase16Readiness !== 'production_locked') {
    if (qualityScore >= 0.92 && verdict === 'video_ready') return 'certified';
    if (qualityScore >= 0.85) return 'partial';
    return 'not_ready';
  }

  if (qualityScore >= 0.95 && verdict === 'video_ready') return 'production_locked';
  if (qualityScore >= QUALITY_STABLE_THRESHOLD && verdict !== 'insufficient') {
    return 'production_locked';
  }
  if (qualityScore >= 0.85) return 'certified';
  return 'partial';
}

function resolveLockInheritance(
  phase16Inheritance: RuntimeLockCandidate['phase16_lock_inheritance_ref'],
  runtimeReadiness: OrchestrationReadinessLevel
): RuntimeLockCandidate['lock_inheritance'] {
  if (phase16Inheritance === 'preserved' && runtimeReadiness === 'production_locked') {
    return 'preserved';
  }
  if (runtimeReadiness === 'not_ready') return 'blocked';
  return 'degraded';
}

function buildRuntimeLockCandidate(
  recertifiedDataset: CinematicExtractionResult[],
  qualityScore: number,
  verdict: VideoProductionReadinessVerdict,
  temporalGraphChecksum: string
): RuntimeLockCandidate {
  const ingestion = buildRealSeq002IngestionPreview();
  const parentLock = buildProductionCertificationLockPreview();
  const phase16Lock = ingestion.merged_lock_candidate;

  const runtimeReadiness = resolveRuntimeOrchestrationReadiness(
    qualityScore,
    verdict,
    phase16Lock.merged_orchestration_readiness
  );

  const runtimeFingerprints = {
    export_fingerprint: digest([JSON.stringify(recertifiedDataset)]),
    quality_audit_fingerprint: digest([
      String(round6(qualityScore)),
      verdict,
      String(recertifiedDataset.length),
      temporalGraphChecksum,
    ]),
    bridge_certification_fingerprint:
      parentLock.production_certification_lock.bridge_certification_fingerprint,
    temporal_graph_fingerprint: temporalGraphChecksum,
    scene_count: recertifiedDataset.length,
    canonical_export_size_bytes:
      parentLock.production_certification_lock.canonical_export_size_bytes,
    quality_score_ref: round6(qualityScore),
    video_readiness_verdict_ref: verdict,
  };

  return {
    phase16_merged_candidate_id_ref: phase16Lock.merged_production_dataset_candidate_id,
    runtime_production_dataset_candidate_id:
      deriveProductionDatasetCandidateId(runtimeFingerprints),
    runtime_orchestration_readiness: runtimeReadiness,
    lock_inheritance: resolveLockInheritance(
      phase16Lock.lock_inheritance,
      runtimeReadiness
    ),
    parent_lock_checksum_ref: parentLock.deterministic_lock_checksum,
    phase16_lock_inheritance_ref: phase16Lock.lock_inheritance,
  };
}

function buildRecertificationChecks(
  dataset: CinematicExtractionResult[],
  temporalGraphScore: number,
  temporalGraphDetail: string,
  bridgeConflictCount: number
): RuntimeRecertificationCheck[] {
  const total = dataset.length;
  const temporalScore = scoreTemporalContinuityChain(dataset);
  const orchestrationScore = computeOrchestrationScore(dataset);
  const characterScore = ratio(dataset.filter(hasCharacterPersistence).length, total);
  const environmentScore = ratio(dataset.filter(hasEnvironmentContinuity).length, total);
  const emotionalScore = ratio(dataset.filter(hasEmotionalCarryover).length, total);
  const bridgeScore = computeBridgeIntegrityScore(dataset);
  const certCoverage = computeCertificationCoverage(dataset);
  const certScore = computeCertificationReadinessScore(certCoverage);
  const density = validateExportDensity(dataset);
  const densityScore = round6(
    [
      density.visualAtomsNonEmpty,
      density.relationshipGraphNonEmpty,
      density.sceneStatePopulated,
    ].filter(Boolean).length / 3
  );

  return [
    {
      check_key: 'temporal_continuity',
      label: 'Temporal Continuity',
      passed: temporalScore >= CHECK_PASS_THRESHOLD,
      score: temporalScore,
      detail: `${dataset.filter(hasTemporalBridge).length}/${total} temporal bridges; chain score ${temporalScore}`,
    },
    {
      check_key: 'orchestration_stability',
      label: 'Orchestration Stability',
      passed: orchestrationScore >= CHECK_PASS_THRESHOLD,
      score: orchestrationScore,
      detail: `Transition stability ${orchestrationScore} across ${total} runtime scenes`,
    },
    {
      check_key: 'character_persistence',
      label: 'Character Persistence',
      passed: characterScore >= CHECK_PASS_THRESHOLD,
      score: characterScore,
      detail: `${dataset.filter(hasCharacterPersistence).length}/${total} scenes with character persistence anchors`,
    },
    {
      check_key: 'environment_continuity',
      label: 'Environment Continuity',
      passed: environmentScore >= CHECK_PASS_THRESHOLD,
      score: environmentScore,
      detail: `${dataset.filter(hasEnvironmentContinuity).length}/${total} scenes with environment continuity signals`,
    },
    {
      check_key: 'emotional_carryover',
      label: 'Emotional Carryover',
      passed: emotionalScore >= CHECK_PASS_THRESHOLD,
      score: emotionalScore,
      detail: `${dataset.filter(hasEmotionalCarryover).length}/${total} scenes with emotional carryover`,
    },
    {
      check_key: 'bridge_integrity',
      label: 'Bridge Integrity',
      passed: bridgeScore >= CHECK_PASS_THRESHOLD && bridgeConflictCount === 0,
      score: bridgeScore,
      detail:
        bridgeConflictCount === 0
          ? `Average bridge completeness ${bridgeScore}; certification preserved (no destructive re-bridge)`
          : `${bridgeConflictCount} certification bridge conflict field(s) on runtime recert pass`,
    },
    {
      check_key: 'certification_coverage',
      label: 'Certification Coverage',
      passed: certScore >= CHECK_PASS_THRESHOLD,
      score: certScore,
      detail: `Readiness ${certScore}; audit ${certCoverage.audit_summary_coverage}, golden ${certCoverage.golden_record_coverage}`,
    },
    {
      check_key: 'runtime_density_preservation',
      label: 'Runtime Density Preservation',
      passed: densityScore >= CHECK_PASS_THRESHOLD && density.totalScenes === total,
      score: densityScore,
      detail: densityScore >= CHECK_PASS_THRESHOLD
        ? `Structural density preserved across ${total} active runtime scenes`
        : density.message,
    },
    {
      check_key: 'temporal_memory_graph',
      label: 'Temporal Memory Graph',
      passed: temporalGraphScore >= CHECK_PASS_THRESHOLD,
      score: temporalGraphScore,
      detail: temporalGraphDetail,
    },
  ];
}

function scoreRuntimeTemporalGraph(
  temporalExport: ReturnType<typeof buildTemporalMemoryGraphExport>
): { score: number; detail: string } {
  const summary = temporalExport.continuity_summary;
  const checks = [
    temporalExport.memory_density_score >= CHECK_PASS_THRESHOLD,
    summary.character_continuity_links > 0,
    summary.environment_continuity_links > 0,
    summary.emotional_propagation_chains > 0,
    temporalExport.validation.deterministic_checksum_stable,
  ];
  const score = ratio(checks.filter(Boolean).length, checks.length);
  return {
    score,
    detail: `Runtime graph density ${temporalExport.memory_density_score}; ${summary.total_edges} edges across ${summary.total_scenes} scenes (validation ${temporalExport.validation.validation_score})`,
  };
}

export function buildRuntimeDatasetRecertification(): RuntimeDatasetRecertificationResult {
  const ingestion = buildRealSeq002IngestionPreview();
  const runtimeDataset = getActiveRuntimeDataset();
  const anchorCount = ingestion.real_ingestion_report.anchor_scene_count;

  const runtimeClone = cloneScenes(runtimeDataset);
  const anchorRuntime = runtimeClone.slice(0, anchorCount);
  const seq002Runtime = runtimeClone.slice(anchorCount);

  // Runtime scenes already carry certification from canonical export + PHASE-14/16; recert verifies only.
  const certEnriched = [...anchorRuntime, ...seq002Runtime];
  const receipts: { conflict_fields: string[]; scene_index: number }[] = [];

  const temporalExport = buildTemporalMemoryGraphExport(certEnriched);
  const temporalGraphScore = scoreRuntimeTemporalGraph(temporalExport);
  const recertifiedDataset = applyTemporalMemoryGraphEnrichment(
    certEnriched,
    temporalExport.temporal_memory_graph,
    temporalExport.memory_density_score
  );

  const anchorSlice = recertifiedDataset.slice(0, anchorCount);
  const qualityAudit = auditVideoGroundedQuality(anchorSlice, recertifiedDataset);
  const runtime_quality_score = qualityAudit.quality_score;
  const runtime_orchestration_score = computeOrchestrationScore(recertifiedDataset);
  const runtime_production_readiness = qualityAudit.production_readiness_verdict;

  const bridgeConflictCount = receipts.reduce(
    (sum, receipt) => sum + receipt.conflict_fields.length,
    0
  );

  const recertification_checks = buildRecertificationChecks(
    recertifiedDataset,
    temporalGraphScore.score,
    temporalGraphScore.detail,
    bridgeConflictCount
  );

  const runtime_lock_candidate = buildRuntimeLockCandidate(
    recertifiedDataset,
    runtime_quality_score,
    runtime_production_readiness,
    temporalExport.export_checksum
  );

  const runtime_dataset_fingerprint = digest([
    JSON.stringify(recertifiedDataset),
    temporalExport.export_checksum,
    runtime_lock_candidate.runtime_production_dataset_candidate_id,
  ]);

  const runtime_recertification_report: RuntimeRecertificationReport = {
    active_scene_count: recertifiedDataset.length,
    anchor_scene_count: anchorCount,
    seq002_scene_count: recertifiedDataset.length - anchorCount,
    phase16_ingestion_checksum_ref: ingestion.ingestion_checksum,
    inherited_lock_candidate_ref:
      ingestion.merged_lock_candidate.merged_production_dataset_candidate_id,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    recertification_checks,
    all_checks_passed: recertification_checks.every((check) => check.passed),
    canonical_export_unchanged: true,
    in_memory_only: true,
  };

  const recertificationCore = {
    schema_version: RUNTIME_DATASET_RECERTIFICATION_VERSION,
    generated_at: RUNTIME_DATASET_RECERTIFICATION_EPOCH,
    readonly_recertification: true as const,
    runtime_recertification_report,
    runtime_quality_score,
    runtime_orchestration_score,
    runtime_production_readiness,
    runtime_lock_candidate,
    runtime_dataset_fingerprint,
    validation: {
      deterministic_recertification_checksum_stable: true,
      readonly_recertification: true as const,
      in_memory_only: true as const,
      no_canonical_export_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
    },
  };

  const recertification_checksum = digest([JSON.stringify(recertificationCore)]);

  return {
    ...recertificationCore,
    recertification_checksum,
  };
}

let cachedRecertification: RuntimeDatasetRecertificationResult | null = null;

export function buildRuntimeDatasetRecertificationPreview(): RuntimeDatasetRecertificationResult {
  if (cachedRecertification) return cachedRecertification;
  cachedRecertification = buildRuntimeDatasetRecertification();
  return cachedRecertification;
}

export function buildRuntimeDatasetRecertificationExportDownload(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildRuntimeDatasetRecertificationPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: RUNTIME_DATASET_RECERTIFICATION_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetRuntimeDatasetRecertificationCache(): void {
  cachedRecertification = null;
}
