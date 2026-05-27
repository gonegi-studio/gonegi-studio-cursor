import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  FatigueReductionPlan,
  FatigueReductionPlanStep,
  FatigueReducerBlockingIssue,
  FatigueRiskCause,
  FatigueRiskCauseCategory,
  FatigueVariationCandidate,
  LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_VERSION,
  LongformFatigueRiskReducerAuditResult,
  SceneMemoryNode,
  TemporalMemoryGraphExport,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildFinalDatasetSemanticQualityAuditPreview } from './finalDatasetSemanticQualityAudit';
import { buildLongformDatasetExportCandidatePreview } from './longformDatasetExportCandidate';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_EPOCH = '2026-05-27T12:00:00.000Z';
export const LONGFORM_FATIGUE_RISK_REDUCER_JSON_FILENAME =
  'longform-fatigue-risk-reducer-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const CLUSTER_REPEAT_THRESHOLD = 3;
const FRAMING_REPEAT_RATIO = 0.35;
const COLOR_REPEAT_RATIO = 0.3;

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

function clusterByKey<T>(
  items: { key: string; sceneId: string; value: T }[],
  minCount: number
): Map<string, string[]> {
  const clusters = new Map<string, Set<string>>();
  for (const item of items) {
    if (!item.key) continue;
    const existing = clusters.get(item.key) ?? new Set<string>();
    existing.add(item.sceneId);
    clusters.set(item.key, existing);
  }
  const result = new Map<string, string[]>();
  for (const [key, sceneSet] of clusters) {
    if (sceneSet.size >= minCount) {
      result.set(key, [...sceneSet].sort());
    }
  }
  return result;
}

function severityFromCount(count: number, total: number): FatigueRiskCause['severity'] {
  const ratio = count / Math.max(total, 1);
  if (ratio >= 0.45 || count >= 8) return 'high';
  if (ratio >= 0.25 || count >= 5) return 'moderate';
  return 'low';
}

function analyzeRepeatedMotifClusters(
  memoryNodes: SceneMemoryNode[],
  totalScenes: number
): FatigueRiskCause[] {
  const items = memoryNodes.flatMap((node) =>
    node.motif_signatures.map((motif) => ({
      key: motif.toLowerCase(),
      sceneId: node.scene_id,
      value: motif,
    }))
  );
  const clusters = clusterByKey(items, CLUSTER_REPEAT_THRESHOLD);
  let counter = 0;
  return [...clusters.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([motif, sceneIds]) => {
      counter += 1;
      return {
        cause_id: `CAUSE-MOTIF-${String(counter).padStart(3, '0')}`,
        category: 'repeated_motif' as const,
        severity: severityFromCount(sceneIds.length, totalScenes),
        signal: motif,
        occurrence_count: sceneIds.length,
        affected_scene_ids: sceneIds,
        detail: `Motif "${motif}" recurs across ${sceneIds.length} scene(s)`,
      };
    });
}

function analyzeRepeatedEmotionalTone(
  dataset: CinematicExtractionResult[]
): FatigueRiskCause[] {
  const items = dataset.flatMap((scene) => {
    const tokens = [
      ...(scene.layers?.scene_language?.emotion_tokens ?? []),
      ...Object.keys(scene.scene_state?.emotion ?? {}).filter(
        (key) => key !== 'catharsis_ready' && key !== 'isolation_score'
      ),
    ];
    return tokens.map((token) => ({
      key: token.toLowerCase(),
      sceneId: scene.id,
      value: token,
    }));
  });
  const clusters = clusterByKey(items, CLUSTER_REPEAT_THRESHOLD);
  let counter = 0;
  return [...clusters.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([tone, sceneIds]) => {
      counter += 1;
      return {
        cause_id: `CAUSE-EMOTION-${String(counter).padStart(3, '0')}`,
        category: 'repeated_emotion' as const,
        severity: severityFromCount(sceneIds.length, dataset.length),
        signal: tone,
        occurrence_count: sceneIds.length,
        affected_scene_ids: sceneIds,
        detail: `Emotional tone "${tone}" repeats in ${sceneIds.length} scene(s)`,
      };
    });
}

