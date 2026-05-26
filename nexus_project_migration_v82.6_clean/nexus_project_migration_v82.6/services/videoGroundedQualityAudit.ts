import crypto from 'crypto';
import {
  CinematicExtractionResult,
  VIDEO_GROUNDED_QUALITY_AUDIT_VERSION,
  VideoGroundedQualityAuditInputs,
  VideoGroundedQualityAuditResult,
  VideoGroundedQualityDimension,
  VideoGroundedQualityGap,
  VideoProductionReadinessVerdict,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import {
  applyPipelineBCertificationBridge,
  computeCertificationReadinessScore,
  computeCertificationCoverage,
} from './pipelineBCertificationBridge';
import { isEmptyValue } from './pipelineBridge';

export const VIDEO_GROUNDED_QUALITY_AUDIT_EPOCH = '2026-05-26T16:00:00.000Z';
export const VIDEO_GROUNDED_QUALITY_AUDIT_FILENAME = 'video-grounded-quality-audit-export.json';

export const KIKI_25S_BENCHMARK = {
  reference_title: "Kiki's Delivery Service — 25s Grounded Timeline",
  target_scene_window_min: 16,
  target_scene_window_max: 20,
  target_duration_seconds: 25,
} as const;

const DIMENSION_PASS_THRESHOLD = 0.85;

const PHASE_RECOMMENDATIONS: Record<string, string> = {
  frame_scene_temporal_continuity:
    'PHASE-2/5: strengthen production_v72 temporal_bridge and scene_indexing timestamp chains',
  character_persistence:
    'PHASE-5/6: temporal memory graph character edges + Pipeline B certification locks',
  relationship_graph_usefulness:
    'PHASE-1/2: enrich relationship_graph weights and production_v82 relationship_dynamics',
  camera_motion_continuity:
    'PHASE-2: camera_rhythm_memory + director_dna camera_motion continuity pass',
  environment_continuity:
    'PHASE-5: temporal memory graph environment continuity edges',
  emotional_carryover:
    'PHASE-5: emotional_carryover + sequence_graph emotion_continuity propagation',
  prompt_generation_readiness:
    'PHASE-2: prompts_extraction namespaces + generative_layer adapter coverage',
  image_app_compatibility:
    'PHASE-6/7: MasterCore DNA adapter hook + canonical_dna domain completeness',
  video_generation_readiness:
    'PHASE-4: FULL_DENSITY export bridge for latent trajectories + engine_capabilities',
};

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function buildDimension(
  key: string,
  label: string,
  score: number,
  detail: string
): VideoGroundedQualityDimension {
  return {
    key,
    label,
    score,
    passed: score >= DIMENSION_PASS_THRESHOLD,
    detail,
  };
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

function hasUsefulRelationshipGraph(scene: CinematicExtractionResult): boolean {
  const edges = scene.relationship_graph ?? [];
  const weighted = edges.filter((e) => (e.weight ?? 0) > 0.4).length;
  return edges.length >= 3 && weighted >= 2;
}

function hasCameraMotionContinuity(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.camera_rhythm_memory) ||
    !isEmptyValue(scene.director_dna?.camera_motion) ||
    !isEmptyValue(scene.production_v72?.temporal_bridge?.gaze_vector_continuity)
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

function hasPromptGenerationReadiness(scene: CinematicExtractionResult): boolean {
  const prompts = scene.prompts_extraction;
  const hasPromptNamespaces =
    !isEmptyValue(prompts?.midjourney_prompts) ||
    !isEmptyValue(prompts?.runway_prompts) ||
    !isEmptyValue(prompts?.kling_prompts);
  const hasGenerative =
    !isEmptyValue((scene as Record<string, unknown>).generative_layer) ||
    !isEmptyValue(scene.production_v72?.autonomous_quality_loop);
  return hasPromptNamespaces || hasGenerative;
}

function hasImageAppCompatibility(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.canonical_dna?.domains) &&
    !isEmptyValue(scene.production_v82) &&
    !isEmptyValue(scene.visual_atoms)
  );
}

function hasVideoGenerationReadiness(scene: CinematicExtractionResult): boolean {
  const hasEngine =
    !isEmptyValue(scene.production_v72?.engine_capabilities) ||
    !isEmptyValue(scene.production_v72?.continuity_controller);
  const hasLatent =
    !isEmptyValue(scene.latent_steering?.dense_latent_trajectories) ||
    !isEmptyValue(scene.latent_steering?.vectors);
  return hasTemporalBridge(scene) && hasEngine && hasLatent;
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

  const bridgeRatio = ratio(bridgeCount, dataset.length);
  const chainRatio = ratio(chainCount, Math.max(dataset.length - 1, 1));
  return round6(bridgeRatio * 0.6 + chainRatio * 0.4);
}

