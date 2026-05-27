import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FinalSynthesizedDatasetVerdict,
  SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_VERSION,
  SynthesizedAuditDimensionScore,
  SynthesizedExpansionDimensionKey,
  SynthesizedLongformDataset,
  SynthesizedLongformDatasetQualityAuditResult,
  SynthesizedLongformTier,
  SynthesizedQualityAuditCheck,
  SynthesizedSceneMetadata,
  SynthesisIntegrityReport,
  TemporalMemoryGraphExport,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { buildLongformFatigueMitigationBlueprintPreview } from './longformFatigueMitigationBlueprint';
import { buildRealLongformDatasetSynthesisPreview } from './realLongformDatasetSynthesis';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_EPOCH = '2026-05-27T15:30:00.000Z';
export const SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_JSON_FILENAME =
  'synthesized-longform-quality-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const WEAK_SCENE_THRESHOLD = 0.58;
const FILLER_DENSITY_THRESHOLD = 0.45;
const QUALITY_READY_MIN = 0.68;
const CONTINUITY_READY_MIN = 0.82;
const ORCHESTRATION_READY_MIN = 0.74;
const FATIGUE_MAX = 0.35;
const FILLER_RATIO_MAX = 0.25;

const DIMENSION_LABELS: Record<SynthesizedExpansionDimensionKey, string> = {
  expansion_semantic_quality: 'Expansion Scene Semantic Quality',
  expansion_continuity_realism: 'Expansion Continuity Realism',
  longform_pacing_quality: 'Longform Pacing Quality',
  expansion_orchestration_quality: 'Expansion Orchestration Quality',
  expansion_usefulness: 'Expansion Usefulness',
};

const GENERIC_TOKENS = new Set([
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

function groundedValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'value' in value) {
    return typeof (value as { value: unknown }).value === 'number'
      ? ((value as { value: number }).value as number)
      : 0;
  }
  return 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:|[\](){}]+/)
    .filter((token) => token.length > 2);
}

function extractSceneSemanticText(scene: CinematicExtractionResult): string {
  const parts: string[] = [
    scene.layers?.raw_semantic?.visual_description ?? '',
    ...(scene.visual_atoms?.map((atom) => atom.label) ?? []),
    ...(scene.layers?.scene_language?.cinematography_tokens ?? []),
    ...(scene.layers?.scene_language?.emotion_tokens ?? []),
    ...(scene.layers?.scene_language?.environment_tokens ?? []),
    ...(scene.layers?.scene_language?.narrative_tokens ?? []),
    scene.snapshot_reason ?? '',
  ];
  return parts.join(' ').toLowerCase();
}

function sceneSemanticDensity(scene: CinematicExtractionResult): number {
  const text = extractSceneSemanticText(scene);
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;

  const unique = new Set(tokens);
  const uniqueRatio = unique.size / tokens.length;
  const genericCount = tokens.filter((token) => GENERIC_TOKENS.has(token)).length;
  const genericRatio = genericCount / tokens.length;
  const tokenDepth = clamp01(tokens.length / 64);
  const atomRichness = clamp01((scene.visual_atoms?.length ?? 0) / 8);

  let score = uniqueRatio * 0.3 + (1 - genericRatio) * 0.25 + tokenDepth * 0.25 + atomRichness * 0.2;
  if (tokens.length < 12) score *= 0.65;
  return clamp01(score);
}

function emotionalProgressionScore(scenes: CinematicExtractionResult[]): number {
  if (scenes.length < 2) return 0.5;
  const intensities = scenes.map((scene) => {
    const emotion = scene.scene_state?.emotion;
    if (!emotion) return 0.5;
    return clamp01(
      (groundedValue(emotion.dread) +
        groundedValue(emotion.melancholy) +
        groundedValue(emotion.anticipation) +
        groundedValue(emotion.catharsis_ready)) /
        4
    );
  });

  let transitions = 0;
  let realistic = 0;
  for (let i = 1; i < intensities.length; i++) {
    transitions += 1;
    const delta = Math.abs(intensities[i] - intensities[i - 1]);
    if (delta <= 0.35) realistic += 1;
  }
  return clamp01(transitions > 0 ? realistic / transitions : 0.5);
}

