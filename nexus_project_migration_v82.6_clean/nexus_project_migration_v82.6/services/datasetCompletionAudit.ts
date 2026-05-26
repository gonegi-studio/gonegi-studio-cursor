import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  DATASET_COMPLETION_AUDIT_VERSION,
  DatasetCompletionAuditBridgeMetadata,
  DatasetCompletionAuditDimension,
  DatasetCompletionAuditGap,
  DatasetCompletionAuditResult,
  DatasetProductionReadiness,
} from '../types';
import { validateExportDensity } from './datasetHydrationService';
import { validateBridgeCompleteness } from './pipelineBridge';

export const DATASET_COMPLETION_AUDIT_EPOCH = '2026-05-26T14:00:00.000Z';
export const DATASET_COMPLETION_AUDIT_FILENAME = 'dataset-completion-audit-export.json';
export const CANONICAL_EXPORT_FILE = 'cinematic-dna-export.json';

const DIMENSION_PASS_THRESHOLD = 0.85;

const PHASE_RECOMMENDATIONS: Record<string, string> = {
  export_density_stability:
    'PHASE-4: confirm export_bridge_mode=OFF checksum parity; use FULL_DENSITY only when trajectories required',
  bridge_coverage:
    'PHASE-3/4: enable opt-in pipeline bridge (lab import or export_bridge_mode=MEMORY_ONLY)',
  visual_atoms_coverage: 'PHASE-1/2: Pipeline A rich visual_atoms hydration',
  relationship_graph_coverage: 'PHASE-1/2: Pipeline A relationship_graph hydration',
  scene_state_completeness: 'PHASE-2: recursive hydration scene_state completeness pass',
  temporal_bridge_completeness: 'PHASE-2: production_v72 temporal_bridge propagation',
  production_v72_v82_coverage: 'PHASE-2: production_v72-v82 namespace hydration',
  audit_golden_record_coverage:
    'PHASE-3: lab import bridge for Pipeline B audit_summary / golden_record enrichment',
  character_continuity_readiness:
    'PHASE-5: temporal cinematic memory graph character continuity edges',
  relationship_continuity_readiness:
    'PHASE-5: temporal cinematic memory graph relationship propagation',
  environment_continuity_readiness:
    'PHASE-5: temporal cinematic memory graph environment continuity edges',
};

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

function hasTemporalBridge(scene: CinematicExtractionResult): boolean {
  return (
    isNonEmpty(scene.production_v72?.temporal_bridge) ||
    isNonEmpty(scene.production_v82?.temporal_bridge) ||
    isNonEmpty(scene.temporal_bridge)
  );
}

function hasCharacterContinuity(scene: CinematicExtractionResult): boolean {
  const hasCharacterAtoms = (scene.visual_atoms ?? []).some(
    (atom) =>
      atom.label?.includes('subject') ||
      atom.label?.includes('character') ||
      atom.label?.includes('witness')
  );
  return (
    isNonEmpty(scene.character_persistence) ||
    isNonEmpty(scene.production_v82?.relationship_dynamics) ||
    hasCharacterAtoms
  );
}

function hasRelationshipContinuity(scene: CinematicExtractionResult): boolean {
  return (
    isNonEmpty(scene.relationship_graph) ||
    isNonEmpty(scene.production_v82?.relationship_dynamics) ||
    isNonEmpty(scene.sequence_graph?.transition_logic)
  );
}

function hasEnvironmentContinuity(scene: CinematicExtractionResult): boolean {
  return (
    isNonEmpty(scene.scene_state?.physics) ||
    isNonEmpty(scene.canonical_dna?.domains?.atmosphere) ||
    isNonEmpty(scene.director_dna?.lighting_behavior)
  );
}

function hasSceneStateComplete(scene: CinematicExtractionResult): boolean {
  return (
    isNonEmpty(scene.scene_state?.physics) &&
    isNonEmpty(scene.scene_state?.emotion) &&
    isNonEmpty(scene.scene_state?.temporal)
  );
}

function hasProductionV72V82(scene: CinematicExtractionResult): boolean {
  return isNonEmpty(scene.production_v72) && isNonEmpty(scene.production_v82);
}

function hasAuditOrGolden(scene: CinematicExtractionResult): boolean {
  return isNonEmpty(scene.audit_summary) || isNonEmpty(scene.golden_record);
}