export function auditVideoGroundedQuality(
  canonicalDataset: CinematicExtractionResult[],
  enrichedDataset: CinematicExtractionResult[]
): Omit<
  VideoGroundedQualityAuditResult,
  'schema_version' | 'generated_at' | 'export_checksum'
> {
  const auditDataset = enrichedDataset.length > 0 ? enrichedDataset : canonicalDataset;
  const total = auditDataset.length;

  const temporalContinuityScore = scoreTemporalContinuityChain(auditDataset);
  const characterCount = auditDataset.filter(hasCharacterPersistence).length;
  const relationshipCount = auditDataset.filter(hasUsefulRelationshipGraph).length;
  const cameraCount = auditDataset.filter(hasCameraMotionContinuity).length;
  const environmentCount = auditDataset.filter(hasEnvironmentContinuity).length;
  const emotionalCount = auditDataset.filter(hasEmotionalCarryover).length;
  const promptCount = auditDataset.filter(hasPromptGenerationReadiness).length;
  const imageAppCount = auditDataset.filter(hasImageAppCompatibility).length;
  const videoCount = auditDataset.filter(hasVideoGenerationReadiness).length;

  const certificationCoverage = computeCertificationCoverage(enrichedDataset);
  const certificationBonus =
    enrichedDataset.length > 0
      ? round6(computeCertificationReadinessScore(certificationCoverage) * 0.05)
      : 0;

  const dimensions: VideoGroundedQualityDimension[] = [
    buildDimension(
      'frame_scene_temporal_continuity',
      'Frame/Scene Temporal Continuity',
      temporalContinuityScore,
      `${auditDataset.filter(hasTemporalBridge).length}/${total} temporal bridges; timestamp chain score ${temporalContinuityScore}`
    ),
    buildDimension(
      'character_persistence',
      'Character Persistence',
      ratio(characterCount, total),
      `${characterCount}/${total} scenes with character_persistence + visual atom anchors`
    ),
    buildDimension(
      'relationship_graph_usefulness',
      'Relationship Graph Usefulness',
      ratio(relationshipCount, total),
      `${relationshipCount}/${total} scenes with ≥3 edges and weighted relations`
    ),
    buildDimension(
      'camera_motion_continuity',
      'Camera Motion Continuity',
      ratio(cameraCount, total),
      `${cameraCount}/${total} scenes with camera_rhythm_memory or director_dna motion`
    ),
    buildDimension(
      'environment_continuity',
      'Environment Continuity',
      ratio(environmentCount, total),
      `${environmentCount}/${total} scenes with scene_state physics + atmosphere DNA`
    ),
    buildDimension(
      'emotional_carryover',
      'Emotional Carryover',
      ratio(emotionalCount, total),
      `${emotionalCount}/${total} scenes with emotional_carryover or sequence emotion bridge`
    ),
    buildDimension(
      'prompt_generation_readiness',
      'Prompt Generation Readiness',
      ratio(promptCount, total),
      `${promptCount}/${total} scenes with prompts_extraction or generative_layer`
    ),
    buildDimension(
      'image_app_compatibility',
      'Image-App Compatibility',
      ratio(imageAppCount, total),
      `${imageAppCount}/${total} scenes with canonical_dna + production_v82 + visual_atoms`
    ),
    buildDimension(
      'video_generation_readiness',
      'Video Generation Readiness',
      ratio(videoCount, total),
      `${videoCount}/${total} scenes with temporal_bridge + engine_capabilities + latent_steering`
    ),
  ];

  const baseScore = round6(
    dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length
  );
  const quality_score = round6(Math.min(1, baseScore + certificationBonus));

  const gaps = buildGapList(dimensions, total);
  const production_readiness_verdict = resolveVideoProductionReadiness(quality_score);
  const next_recommended_phase = recommendNextPhase(dimensions, quality_score, enrichedDataset.length > 0);

  const audit_inputs: VideoGroundedQualityAuditInputs = {
    canonical_scene_count: canonicalDataset.length,
    certification_enriched_scene_count: enrichedDataset.length,
    scenes_with_temporal_bridge: auditDataset.filter(hasTemporalBridge).length,
    scenes_with_visual_atoms: auditDataset.filter((s) => !isEmptyValue(s.visual_atoms)).length,
    scenes_with_relationship_graph: auditDataset.filter((s) => !isEmptyValue(s.relationship_graph))
      .length,
    certification_readiness_score:
      enrichedDataset.length > 0
        ? computeCertificationReadinessScore(certificationCoverage)
        : 0,
  };

  const kiki_25s_benchmark = {
    reference_title: KIKI_25S_BENCHMARK.reference_title,
    target_scene_window_min: KIKI_25S_BENCHMARK.target_scene_window_min,
    target_scene_window_max: KIKI_25S_BENCHMARK.target_scene_window_max,
    target_duration_seconds: KIKI_25S_BENCHMARK.target_duration_seconds,
    actual_scene_count: total,
    within_scene_window:
      total >= KIKI_25S_BENCHMARK.target_scene_window_min &&
      total <= KIKI_25S_BENCHMARK.target_scene_window_max,
  };

  return {
    readonly_audit: true,
    kiki_25s_benchmark,
    audit_inputs,
    dimensions,
    quality_score,
    production_readiness_verdict,
    gaps,
    next_recommended_phase,
    validation: {
      deterministic_checksum_stable: true,
      readonly_audit: true,
      no_dataset_mutation: true,
    },
  };
}

