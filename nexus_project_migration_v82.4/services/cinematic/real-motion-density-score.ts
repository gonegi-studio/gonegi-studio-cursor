import crypto from "crypto";
import type { RealCameraMomentumGrammar } from "./real-camera-momentum-grammar.ts";
import type { RealEnvironmentalMotionField } from "./real-environmental-motion-field.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";
import type { RealMotionBridgeTimeline } from "./real-motion-bridge-timeline.ts";
import { buildRealCameraMomentumGrammar } from "./real-camera-momentum-grammar.ts";
import { buildRealEnvironmentalMotionField } from "./real-environmental-motion-field.ts";
import { buildRealMotionBridgeTimeline } from "./real-motion-bridge-timeline.ts";
import type { RealSubjectTrajectoryGraph } from "./real-subject-trajectory-graph.ts";
import { buildRealSubjectTrajectoryGraph } from "./real-subject-trajectory-graph.ts";

export type RealMotionDensityScoreFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  temporalMotionDensity: number;
  cinematicFlowDensity: number;
  trajectoryConsistency: number;
  environmentalContinuity: number;
  overallTemporalDensityScore: number;
};

export type RealMotionDensityScore = {
  version: "v1";
  scoreId: string;
  inputPackageId: string;
  scoreVersion: typeof REAL_MOTION_DENSITY_SCORE_KIND_VERSION;
  activeScoreState: string;
  frameCount: typeof REAL_MOTION_DENSITY_SCORE_FRAME_COUNT;
  frames: readonly RealMotionDensityScoreFrame[];
  datasetOverallTemporalDensityScore: number;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_MOTION_DENSITY_SCORE_VERSION = "v1" as const;
export const REAL_MOTION_DENSITY_SCORE_KIND_VERSION = "real-motion-density-score-v1" as const;
export const REAL_MOTION_DENSITY_SCORE_ROOT_ID =
  "real-motion-density-score-gonegi-harbor-25s-v1" as const;
export const REAL_MOTION_DENSITY_SCORE_STATE =
  "25s-real-motion-density-score-metadata-only" as const;
export const REAL_MOTION_DENSITY_SCORE_FRAME_COUNT = 3 as const;

let cachedRealMotionDensityScore: RealMotionDensityScore | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

function computeFrameScore(
  item: RealImageAppInputPackageItem,
  motionBridge: RealMotionBridgeTimeline,
  subjectTrajectory: RealSubjectTrajectoryGraph,
  cameraMomentum: RealCameraMomentumGrammar,
  environmentalMotion: RealEnvironmentalMotionField,
  projectedTemporalEdgeCount: number
): RealMotionDensityScoreFrame {
  const bridge = motionBridge.bridges.find((entry) => entry.fromQueueOrder === item.queueOrder);
  const trajectory = subjectTrajectory.frames.find((frame) => frame.queueOrder === item.queueOrder);
  const momentum = cameraMomentum.frames.find((frame) => frame.queueOrder === item.queueOrder);
  const environment = environmentalMotion.frames.find((frame) => frame.queueOrder === item.queueOrder);

  const bridgeMotion =
    bridge === undefined
      ? 0
      : bridge.intermediateStates.reduce((sum, state) => sum + state.motionDensity, 0) /
        bridge.intermediateStates.length;

  const temporalMotionDensity = clampScore(
    bridgeMotion * 0.4 +
      (trajectory?.motionPersistence.persistenceScore ?? 0) * 0.35 +
      (momentum?.movementMomentum ?? 0) * 0.25
  );
  const cinematicFlowDensity = clampScore(
    (momentum?.cinematicInertia ?? 0) * 0.35 +
      (momentum?.movementMomentum ?? 0) * 0.35 +
      (projectedTemporalEdgeCount / 20) * 0.3
  );
  const trajectoryConsistency = clampScore(
    (trajectory?.screenDirectionContinuity.continuityScore ?? 0) * 0.45 +
      (trajectory?.motionPersistence.persistenceScore ?? 0) * 0.35 +
      (trajectory?.gazeTrajectory.focusLock ?? 0) * 0.2
  );
  const environmentalContinuity = clampScore(
    (environment?.environmentalFlowPersistence.flowScore ?? 0) * 0.45 +
      (environment?.windDirection.continuityScore ?? 0) * 0.3 +
      (environment?.atmosphericParticleContinuity.persistenceScore ?? 0) * 0.25
  );
  const overallTemporalDensityScore = clampScore(
    temporalMotionDensity * 0.28 +
      cinematicFlowDensity * 0.24 +
      trajectoryConsistency * 0.24 +
      environmentalContinuity * 0.24
  );

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    temporalMotionDensity,
    cinematicFlowDensity,
    trajectoryConsistency,
    environmentalContinuity,
    overallTemporalDensityScore,
  });
}

export function buildRealMotionDensityScore(
  realImageAppInputPackage: RealImageAppInputPackage,
  options?: {
    motionBridge?: RealMotionBridgeTimeline;
    subjectTrajectory?: RealSubjectTrajectoryGraph;
    cameraMomentum?: RealCameraMomentumGrammar;
    environmentalMotion?: RealEnvironmentalMotionField;
    projectedTemporalEdgeCountByQueue?: Readonly<Record<number, number>>;
  }
): RealMotionDensityScore {
  if (cachedRealMotionDensityScore !== null && options === undefined) {
    return cachedRealMotionDensityScore;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real motion density score requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real motion density score requires three input package items");
  }

  const motionBridge = options?.motionBridge ?? buildRealMotionBridgeTimeline(realImageAppInputPackage);
  const subjectTrajectory =
    options?.subjectTrajectory ?? buildRealSubjectTrajectoryGraph(realImageAppInputPackage);
  const cameraMomentum =
    options?.cameraMomentum ?? buildRealCameraMomentumGrammar(realImageAppInputPackage);
  const environmentalMotion =
    options?.environmentalMotion ?? buildRealEnvironmentalMotionField(realImageAppInputPackage);

  const frames = Object.freeze(
    orderedItems.map((item) =>
      computeFrameScore(
        item,
        motionBridge,
        subjectTrajectory,
        cameraMomentum,
        environmentalMotion,
        options?.projectedTemporalEdgeCountByQueue?.[item.queueOrder] ?? 20
      )
    )
  );

  const datasetOverallTemporalDensityScore = clampScore(
    frames.reduce((sum, frame) => sum + frame.overallTemporalDensityScore, 0) / frames.length
  );

  const scoreId = digestValue(
    [
      REAL_MOTION_DENSITY_SCORE_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      frames.map((frame) => frame.overallTemporalDensityScore).join(","),
    ].join("|")
  );

  const score = Object.freeze({
    version: REAL_MOTION_DENSITY_SCORE_VERSION,
    scoreId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    scoreVersion: REAL_MOTION_DENSITY_SCORE_KIND_VERSION,
    activeScoreState: REAL_MOTION_DENSITY_SCORE_STATE,
    frameCount: REAL_MOTION_DENSITY_SCORE_FRAME_COUNT,
    frames,
    datasetOverallTemporalDensityScore,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  if (options === undefined) {
    cachedRealMotionDensityScore = score;
  }

  return score;
}

export function computeRealMotionDensityScoreFingerprint(score: RealMotionDensityScore): string {
  return digestValue(JSON.stringify(score));
}

export function resetRealMotionDensityScoreCacheForVerification(): void {
  cachedRealMotionDensityScore = null;
}

export function resolveRealMotionDensityScoreForQueue(
  score: RealMotionDensityScore,
  queueOrder: number
): RealMotionDensityScoreFrame | null {
  return score.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
