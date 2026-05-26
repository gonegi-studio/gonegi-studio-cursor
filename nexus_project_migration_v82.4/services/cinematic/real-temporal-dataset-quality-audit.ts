import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type { RealImageAppInputPackage } from "./real-image-app-input-package.ts";
import {
  buildRealV826TemporalCinematicDnaExportAdapter,
  computeRealV826TemporalCinematicDnaExportAdapterFingerprint,
  countTemporalMotionEdges,
  countTemporalSequenceEdges,
  type RealV826TemporalCinematicDnaExportAdapter,
  type RealV826TemporalCinematicDnaExportRecord,
} from "./real-v826-temporal-cinematic-dna-export-adapter.ts";
import type { RealV826UltraDenseSequenceEdge } from "./real-v826-ultra-dense-cinematic-dna-export-adapter.ts";

export type RealTemporalDatasetQualityAuditVerdict =
  | "production-ready"
  | "needs-density-refinement"
  | "needs-semantic-deduplication"
  | "insufficient-temporal-grounding";

export type RealTemporalDatasetQualityAuditDuplicateEdgeReport = {
  predicate: string;
  edgeKind: string;
  occurrenceCount: number;
};

export type RealTemporalDatasetQualityAuditRecordReport = {
  queueOrder: number;
  recordId: string;
  paddingRepetitionFlags: readonly string[];
  duplicateEdgeSemantics: readonly RealTemporalDatasetQualityAuditDuplicateEdgeReport[];
  weakFields: readonly string[];
  motionBridgeConsistencyScore: number;
  subjectTrajectoryConsistencyScore: number;
  cameraMomentumConsistencyScore: number;
  environmentalFlowConsistencyScore: number;
  sequenceGraphContinuityScore: number;
  temporalEdgeUsefulnessScore: number;
};

export type RealTemporalDatasetQualityAuditQualityScore = {
  structuralDensityScore: number;
  semanticUniquenessScore: number;
  temporalContinuityScore: number;
  motionConsistencyScore: number;
  cinematicUsefulnessScore: number;
  overallDatasetQualityScore: number;
};

