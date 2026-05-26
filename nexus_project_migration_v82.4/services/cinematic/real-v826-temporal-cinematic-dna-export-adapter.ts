import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { buildRealCameraMomentumGrammar } from "./real-camera-momentum-grammar.ts";
import type { RealCameraMomentumGrammarFrame } from "./real-camera-momentum-grammar.ts";
import { buildRealEnvironmentalMotionField } from "./real-environmental-motion-field.ts";
import type { RealEnvironmentalMotionFieldFrame } from "./real-environmental-motion-field.ts";
import { buildRealMotionBridgeTimeline } from "./real-motion-bridge-timeline.ts";
import type { RealMotionBridgeSegment } from "./real-motion-bridge-timeline.ts";
import { buildRealMotionDensityScore } from "./real-motion-density-score.ts";
import type { RealMotionDensityScoreFrame } from "./real-motion-density-score.ts";
import { buildRealSubjectTrajectoryGraph } from "./real-subject-trajectory-graph.ts";
import type { RealSubjectTrajectoryGraphFrame } from "./real-subject-trajectory-graph.ts";
import {
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
} from "./real-v826-cinematic-dna-export-adapter.ts";
import {
  buildRealV826UltraDenseCinematicDnaExportAdapter,
  type RealV826UltraDenseCinematicDnaExportRecord,
  type RealV826UltraDenseSequenceEdge,
} from "./real-v826-ultra-dense-cinematic-dna-export-adapter.ts";

export type RealV826TemporalCinematicDnaExportRecord = RealV826UltraDenseCinematicDnaExportRecord & {
  motion_bridge_timeline: RealMotionBridgeSegment;
  subject_trajectory_graph: RealSubjectTrajectoryGraphFrame;
  camera_momentum_grammar: RealCameraMomentumGrammarFrame;
  environmental_motion_field: RealEnvironmentalMotionFieldFrame;
  motion_density_score: RealMotionDensityScoreFrame;
  sequence_graph: RealV826UltraDenseCinematicDnaExportRecord["sequence_graph"] & {
    motion_edges: readonly RealV826UltraDenseSequenceEdge[];
    trajectory_edges: readonly RealV826UltraDenseSequenceEdge[];
    camera_momentum_edges: readonly RealV826UltraDenseSequenceEdge[];
    environmental_flow_edges: readonly RealV826UltraDenseSequenceEdge[];
    temporal_total_edge_count: number;
  };
  temporal_meta: {
    layer_revision: number;
    continuity_engine: string;
    density_tier: "temporal-cinematic";
    bridge_state_count: number;
    temporal_edge_count: number;
    metadata_only: true;
  };
};

export type RealV826TemporalCinematicDnaExportAdapter =
  readonly RealV826TemporalCinematicDnaExportRecord[];

