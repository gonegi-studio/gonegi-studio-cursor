import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_VERSION,
  FinalDatasetSemanticQualityAuditResult,
  FinalSemanticVerdict,
  LongformGenerationReadiness,
  SemanticAuditDimensionKey,
  SemanticBlockingIssue,
  SemanticDimensionScore,
  SemanticQualityGap,
  TemporalMemoryGraphExport,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import {
  buildLongformDatasetExportCandidatePreview,
} from './longformDatasetExportCandidate';
import {
  buildLongformDatasetProductionLockPreview,
} from './longformDatasetProductionLock';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_EPOCH = '2026-05-27T11:30:00.000Z';
export const FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_JSON_FILENAME =
  'final-dataset-semantic-quality-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const SEMANTIC_READY_THRESHOLD = 0.72;
const WEAK_SCENE_THRESHOLD = 0.62;
const FATIGUE_RISK_MAX = 0.38;

const GENERIC_CINEMATIC_TOKENS = new Set([
  'cinematic',
  'dramatic',
  'beautiful',
  'stunning',
  'epic',
  'atmospheric',
  'visual',
  'scene',
  'shot',
  'film',
  'movie',
  'aesthetic',
  'moody',
  'professional',
]);

const PADDING_PHRASES = [
  'placeholder',
  'todo',
  'lorem ipsum',
  'tbd',
  'generic scene',
  'undefined',
];

const DIMENSION_LABELS: Record<SemanticAuditDimensionKey, string> = {
  scene_semantic_density: 'Scene Semantic Density',
  character_semantic_continuity: 'Character Semantic Continuity',
  environment_semantic_continuity: 'Environment Semantic Continuity',
  temporal_narrative_coherence: 'Temporal Narrative Coherence',
  visual_generation_usefulness: 'Visual Generation Usefulness',
  longform_fatigue_risk: 'Longform Fatigue Risk',
};

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:|\[\]/(){}]+/)
    .filter((token) => token.length > 2);
}

function extractSceneSemanticText(scene: CinematicExtractionResult): string {
  const parts: string[] = [
    scene.layers?.raw_semantic?.visual_description ?? '',
    ...(scene.visual_atoms?.map((atom) => atom.label) ?? []),
    ...(scene.relationship_graph?.map(
      (edge) =>
        `${edge.subject} ${edge.predicate ?? edge.relation ?? ''} ${edge.object ?? edge.target ?? ''}`
    ) ?? []),
    ...(scene.layers?.scene_language?.cinematography_tokens ?? []),
    ...(scene.layers?.scene_language?.emotion_tokens ?? []),
    ...(scene.layers?.scene_language?.environment_tokens ?? []),
    scene.human_semantic_bridge ?? '',
  ];
  return parts.join(' ').toLowerCase();
}

function sceneSemanticDensityScore(scene: CinematicExtractionResult): number {
  const text = extractSceneSemanticText(scene);
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;

  const unique = new Set(tokens);
  const uniqueRatio = unique.size / tokens.length;
  const genericCount = tokens.filter((token) => GENERIC_CINEMATIC_TOKENS.has(token)).length;
  const genericRatio = genericCount / tokens.length;
  const paddingHit = PADDING_PHRASES.some((phrase) => text.includes(phrase));
  const tokenDepth = clamp01(tokens.length / 72);
  const atomRichness = clamp01((scene.visual_atoms?.length ?? 0) / 8);
  const graphRichness = clamp01((scene.relationship_graph?.length ?? 0) / 6);

  let score =
    uniqueRatio * 0.28 +
    (1 - genericRatio) * 0.22 +
    tokenDepth * 0.2 +
    atomRichness * 0.15 +
    graphRichness * 0.15;
  if (paddingHit) score *= 0.55;
  if (tokens.length < 12) score *= 0.7;

  return clamp01(score);
}