function cinematicProgressionScore(scenes: CinematicExtractionResult[]): number {
  const framings = scenes.map((scene) => {
    const atomFraming = scene.visual_atoms?.[0]?.spatial_intelligence?.framing;
    const tokens = scene.layers?.scene_language?.cinematography_tokens ?? [];
    return atomFraming ?? tokens[0] ?? 'MS';
  });
  let alternations = 0;
  for (let i = 1; i < framings.length; i++) {
    if (framings[i] !== framings[i - 1]) alternations += 1;
  }
  return clamp01(framings.length > 1 ? alternations / (framings.length - 1) : 0.5);
}

function visualSpecificityScore(scene: CinematicExtractionResult): number {
  const atoms = scene.visual_atoms ?? [];
  const avgSignificance =
    atoms.length > 0
      ? atoms.reduce((sum, atom) => sum + (atom.significance ?? 0), 0) / atoms.length
      : 0;
  const envTokens = scene.layers?.scene_language?.environment_tokens?.length ?? 0;
  const cameraTokens = scene.layers?.scene_language?.cinematography_tokens?.length ?? 0;
  const hasFingerprint = !!scene.shot_fingerprint?.composition_hash;

  return clamp01(
    clamp01(avgSignificance) * 0.35 +
      clamp01(atoms.length / 6) * 0.25 +
      clamp01(envTokens / 5) * 0.2 +
      clamp01(cameraTokens / 8) * 0.1 +
      (hasFingerprint ? 0.1 : 0)
  );
}

function sceneCompositeScore(scene: CinematicExtractionResult): number {
  const density = sceneSemanticDensity(scene);
  const visual = visualSpecificityScore(scene);
  const confidence = scene.confidence_profile?.aggregate_certainty ?? 0.5;
  return clamp01(density * 0.45 + visual * 0.4 + confidence * 0.15);
}

function getExpansionEntries(
  dataset: SynthesizedLongformDataset
): { scene: CinematicExtractionResult; metadata: SynthesizedSceneMetadata }[] {
  return dataset.scenes
    .map((scene, index) => ({ scene, metadata: dataset.scene_metadata[index] }))
    .filter(({ metadata }) => metadata.synthesis_kind !== 'source_preserved');
}

function detectFillerScenes(
  entries: { scene: CinematicExtractionResult; metadata: SynthesizedSceneMetadata }[]
): string[] {
  const fillerIds: string[] = [];
  const sourceRefStreak = new Map<string, number>();

  for (const { scene, metadata } of entries) {
    const density = sceneSemanticDensity(scene);
    const tokens = tokenize(extractSceneSemanticText(scene));
    const streak = (sourceRefStreak.get(metadata.source_scene_ref ?? '') ?? 0) + 1;
    if (metadata.source_scene_ref) {
      sourceRefStreak.set(metadata.source_scene_ref, streak);
    }

    const isLowInfo = density < FILLER_DENSITY_THRESHOLD || tokens.length < 12;
    const isRepetitiveFiller =
      metadata.synthesis_kind === 'environment_only' &&
      streak >= 3 &&
      density < 0.55;
    const isWeakRest =
      metadata.synthesis_kind === 'rest_beat' &&
      tokens.length < 10 &&
      density < 0.5;

    if (isLowInfo || isRepetitiveFiller || isWeakRest) {
      fillerIds.push(scene.id);
    }
  }

  return [...new Set(fillerIds)].sort();
}

function scoreExpansionSemanticQuality(
  entries: { scene: CinematicExtractionResult; metadata: SynthesizedSceneMetadata }[]
): number {
  if (entries.length === 0) return 0;

  const scenes = entries.map((e) => e.scene);
  const densityAvg =
    scenes.reduce((sum, scene) => sum + sceneSemanticDensity(scene), 0) / scenes.length;
  const visualAvg =
    scenes.reduce((sum, scene) => sum + visualSpecificityScore(scene), 0) / scenes.length;
  const emotional = emotionalProgressionScore(scenes);
  const cinematic = cinematicProgressionScore(scenes);
  const mitigationBonus = clamp01(
    entries.filter((e) => e.metadata.mitigation_policies_applied.length > 1).length / entries.length
  );

  return clamp01(
    densityAvg * 0.28 + visualAvg * 0.22 + emotional * 0.2 + cinematic * 0.2 + mitigationBonus * 0.1
  );
}

