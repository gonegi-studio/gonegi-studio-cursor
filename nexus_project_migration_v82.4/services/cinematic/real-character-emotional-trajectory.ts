import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealCharacterEmotionalBeat = {
  beatId: string;
  beatIndex: number;
  timestampOffsetSeconds: number;
  valence: number;
  arousal: number;
  label: string;
  narrativeFunction: string;
  musicEnergyAlignment: string;
};

export type RealCharacterEmotionalFrameTrajectory = {
  queueOrder: number;
  frameEvidenceId: string;
  timestampSeconds: string;
  dramaFunction: string;
  emotionalEntry: {
    valence: number;
    arousal: number;
    label: string;
    confidence: number;
  };
  emotionalResolve: {
    valence: number;
    arousal: number;
    label: string;
    confidence: number;
  };
  timeline: readonly RealCharacterEmotionalBeat[];
};

export type RealCharacterEmotionalTrajectory = {
  version: "v1";
  trajectoryId: string;
  inputPackageId: string;
  trajectoryVersion: typeof REAL_CHARACTER_EMOTIONAL_TRAJECTORY_KIND_VERSION;
  activeTrajectoryState: string;
  frameCount: typeof REAL_CHARACTER_EMOTIONAL_TRAJECTORY_FRAME_COUNT;
  beatCountPerFrame: typeof REAL_CHARACTER_EMOTIONAL_TRAJECTORY_BEAT_COUNT;
  frames: readonly RealCharacterEmotionalFrameTrajectory[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_VERSION = "v1" as const;
export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_KIND_VERSION =
  "real-character-emotional-trajectory-v1" as const;
export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_ROOT_ID =
  "real-character-emotional-trajectory-gonegi-harbor-25s-v1" as const;
export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_STATE =
  "25s-real-character-emotional-trajectory-metadata-only" as const;
export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_FRAME_COUNT = 3 as const;
export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_BEAT_COUNT = 12 as const;

const FRAME_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    entryValence: 0.68,
    entryArousal: 0.22,
    entryLabel: "nostalgic-calm-entry",
    resolveValence: 0.74,
    resolveArousal: 0.32,
    resolveLabel: "gentle-anticipation",
    beatLabels: Object.freeze([
      "harbor-awakening",
      "wind-greeting",
      "independence-echo",
      "horizon-scan",
      "memory-soften",
      "flight-readiness",
      "town-below-wonder",
      "sky-openness",
      "mentor-distance",
      "broom-trust",
      "coastal-breathe",
      "establish-resolve",
    ] as const),
  }),
  Object.freeze({
    queueOrder: 1,
    entryValence: 0.74,
    entryArousal: 0.32,
    entryLabel: "adventurous-soft-entry",
    resolveValence: 0.7,
    resolveArousal: 0.44,
    resolveLabel: "steady-flow-confidence",
    beatLabels: Object.freeze([
      "bridge-momentum",
      "flight-arc-rise",
      "wind-push-play",
      "town-pass-below",
      "companion-presence",
      "mid-air-balance",
      "curiosity-spark",
      "path-choice",
      "rhythm-hold-steady",
      "distance-comfort",
      "adventure-soften",
      "bridge-resolve",
    ] as const),
  }),
  Object.freeze({
    queueOrder: 2,
    entryValence: 0.7,
    entryArousal: 0.44,
    entryLabel: "peaceful-wonder-entry",
    resolveValence: 0.82,
    resolveArousal: 0.18,
    resolveLabel: "wonder-catharsis",
    beatLabels: Object.freeze([
      "horizon-rest",
      "twilight-soften",
      "flight-slow",
      "ocean-glow",
      "silence-embrace",
      "independence-peace",
      "mentor-memory",
      "harbor-return-gaze",
      "sky-calm",
      "resolve-breathe",
      "wonder-expand",
      "emotional-catharsis",
    ] as const),
  }),
] as const);

const NARRATIVE_FUNCTIONS = Object.freeze([
  "setup",
  "develop",
  "complicate",
  "reflect",
  "intensify",
  "pause",
  "reveal",
  "connect",
  "shift",
  "deepen",
  "release",
  "resolve",
] as const);