function sceneVisualUsefulnessScore(scene: CinematicExtractionResult): number {
  const atoms = scene.visual_atoms ?? [];
  const avgSignificance =
    atoms.length > 0
      ? atoms.reduce((sum, atom) => sum + (atom.significance ?? 0), 0) / atoms.length
      : 0;
  const framingCount = new Set(
    atoms.map((atom) => atom.spatial_intelligence?.framing).filter(Boolean)
  ).size;
  const hasFingerprint = !!scene.shot_fingerprint?.composition_hash;
  const promptGrounding = clamp01(
    ((scene.generative_layer?.midjourney?.length ?? 0) +
      (scene.generative_layer?.runway?.length ?? 0)) /
      400
  );
  const cameraTokens = scene.layers?.scene_language?.cinematography_tokens?.length ?? 0;

  return clamp01(
    clamp01(avgSignificance) * 0.35 +
      clamp01(atoms.length / 6) * 0.25 +
      clamp01(framingCount / 3) * 0.15 +
      (hasFingerprint ? 0.1 : 0) +
      promptGrounding * 0.1 +
      clamp01(cameraTokens / 8) * 0.05
  );
}

function computeSceneCompositeScore(
  scene: CinematicExtractionResult,
  densityScore: number,
  visualScore: number
): number {
  const emotionDepth = clamp01(
    Object.keys(scene.scene_state?.emotion ?? {}).length / 6
  );
  const confidence = scene.confidence_profile?.aggregate_certainty ?? 0.5;
  return clamp01(densityScore * 0.45 + visualScore * 0.35 + emotionDepth * 0.1 + confidence * 0.1);
}

function scoreCharacterContinuity(
  dataset: CinematicExtractionResult[],
  identityStability: number,
  temporalExport: TemporalMemoryGraphExport
): number {
  const charContinuity = temporalExport.continuity_summary.character_continuity;
  const driftPenalty =
    charContinuity.length > 0
      ? charContinuity.reduce((sum, state) => sum + state.emotional_drift, 0) /
        charContinuity.length
      : 0.5;
  const attachmentSignals = dataset.filter((scene) =>
    scene.relationship_graph.some((edge) =>
      /companion|attach|trust|bond|protagonist|authority/i.test(
        `${edge.subject} ${edge.predicate ?? edge.relation ?? ''} ${edge.object ?? edge.target ?? ''}`
      )
    )
  ).length;

  const relationshipRichness = clamp01(
    dataset.reduce((sum, scene) => sum + scene.relationship_graph.length, 0) /
      (dataset.length * 5)
  );

  return clamp01(
    identityStability * 0.35 +
      (1 - driftPenalty) * 0.3 +
      clamp01(attachmentSignals / dataset.length) * 0.2 +
      relationshipRichness * 0.15
  );
}

function scoreEnvironmentContinuity(
  dataset: CinematicExtractionResult[],
  temporalExport: TemporalMemoryGraphExport,
  identityEnvLockStrength: number
): number {
  const envContinuity = temporalExport.continuity_summary.environment_continuity;
  const weatherRealism =
    envContinuity.length > 0
      ? envContinuity.reduce((sum, state) => sum + state.weather_persistence, 0) /
        envContinuity.length
      : 0.5;
  const lightingRealism =
    envContinuity.length > 0
      ? envContinuity.reduce((sum, state) => sum + state.lighting_progression, 0) /
        envContinuity.length
      : 0.5;
  const atmosphereContinuity =
    envContinuity.length > 0
      ? envContinuity.reduce((sum, state) => sum + state.atmospheric_evolution, 0) /
        envContinuity.length
      : 0.5;

  const envTokenRichness = clamp01(
    dataset.reduce(
      (sum, scene) => sum + (scene.layers?.scene_language?.environment_tokens?.length ?? 0),
      0
    ) /
      (dataset.length * 4)
  );

  return clamp01(
    weatherRealism * 0.22 +
      lightingRealism * 0.22 +
      atmosphereContinuity * 0.16 +
      identityEnvLockStrength * 0.2 +
      envTokenRichness * 0.1 +
      temporalExport.memory_density_score * 0.1
  );
}

