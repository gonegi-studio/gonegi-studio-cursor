import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealCameraGrammarEvolutionStage = {
  queueOrder: number;
  frameEvidenceId: string;
  lensTransition: {
    fromFocalMm: number;
    toFocalMm: number;
    transitionType: string;
    durationSeconds: number;
    focusPullIntensity: number;
  };
  framingIntent: {
    intent: string;
    shiftVector: readonly [number, number];
    compositionDelta: number;
    headroomRatio: number;
    leadSpaceRatio: number;
  };
  cinematicDistance: {
    entryDistanceMeters: number;
    exitDistanceMeters: number;
    distanceCurve: readonly number[];
    subjectScaleRatio: number;
  };
};

export type RealCameraGrammarEvolution = {
  version: "v1";
  evolutionId: string;
  inputPackageId: string;
  evolutionVersion: typeof REAL_CAMERA_GRAMMAR_EVOLUTION_KIND_VERSION;
  activeEvolutionState: string;
  stageCount: typeof REAL_CAMERA_GRAMMAR_EVOLUTION_STAGE_COUNT;
  stages: readonly RealCameraGrammarEvolutionStage[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_CAMERA_GRAMMAR_EVOLUTION_VERSION = "v1" as const;
export const REAL_CAMERA_GRAMMAR_EVOLUTION_KIND_VERSION =
  "real-camera-grammar-evolution-v1" as const;
export const REAL_CAMERA_GRAMMAR_EVOLUTION_ROOT_ID =
  "real-camera-grammar-evolution-gonegi-harbor-25s-v1" as const;
export const REAL_CAMERA_GRAMMAR_EVOLUTION_STATE =
  "25s-real-camera-grammar-evolution-metadata-only" as const;
export const REAL_CAMERA_GRAMMAR_EVOLUTION_STAGE_COUNT = 3 as const;
export const REAL_CAMERA_GRAMMAR_EVOLUTION_DISTANCE_CURVE_LENGTH = 12 as const;

const STAGE_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    fromFocalMm: 24,
    toFocalMm: 35,
    transitionType: "establish-wide-pull",
    durationSeconds: 8.5,
    focusPullIntensity: 0.18,
    intent: "harbor-establishment-wide",
    compositionDelta: 0.22,
    headroomRatio: 0.38,
    leadSpaceRatio: 0.42,
    entryDistanceMeters: 18,
    exitDistanceMeters: 14,
    subjectScaleRatio: 0.32,
  }),
  Object.freeze({
    queueOrder: 1,
    fromFocalMm: 35,
    toFocalMm: 70,
    transitionType: "bridge-tracking-push",
    durationSeconds: 8.5,
    focusPullIntensity: 0.32,
    intent: "flight-path-tracking-mid",
    compositionDelta: 0.38,
    headroomRatio: 0.28,
    leadSpaceRatio: 0.52,
    entryDistanceMeters: 12,
    exitDistanceMeters: 9,
    subjectScaleRatio: 0.48,
  }),
  Object.freeze({
    queueOrder: 2,
    fromFocalMm: 70,
    toFocalMm: 85,
    transitionType: "resolve-contemplative-hold",
    durationSeconds: 4.0,
    focusPullIntensity: 0.12,
    intent: "wonder-resolve-wide-hold",
    compositionDelta: 0.14,
    headroomRatio: 0.44,
    leadSpaceRatio: 0.36,
    entryDistanceMeters: 16,
    exitDistanceMeters: 20,
    subjectScaleRatio: 0.28,
  }),
] as const);

let cachedRealCameraGrammarEvolution: RealCameraGrammarEvolution | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildDistanceCurve(seed: string): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length: REAL_CAMERA_GRAMMAR_EVOLUTION_DISTANCE_CURVE_LENGTH }, (_, index) =>
      Number(((bytes[index % bytes.length] ?? 0) / 255).toFixed(6))
    )
  );
}

function buildShiftVector(item: RealImageAppInputPackageItem): readonly [number, number] {
  const bytes = crypto.createHash("sha256").update(`${item.frameEvidenceId}|shift`).digest();
  return Object.freeze([
    Number(((bytes[0] ?? 0) / 255).toFixed(4)),
    Number(((bytes[1] ?? 0) / 255).toFixed(4)),
  ] as const);
}

function resolveStageProfile(queueOrder: number) {
  const profile = STAGE_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown camera grammar profile for queueOrder=${queueOrder}`);
  }
  return profile;
}

function buildStage(item: RealImageAppInputPackageItem): RealCameraGrammarEvolutionStage {
  const profile = resolveStageProfile(item.queueOrder);

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    lensTransition: Object.freeze({
      fromFocalMm: profile.fromFocalMm,
      toFocalMm: profile.toFocalMm,
      transitionType: profile.transitionType,
      durationSeconds: profile.durationSeconds,
      focusPullIntensity: profile.focusPullIntensity,
    }),
    framingIntent: Object.freeze({
      intent: profile.intent,
      shiftVector: buildShiftVector(item),
      compositionDelta: profile.compositionDelta,
      headroomRatio: profile.headroomRatio,
      leadSpaceRatio: profile.leadSpaceRatio,
    }),
    cinematicDistance: Object.freeze({
      entryDistanceMeters: profile.entryDistanceMeters,
      exitDistanceMeters: profile.exitDistanceMeters,
      distanceCurve: buildDistanceCurve(
        [REAL_CAMERA_GRAMMAR_EVOLUTION_KIND_VERSION, item.frameEvidenceId, "distance"].join("|")
      ),
      subjectScaleRatio: profile.subjectScaleRatio,
    }),
  });
}

export function buildRealCameraGrammarEvolution(
  realImageAppInputPackage: RealImageAppInputPackage
): RealCameraGrammarEvolution {
  if (cachedRealCameraGrammarEvolution !== null) {
    return cachedRealCameraGrammarEvolution;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real camera grammar evolution requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real camera grammar evolution requires three input package items");
  }

  const evolutionId = digestValue(
    [
      REAL_CAMERA_GRAMMAR_EVOLUTION_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const evolution = Object.freeze({
    version: REAL_CAMERA_GRAMMAR_EVOLUTION_VERSION,
    evolutionId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    evolutionVersion: REAL_CAMERA_GRAMMAR_EVOLUTION_KIND_VERSION,
    activeEvolutionState: REAL_CAMERA_GRAMMAR_EVOLUTION_STATE,
    stageCount: REAL_CAMERA_GRAMMAR_EVOLUTION_STAGE_COUNT,
    stages: Object.freeze(orderedItems.map((item) => buildStage(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealCameraGrammarEvolution = evolution;
  return evolution;
}

export function computeRealCameraGrammarEvolutionFingerprint(
  evolution: RealCameraGrammarEvolution
): string {
  return digestValue(JSON.stringify(evolution));
}

export function resetRealCameraGrammarEvolutionCacheForVerification(): void {
  cachedRealCameraGrammarEvolution = null;
}

export function resolveRealCameraGrammarStageForQueue(
  evolution: RealCameraGrammarEvolution,
  queueOrder: number
): RealCameraGrammarEvolutionStage | null {
  return evolution.stages.find((stage) => stage.queueOrder === queueOrder) ?? null;
}