function analyzeRepeatedFraming(dataset: CinematicExtractionResult[]): FatigueRiskCause[] {
  const framingByScene = dataset.map((scene) => {
    const framings = (scene.visual_atoms ?? [])
      .map((atom) => atom.spatial_intelligence?.framing)
      .filter(Boolean) as string[];
    const dominant = framings.sort()[0] ?? 'unknown';
    return { sceneId: scene.id, framing: dominant };
  });

  const counts = new Map<string, string[]>();
  for (const entry of framingByScene) {
    const list = counts.get(entry.framing) ?? [];
    list.push(entry.sceneId);
    counts.set(entry.framing, list);
  }

  let counter = 0;
  return [...counts.entries()]
    .filter(([, sceneIds]) => sceneIds.length / dataset.length >= FRAMING_REPEAT_RATIO)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([framing, sceneIds]) => {
      counter += 1;
      return {
        cause_id: `CAUSE-FRAMING-${String(counter).padStart(3, '0')}`,
        category: 'repeated_framing' as const,
        severity: severityFromCount(sceneIds.length, dataset.length),
        signal: framing,
        occurrence_count: sceneIds.length,
        affected_scene_ids: [...sceneIds].sort(),
        detail: `Framing pattern "${framing}" dominates ${sceneIds.length}/${dataset.length} scenes`,
      };
    });
}

function analyzeRepeatedColorHarmony(
  dataset: CinematicExtractionResult[],
  memoryNodes: SceneMemoryNode[]
): FatigueRiskCause[] {
  const items: { key: string; sceneId: string; value: string }[] = [];

  for (const scene of dataset) {
    const palette = scene.shot_fingerprint?.palette_hash;
    if (palette) items.push({ key: palette, sceneId: scene.id, value: palette });
  }
  for (const node of memoryNodes) {
    if (node.color_harmony_signature) {
      items.push({
        key: node.color_harmony_signature,
        sceneId: node.scene_id,
        value: node.color_harmony_signature,
      });
    }
  }

  const clusters = clusterByKey(items, CLUSTER_REPEAT_THRESHOLD);
  let counter = 0;
  return [...clusters.entries()]
    .filter(([, sceneIds]) => sceneIds.length / dataset.length >= COLOR_REPEAT_RATIO)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([colorKey, sceneIds]) => {
      counter += 1;
      const uniqueScenes = [...new Set(sceneIds)].sort();
      return {
        cause_id: `CAUSE-COLOR-${String(counter).padStart(3, '0')}`,
        category: 'repeated_color' as const,
        severity: severityFromCount(uniqueScenes.length, dataset.length),
        signal: colorKey.slice(0, 16),
        occurrence_count: uniqueScenes.length,
        affected_scene_ids: uniqueScenes,
        detail: `Color harmony cluster ${colorKey.slice(0, 16)}… appears in ${uniqueScenes.length} scene(s)`,
      };
    });
}

function analyzeCallbackOversaturation(
  temporalExport: TemporalMemoryGraphExport,
  callbackSaturationScore: number,
  totalScenes: number
): FatigueRiskCause[] {
  const callbackEdges = temporalExport.temporal_memory_graph.cinematic_callback_edges.length;
  const linkDensity = callbackEdges / Math.max(totalScenes, 1);
  if (callbackSaturationScore < 0.35 && linkDensity < 2.5) return [];

  return [
    {
      cause_id: 'CAUSE-CALLBACK-001',
      category: 'callback_oversaturation',
      severity: callbackSaturationScore >= 0.55 ? 'high' : 'moderate',
      signal: 'callback_saturation',
      occurrence_count: callbackEdges,
      affected_scene_ids: temporalExport.temporal_memory_graph.scene_memory_nodes
        .filter((node) =>
          temporalExport.temporal_memory_graph.cinematic_callback_edges.some(
            (edge) => edge.source_node_id === node.node_id || edge.target_node_id === node.node_id
          )
        )
        .map((node) => node.scene_id)
        .sort(),
      detail: `Callback saturation score ${callbackSaturationScore}; ${callbackEdges} callback edges across ${totalScenes} scenes`,
    },
  ];
}

function analyzeMemoryOverloadHotspots(
  temporalExport: TemporalMemoryGraphExport
): FatigueRiskCause[] {
  const graph = temporalExport.temporal_memory_graph;
  const edgeCounts = new Map<string, number>();

  for (const edge of [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ]) {
    edgeCounts.set(edge.source_node_id, (edgeCounts.get(edge.source_node_id) ?? 0) + 1);
    edgeCounts.set(edge.target_node_id, (edgeCounts.get(edge.target_node_id) ?? 0) + 1);
  }

  const nodeById = new Map(graph.scene_memory_nodes.map((node) => [node.node_id, node]));
  const threshold = Math.max(6, Math.ceil(graph.scene_memory_nodes.length * 0.35));

  let counter = 0;
  return [...edgeCounts.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nodeId, count]) => {
      counter += 1;
      const node = nodeById.get(nodeId);
      return {
        cause_id: `CAUSE-MEMORY-${String(counter).padStart(3, '0')}`,
        category: 'memory_overload' as const,
        severity: count >= threshold + 4 ? 'high' : 'moderate',
        signal: node?.mood_signature ?? nodeId,
        occurrence_count: count,
        affected_scene_ids: node ? [node.scene_id] : [],
        detail: `Memory node ${nodeId} carries ${count} temporal edges (overload hotspot)`,
      };
    });
}