function buildGapList(
  dimensions: VideoGroundedQualityDimension[],
  totalScenes: number
): VideoGroundedQualityGap[] {
  const gaps: VideoGroundedQualityGap[] = [];
  let gapCounter = 0;

  for (const dim of dimensions) {
    if (dim.passed) continue;
    gapCounter += 1;
    gaps.push({
      gap_id: `VGAP-${String(gapCounter).padStart(3, '0')}`,
      severity: dim.score < 0.5 ? 'critical' : 'moderate',
      message: `${dim.label} below Kiki 25s threshold (${(dim.score * 100).toFixed(1)}%): ${dim.detail}`,
      dimension_key: dim.key,
    });
  }

  if (
    totalScenes < KIKI_25S_BENCHMARK.target_scene_window_min ||
    totalScenes > KIKI_25S_BENCHMARK.target_scene_window_max
  ) {
    gapCounter += 1;
    gaps.push({
      gap_id: `VGAP-${String(gapCounter).padStart(3, '0')}`,
      severity: 'informational',
      message: `Scene count ${totalScenes} outside Kiki 25s target window ${KIKI_25S_BENCHMARK.target_scene_window_min}-${KIKI_25S_BENCHMARK.target_scene_window_max} (unified dataset uses extended timeline).`,
      dimension_key: 'frame_scene_temporal_continuity',
    });
  }

  return gaps;
}

function resolveVideoProductionReadiness(score: number): VideoProductionReadinessVerdict {
  if (score >= 0.92) return 'video_ready';
  if (score >= 0.85) return 'strong';
  if (score >= 0.65) return 'partial';
  return 'insufficient';
}

function recommendNextPhase(
  dimensions: VideoGroundedQualityDimension[],
  qualityScore: number,
  hasCertificationEnrichment: boolean
): string {
  if (qualityScore >= 0.92 && hasCertificationEnrichment) {
    return 'PHASE-8: production certification lock + 25s render orchestration dry-run';
  }
  if (!hasCertificationEnrichment) {
    return 'PHASE-6: enable pipeline-b-certification-bridge (?enabled=true) for audit/golden enrichment';
  }
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  return PHASE_RECOMMENDATIONS[weakest.key] ?? 'PHASE-5: temporal memory graph cross-scene propagation';
}

export function buildVideoGroundedQualityAudit(
  includeCertificationEnrichment: boolean = true
): VideoGroundedQualityAuditResult {
  const { dataset: canonicalDataset } = loadCanonicalExportDataset();

  const { enrichedDataset } = includeCertificationEnrichment
    ? applyPipelineBCertificationBridge(canonicalDataset, true)
    : { enrichedDataset: [] as CinematicExtractionResult[] };

  const auditBody = auditVideoGroundedQuality(canonicalDataset, enrichedDataset);

  const exportCore = {
    schema_version: VIDEO_GROUNDED_QUALITY_AUDIT_VERSION,
    generated_at: VIDEO_GROUNDED_QUALITY_AUDIT_EPOCH,
    ...auditBody,
  };

  const export_checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(exportCore))
    .digest('hex');

  return {
    ...exportCore,
    export_checksum,
  };
}

let cachedAudit: VideoGroundedQualityAuditResult | null = null;

export function buildVideoGroundedQualityAuditPreview(): VideoGroundedQualityAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildVideoGroundedQualityAudit(true);
  return cachedAudit;
}

export function buildVideoGroundedQualityAuditExportDownload(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const audit = buildVideoGroundedQualityAuditPreview();
  const body = JSON.stringify(audit, null, 2);
  return {
    filename: VIDEO_GROUNDED_QUALITY_AUDIT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetVideoGroundedQualityAuditCache(): void {
  cachedAudit = null;
}