function scoreTemporalCoherence(
  temporalExport: TemporalMemoryGraphExport,
  stabilizationVerdict: string,
  identityTemporalStability: number,
  callbackSaturationScore: number
): number {
  const summary = temporalExport.continuity_summary;
  const callbackBalance = clamp01(1 - callbackSaturationScore);
  const anchorCoherence = clamp01(
    Object.keys(temporalExport.memory_node_index).length / Math.max(summary.total_scenes, 1)
  );
  const progressionSmoothness = clamp01(summary.average_persistence_strength);
  const verdictBoost =
    stabilizationVerdict === 'stable'
      ? 1
      : stabilizationVerdict === 'warning'
        ? 0.85
        : 0.65;

  return clamp01(
    (callbackBalance * 0.25 +
      anchorCoherence * 0.25 +
      progressionSmoothness * 0.2 +
      identityTemporalStability * 0.2 +
      temporalExport.memory_density_score * 0.1) *
      verdictBoost
  );
}

function scoreFatigueRisk(
  dataset: CinematicExtractionResult[],
  stabilizationReport: ReturnType<
    typeof buildLongformDatasetExportCandidatePreview
  >['longform_export_candidate_package']['runtime_temporal_stabilization_report']
): number {
  const callbackRisk = stabilizationReport.callback_saturation.callback_saturation_score;
  const recursiveRisk = stabilizationReport.recursive_memory_load.recursive_load_score;
  const emotionalMonotony = clamp01(
    1 - stabilizationReport.emotional_entropy.emotional_entropy_score
  );

  const framingValues = dataset.flatMap((scene) =>
    (scene.visual_atoms ?? []).map((atom) => atom.spatial_intelligence?.framing).filter(Boolean)
  );
  const framingRepeatDensity =
    framingValues.length > 0
      ? 1 - new Set(framingValues).size / framingValues.length
      : 0.5;

  const paletteHashes = dataset
    .map((scene) => scene.shot_fingerprint?.palette_hash)
    .filter(Boolean) as string[];
  const colorHarmonyRepeat =
    paletteHashes.length > 0
      ? 1 - new Set(paletteHashes).size / paletteHashes.length
      : 0.4;

  const motifSaturation = callbackRisk;

  return clamp01(
    callbackRisk * 0.25 +
      emotionalMonotony * 0.2 +
      framingRepeatDensity * 0.15 +
      colorHarmonyRepeat * 0.15 +
      recursiveRisk * 0.15 +
      motifSaturation * 0.1
  );
}

function rankDimensions(
  dimensionScores: SemanticDimensionScore[]
): { strongest: SemanticAuditDimensionKey[]; weakest: SemanticAuditDimensionKey[] } {
  const qualityDimensions = dimensionScores.filter((d) => !d.inverse_risk);
  const sorted = [...qualityDimensions].sort((a, b) => b.score - a.score);
  return {
    strongest: sorted.slice(0, 3).map((d) => d.dimension_key),
    weakest: sorted.slice(-3).map((d) => d.dimension_key),
  };
}

function buildSemanticGaps(
  dimensionScores: SemanticDimensionScore[],
  weakSceneIds: string[],
  productionLockValid: boolean
): SemanticQualityGap[] {
  const gaps: SemanticQualityGap[] = [];
  let gapCounter = 0;

  for (const dimension of dimensionScores) {
    const threshold = dimension.inverse_risk ? FATIGUE_RISK_MAX : SEMANTIC_READY_THRESHOLD - 0.08;
    const failed = dimension.inverse_risk
      ? dimension.score > threshold
      : dimension.score < threshold;
    if (!failed) continue;
    gapCounter += 1;
    gaps.push({
      gap_id: `SEM-GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: dimension.score < 0.55 || dimension.inverse_risk ? 'moderate' : 'low',
      dimension_key: dimension.dimension_key,
      message: `${dimension.label} ${
        dimension.inverse_risk
          ? `risk ${dimension.score} exceeds threshold ${threshold}`
          : `score ${dimension.score} below threshold ${threshold}`
      }`,
    });
  }

  for (const sceneId of weakSceneIds.slice(0, 5)) {
    gapCounter += 1;
    gaps.push({
      gap_id: `SEM-GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: 'moderate',
      dimension_key: 'scene_semantic_density',
      scene_id: sceneId,
      message: `Scene ${sceneId} flagged as weak semantic contributor`,
    });
  }

  if (!productionLockValid) {
    gapCounter += 1;
    gaps.push({
      gap_id: `SEM-GAP-${String(gapCounter).padStart(3, '0')}`,
      severity: 'critical',
      dimension_key: 'temporal_narrative_coherence',
      message: 'Production lock does not match export candidate checksum',
    });
  }

  return gaps.sort((a, b) => a.gap_id.localeCompare(b.gap_id));
}