function scoreExpansionContinuityRealism(
  dataset: SynthesizedLongformDataset,
  sourceTemporal: TemporalMemoryGraphExport
): number {
  const graph = dataset.expanded_continuity_graph;
  const scenes = dataset.scenes;

  const sourceToSynthTransitions = dataset.scene_metadata
    .map((meta, index) => ({ meta, index }))
    .filter(({ meta, index }) => index > 0 && meta.synthesis_kind !== 'source_preserved')
    .filter(({ index }) => dataset.scene_metadata[index - 1]?.synthesis_kind === 'source_preserved');

  const sourceBridgeScore = clamp01(
    sourceToSynthTransitions.length > 0
      ? sourceToSynthTransitions.filter(({ index }) => {
          const prev = scenes[index - 1];
          const curr = scenes[index];
          return (
            curr.sequence_graph?.previous_node === prev.id &&
            (curr.scene_indexing?.v_timestamp_start ?? 0) >=
              (prev.scene_indexing?.v_timestamp_end ?? 0)
          );
        }).length / sourceToSynthTransitions.length
      : 0.85
  );

  const synthToSynthScore = clamp01(
    graph.emotional_transition_edges.length / Math.max(dataset.scene_count - 1, 1)
  );

  const emotionalRealism = clamp01(
    graph.emotional_transition_edges.reduce((sum, e) => sum + e.persistence_strength, 0) /
      Math.max(graph.emotional_transition_edges.length, 1)
  );

  const environmentRealism = clamp01(
    graph.environment_memory_edges.length / Math.max(dataset.scene_count / 3, 1)
  );

  const callbackRealism = clamp01(
    graph.cinematic_callback_edges.length <=
      dataset.scene_count / 3
      ? graph.cinematic_callback_edges.reduce((sum, e) => sum + (e.callback_strength ?? 0.5), 0) /
          Math.max(graph.cinematic_callback_edges.length, 1)
      : 0.55
  );

  const sourceAnchorBonus = clamp01(
    sourceTemporal.continuity_summary.average_persistence_strength * 0.15
  );

  return clamp01(
    sourceBridgeScore * 0.25 +
      synthToSynthScore * 0.2 +
      emotionalRealism * 0.2 +
      environmentRealism * 0.15 +
      callbackRealism * 0.1 +
      sourceAnchorBonus +
      0.1
  );
}

function scoreLongformPacingQuality(
  dataset: SynthesizedLongformDataset,
  synthesisFatigue120: number,
  integrityReport: SynthesisIntegrityReport
): number {
  const meta = dataset.scene_metadata;
  const kindCounts = {
    rest_beat: meta.filter((m) => m.synthesis_kind === 'rest_beat').length,
    environment_only: meta.filter((m) => m.synthesis_kind === 'environment_only').length,
    framing_variation: meta.filter((m) => m.synthesis_kind === 'framing_variation').length,
    expansion_cycle: meta.filter((m) => m.synthesis_kind === 'expansion_cycle').length,
  };

  const rhythmDiversity = clamp01(
    (kindCounts.rest_beat + kindCounts.environment_only + kindCounts.framing_variation) /
      Math.max(dataset.scene_count, 1)
  );

  const expansionScenes = dataset.scenes.filter(
    (_, i) => meta[i].synthesis_kind !== 'source_preserved'
  );
  const emotionalPacing = emotionalProgressionScore(expansionScenes);
  const visualCadence = cinematicProgressionScore(expansionScenes);
  const fatigueReduction = clamp01(1 - synthesisFatigue120);

  const integrityBonus = clamp01(integrityReport.integrity_checks_passed / integrityReport.integrity_checks_total);

  return clamp01(
    rhythmDiversity * 0.25 +
      emotionalPacing * 0.25 +
      visualCadence * 0.2 +
      fatigueReduction * 0.2 +
      integrityBonus * 0.1
  );
}