let cachedRealCharacterEmotionalTrajectory: RealCharacterEmotionalTrajectory | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveFrameProfile(queueOrder: number) {
  const profile = FRAME_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown character emotional profile for queueOrder=${queueOrder}`);
  }
  return profile;
}

function interpolateValue(start: number, end: number, index: number, total: number): number {
  const ratio = index / Math.max(total - 1, 1);
  return Number((start + (end - start) * ratio).toFixed(4));
}

function buildTimeline(
  item: RealImageAppInputPackageItem,
  profile: (typeof FRAME_PROFILES)[number]
): readonly RealCharacterEmotionalBeat[] {
  const segmentDuration =
    item.queueOrder === 2 ? 4.0 : item.queueOrder === 1 ? 8.5 : 8.5;

  return Object.freeze(
    profile.beatLabels.map((label, index) => {
      const beatId = digestValue(
        [REAL_CHARACTER_EMOTIONAL_TRAJECTORY_KIND_VERSION, item.frameEvidenceId, label].join("|")
      ).slice(0, 24);

      return Object.freeze({
        beatId,
        beatIndex: index,
        timestampOffsetSeconds: Number(((segmentDuration / 11) * index).toFixed(3)),
        valence: interpolateValue(profile.entryValence, profile.resolveValence, index, 12),
        arousal: interpolateValue(profile.entryArousal, profile.resolveArousal, index, 12),
        label,
        narrativeFunction: NARRATIVE_FUNCTIONS[index] ?? "resolve",
        musicEnergyAlignment: item.suggestedMusicEnergy,
      });
    })
  );
}

function buildFrameTrajectory(
  item: RealImageAppInputPackageItem
): RealCharacterEmotionalFrameTrajectory {
  const profile = resolveFrameProfile(item.queueOrder);

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    timestampSeconds: item.timestampSeconds,
    dramaFunction: item.dramaFunction,
    emotionalEntry: Object.freeze({
      valence: profile.entryValence,
      arousal: profile.entryArousal,
      label: profile.entryLabel,
      confidence: 0.9,
    }),
    emotionalResolve: Object.freeze({
      valence: profile.resolveValence,
      arousal: profile.resolveArousal,
      label: profile.resolveLabel,
      confidence: 0.92,
    }),
    timeline: buildTimeline(item, profile),
  });
}

export function buildRealCharacterEmotionalTrajectory(
  realImageAppInputPackage: RealImageAppInputPackage
): RealCharacterEmotionalTrajectory {
  if (cachedRealCharacterEmotionalTrajectory !== null) {
    return cachedRealCharacterEmotionalTrajectory;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real character emotional trajectory requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real character emotional trajectory requires three input package items");
  }

  const trajectoryId = digestValue(
    [
      REAL_CHARACTER_EMOTIONAL_TRAJECTORY_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const trajectory = Object.freeze({
    version: REAL_CHARACTER_EMOTIONAL_TRAJECTORY_VERSION,
    trajectoryId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    trajectoryVersion: REAL_CHARACTER_EMOTIONAL_TRAJECTORY_KIND_VERSION,
    activeTrajectoryState: REAL_CHARACTER_EMOTIONAL_TRAJECTORY_STATE,
    frameCount: REAL_CHARACTER_EMOTIONAL_TRAJECTORY_FRAME_COUNT,
    beatCountPerFrame: REAL_CHARACTER_EMOTIONAL_TRAJECTORY_BEAT_COUNT,
    frames: Object.freeze(orderedItems.map((item) => buildFrameTrajectory(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealCharacterEmotionalTrajectory = trajectory;
  return trajectory;
}

export function computeRealCharacterEmotionalTrajectoryFingerprint(
  trajectory: RealCharacterEmotionalTrajectory
): string {
  return digestValue(JSON.stringify(trajectory));
}

export function resetRealCharacterEmotionalTrajectoryCacheForVerification(): void {
  cachedRealCharacterEmotionalTrajectory = null;
}

export function resolveRealCharacterEmotionalFrameForQueue(
  trajectory: RealCharacterEmotionalTrajectory,
  queueOrder: number
): RealCharacterEmotionalFrameTrajectory | null {
  return trajectory.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