export type RealTemporalDatasetQualityAudit = {
  version: "v1";
  auditId: string;
  auditVersion: typeof REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KIND_VERSION;
  activeAuditState: string;
  temporalExportFingerprint: string;
  recordCount: typeof REAL_TEMPORAL_DATASET_QUALITY_AUDIT_RECORD_COUNT;
  totalEdgeCount: number;
  totalTemporalEdgeCount: number;
  recordReports: readonly RealTemporalDatasetQualityAuditRecordReport[];
  datasetFindings: {
    paddingLikeRepetitionDetected: boolean;
    duplicateEdgeSemanticsDetected: boolean;
    weakFieldCount: number;
    crossRecordSemanticOverlapRatio: number;
    paddingRepetitionReport: readonly string[];
    duplicateEdgeReport: readonly RealTemporalDatasetQualityAuditDuplicateEdgeReport[];
  };
  qualityScore: RealTemporalDatasetQualityAuditQualityScore;
  auditVerdict: RealTemporalDatasetQualityAuditVerdict;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_VERSION = "v1" as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KIND_VERSION =
  "real-temporal-dataset-quality-audit-v1" as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_ROOT_ID =
  "real-temporal-dataset-quality-audit-gonegi-harbor-25s-v1" as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_STATE =
  "25s-real-temporal-dataset-quality-audit-metadata-only" as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_RECORD_COUNT = 3 as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_EXPECTED_TOTAL_EDGE_COUNT = 162 as const;
export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_EXPECTED_TEMPORAL_EDGE_COUNT = 72 as const;

export const REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KEY_ORDER = Object.freeze([
  "version",
  "auditId",
  "auditVersion",
  "activeAuditState",
  "temporalExportFingerprint",
  "recordCount",
  "totalEdgeCount",
  "totalTemporalEdgeCount",
  "recordReports",
  "datasetFindings",
  "qualityScore",
  "auditVerdict",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

let cachedRealTemporalDatasetQualityAudit: RealTemporalDatasetQualityAudit | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function collectTemporalEdges(
  record: RealV826TemporalCinematicDnaExportRecord
): readonly RealV826UltraDenseSequenceEdge[] {
  return Object.freeze([
    ...record.sequence_graph.motion_edges,
    ...record.sequence_graph.trajectory_edges,
    ...record.sequence_graph.camera_momentum_edges,
    ...record.sequence_graph.environmental_flow_edges,
  ]);
}

function detectPaddingRepetition(
  record: RealV826TemporalCinematicDnaExportRecord
): readonly string[] {
  const flags: string[] = [];
  const bridgeStates = record.motion_bridge_timeline.intermediateStates;

  for (let index = 1; index < bridgeStates.length; index += 1) {
    const previous = bridgeStates[index - 1];
    const current = bridgeStates[index];
    if (
      previous !== undefined &&
      current !== undefined &&
      previous.motionDensity === current.motionDensity &&
      previous.velocityScale === current.velocityScale
    ) {
      flags.push(`bridge-state-identical-density@${current.timestampSeconds}`);
    }
  }

  const waveform = record.temporal_continuity_memory.pacingDecay.pacingWaveform;
  let consecutiveIdentical = 0;
  for (let index = 1; index < waveform.length; index += 1) {
    if (waveform[index] === waveform[index - 1]) {
      consecutiveIdentical += 1;
    }
  }
  if (waveform.length > 0 && consecutiveIdentical / waveform.length > 0.5) {
    flags.push("pacing-waveform-padding-like-repetition");
  }

  const edges = collectTemporalEdges(record);
  const weightCounts = new Map<string, number>();
  for (const edge of edges) {
    const key = `${edge.predicate}|${edge.weight.toFixed(2)}`;
    weightCounts.set(key, (weightCounts.get(key) ?? 0) + 1);
  }
  for (const [key, count] of weightCounts) {
    if (count >= 4) {
      flags.push(`edge-weight-cluster:${key}`);
    }
  }

  return Object.freeze(flags);
}

function detectDuplicateEdgeSemantics(
  record: RealV826TemporalCinematicDnaExportRecord
): readonly RealTemporalDatasetQualityAuditDuplicateEdgeReport[] {
  const counts = new Map<string, number>();

  for (const edge of collectTemporalEdges(record)) {
    const key = `${edge.predicate}|${edge.edge_kind}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Object.freeze(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key, occurrenceCount]) => {
        const [predicate, edgeKind] = key.split("|");
        return Object.freeze({
          predicate: predicate ?? key,
          edgeKind: edgeKind ?? "unknown",
          occurrenceCount,
        });
      })
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
  );
}

function detectWeakFields(record: RealV826TemporalCinematicDnaExportRecord): readonly string[] {
  const weak: string[] = [];

  if (record.visual_atoms.length === 0) {
    weak.push("visual_atoms.empty");
  }
  if (record.relationship_graph.length === 0) {
    weak.push("relationship_graph.empty");
  }
  if (record.motion_bridge_timeline.intermediateStates.length < 5) {
    weak.push("motion_bridge_timeline.insufficient-states");
  }
  if (record.subject_trajectory_graph.gazeTrajectory.gazeCurve.length < 8) {
    weak.push("subject_trajectory_graph.short-gaze-curve");
  }
  if (record.camera_momentum_grammar.easingCurve.length < 12) {
    weak.push("camera_momentum_grammar.short-easing-curve");
  }
  if (record.motion_density_score.overallTemporalDensityScore < 0.35) {
    weak.push("motion_density_score.low-overall");
  }
  if (record.sequence_graph.temporal_total_edge_count < 40) {
    weak.push("sequence_graph.low-temporal-edge-count");
  }

  return Object.freeze(weak);
}

function scoreMotionBridgeConsistency(
  record: RealV826TemporalCinematicDnaExportRecord
): number {
  const bridge = record.motion_bridge_timeline;
  const states = bridge.intermediateStates;
  let score = 0.5;

  if (states.length === 5) {
    score += 0.15;
  }
  if (states[0]?.timestampSeconds === record.scene_indexing.v_timestamp_start) {
    score += 0.15;
  }

  let monotonic = true;
  for (let index = 1; index < states.length; index += 1) {
    const previous = states[index - 1];
    const current = states[index];
    if (
      previous !== undefined &&
      current !== undefined &&
      current.timestampSeconds <= previous.timestampSeconds
    ) {
      monotonic = false;
    }
  }
  if (monotonic) {
    score += 0.2;
  }

  const allMetadataOnly = states.every((state) => state.metadataOnly === true);
  if (allMetadataOnly) {
    score += 0.1;
  }

  return clampScore(score);
}

function scoreSubjectTrajectoryConsistency(
  record: RealV826TemporalCinematicDnaExportRecord
): number {
  const trajectory = record.subject_trajectory_graph;
  const velocityMagnitude =
    trajectory.velocityVector[0] ** 2 +
    trajectory.velocityVector[1] ** 2 +
    trajectory.velocityVector[2] ** 2;

  return clampScore(
    (velocityMagnitude > 0 ? 0.25 : 0) +
      trajectory.screenDirectionContinuity.continuityScore * 0.25 +
      trajectory.gazeTrajectory.focusLock * 0.25 +
      trajectory.motionPersistence.persistenceScore * 0.25
  );
}

function scoreCameraMomentumConsistency(record: RealV826TemporalCinematicDnaExportRecord): number {
  const momentum = record.camera_momentum_grammar;
  const easingSpan = (momentum.easingCurve.at(-1) ?? 0) - (momentum.easingCurve[0] ?? 0);

  return clampScore(
    momentum.cinematicInertia * 0.3 +
      momentum.movementMomentum * 0.25 +
      (easingSpan > 0 ? 0.2 : 0.05) +
      (momentum.shotTransitionForce > 0 ? 0.15 : 0) +
      (momentum.cameraAcceleration > 0 ? 0.1 : 0)
  );
}

function scoreEnvironmentalFlowConsistency(
  record: RealV826TemporalCinematicDnaExportRecord
): number {
  const field = record.environmental_motion_field;

  return clampScore(
    field.environmentalFlowPersistence.flowScore * 0.35 +
      field.windDirection.continuityScore * 0.25 +
      field.atmosphericParticleContinuity.persistenceScore * 0.2 +
      (field.cloudDrift.velocityScale > 0 ? 0.1 : 0) +
      (Math.abs(field.lightMovement.intensityDelta) <= 0.1 ? 0.1 : 0.05)
  );
}

function scoreSequenceGraphContinuity(record: RealV826TemporalCinematicDnaExportRecord): number {
  const graph = record.sequence_graph;

  return clampScore(
    (graph.transition_logic?.emotion_continuity ?? 0) * 0.35 +
      (graph.temporal_total_edge_count / 54) * 0.25 +
      (graph.motion_edges.length >= 6 ? 0.15 : 0.05) +
      (graph.continuity_edges.length >= 5 ? 0.15 : 0.05) +
      (graph.previous_node.length > 0 && graph.current_node.length > 0 ? 0.1 : 0)
  );
}

function scoreTemporalEdgeUsefulness(record: RealV826TemporalCinematicDnaExportRecord): number {
  const edges = collectTemporalEdges(record);
  if (edges.length === 0) {
    return 0;
  }

  const uniquePredicates = new Set(edges.map((edge) => edge.predicate));
  const nonZeroWeights = edges.filter((edge) => edge.weight > 0).length;
  const uniqueSubjects = new Set(edges.map((edge) => edge.subject));

  return clampScore(
    (uniquePredicates.size / edges.length) * 0.35 +
      (nonZeroWeights / edges.length) * 0.3 +
      (uniqueSubjects.size / edges.length) * 0.2 +
      (edges.every((edge) => edge.reasoning.length > 0) ? 0.15 : 0)
  );
}

function computeCrossRecordSemanticOverlap(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): number {
  const predicateSets = adapter.map((record) => {
    const predicates = new Set<string>();
    for (const edge of collectTemporalEdges(record)) {
      predicates.add(`${edge.predicate}|${edge.object}`);
    }
    return predicates;
  });

  if (predicateSets.length < 2) {
    return 0;
  }

  let shared = 0;
  const unionSet = new Set<string>();
  const first = predicateSets[0] ?? new Set<string>();

  for (const set of predicateSets) {
    for (const value of set) {
      unionSet.add(value);
    }
  }

  const union = unionSet.size;
  for (const value of first) {
    if (predicateSets.every((set) => set.has(value))) {
      shared += 1;
    }
  }

  return union === 0 ? 0 : clampScore(shared / union);
}

function resolveQueueOrder(record: RealV826TemporalCinematicDnaExportRecord, index: number): number {
  const start = record.scene_indexing.v_timestamp_start;
  if (start === 4) {
    return 0;
  }
  if (start === 12.5) {
    return 1;
  }
  if (start === 21) {
    return 2;
  }
  return index;
}

function buildRecordReport(
  record: RealV826TemporalCinematicDnaExportRecord,
  index: number
): RealTemporalDatasetQualityAuditRecordReport {
  return Object.freeze({
    queueOrder: resolveQueueOrder(record, index),
    recordId: record.id,
    paddingRepetitionFlags: detectPaddingRepetition(record),
    duplicateEdgeSemantics: detectDuplicateEdgeSemantics(record),
    weakFields: detectWeakFields(record),
    motionBridgeConsistencyScore: scoreMotionBridgeConsistency(record),
    subjectTrajectoryConsistencyScore: scoreSubjectTrajectoryConsistency(record),
    cameraMomentumConsistencyScore: scoreCameraMomentumConsistency(record),
    environmentalFlowConsistencyScore: scoreEnvironmentalFlowConsistency(record),
    sequenceGraphContinuityScore: scoreSequenceGraphContinuity(record),
    temporalEdgeUsefulnessScore: scoreTemporalEdgeUsefulness(record),
  });
}

function computeQualityScore(
  adapter: RealV826TemporalCinematicDnaExportAdapter,
  recordReports: readonly RealTemporalDatasetQualityAuditRecordReport[],
  datasetFindings: RealTemporalDatasetQualityAudit["datasetFindings"]
): RealTemporalDatasetQualityAuditQualityScore {
  const avg = (selector: (report: RealTemporalDatasetQualityAuditRecordReport) => number): number =>
    recordReports.reduce((sum, report) => sum + selector(report), 0) / recordReports.length;

  const firstRecord = adapter[0];

  const structuralDensityScore = clampScore(
    ((firstRecord?.visual_atoms.length ?? 0) / 10) * 0.25 +
      ((firstRecord?.semantic_relationship_matrix.length ?? 0) / 90) * 0.2 +
      (countTemporalSequenceEdges(adapter) /
        REAL_TEMPORAL_DATASET_QUALITY_AUDIT_EXPECTED_TOTAL_EDGE_COUNT) *
        0.35 +
      (1 - datasetFindings.crossRecordSemanticOverlapRatio) * 0.2
  );

  const semanticUniquenessScore = clampScore(
    (1 - datasetFindings.crossRecordSemanticOverlapRatio) * 0.45 +
      avg((report) => report.temporalEdgeUsefulnessScore) * 0.35 +
      (datasetFindings.duplicateEdgeSemanticsDetected ? 0.05 : 0.2)
  );

  const temporalContinuityScore = clampScore(
    avg((report) => report.motionBridgeConsistencyScore) * 0.3 +
      avg((report) => report.sequenceGraphContinuityScore) * 0.35 +
      avg((report) => report.subjectTrajectoryConsistencyScore) * 0.2 +
      (datasetFindings.weakFieldCount === 0 ? 0.15 : 0.05)
  );

  const motionConsistencyScore = clampScore(
    avg((report) => report.motionBridgeConsistencyScore) * 0.25 +
      avg((report) => report.subjectTrajectoryConsistencyScore) * 0.25 +
      avg((report) => report.cameraMomentumConsistencyScore) * 0.25 +
      avg((report) => report.environmentalFlowConsistencyScore) * 0.25
  );

  const cinematicUsefulnessScore = clampScore(
    avg((report) => report.temporalEdgeUsefulnessScore) * 0.4 +
      avg((report) => report.sequenceGraphContinuityScore) * 0.3 +
      motionConsistencyScore * 0.3
  );

  const overallDatasetQualityScore = clampScore(
    structuralDensityScore * 0.2 +
      semanticUniquenessScore * 0.2 +
      temporalContinuityScore * 0.2 +
      motionConsistencyScore * 0.2 +
      cinematicUsefulnessScore * 0.2
  );

  return Object.freeze({
    structuralDensityScore,
    semanticUniquenessScore,
    temporalContinuityScore,
    motionConsistencyScore,
    cinematicUsefulnessScore,
    overallDatasetQualityScore,
  });
}

function resolveAuditVerdict(
  qualityScore: RealTemporalDatasetQualityAuditQualityScore,
  datasetFindings: RealTemporalDatasetQualityAudit["datasetFindings"]
): RealTemporalDatasetQualityAuditVerdict {
  if (
    datasetFindings.duplicateEdgeSemanticsDetected ||
    qualityScore.semanticUniquenessScore < 0.72
  ) {
    return "needs-semantic-deduplication";
  }

  if (
    qualityScore.temporalContinuityScore < 0.68 ||
    qualityScore.motionConsistencyScore < 0.68 ||
    datasetFindings.weakFieldCount >= 3
  ) {
    return "insufficient-temporal-grounding";
  }

  if (qualityScore.structuralDensityScore < 0.78) {
    return "needs-density-refinement";
  }

  if (
    qualityScore.overallDatasetQualityScore >= 0.82 &&
    !datasetFindings.paddingLikeRepetitionDetected &&
    datasetFindings.weakFieldCount === 0
  ) {
    return "production-ready";
  }

  return qualityScore.overallDatasetQualityScore >= 0.75
    ? "production-ready"
    : "needs-density-refinement";
}

export function buildRealTemporalDatasetQualityAuditFromAdapter(
  temporalAdapter: RealV826TemporalCinematicDnaExportAdapter,
  temporalExportFingerprint: string
): RealTemporalDatasetQualityAudit {
  if (temporalAdapter.length !== REAL_TEMPORAL_DATASET_QUALITY_AUDIT_RECORD_COUNT) {
    throw new Error("Temporal dataset quality audit requires three temporal export records");
  }

  const recordReports = Object.freeze(
    temporalAdapter.map((record, index) => buildRecordReport(record, index))
  );

  const paddingRepetitionReport = Object.freeze(
    recordReports.flatMap((report) => report.paddingRepetitionFlags)
  );
  const duplicateEdgeReport = Object.freeze(
    recordReports.flatMap((report) => report.duplicateEdgeSemantics)
  );

  const datasetFindings = Object.freeze({
    paddingLikeRepetitionDetected: paddingRepetitionReport.length > 0,
    duplicateEdgeSemanticsDetected: duplicateEdgeReport.length > 0,
    weakFieldCount: recordReports.reduce((sum, report) => sum + report.weakFields.length, 0),
    crossRecordSemanticOverlapRatio: computeCrossRecordSemanticOverlap(temporalAdapter),
    paddingRepetitionReport,
    duplicateEdgeReport,
  });

  const qualityScore = computeQualityScore(temporalAdapter, recordReports, datasetFindings);
  const auditVerdict = resolveAuditVerdict(qualityScore, datasetFindings);

  const auditId = digestValue(
    [
      REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KIND_VERSION,
      temporalExportFingerprint,
      auditVerdict,
      String(qualityScore.overallDatasetQualityScore),
    ].join("|")
  );

  return Object.freeze({
    version: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_VERSION,
    auditId,
    auditVersion: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KIND_VERSION,
    activeAuditState: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_STATE,
    temporalExportFingerprint,
    recordCount: REAL_TEMPORAL_DATASET_QUALITY_AUDIT_RECORD_COUNT,
    totalEdgeCount: countTemporalSequenceEdges(temporalAdapter),
    totalTemporalEdgeCount: countTemporalMotionEdges(temporalAdapter),
    recordReports,
    datasetFindings,
    qualityScore,
    auditVerdict,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });
}

export function buildRealTemporalDatasetQualityAudit(
  temporalAdapter: RealV826TemporalCinematicDnaExportAdapter
): RealTemporalDatasetQualityAudit {
  return buildRealTemporalDatasetQualityAuditFromAdapter(
    temporalAdapter,
    computeRealV826TemporalCinematicDnaExportAdapterFingerprint(temporalAdapter)
  );
}

export function serializeRealTemporalDatasetQualityAudit(
  audit: RealTemporalDatasetQualityAudit
): string {
  return JSON.stringify(
    orderRecord(audit as unknown as Record<string, unknown>, REAL_TEMPORAL_DATASET_QUALITY_AUDIT_KEY_ORDER),
    null,
    2
  );
}

export function computeRealTemporalDatasetQualityAuditFingerprint(
  audit: RealTemporalDatasetQualityAudit
): string {
  return digestValue(serializeRealTemporalDatasetQualityAudit(audit));
}

export function buildRealTemporalDatasetQualityAuditPreview(): RealTemporalDatasetQualityAudit {
  if (cachedRealTemporalDatasetQualityAudit !== null) {
    return cachedRealTemporalDatasetQualityAudit;
  }

  const temporalAdapter = buildRealV826TemporalCinematicDnaExportAdapter(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  const audit = buildRealTemporalDatasetQualityAudit(temporalAdapter);
  cachedRealTemporalDatasetQualityAudit = audit;
  return audit;
}

export function resetRealTemporalDatasetQualityAuditCacheForVerification(): void {
  cachedRealTemporalDatasetQualityAudit = null;
}