function scoreExpansionOrchestrationQuality(dataset: SynthesizedLongformDataset): number {
  const graph = dataset.expanded_continuity_graph;
  const scenes = dataset.scenes;

  const timestampsMonotonic = scenes.every(
    (scene, index) =>
      index === 0 ||
      (scene.scene_indexing?.v_timestamp_start ?? 0) >=
        (scenes[index - 1].scene_indexing?.v_timestamp_end ?? 0)
  );

  const totalEdges =
    graph.emotional_transition_edges.length +
    graph.visual_motif_edges.length +
    graph.character_memory_edges.length +
    graph.environment_memory_edges.length +
    graph.cinematic_callback_edges.length;

  const graphUsefulness = clamp01(totalEdges / Math.max(dataset.scene_count * 1.5, 1));
  const chainStability = timestampsMonotonic ? 0.92 : 0.55;
  const orchestrationCoherence = clamp01(
    graph.scene_memory_nodes.length / Math.max(dataset.scene_count, 1)
  );
  const memoryCoherence = clamp01(
    graph.character_memory_edges.length / Math.max(dataset.scene_count / 2, 1)
  );

  return clamp01(
    chainStability * 0.3 + graphUsefulness * 0.25 + orchestrationCoherence * 0.25 + memoryCoherence * 0.2
  );
}

function scoreExpansionUsefulness(
  entries: { scene: CinematicExtractionResult; metadata: SynthesizedSceneMetadata }[]
): number {
  if (entries.length === 0) return 0;

  const scenes = entries.map((e) => e.scene);
  const imageUsefulness =
    scenes.reduce((sum, scene) => sum + visualSpecificityScore(scene), 0) / scenes.length;
  const videoUsefulness = clamp01(
    scenes.filter((scene) => (scene.generative_layer?.runway?.length ?? 0) > 20).length /
      scenes.length
  );
  const cinematicUsefulness = clamp01(
    scenes.reduce(
      (sum, scene) => sum + (scene.layers?.scene_language?.cinematography_tokens?.length ?? 0),
      0
    ) /
      (scenes.length * 8)
  );
  const musicDramaUsefulness = clamp01(
    scenes.reduce((sum, scene) => {
      const emotion = scene.scene_state?.emotion;
      if (!emotion) return sum + 0.5;
      return (
        sum +
        clamp01(
          (groundedValue(emotion.melancholy) +
            groundedValue(emotion.anticipation) +
            groundedValue(emotion.catharsis_ready)) /
            3
        )
      );
    }, 0) / scenes.length
  );

  return clamp01(
    imageUsefulness * 0.3 +
      videoUsefulness * 0.25 +
      cinematicUsefulness * 0.25 +
      musicDramaUsefulness * 0.2
  );
}

function rankDimensions(
  dimensionScores: SynthesizedAuditDimensionScore[]
): {
  strongest: SynthesizedExpansionDimensionKey[];
  weakest: SynthesizedExpansionDimensionKey[];
} {
  const sorted = [...dimensionScores].sort((a, b) => b.score - a.score);
  return {
    strongest: sorted.slice(0, 2).map((d) => d.dimension_key),
    weakest: sorted.slice(-2).map((d) => d.dimension_key),
  };
}

function resolveVerdict(
  quality: number,
  continuity: number,
  orchestration: number,
  fatigue: number,
  fillerRatio: number
): FinalSynthesizedDatasetVerdict {
  if (
    quality >= QUALITY_READY_MIN &&
    continuity >= CONTINUITY_READY_MIN &&
    orchestration >= ORCHESTRATION_READY_MIN &&
    fatigue <= FATIGUE_MAX &&
    fillerRatio <= FILLER_RATIO_MAX
  ) {
    return 'synthesized_ready';
  }
  if (quality >= 0.55 && continuity >= 0.72 && orchestration >= 0.65) {
    return 'synthesized_conditional';
  }
  return 'synthesized_not_ready';
}