function buildBlockingIssues(gaps: SemanticQualityGap[]): SemanticBlockingIssue[] {
  return gaps
    .filter((gap) => gap.severity === 'critical')
    .map((gap, index) => ({
      issue_id: `SEM-BLOCK-${String(index + 1).padStart(3, '0')}`,
      severity: 'critical' as const,
      dimension_key: gap.dimension_key,
      scene_id: gap.scene_id,
      message: gap.message,
    }));
}

function resolveLongformReadiness(
  semanticQuality: number,
  fatigueRisk: number,
  blockingCount: number
): LongformGenerationReadiness {
  if (blockingCount > 0 || semanticQuality < 0.6) return 'not_ready';
  if (semanticQuality >= SEMANTIC_READY_THRESHOLD && fatigueRisk <= FATIGUE_RISK_MAX) {
    return 'ready';
  }
  return 'conditional';
}

function resolveFinalSemanticVerdict(
  semanticQuality: number,
  blockingCount: number,
  productionLockValid: boolean
): FinalSemanticVerdict {
  if (
    blockingCount === 0 &&
    productionLockValid &&
    semanticQuality >= SEMANTIC_READY_THRESHOLD
  ) {
    return 'semantically_ready';
  }
  return 'semantically_insufficient';
}

export function buildFinalDatasetSemanticQualityAudit(): FinalDatasetSemanticQualityAuditResult {
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const productionLock = buildLongformDatasetProductionLockPreview();
  const identityLock = buildIdentityLockContinuityPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const pkg = exportCandidate.longform_export_candidate_package;
  const dataset = pkg.runtime_dataset;
  const stabilizationReport = pkg.runtime_temporal_stabilization_report;
  const temporalExport = buildTemporalMemoryGraphExport(dataset);

  const identityEnvLockStrength = clamp01(
    identityLock.locked_image_generation_packages.reduce(
      (sum, locked) => sum + locked.environment_identity_lock.lock_strength,
      0
    ) / Math.max(identityLock.locked_image_generation_packages.length, 1)
  );

  const perSceneDensity = dataset.map((scene) => sceneSemanticDensityScore(scene));
  const perSceneVisual = dataset.map((scene) => sceneVisualUsefulnessScore(scene));
  const perSceneComposite = dataset.map((scene, index) =>
    computeSceneCompositeScore(scene, perSceneDensity[index], perSceneVisual[index])
  );

  const semantic_density_score = clamp01(
    perSceneDensity.reduce((sum, score) => sum + score, 0) / perSceneDensity.length
  );

  const characterScore = scoreCharacterContinuity(
    dataset,
    identityLock.identity_stability_score,
    temporalExport
  );
  const environmentScore = scoreEnvironmentContinuity(
    dataset,
    temporalExport,
    identityEnvLockStrength
  );
  const temporalScore = scoreTemporalCoherence(
    temporalExport,
    stabilizationReport.runtime_chain_verdict,
    identityLock.temporal_visual_stability,
    stabilizationReport.callback_saturation.callback_saturation_score
  );
  const visualScore = clamp01(
    perSceneVisual.reduce((sum, score) => sum + score, 0) / perSceneVisual.length
  );
  const fatigue_risk_score = scoreFatigueRisk(dataset, stabilizationReport);

  const dimension_scores: SemanticDimensionScore[] = [
    {
      dimension_key: 'scene_semantic_density',
      label: DIMENSION_LABELS.scene_semantic_density,
      score: semantic_density_score,
      inverse_risk: false,
    },
    {
      dimension_key: 'character_semantic_continuity',
      label: DIMENSION_LABELS.character_semantic_continuity,
      score: characterScore,
      inverse_risk: false,
    },
    {
      dimension_key: 'environment_semantic_continuity',
      label: DIMENSION_LABELS.environment_semantic_continuity,
      score: environmentScore,
      inverse_risk: false,
    },
    {
      dimension_key: 'temporal_narrative_coherence',
      label: DIMENSION_LABELS.temporal_narrative_coherence,
      score: temporalScore,
      inverse_risk: false,
    },
    {
      dimension_key: 'visual_generation_usefulness',
      label: DIMENSION_LABELS.visual_generation_usefulness,
      score: visualScore,
      inverse_risk: false,
    },
    {
      dimension_key: 'longform_fatigue_risk',
      label: DIMENSION_LABELS.longform_fatigue_risk,
      score: fatigue_risk_score,
      inverse_risk: true,
    },
  ];

  const continuity_realism_score = clamp01(
    (characterScore + environmentScore + temporalScore) / 3
  );

  const qualityDimensions = dimension_scores.filter((d) => !d.inverse_risk);
  const semantic_quality_score = clamp01(
    qualityDimensions.reduce((sum, d) => sum + d.score, 0) / qualityDimensions.length -
      fatigue_risk_score * 0.08
  );

  const weak_scene_ids = dataset
    .filter((_, index) => perSceneComposite[index] < WEAK_SCENE_THRESHOLD)
    .map((scene) => scene.id)
    .sort();

  const productionLockValid =
    productionLock.longform_production_lock.export_candidate_checksum_ref ===
      exportCandidate.export_checksum &&
    productionLock.release_readiness_verdict === 'production_locked';

  const semantic_gap_list = buildSemanticGaps(
    dimension_scores,
    weak_scene_ids,
    productionLockValid
  );
  const semantic_blocking_issues = buildBlockingIssues(semantic_gap_list);
  const { strongest, weakest } = rankDimensions(dimension_scores);

  const longform_generation_readiness = resolveLongformReadiness(
    semantic_quality_score,
    fatigue_risk_score,
    semantic_blocking_issues.length
  );
  const final_semantic_verdict = resolveFinalSemanticVerdict(
    semantic_quality_score,
    semantic_blocking_issues.length,
    productionLockValid
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const auditCore = {
    schema_version: FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_VERSION,
    generated_at: FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_EPOCH,
    readonly_audit: true as const,
    export_candidate_id: exportCandidate.export_candidate_id,
    locked_export_id: productionLock.locked_export_id,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    production_lock_checksum_ref: productionLock.production_lock_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    stabilization_verdict_ref: stabilizationReport.runtime_chain_verdict,
    scene_count: dataset.length,
    semantic_quality_score,
    semantic_density_score,
    continuity_realism_score,
    longform_generation_readiness,
    fatigue_risk_score,
    weak_scene_ids,
    semantic_gap_list,
    semantic_blocking_issues,
    dimension_scores,
    strongest_dimensions: strongest,
    weakest_dimensions: weakest,
    final_semantic_verdict,
    validation: {
      deterministic_semantic_audit_checksum_stable: true,
      readonly_audit: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_prompt_rewrite: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const semantic_audit_checksum = digest([
    JSON.stringify({ ...auditCore, semantic_audit_checksum: undefined }),
    exportCandidate.export_checksum,
    productionLock.production_lock_checksum,
    temporalExport.export_checksum,
    String(semantic_quality_score),
    final_semantic_verdict,
  ]);

  return {
    ...auditCore,
    semantic_audit_checksum,
  };
}

let cachedAudit: FinalDatasetSemanticQualityAuditResult | null = null;

export function buildFinalDatasetSemanticQualityAuditPreview(): FinalDatasetSemanticQualityAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildFinalDatasetSemanticQualityAudit();
  return cachedAudit;
}

export function buildFinalDatasetSemanticQualityAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildFinalDatasetSemanticQualityAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetFinalDatasetSemanticQualityAuditCache(): void {
  cachedAudit = null;
}