function hasPipelineAMemory(scene: CinematicExtractionResult): boolean {
  return (
    isNonEmpty(scene.continuity_memory) ||
    isNonEmpty(scene.emotional_carryover) ||
    isNonEmpty(scene.camera_rhythm_memory) ||
    isNonEmpty(scene.motif_persistence) ||
    isNonEmpty(scene.character_persistence)
  );
}

let cachedScenes: CinematicExtractionResult[] | null = null;
let cachedCanonicalSizeBytes: number | null = null;

/** Readonly loader — never mutates on-disk export. */
export function loadCanonicalExportDataset(): {
  dataset: CinematicExtractionResult[];
  source_file: string;
  size_bytes: number;
} {
  if (cachedScenes && cachedCanonicalSizeBytes !== null) {
    return {
      dataset: cachedScenes,
      source_file: CANONICAL_EXPORT_FILE,
      size_bytes: cachedCanonicalSizeBytes,
    };
  }

  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Canonical export not found: ${CANONICAL_EXPORT_FILE}`);
  }

  const raw = fs.readFileSync(exportPath, 'utf8');
  cachedScenes = JSON.parse(raw) as CinematicExtractionResult[];
  cachedCanonicalSizeBytes = Buffer.byteLength(raw, 'utf8');

  return {
    dataset: cachedScenes,
    source_file: CANONICAL_EXPORT_FILE,
    size_bytes: cachedCanonicalSizeBytes,
  };
}

export function buildBridgeMetadataSummary(
  dataset: CinematicExtractionResult[]
): DatasetCompletionAuditBridgeMetadata {
  const bridge_mode_distribution: Record<string, number> = {};
  let bridgeScoreSum = 0;

  let scenes_with_bridge_provenance = 0;
  let scenes_with_bridge_receipt = 0;
  let scenes_with_export_bridge = 0;
  let scenes_with_pipeline_a_memory = 0;
  let scenes_with_pipeline_b_audit = 0;

  for (const scene of dataset) {
    if (scene.pipeline_bridge_provenance) scenes_with_bridge_provenance += 1;
    if (scene.pipeline_bridge_receipt || scene.bridge_export_receipt) scenes_with_bridge_receipt += 1;
    if (scene.bridge_mode || scene.export_bridge_score !== undefined) {
      scenes_with_export_bridge += 1;
      const mode = scene.bridge_mode ?? 'unknown';
      bridge_mode_distribution[mode] = (bridge_mode_distribution[mode] ?? 0) + 1;
    }
    if (hasPipelineAMemory(scene)) scenes_with_pipeline_a_memory += 1;
    if (hasAuditOrGolden(scene)) scenes_with_pipeline_b_audit += 1;
    bridgeScoreSum += validateBridgeCompleteness(scene).bridge_score;
  }

  return {
    scenes_with_bridge_provenance,
    scenes_with_bridge_receipt,
    scenes_with_export_bridge,
    scenes_with_pipeline_a_memory,
    scenes_with_pipeline_b_audit,
    average_bridge_score: round6(bridgeScoreSum / Math.max(dataset.length, 1)),
    bridge_mode_distribution,
  };
}

function buildDimension(
  key: string,
  label: string,
  score: number,
  detail: string
): DatasetCompletionAuditDimension {
  return {
    key,
    label,
    score,
    passed: score >= DIMENSION_PASS_THRESHOLD,
    detail,
  };
}

export function auditDatasetCompletion(
  dataset: CinematicExtractionResult[],
  sizeBytes: number
): Omit<DatasetCompletionAuditResult, 'schema_version' | 'generated_at' | 'export_checksum' | 'canonical_export'> & {
  canonical_export: Omit<DatasetCompletionAuditResult['canonical_export'], 'export_checksum'>;
} {
  const total = dataset.length;
  const densityValidation = validateExportDensity(dataset);

  const visualAtomsCount = dataset.filter((s) => isNonEmpty(s.visual_atoms)).length;
  const relationshipGraphCount = dataset.filter((s) => isNonEmpty(s.relationship_graph)).length;
  const sceneStateCount = dataset.filter((s) => hasSceneStateComplete(s)).length;
  const temporalBridgeCount = dataset.filter((s) => hasTemporalBridge(s)).length;
  const productionCount = dataset.filter((s) => hasProductionV72V82(s)).length;
  const auditGoldenCount = dataset.filter((s) => hasAuditOrGolden(s)).length;
  const characterContinuityCount = dataset.filter((s) => hasCharacterContinuity(s)).length;
  const relationshipContinuityCount = dataset.filter((s) => hasRelationshipContinuity(s)).length;
  const environmentContinuityCount = dataset.filter((s) => hasEnvironmentContinuity(s)).length;

  const bridgeMeta = buildBridgeMetadataSummary(dataset);
  const bridgeCoverageScore = round6(
    (ratio(bridgeMeta.scenes_with_pipeline_a_memory, total) * 0.5 +
      ratio(bridgeMeta.scenes_with_bridge_provenance, total) * 0.25 +
      bridgeMeta.average_bridge_score * 0.25)
  );

  const trajectoryCoverage = ratio(
    dataset.filter((s) => isNonEmpty(s.latent_steering?.dense_latent_trajectories)).length,
    total
  );
  const exportDensityScore = round6(
    (densityValidation.visualAtomsNonEmpty ? 0.25 : 0) +
      (densityValidation.relationshipGraphNonEmpty ? 0.25 : 0) +
      (densityValidation.sceneStatePopulated ? 0.2 : 0) +
      (sizeBytes >= 10_000_000 ? 0.15 : 0) +
      (trajectoryCoverage >= 0.9 ? 0.15 : trajectoryCoverage * 0.15)
  );

  const dimensions: DatasetCompletionAuditDimension[] = [
    buildDimension(
      'export_density_stability',
      'Export Density Stability',
      exportDensityScore,
      `${(sizeBytes / (1024 * 1024)).toFixed(2)}MB, ${total} scenes, trajectory coverage ${(trajectoryCoverage * 100).toFixed(1)}%`
    ),
    buildDimension(
      'bridge_coverage',
      'Pipeline A/B Bridge Coverage',
      bridgeCoverageScore,
      `A-memory ${bridgeMeta.scenes_with_pipeline_a_memory}/${total}, provenance ${bridgeMeta.scenes_with_bridge_provenance}/${total}, avg bridge score ${bridgeMeta.average_bridge_score}`
    ),
    buildDimension(
      'visual_atoms_coverage',
      'Visual Atoms Coverage',
      ratio(visualAtomsCount, total),
      `${visualAtomsCount}/${total} scenes with non-empty visual_atoms`
    ),
    buildDimension(
      'relationship_graph_coverage',
      'Relationship Graph Coverage',
      ratio(relationshipGraphCount, total),
      `${relationshipGraphCount}/${total} scenes with non-empty relationship_graph`
    ),
    buildDimension(
      'scene_state_completeness',
      'Scene State Completeness',
      ratio(sceneStateCount, total),
      `${sceneStateCount}/${total} scenes with physics+emotion+temporal scene_state`
    ),
    buildDimension(
      'temporal_bridge_completeness',
      'Temporal Bridge Completeness',
      ratio(temporalBridgeCount, total),
      `${temporalBridgeCount}/${total} scenes with production temporal_bridge`
    ),
    buildDimension(
      'production_v72_v82_coverage',
      'Production v72–v82 Coverage',
      ratio(productionCount, total),
      `${productionCount}/${total} scenes with production_v72 and production_v82`
    ),
    buildDimension(
      'audit_golden_record_coverage',
      'Audit / Golden Record Coverage',
      ratio(auditGoldenCount, total),
      `${auditGoldenCount}/${total} scenes with audit_summary or golden_record`
    ),
    buildDimension(
      'character_continuity_readiness',
      'Character Continuity Readiness',
      ratio(characterContinuityCount, total),
      `${characterContinuityCount}/${total} scenes character-continuity ready`
    ),
    buildDimension(
      'relationship_continuity_readiness',
      'Relationship Continuity Readiness',
      ratio(relationshipContinuityCount, total),
      `${relationshipContinuityCount}/${total} scenes relationship-continuity ready`
    ),
    buildDimension(
      'environment_continuity_readiness',
      'Environment Continuity Readiness',
      ratio(environmentContinuityCount, total),
      `${environmentContinuityCount}/${total} scenes environment-continuity ready`
    ),
  ];

  const completion_score = round6(
    dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length
  );

  const gaps = buildGapList(dimensions, bridgeMeta, total);
  const production_readiness = resolveProductionReadiness(completion_score);
  const next_recommended_phase = recommendNextPhase(dimensions, completion_score, bridgeMeta);

  const canonical_export = {
    source_file: CANONICAL_EXPORT_FILE,
    scene_count: total,
    size_bytes: sizeBytes,
    size_mb: round6(sizeBytes / (1024 * 1024)),
  };

  return {
    readonly_audit: true,
    canonical_export,
    optional_bridge_metadata: bridgeMeta,
    dimensions,
    completion_score,
    gaps,
    next_recommended_phase,
    production_readiness,
    validation: {
      deterministic_checksum_stable: true,
      readonly_audit: true,
      no_dataset_mutation: true,
    },
  };
}

function buildGapList(
  dimensions: DatasetCompletionAuditDimension[],
  bridgeMeta: DatasetCompletionAuditBridgeMetadata,
  totalScenes: number
): DatasetCompletionAuditGap[] {
  const gaps: DatasetCompletionAuditGap[] = [];
  let gapCounter = 0;

  for (const dim of dimensions) {
    if (dim.passed) continue;
    gapCounter += 1;
    gaps.push({
      gap_id: `GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: dim.score < 0.5 ? 'critical' : 'moderate',
      message: `${dim.label} below threshold (${(dim.score * 100).toFixed(1)}%): ${dim.detail}`,
      dimension_key: dim.key,
    });
  }

  if (bridgeMeta.scenes_with_export_bridge === 0) {
    gapCounter += 1;
    gaps.push({
      gap_id: `GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: 'informational',
      message:
        'Optional bridge export metadata absent on canonical export (expected when export_bridge_mode=OFF).',
      dimension_key: 'bridge_coverage',
    });
  }

  if (bridgeMeta.scenes_with_pipeline_b_audit === 0) {
    gapCounter += 1;
    gaps.push({
      gap_id: `GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: 'moderate',
      message: `Pipeline B audit/golden_record absent across ${totalScenes} scenes — music-drama certification path incomplete.`,
      dimension_key: 'audit_golden_record_coverage',
    });
  }

  return gaps;
}

