import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealSubjectTrajectoryGraphFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  timestampSeconds: string;
  velocityVector: readonly [number, number, number];
  movementInheritance: number;
  screenDirectionContinuity: {
    entryDirectionDegrees: number;
    exitDirectionDegrees: number;
    continuityScore: number;
  };
  gazeTrajectory: {
    startPoint: readonly [number, number];
    endPoint: readonly [number, number];
    gazeCurve: readonly number[];
    focusLock: number;
  };
  motionPersistence: {
    persistenceScore: number;
    decayRate: number;
    carryForwardVector: readonly [number, number];
  };
};

export type RealSubjectTrajectoryGraph = {
  version: "v1";
  graphId: string;
  inputPackageId: string;
  graphVersion: typeof REAL_SUBJECT_TRAJECTORY_GRAPH_KIND_VERSION;
  activeGraphState: string;
  frameCount: typeof REAL_SUBJECT_TRAJECTORY_GRAPH_FRAME_COUNT;
  frames: readonly RealSubjectTrajectoryGraphFrame[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_SUBJECT_TRAJECTORY_GRAPH_VERSION = "v1" as const;
export const REAL_SUBJECT_TRAJECTORY_GRAPH_KIND_VERSION =
  "real-subject-trajectory-graph-v1" as const;
export const REAL_SUBJECT_TRAJECTORY_GRAPH_ROOT_ID =
  "real-subject-trajectory-graph-gonegi-harbor-25s-v1" as const;
export const REAL_SUBJECT_TRAJECTORY_GRAPH_STATE =
  "25s-real-subject-trajectory-graph-metadata-only" as const;
export const REAL_SUBJECT_TRAJECTORY_GRAPH_FRAME_COUNT = 3 as const;
export const REAL_SUBJECT_TRAJECTORY_GAZE_CURVE_LENGTH = 12 as const;

const FRAME_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    velocity: Object.freeze([0.08, 0.12, 0.04] as const),
    movementInheritance: 0.18,
    entryDirection: 38,
    exitDirection: 52,
    persistenceScore: 0.72,
    decayRate: 0.08,
    carryForward: Object.freeze([0.42, 0.18] as const),
  }),
  Object.freeze({
    queueOrder: 1,
    velocity: Object.freeze([0.22, 0.18, 0.06] as const),
    movementInheritance: 0.42,
    entryDirection: 52,
    exitDirection: 64,
    persistenceScore: 0.84,
    decayRate: 0.12,
    carryForward: Object.freeze([0.58, 0.24] as const),
  }),
  Object.freeze({
    queueOrder: 2,
    velocity: Object.freeze([0.06, 0.08, 0.02] as const),
    movementInheritance: 0.08,
    entryDirection: 64,
    exitDirection: 48,
    persistenceScore: 0.92,
    decayRate: 0.22,
    carryForward: Object.freeze([0.32, 0.12] as const),
  }),
] as const);

let cachedRealSubjectTrajectoryGraph: RealSubjectTrajectoryGraph | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildGazeCurve(seed: string): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length: REAL_SUBJECT_TRAJECTORY_GAZE_CURVE_LENGTH }, (_, index) =>
      Number(((bytes[index % bytes.length] ?? 0) / 255).toFixed(6))
    )
  );
}

function buildGazePoints(
  item: RealImageAppInputPackageItem,
  profile: (typeof FRAME_PROFILES)[number]
): { start: readonly [number, number]; end: readonly [number, number] } {
  const bytes = crypto.createHash("sha256").update(`${item.frameEvidenceId}|gaze`).digest();
  return {
    start: Object.freeze([
      Number((0.38 + (bytes[0] ?? 0) / 1024).toFixed(4)),
      Number((0.42 + (bytes[1] ?? 0) / 1024).toFixed(4)),
    ] as const),
    end: Object.freeze([
      Number((0.52 + profile.movementInheritance * 0.2).toFixed(4)),
      Number((0.48 + profile.persistenceScore * 0.1).toFixed(4)),
    ] as const),
  };
}

function buildFrame(item: RealImageAppInputPackageItem): RealSubjectTrajectoryGraphFrame {
  const profile = FRAME_PROFILES.find((entry) => entry.queueOrder === item.queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown subject trajectory profile for queueOrder=${item.queueOrder}`);
  }

  const gazePoints = buildGazePoints(item, profile);

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    timestampSeconds: item.timestampSeconds,
    velocityVector: profile.velocity,
    movementInheritance: profile.movementInheritance,
    screenDirectionContinuity: Object.freeze({
      entryDirectionDegrees: profile.entryDirection,
      exitDirectionDegrees: profile.exitDirection,
      continuityScore: Number(
        (1 - Math.abs(profile.exitDirection - profile.entryDirection) / 180).toFixed(4)
      ),
    }),
    gazeTrajectory: Object.freeze({
      startPoint: gazePoints.start,
      endPoint: gazePoints.end,
      gazeCurve: buildGazeCurve(`${item.frameEvidenceId}|gaze-curve`),
      focusLock: Number((0.78 + profile.persistenceScore * 0.18).toFixed(4)),
    }),
    motionPersistence: Object.freeze({
      persistenceScore: profile.persistenceScore,
      decayRate: profile.decayRate,
      carryForwardVector: profile.carryForward,
    }),
  });
}

export function buildRealSubjectTrajectoryGraph(
  realImageAppInputPackage: RealImageAppInputPackage
): RealSubjectTrajectoryGraph {
  if (cachedRealSubjectTrajectoryGraph !== null) {
    return cachedRealSubjectTrajectoryGraph;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real subject trajectory graph requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real subject trajectory graph requires three input package items");
  }

  const graphId = digestValue(
    [
      REAL_SUBJECT_TRAJECTORY_GRAPH_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const graph = Object.freeze({
    version: REAL_SUBJECT_TRAJECTORY_GRAPH_VERSION,
    graphId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    graphVersion: REAL_SUBJECT_TRAJECTORY_GRAPH_KIND_VERSION,
    activeGraphState: REAL_SUBJECT_TRAJECTORY_GRAPH_STATE,
    frameCount: REAL_SUBJECT_TRAJECTORY_GRAPH_FRAME_COUNT,
    frames: Object.freeze(orderedItems.map((item) => buildFrame(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealSubjectTrajectoryGraph = graph;
  return graph;
}

export function computeRealSubjectTrajectoryGraphFingerprint(
  graph: RealSubjectTrajectoryGraph
): string {
  return digestValue(JSON.stringify(graph));
}

export function resetRealSubjectTrajectoryGraphCacheForVerification(): void {
  cachedRealSubjectTrajectoryGraph = null;
}

export function resolveRealSubjectTrajectoryFrameForQueue(
  graph: RealSubjectTrajectoryGraph,
  queueOrder: number
): RealSubjectTrajectoryGraphFrame | null {
  return graph.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