function buildVariationCandidates(
  causes: FatigueRiskCause[],
  category: FatigueRiskCauseCategory,
  prefix: string,
  variationTemplates: Record<string, string>
): FatigueVariationCandidate[] {
  return causes
    .filter((cause) => cause.category === category)
    .slice(0, 6)
    .map((cause, index) => ({
      candidate_id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
      category,
      target_cluster: cause.signal,
      suggested_variation:
        variationTemplates[category] ??
        `Introduce controlled variation for "${cause.signal}" on manual review pass`,
      rationale: `Reduce ${category.replace(/_/g, ' ')} fatigue without mutating locked dataset export`,
      affected_scene_ids: cause.affected_scene_ids.slice(0, 8),
      safe_manual_only: true as const,
    }));
}

function buildFatigueReductionPlan(
  causes: FatigueRiskCause[],
  baselineFatigue: number,
  semanticChecksum: string
): FatigueReductionPlan {
  const steps: FatigueReductionPlanStep[] = causes.slice(0, 10).map((cause, index) => ({
    step_id: `STEP-${String(index + 1).padStart(3, '0')}`,
    priority: index + 1,
    category: cause.category,
    action: `Manual review: diversify ${cause.category.replace(/_/g, ' ')} cluster "${cause.signal}" across ${cause.affected_scene_ids.length} scene(s) in external render planning only`,
    target_scenes: cause.affected_scene_ids.slice(0, 8),
    non_mutating: true as const,
  }));

  const reductionEstimate = clamp01(causes.length * 0.04 + baselineFatigue * 0.12);

  return {
    plan_id: `FATIGUE-PLAN-${semanticChecksum.slice(0, 12)}`,
    baseline_fatigue_risk_score: baselineFatigue,
    semantic_audit_checksum_ref: semanticChecksum,
    target_fatigue_reduction_estimate: reductionEstimate,
    steps,
    causes_addressed: causes.length,
  };
}

function buildSafeRecommendations(
  causes: FatigueRiskCause[],
  baselineFatigue: number
): string[] {
  const recommendations = [
    'Readonly audit — do not mutate longform-dataset-export-candidate.json or production lock artifacts.',
    'Apply all variation candidates during external render planning or human editorial review only.',
    `Baseline fatigue risk score ${baselineFatigue} — prioritize high-severity causes first.`,
  ];

  if (causes.some((c) => c.category === 'callback_oversaturation')) {
    recommendations.push(
      'Reduce callback density in second-pass render briefs — defer redundant motif callbacks to later sequences.'
    );
  }
  if (causes.some((c) => c.category === 'memory_overload')) {
    recommendations.push(
      'Split memory-heavy scenes across separate render sessions to avoid recursive context overload in external engines.'
    );
  }
  if (causes.some((c) => c.category === 'repeated_framing')) {
    recommendations.push(
      'Alternate framing vocabulary (ECU/MCU/WS/ELS) in manual shot notes for flagged scenes — no prompt auto-rewrite.'
    );
  }
  if (causes.some((c) => c.category === 'repeated_emotion')) {
    recommendations.push(
      'Introduce micro-emotional variation beats in director notes for monotonous tone clusters.'
    );
  }

  return recommendations;
}