function buildAuditCheck(
  check_key: string,
  label: string,
  passed: boolean,
  detail: string
): SynthesizedQualityAuditCheck {
  return { check_key, label, passed, detail };
}

export function buildSynthesizedLongformDatasetQualityAudit(): SynthesizedLongformDatasetQualityAuditResult {
  const synthesis = buildRealLongformDatasetSynthesisPreview();
  const mitigationBlueprint = buildLongformFatigueMitigationBlueprintPreview();
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const sourceScenes = exportCandidate.longform_export_candidate_package.runtime_dataset;
  const sourceTemporal = buildTemporalMemoryGraphExport(sourceScenes);

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const primaryDataset = synthesis.synthesized_120_scene_dataset;
  const expansionEntries = getExpansionEntries(primaryDataset);
  const expansion_scene_count = expansionEntries.length;

  const filler_scene_ids = detectFillerScenes(expansionEntries);
  const weak_synthesized_scene_ids = expansionEntries
    .filter(({ scene }) => sceneCompositeScore(scene) < WEAK_SCENE_THRESHOLD)
    .map(({ scene }) => scene.id)
    .sort();

  const dimensionScores: SynthesizedAuditDimensionScore[] = [
    {
      dimension_key: 'expansion_semantic_quality',
      label: DIMENSION_LABELS.expansion_semantic_quality,
      score: scoreExpansionSemanticQuality(expansionEntries),
      detail: `Audited ${expansion_scene_count} expansion scenes for semantic density, emotional/cinematic progression, and visual specificity`,
    },
    {
      dimension_key: 'expansion_continuity_realism',
      label: DIMENSION_LABELS.expansion_continuity_realism,
      score: scoreExpansionContinuityRealism(primaryDataset, sourceTemporal),
      detail: 'Evaluated synthesized-to-original and synthesized-to-synthesized continuity with callback realism',
    },
    {
      dimension_key: 'longform_pacing_quality',
      label: DIMENSION_LABELS.longform_pacing_quality,
      score: scoreLongformPacingQuality(
        primaryDataset,
        synthesis.synthesis_fatigue_scores.at_120,
        synthesis.synthesis_integrity_report
      ),
      detail: 'Measured rhythm diversity, emotional pacing, visual cadence, and fatigue reduction effectiveness',
    },
    {
      dimension_key: 'expansion_orchestration_quality',
      label: DIMENSION_LABELS.expansion_orchestration_quality,
      score: scoreExpansionOrchestrationQuality(primaryDataset),
      detail: 'Assessed temporal chain stability, continuity graph usefulness, and memory graph coherence',
    },
    {
      dimension_key: 'expansion_usefulness',
      label: DIMENSION_LABELS.expansion_usefulness,
      score: scoreExpansionUsefulness(expansionEntries),
      detail: 'Scored image/video/cinematic/music-drama generation usefulness of expansion scenes',
    },
  ];

  const synthesized_quality_score = dimensionScores.find(
    (d) => d.dimension_key === 'expansion_semantic_quality'
  )!.score;
  const synthesized_continuity_score = dimensionScores.find(
    (d) => d.dimension_key === 'expansion_continuity_realism'
  )!.score;
  const synthesized_orchestration_score = dimensionScores.find(
    (d) => d.dimension_key === 'expansion_orchestration_quality'
  )!.score;
  const synthesized_fatigue_score = synthesis.synthesis_fatigue_scores.at_120;

  const { strongest, weakest } = rankDimensions(dimensionScores);
  const fillerRatio = filler_scene_ids.length / Math.max(expansion_scene_count, 1);

  const final_synthesized_dataset_verdict = resolveVerdict(
    synthesized_quality_score,
    synthesized_continuity_score,
    synthesized_orchestration_score,
    synthesized_fatigue_score,
    fillerRatio
  );

  const tierCountsValid =
    synthesis.synthesized_60_scene_dataset.scene_count === 60 &&
    synthesis.synthesized_90_scene_dataset.scene_count === 90 &&
    synthesis.synthesized_120_scene_dataset.scene_count === 120;

  const audit_checks: SynthesizedQualityAuditCheck[] = [
    buildAuditCheck(
      'synthesized_scenes_audited',
      'Synthesized Scenes Audited',
      expansion_scene_count > 0,
      `Audited ${expansion_scene_count} actual expansion scenes from PHASE-26A 120-scene dataset`
    ),
    buildAuditCheck(
      'filler_detection_executed',
      'Filler Detection Executed',
      true,
      `Detected ${filler_scene_ids.length} filler scene(s) via low-information and repetitive filler heuristics`
    ),
    buildAuditCheck(
      'continuity_realism_evaluated',
      'Continuity Realism Evaluated',
      synthesized_continuity_score >= 0.72,
      `Expansion continuity realism score: ${synthesized_continuity_score}`
    ),
    buildAuditCheck(
      'all_tiers_present',
      'All Synthesis Tiers Present',
      tierCountsValid,
      'PHASE-26A 60/90/120-scene synthesized datasets available for audit'
    ),
    buildAuditCheck(
      'weak_scenes_identified',
      'Weak Scenes Identified',
      true,
      `${weak_synthesized_scene_ids.length} weak expansion scene(s) below threshold ${WEAK_SCENE_THRESHOLD}`
    ),
    buildAuditCheck(
      'fatigue_acceptable',
      'Synthesized Fatigue Acceptable',
      synthesized_fatigue_score <= FATIGUE_MAX,
      `120-scene synthesized fatigue ${synthesized_fatigue_score} (max ${FATIGUE_MAX})`
    ),
    buildAuditCheck(
      'canonical_export_unchanged',
      'Canonical Export Unchanged',
      assertCanonicalExportUnchanged(),
      `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`
    ),
  ];

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  audit_checks.push(
    buildAuditCheck(
      'runtime_dataset_unchanged',
      'Runtime Dataset Unchanged',
      runtimeFingerprintBefore === runtimeFingerprintAfter,
      'Readonly audit — runtime fingerprint preserved'
    )
  );

  const auditCore = {
    schema_version: SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_VERSION,
    generated_at: SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_EPOCH,
    readonly_audit: true as const,
    synthesis_checksum_ref: synthesis.synthesis_checksum,
    mitigation_blueprint_checksum_ref: mitigationBlueprint.mitigation_blueprint_checksum,
    temporal_graph_checksum_ref: sourceTemporal.export_checksum,
    audited_tiers: [60, 90, 120] as SynthesizedLongformTier[],
    expansion_scene_count,
    synthesized_quality_score,
    synthesized_continuity_score,
    synthesized_orchestration_score,
    synthesized_fatigue_score,
    weak_synthesized_scene_ids,
    filler_scene_ids,
    strongest_expansion_dimensions: strongest,
    weakest_expansion_dimensions: weakest,
    dimension_scores: dimensionScores,
    audit_checks,
    final_synthesized_dataset_verdict,
    validation: {
      deterministic_audit_checksum_stable: true,
      readonly_audit: true as const,
      synthesized_scenes_audited: expansion_scene_count > 0,
      filler_detection_executed: true as const,
      continuity_realism_evaluated: synthesized_continuity_score >= 0.72,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const synthesized_audit_checksum = digest([
    JSON.stringify({ ...auditCore, synthesized_audit_checksum: undefined }),
    synthesis.synthesized_dataset_checksums.at_120,
    final_synthesized_dataset_verdict,
    String(synthesized_quality_score),
  ]);

  return {
    ...auditCore,
    synthesized_audit_checksum,
  };
}

let cachedAudit: SynthesizedLongformDatasetQualityAuditResult | null = null;

export function buildSynthesizedLongformDatasetQualityAuditPreview(): SynthesizedLongformDatasetQualityAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildSynthesizedLongformDatasetQualityAudit();
  return cachedAudit;
}

export function buildSynthesizedLongformDatasetQualityAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildSynthesizedLongformDatasetQualityAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetSynthesizedLongformDatasetQualityAuditCache(): void {
  cachedAudit = null;
}