function resolveProductionReadiness(score: number): DatasetProductionReadiness {
  if (score >= 0.92) return 'feature_ready';
  if (score >= 0.85) return 'strong';
  if (score >= 0.6) return 'partial';
  return 'insufficient';
}

function recommendNextPhase(
  dimensions: DatasetCompletionAuditDimension[],
  completionScore: number,
  bridgeMeta: DatasetCompletionAuditBridgeMetadata
): string {
  if (completionScore >= 0.92 && bridgeMeta.scenes_with_pipeline_b_audit === 0) {
    return 'PHASE-3: lab import bridge for Pipeline B audit/golden_record before MasterCore injection';
  }
  if (completionScore >= 0.92) {
    return 'PHASE-7: MasterCore DNA dataset injection hook (opt-in, additive only)';
  }

  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  return PHASE_RECOMMENDATIONS[weakest.key] ?? 'PHASE-2: continue pipeline hydration and bridge enrichment';
}

export function buildDatasetCompletionAudit(): DatasetCompletionAuditResult {
  const { dataset, source_file, size_bytes } = loadCanonicalExportDataset();
  const auditBody = auditDatasetCompletion(dataset, size_bytes);

  const exportCore = {
    schema_version: DATASET_COMPLETION_AUDIT_VERSION,
    generated_at: DATASET_COMPLETION_AUDIT_EPOCH,
    ...auditBody,
    canonical_export: {
      ...auditBody.canonical_export,
      source_file,
      export_checksum: crypto.createHash('sha256').update(JSON.stringify(dataset)).digest('hex'),
    },
  };

  const export_checksum = crypto.createHash('sha256').update(JSON.stringify(exportCore)).digest('hex');

  return {
    ...exportCore,
    export_checksum,
  };
}

let cachedAudit: DatasetCompletionAuditResult | null = null;

export function buildDatasetCompletionAuditPreview(): DatasetCompletionAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildDatasetCompletionAudit();
  return cachedAudit;
}

export function buildDatasetCompletionAuditExportDownload(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const audit = buildDatasetCompletionAuditPreview();
  const body = JSON.stringify(audit, null, 2);
  return {
    filename: DATASET_COMPLETION_AUDIT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetDatasetCompletionAuditCache(): void {
  cachedAudit = null;
  cachedScenes = null;
  cachedCanonicalSizeBytes = null;
}