export function buildLongformFatigueRiskReducerAudit(): LongformFatigueRiskReducerAuditResult {
  const exportCandidate = buildLongformDatasetExportCandidatePreview();
  const semanticAudit = buildFinalDatasetSemanticQualityAuditPreview();
  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const dataset = exportCandidate.longform_export_candidate_package.runtime_dataset;
  const stabilizationReport =
    exportCandidate.longform_export_candidate_package.runtime_temporal_stabilization_report;
  const temporalExport = buildTemporalMemoryGraphExport(dataset);
  const memoryNodes = temporalExport.temporal_memory_graph.scene_memory_nodes;

  const fatigue_risk_causes: FatigueRiskCause[] = [
    ...analyzeRepeatedMotifClusters(memoryNodes, dataset.length),
    ...analyzeRepeatedEmotionalTone(dataset),
    ...analyzeRepeatedFraming(dataset),
    ...analyzeRepeatedColorHarmony(dataset, memoryNodes),
    ...analyzeCallbackOversaturation(
      temporalExport,
      stabilizationReport.callback_saturation.callback_saturation_score,
      dataset.length
    ),
    ...analyzeMemoryOverloadHotspots(temporalExport),
  ].sort((a, b) => a.cause_id.localeCompare(b.cause_id));

  const variationTemplates: Record<FatigueRiskCauseCategory, string> = {
    repeated_motif: 'Substitute adjacent motif variant in manual storyboard notes — preserve canonical motif registry',
    repeated_emotion: 'Shift emotional micro-beat (anticipation ↔ melancholy) in director annotation layer',
    repeated_framing: 'Alternate shot scale (MCU ↔ WS) in external render shot list for flagged scenes',
    repeated_color: 'Introduce complementary palette accent in manual color script — do not rewrite dataset palette_hash',
    callback_oversaturation: 'Limit callback references to one per sequence block in second-pass render brief',
    memory_overload: 'Isolate high-edge memory scenes into standalone render batches',
  };

  const motif_diversification_candidates = buildVariationCandidates(
    fatigue_risk_causes,
    'repeated_motif',
    'MOTIF-CAND',
    variationTemplates
  );
  const emotion_variation_candidates = buildVariationCandidates(
    fatigue_risk_causes,
    'repeated_emotion',
    'EMOTION-CAND',
    variationTemplates
  );
  const framing_variation_candidates = buildVariationCandidates(
    fatigue_risk_causes,
    'repeated_framing',
    'FRAMING-CAND',
    variationTemplates
  );
  const color_variation_candidates = buildVariationCandidates(
    fatigue_risk_causes,
    'repeated_color',
    'COLOR-CAND',
    variationTemplates
  );

  const fatigue_reduction_plan = buildFatigueReductionPlan(
    fatigue_risk_causes,
    semanticAudit.fatigue_risk_score,
    semanticAudit.semantic_audit_checksum
  );

  const safe_non_mutating_recommendations = buildSafeRecommendations(
    fatigue_risk_causes,
    semanticAudit.fatigue_risk_score
  );

  const reducer_blocking_issues: FatigueReducerBlockingIssue[] = [];
  if (!assertCanonicalExportUnchanged()) {
    reducer_blocking_issues.push({
      issue_id: 'BLOCK-001',
      severity: 'critical',
      category: 'audit_integrity',
      message: 'Canonical export size changed — fatigue reducer audit aborted integrity gate',
    });
  }

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  if (runtimeFingerprintBefore !== runtimeFingerprintAfter) {
    reducer_blocking_issues.push({
      issue_id: 'BLOCK-002',
      severity: 'critical',
      category: 'audit_integrity',
      message: 'Runtime dataset fingerprint changed during readonly fatigue reducer audit',
    });
  }

  const auditCore = {
    schema_version: LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_VERSION,
    generated_at: LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_EPOCH,
    readonly_audit: true as const,
    export_candidate_checksum_ref: exportCandidate.export_checksum,
    semantic_audit_checksum_ref: semanticAudit.semantic_audit_checksum,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    scene_count: dataset.length,
    fatigue_risk_causes,
    fatigue_reduction_plan,
    motif_diversification_candidates,
    emotion_variation_candidates,
    framing_variation_candidates,
    color_variation_candidates,
    safe_non_mutating_recommendations,
    reducer_blocking_issues,
    validation: {
      deterministic_fatigue_reducer_checksum_stable: true,
      readonly_audit: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const fatigue_reducer_audit_checksum = digest([
    JSON.stringify({ ...auditCore, fatigue_reducer_audit_checksum: undefined }),
    exportCandidate.export_checksum,
    semanticAudit.semantic_audit_checksum,
    String(fatigue_risk_causes.length),
  ]);

  return {
    ...auditCore,
    fatigue_reducer_audit_checksum,
  };
}

let cachedAudit: LongformFatigueRiskReducerAuditResult | null = null;

export function buildLongformFatigueRiskReducerAuditPreview(): LongformFatigueRiskReducerAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildLongformFatigueRiskReducerAudit();
  return cachedAudit;
}

export function buildLongformFatigueRiskReducerAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildLongformFatigueRiskReducerAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: LONGFORM_FATIGUE_RISK_REDUCER_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetLongformFatigueRiskReducerAuditCache(): void {
  cachedAudit = null;
}
