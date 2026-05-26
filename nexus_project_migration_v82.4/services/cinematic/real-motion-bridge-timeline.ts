import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealMotionBridgeState = {
  stateId: string;
  timestampSeconds: number;
  bridgeIndex: number;
  continuityPhase: string;
  motionDensity: number;
  velocityScale: number;
  emotionalInterpolation: number;
  screenDirectionDegrees: number;
  metadataOnly: true;
};

export type RealMotionBridgeSegment = {
  bridgeId: string;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromTimestampSeconds: number;
  toTimestampSeconds: number;
  intermediateStates: readonly RealMotionBridgeState[];
};

export type RealMotionBridgeTimeline = {
  version: "v1";
  timelineId: string;
  inputPackageId: string;
  timelineVersion: typeof REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION;
  activeTimelineState: string;
  bridgeCount: typeof REAL_MOTION_BRIDGE_TIMELINE_BRIDGE_COUNT;
  bridges: readonly RealMotionBridgeSegment[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_MOTION_BRIDGE_TIMELINE_VERSION = "v1" as const;
export const REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION = "real-motion-bridge-timeline-v1" as const;
export const REAL_MOTION_BRIDGE_TIMELINE_ROOT_ID =
  "real-motion-bridge-timeline-gonegi-harbor-25s-v1" as const;
export const REAL_MOTION_BRIDGE_TIMELINE_STATE =
  "25s-real-motion-bridge-timeline-metadata-only" as const;
export const REAL_MOTION_BRIDGE_TIMELINE_BRIDGE_COUNT = 3 as const;

const BRIDGE_DEFINITIONS = Object.freeze([
  Object.freeze({
    fromQueueOrder: 0,
    toQueueOrder: 1,
    timestamps: Object.freeze([4.0, 6.0, 8.0, 10.0, 12.5] as const),
    continuityPhases: Object.freeze([
      "establish-entry",
      "gentle-rise",
      "mid-bridge-flow",
      "approach-hold",
      "bridge-anchor",
    ] as const),
  }),
  Object.freeze({
    fromQueueOrder: 1,
    toQueueOrder: 2,
    timestamps: Object.freeze([12.5, 15.0, 17.5, 19.25, 21.0] as const),
    continuityPhases: Object.freeze([
      "bridge-entry",
      "tracking-flow",
      "mid-flight-sustain",
      "approach-resolve",
      "resolve-anchor",
    ] as const),
  }),
  Object.freeze({
    fromQueueOrder: 2,
    toQueueOrder: 3,
    timestamps: Object.freeze([21.0, 22.0, 23.0, 24.0, 25.0] as const),
    continuityPhases: Object.freeze([
      "resolve-entry",
      "wonder-soften",
      "twilight-hold",
      "release-breathe",
      "terminal-rest",
    ] as const),
  }),
] as const);

let cachedRealMotionBridgeTimeline: RealMotionBridgeTimeline | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildBridgeStates(
  bridgeDef: (typeof BRIDGE_DEFINITIONS)[number],
  fromItem: RealImageAppInputPackageItem,
  toItem: RealImageAppInputPackageItem | null
): readonly RealMotionBridgeState[] {
  const startMotion = 0.18 + bridgeDef.fromQueueOrder * 0.12;
  const endMotion = toItem === null ? 0.14 : 0.22 + bridgeDef.fromQueueOrder * 0.1;

  return Object.freeze(
    bridgeDef.timestamps.map((timestamp, index) => {
      const ratio = index / Math.max(bridgeDef.timestamps.length - 1, 1);
      const stateId = digestValue(
        [
          REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION,
          fromItem.frameEvidenceId,
          String(timestamp),
          bridgeDef.continuityPhases[index] ?? "bridge",
        ].join("|")
      ).slice(0, 24);

      return Object.freeze({
        stateId,
        timestampSeconds: timestamp,
        bridgeIndex: index,
        continuityPhase: bridgeDef.continuityPhases[index] ?? "bridge",
        motionDensity: Number((startMotion + (endMotion - startMotion) * ratio).toFixed(4)),
        velocityScale: Number((0.08 + ratio * 0.34).toFixed(4)),
        emotionalInterpolation: Number((0.62 + ratio * 0.28).toFixed(4)),
        screenDirectionDegrees: Number((42 + index * 18 + bridgeDef.fromQueueOrder * 6).toFixed(2)),
        metadataOnly: true as const,
      });
    })
  );
}

function buildBridge(
  bridgeDef: (typeof BRIDGE_DEFINITIONS)[number],
  orderedItems: readonly RealImageAppInputPackageItem[]
): RealMotionBridgeSegment {
  const fromItem = orderedItems.find((item) => item.queueOrder === bridgeDef.fromQueueOrder);
  const toItem = orderedItems.find((item) => item.queueOrder === bridgeDef.toQueueOrder);

  if (fromItem === undefined) {
    throw new Error(`Motion bridge missing from item queueOrder=${bridgeDef.fromQueueOrder}`);
  }

  const fromTimestamp = bridgeDef.timestamps[0] ?? Number.parseFloat(fromItem.timestampSeconds);
  const toTimestamp =
    bridgeDef.timestamps[bridgeDef.timestamps.length - 1] ??
    (toItem ? Number.parseFloat(toItem.timestampSeconds) : 25.0);

  return Object.freeze({
    bridgeId: digestValue(
      [
        REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION,
        String(bridgeDef.fromQueueOrder),
        String(bridgeDef.toQueueOrder),
        fromItem.frameEvidenceId,
      ].join("|")
    ).slice(0, 24),
    fromQueueOrder: bridgeDef.fromQueueOrder,
    toQueueOrder: bridgeDef.toQueueOrder,
    fromTimestampSeconds: fromTimestamp,
    toTimestampSeconds: toTimestamp,
    intermediateStates: buildBridgeStates(bridgeDef, fromItem, toItem ?? null),
  });
}

export function buildRealMotionBridgeTimeline(
  realImageAppInputPackage: RealImageAppInputPackage
): RealMotionBridgeTimeline {
  if (cachedRealMotionBridgeTimeline !== null) {
    return cachedRealMotionBridgeTimeline;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real motion bridge timeline requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real motion bridge timeline requires three input package items");
  }

  const timelineId = digestValue(
    [
      REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const timeline = Object.freeze({
    version: REAL_MOTION_BRIDGE_TIMELINE_VERSION,
    timelineId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    timelineVersion: REAL_MOTION_BRIDGE_TIMELINE_KIND_VERSION,
    activeTimelineState: REAL_MOTION_BRIDGE_TIMELINE_STATE,
    bridgeCount: REAL_MOTION_BRIDGE_TIMELINE_BRIDGE_COUNT,
    bridges: Object.freeze(BRIDGE_DEFINITIONS.map((bridgeDef) => buildBridge(bridgeDef, orderedItems))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealMotionBridgeTimeline = timeline;
  return timeline;
}

export function computeRealMotionBridgeTimelineFingerprint(
  timeline: RealMotionBridgeTimeline
): string {
  return digestValue(JSON.stringify(timeline));
}

export function resetRealMotionBridgeTimelineCacheForVerification(): void {
  cachedRealMotionBridgeTimeline = null;
}

export function resolveRealMotionBridgeForQueue(
  timeline: RealMotionBridgeTimeline,
  queueOrder: number
): RealMotionBridgeSegment | null {
  return timeline.bridges.find((bridge) => bridge.fromQueueOrder === queueOrder) ?? null;
}