export type RealV826TemporalCinematicDnaExportDownload = {
  filename: typeof REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
export const REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
export const REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_FILENAME =
  "kiki-25s-temporal-cinematic-dna-export.json" as const;
export const REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_KIND_VERSION =
  "real-v826-temporal-cinematic-dna-export-adapter-v1" as const;
export const REAL_V826_TEMPORAL_EDGES_PER_RECORD = 24 as const;

export const REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER = Object.freeze([
  "id",
  "schema_version",
  "schema_signature",
  "schema_meta",
  "analysis_timestamp",
  "source_hash",
  "core_dna_id",
  "category",
  "scene_indexing",
  "generative_layer",
  "layers",
  "scene_state",
  "latent_steering",
  "director_dna",
  "visual_atoms",
  "relationship_graph",
  "sequence_graph",
  "confidence_profile",
  "production_v72",
  "temporal_continuity_memory",
  "camera_grammar_evolution",
  "environmental_persistence",
  "character_emotional_trajectory",
  "cinematic_density_score",
  "cinematic_beat_manifest",
  "continuity_audit_trail",
  "visual_atom_interaction_registry",
  "semantic_relationship_matrix",
  "ultra_dense_meta",
  "motion_bridge_timeline",
  "subject_trajectory_graph",
  "camera_momentum_grammar",
  "environmental_motion_field",
  "motion_density_score",
  "temporal_meta",
] as const);

let cachedRealV826TemporalCinematicDnaExportAdapter: RealV826TemporalCinematicDnaExportAdapter | null =
  null;
let cachedRealV826TemporalCinematicDnaExportDownload: RealV826TemporalCinematicDnaExportDownload | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
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

function buildTemporalEdge(
  recordId: string,
  edgeKind: "motion" | "trajectory" | "camera_momentum" | "environmental_flow",
  subject: string,
  predicate: string,
  object: string,
  weight: number,
  reasoning: string,
  index: number
): RealV826UltraDenseSequenceEdge {
  return Object.freeze({
    edge_id: digestValue([recordId, edgeKind, String(index), subject, object].join("|")).slice(0, 24),
    edge_kind: edgeKind === "motion" ? "continuity" : edgeKind === "trajectory" ? "cinematic" : edgeKind === "camera_momentum" ? "cinematic" : "environment",
    subject,
    predicate,
    object,
    weight: Number(weight.toFixed(4)),
    confidence: Number((0.84 + (index % 4) * 0.03).toFixed(4)),
    source: "metadata",
    reasoning,
  });
}

function buildTemporalSequenceGraph(
  recordId: string,
  item: RealImageAppInputPackageItem,
  baseGraph: RealV826UltraDenseCinematicDnaExportRecord["sequence_graph"],
  motionBridge: RealMotionBridgeSegment,
  subjectTrajectory: RealSubjectTrajectoryGraphFrame,
  cameraMomentum: RealCameraMomentumGrammarFrame,
  environmentalMotion: RealEnvironmentalMotionFieldFrame
): RealV826TemporalCinematicDnaExportRecord["sequence_graph"] {
  const subjectAtom = baseGraph.current_node;
  const bridgeStates = motionBridge.intermediateStates;

  const motionEdges = Object.freeze([
    buildTemporalEdge(recordId, "motion", bridgeStates[0]?.stateId ?? "state-0", "bridges_to", bridgeStates[1]?.stateId ?? "state-1", 0.88, "motion bridge step 1", 0),
    buildTemporalEdge(recordId, "motion", bridgeStates[1]?.stateId ?? "state-1", "bridges_to", bridgeStates[2]?.stateId ?? "state-2", 0.86, "motion bridge step 2", 1),
    buildTemporalEdge(recordId, "motion", bridgeStates[2]?.stateId ?? "state-2", "bridges_to", bridgeStates[3]?.stateId ?? "state-3", 0.84, "motion bridge step 3", 2),
    buildTemporalEdge(recordId, "motion", bridgeStates[3]?.stateId ?? "state-3", "bridges_to", bridgeStates[4]?.stateId ?? "state-4", 0.82, "motion bridge step 4", 3),
    buildTemporalEdge(recordId, "motion", item.frameEvidenceId, "carries", String(subjectTrajectory.motionPersistence.persistenceScore), 0.9, "frame motion persistence", 4),
    buildTemporalEdge(recordId, "motion", String(motionBridge.fromTimestampSeconds), "flows_to", String(motionBridge.toTimestampSeconds), 0.87, "temporal motion flow", 5),
  ]);

  const trajectoryEdges = Object.freeze([
    buildTemporalEdge(recordId, "trajectory", subjectAtom, "velocity", subjectTrajectory.velocityVector.join(","), 0.9, "subject velocity vector", 0),
    buildTemporalEdge(recordId, "trajectory", String(subjectTrajectory.screenDirectionContinuity.entryDirectionDegrees), "continues_to", String(subjectTrajectory.screenDirectionContinuity.exitDirectionDegrees), 0.86, "screen direction continuity", 1),
    buildTemporalEdge(recordId, "trajectory", subjectTrajectory.gazeTrajectory.startPoint.join(","), "tracks_to", subjectTrajectory.gazeTrajectory.endPoint.join(","), 0.84, "gaze trajectory", 2),
    buildTemporalEdge(recordId, "trajectory", String(subjectTrajectory.movementInheritance), "inherits", item.dramaFunction, 0.82, "movement inheritance", 3),
    buildTemporalEdge(recordId, "trajectory", subjectTrajectory.motionPersistence.carryForwardVector.join(","), "persists", String(subjectTrajectory.motionPersistence.decayRate), 0.8, "motion carry forward", 4),
    buildTemporalEdge(recordId, "trajectory", item.rhythmPhase, "aligns", item.suggestedMusicEnergy, 0.78, "rhythm-trajectory alignment", 5),
  ]);

  const cameraMomentumEdges = Object.freeze([
    buildTemporalEdge(recordId, "camera_momentum", String(cameraMomentum.cameraAcceleration), "drives", String(cameraMomentum.movementMomentum), 0.88, "camera acceleration to momentum", 0),
    buildTemporalEdge(recordId, "camera_momentum", String(cameraMomentum.cinematicInertia), "resists", String(cameraMomentum.shotTransitionForce), 0.86, "inertia vs transition force", 1),
    buildTemporalEdge(recordId, "camera_momentum", cameraMomentum.easingCurve[0]?.toString() ?? "0", "eases_through", cameraMomentum.easingCurve.at(-1)?.toString() ?? "1", 0.84, "easing curve span", 2),
    buildTemporalEdge(recordId, "camera_momentum", baseGraph.previous_node, "momentum_bridge", baseGraph.current_node, 0.82, "camera momentum bridge", 3),
    buildTemporalEdge(recordId, "camera_momentum", baseGraph.current_node, "projects", baseGraph.next_candidates[0]?.id ?? "TERMINAL", 0.8, "forward camera momentum", 4),
    buildTemporalEdge(recordId, "camera_momentum", item.dramaFunction, "forces", String(cameraMomentum.shotTransitionForce), 0.78, "drama transition force", 5),
  ]);

  const environmentalFlowEdges = Object.freeze([
    buildTemporalEdge(recordId, "environmental_flow", String(environmentalMotion.cloudDrift.directionDegrees), "drifts", String(environmentalMotion.cloudDrift.velocityScale), 0.86, "cloud drift vector", 0),
    buildTemporalEdge(recordId, "environmental_flow", environmentalMotion.windDirection.vector.join(","), "flows", String(environmentalMotion.windDirection.gustIntensity), 0.84, "wind flow", 1),
    buildTemporalEdge(recordId, "environmental_flow", String(environmentalMotion.lightMovement.keyLightShiftDegrees), "shifts", String(environmentalMotion.lightMovement.intensityDelta), 0.82, "light movement", 2),
    buildTemporalEdge(recordId, "environmental_flow", environmentalMotion.atmosphericParticleContinuity.flowVector.join(","), "persists", String(environmentalMotion.atmosphericParticleContinuity.persistenceScore), 0.8, "particle continuity", 3),
    buildTemporalEdge(recordId, "environmental_flow", environmentalMotion.environmentalFlowPersistence.residueVector.join(","), "decays", String(environmentalMotion.environmentalFlowPersistence.decayTau), 0.78, "environmental flow decay", 4),
    buildTemporalEdge(recordId, "environmental_flow", item.emotionTone, "modulates", String(environmentalMotion.environmentalFlowPersistence.flowScore), 0.76, "emotion-environment flow", 5),
  ]);

  const temporalEdgeCount =
    motionEdges.length +
    trajectoryEdges.length +
    cameraMomentumEdges.length +
    environmentalFlowEdges.length;

  return Object.freeze({
    ...baseGraph,
    motion_edges: motionEdges,
    trajectory_edges: trajectoryEdges,
    camera_momentum_edges: cameraMomentumEdges,
    environmental_flow_edges: environmentalFlowEdges,
    temporal_total_edge_count: baseGraph.total_edge_count + temporalEdgeCount,
  });
}

function buildTemporalRecord(
  ultraRecord: RealV826UltraDenseCinematicDnaExportRecord,
  item: RealImageAppInputPackageItem,
  motionBridge: RealMotionBridgeSegment,
  subjectTrajectory: RealSubjectTrajectoryGraphFrame,
  cameraMomentum: RealCameraMomentumGrammarFrame,
  environmentalMotion: RealEnvironmentalMotionFieldFrame,
  motionDensityScore: RealMotionDensityScoreFrame
): RealV826TemporalCinematicDnaExportRecord {
  const sequenceGraph = buildTemporalSequenceGraph(
    ultraRecord.id,
    item,
    ultraRecord.sequence_graph,
    motionBridge,
    subjectTrajectory,
    cameraMomentum,
    environmentalMotion
  );

  const temporalEdgeCount =
    sequenceGraph.motion_edges.length +
    sequenceGraph.trajectory_edges.length +
    sequenceGraph.camera_momentum_edges.length +
    sequenceGraph.environmental_flow_edges.length;

  return Object.freeze({
    ...ultraRecord,
    schema_meta: Object.freeze({
      ...ultraRecord.schema_meta,
      latent_engine: "real-frame-temporal-v826",
      perception_mode: "real-mp4-frame-evidence-temporal",
    }),
    sequence_graph: sequenceGraph,
    motion_bridge_timeline: motionBridge,
    subject_trajectory_graph: subjectTrajectory,
    camera_momentum_grammar: cameraMomentum,
    environmental_motion_field: environmentalMotion,
    motion_density_score: motionDensityScore,
    temporal_meta: Object.freeze({
      layer_revision: 1,
      continuity_engine: REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      density_tier: "temporal-cinematic" as const,
      bridge_state_count: motionBridge.intermediateStates.length,
      temporal_edge_count: temporalEdgeCount,
      metadata_only: true as const,
    }),
  });
}

export function buildRealV826TemporalCinematicDnaExportAdapter(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826TemporalCinematicDnaExportAdapter {
  if (cachedRealV826TemporalCinematicDnaExportAdapter !== null) {
    return cachedRealV826TemporalCinematicDnaExportAdapter;
  }

  const ultraRecords = buildRealV826UltraDenseCinematicDnaExportAdapter(realImageAppInputPackage);
  const motionBridgeTimeline = buildRealMotionBridgeTimeline(realImageAppInputPackage);
  const subjectTrajectoryGraph = buildRealSubjectTrajectoryGraph(realImageAppInputPackage);
  const cameraMomentumGrammar = buildRealCameraMomentumGrammar(realImageAppInputPackage);
  const environmentalMotionField = buildRealEnvironmentalMotionField(realImageAppInputPackage);
  const motionDensityScore = buildRealMotionDensityScore(realImageAppInputPackage, {
    motionBridge: motionBridgeTimeline,
    subjectTrajectory: subjectTrajectoryGraph,
    cameraMomentum: cameraMomentumGrammar,
    environmentalMotion: environmentalMotionField,
    projectedTemporalEdgeCountByQueue: Object.freeze({ 0: 24, 1: 24, 2: 24 }),
  });

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const records = Object.freeze(
    ultraRecords.map((ultraRecord, index) => {
      const item = orderedItems[index];
      if (item === undefined) {
        throw new Error("Temporal export item alignment failed");
      }

      const motionBridge = motionBridgeTimeline.bridges.find(
        (bridge) => bridge.fromQueueOrder === item.queueOrder
      );
      const subjectTrajectory = subjectTrajectoryGraph.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );
      const cameraMomentum = cameraMomentumGrammar.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );
      const environmentalMotion = environmentalMotionField.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );
      const frameMotionDensity = motionDensityScore.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );

      if (
        motionBridge === undefined ||
        subjectTrajectory === undefined ||
        cameraMomentum === undefined ||
        environmentalMotion === undefined ||
        frameMotionDensity === undefined
      ) {
        throw new Error(`Temporal layer alignment failed for queueOrder=${item.queueOrder}`);
      }

      return buildTemporalRecord(
        ultraRecord,
        item,
        motionBridge,
        subjectTrajectory,
        cameraMomentum,
        environmentalMotion,
        frameMotionDensity
      );
    })
  );

  cachedRealV826TemporalCinematicDnaExportAdapter = records;
  return records;
}

export function serializeRealV826TemporalCinematicDnaExportAdapter(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): string {
  const orderedRecords = [...adapter]
    .sort((a, b) => a.scene_indexing.v_timestamp_start - b.scene_indexing.v_timestamp_start)
    .map((record) =>
      orderRecord(
        record as unknown as Record<string, unknown>,
        REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER
      )
    );

  return JSON.stringify(orderedRecords, null, 2);
}

export function computeRealV826TemporalCinematicDnaExportAdapterFingerprint(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): string {
  return digestValue(serializeRealV826TemporalCinematicDnaExportAdapter(adapter));
}

export function buildRealV826TemporalCinematicDnaExportDownloadFromAdapter(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): RealV826TemporalCinematicDnaExportDownload {
  return Object.freeze({
    filename: REAL_V826_TEMPORAL_CINEMATIC_DNA_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealV826TemporalCinematicDnaExportAdapter(adapter),
    exportFingerprint: computeRealV826TemporalCinematicDnaExportAdapterFingerprint(adapter),
  });
}

export function buildRealV826TemporalCinematicDnaExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826TemporalCinematicDnaExportDownload {
  return buildRealV826TemporalCinematicDnaExportDownloadFromAdapter(
    buildRealV826TemporalCinematicDnaExportAdapter(realImageAppInputPackage)
  );
}

export function buildRealV826TemporalCinematicDnaExportDownload(): RealV826TemporalCinematicDnaExportDownload {
  if (cachedRealV826TemporalCinematicDnaExportDownload !== null) {
    return cachedRealV826TemporalCinematicDnaExportDownload;
  }

  const download = buildRealV826TemporalCinematicDnaExportDownloadFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealV826TemporalCinematicDnaExportDownload = download;
  return download;
}

export function resetRealV826TemporalCinematicDnaExportAdapterCacheForVerification(): void {
  cachedRealV826TemporalCinematicDnaExportAdapter = null;
  cachedRealV826TemporalCinematicDnaExportDownload = null;
}

export function countTemporalSequenceEdges(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): number {
  return adapter.reduce((sum, record) => sum + record.sequence_graph.temporal_total_edge_count, 0);
}

export function countTemporalMotionEdges(
  adapter: RealV826TemporalCinematicDnaExportAdapter
): number {
  return adapter.reduce(
    (sum, record) =>
      sum +
      record.sequence_graph.motion_edges.length +
      record.sequence_graph.trajectory_edges.length +
      record.sequence_graph.camera_momentum_edges.length +
      record.sequence_graph.environmental_flow_edges.length,
    0
  );
}
